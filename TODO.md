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
- [x] Synthetic Simulator for occupancy & sensors (`src/edge/simulator.py`)
- [x] Urgency Score Engine implementation (`src/server/urgency_engine.py`)

## 🟡 Week 3: Central Server, Database & ML
- [x] FastAPI Backend Implementation (Robust Architecture)
- [x] PostgreSQL & Redis Docker Setup (`docker-compose.yml`)
- [x] Database Models & Connection Logic (`src/server/models.py`, `database.py`)
- [x] Urgency Score Engine implementation (Rule-based)
- [x] Synthetic Dataset Generation (10,000 scenarios)
- [x] ML Model Training (Random Forest) for Urgency Prediction
- [x] Basic Dashboard (WebSocket + Redis Integration)

## 🟡 Week 4: Data Analysis & Refinement
- [ ] USGS Global/Japan Data Analysis
- [ ] J-SHIS Hazard Data Mapping (if possible)
- [x] 5-Building Simulation Scenario (`simulator.py`)
- [x] Dashboard Polish & Map View (Responsive + Leaflet Map)
- [x] GitHub repository/tool selection table for Computer Engineering report
- [x] Optimization input schema and sample CSV for Industrial Engineering team
- [ ] Phone-camera doorway video test and manual-vs-detected count comparison

## 🟡 Week 5: Integration & Final Testing
- [ ] Full System Integration Test
- [ ] Performance & Latency measurements
- [ ] Final Bug Fixes
- [ ] Demo Video Recording

## 🟡 Week 6: Finalization
- [ ] Final Report (PDF)
- [ ] Presentation Slides
- [ ] Code Cleanup & Final Submission
