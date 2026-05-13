import argparse
import time
from datetime import datetime, timezone

import requests


DEFAULT_BUILDING_PROFILE = {
    "building_id": "DEMO-001",
    "type": "Demo Apartment",
    "lat": 40.9900,
    "lon": 29.0250,
    "building_age": 32,
    "structural_type": "reinforced_concrete",
    "floors": 8,
    "adjacency_type": "adjacent",
    "soil_risk": "high",
    "seismic_hazard": "high",
}


def utc_timestamp():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def post_json(central_url, path, payload):
    url = f"{central_url.rstrip('/')}{path}"
    response = requests.post(url, json=payload, timeout=5)
    response.raise_for_status()
    return response.json()


def build_sensor_payload(args):
    payload = dict(DEFAULT_BUILDING_PROFILE)
    payload.update({
        "building_id": args.building_id,
        "timestamp": utc_timestamp(),
        "pga": args.pga,
        "temperature": args.temperature,
        "smoke_detected": args.smoke,
        "gas_detected": args.gas,
        "status": "online",
    })

    if args.type:
        payload["type"] = args.type
    if args.building_age is not None:
        payload["building_age"] = args.building_age
    if args.structural_type:
        payload["structural_type"] = args.structural_type
    if args.floors is not None:
        payload["floors"] = args.floors
    if args.adjacency_type:
        payload["adjacency_type"] = args.adjacency_type
    if args.soil_risk:
        payload["soil_risk"] = args.soil_risk
    if args.seismic_hazard:
        payload["seismic_hazard"] = args.seismic_hazard

    return payload


def build_occupancy_payload(args, current_count):
    return {
        "building_id": args.building_id,
        "camera_id": f"CAM-{args.building_id}",
        "timestamp": utc_timestamp(),
        "event_type": "count_snapshot",
        "delta": 0,
        "current_count": current_count,
        "confidence": args.confidence,
    }


def send_once(args, current_count):
    sensor_result = post_json(args.central_url, "/ingest/sensor", build_sensor_payload(args))
    occupancy_result = post_json(args.central_url, "/ingest/occupancy", build_occupancy_payload(args, current_count))
    building = occupancy_result["building"]
    print(
        f"{building['building_id']} | occupancy={building['occupancy']} | "
        f"score={building['urgency_score']} | priority={building['priority']} | "
        f"edge_action={building.get('local_alarm_action', 'monitoring')}"
    )
    return sensor_result, occupancy_result


def main():
    parser = argparse.ArgumentParser(description="Send demo edge-hub data to the A-RES central laptop over HTTP.")
    parser.add_argument("--central-url", default="http://127.0.0.1:8000", help="Central laptop URL, e.g. http://192.168.1.35:8000")
    parser.add_argument("--building-id", default="DEMO-001")
    parser.add_argument("--occupancy", type=int, default=12)
    parser.add_argument("--confidence", type=float, default=0.95)
    parser.add_argument("--smoke", action="store_true", help="Mock smoke/fire detection")
    parser.add_argument("--gas", action="store_true", help="Mock gas leak detection")
    parser.add_argument("--pga", type=float, default=0.01)
    parser.add_argument("--temperature", type=float, default=22.0)
    parser.add_argument("--type")
    parser.add_argument("--building-age", type=int)
    parser.add_argument("--structural-type")
    parser.add_argument("--floors", type=int)
    parser.add_argument("--adjacency-type")
    parser.add_argument("--soil-risk")
    parser.add_argument("--seismic-hazard")
    parser.add_argument("--loop", action="store_true", help="Continuously send demo data")
    parser.add_argument("--interval", type=float, default=2.0)
    parser.add_argument("--step", type=int, default=0, help="Occupancy change per loop tick")
    args = parser.parse_args()

    current_count = max(0, args.occupancy)

    if args.loop:
        while True:
            send_once(args, current_count)
            current_count = max(0, current_count + args.step)
            time.sleep(args.interval)
    else:
        send_once(args, current_count)


if __name__ == "__main__":
    main()
