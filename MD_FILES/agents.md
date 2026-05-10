# AGENTS.md

## Project Name
A-RES: Adaptive Response & Earthquake Resilience System

## Project Goal
A-RES is a university Applied Project Management project that turns buildings into "talking buildings" during and after earthquakes.

The system estimates:
- Building shaking / possible damage risk
- Number of people inside the building
- Fire, smoke, or gas danger
- Emergency response urgency score

The final goal is to prioritize rescue teams, firefighters, ambulances, and disaster response teams.

## Important Rule
Do not claim that the system predicts earthquakes before they happen.
Do not claim that AI can perfectly detect structural damage.
The system estimates risk and priority using sensor fusion.

## Main MVP Components
1. Edge sensor box
2. Entrance camera-based anonymous occupancy estimation
3. MQTT/WebSocket communication
4. Central server
5. Urgency score engine
6. Dashboard

## Occupancy Estimation
Use the term "anonymous occupancy estimation", not "human recognition".
The system must not identify people or recognize faces.

Expected computer vision pipeline:
Camera → Person detection → Tracking → Virtual line crossing → Entry/exit count event → Central server

Recommended baseline:
- YOLOv8n or YOLO11n for person detection
- ByteTrack or BoT-SORT for tracking
- OpenCV line crossing logic
- MQTT for sending count_delta events

Only send updates when occupancy changes.

## Privacy
Raw video should not be sent to the central server.
Video should be processed locally on the edge device.
The central system should receive only anonymized count events.

## Dataset Strategy
Japan is the main reference country.
Global earthquake data can be used for generalization.
Japan-specific data should be used for calibration.

Recommended data sources:
- USGS Earthquake Catalog
- Kaggle earthquake datasets
- NIED K-NET / KiK-net
- J-SHIS
- JMA EEW concept
- FDSN services
- COCO / CrowdHuman / MOT17 / MOT20 for people detection/tracking

## Coding Style
- Keep the MVP simple and realistic.
- Prefer readable code over complex abstractions.
- Add tests for critical logic.
- Write clear comments for algorithms.
- Separate edge code, backend code, and dashboard code.

## Backend Preferences
Suggested stack:
- Python FastAPI
- MQTT broker
- PostgreSQL for persistent data
- Redis for current building state
- WebSocket for dashboard updates

## Testing Requirements
Add tests for:
- Entry count
- Exit count
- Duplicate event handling
- Offline buffering
- MQTT disconnect
- Camera failure
- Server restart
- Urgency score calculation

## Deliverables
The project should produce:
- Working MVP demo
- Architecture documentation
- Dataset research report
- Occupancy model comparison
- Test plan
- Risk register
- Final presentation content