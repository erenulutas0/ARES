def calculate_urgency_score(
    pga=0.0,          # Legacy/demo field; not a primary MVP factor anymore
    building_vuln=0.5,    # 0.0-1.0 vulnerability index
    occupancy=0,        # Current people count
    fire_detected=False,
    smoke_detected=False,
    gas_detected=False,
    data_confidence=1.0,
    seconds_since_update=0
):
    """
    Calculates the updated A-RES urgency score (0-100).

    MVP inputs:
    - occupancy risk
    - fire/gas risk
    - static building vulnerability
    - data confidence/freshness

    The legacy pga argument is kept for backward compatibility, but the final
    MVP score does not depend on real-time structural health sensing.
    """

    # 1. Occupancy Score (S_occ) - Logarithmic scaling
    if occupancy == 0: S_occ = 0
    elif occupancy <= 5: S_occ = 20
    elif occupancy <= 20: S_occ = 40
    elif occupancy <= 50: S_occ = 60
    elif occupancy <= 100: S_occ = 80
    else: S_occ = 100

    # 2. Fire/gas hazard score
    hazard_score = 0
    if smoke_detected:
        hazard_score = max(hazard_score, 50)
    if gas_detected:
        hazard_score = max(hazard_score, 100)
    if fire_detected:
        hazard_score = 100

    # 3. Building vulnerability (already 0-1, scale to 0-100)
    S_vuln = building_vuln * 100

    # 4. Weighted sum for updated MVP:
    # Occupancy(35%), Fire/gas(30%), Vulnerability(25%)
    # Confidence is applied as a separate precautionary boost.
    raw_score = (
        S_occ * 0.35
        + hazard_score * 0.30
        + S_vuln * 0.25
    )

    # 5. Confidence/Freshness Adjustment
    freshness_factor = 1.0
    if seconds_since_update > 300: freshness_factor = 0.5
    elif seconds_since_update > 60: freshness_factor = 0.8
    
    overall_conf = data_confidence * freshness_factor
    
    # Uncertainty boost: If we're not sure, assume slightly worse (+15 max).
    boost = (1 - overall_conf) * 15 if overall_conf < 0.75 else 0
    
    final_score = min(100, int(raw_score + boost))
    
    # Priority Level
    if final_score <= 30: priority = "LOW"
    elif final_score <= 60: priority = "MEDIUM"
    elif final_score <= 80: priority = "HIGH"
    else: priority = "CRITICAL"
    
    return {
        "score": final_score,
        "priority": priority,
        "confidence": round(overall_conf, 2),
        "breakdown": {
            "occupancy": S_occ,
            "hazards": hazard_score,
            "vulnerability": S_vuln
        }
    }

if __name__ == "__main__":
    # Test cases
    test_cases = [
        {"pga": 0.01, "vuln": 0.2, "occ": 0, "name": "Normal Case"},
        {"pga": 0.25, "vuln": 0.7, "occ": 45, "smoke": True, "name": "High Risk Case"},
        {"pga": 0.45, "vuln": 0.9, "occ": 80, "fire": True, "gas": True, "name": "Critical Case"}
    ]
    
    for tc in test_cases:
        res = calculate_urgency_score(
            tc["pga"], tc["vuln"], tc["occ"], 
            fire_detected=tc.get("fire", False),
            smoke_detected=tc.get("smoke", False),
            gas_detected=tc.get("gas", False)
        )
        print(f"--- {tc['name']} ---")
        print(f"Score: {res['score']} | Priority: {res['priority']}")
        print(f"Breakdown: {res['breakdown']}\n")
