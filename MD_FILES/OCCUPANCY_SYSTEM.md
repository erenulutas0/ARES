# Occupancy Estimation System — Anonymous People Counting

## 1. System Overview

**Goal:** Estimate the number of people inside a building by counting entries and exits at building entrances using computer vision. No faces are identified, no personal data is collected.

**Pipeline:**
```
USB Camera → Edge Device → Person Detection (YOLO) → Tracking (ByteTrack)
  → Virtual Line Crossing → Count Delta → MQTT → Central Server
```

## 2. Model Comparison

### 2.1 Detection Models

| Model | mAP@50 (COCO) | Params | Size | Speed (CPU) | Speed (GPU) | Edge-Ready | Notes |
|-------|---------------|--------|------|-------------|-------------|------------|-------|
| **YOLOv8n** | 37.3% | 3.2M | 6.2 MB | ~80ms | ~1.2ms | ✅ Excellent | Mature, well-documented |
| **YOLO11n** | 39.5% | 2.6M | 5.4 MB | ~56ms | ~1.5ms | ✅ Excellent | Latest, best efficiency |
| **YOLOv8s** | 44.9% | 11.2M | 22.5 MB | ~128ms | ~1.7ms | ⚠️ OK | More accurate but slower |
| **RT-DETR-l** | 53.0% | 32M | ~65 MB | ~300ms+ | ~9ms | ❌ No | Too heavy for edge |
| **MobileNet-SSD v2** | 22.0% | 4.3M | 8.6 MB | ~50ms | N/A | ✅ Very light | Low accuracy for crowds |
| **EfficientDet-D0** | 34.6% | 3.9M | 15.5 MB | ~100ms | ~8ms | ⚠️ OK | Moderate |

### 2.2 Tracking Algorithms

| Tracker | Speed | Accuracy | Re-ID | Occlusion Handling | Complexity |
|---------|-------|----------|-------|-------------------|------------|
| **ByteTrack** | ⚡ Very fast | ✅ High | ❌ No | ✅ Excellent (uses low-conf boxes) | Low |
| **BoT-SORT** | ⚡ Fast | ✅✅ Higher | ✅ Yes (appearance) | ✅ Excellent | Medium |
| **DeepSORT** | 🔶 Moderate | ✅ High | ✅ Yes (Re-ID net) | ✅ Good | High |
| **OC-SORT** | ⚡ Fast | ✅ High | ❌ No | ✅ Good | Low |

### 2.3 Recommendation for MVP

> **Primary: YOLO11n + ByteTrack**
> - YOLO11n: Best efficiency (fewer params, faster, better mAP than YOLOv8n)
> - ByteTrack: Fast, no extra Re-ID model needed, handles occlusions well
> - Fallback: YOLOv8n + ByteTrack (if YOLO11n has compatibility issues)

## 3. Why Detection Alone Is NOT Enough

Simple frame-by-frame detection cannot count entry/exit:

| Problem | Detection Only | Detection + Tracking |
|---------|---------------|---------------------|
| Same person in consecutive frames | Counted multiple times | Tracked with unique ID |
| Person entering vs. exiting | Cannot distinguish direction | Track direction across line |
| Two people side by side | May merge into one box | Separate tracked IDs |
| Person stops at door | Re-counted every frame | Single track maintained |
| Person turns back | Counted as entry | Track shows no line crossing |

**Conclusion:** You MUST use detection + tracking + virtual line crossing.

## 4. Virtual Line Crossing Logic

### 4.1 Concept

A virtual line is drawn across the entrance in the camera frame. When a tracked person's center point crosses this line:
- **Crossing from outside → inside** = Entry (+1)
- **Crossing from inside → outside** = Exit (−1)

### 4.2 Pseudocode

