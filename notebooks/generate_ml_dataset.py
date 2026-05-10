import pandas as pd
import numpy as np
import random
import os
import sys

# Add src to path so we can import our rule-based engine
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.server.urgency_engine import calculate_urgency_score

def generate_synthetic_data(num_samples=10000):
    """
    Generates synthetic building scenarios and calculates their
    'ground truth' urgency score using our rule-based expert system.
    This creates a dataset we can use to train an ML model.
    """
    print(f"Generating {num_samples} synthetic scenarios...")
    data = []

    for _ in range(num_samples):
        # 1. Generate random features based on realistic distributions
        
        # PGA (Peak Ground Acceleration): mostly low, some high
        if random.random() < 0.7:
            pga = np.random.uniform(0.0, 0.05) # Quiet / minor tremors
        elif random.random() < 0.9:
            pga = np.random.uniform(0.05, 0.20) # Moderate
        else:
            pga = np.random.uniform(0.20, 0.60) # Severe

        # Vulnerability (0.1 to 1.0)
        vulnerability = np.random.beta(2, 5) # Beta distribution leaning towards lower vulnerability
        vulnerability = max(0.1, min(1.0, vulnerability))

        # Occupancy (0 to 500)
        # Heavy tail distribution (most buildings empty/few people, some very crowded)
        if random.random() < 0.3:
            occupancy = 0
        elif random.random() < 0.8:
            occupancy = int(np.random.uniform(1, 50))
        else:
            occupancy = int(np.random.uniform(50, 500))

        # Hazards (Correlated with strong shaking and vulnerability)
        fire_prob = 0.01 + (pga * 0.1) + (vulnerability * 0.05)
        gas_prob = 0.02 + (pga * 0.15)
        
        fire_detected = random.random() < fire_prob
        smoke_detected = fire_detected or (random.random() < (fire_prob * 2))
        gas_detected = random.random() < gas_prob

        # 2. Calculate the "Expert" Label using our Urgency Engine
        res = calculate_urgency_score(
            pga=pga,
            building_vuln=vulnerability,
            occupancy=occupancy,
            fire_detected=fire_detected,
            smoke_detected=smoke_detected,
            gas_detected=gas_detected
        )

        # 3. Store row
        data.append({
            "pga": round(pga, 4),
            "vulnerability": round(vulnerability, 3),
            "occupancy": occupancy,
            "smoke_detected": int(smoke_detected),
            "gas_detected": int(gas_detected),
            "fire_detected": int(fire_detected), # Often smoke and fire go together
            "urgency_score": res["score"],
            "priority": res["priority"]
        })

    df = pd.DataFrame(data)
    
    # Save to data directory
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'synthetic_urgency_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Dataset generated successfully and saved to {output_path}")
    print("\nPriority Distribution:")
    print(df['priority'].value_counts(normalize=True) * 100)

if __name__ == "__main__":
    generate_synthetic_data()
