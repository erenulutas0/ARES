# A-RES Project TODO List

## 🟢 Week 1: Research & Setup (In Progress)
- [x] Initial Research & Documentation (ARCHITECTURE, OCCUPANCY, ML, URGENCY, TEST, ROADMAP, RISKS)
- [x] Create `TODO.md` and `CHANGES.md`
- [x] Create Project Folder Structure (`src/`, `data/`, `notebooks/`)
- [x] Create `requirements.txt` and environment setup (Virtual Env created, packages installed)
- [x] USGS Earthquake Data Extraction Script/Notebook (826 events fetched)
- [x] Initial YOLO11n integration test (Passed)

## 🟡 Week 2: Occupancy Counting Prototype
- [x] Implement YOLO11n + ByteTrack pipeline (`src/edge/occupancy_counter.py`)
- [x] Virtual line crossing logic implementation
- [x] Add line-crossing hysteresis and MQTT sequence numbers for more stable demo events
- [ ] Test with video files & manual counting comparison
- [ ] Create a small annotated doorway video dataset: entry, exit, two people, turn-back, empty frame
- [x] Synthetic Simulator for occupancy & sensors (`src/edge/simulator.py`)
- [x] Urgency Score Engine implementation (`src/server/urgency_engine.py`)
- [x] Add local edge alarm decision module for immediate building-level warnings

## 🟡 Week 3: Central Server, Database & ML
- [x] FastAPI Backend Implementation (Robust Architecture)
- [x] PostgreSQL & Redis Docker Setup (`docker-compose.yml`)
- [x] Database Models & Connection Logic (`src/server/models.py`, `database.py`)
- [x] Urgency Score Engine implementation (Rule-based)
- [x] Synthetic Dataset Generation (10,000 scenarios)
- [x] ML Model Training (Random Forest) for Urgency Prediction
- [x] Basic Dashboard (WebSocket + Redis Integration)
- [x] Connect local alarm decisions to dashboard status cards
- [x] Serve web dashboard from FastAPI at `/dashboard`
- [x] Add static building vulnerability module and updated urgency score formula
- [x] Expose building vulnerability profile and factors on dashboard cards, overlay, and CSV export
- [x] Add authority terminal feed for AFAD-like third-laptop demo
- [x] Add HTTP ingest endpoints and demo edge sender for school-network testing
- [x] Add HTTP edge-to-authority latency probe for demo performance evidence
- [x] Add HTTP publishing mode to occupancy counter for phone-video demo
- [x] Integrate Figma frontend as one React app with Edge, Central, and Authority routes

## 🟡 Week 4: Data Analysis & Refinement
- [ ] USGS Global/Japan Data Analysis
- [ ] J-SHIS Hazard Data Mapping (if possible)
- [x] 5-Building Simulation Scenario (`simulator.py`)
- [x] Dashboard Polish & Map View (Responsive + Leaflet Map)
- [x] GitHub repository/tool selection table for Computer Engineering report
- [x] Optimization input schema and sample CSV for Industrial Engineering team
- [ ] Phone-camera doorway video test and manual-vs-detected count comparison
- [ ] Run HTTP edge sender from a second laptop to the central coordination laptop
- [ ] Run HTTP latency probe on school Wi-Fi and record min/avg/max latency
- [ ] Add final architecture figures to the shared Google Docs report
- [ ] Prepare 1-page CE summary for presentation slides
- [ ] Update Google Docs report with final CODEX + Claude/Gemini synthesis
- [x] Prepare three-laptop real testing and demo plan

## 🟡 Week 5: Integration & Final Testing
- [ ] Full System Integration Test
- [ ] Performance & Latency measurements
- [ ] Measure MQTT-to-dashboard latency with simulator events
- [ ] Run three-laptop demo: edge camera laptop → central laptop → authority laptop
- [ ] Test local alarm trigger scenarios (severe shaking, smoke, gas, high temperature)
- [ ] Final Bug Fixes
- [ ] Demo Video Recording
- [ ] Record 3-minute demo: simulator → MQTT → FastAPI → dashboard → urgency ranking

## 🟡 Week 6: Finalization
- [ ] Final Report (PDF)
- [ ] Presentation Slides
- [ ] Code Cleanup & Final Submission
