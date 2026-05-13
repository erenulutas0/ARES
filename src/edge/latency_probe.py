import argparse
import statistics
import time
from datetime import datetime, timezone

import requests


def utc_timestamp():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def post_json(session, central_url, path, payload):
    response = session.post(f"{central_url.rstrip('/')}{path}", json=payload, timeout=5)
    response.raise_for_status()
    return response.json()


def get_alert(session, central_url, building_id):
    response = session.get(f"{central_url.rstrip('/')}/authority/alerts", timeout=5)
    response.raise_for_status()
    for alert in response.json():
        if alert.get("building_id") == building_id:
            return alert
    return None


def run_probe(args):
    session = requests.Session()
    samples = []

    for index in range(args.samples):
        occupancy = args.occupancy + index
        sensor_payload = {
            "building_id": args.building_id,
            "timestamp": utc_timestamp(),
            "type": "Latency Demo Building",
            "lat": 40.9900,
            "lon": 29.0250,
            "pga": 0.01,
            "temperature": 22.0,
            "smoke_detected": args.smoke,
            "gas_detected": args.gas,
            "building_age": 32,
            "structural_type": "reinforced_concrete",
            "floors": 8,
            "adjacency_type": "adjacent",
            "soil_risk": "high",
            "seismic_hazard": "high",
        }
        occupancy_payload = {
            "building_id": args.building_id,
            "camera_id": f"CAM-{args.building_id}",
            "timestamp": utc_timestamp(),
            "event_type": "count_snapshot",
            "current_count": occupancy,
            "confidence": 0.95,
        }

        start = time.perf_counter()
        post_json(session, args.central_url, "/ingest/sensor", sensor_payload)
        post_json(session, args.central_url, "/ingest/occupancy", occupancy_payload)

        alert = None
        deadline = time.perf_counter() + args.wait_timeout
        while time.perf_counter() < deadline:
            alert = get_alert(session, args.central_url, args.building_id)
            if alert and alert.get("occupancy") == occupancy:
                break
            time.sleep(0.05)

        elapsed_ms = (time.perf_counter() - start) * 1000
        if not alert or alert.get("occupancy") != occupancy:
            raise RuntimeError(f"Timed out waiting for authority feed update at sample {index + 1}")

        samples.append(elapsed_ms)
        print(
            f"sample={index + 1} latency_ms={elapsed_ms:.1f} "
            f"score={alert['urgency_score']} priority={alert['priority']} occupancy={alert['occupancy']}"
        )
        time.sleep(args.interval)

    return samples


def print_summary(samples):
    print("\nLatency summary")
    print(f"count={len(samples)}")
    print(f"min_ms={min(samples):.1f}")
    print(f"avg_ms={statistics.mean(samples):.1f}")
    print(f"median_ms={statistics.median(samples):.1f}")
    print(f"max_ms={max(samples):.1f}")


def main():
    parser = argparse.ArgumentParser(description="Measure HTTP edge-to-authority latency for the A-RES demo.")
    parser.add_argument("--central-url", default="http://127.0.0.1:8000")
    parser.add_argument("--building-id", default="LATENCY-001")
    parser.add_argument("--samples", type=int, default=10)
    parser.add_argument("--occupancy", type=int, default=20)
    parser.add_argument("--interval", type=float, default=0.2)
    parser.add_argument("--wait-timeout", type=float, default=3.0)
    parser.add_argument("--smoke", action="store_true")
    parser.add_argument("--gas", action="store_true")
    args = parser.parse_args()

    samples = run_probe(args)
    print_summary(samples)


if __name__ == "__main__":
    main()
