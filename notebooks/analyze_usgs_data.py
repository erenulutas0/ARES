import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

def analyze_earthquake_data():
    # 1. Define paths
    data_path = r'E:\APM_DATA\earthquake\japan_2024_catalog.csv'
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(output_dir, exist_ok=True)

    print(f"Loading data from {data_path}...")
    
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"Error: Could not find {data_path}. Did you run fetch_usgs_data.py?")
        return

    # Basic data cleaning
    df['time'] = pd.to_datetime(df['time'])
    df = df.dropna(subset=['mag', 'depth'])

    print(f"Dataset loaded: {len(df)} earthquakes found.")

    # Apply modern seaborn styling
    sns.set_theme(style="darkgrid", palette="deep")
    plt.rcParams.update({'font.size': 12, 'figure.facecolor': '#0f172a', 'axes.facecolor': '#1e293b', 
                         'text.color': '#f8fafc', 'axes.labelcolor': '#f8fafc', 
                         'xtick.color': '#94a3b8', 'ytick.color': '#94a3b8'})

    # --- Plot 1: Magnitude Distribution ---
    plt.figure(figsize=(10, 6))
    sns.histplot(df['mag'], bins=30, kde=True, color='#38bdf8')
    plt.title('Earthquake Magnitude Distribution (Japan)', color='white')
    plt.xlabel('Magnitude')
    plt.ylabel('Frequency')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'magnitude_distribution.png'))
    plt.close()

    # --- Plot 2: Depth vs Magnitude ---
    plt.figure(figsize=(10, 6))
    scatter = sns.scatterplot(data=df, x='mag', y='depth', hue='mag', palette='flare', size='mag', sizes=(20, 200), alpha=0.7)
    plt.title('Depth vs Magnitude', color='white')
    plt.xlabel('Magnitude')
    plt.ylabel('Depth (km)')
    plt.gca().invert_yaxis() # Deepest at the bottom
    # Customize legend
    legend = scatter.legend_
    if legend:
        plt.setp(legend.get_texts(), color='black')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'depth_vs_magnitude.png'))
    plt.close()

    # --- Plot 3: Earthquakes Over Time (Weekly count) ---
    plt.figure(figsize=(12, 5))
    df_time = df.set_index('time')
    weekly_counts = df_time.resample('W').size()
    
    plt.plot(weekly_counts.index, weekly_counts.values, marker='o', linestyle='-', color='#22c55e', linewidth=2)
    plt.fill_between(weekly_counts.index, weekly_counts.values, color='#22c55e', alpha=0.2)
    plt.title('Weekly Earthquake Frequency', color='white')
    plt.xlabel('Date')
    plt.ylabel('Number of Earthquakes')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'earthquakes_over_time.png'))
    plt.close()

    print(f"✅ Generated 3 analysis charts in {output_dir}")

if __name__ == "__main__":
    analyze_earthquake_data()
