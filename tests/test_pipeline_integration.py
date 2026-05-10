from src.server.urgency_engine import calculate_urgency_score


def test_sensor_and_occupancy_payloads_produce_rankable_building_state():
    sensor_payload = {
        "building_id": "JP-004",
        "pga": 0.38,
        "vulnerability": 0.5,
        "smoke_detected": True,
        "gas_detected": True,
    }
    occupancy_payload = {
        "building_id": "JP-004",
        "current_count": 450,
    }

    state = {
        "pga": sensor_payload["pga"],
        "vulnerability": sensor_payload["vulnerability"],
        "smoke_detected": sensor_payload["smoke_detected"],
        "gas_detected": sensor_payload["gas_detected"],
        "occupancy": occupancy_payload["current_count"],
    }

    result = calculate_urgency_score(
        state["pga"],
        state["vulnerability"],
        state["occupancy"],
        smoke_detected=state["smoke_detected"],
        gas_detected=state["gas_detected"],
    )

    assert result["priority"] in {"HIGH", "CRITICAL"}
    assert result["score"] >= 70
    assert result["breakdown"]["occupancy"] == 100
    assert result["breakdown"]["hazards"] == 100
