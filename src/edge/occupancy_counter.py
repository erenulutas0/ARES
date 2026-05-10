import cv2
import json
import time
import argparse
import os
from datetime import datetime
from ultralytics import YOLO
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

class OccupancyCounter:
    def __init__(self, model_path="yolo11n.pt", line_y_pct=0.6, building_id="B-001", camera_id="CAM-001"):
        """
        Initializes the YOLO11n + ByteTrack Occupancy Counter.
        """
        print(f"Loading YOLO model: {model_path}...")
        self.model = YOLO(model_path)
        self.line_y_pct = line_y_pct
        self.building_id = building_id
        self.camera_id = camera_id
        
        # Tracking state
        self.track_sides = {} # {track_id: "outside" | "inside"}
        self.last_crossing_ts = {} # {track_id: unix timestamp}
        self.entry_count = 0
        self.exit_count = 0
        self.seq_counter = 0
        
        # MQTT Setup
        self.mqtt_broker = os.getenv("MQTT_BROKER", "broker.hivemq.com")
        self.mqtt_topic = f"ares/building/{self.building_id}/occupancy"
        self.client = mqtt.Client()
        self.connect_mqtt()

    def connect_mqtt(self):
        try:
            self.client.connect(self.mqtt_broker, 1883, 60)
            self.client.loop_start()
            print(f"Connected to MQTT Broker: {self.mqtt_broker}")
        except Exception as e:
            print(f"MQTT Connection Failed: {e}")

    def process_video(self, source=0):
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            print(f"Error: Could not open video source {source}")
            return

        print("Processing started. Press 'q' to quit.")
        
        while cap.isOpened():
            success, frame = cap.read()
            if not success: break

            height, width, _ = frame.shape
            line_y = int(height * self.line_y_pct)
            line_margin = max(12, int(height * 0.03))

            # 1. Run YOLO Tracking (ByteTrack)
            # classes=[0] targets only people (COCO class 0)
            results = self.model.track(frame, persist=True, tracker="bytetrack.yaml", classes=[0], verbose=False)

            if results[0].boxes.id is not None:
                boxes = results[0].boxes.xyxy.cpu().numpy()
                track_ids = results[0].boxes.id.int().cpu().numpy()

                for box, track_id in zip(boxes, track_ids):
                    # Get center-y of the box
                    cy = int((box[1] + box[3]) / 2)

                    # Hysteresis zone prevents duplicate counts when a track jitters
                    # around the virtual line for a few frames.
                    if cy < line_y - line_margin:
                        current_side = "outside"
                    elif cy > line_y + line_margin:
                        current_side = "inside"
                    else:
                        current_side = None

                    if current_side is not None:
                        previous_side = self.track_sides.get(track_id)
                        now = time.time()
                        last_cross = self.last_crossing_ts.get(track_id, 0)

                        if previous_side and previous_side != current_side and now - last_cross > 1.0:
                            if previous_side == "outside" and current_side == "inside":
                                self.entry_count += 1
                                self.publish_event("ENTRY", 1)
                                print(f"TRACK {track_id}: ENTERED")
                            elif previous_side == "inside" and current_side == "outside":
                                self.exit_count += 1
                                self.publish_event("EXIT", -1)
                                print(f"TRACK {track_id}: EXITED")

                            self.last_crossing_ts[track_id] = now

                        self.track_sides[track_id] = current_side

            # 2. Visualization
            annotated_frame = results[0].plot()

            # Draw line
            cv2.line(annotated_frame, (0, line_y), (width, line_y), (0, 255, 0), 2)
            cv2.line(annotated_frame, (0, line_y - line_margin), (width, line_y - line_margin), (0, 180, 0), 1)
            cv2.line(annotated_frame, (0, line_y + line_margin), (width, line_y + line_margin), (0, 180, 0), 1)
            cv2.putText(annotated_frame, "A-RES ENTRANCE LINE", (10, line_y - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
            # Draw counts
            cv2.putText(annotated_frame, f"Entries: {self.entry_count}", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(annotated_frame, f"Exits: {self.exit_count}", (10, 70), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            cv2.imshow("A-RES Occupancy Counter", annotated_frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        cap.release()
        cv2.destroyAllWindows()
        self.client.loop_stop()

    def publish_event(self, direction, delta):
        self.seq_counter += 1
        current_count = max(0, self.entry_count - self.exit_count)
        event = {
            "building_id": self.building_id,
            "camera_id": self.camera_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "seq": self.seq_counter,
            "event_type": "count_delta",
            "delta": delta,
            "direction": direction,
            "current_count": current_count,
            "confidence": 0.95
        }
        self.client.publish(self.mqtt_topic, json.dumps(event), qos=1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=str, default="0", help="Video file path or camera index")
    parser.add_argument("--line", type=float, default=0.6, help="Line position (0.0 to 1.0)")
    args = parser.parse_args()

    # Handle numeric camera index vs string file path
    src = int(args.source) if args.source.isdigit() else args.source
    
    counter = OccupancyCounter(line_y_pct=args.line)
    counter.process_video(source=src)
