# A-RES: Adaptive Response & Earthquake Resilience System

## Overview
A-RES is a university Applied Project Management project that turns buildings into "talking buildings" during and after earthquakes. The system uses IoT sensors, computer vision for anonymous occupancy estimation, and a rule-based urgency scoring engine to help emergency response teams prioritize which buildings need help first.

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_BRIEF.md](PROJECT_BRIEF.md) | Executive summary, team, timeline |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture (4 layers, data flow, DB design) |
| [OCCUPANCY_SYSTEM.md](OCCUPANCY_SYSTEM.md) | Camera-based people counting (YOLO + ByteTrack) |
| [ML_STRATEGY.md](ML_STRATEGY.md) | ML/AI approach, feature engineering, data simulation |
| [URGENCY_SCORE.md](URGENCY_SCORE.md) | Scoring formula, examples, priority levels |
| [TEST_PLAN.md](TEST_PLAN.md) | Test cases, accuracy metrics, targets |
| [ROADMAP.md](ROADMAP.md) | Week-by-week implementation plan |
| [RISKS.md](RISKS.md) | Risk register, SWOT analysis |
| [DECISIONS.md](DECISIONS.md) | Architecture decision records |
| [PRESENTATION_NOTES.md](PRESENTATION_NOTES.md) | Slide structure, Q&A prep, abstracts |
| [COMPUTER_ENGINEERING_WEEK_PLAN.md](COMPUTER_ENGINEERING_WEEK_PLAN.md) | This week's CE deliverables and demo plan |
| [GITHUB_REPOSITORY_SELECTION.md](GITHUB_REPOSITORY_SELECTION.md) | Selected open-source repositories and filtering criteria |
| [OPTIMIZATION_DATA_PACKAGE.md](OPTIMIZATION_DATA_PACKAGE.md) | Data schema for Industrial Engineering optimization |
| [agents.md](agents.md) | AI assistant context & coding guidelines |

## Quick Start (Development)

```bash
# 1. Clone the repository
git clone <repo-url>
cd APM-Code

# 2. Create Python virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install ultralytics opencv-python paho-mqtt fastapi uvicorn redis psycopg2-binary

# 4. Run occupancy counter on test video
python src/edge/occupancy_counter.py --video test_video.mp4

# 5. Start MQTT broker (Docker)
docker run -d -p 1883:1883 eclipse-mosquitto

# 6. Start FastAPI server
uvicorn src.server.main:app --reload

# 7. Open dashboard
open http://localhost:8000
```

## Key Principles

- 🔒 **Privacy First** — No video leaves the building
- 🎯 **Honest Claims** — We don't predict earthquakes
- 📡 **Offline Resilient** — Edge devices buffer when network is down
- 📊 **Transparent Scoring** — Rule-based, auditable, tunable
- 🚀 **MVP Focus** — Working demo over perfect system

## Team

Istanbul Beykent University — Faculty of Engineering and Architecture

| Name | Department | Role |
|------|-----------|------|
| M. Akif Guloglu | Industrial Engineering | Project Manager |
| Sepideh Aghajani | Computer Engineering | IoT & AI Systems |
| M. Abdallah Salim | Civil Engineering | Structural Design |
| Eya Hajkacem | Industrial Engineering | Adaptive Damping |
| Alen Asik | Interior Architecture | Interior Layout |
| Sudem Ustahuseyinoglu | Industrial Design | Sensor Unit Design |

## License

Academic project — Istanbul Beykent University, 2026.
