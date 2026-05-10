from src.edge.local_alarm import evaluate_local_alarm


def test_normal_conditions_do_not_trigger_alarm():
    decision = evaluate_local_alarm(
        pga=0.01,
        smoke_detected=False,
        gas_detected=False,
        temperature=24,
    )

    assert decision.trigger is False
    assert decision.level == "NORMAL"


def test_severe_shaking_triggers_critical_alarm():
    decision = evaluate_local_alarm(pga=0.42)

    assert decision.trigger is True
    assert decision.level == "CRITICAL"
    assert "severe_shaking" in decision.reasons


def test_gas_detection_triggers_critical_alarm_even_with_low_pga():
    decision = evaluate_local_alarm(pga=0.02, gas_detected=True)

    assert decision.trigger is True
    assert decision.level == "CRITICAL"
    assert "gas_detected" in decision.reasons


def test_moderate_shaking_with_low_confidence_triggers_warning():
    decision = evaluate_local_alarm(pga=0.16, sensor_confidence=0.25)

    assert decision.trigger is True
    assert decision.level == "WARNING"
    assert "low_confidence_after_shaking" in decision.reasons
