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
| [NEXT_DEVELOPMENT_ROADMAP.md](NEXT_DEVELOPMENT_ROADMAP.md) | Immediate next development steps for the MVP demo |
| [RISKS.md](RISKS.md) | Risk register, SWOT analysis |
| [DECISIONS.md](DECISIONS.md) | Architecture decision records |
| [PRESENTATION_NOTES.md](PRESENTATION_NOTES.md) | Slide structure, Q&A prep, abstracts |
| [COMPUTER_ENGINEERING_WEEK_PLAN.md](COMPUTER_ENGINEERING_WEEK_PLAN.md) | This week's CE deliverables and demo plan |
| [COMPUTER_ENGINEERING_FULL_REPORT_EN.md](COMPUTER_ENGINEERING_FULL_REPORT_EN.md) | Full English CE technical report for the project report |
| [COMPUTER_ENGINEERING_FULL_REPORT_TR.md](COMPUTER_ENGINEERING_FULL_REPORT_TR.md) | Full Turkish CE technical report for Google Docs |
| [GOOGLE_DOCS_CE_WEEK_REPORT_TR.md](GOOGLE_DOCS_CE_WEEK_REPORT_TR.md) | Shorter Turkish CE weekly report text |
| [GITHUB_REPOSITORY_SELECTION.md](GITHUB_REPOSITORY_SELECTION.md) | Selected open-source repositories and filtering criteria |
| [OPTIMIZATION_DATA_PACKAGE.md](OPTIMIZATION_DATA_PACKAGE.md) | Data schema for Industrial Engineering optimization |
| [HYBRID_EDGE_CENTRAL_SYSTEM_EN.md](HYBRID_EDGE_CENTRAL_SYSTEM_EN.md) | English explanation of the hybrid edge + central command system |
| [HYBRID_EDGE_CENTRAL_SYSTEM_TR.md](HYBRID_EDGE_CENTRAL_SYSTEM_TR.md) | Turkish explanation of the hybrid edge + central command system |
| [VISUAL_PROMPTS.md](VISUAL_PROMPTS.md) | Prompts for generating system architecture visuals |
| [EDGE_HUB_ARCHITECTURE_COST_REPORT_TR.md](EDGE_HUB_ARCHITECTURE_COST_REPORT_TR.md) | Updated Turkish report for edge hub architecture, roadmap, and estimated costs |
| [EDGE_HUB_VISUAL_PROMPT.md](EDGE_HUB_VISUAL_PROMPT.md) | Visual prompt for edge-hub based A-RES architecture |
| [STATIC_VULNERABILITY_SYSTEM_REPORT_TR.md](STATIC_VULNERABILITY_SYSTEM_REPORT_TR.md) | Updated Turkish report replacing structural sensors with static building vulnerability data |
| [UPDATED_SYSTEM_VISUAL_PROMPT.md](UPDATED_SYSTEM_VISUAL_PROMPT.md) | Visual prompt for the updated occupancy + fire-gas + vulnerability architecture |
| [CODEX_SYSTEM_ARCHITECTURE_DATA_SECURITY_REPORT_TR.md](CODEX_SYSTEM_ARCHITECTURE_DATA_SECURITY_REPORT_TR.md) | CODEX decision report on protocols, data governance, urgency scoring, KVKK/security, and network resilience |
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
