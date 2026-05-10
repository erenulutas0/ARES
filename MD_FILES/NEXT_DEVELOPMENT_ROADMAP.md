# A-RES Next Development Roadmap

## Best Development Area Right Now

The strongest next development area is to turn the architecture into a visible demo chain:

```text
building sensor event
  -> local edge alarm decision
  -> MQTT
  -> central FastAPI server
  -> urgency score
  -> dashboard priority list
```

This is stronger than adding new features because it proves the core promise of A-RES.

## Immediate Tasks

| Priority | Task | Why It Matters | Output |
|---:|---|---|---|
| 1 | Record doorway test videos | Proves occupancy counting with real visual input | 5 short videos + manual count table |
| 2 | Run occupancy counter on videos | Validates YOLO + ByteTrack approach | Accuracy table |
| 3 | Connect local alarm status to dashboard | Matches the hybrid edge + central command architecture | Alarm status visible per building |
| 4 | Measure MQTT-to-dashboard latency | Shows the system is fast enough for emergency monitoring | Latency results table |
| 5 | Record demo video | Makes the project easy to evaluate | 3-minute walkthrough |

## Doorway Video Test Dataset

Recommended clips:

| Clip | Expected Result |
|---|---|
| `entry_01.mp4` | One entry, delta +1 |
| `exit_01.mp4` | One exit, delta -1 |
| `two_people_entry.mp4` | Two entries, delta +2 |
| `turn_back_01.mp4` | Net change 0 |
| `empty_frame_01.mp4` | No count event |

## Local Alarm Test Scenarios

| Scenario | Expected Local Alarm |
|---|---|
| Normal conditions | NORMAL |
| PGA >= 0.20g | WARNING |
| PGA >= 0.35g | CRITICAL |
| Smoke detected | CRITICAL |
| Gas detected | CRITICAL |
| Temperature >= 55C | CRITICAL |
| Low confidence after shaking | WARNING |

## What We Should Avoid This Week

- Do not spend time training a new YOLO model unless the pre-trained model clearly fails.
- Do not move YOLO inference into the mobile app yet.
- Do not overbuild database complexity before the demo chain is stable.
- Do not add new sensors in the report without explaining how they affect urgency score.

## Definition of Done for This Week

By the end of this week, we should be able to show:

1. A building sends sensor and occupancy data.
2. Local alarm logic produces NORMAL / WARNING / CRITICAL.
3. Central server calculates urgency score.
4. Dashboard ranks buildings.
5. A short video demonstrates the full flow.
