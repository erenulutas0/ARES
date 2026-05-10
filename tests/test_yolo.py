from ultralytics import YOLO
import cv2
import numpy as np
import os

def test_yolo_initialization():
    print("Testing YOLO11n initialization...")
    try:
        # Load the model (it will download if not present)
        model = YOLO("yolo11n.pt")
        print("Model loaded successfully!")
        
        # Create a dummy image
        img = np.zeros((640, 640, 3), dtype=np.uint8)
        
        # Run inference
        results = model(img, verbose=False)
        print(f"Inference successful! Found {len(results)} results object.")
        
        return True
    except Exception as e:
        print(f"Error during YOLO testing: {e}")
        return False

if __name__ == "__main__":
    if test_yolo_initialization():
        print("YOLO Integration Test: PASSED")
    else:
        print("YOLO Integration Test: FAILED")
        exit(1)
