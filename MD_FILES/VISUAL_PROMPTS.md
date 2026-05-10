# A-RES Visual Generation Prompts

## Prompt 1: Clean Technical Architecture Diagram

Create a clean technical system architecture diagram for a university engineering project called "A-RES: Adaptive Response and Earthquake Resilience System". Show a hybrid edge and central command architecture. On the left, draw three smart buildings labeled Building A, Building B, and Building C. Inside each building, show a local sensor hub connected to an accelerometer, smoke/gas sensors, temperature sensor, entrance camera, and local alarm/siren. Draw arrows from each building to a central command machine using MQTT. In the center, show the Central Command Machine with modules labeled FastAPI Server, Sensor Fusion, Urgency Score Engine, Occupancy Database, and Dashboard API. On the right, show Emergency Dashboard, Rescue Teams, Fire Teams, and Medical Teams. Also show a feedback arrow from the central system back to building alerts, but make clear that local alarms can also trigger directly from the local edge hub. Use a professional engineering style, white background, blue and red accent colors, clear labels, no cartoon style, no people faces, no excessive decoration.

## Prompt 2: Presentation-Style Infographic

Design a professional infographic explaining how A-RES works after an earthquake. Use a left-to-right flow: Building Sensors and Entrance Camera -> Local Edge Hub -> MQTT Communication -> Central Command System -> Urgency Score -> Emergency Response Priority. Include small icons for accelerometer, gas sensor, camera, alarm, server, dashboard, and rescue team. Add a small callout that says "No face recognition: only anonymous occupancy counts are transmitted." Add another callout that says "Local alarms can trigger immediately; central command coordinates all buildings." Use a clean academic presentation style, high readability, white background, modern flat design, blue/gray palette with red for critical alerts.

## Prompt 3: Camera Occupancy Counting Diagram

Create a technical diagram showing anonymous occupancy counting at an apartment entrance. Show a phone or camera recording the doorway, a virtual line across the entrance, bounding boxes around people, and arrows indicating entry and exit. Show the processing pipeline: Video -> YOLO11n person detection -> ByteTrack tracking -> virtual line crossing -> count delta -> MQTT -> central server. Add labels "Entry = +1", "Exit = -1", and "No face recognition". Use a clean engineering report style with simple icons and clear arrows.
