# A-RES System Architecture

## 1. High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DASHBOARD LAYER                              │
│  React/Next.js Dashboard ← WebSocket ← FastAPI                     │
│  • Priority-sorted building list    • Real-time map                │
│  • Urgency scores (0-100)           • Alert notifications          │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ WebSocket (wss://)
┌──────────────────────────────────┴──────────────────────────────────┐
│                     CENTRAL SERVER LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ FastAPI   │  │ Urgency  │  │ PostgreSQL│  │ Redis            │  │
│  │ Backend   │  │ Score    │  │ (history) │  │ (live state)     │  │
│  │          │  │ Engine   │  │           │  │                  │  │
│  └────┬─────┘  └──────────┘  └───────────┘  └──────────────────┘  │
│       │                                                             │
│  ┌────┴─────────────────────────┐                                   │
│  │ MQTT Subscriber (paho-mqtt) │                                    │
│  └────┬─────────────────────────┘                                   │
└───────┼─────────────────────────────────────────────────────────────┘
        │ MQTT (mqtts://)
┌───────┼─────────────────────────────────────────────────────────────┐
│       │           NETWORK / TRANSPORT LAYER                         │
│  ┌────┴──────────┐                                                  │
│  │ Mosquitto     │  Topics:                                         │
│  │ MQTT Broker   │  • ares/building/{id}/sensor                    │
│  │               │  • ares/building/{id}/occupancy                 │
│  │               │  • ares/building/{id}/status                    │
│  └───────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────┘
        ▲                              ▲
        │ MQTT Publish                 │ MQTT Publish
┌───────┴──────────┐          ┌────────┴─────────────┐
│  EDGE: SENSOR    │          │  EDGE: CAMERA        │
│  BOX (ESP32)     │          │  DEVICE              │
│                  │          │  (RPi / Mini PC)     │
│ • Accelerometer  │          │                      │
│ • Smoke/Gas      │          │ • USB Camera         │
│ • Temperature    │          │ • YOLO11n detection  │
│ • Humidity       │          │ • ByteTrack tracking │
│ • Offline buffer │          │ • Line crossing      │
│                  │          │ • Count delta → MQTT │
└──────────────────┘          └──────────────────────┘
       BUILDING N                    BUILDING N
```

## 2. Layer Descriptions

### 2.1 Edge Layer — Sensor Box (ESP32-based)

| Component | Purpose |
|-----------|---------|
| MPU6050 / ADXL345 | Acceleration / vibration measurement |
| MQ-2 | Smoke & flammable gas detection |
| MQ-7 | Carbon monoxide detection |
| DS18B20 | Temperature monitoring |
| BME280 | Temperature + humidity + pressure |
| ESP32 | Wi-Fi/BT MCU, runs MicroPython or Arduino |

**Offline Buffering Strategy:**
- ESP32 has limited SPIFFS/LittleFS storage (~1-4 MB)
- Buffer last 1000 sensor readings in circular buffer
- When MQTT connection restores, flush buffer with original timestamps
- Each message has a `sequence_number` for deduplication

**Message Format (Sensor → MQTT):**
```json
{
  "building_id": "B-001",
  "hub_id": "HUB-001",
  "timestamp": "2026-05-09T14:30:00Z",
  "seq": 42,
  "accel_x": 0.12,
  "accel_y": -0.08,
  "accel_z": 9.81,
  "pga": 0.15,
  "temperature": 28.5,
  "humidity": 65.2,
  "pressure": 1013.25,
  "smoke_level": 120,
  "co_level": 5,
  "gas_detected": false,
  "smoke_detected": false,
  "battery_pct": 87
}
```

### 2.2 Edge Layer — Camera Device (Raspberry Pi / Mini PC)

- Runs YOLO11n + ByteTrack locally
- Processes video at 10-15 FPS on RPi 4 / 25+ FPS on mini PC
- **Does NOT stream video** to central server (privacy)
- Only sends anonymized count delta events

**Message Format (Camera → MQTT):**
```json
{
  "building_id": "B-001",
  "camera_id": "CAM-001",
  "timestamp": "2026-05-09T14:30:00Z",
  "seq": 15,
  "event_type": "count_delta",
  "delta": +2,
  "current_count": 47,
  "direction": "entry",
  "confidence": 0.92,
  "fps": 12.5
}
```

### 2.3 Network / Transport Layer

**Protocol: MQTT v5 over TLS**

| Parameter | Value |
|-----------|-------|
| Broker | Eclipse Mosquitto (self-hosted) |
| Port | 8883 (TLS) |
| QoS | 1 (at-least-once delivery) |
| Keep-alive | 60 seconds |
| Clean Session | false (persistent sessions) |

**Why MQTT over REST/WebSocket:**
- Lightweight (2-byte header minimum)
- Works well on constrained networks
- Built-in QoS and retained messages
- Pub/Sub model perfect for many-to-one sensor data
- Offline queuing with QoS 1/2

**Topic Structure:**
```
ares/building/{building_id}/sensor      → sensor readings
ares/building/{building_id}/occupancy   → occupancy count deltas
ares/building/{building_id}/status      → device heartbeat/health
ares/system/alerts                      → system-wide alerts
```

### 2.4 Central Server Layer

**Technology Stack:**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Server | Python FastAPI | REST API + WebSocket server |
| MQTT Client | paho-mqtt (async) | Subscribe to all building topics |
| Database | PostgreSQL 16 | Historical data, events, building registry |
| Cache | Redis 7 | Live building state, current occupancy, last readings |
| Task Queue | (Optional) Celery | Heavy ML tasks if needed |

**Data Flow:**
```
MQTT Message → paho-mqtt subscriber → validate (Pydantic)
  → deduplicate (check seq in Redis)
  → store in PostgreSQL (append-only events table)
  → update Redis (current state hash per building)
  → recalculate urgency score
  → push to dashboard via WebSocket
```

### 2.5 Dashboard Layer

**Technology:** React + Chart.js / Leaflet.js

**Key Views:**
1. **Priority List** — Buildings sorted by urgency score (highest first)
2. **Map View** — Color-coded building markers on a map
3. **Building Detail** — Drill-down: sensor readings, occupancy history, alerts
4. **Alert Panel** — Real-time notifications for critical events

## 3. Database Design

### PostgreSQL Schema

```sql
-- Building registry
CREATE TABLE buildings (
    id              VARCHAR(20) PRIMARY KEY,
    name            VARCHAR(100),
    address         TEXT,
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    building_type   VARCHAR(50),     -- residential, commercial, hospital
    year_built      INTEGER,
    floors          INTEGER,
    structural_type VARCHAR(50),     -- reinforced_concrete, masonry, steel
    vulnerability   DECIMAL(3,2),    -- 0.00-1.00 base vulnerability score
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Sensor readings (append-only, time-series)
CREATE TABLE sensor_readings (
    id              BIGSERIAL PRIMARY KEY,
    building_id     VARCHAR(20) REFERENCES buildings(id),
    hub_id          VARCHAR(20),
    timestamp       TIMESTAMP NOT NULL,
    seq             INTEGER,
    accel_x         REAL,
    accel_y         REAL,
    accel_z         REAL,
    pga             REAL,
    temperature     REAL,
    humidity        REAL,
    pressure        REAL,
    smoke_level     INTEGER,
    co_level        INTEGER,
    gas_detected    BOOLEAN,
    smoke_detected  BOOLEAN,
    received_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE(building_id, hub_id, seq)   -- dedup constraint
);

-- Occupancy events
CREATE TABLE occupancy_events (
    id              BIGSERIAL PRIMARY KEY,
    building_id     VARCHAR(20) REFERENCES buildings(id),
    camera_id       VARCHAR(20),
    timestamp       TIMESTAMP NOT NULL,
    seq             INTEGER,
    delta           INTEGER,          -- +N or -N
    current_count   INTEGER,
    confidence      REAL,
    received_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE(building_id, camera_id, seq)
);

-- Urgency score history
CREATE TABLE urgency_scores (
    id              BIGSERIAL PRIMARY KEY,
    building_id     VARCHAR(20) REFERENCES buildings(id),
    timestamp       TIMESTAMP NOT NULL,
    score           INTEGER,          -- 0-100
    shaking_score   REAL,
    occupancy_score REAL,
    hazard_score    REAL,
    confidence      REAL,
    priority_level  VARCHAR(10),      -- LOW, MEDIUM, HIGH, CRITICAL
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Create indexes for time-series queries
CREATE INDEX idx_sensor_ts ON sensor_readings(building_id, timestamp);
CREATE INDEX idx_occupancy_ts ON occupancy_events(building_id, timestamp);
CREATE INDEX idx_urgency_ts ON urgency_scores(building_id, timestamp);
```

### Redis Data Structure

```
# Current state per building (Hash)
HSET building:B-001:state
    occupancy       47
    last_pga        0.15
    smoke_detected  false
    gas_detected    false
    fire_detected   false
    last_update     "2026-05-09T14:30:00Z"
    urgency_score   35
    priority        "MEDIUM"
    sensor_online   true
    camera_online   true

# Deduplication tracking (SET with TTL)
SADD dedup:B-001:HUB-001 42 43 44
EXPIRE dedup:B-001:HUB-001 3600
```

## 4. Failure Handling

| Failure Scenario | Handling Strategy |
|------------------|-------------------|
| **Internet down (edge)** | ESP32 buffers to SPIFFS; RPi buffers to SQLite; flush on reconnect |
| **MQTT broker down** | FastAPI retries connection with exponential backoff; edge devices queue locally |
| **Central server crash** | Systemd auto-restart; PostgreSQL WAL ensures no data loss; Redis AOF persistence |
| **Duplicate events** | UNIQUE constraint on (building_id, device_id, seq); Redis-based dedup check |
| **Clock skew** | NTP sync on all devices; server records `received_at` alongside device `timestamp` |
| **Camera failure** | Heartbeat monitoring; dashboard shows "camera offline" with stale confidence decay |
| **Sensor failure** | Watchdog timer; heartbeat every 30s; mark sensor offline after 3 missed heartbeats |
| **Power outage** | ESP32 can run on battery; UPS recommended for RPi; graceful shutdown with buffer flush |

## 5. Scaling Strategy

| Scale | Architecture |
|-------|-------------|
| **1-5 buildings (MVP)** | Single Mosquitto + single FastAPI + single PostgreSQL, all on one server |
| **5-50 buildings** | Separate MQTT broker, use Redis Pub/Sub for horizontal FastAPI scaling |
| **50-1000 buildings** | EMQX cluster for MQTT; Kafka for event streaming; TimescaleDB for time-series |

## 6. Security & Privacy

- **No raw video** ever leaves the edge device
- MQTT over TLS (port 8883)
- API authentication via JWT tokens
- Dashboard behind login
- KVKK/GDPR compliant: only anonymized count numbers transmitted
- Sensor data contains no personal information
- Building-level data (not person-level) stored

## 7. MVP vs Future

| Feature | MVP | Future |
|---------|-----|--------|
| Sensor box (ESP32 + sensors) | ✅ Simulated or 1 real unit | Multiple units per building |
| Camera occupancy counting | ✅ Video file demo | Live camera + RPi |
| MQTT communication | ✅ Mosquitto on laptop/server | Cloud MQTT cluster |
| Central server | ✅ FastAPI on laptop | Cloud deployment |
| Urgency scoring | ✅ Rule-based formula | ML-optimized scoring |
| Dashboard | ✅ Basic React with map | Full command center |
| Offline buffering | ✅ Basic queue | Robust edge storage |
| Multi-building | ✅ 3-5 simulated buildings | 1000+ real buildings |
| Mobile alerts | ❌ | Push notifications |
| Historical analytics | ❌ | Trend analysis, reports |
