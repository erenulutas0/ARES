# Risk Register — A-RES Project

## 1. Technical Risks

| ID | Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation | Owner |
|----|------|:-:|:-:|:-:|-----------|-------|
| TR-01 | YOLO11n model unavailable or incompatible | 2 | 3 | 6 | Fall back to YOLOv8n (proven, well-documented) | CE |
| TR-02 | ByteTrack tracking loses IDs in crowds | 3 | 3 | 9 | Limit to single-entrance scenarios for MVP; tune tracker params | CE |
| TR-03 | MQTT message loss during network outage | 3 | 4 | 12 | QoS 1 + local buffer on edge device + dedup on server | CE |
| TR-04 | PostgreSQL crashes under load | 1 | 4 | 4 | Use SQLite fallback for MVP; proper indexing; connection pooling | CE |
| TR-05 | Dashboard WebSocket drops frequently | 2 | 2 | 4 | Implement auto-reconnect with exponential backoff | CE |
| TR-06 | ESP32 sensor readings noisy/inaccurate | 3 | 3 | 9 | Apply moving average filter; calibrate against known values | CE + ME |
| TR-07 | Camera detection accuracy too low | 2 | 4 | 8 | Fine-tune confidence threshold; try multiple YOLO variants | CE |
| TR-08 | J-SHIS / NIED APIs inaccessible from Turkey | 4 | 2 | 8 | Use static downloaded data or screenshots for demo | CE |
| TR-09 | Urgency score formula produces counterintuitive results | 2 | 3 | 6 | Test with 20+ scenarios manually; adjust weights | CE + IE |
| TR-10 | Edge device (RPi) overheats or crashes during inference | 2 | 3 | 6 | Use laptop for MVP demo; optimize model (ONNX export) | CE |

## 2. Project Management Risks

| ID | Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation | Owner |
|----|------|:-:|:-:|:-:|-----------|-------|
| PM-01 | Team members unavailable due to exams | 4 | 3 | 12 | Clear task ownership; async communication; early deadlines | PM |
| PM-02 | Scope creep (adding too many features) | 3 | 4 | 12 | Strict MVP definition; "nice-to-have" list separated | PM |
| PM-03 | Cross-department coordination delays | 3 | 3 | 9 | Weekly sync meetings; clear interface specifications | PM |
| PM-04 | Late hardware procurement | 3 | 4 | 12 | Use simulation/software demo; order early | PM + IE |
| PM-05 | Report writing takes too long | 3 | 3 | 9 | MD files in this repo ARE the report; convert to PDF at end | PM + CE |

## 3. Data & Research Risks

| ID | Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation | Owner |
|----|------|:-:|:-:|:-:|-----------|-------|
| DR-01 | Insufficient earthquake data for meaningful analysis | 2 | 3 | 6 | USGS has millions of records; Kaggle has curated CSVs | CE |
| DR-02 | No suitable entrance camera video dataset | 2 | 3 | 6 | Record own videos with phone; use MOT17/PETS2009 | CE |
| DR-03 | Data simulation not realistic enough | 3 | 2 | 6 | Base simulation on real PGA distributions from USGS data | CE |
| DR-04 | KVKK/GDPR privacy concerns raised | 1 | 4 | 4 | No personal data collected; anonymized counts only; signage | PM + CE |

## 4. Risk Matrix Visualization

```
Impact →
    5 │         │         │         │ TR-03   │         │
    4 │         │         │ PM-02   │ PM-04   │         │
      │         │         │ PM-01   │         │         │
    3 │         │ TR-09   │ TR-02   │         │         │
      │         │ TR-10   │ TR-06   │         │         │
      │         │ TR-01   │ PM-03   │         │         │
    2 │         │ TR-05   │ TR-08   │         │         │
      │         │         │ DR-03   │         │         │
    1 │         │ DR-04   │         │         │         │
      └─────────┴─────────┴─────────┴─────────┴─────────┘
        1         2         3         4         5
                          Likelihood →
```

## 5. SWOT Analysis (Technical)

### Strengths
- 🟢 All software components are free/open-source
- 🟢 YOLO + ByteTrack is well-proven for people counting
- 🟢 USGS provides massive free earthquake data via API
- 🟢 MQTT is industry standard for IoT — lightweight, reliable
- 🟢 Rule-based urgency scoring is transparent and auditable
- 🟢 No personal data collected — clean privacy story

### Weaknesses
- 🟡 No real earthquake testing possible (simulation only)
- 🟡 Single-camera occupancy counting has blind spots
- 🟡 Team has limited computer vision experience
- 🟡 Limited time for ML optimization
- 🟡 No structural engineering validation of vulnerability indices

### Opportunities
- 🔵 Could be extended to real IoT deployment (Jetson + real sensors)
- 🔵 Japan earthquake data (K-NET) is world-class — strong reference
- 🔵 Dashboard could become a real product for AFAD
- 🔵 Open-source publication could generate academic citations
- 🔵 Scalable architecture supports future growth

### Threats
- 🔴 Overclaiming AI capabilities → academic credibility risk
- 🔴 Network unreliability after real earthquakes (assumption risk)
- 🔴 Better existing systems (JMA, ShakeAlert) make comparison unfavorable
- 🔴 Sensor hardware malfunction during demo → no fallback
- 🔴 Time pressure from other courses → incomplete deliverables
