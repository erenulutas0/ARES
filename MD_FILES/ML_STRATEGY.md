# ML & Training Strategy

## 1. Golden Rule: What We Do NOT Claim

> ❌ "We predict earthquakes before they happen"
> ❌ "AI determines exact structural damage from sensor data"
> ❌ "Our system replaces structural engineers"
> ❌ "We know which column is damaged"

> ✅ "We estimate shaking severity from local acceleration data"
> ✅ "We calculate a risk-weighted urgency score for prioritization"
> ✅ "We use sensor fusion to help emergency teams decide where to go first"

## 2. Realistic ML Tasks

| Task | Type | Difficulty | MVP Priority |
|------|------|-----------|-------------|
| Shaking severity classification | Rule-based + optional ML | Easy | ✅ MVP |
| Urgency score calculation | Rule-based weighted formula | Easy | ✅ MVP |
| Building priority classification | Threshold-based from score | Easy | ✅ MVP |
| Occupancy counting | CV model (YOLO) — pre-trained | Medium | ✅ MVP |
| Fire/smoke/gas detection | Sensor threshold + 2-stage confirm | Easy | ✅ MVP |
| PGA → MMI mapping | Lookup table (USGS standard) | Easy | ✅ MVP |
| Urgency score optimization | ML regression/classification | Medium | ⏳ Future |
| Anomaly detection on sensor streams | Time-series ML | Hard | ⏳ Future |
| Building damage estimation | Structural engineering models | Very Hard | ❌ Out of scope |

## 3. What Should Be Rule-Based vs ML-Based

### Rule-Based (MVP — use these first)

| Component | Method | Why |
|-----------|--------|-----|
| PGA → Shaking level | MMI scale lookup table | Well-established seismological standard |
| Fire/smoke/gas alerts | Sensor threshold + 2-stage confirmation | Simple, reliable, no training needed |
| Urgency score | Weighted formula (see URGENCY_SCORE.md) | Interpretable, tunable, no data dependency |
| Priority classification | Threshold on urgency score | Direct, transparent |
| Occupancy count | YOLO11n pre-trained on COCO (class 0: person) | No custom training needed |

### ML-Based (Future Enhancement)

| Component | Method | Why |
|-----------|--------|-----|
| Urgency score weights | Learn optimal weights from labeled priority data | Could improve over expert-assigned weights |
| Shaking severity from raw acceleration | 1D-CNN or LSTM on accelerometer time-series | More nuanced than PGA alone |
| Multi-sensor anomaly detection | Isolation Forest or Autoencoder | Detect unusual patterns |
| Building risk category prediction | XGBoost/LightGBM on building features | If building feature data is available |

## 4. Feature Engineering

### 4.1 Earthquake/Sensor Features

| Feature | Source | Description |
|---------|--------|-------------|
| `pga` | Accelerometer | Peak Ground Acceleration (g) |
| `pga_vertical` | Accelerometer | Vertical PGA component |
| `duration_strong` | Accelerometer | Duration of shaking > threshold |
| `spectral_intensity` | Accelerometer | Frequency domain energy |
| `mmi_estimated` | PGA lookup | Modified Mercalli Intensity |
| `temperature` | DS18B20 | Ambient temperature |
| `temperature_delta` | DS18B20 | Rate of temperature change |
| `humidity` | BME280 | Relative humidity |
| `pressure` | BME280 | Atmospheric pressure |
| `smoke_level` | MQ-2 | Smoke sensor analog reading |
| `co_level` | MQ-7 | Carbon monoxide ppm |

### 4.2 Building Features (Static Registry)

| Feature | Source | Description |
|---------|--------|-------------|
| `building_age` | Registry | Years since construction |
| `structural_type` | Registry | concrete, masonry, steel, wood |
| `num_floors` | Registry | Number of stories |
| `building_use` | Registry | residential, commercial, hospital |
| `seismic_zone` | J-SHIS / hazard map | Expected hazard level |
| `soil_type` | J-SHIS | Ground amplification class |
| `vulnerability_index` | Calculated | Composite vulnerability (0-1) |

### 4.3 Occupancy Features (From Camera)

| Feature | Source | Description |
|---------|--------|-------------|
| `current_occupancy` | Camera system | People currently inside |
| `occupancy_trend` | Derived | Increasing/decreasing/stable |
| `peak_occupancy_today` | Derived | Max occupancy seen today |
| `occupancy_confidence` | Camera system | How reliable the count is |

## 5. Labels — How to Create Them

The hardest part of ML is labeling. Here's our strategy:

### 5.1 For Shaking Severity

**Source:** USGS / NIED post-earthquake reports provide MMI (Modified Mercalli Intensity) and damage assessments.

| MMI Level | Description | Our Label |
|-----------|------------|-----------|
| I-III | Not felt to weak | LOW |
| IV-V | Light to moderate | MEDIUM |
| VI-VII | Strong to very strong | HIGH |
| VIII+ | Severe to extreme | CRITICAL |

**Mapping PGA → MMI:** Use the Wald et al. (1999) empirical relationship:
```
MMI ≈ 3.66 × log10(PGA_cm/s²) − 1.66   (for PGA > 10 cm/s²)
```

### 5.2 For Urgency Score (Supervised Learning — Future)

