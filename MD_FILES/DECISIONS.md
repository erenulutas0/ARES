# Decision Log — A-RES Project

## Architecture Decisions

| ID | Decision | Alternatives Considered | Rationale | Date |
|----|----------|------------------------|-----------|------|
| AD-01 | **MQTT** for edge→server communication | REST, WebSocket, Kafka | MQTT is lightweight, supports QoS, designed for IoT, works on constrained networks. REST requires polling. Kafka is overkill for MVP. | 2026-05-09 |
| AD-02 | **FastAPI** for backend | Flask, Django, Express.js | Async support, automatic OpenAPI docs, Pydantic validation, WebSocket support built-in, Python ecosystem matches ML stack. | 2026-05-09 |
| AD-03 | **PostgreSQL** for persistent storage | MySQL, SQLite, MongoDB | Relational data (buildings, events, scores); JSONB support for flexible sensor data; time-series extensions available. SQLite for fallback. | 2026-05-09 |
| AD-04 | **Redis** for live state cache | In-memory dict, Memcached | Fast key-value store; pub/sub for scaling; TTL for stale data; well-supported by FastAPI. | 2026-05-09 |
| AD-05 | **WebSocket** for dashboard real-time updates | SSE, REST polling | Bi-directional, low-latency push; better than polling for real-time dashboard. | 2026-05-09 |
| AD-06 | **Eclipse Mosquitto** as MQTT broker | EMQX, HiveMQ, RabbitMQ | Lightweight, easy to install (Docker one-liner), sufficient for MVP scale (< 100 connections). | 2026-05-09 |

## Computer Vision Decisions

| ID | Decision | Alternatives Considered | Rationale | Date |
|----|----------|------------------------|-----------|------|
| CV-01 | **YOLO11n** as primary detection model | YOLOv8n, YOLOv8s, RT-DETR, MobileNet-SSD, EfficientDet | YOLO11n: fewer params than v8n (2.6M vs 3.2M), better mAP (39.5% vs 37.3%), faster on CPU. Latest Ultralytics release. | 2026-05-09 |
| CV-02 | **YOLOv8n** as fallback model | — | If YOLO11n has stability issues, v8n is proven, mature, widely used, extensively documented. | 2026-05-09 |
| CV-03 | **ByteTrack** as primary tracker | BoT-SORT, DeepSORT, OC-SORT | ByteTrack: fastest, no Re-ID model needed (simpler deployment), excellent occlusion handling via low-confidence box association. | 2026-05-09 |
| CV-04 | **Virtual line crossing** for direction detection | Zone-based counting, frame differencing | Simple, effective, well-understood. Works with single camera. Easy to implement and debug. | 2026-05-09 |
| CV-05 | Process video **locally on edge device** | Cloud-based processing, hybrid | Privacy requirement: no raw video leaves the device. Reduces bandwidth. GDPR/KVKK compliant. | 2026-05-09 |
| CV-06 | Send only **count_delta events**, not counts | Send absolute count every frame, send raw detections | Minimal bandwidth; deduplication easier; privacy-preserving; server maintains authoritative count. | 2026-05-09 |

## Data & ML Decisions

| ID | Decision | Alternatives Considered | Rationale | Date |
|----|----------|------------------------|-----------|------|
| ML-01 | **Rule-based urgency scoring** for MVP | ML-based scoring, neural network | No training data available initially; rule-based is transparent, auditable, and immediately deployable. ML can be added later. | 2026-05-09 |
| ML-02 | **PGA → MMI lookup table** for shaking severity | Train ML model on raw accelerometer data | Standard seismological mapping (Wald et al. 1999); no training needed; scientifically grounded. | 2026-05-09 |
| ML-03 | Use **USGS + Kaggle** as primary earthquake data | NIED K-NET only, JMA only | USGS is freely accessible via API without registration; Kaggle has curated CSVs ready for analysis. K-NET requires registration (use as secondary). | 2026-05-09 |
| ML-04 | **Pre-trained COCO model** for person detection | Fine-tune on custom dataset, train from scratch | COCO person class is well-represented; fine-tuning unnecessary for MVP accuracy targets. | 2026-05-09 |
| ML-05 | Use **data simulation** for MVP demo | Wait for real sensor data, use historical data only | Real earthquake data not available in real-time; simulation allows controlled testing and demo scenarios. | 2026-05-09 |

## Naming & Communication Decisions

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| NC-01 | Use "**anonymous occupancy estimation**" not "human recognition" | We don't identify individuals; we count entries/exits. This is privacy-preserving and KVKK/GDPR compliant. | 2026-05-09 |
| NC-02 | Use "**urgency score**" not "damage prediction" | We don't predict structural damage — we estimate response priority based on available signals. Avoids overclaiming. | 2026-05-09 |
| NC-03 | Explicitly state "**we do not predict earthquakes**" | Earthquake prediction is scientifically impossible at current state. We respond to earthquakes, not predict them. | 2026-05-09 |
| NC-04 | Use "**priority classification**" not "AI diagnosis" | System is a decision support tool, not a diagnostic system. Emergency teams make final decisions. | 2026-05-09 |
