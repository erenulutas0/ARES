# Urgency Score Design

## 1. Score Overview

The Urgency Score is a **0-100 integer** that tells emergency responders which buildings need help first. It is NOT a prediction of building collapse — it is a prioritization tool based on available sensor data.

## 2. Priority Levels

| Score Range | Level | Color | Action |
|-------------|-------|-------|--------|
| 0-30 | 🟢 LOW | Green | Monitor. No immediate dispatch. |
| 31-60 | 🟡 MEDIUM | Yellow | Alert. Send inspection team when available. |
| 61-80 | 🟠 HIGH | Orange | Dispatch rescue/fire team. |
| 81-100 | 🔴 CRITICAL | Red | Immediate all-team deployment. |

## 3. Input Parameters

| Parameter | Symbol | Range | Source |
|-----------|--------|-------|--------|
| Shaking severity (PGA-based) | S_shake | 0-100 | Accelerometer |
| Building vulnerability | S_vuln | 0-100 | Building registry (age, type) |
| Occupancy count | S_occ | 0-100 | Camera system |
| Fire/smoke detection | S_fire | 0 or 100 | MQ-2 sensor |
| Gas leak detection | S_gas | 0 or 100 | MQ-7 sensor |
| Data confidence | C_data | 0.0-1.0 | System health |
| Data freshness | C_fresh | 0.0-1.0 | Time since last update |

## 4. Rule-Based Formula (MVP)

```python
def calculate_urgency_score(
    pga: float,              # Peak Ground Acceleration (g)
    building_vuln: float,    # 0.0-1.0 vulnerability index
    occupancy: int,          # Current people count
    fire_detected: bool,
    smoke_detected: bool,
    gas_detected: bool,
    data_confidence: float,  # 0.0-1.0
    seconds_since_update: int
) -> dict:
    """
    Calculate urgency score for a building.
    Returns score (0-100) and priority level.
    """

    # === STEP 1: Component Scores (each 0-100) ===

    # Shaking severity: map PGA to 0-100
    # PGA < 0.05g = barely felt, PGA > 0.5g = severe
    if pga < 0.02:
        S_shake = 0
    elif pga < 0.05:
        S_shake = 15
    elif pga < 0.10:
        S_shake = 30
    elif pga < 0.20:
        S_shake = 50
    elif pga < 0.35:
        S_shake = 70
    elif pga < 0.50:
        S_shake = 85
    else:
        S_shake = 100

    # Building vulnerability (already 0-1, scale to 0-100)
    S_vuln = building_vuln * 100

    # Occupancy: logarithmic scaling
    # 0 people = 0, 1-5 = 20, 6-20 = 40, 21-50 = 60, 51-100 = 80, 100+ = 100
    if occupancy == 0:
        S_occ = 0
    elif occupancy <= 5:
        S_occ = 20
    elif occupancy <= 20:
        S_occ = 40
    elif occupancy <= 50:
        S_occ = 60
    elif occupancy <= 100:
        S_occ = 80
    else:
        S_occ = 100

    # Fire/smoke/gas: binary boosters
    S_fire = 100 if fire_detected else (50 if smoke_detected else 0)
    S_gas = 100 if gas_detected else 0

    # === STEP 2: Weighted Combination ===
    #
    # Weights reflect operational importance:
    #   Shaking severity:  30%  (primary indicator)
    #   Occupancy:         25%  (people at risk)
    #   Fire/smoke:        20%  (secondary hazard)
    #   Building vuln:     15%  (structural risk proxy)
    #   Gas leak:          10%  (secondary hazard)

    W_shake = 0.30
    W_occ   = 0.25
    W_fire  = 0.20
    W_vuln  = 0.15
    W_gas   = 0.10

    raw_score = (
        S_shake * W_shake +
        S_occ   * W_occ   +
        S_fire  * W_fire  +
        S_vuln  * W_vuln  +
        S_gas   * W_gas
    )

    # === STEP 3: Confidence Adjustment ===
    # Low confidence = we're less sure, so we slightly BOOST the score
    # (precautionary principle: uncertainty → assume worse)

    # Data freshness decay
    if seconds_since_update < 30:
        C_fresh = 1.0
    elif seconds_since_update < 120:
        C_fresh = 0.8
    elif seconds_since_update < 300:
        C_fresh = 0.6
    else:
        C_fresh = 0.4

    overall_confidence = data_confidence * C_fresh

    # If confidence is low, boost score slightly (precautionary)
    if overall_confidence < 0.5:
        confidence_boost = (1 - overall_confidence) * 15  # Up to +15 points
    else:
        confidence_boost = 0

    final_score = min(100, int(raw_score + confidence_boost))

    # === STEP 4: Priority Level ===
    if final_score <= 30:
        priority = "LOW"
    elif final_score <= 60:
        priority = "MEDIUM"
    elif final_score <= 80:
        priority = "HIGH"
    else:
        priority = "CRITICAL"

    return {
        "score": final_score,
        "priority": priority,
        "components": {
            "shaking": S_shake,
            "occupancy": S_occ,
            "fire": S_fire,
            "vulnerability": S_vuln,
            "gas": S_gas,
        },
        "confidence": round(overall_confidence, 2),
        "confidence_boost": round(confidence_boost, 1)
    }
```

