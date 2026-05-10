# A-RES Implementation Roadmap

> Timeline: May 9, 2026 → June 15, 2026 (5.5 weeks)
> Team: Computer Engineering (Sepideh) + Industrial Engineering (Akif as PM) + Others

## Week 1: May 9-15 — Research & Architecture Finalization

### Tasks
| Task | Owner | Deliverable |
|------|-------|------------|
| Finalize system architecture document | CE (Sepideh) | ARCHITECTURE.md ✅ |
| Dataset source research & catalog | CE (Sepideh) | Dataset report (this repo) |
| YOLO model selection & initial test | CE (Sepideh) | OCCUPANCY_SYSTEM.md ✅ |
| Urgency score formula design | CE + IE together | URGENCY_SCORE.md ✅ |
| Set up Git repository structure | CE (Sepideh) | Working repo |
| Install Python environment + dependencies | CE (Sepideh) | requirements.txt |
| Download & explore USGS earthquake data | CE (Sepideh) | Jupyter notebook |
| Review hardware component list | IE (Akif) | Procurement check |

### Deliverables
- [x] Architecture document
- [x] ML strategy document
- [x] Urgency score design
- [x] Occupancy system design
- [x] Test plan
- [ ] USGS data exploration notebook
- [ ] Environment setup

### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Too much time on research, not enough on building | Timebox research to 3 days, then start coding |
| Team members unavailable due to other exams | Async communication, clear task ownership |

---

## Week 2: May 16-22 — Occupancy Counting Prototype

### Tasks
| Task | Owner | Deliverable |
|------|-------|------------|
| Set up YOLO11n + ByteTrack pipeline | CE (Sepideh) | Working Python script |
| Implement virtual line crossing logic | CE (Sepideh) | Counting algorithm |
| Test on pre-recorded video files | CE (Sepideh) | Test results |
| Record 3-5 test videos (phone at doorway) | Team (anyone) | Test video files |
| Set up MQTT broker (Mosquitto via Docker) | CE (Sepideh) | Running broker |
| Implement MQTT publish from counter | CE (Sepideh) | Events flowing |
| Download & process Kaggle earthquake CSV | CE (Sepideh) | Cleaned dataset |
| Begin sensor data simulator | CE (Sepideh) | simulator.py |

### Deliverables
- [ ] Occupancy counting script (video → count)
- [ ] MQTT event publishing from counter
- [ ] 3-5 test video recordings
- [ ] Kaggle earthquake data notebook
- [ ] Sensor data simulator script

### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| YOLO11n not available or buggy | Fall back to YOLOv8n (proven, stable) |
| No test videos | Use MOT17 benchmark videos or YouTube clips |
| Docker not available on team laptops | Use local Mosquitto install or cloud MQTT broker |

---

## Week 3: May 23-29 — Central Server + Dashboard

### Tasks
| Task | Owner | Deliverable |
|------|-------|------------|
| Build FastAPI backend (MQTT subscriber) | CE (Sepideh) | Working API server |
| Set up PostgreSQL + Redis | CE (Sepideh) | Database running |
| Implement urgency score engine | CE (Sepideh) | Scoring endpoint |
| Build basic dashboard (React or plain HTML) | CE (Sepideh) | Dashboard page |
| WebSocket connection for real-time updates | CE (Sepideh) | Live dashboard |
| Building registry CRUD API | CE (Sepideh) | REST endpoints |
| Connect occupancy counter → MQTT → Server | CE (Sepideh) | End-to-end data flow |
| IE team: project management docs update | IE (Akif) | Updated Gantt, status |

### Deliverables
- [ ] FastAPI backend with MQTT subscriber
- [ ] PostgreSQL schema deployed
- [ ] Urgency score calculation working
- [ ] Basic dashboard showing building list
- [ ] WebSocket real-time updates working
- [ ] End-to-end: camera → MQTT → server → dashboard

### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Too many features → scope creep | MVP dashboard: just a sorted list + map |
| Database setup issues | Use SQLite for MVP if PostgreSQL is problematic |
| WebSocket complexity | Start with REST polling (every 5s), upgrade to WS later |

---

## Week 4: May 30 - June 5 — Earthquake Data Analysis + Scoring Engine

