# A-RES Project Brief

## Executive Summary

A-RES (Adaptive Response & Earthquake Resilience System) is a university Applied Project Management project that turns buildings into "talking buildings" during and after earthquakes. The system uses IoT sensors, computer vision, and a rule-based urgency scoring engine to help emergency response teams prioritize which buildings need help first.

**Core Insight:** After a major earthquake, the biggest problem is not the earthquake itself — it's the chaos. Nobody knows which building is damaged, which has people trapped, which has fire. A-RES provides that information automatically.

## System Components

| Component | Technology | Status |
|-----------|-----------|--------|
| Sensor Box | ESP32 + MPU6050 + MQ-2/MQ-7 + BME280 | Design complete |
| Occupancy Counter | YOLO11n + ByteTrack + Virtual Line | Architecture defined |
| Communication | MQTT (Mosquitto) | Protocol selected |
| Central Server | Python FastAPI + PostgreSQL + Redis | Architecture defined |
| Urgency Scoring | Rule-based weighted formula (0-100) | Formula designed |
| Dashboard | React + WebSocket + Leaflet.js | Planned |

## Key Design Principles

1. **Privacy First** — No video leaves the building. Only anonymized counts.
2. **Honest Claims** — We don't predict earthquakes. We prioritize response.
3. **Offline Resilient** — Edge devices buffer data when internet is down.
4. **Transparent Scoring** — Rule-based formula is auditable and tunable.
5. **MVP Focus** — Build something that works, not something perfect.

## Data Sources

| Source | Type | Access | Used For |
|--------|------|--------|----------|
| USGS ComCat | Earthquake events (global) | Free API | Demo analysis, magnitude/depth stats |
| Kaggle Earthquake | Curated CSV datasets | Free download | Quick data exploration |
| NIED K-NET / KiK-net | Strong-motion waveforms (Japan) | Free (registration) | PGA reference data |
| J-SHIS | Seismic hazard maps (Japan) | Free (web + API) | Building vulnerability context |
| COCO Dataset | Person detection training data | Free download | YOLO pre-training (already done) |
| MOT17/MOT20 | Multi-object tracking benchmark | Free download | Occupancy counter testing |

## Team

| Name | Department | Role |
|------|-----------|------|
| M. Akif Guloglu | Industrial Engineering | Project Manager |
| Sepideh Aghajani | Computer Engineering | IoT & AI Systems Lead |
| M. Abdallah Salim | Civil Engineering | Structural Design |
| Eya Hajkacem | Industrial Engineering | Adaptive Damping |
| Alen Asik | Interior Architecture | Interior Layout |
| Sudem Ustahuseyinoglu | Industrial Design | Sensor Unit Design |

## Timeline

- **Start:** April 22, 2026
- **End:** June 15, 2026
- **Current Week:** Week 3 (System Design)
- **Budget:** ₺10,500

## Repository Structure

```
APM-Code/
├── MD_FILES/
│   ├── README.md           ← This overview
│   ├── PROJECT_BRIEF.md    ← Executive summary (this file)
│   ├── ARCHITECTURE.md     ← System architecture
│   ├── OCCUPANCY_SYSTEM.md ← Camera-based people counting
│   ├── ML_STRATEGY.md      ← ML/AI training approach
│   ├── URGENCY_SCORE.md    ← Urgency score formula & examples
│   ├── TEST_PLAN.md        ← Test cases & accuracy targets
│   ├── ROADMAP.md          ← Week-by-week implementation plan
│   ├── RISKS.md            ← Risk register & SWOT
│   ├── DECISIONS.md        ← Architecture decision records
│   ├── PRESENTATION_NOTES.md ← Slide content & Q&A prep
│   └── agents.md           ← AI assistant context file
├── src/                    ← (To be created) Source code
│   ├── edge/               ← Edge device code (sensor + camera)
│   ├── server/             ← FastAPI backend
│   └── dashboard/          ← React dashboard
├── data/                   ← (To be created) Data files
│   ├── earthquake/         ← USGS/Kaggle earthquake data
│   └── simulation/         ← Simulated sensor data
├── notebooks/              ← (To be created) Jupyter notebooks
└── tests/                  ← (To be created) Test scripts
```
