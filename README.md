# A-RES: Adaptive Response and Earthquake Resilience System

[![A-RES CI](https://github.com/erenulutas0/ARES/actions/workflows/ci.yml/badge.svg)](https://github.com/erenulutas0/ARES/actions/workflows/ci.yml)

A-RES is an Applied Project Management prototype that helps emergency teams prioritize buildings after an earthquake. The system combines IoT sensor data, anonymous occupancy estimation, and a transparent urgency scoring model to answer one practical question:

> Which building needs help first?

The project is designed as a university-level proof of concept for smart, earthquake-resilient building networks. It does not predict earthquakes and does not certify structural safety. Instead, it provides decision support using live signals from buildings.

## Problem

After a major earthquake, response teams face incomplete and delayed information:

- Which buildings experienced the strongest shaking?
- Which buildings still have people inside?
- Is there a secondary hazard such as fire, smoke, or gas leakage?
- Where should limited rescue teams go first?

A-RES turns buildings into real-time status reporters and ranks them by emergency priority.

## Core Idea

Each building has an edge sensor/camera unit:

- Structural and environmental sensors estimate shaking and hazards.
- An entrance camera estimates anonymous occupancy through person counting.
- Only numeric events are sent to the server; raw video is not transmitted.
- The central server calculates an urgency score from 0 to 100.
- The dashboard sorts buildings by priority for emergency response.

## System Architecture

```text
Sensor Box / Camera Edge Device
        |
        | MQTT events
        v
Mosquitto MQTT Broker
        |
        v
FastAPI Central Server
        |
        | Urgency score + live state
        v
Web / Mobile Dashboard
```

### Main Components

| Component | Technology | Purpose |
|---|---|---|
| Occupancy estimation | YOLO11n + ByteTrack | Count entries/exits at building entrances |
| IoT messaging | MQTT + Mosquitto + Paho | Send sensor and occupancy events |
| Backend | FastAPI | Receive events and serve live building state |
| Scoring | Rule-based urgency engine | Rank buildings transparently |
| Dashboard | HTML/JS + WebSocket | Show real-time triage list and map view |
| Data analysis | Python notebooks | Earthquake and synthetic scenario analysis |

## Urgency Score

The urgency score is a 0-100 value calculated from:

| Factor | Meaning |
|---|---|
| PGA | Local shaking severity from accelerometer data |
| Occupancy | Estimated people still inside the building |
| Fire/smoke | Secondary hazard signal |
| Gas leak | Secondary hazard signal |
| Vulnerability | Building risk proxy based on age/type/context |
| Data confidence | Whether the latest data is fresh and reliable |

Priority levels:

| Score | Priority | Action |
|---:|---|---|
| 0-30 | LOW | Monitor |
| 31-60 | MEDIUM | Inspect when available |
| 61-80 | HIGH | Dispatch rescue/fire team |
| 81-100 | CRITICAL | Immediate response |

## Repository Structure

```text
APM-Code/
  MD_FILES/              Project report and technical documentation
  data/                  Synthetic and optimization-ready datasets
  notebooks/             Earthquake/data analysis scripts
  src/
    edge/                Occupancy counter and simulator
    server/              FastAPI backend and urgency engine
    dashboard/           Web dashboard prototype
    mobile_app_code/     Mobile dashboard code draft
  tests/                 Unit and integration tests
  .github/workflows/     CI pipeline
```

## This Week's Computer Engineering Deliverables

- Stabilized the occupancy counting logic with line-crossing hysteresis.
- Added MQTT sequence numbers for occupancy events.
- Created a GitHub repository selection report for the technologies used.
- Created an optimization-ready sample dataset for the Industrial Engineering team.
- Added lightweight CI tests for scoring logic and data validity.
- Defined the phone-camera test plan for validating entrance counting.

Key files:

- `MD_FILES/COMPUTER_ENGINEERING_WEEK_PLAN.md`
- `MD_FILES/GITHUB_REPOSITORY_SELECTION.md`
- `MD_FILES/OPTIMIZATION_DATA_PACKAGE.md`
- `data/optimization_input_template.csv`
- `src/edge/occupancy_counter.py`

## Quick Start

### 1. Create environment

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run tests

```bash
pytest -q
```

### 3. Start backend

```bash
uvicorn src.server.main:app --reload
```

Open the dashboard:

```text
http://localhost:8000/dashboard
```

Open the authority terminal for an AFAD-like receiving laptop:

```text
http://localhost:8000/authority
```

### 4. Run mock multi-building simulation

```bash
python src/edge/simulator.py
```

### 5. Run occupancy counter on a video

```bash
python src/edge/occupancy_counter.py --source path/to/doorway_video.mp4
```

For the three-laptop demo, first register the mock building profile on the central laptop:

```bash
python -m src.edge.demo_sender --central-url http://CENTRAL_LAPTOP_IP:8000 --building-id DEMO-001 --occupancy 0
```

Then run the phone-recorded doorway video and publish anonymous occupancy counts over HTTP:

```bash
python -m src.edge.occupancy_counter --source path/to/doorway_video.mp4 --transport http --central-url http://CENTRAL_LAPTOP_IP:8000 --building-id DEMO-001
```

## Phone Camera Test Plan

For the MVP, the phone is used as a practical camera source:

1. Mount the phone above or near a doorway.
2. Record short entry/exit clips.
3. Run the video through the laptop-based YOLO + ByteTrack script.
4. Compare manual count vs system count.
5. Publish count events through MQTT.
6. Show updated occupancy and urgency score on the dashboard.

This approach avoids risky on-device ML setup while still proving the actual occupancy counting concept.

## Three-Laptop Demo Plan

For a realistic presentation, A-RES can run across three laptops:

1. Edge hub laptop: runs the camera/occupancy pipeline and publishes anonymous count events.
2. Central coordination laptop: runs FastAPI, dashboard, urgency score, and authority feed.
3. Authority laptop: opens `/authority` and acts as the AFAD-like receiving terminal.

On the central laptop, run the server with network access:

```bash
uvicorn src.server.main:app --host 0.0.0.0 --port 8000
```

Then other laptops can open:

```text
http://CENTRAL_LAPTOP_IP:8000/dashboard
http://CENTRAL_LAPTOP_IP:8000/authority
```

From the edge laptop, mock sensor and occupancy data can be sent directly to the central laptop:

```bash
python -m src.edge.demo_sender --central-url http://CENTRAL_LAPTOP_IP:8000 --building-id DEMO-001 --occupancy 18
```

To simulate a fire/gas emergency when the physical sensor is not available:

```bash
python -m src.edge.demo_sender --central-url http://CENTRAL_LAPTOP_IP:8000 --building-id DEMO-001 --occupancy 18 --smoke --gas
```

To measure edge-to-authority demo latency:

```bash
python -m src.edge.latency_probe --central-url http://CENTRAL_LAPTOP_IP:8000 --samples 10
```

## Open-Source Stack

| Project | Role |
|---|---|
| Ultralytics YOLO | Person detection and tracking API |
| ByteTrack | Multi-object tracking method |
| Eclipse Mosquitto | MQTT broker |
| Eclipse Paho MQTT Python | MQTT client |
| FastAPI | Central API and WebSocket server |
| pandas / scikit-learn | Data analysis and optional ML baseline |

## Academic Scope and Limitations

A-RES is a decision-support prototype. It intentionally avoids unsafe claims:

- It does not predict earthquakes.
- It does not replace civil engineers.
- It does not identify people or use face recognition.
- It does not guarantee exact structural damage diagnosis.

The system prioritizes emergency response based on available signals and clearly reports uncertainty.

## Team

Istanbul Beykent University, Faculty of Engineering and Architecture

| Member | Department | Role |
|---|---|---|
| M. Akif Guloglu | Industrial Engineering | Project Manager |
| Sepideh Aghajani | Computer Engineering | IoT and AI Systems |
| M. Abdallah Salim | Civil Engineering | Structural Design |
| Eya Hajkacem | Industrial Engineering | Adaptive Damping |
| Alen Asik | Interior Architecture | Interior Layout |
| Sudem Ustahuseyinoglu | Industrial Design | Sensor Unit Design |

## License

Academic project for Istanbul Beykent University, 2026.