Since we don't have real emergency response labels, we can:
1. **Expert labeling:** Have team members manually assign priority to simulated scenarios
2. **Simulation:** Generate 1000+ building scenarios with known parameters, apply our rule-based formula, then train ML to replicate/improve
3. **Historical post-earthquake reports:** Map reported damage/casualties to urgency levels

### 5.3 For Occupancy Counting

Pre-trained YOLO already handles this — no custom labels needed for MVP. If accuracy is insufficient, fine-tune on:
- CrowdHuman dataset (person detection in crowds)
- MOT17/MOT20 (tracking benchmark)

## 6. Data Simulation for MVP

Since we can't create real earthquakes, simulate the data:

```python
import numpy as np
import pandas as pd

def simulate_buildings(n_buildings=5, n_timesteps=100):
    """Generate synthetic building sensor data for MVP demo."""
    data = []

    for b in range(n_buildings):
        building_id = f"B-{b+1:03d}"
        vulnerability = np.random.uniform(0.2, 0.9)
        base_occupancy = np.random.randint(0, 100)

        for t in range(n_timesteps):
            # Simulate earthquake at t=50
            if t < 45:
                pga = np.random.uniform(0.001, 0.01)  # Quiet
            elif t < 55:
                pga = np.random.uniform(0.1, 0.8)     # Earthquake!
            else:
                pga = np.random.uniform(0.001, 0.05)   # Aftershocks

            # Simulate fire (10% chance after strong shaking)
            fire = (pga > 0.3) and (np.random.random() < 0.1)
            gas = (pga > 0.4) and (np.random.random() < 0.05)
            smoke = fire or (pga > 0.2 and np.random.random() < 0.15)

            # Occupancy decreases during/after earthquake (evacuation)
            if t < 45:
                occupancy = base_occupancy + np.random.randint(-5, 5)
            elif t < 55:
                occupancy = max(0, base_occupancy - t + 45)
            else:
                occupancy = max(0, int(base_occupancy * 0.3))

            data.append({
                "building_id": building_id,
                "timestep": t,
                "pga": round(pga, 4),
                "vulnerability": vulnerability,
                "occupancy": max(0, occupancy),
                "fire_detected": fire,
                "smoke_detected": smoke,
                "gas_detected": gas,
                "temperature": round(22 + np.random.normal(0, 2) + (10 if fire else 0), 1),
                "humidity": round(55 + np.random.normal(0, 5), 1),
            })

    return pd.DataFrame(data)

# Generate and save
df = simulate_buildings()
df.to_csv("simulated_building_data.csv", index=False)
print(f"Generated {len(df)} rows for {df['building_id'].nunique()} buildings")
```

## 7. Evaluation Strategy

### 7.1 For Urgency Score

| Metric | Description | Target |
|--------|------------|--------|
| **Ranking accuracy** | Does the system rank buildings in the same order as experts? | > 80% Kendall tau |
| **Priority accuracy** | Does the predicted priority level match expert labels? | > 85% accuracy |
| **Critical recall** | Of truly critical buildings, how many did we flag? | > 95% (miss rate < 5%) |
| **False critical rate** | How many LOW buildings were flagged CRITICAL? | < 10% |

### 7.2 For Occupancy Counting

| Metric | Description | Target (MVP) |
|--------|------------|-------------|
| **MAE** | Mean Absolute Error of count | < 3 people |
| **MAPE** | Mean Absolute Percentage Error | < 15% |
| **Precision** | Of detected people, how many are real? | > 90% |
| **Recall** | Of real people, how many were detected? | > 85% |
| **Direction accuracy** | Entry classified as entry, exit as exit | > 90% |

## 8. Recommended Baseline Models (If ML is Pursued)

| Model | Use Case | Why |
|-------|---------|-----|
| **Logistic Regression** | Priority classification (LOW/MED/HIGH/CRIT) | Simple baseline, interpretable |
| **Random Forest** | Urgency score regression | Handles mixed feature types well |
| **XGBoost / LightGBM** | Urgency score optimization | State-of-the-art for tabular data |
| **1D-CNN** | Raw accelerometer → shaking level | Good for time-series classification |
| **Simple MLP** | Feature vector → urgency score | Fast to train, easy to deploy |

**MVP Strategy:** Start with the rule-based formula. Only move to ML if:
1. You have enough labeled data (>500 scenarios)
2. The rule-based system has clear deficiencies
3. You have time remaining after MVP is complete

## 9. Training Pipeline (If ML is Pursued)

```
1. Collect/simulate data → CSV
2. Feature engineering (see Section 4)
3. Create labels (see Section 5)
4. Train/test split (80/20, stratified by priority level)
5. Train baseline (Logistic Regression)
6. Train advanced (XGBoost)
7. Evaluate on test set
8. Compare with rule-based formula
9. If ML is better → deploy alongside rule-based as "enhanced mode"
10. If ML is worse → keep rule-based, report findings
```

## 10. Global vs Japan-Specific Data Strategy

| Data Type | Global Sources | Japan Sources | Strategy |
|-----------|---------------|---------------|----------|
| Earthquake events | USGS ComCat | JMA, NIED | Global for variety, Japan for calibration |
| Strong-motion waveforms | IRIS/EarthScope | K-NET, KiK-net | Japan primary, global for generalization |
| Hazard maps | GSHAP | J-SHIS | Japan-specific for demo scenario |
| Building vulnerability | FEMA P-154 concepts | — | Conceptual framework, simulated data |
| Occupancy CV training | COCO, CrowdHuman | — | Global datasets work everywhere |