```python
import cv2
from ultralytics import YOLO
from collections import defaultdict

# Configuration
LINE_Y = 300  # Y-coordinate of virtual line
model = YOLO("yolo11n.pt")
track_history = defaultdict(lambda: [])  # {track_id: [prev_cy, ...]}
crossed_ids = set()
entry_count = 0
exit_count = 0

cap = cv2.VideoCapture(0)  # or video file

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Run detection + tracking
    results = model.track(
        frame,
        tracker="bytetrack.yaml",
        persist=True,
        classes=[0],  # person class only
        conf=0.3,
        verbose=False
    )

    if results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.cpu().numpy()
        track_ids = results[0].boxes.id.int().cpu().tolist()

        for box, track_id in zip(boxes, track_ids):
            x1, y1, x2, y2 = box
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2

            # Store history
            history = track_history[track_id]
            history.append(cy)

            if len(history) >= 2 and track_id not in crossed_ids:
                prev_cy = history[-2]
                curr_cy = history[-1]

                # Check line crossing
                if prev_cy < LINE_Y and curr_cy >= LINE_Y:
                    entry_count += 1
                    crossed_ids.add(track_id)
                    publish_mqtt_event("entry", +1, entry_count - exit_count)

                elif prev_cy > LINE_Y and curr_cy <= LINE_Y:
                    exit_count += 1
                    crossed_ids.add(track_id)
                    publish_mqtt_event("exit", -1, entry_count - exit_count)

            # Keep only last 30 positions
            if len(history) > 30:
                history.pop(0)

    # Draw virtual line
    cv2.line(frame, (0, LINE_Y), (frame.shape[1], LINE_Y), (0, 255, 0), 2)
    cv2.putText(frame, f"In: {entry_count} Out: {exit_count}",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.imshow("Occupancy Counter", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
```

### 4.3 MQTT Event Publishing

```python
import paho.mqtt.client as mqtt
import json
from datetime import datetime

mqtt_client = mqtt.Client()
mqtt_client.connect("mqtt_broker_host", 8883)
mqtt_client.loop_start()

seq_counter = 0

def publish_mqtt_event(direction, delta, current_count, confidence=0.9):
    global seq_counter
    seq_counter += 1

    event = {
        "building_id": "B-001",
        "camera_id": "CAM-001",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "seq": seq_counter,
        "event_type": "count_delta",
        "delta": delta,
        "direction": direction,
        "current_count": current_count,
        "confidence": confidence
    }

    mqtt_client.publish(
        f"ares/building/B-001/occupancy",
        json.dumps(event),
        qos=1
    )
```

## 5. Edge Device Recommendations

| Device | Cost | Performance | Power | Recommendation |
|--------|------|-------------|-------|----------------|
| **Raspberry Pi 4 (4GB)** | ~$55 | 8-12 FPS (YOLO11n) | 5W | ✅ MVP budget option |
| **Raspberry Pi 5** | ~$80 | 12-18 FPS | 8W | ✅ Better for production |
| **NVIDIA Jetson Nano** | ~$150 | 25-30 FPS (GPU) | 10W | ✅✅ Best for real-time |
| **Intel NUC mini PC** | ~$200+ | 20-25 FPS (CPU) | 15W | ✅ If GPU not needed |
| **Laptop (for MVP demo)** | Existing | 30+ FPS | N/A | ✅✅ Use for demo/testing |

**MVP Recommendation:** Use your existing laptop with a USB webcam or pre-recorded video files.

## 6. Camera Position Guidelines

```
             ┌──────────┐
             │ CAMERA   │  ← Mount overhead, 2.5-3m height
             │ ↓        │     angled 30-45° toward entrance
             └──────────┘
                  │
            ╔═════╧═════╗
            ║  VIRTUAL   ║  ← Virtual line across doorway
            ║   LINE     ║
            ╚═══════════╝
            │           │
     OUTSIDE│           │INSIDE
            │    DOOR   │
```

**Best practices:**
- Camera height: 2.5-3.0 meters
- Angle: 30-45° downward (avoid horizontal — poor depth)
- Position: Directly above or slightly inside the entrance
- Field of view: Cover the full width of the entrance
- Avoid: Backlighting, direct sunlight into lens

## 7. Edge Cases & Handling

