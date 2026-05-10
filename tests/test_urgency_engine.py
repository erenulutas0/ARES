from src.server.urgency_engine import calculate_urgency_score


def test_safe_empty_building_is_low_priority():
    result = calculate_urgency_score(
        pga=0.01,
        building_vuln=0.2,
        occupancy=0,
        smoke_detected=False,
        gas_detected=False,
    )

    assert result["priority"] == "LOW"
    assert 0 <= result["score"] <= 30


def test_combined_hazards_create_critical_priority():
    result = calculate_urgency_score(
        pga=0.55,
        building_vuln=0.9,
        occupancy=120,
        fire_detected=True,
        smoke_detected=True,
        gas_detected=True,
    )

    assert result["priority"] == "CRITICAL"
    assert result["score"] >= 80


def test_stale_low_confidence_data_gets_precautionary_boost():
    fresh = calculate_urgency_score(
        pga=0.15,
        building_vuln=0.5,
        occupancy=30,
        data_confidence=1.0,
        seconds_since_update=0,
    )
    stale = calculate_urgency_score(
        pga=0.15,
        building_vuln=0.5,
        occupancy=30,
        data_confidence=0.3,
        seconds_since_update=600,
    )

    assert stale["score"] > fresh["score"]
    assert stale["confidence"] < fresh["confidence"]
