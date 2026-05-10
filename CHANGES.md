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
- **Added:** `MD_FILES/GITHUB_REPOSITORY_SELECTION.md` with selected open-source repositories and filtering criteria for the report.
- **Added:** `MD_FILES/OPTIMIZATION_DATA_PACKAGE.md` to describe the dataset expected by the Industrial Engineering optimization model.
- **Added:** `data/optimization_input_template.csv` with Japan and Istanbul sample building rows for resource allocation experiments.
- **Changed:** Improved `src/edge/occupancy_counter.py` with line-crossing hysteresis, MQTT sequence numbers, and stable overlay drawing.
- **Decision:** Keep phone camera usage as a test/video input for the MVP; defer full on-device YOLO inference in the mobile app.
