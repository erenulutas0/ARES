# Computer Engineering Weekly Delivery Plan

## Goal for This Week

Deliver a clear, testable Computer Engineering package for A-RES: a working data pipeline, a justified repository/tool selection, a phone-camera occupancy counting test plan, and an optimization-ready dataset for the Industrial Engineering team.

## Priority Deliverables

| Priority | Deliverable | Output File / Evidence | Status |
|---:|---|---|---|
| 1 | GitHub-ready technical documentation | `MD_FILES/`, root `README`, screenshots/video links | In progress |
| 2 | Occupancy counting proof of concept | Phone doorway video, YOLO + ByteTrack output, manual-vs-system count table | Next |
| 3 | End-to-end mock data flow | MQTT events -> FastAPI -> dashboard building priority list | In progress |
| 4 | Optimization data package for IE | CSV schema + sample rows for resource allocation | Added |
| 5 | Repository/tool shortlist | Selected GitHub repositories with purpose and filtering criteria | Added |
| 6 | Mobile app scope | Mobile dashboard and camera-test concept, not full on-device ML for MVP | Planned |

## Recommended MVP Scope

The MVP should not try to run heavy computer vision directly inside the mobile app. The safer MVP is:

1. Record a doorway video using a phone mounted above or near the entrance.
2. Run YOLO11n + ByteTrack on a laptop or server using `src/edge/occupancy_counter.py`.
3. Publish anonymous count changes to MQTT.
4. Receive MQTT events in the FastAPI server.
5. Show live occupancy and urgency score on the web dashboard/mobile dashboard.

This keeps the demo realistic, easier to debug, and aligned with the privacy claim that raw video does not leave the edge processing device in the final design.

## Mobile App Role

For this week, the mobile app should be positioned as an emergency monitoring client:

| Feature | MVP Decision | Reason |
|---|---|---|
| Live triage list | Include | Already useful for emergency response demo |
| Map view | Include if time permits | Good visual proof for Japan/Istanbul scenario |
| Phone camera as test input | Include as concept/test mode | Useful without buying hardware |
| On-device YOLO inference | Defer | High setup risk for a short APM milestone |
| Push notifications | Defer | Not needed for core proof |

## Phone Camera Test Protocol

| Step | Action | Evidence |
|---:|---|---|
| 1 | Place the phone 2.2-3.0m high, angled down at the doorway | Photo of setup |
| 2 | Record 5 short clips: entry, exit, two people, turn-back, empty frame | Video filenames |
| 3 | Manually annotate expected count changes | CSV/table |
| 4 | Run `occupancy_counter.py` on each clip | Terminal output/screenshot |
| 5 | Compare expected vs actual count | Accuracy table |
| 6 | Send output through MQTT to dashboard | Dashboard screenshot |

## Success Criteria

| Metric | MVP Target |
|---|---:|
| Single-person entry/exit correctness | 90%+ |
| Group count tolerance | +/- 1 person |
| End-to-end event latency | < 5 seconds |
| Dashboard update reliability | No manual refresh needed |
| Data privacy | No face recognition, no identity storage |

## What to Show in the Report

- A short architecture diagram: edge camera/sensor -> MQTT -> FastAPI -> dashboard.
- A repository selection table explaining why each open-source project was selected.
- A manual-vs-detected occupancy test table.
- A screenshot of the web dashboard with mock Japan/Istanbul buildings.
- A sample optimization dataset for IE team resource allocation.
- A clear limitation statement: A-RES prioritizes emergency response; it does not predict earthquakes or certify structural safety.