### Tasks
| Task | Owner | Deliverable |
|------|-------|------------|
| USGS data analysis (magnitude, depth, PGA) | CE (Sepideh) | Analysis notebook |
| J-SHIS hazard data exploration (if API works) | CE (Sepideh) | Hazard map analysis |
| Simulate 5-building earthquake scenario | CE (Sepideh) | Demo scenario |
| Run urgency scoring on simulated data | CE (Sepideh) | Score results |
| Dashboard polish (colors, map, animations) | CE (Sepideh) | Polished UI |
| Sensor data → MQTT → Score → Dashboard full demo | CE (Sepideh) | Demo video draft |
| IE team: risk register, SWOT update | IE (Akif) | Updated docs |

### Deliverables
- [ ] Earthquake data analysis notebook with visualizations
- [ ] 5-building simulation running through entire pipeline
- [ ] Dashboard with map view and color-coded priorities
- [ ] Draft demo video (screen recording)

### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| J-SHIS API not accessible from Turkey | Use static J-SHIS data or screenshots for presentation |
| NIED registration takes too long | Use USGS + Kaggle data only for MVP |
| Dashboard looks bad | Use a CSS framework (e.g., Pico CSS, Simple.css) for quick polish |

---

## Week 5: June 6-12 — Integration + Testing

### Tasks
| Task | Owner | Deliverable |
|------|-------|------------|
| Run all test cases from TEST_PLAN.md | CE (Sepideh) | Test results JSON |
| Fix bugs found during testing | CE (Sepideh) | Bug fixes |
| Run occupancy counting on all test videos | CE (Sepideh) | Accuracy metrics |
| Edge case testing (offline, duplicates, etc.) | CE (Sepideh) | Test results |
| Performance testing (latency measurements) | CE (Sepideh) | Latency report |
| Final dashboard refinements | CE (Sepideh) | Production-ready UI |
| Record demo video (full system walkthrough) | Team | Demo video |
| Write technical sections of final report | CE (Sepideh) | Report draft |

### Deliverables
- [ ] Test results (pass/fail for all test cases)
- [ ] Accuracy metrics for occupancy counting
- [ ] Performance/latency measurements
- [ ] Demo video (3-5 minutes)
- [ ] Technical report sections (architecture, CV, scoring)

### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Too many bugs to fix | Prioritize critical path: sensor → score → dashboard |
| Demo video quality poor | Record multiple takes, use OBS Studio for screen recording |
| Report writing takes too long | Use this repo's MD files as the basis — they ARE the report |

---

## Week 6: June 13-15 — Report + Presentation + Submission

### Tasks
| Task | Owner | Deliverable |
|------|-------|------------|
| Finalize written report | All | PDF report |
| Create presentation slides | IE (Akif) + CE (Sepideh) | PowerPoint/PDF |
| Practice presentation | All | Rehearsal |
| Submit all deliverables | PM (Akif) | Submission confirmed |
| Clean up code repository | CE (Sepideh) | Clean repo + README |

### Deliverables
- [ ] Final written report (PDF)
- [ ] Presentation slides
- [ ] Demo video (final cut)
- [ ] Code repository (GitHub)
- [ ] All documentation files

---

## Critical Path

```
Week 1: Architecture + Research
    ↓
Week 2: Occupancy Counter Prototype + MQTT
    ↓
Week 3: Central Server + Dashboard + End-to-End
    ↓
Week 4: Earthquake Data + Scoring + Polish
    ↓
Week 5: Integration Testing + Demo Video
    ↓
Week 6: Report + Presentation
```

**If anything slips:** Cut dashboard features first (a sorted text list is enough), then cut ML optimization (keep rule-based scoring), then cut J-SHIS/NIED data (use USGS + Kaggle only).

## Role Distribution

| Role | Person | Responsibilities |
|------|--------|-----------------|
| **CE Lead (IoT + AI)** | Sepideh | All code: YOLO, FastAPI, MQTT, dashboard, data analysis |
| **Project Manager** | Akif | Timeline, docs, coordination, presentation |
| **Civil Engineering** | Abdallah | Structural concepts, building vulnerability index logic |
| **Industrial Engineering** | Eya | Damping system design document |
| **Interior Architecture** | Alen | Sensor placement in building layouts |
| **Industrial Design** | Sudem | Sensor hub physical casing design |
