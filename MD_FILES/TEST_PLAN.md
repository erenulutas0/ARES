# Test Plan — A-RES System

## 1. Testing Strategy Overview

| Test Level | Scope | When | Tools |
|------------|-------|------|-------|
| **Unit Tests** | Individual functions (scoring, counting logic) | During development | pytest |
| **Integration Tests** | MQTT ↔ Backend ↔ Database | After components built | pytest + docker-compose |
| **Simulation Tests** | End-to-end with synthetic data | Week 5 | Custom simulator scripts |
| **Field Tests** | Real camera + real video | Week 5-6 (if hardware available) | Pre-recorded video |
| **Stress Tests** | High volume messages, many buildings | Week 5 | Locust / custom scripts |

## 2. Occupancy Counting Test Cases

| ID | Scenario | Input | Expected Output | Pass Criteria |
|----|----------|-------|----------------|---------------|
| OC-01 | Single person enters | 1 person walks through door (outside→inside) | count_delta: +1, direction: entry | Delta = +1, count increases by 1 |
| OC-02 | Single person exits | 1 person walks through door (inside→outside) | count_delta: -1, direction: exit | Delta = -1, count decreases by 1 |
| OC-03 | Two people enter side by side | 2 people walk through together | count_delta: +2 (or two +1 events) | Total delta = +2 |
| OC-04 | Group enters (5 people) | 5 people enter in quick succession | Total delta = +5 | ±1 tolerance (4-6 acceptable for MVP) |
| OC-05 | Person enters then turns back | 1 person approaches, crosses line, turns back, crosses line again | Net delta = 0 (one +1 then one -1) | Final count unchanged |
| OC-06 | Person waits at door | 1 person stands near line without crossing | No event generated | No false count_delta |
| OC-07 | Low light conditions | Dimly lit entrance (< 50 lux) | Detection with lower confidence | Detection rate > 70%, confidence flag |
| OC-08 | Bright backlight | Sun directly behind person | Detection despite silhouette | Detection rate > 60% |
| OC-09 | Person with large bag | Person carrying box/suitcase | Correctly detected as 1 person | Count = 1, not 0 or 2 |
| OC-10 | Child enters | Short person (< 120cm) | Detected as person | Detection confidence > 0.3 |
| OC-11 | Pet passes through | Dog/cat crosses line | No count change | classes=[0] filter blocks animals |
| OC-12 | Door partially blocked | Camera partially obscured | Reduced detection, lower confidence | Confidence score reflects degradation |
| OC-13 | Fast movement | Person running through door | Detected and tracked | Count correctly updated |
| OC-14 | Wheelchair user | Person in wheelchair | Detected as person | Count = 1 |
| OC-15 | Empty frame (no people) | No one in camera view | No events | No false positives |

## 3. Sensor Data Test Cases

| ID | Scenario | Input | Expected Output | Pass Criteria |
|----|----------|-------|----------------|---------------|
| SD-01 | Normal conditions | PGA < 0.02g, no smoke/gas | Urgency score < 10 | Score in LOW range |
| SD-02 | Moderate earthquake | PGA = 0.15g | Shaking component = 30-50 | Correct MMI mapping |
| SD-03 | Severe earthquake | PGA = 0.50g+ | Shaking component = 85-100 | Score in HIGH/CRITICAL |
| SD-04 | Fire detected | smoke_detected = true | Fire component = 50-100 | Score increases significantly |
| SD-05 | Gas leak detected | gas_detected = true | Gas component = 100 | Score increases |
| SD-06 | Combined: earthquake + fire + people | PGA=0.4g, fire=true, occupancy=50 | Very high score | Score > 80 (CRITICAL) |
| SD-07 | No earthquake, fire only | PGA=0.01g, fire=true, occupancy=10 | Moderate score | Score = 30-50 (fire risk without earthquake) |

## 4. Communication Test Cases

| ID | Scenario | Input | Expected Output | Pass Criteria |
|----|----------|-------|----------------|---------------|
| CM-01 | Normal MQTT publish | Sensor sends valid JSON | Server receives, stores in DB | Data in PostgreSQL within 2s |
| CM-02 | MQTT broker down | Broker stops | Edge device buffers messages | Messages queued, delivered on reconnect |
| CM-03 | Network disconnected | WiFi drops for 5 min | Edge buffers, reconnects | All buffered messages delivered after reconnect |
| CM-04 | Duplicate event | Same seq number sent twice | Server ignores duplicate | Only 1 row in database |
| CM-05 | Out-of-order events | Events arrive: seq 5, 3, 4 | Server processes all, orders by timestamp | All events stored correctly |
| CM-06 | Delayed event | Event arrives 10 min late | Stored with original timestamp | `timestamp` vs `received_at` differ but both recorded |
| CM-07 | Malformed JSON | Invalid JSON published | Server logs error, does not crash | Error logged, service continues |
| CM-08 | Central server restart | Server process crashes/restarts | Reconnects to MQTT, continues | No data loss, dashboard reconnects |
| CM-09 | WebSocket disconnect | Dashboard browser closes | Server cleans up connection | No memory leak, reconnection works |
| CM-10 | High volume (100 msg/sec) | 100 buildings send simultaneously | Server handles all | No message loss, latency < 5s |