| Scenario | Solution |
|----------|----------|
| **Two people enter together** | ByteTrack assigns separate IDs if detection separates them; YOLO11n handles moderate overlap |
| **Person stops at door** | No line crossing = no event. Track maintained. |
| **Person turns back** | Track shows approach + retreat. If line not crossed, no event. |
| **Child / short person** | YOLO trained on COCO includes children. Lower confidence threshold may help. |
| **Person with bag/box** | YOLO detects person class. Large objects may reduce confidence slightly. |
| **Pet / animal** | YOLO class filter: `classes=[0]` (person only). Pets are class 16 (dog), 17 (cat). |
| **Low light** | Use IR camera or increase exposure. Test with night scenarios. |
| **Camera failure** | Heartbeat every 30s. If 3 missed → mark camera offline → dashboard warning. |
| **Lens blur / rain** | Detection confidence drops → fewer detections → undercounting (acceptable degradation). |

## 8. Confidence Score Strategy

```python
def calculate_confidence(detections, fps, network_status):
    """
    Confidence represents how trustworthy the current count is.
    Range: 0.0 (no confidence) to 1.0 (full confidence)
    """
    base_confidence = 1.0

    # Factor 1: Detection confidence average
    avg_det_conf = sum(d.conf for d in detections) / max(len(detections), 1)
    det_factor = avg_det_conf  # 0.0 - 1.0

    # Factor 2: FPS health (below 5 FPS = degraded)
    fps_factor = min(fps / 10.0, 1.0)

    # Factor 3: Data freshness (staleness penalty)
    freshness_factor = 1.0 if network_status == "online" else 0.7

    confidence = det_factor * 0.5 + fps_factor * 0.3 + freshness_factor * 0.2
    return round(confidence, 2)
```

## 9. Fallback Strategy

If camera fails:
1. **First 5 minutes:** Use last known occupancy count with decaying confidence (0.9 → 0.5)
2. **5-30 minutes:** Mark occupancy as "estimated" with low confidence (0.3)
3. **30+ minutes:** Mark occupancy as "unknown" (confidence 0.0)
4. **Optional fallback:** IR beam sensor at entrance for basic in/out counting

## 10. Privacy / KVKK / GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| No personal identification | ✅ Only bounding box + class + track ID processed |
| No face recognition | ✅ Not implemented; not needed |
| No video storage | ✅ Frames processed in memory, not saved |
| No video transmission | ✅ Only count_delta JSON events sent |
| Data minimization | ✅ Only building_id, count, timestamp, confidence |
| Right to erasure | ✅ No personal data to erase |
| Transparency | ✅ Signage at entrance: "Anonymous occupancy counting in use" |

## 11. Testing Without Physical Hardware

Since you don't have cameras/RPi right now, here's how to test:

### 11.1 Use Pre-recorded Video Files

Download free test videos from:
- [PETS2009 dataset](http://www.cvg.reading.ac.uk/PETS2009/) — Pedestrian sequences
- [MOT Challenge videos](https://motchallenge.net/) — Multi-object tracking benchmark videos
- YouTube entrance camera videos (search: "building entrance CCTV footage")
- Record your own with a phone propped above a doorway

### 11.2 Run Detection on Video File

```python
# Instead of camera, use video file
cap = cv2.VideoCapture("test_entrance_video.mp4")
# Rest of the code stays the same
```

### 11.3 Synthetic Simulation

```python
import random
import json
import time

def simulate_occupancy_events(num_events=100):
    """Generate synthetic occupancy events for testing the central server."""
    building_id = "B-001"
    current_count = 0

    for seq in range(1, num_events + 1):
        # Random entry/exit
        if current_count == 0:
            delta = 1  # Can only enter
        elif random.random() < 0.6:
            delta = random.choice([1, 2])  # 1-2 people enter
        else:
            delta = -random.choice([1, min(2, current_count)])

        current_count = max(0, current_count + delta)

        event = {
            "building_id": building_id,
            "camera_id": "CAM-SIM",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "seq": seq,
            "event_type": "count_delta",
            "delta": delta,
            "current_count": current_count,
            "confidence": round(random.uniform(0.7, 0.99), 2)
        }

        # Publish to MQTT or print
        print(json.dumps(event, indent=2))
        time.sleep(random.uniform(0.5, 3.0))
```

### 11.4 Google Colab Notebook Test

1. Upload a test video to Google Colab
2. Install ultralytics: `!pip install ultralytics`
3. Run detection + tracking on video
4. Visualize results
5. No GPU needed for YOLO11n — CPU is fine for pre-recorded video
