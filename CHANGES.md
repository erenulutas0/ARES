# Project Changes & Decision Log

## [2026-05-09] - Project Initialization & Documentation Phase
- **Added:** Comprehensive documentation files in `MD_FILES/`.
- **Added:** Project architecture, occupancy system design, ML strategy, urgency score formula, test plan, and roadmap.
- **Added:** `TODO.md` for task tracking.
- **Added:** `CHANGES.md` for change tracking.
- **Changed:** Moved primary data storage from `C:\` to `E:\APM_DATA` to address storage space constraints.
- **Decision:** Selected **YOLO11n** as primary detection model and **ByteTrack** as tracker for better edge performance.
- **Decision:** Adopted **FastAPI + MQTT + Redis/PostgreSQL** stack for the central server.
- **Decision:** Prioritized **Rule-based Urgency Scoring** for the MVP to ensure transparency and reliability.

## [2026-05-10] - Computer Engineering Weekly Evidence Package
- **Added:** `MD_FILES/COMPUTER_ENGINEERING_WEEK_PLAN.md` to define this week's CE deliverables, demo plan, and mobile app MVP scope.
- **Added:** `MD_FILES/COMPUTER_ENGINEERING_FULL_REPORT_TR.md` as a comprehensive Turkish report section covering data sources, model strategy, validation, sensor fusion, and laptop-based demo design.
- **Added:** `MD_FILES/COMPUTER_ENGINEERING_FULL_REPORT_EN.md` as the polished English version of the full Computer Engineering technical report.
- **Added:** `MD_FILES/HYBRID_EDGE_CENTRAL_SYSTEM_TR.md` and `MD_FILES/HYBRID_EDGE_CENTRAL_SYSTEM_EN.md` explaining the hybrid local edge alarm + central command architecture.
- **Added:** Turkish and English PDF versions of the hybrid architecture explanation, including a system diagram.
- **Added:** `MD_FILES/ARES_HYBRID_ARCHITECTURE_DIAGRAM.png` and `MD_FILES/VISUAL_PROMPTS.md` for visual presentation support.
- **Added:** `MD_FILES/GITHUB_REPOSITORY_SELECTION.md` with selected open-source repositories and filtering criteria for the report.
- **Added:** `MD_FILES/OPTIMIZATION_DATA_PACKAGE.md` to describe the dataset expected by the Industrial Engineering optimization model.
- **Added:** `data/optimization_input_template.csv` with Japan and Istanbul sample building rows for resource allocation experiments.
- **Changed:** Improved `src/edge/occupancy_counter.py` with line-crossing hysteresis, MQTT sequence numbers, and stable overlay drawing.
- **Decision:** Keep phone camera usage as a test/video input for the MVP; defer full on-device YOLO inference in the mobile app.

## [2026-05-11] - Next MVP Development Roadmap
- **Added:** `src/edge/local_alarm.py` with local edge alarm decision logic for immediate building-level warnings.
- **Added:** `tests/test_local_alarm.py` to validate NORMAL, WARNING, and CRITICAL local alarm scenarios.
- **Added:** `MD_FILES/NEXT_DEVELOPMENT_ROADMAP.md` to focus the next work on video validation, alarm status, latency, and demo recording.
- **Changed:** Expanded `TODO.md` with concrete next tasks for doorway video validation, local alarm dashboard integration, latency measurement, and demo video recording.

## [2026-05-12] - Edge Hub Architecture and Cost Report
- **Added:** `MD_FILES/EDGE_HUB_ARCHITECTURE_COST_REPORT_TR.md` and PDF version explaining the updated three-sensor edge-hub architecture, roadmap, and estimated costs.
- **Added:** `MD_FILES/EDGE_HUB_ARCHITECTURE_ILLUSTRATION.png` for the updated architecture.
- **Added:** `MD_FILES/EDGE_HUB_VISUAL_PROMPT.md` for generating a polished illustration in Gemini or another visual tool.

## [2026-05-12] - Static Building Vulnerability System Update
- **Added:** `MD_FILES/STATIC_VULNERABILITY_SYSTEM_REPORT_TR.md` and PDF version describing the updated MVP architecture with occupancy sensing, fire-gas sensing, and static building vulnerability data.
- **Added:** `MD_FILES/STATIC_VULNERABILITY_SYSTEM_ILLUSTRATION.png` for the revised system.
- **Added:** `MD_FILES/UPDATED_SYSTEM_VISUAL_PROMPT.md` for creating a new illustration in Gemini or other image tools.

## [2026-05-12] - CODEX System Architecture, Data Governance, and Security Report
- **Added:** `MD_FILES/CODEX_SYSTEM_ARCHITECTURE_DATA_SECURITY_REPORT_TR.md` and PDF version covering protocol choices, data collection/storage policies, urgency score design, authority integration, KVKK/legal considerations, cybersecurity, and resilient network design.

## [2026-05-13] - Final Design Synthesis and Vulnerability Module Implementation
- **Added:** `MD_FILES/ARES_SYSTEM_RESEARCH_REPORT.md` and PDF from the Claude/Gemini comparison report.
- **Added:** `MD_FILES/CODEX_CLAUDE_SYNTHESIS_FINAL_DESIGN_TR.md` and PDF as the final combined design decision report.
- **Added:** `src/server/building_vulnerability.py` for static building vulnerability index calculation.
- **Changed:** Updated urgency scoring to use occupancy, fire-gas risk, static vulnerability, and confidence/freshness instead of real-time structural sensing.
- **Changed:** Updated simulator payloads to send building age, structural type, floors, adjacency, soil risk, and seismic hazard.
- **Added:** `tests/test_building_vulnerability.py` for vulnerability scoring validation.

## [2026-05-13] - Dashboard Vulnerability Visibility
- **Changed:** Updated dashboard cards, detail overlay, and CSV export to show the static building vulnerability index and its input factors.
- **Changed:** Replaced the main dashboard emphasis from maximum shaking to highest building vulnerability for better alignment with the current MVP scope.
- **Changed:** Updated dashboard explanation text to describe the current occupancy + fire-gas + vulnerability triage logic.

## [2026-05-13] - Three-Laptop Demo and Authority Feed
- **Added:** `/authority/alerts` API endpoint for a simplified AFAD-like emergency feed.
- **Added:** `/authority` terminal page for the third-laptop demo scenario.
- **Changed:** Dashboard now exposes urgency score breakdown factors for occupancy, fire/gas hazards, and building vulnerability.
- **Added:** `MD_FILES/REAL_TESTING_DEMO_PLAN_TR.md` describing the edge laptop, central coordination laptop, and authority laptop testing setup.

## [2026-05-13] - HTTP Edge Demo Sender
- **Added:** `/ingest/sensor` and `/ingest/occupancy` HTTP endpoints so an edge laptop can send demo data directly to the central laptop without relying on MQTT setup.
- **Added:** `src/edge/demo_sender.py` for sending mock occupancy, building profile, smoke, and gas events during the school demo.
- **Changed:** Updated the real testing plan and README with phone-camera and mock fire/gas demo commands.

## [2026-05-13] - Demo Latency Probe
- **Added:** `src/edge/latency_probe.py` to measure edge-to-authority HTTP demo latency.
- **Changed:** Updated the README and real testing plan with the latency measurement command for performance evidence.