## 5. Example Calculations

### Building A — Low priority
```
PGA: 0.03g (barely felt)
Vulnerability: 0.2 (modern reinforced concrete)
Occupancy: 0
Fire: No, Smoke: No, Gas: No
Confidence: 0.95, Fresh: 10s

S_shake=15, S_occ=0, S_fire=0, S_vuln=20, S_gas=0
Score = 15×0.30 + 0×0.25 + 0×0.20 + 20×0.15 + 0×0.10
     = 4.5 + 0 + 0 + 3.0 + 0 = 7.5 → 7
Priority: 🟢 LOW
```

### Building B — Medium priority
```
PGA: 0.12g (moderate shaking)
Vulnerability: 0.5 (older building)
Occupancy: 15
Fire: No, Smoke: No, Gas: No
Confidence: 0.85, Fresh: 25s

S_shake=30, S_occ=40, S_fire=0, S_vuln=50, S_gas=0
Score = 30×0.30 + 40×0.25 + 0×0.20 + 50×0.15 + 0×0.10
     = 9 + 10 + 0 + 7.5 + 0 = 26.5 → 26
Priority: 🟢 LOW (borderline — with higher PGA would be MEDIUM)
```

### Building C — High priority
```
PGA: 0.25g (strong shaking)
Vulnerability: 0.7 (old masonry)
Occupancy: 45
Fire: No, Smoke: Yes, Gas: No
Confidence: 0.75, Fresh: 15s

S_shake=50, S_occ=60, S_fire=50, S_vuln=70, S_gas=0
Score = 50×0.30 + 60×0.25 + 50×0.20 + 70×0.15 + 0×0.10
     = 15 + 15 + 10 + 10.5 + 0 = 50.5 → 50
Priority: 🟡 MEDIUM
```

### Building D — Critical priority
```
PGA: 0.45g (severe shaking)
Vulnerability: 0.8 (very old, unreinforced)
Occupancy: 80
Fire: Yes, Smoke: Yes, Gas: Yes
Confidence: 0.60, Fresh: 90s

S_shake=85, S_occ=80, S_fire=100, S_vuln=80, S_gas=100
Score = 85×0.30 + 80×0.25 + 100×0.20 + 80×0.15 + 100×0.10
     = 25.5 + 20 + 20 + 12 + 10 = 87.5 → 87
Priority: 🔴 CRITICAL
```

### Building E — Uncertain data (offline)
```
PGA: 0.15g (moderate, last known)
Vulnerability: 0.6
Occupancy: 30 (last known, stale)
Fire: Unknown, Gas: Unknown
Confidence: 0.30, Fresh: 400s (stale!)

S_shake=30, S_occ=60, S_fire=0, S_vuln=60, S_gas=0
C_fresh=0.4, overall_confidence=0.30×0.4=0.12
confidence_boost = (1-0.12)×15 = 13.2

Raw = 30×0.30 + 60×0.25 + 0×0.20 + 60×0.15 + 0×0.10
    = 9 + 15 + 0 + 9 + 0 = 33
Final = 33 + 13.2 = 46.2 → 46
Priority: 🟡 MEDIUM (boosted due to uncertainty)
```

## 6. Why This Approach Is Safer Than "AI Damage Detection"

| Claim | Risk | Our Approach |
|-------|------|-------------|
| "AI detected building collapse" | False negative → people die | We say "high shaking + high vulnerability = high priority" |
| "AI says building is safe" | False sense of security | We never say "safe" — we say "lower priority based on available data" |
| "AI predicts structural damage" | Requires structural engineering data we don't have | We use proxy signals (PGA + building age/type) |
| "System replaces engineers" | Liability nightmare | System is a prioritization aid, not a diagnosis tool |

## 7. Dashboard Usage by Emergency Teams

```
┌─────────────────────────────────────────────────────┐
│  A-RES EMERGENCY DASHBOARD                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔴 B-004  Urgency: 87  Occupancy: 80  🔥 FIRE    │
│  🟠 B-007  Urgency: 72  Occupancy: 45  💨 SMOKE   │
│  🟡 B-002  Urgency: 46  Occupancy: 30  ⚠️ STALE   │
│  🟡 B-005  Urgency: 38  Occupancy: 12             │
│  🟢 B-001  Urgency: 7   Occupancy: 0              │
│  🟢 B-003  Urgency: 5   Occupancy: 2              │
│                                                     │
│  [MAP VIEW]  [DETAIL VIEW]  [ALERTS]  [HISTORY]    │
└─────────────────────────────────────────────────────┘
```

Emergency teams use this to:
1. **Dispatch rescue first** to 🔴 CRITICAL buildings
2. **Send fire team** to buildings with 🔥 fire detected
3. **Send inspection** to 🟡 MEDIUM buildings when available
4. **Monitor** 🟢 LOW buildings passively
5. **Investigate** ⚠️ STALE data buildings — unknown status is dangerous
