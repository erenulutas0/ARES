# A-RES Edge Hub Visual Prompt

Use this prompt in Gemini, ChatGPT image generation, or another visual design tool.

```text
Create a clean professional engineering diagram for a system called "A-RES: Edge-Based Smart Building Emergency Response System".

Show three smart buildings on the left. Inside each building, show three sensor groups:
1. Occupancy Sensor / Entrance Camera
2. Fire-Gas Sensor
3. Structural Health Sensor on columns

Connect these sensors to a "Building Edge Hub" inside each building. The edge hub should include labels:
- local data collection
- local risk evaluation
- local alarm trigger
- MQTT/HTTP transmission

Show a local siren/alarm connected directly to the edge hub to explain that critical alarms can be triggered without waiting for the central server.

From each building edge hub, draw arrows to a lightweight "Central Coordination System" in the middle. The central system should include:
- FastAPI / API server
- sensor fusion
- urgency score engine
- building priority database
- dashboard API

On the right, show:
- AFAD-like emergency dashboard
- rescue teams
- fire teams
- medical teams
- resource allocation / priority ranking

Make the architecture clearly hybrid: local edge hubs make fast building-level decisions, while the central system coordinates all buildings.

Use a clean white background, blue and gray engineering colors, red only for emergency alarms, readable labels, no cartoon style, no face recognition imagery, no unnecessary decoration. Add a privacy note: "Only summarized risk and anonymous occupancy data are transmitted."
```
