# Updated A-RES System Visual Prompt

Use this prompt in Gemini, ChatGPT image generation, or another visual design tool.

```text
Create a clean professional engineering diagram for "A-RES: Updated Smart Building Emergency Response System".

Show three smart buildings on the left. Inside each building, show two real-time sensor groups:
1. Occupancy Sensor / Entrance Camera
2. Fire-Gas Sensor

Also show a "Building Vulnerability Data Module" connected to each building. This module should include:
- building age
- structural type
- number of floors
- adjacent-building condition
- soil class / microzonation
- local seismic hazard

Connect the real-time sensors and the building vulnerability module to a "Building Edge Hub". The edge hub should include:
- local data collection
- local alarm trigger
- summarized risk message
- MQTT/HTTP transmission

Show arrows from the edge hubs to a lightweight "Central Coordination System". The central system should include:
- building registry
- vulnerability index calculation
- sensor fusion
- urgency score engine
- dashboard/API

On the right side, show AFAD-like emergency dashboard, rescue teams, fire teams, municipal inspection teams, and urban transformation prioritization.

Make clear that the structural health sensor has been removed from the MVP and replaced by static building vulnerability data. Add a small note: "No final structural diagnosis; vulnerability data supports prioritization only."

Use a clean white background, blue and gray technical style, red only for alarms/critical priority, readable labels, no cartoon style, no face recognition imagery, and no unnecessary decoration.
```
