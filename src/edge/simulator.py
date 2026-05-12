import time
import json
import random
import paho.mqtt.client as mqtt
from datetime import datetime

# Configuration
BROKER = "broker.hivemq.com"
PORT = 1883

# Define the "City" (10 diverse buildings: 5 in Istanbul, 5 in Tokyo)
BUILDINGS = [
    # --- Turkey Region ---
    {"id": "TR-001", "type": "Hospital", "lat": 40.990, "lon": 29.025, "base_occ": 200, "vuln": 0.2, "fire_risk": 0.01, "gas_risk": 0.05, "building_age": 8, "structural_type": "reinforced_concrete", "floors": 6, "adjacency_type": "detached", "soil_risk": "medium", "seismic_hazard": "high"},
    {"id": "TR-002", "type": "Old Apartment", "lat": 40.985, "lon": 29.030, "base_occ": 40, "vuln": 0.8, "fire_risk": 0.1, "gas_risk": 0.15, "building_age": 45, "structural_type": "masonry", "floors": 7, "adjacency_type": "adjacent", "soil_risk": "high", "seismic_hazard": "high"},
    {"id": "TR-003", "type": "School", "lat": 40.995, "lon": 29.020, "base_occ": 500, "vuln": 0.4, "fire_risk": 0.05, "gas_risk": 0.02, "building_age": 22, "structural_type": "reinforced_concrete", "floors": 4, "adjacency_type": "block", "soil_risk": "medium", "seismic_hazard": "high"},
    {"id": "TR-004", "type": "Factory", "lat": 40.980, "lon": 29.040, "base_occ": 150, "vuln": 0.5, "fire_risk": 0.3, "gas_risk": 0.4, "building_age": 30, "structural_type": "steel", "floors": 2, "adjacency_type": "detached", "soil_risk": "high", "seismic_hazard": "high"},
    {"id": "TR-005", "type": "New Residence", "lat": 40.992, "lon": 29.035, "base_occ": 80, "vuln": 0.1, "fire_risk": 0.02, "gas_risk": 0.01, "building_age": 3, "structural_type": "reinforced_concrete", "floors": 12, "adjacency_type": "block", "soil_risk": "medium", "seismic_hazard": "high"},
    
    # --- Japan Region ---
    {"id": "JP-001", "type": "Metropolitan Hospital", "lat": 35.6895, "lon": 139.6917, "base_occ": 1200, "vuln": 0.15, "fire_risk": 0.01, "gas_risk": 0.05, "building_age": 6, "structural_type": "steel", "floors": 14, "adjacency_type": "detached", "soil_risk": "medium", "seismic_hazard": "high"},
    {"id": "JP-002", "type": "Shinjuku Residence", "lat": 35.6850, "lon": 139.6850, "base_occ": 240, "vuln": 0.4, "fire_risk": 0.08, "gas_risk": 0.1, "building_age": 28, "structural_type": "reinforced_concrete", "floors": 10, "adjacency_type": "adjacent", "soil_risk": "medium", "seismic_hazard": "high"},
    {"id": "JP-003", "type": "Tech Academy", "lat": 35.6950, "lon": 139.7000, "base_occ": 850, "vuln": 0.3, "fire_risk": 0.04, "gas_risk": 0.02, "building_age": 12, "structural_type": "reinforced_concrete", "floors": 8, "adjacency_type": "block", "soil_risk": "low", "seismic_hazard": "high"},
    {"id": "JP-004", "type": "Industrial Plant", "lat": 35.6750, "lon": 139.6700, "base_occ": 450, "vuln": 0.5, "fire_risk": 0.25, "gas_risk": 0.35, "building_age": 35, "structural_type": "steel", "floors": 3, "adjacency_type": "detached", "soil_risk": "high", "seismic_hazard": "high"},
    {"id": "JP-005", "type": "Shibuya Tower", "lat": 35.6580, "lon": 139.7016, "base_occ": 1800, "vuln": 0.1, "fire_risk": 0.02, "gas_risk": 0.01, "building_age": 4, "structural_type": "steel", "floors": 30, "adjacency_type": "block", "soil_risk": "medium", "seismic_hazard": "high"}
]

