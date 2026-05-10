def calculate_urgency_score(
    pga,              # Peak Ground Acceleration (g)
    building_vuln,    # 0.0-1.0 vulnerability index
    occupancy,        # Current people count
    fire_detected=False,
    smoke_detected=False,
    gas_detected=False,
    data_confidence=1.0,
    seconds_since_update=0
):
    """
    Calculates the urgency score (0-100) for a building based on sensor data.
    Based on A-RES Priority-Weighted Scoring Formula.
    """
    
    # 1. Shaking Score (S_shake) - Map PGA to 0-100
    if pga < 0.02: S_shake = 0
    elif pga < 0.05: S_shake = 15
    elif pga < 0.10: S_shake = 30
    elif pga < 0.20: S_shake = 50
    elif pga < 0.35: S_shake = 70
    elif pga < 0.50: S_shake = 85
    else: S_shake = 100

    # 2. Occupancy Score (S_occ) - Logarithmic scaling
    if occupancy == 0: S_occ = 0
    elif occupancy <= 5: S_occ = 20
    elif occupancy <= 20: S_occ = 40
    elif occupancy <= 50: S_occ = 60
    elif occupancy <= 100: S_occ = 80
    else: S_occ = 100

    # 3. Hazard Score (S_fire, S_gas)
    S_fire = 100 if fire_detected else (50 if smoke_detected else 0)
    S_gas = 100 if gas_detected else 0

    # 4. Building Vulnerability (S_vuln)
    S_vuln = building_vuln * 100

    # 5. Weighted Sum
    # Weights: Shake(30%), Occupancy(25%), Fire(20%), Vuln(15%), Gas(10%)
    raw_score = (
        S_shake * 0.30 +
        S_occ   * 0.25 +
        S_fire  * 0.20 +
        S_vuln  * 0.15 +
        S_gas   * 0.10
    )

    # 6. Confidence/Freshness Adjustment
    freshness_factor = 1.0
    if seconds_since_update > 300: freshness_factor = 0.5
    elif seconds_since_update > 60: freshness_factor = 0.8
    
    overall_conf = data_confidence * freshness_factor
    
    # Uncertainty boost: If we're not sure, assume slightly worse (+15 max)
    boost = (1 - overall_conf) * 15
    
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
            "shaking": S_shake,
            "occupancy": S_occ,
            "hazards": max(S_fire, S_gas),
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
