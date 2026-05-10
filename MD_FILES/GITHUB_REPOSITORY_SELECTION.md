# GitHub Repository Selection for A-RES

## Selection Criteria

Repositories were selected using these criteria:

| Criterion | Meaning |
|---|---|
| Technical fit | Directly supports A-RES architecture or MVP demo |
| Maturity | Active project, known ecosystem, usable documentation |
| Integration effort | Can be integrated with Python/FastAPI/MQTT quickly |
| Edge suitability | Suitable for laptop, Raspberry Pi, or lightweight deployment |
| Academic defensibility | Easy to explain in a project report |

## Selected Repositories

| Area | Repository | Why It Is Useful for A-RES | MVP Use |
|---|---|---|---|
| Person detection and tracking | https://github.com/ultralytics/ultralytics | Provides YOLO models and tracking APIs. A-RES uses YOLO11n for person detection at entrances. | Run `model.track(..., tracker="bytetrack.yaml", classes=[0])` for anonymous people counting. |
| Multi-object tracking reference | https://github.com/FoundationVision/ByteTrack | Original ByteTrack method reference for associating detections across frames. | Justify tracker choice in report; implementation is accessed through Ultralytics tracker config. |
| MQTT broker | https://github.com/eclipse-mosquitto/mosquitto | Open-source MQTT broker suitable for IoT publish/subscribe messaging. | Local broker for edge sensor/camera events. |
| Python MQTT client | https://github.com/eclipse-paho/paho.mqtt.python | Python MQTT client for publishing and subscribing to A-RES topics. | Used by edge scripts and FastAPI subscriber. |
| Backend API | https://github.com/fastapi/fastapi | Lightweight Python API framework with WebSocket support. | Central server and dashboard WebSocket. |
| Dashboard/map UI | https://github.com/Leaflet/Leaflet | Mature web map library for building markers and priority colors. | Map view for Istanbul/Tokyo building scenarios. |
| Data analysis | https://github.com/pandas-dev/pandas | Standard Python data analysis library. | Earthquake data cleaning, synthetic dataset generation, report tables. |
| ML baseline | https://github.com/scikit-learn/scikit-learn | Classical ML toolkit for tabular models and evaluation. | Optional urgency score regression/classification baseline. |

## Filtering Decision

For the MVP, A-RES should use proven infrastructure instead of building every component from scratch:

| Component | Build or Reuse? | Decision |
|---|---|---|
| Object detection model | Reuse | YOLO11n is already trained on the COCO person class. |
| Multi-object tracker | Reuse | ByteTrack is enough for line-crossing occupancy counting. |
| MQTT messaging | Reuse | Mosquitto and Paho are standard IoT tools. |
| Backend framework | Reuse | FastAPI reduces backend development time. |
| Urgency score formula | Build | A-RES needs a custom transparent scoring rule. |
| Building simulation data | Build | Project-specific Japan/Istanbul scenarios are needed. |
| Dashboard | Build | The UI must match A-RES emergency prioritization needs. |

## License and Risk Notes

| Repository | Risk | Mitigation |
|---|---|---|
| Ultralytics | License must be checked before commercial use | For university prototype, cite the repository and use only for academic/demo purposes. |
| ByteTrack | Research code may not be production hardened | Use as method reference; rely on tested Ultralytics integration for MVP. |
| Mosquitto/Paho | Network configuration and broker availability | Use local Mosquitto for demo and cloud broker only as fallback. |
| FastAPI | Backend must handle malformed MQTT payloads | Add validation and error handling in server code. |

## Report-Ready Summary

A-RES filters GitHub repositories by relevance to the emergency-response pipeline, maturity, and integration speed. The selected stack combines YOLO11n/ByteTrack for anonymous occupancy estimation, Mosquitto/Paho for IoT communication, FastAPI for the central server, and Leaflet/pandas/scikit-learn for dashboard visualization and data analysis. This lets the team focus on the project-specific contribution: urgency scoring, multi-building simulation, and response optimization.