client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
    else:
        print(f"Failed to connect, return code {rc}")

client.on_connect = on_connect
client.connect(BROKER, PORT, 60)
client.loop_start()

# Initialize dynamic states
states = {}
for b in BUILDINGS:
    states[b["id"]] = {
        "occupancy": b["base_occ"],
        "seq_sensor": 0,
        "seq_occ": 0
    }

def simulate_earthquake():
    """Simulates a sudden earthquake event across all buildings"""
    print("\n!!! EARTHQUAKE EVENT TRIGGERED !!!\n")
    for b in BUILDINGS:
        bid = b["id"]
        # PGA depends slightly on location, but generally high everywhere
        base_pga = random.uniform(0.15, 0.45) 
        
        sensor_data = {
            "building_id": bid,
            "hub_id": f"HUB-{bid[-3:]}",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "seq": states[bid]["seq_sensor"] + 1,
            "pga": round(base_pga * (1.0 + b["vuln"]), 4), # Vulnerable buildings amplify shaking
            "temperature": 25.0,
            "smoke_detected": random.random() < b["fire_risk"],
            "gas_detected": random.random() < b["gas_risk"],
            "status": "online",
            "lat": b["lat"],
            "lon": b["lon"],
            "type": b["type"],
            "building_age": b["building_age"],
            "structural_type": b["structural_type"],
            "floors": b["floors"],
            "adjacency_type": b["adjacency_type"],
            "soil_risk": b["soil_risk"],
            "seismic_hazard": b["seismic_hazard"]
        }
        client.publish(f"ares/building/{bid}/sensor", json.dumps(sensor_data), qos=1)
        states[bid]["seq_sensor"] += 1

def simulate_routine():
    print("Starting Multi-Building Simulation...")
    try:
        loop_count = 0
        while True:
            loop_count += 1
            
            # Trigger earthquake every ~60 seconds for demo purposes
            if loop_count % 12 == 0:
                simulate_earthquake()
                time.sleep(5)
                continue

            for b in BUILDINGS:
                bid = b["id"]
                state = states[bid]
                
                # 1. Routine Sensor Data (low PGA, checking heartbeat)
                state["seq_sensor"] += 1
                sensor_data = {
                    "building_id": bid,
                    "hub_id": f"HUB-{bid[-3:]}",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "seq": state["seq_sensor"],
                    "pga": round(random.uniform(0.001, 0.02), 4), # Normal micro-tremors
                    "temperature": round(22.0 + random.uniform(-1, 1), 1),
                    "smoke_detected": False,
                    "gas_detected": False,
                    "status": "online",
                    "lat": b["lat"],
                    "lon": b["lon"],
                    "type": b["type"],
                    "building_age": b["building_age"],
                    "structural_type": b["structural_type"],
                    "floors": b["floors"],
                    "adjacency_type": b["adjacency_type"],
                    "soil_risk": b["soil_risk"],
                    "seismic_hazard": b["seismic_hazard"]
                }
                client.publish(f"ares/building/{bid}/sensor", json.dumps(sensor_data), qos=1)

                # 2. Routine Occupancy Changes
                if random.random() < 0.4: # 40% chance of movement
                    state["seq_occ"] += 1
                    delta = random.choice([-2, -1, 1, 2, 3])
                    
                    # Prevent negative occupancy
                    if state["occupancy"] + delta < 0: delta = abs(delta)
                    state["occupancy"] += delta
                    
                    occ_event = {
                        "building_id": bid,
                        "camera_id": f"CAM-{bid[-3:]}",
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "seq": state["seq_occ"],
                        "event_type": "count_delta",
                        "delta": delta,
                        "current_count": state["occupancy"],
                        "confidence": 0.95
                    }
                    client.publish(f"ares/building/{bid}/occupancy", json.dumps(occ_event), qos=1)

            print(f"Tick {loop_count}: Routine data sent for 5 buildings.")
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("Simulation stopped.")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    simulate_routine()
