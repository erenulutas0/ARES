from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import paho.mqtt.client as mqtt
import json
import threading
import asyncio
from datetime import datetime
from .urgency_engine import calculate_urgency_score
from .building_vulnerability import calculate_building_vulnerability
from src.edge.local_alarm import evaluate_local_alarm
import os
import joblib

app = FastAPI(title="A-RES Central Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

dashboard_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dashboard"))
if os.path.isdir(dashboard_dir):
    app.mount("/dashboard", StaticFiles(directory=dashboard_dir, html=True), name="dashboard")

authority_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "authority"))

# In-memory store
building_states = {}

# Load ML Model
ml_model = None
try:
    model_path = os.path.join(os.path.dirname(__file__), 'urgency_model.pkl')
    if os.getenv("ARES_ENABLE_LEGACY_ML", "0") == "1" and os.path.exists(model_path):
        ml_model = joblib.load(model_path)
        print("✅ ML Model loaded successfully!")
    else:
        print("⚠️ ML Model not found. Running in Expert-Only mode.")
except Exception as e:
    print(f"Failed to load ML model: {e}")

MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_TOPICS = [
    ("ares/building/+/sensor", 1),
    ("ares/building/+/occupancy", 1)
]

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        topic = msg.topic
        building_id = payload.get("building_id")
        if not building_id: return

        if building_id not in building_states:
            building_states[building_id] = {
                "building_id": building_id,
                "occupancy": 0, "pga": 0.0, "vulnerability": 0.5,
                "building_age": None, "structural_type": "unknown", "floors": None,
                "adjacency_type": "unknown", "soil_risk": "unknown", "seismic_hazard": "unknown",
                "vulnerability_components": {},
                "smoke_detected": False, "gas_detected": False, "temperature": 22.0,
                "lat": 0.0, "lon": 0.0, "type": "Unknown",
                "ai_score": 0,
                "local_alarm_triggered": False,
                "local_alarm_level": "NORMAL",
                "local_alarm_reasons": [],
                "local_alarm_action": "Continue monitoring."
            }

        state = building_states[building_id]

        if "sensor" in topic:
            state["pga"] = payload.get("pga", state["pga"])
            state["smoke_detected"] = payload.get("smoke_detected", state["smoke_detected"])
            state["gas_detected"] = payload.get("gas_detected", state["gas_detected"])
            state["temperature"] = payload.get("temperature", state["temperature"])
            state["lat"] = payload.get("lat", state["lat"])
            state["lon"] = payload.get("lon", state["lon"])
            state["type"] = payload.get("type", state["type"])
            state["building_age"] = payload.get("building_age", state["building_age"])
            state["structural_type"] = payload.get("structural_type", state["structural_type"])
            state["floors"] = payload.get("floors", state["floors"])
            state["adjacency_type"] = payload.get("adjacency_type", state["adjacency_type"])
            state["soil_risk"] = payload.get("soil_risk", state["soil_risk"])
            state["seismic_hazard"] = payload.get("seismic_hazard", state["seismic_hazard"])

            if "vulnerability" in payload:
                state["vulnerability"] = payload["vulnerability"]
            else:
                vuln = calculate_building_vulnerability(
                    building_age=state["building_age"],
                    structural_type=state["structural_type"],
                    floors=state["floors"],
                    adjacency_type=state["adjacency_type"],
                    soil_risk=state["soil_risk"],
                    seismic_hazard=state["seismic_hazard"],
                )
                state["vulnerability"] = vuln["index"]
                state["vulnerability_components"] = vuln["components"]
        elif "occupancy" in topic:
            state["occupancy"] = payload.get("current_count", state["occupancy"])

        # 1. Calculate Rule-Based Score
        res = calculate_urgency_score(
            state["pga"], state["vulnerability"], state["occupancy"],
            smoke_detected=state["smoke_detected"],
            gas_detected=state["gas_detected"]
        )
        
        # 2. Calculate ML Prediction (if available)
        ai_score = res["score"] # Fallback
        if ml_model is not None:
            import pandas as pd
            features = pd.DataFrame([{
                'pga': state["pga"],
                'vulnerability': state["vulnerability"],
                'occupancy': state["occupancy"],
                'smoke_detected': int(state["smoke_detected"]),
                'gas_detected': int(state["gas_detected"]),
                'fire_detected': int(state["smoke_detected"] or state["gas_detected"])
            }])
            ai_score = int(ml_model.predict(features)[0])

        local_alarm = evaluate_local_alarm(
            pga=state["pga"],
            smoke_detected=state["smoke_detected"],
            gas_detected=state["gas_detected"],
            temperature=state["temperature"],
        )
        
        state.update({
            "urgency_score": res["score"],
            "ai_score": ai_score,
            "priority": res["priority"],
            "score_confidence": res["confidence"],
            "score_breakdown": res["breakdown"],
            "local_alarm_triggered": local_alarm.trigger,
            "local_alarm_level": local_alarm.level,
            "local_alarm_reasons": local_alarm.reasons,
            "local_alarm_action": local_alarm.recommended_action,
            "last_update": datetime.utcnow().isoformat() + "Z"
        })

    except Exception as e:
        print(f"Error in on_message: {e}")

def mqtt_thread_func():
    client = mqtt.Client()
    client.on_message = on_message
    client.connect(MQTT_BROKER, 1883, 60)
    for topic, qos in MQTT_TOPICS:
        client.subscribe(topic, qos)
    client.loop_forever()

@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=mqtt_thread_func, daemon=True)
    thread.start()

@app.get("/")
def read_root():
    return {"message": "A-RES Central Server is running"}

@app.get("/buildings")
def get_buildings():
    return list(building_states.values())

def choose_authority_unit(state):
    if state.get("gas_detected") or state.get("smoke_detected") or state.get("fire_detected"):
        return "Fire Department / Gas Response"
    if state.get("priority") in {"HIGH", "CRITICAL"} and state.get("occupancy", 0) > 0:
        return "AFAD Search and Rescue"
    if state.get("vulnerability", 0) >= 0.70:
        return "Municipal Structural Assessment"
    return "Monitoring Desk"

@app.get("/authority/alerts")
def get_authority_alerts():
    buildings = sorted(
        building_states.values(),
        key=lambda x: x.get("urgency_score", 0),
        reverse=True,
    )
    return [
        {
            "building_id": b.get("building_id"),
            "type": b.get("type"),
            "priority": b.get("priority"),
            "urgency_score": b.get("urgency_score", 0),
            "score_confidence": b.get("score_confidence", 1.0),
            "score_breakdown": b.get("score_breakdown", {}),
            "occupancy": b.get("occupancy", 0),
            "vulnerability": b.get("vulnerability", 0),
            "smoke_detected": b.get("smoke_detected", False),
            "gas_detected": b.get("gas_detected", False),
            "local_alarm_level": b.get("local_alarm_level", "NORMAL"),
            "local_alarm_reasons": b.get("local_alarm_reasons", []),
            "authority_unit": choose_authority_unit(b),
            "recommended_action": b.get("local_alarm_action", "Continue monitoring."),
            "lat": b.get("lat"),
            "lon": b.get("lon"),
            "last_update": b.get("last_update"),
        }
        for b in buildings
    ]

@app.get("/authority", response_class=HTMLResponse)
def authority_terminal():
    index_path = os.path.join(authority_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as handle:
            return handle.read()
    return "<h1>A-RES Authority Terminal</h1><p>Authority view is not available.</p>"

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            buildings = list(building_states.values())
            buildings.sort(key=lambda x: x.get("urgency_score", 0), reverse=True)
            await websocket.send_json(buildings)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
