from dataclasses import dataclass


@dataclass(frozen=True)
class AlarmDecision:
    trigger: bool
    level: str
    reasons: list[str]
    recommended_action: str


def evaluate_local_alarm(
    pga: float,
    smoke_detected: bool = False,
    gas_detected: bool = False,
    temperature: float | None = None,
    sensor_confidence: float = 1.0,
) -> AlarmDecision:
    """
    Building-level emergency alarm decision.

    This runs locally on the edge hub and does not wait for the central server.
    The central system still performs multi-building prioritization.
    """
    reasons: list[str] = []

    if pga >= 0.35:
        reasons.append("severe_shaking")
    elif pga >= 0.20:
        reasons.append("strong_shaking")

    if smoke_detected:
        reasons.append("smoke_detected")

    if gas_detected:
        reasons.append("gas_detected")

    if temperature is not None and temperature >= 55:
        reasons.append("high_temperature")

    if sensor_confidence < 0.4 and pga >= 0.15:
        reasons.append("low_confidence_after_shaking")

    critical_reasons = {"severe_shaking", "smoke_detected", "gas_detected", "high_temperature"}
    warning_reasons = {"strong_shaking", "low_confidence_after_shaking"}

    if any(reason in critical_reasons for reason in reasons):
        return AlarmDecision(
            trigger=True,
            level="CRITICAL",
            reasons=reasons,
            recommended_action="Trigger local siren and evacuation warning immediately.",
        )

    if any(reason in warning_reasons for reason in reasons):
        return AlarmDecision(
            trigger=True,
            level="WARNING",
            reasons=reasons,
            recommended_action="Trigger local warning and wait for central command confirmation.",
        )

    return AlarmDecision(
        trigger=False,
        level="NORMAL",
        reasons=[],
        recommended_action="Continue monitoring.",
    )