## 5. Urgency Score Test Cases

| ID | Scenario | Building Config | Expected Score | Expected Priority |
|----|----------|----------------|---------------|------------------|
| US-01 | Empty safe building | PGA=0.01, vuln=0.2, occ=0, no hazards | 5-10 | 🟢 LOW |
| US-02 | Occupied moderate quake | PGA=0.12, vuln=0.5, occ=15, no hazards | 25-35 | 🟢 LOW / 🟡 MEDIUM |
| US-03 | Dangerous building | PGA=0.30, vuln=0.8, occ=50, smoke=true | 55-70 | 🟡 MEDIUM / 🟠 HIGH |
| US-04 | Maximum emergency | PGA=0.6, vuln=0.9, occ=100, fire+gas=true | 85-100 | 🔴 CRITICAL |
| US-05 | Stale data (offline) | Last data 10 min ago, confidence=0.3 | Score + boost | Confidence boost applied |
| US-06 | Score ranking | 5 buildings with different configs | Correct priority order | Most dangerous building ranked #1 |

## 6. System Integration Test Cases

| ID | Scenario | Steps | Expected Outcome |
|----|----------|-------|-----------------|
| SI-01 | End-to-end normal flow | Sensor publishes → MQTT → Server → Score → Dashboard | Dashboard shows updated building with correct score |
| SI-02 | Camera + Sensor together | Both occupancy and sensor data arrive | Combined urgency score calculated correctly |
| SI-03 | Multiple buildings | 5 buildings send data simultaneously | Dashboard shows all 5, sorted by priority |
| SI-04 | Dashboard real-time update | Score changes → WebSocket push | Dashboard updates within 3 seconds |
| SI-05 | Building goes offline | No data for 5 min | Dashboard shows "stale" warning, confidence decays |

## 7. Accuracy Metrics & Targets

### Occupancy Counting

| Metric | Formula | MVP Target | Production Target |
|--------|---------|------------|-------------------|
| **MAE** | mean(\|predicted - actual\|) | < 3 people | < 1 person |
| **MAPE** | mean(\|predicted - actual\| / actual) × 100% | < 20% | < 10% |
| **Precision** | TP / (TP + FP) | > 85% | > 95% |
| **Recall** | TP / (TP + FN) | > 80% | > 95% |
| **Direction Accuracy** | correct direction / total crossings | > 85% | > 95% |

### Urgency Score

| Metric | MVP Target |
|--------|------------|
| **Critical Recall** (of truly critical buildings flagged as critical) | > 90% |
| **False Critical Rate** (safe buildings flagged as critical) | < 15% |
| **Ranking Correlation** (Kendall tau vs expert ranking) | > 0.75 |

## 8. Latency Requirements

| Component | Target Latency |
|-----------|---------------|
| Sensor reading → MQTT publish | < 1 second |
| MQTT → Server receive | < 2 seconds |
| Server → Score calculation | < 500 ms |
| Score → Dashboard WebSocket push | < 1 second |
| **End-to-end** (sensor → dashboard) | **< 5 seconds** |

## 9. How to Create a Small Test Dataset

### 9.1 For Occupancy Testing

1. Record 10-minute video clips with phone at an entrance
2. Have friends walk in/out in controlled scenarios
3. Annotate manually: timestamp + direction + count
4. Run detector on video and compare

### 9.2 For Sensor Testing

1. Use the simulation script from ML_STRATEGY.md
2. Generate 1000+ synthetic readings
3. Calculate expected urgency scores manually for 20 sample rows
4. Compare with system output

### 9.3 For Communication Testing

1. Run Mosquitto locally: `docker run -p 1883:1883 eclipse-mosquitto`
2. Use MQTT Explorer (GUI tool) to publish test messages
3. Verify server receives and stores them

## 10. Test Logging Format

```json
{
  "test_id": "OC-01",
  "test_name": "Single person enters",
  "timestamp": "2026-05-20T10:30:00Z",
  "result": "PASS",
  "expected": {"delta": 1, "direction": "entry"},
  "actual": {"delta": 1, "direction": "entry"},
  "latency_ms": 245,
  "notes": "Detected at confidence 0.87"
}
```

Save all test results to `test_results.json` for the final report.
