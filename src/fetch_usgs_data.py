import requests
import pandas as pd
import json
import os
from datetime import datetime

def fetch_earthquake_data(starttime="2024-01-01", endtime=None, minmag=4.5, region="japan"):
    """
    Fetches earthquake data from USGS API.
    Region defaults to Japan bounding box.
    """
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    
    if endtime is None:
        endtime = datetime.now().strftime("%Y-%m-%d")

    # Japan bounding box (approximate)
    params = {
        "format": "geojson",
        "starttime": starttime,
        "endtime": endtime,
        "minmagnitude": minmag,
    }

    if region == "japan":
        params.update({
            "minlatitude": 30,
            "maxlatitude": 46,
            "minlongitude": 128,
            "maxlongitude": 146
        })

    print(f"Fetching data from {url} for region: {region}...")
    response = requests.get(url, params=params)
    
    if response.status_code != 200:
        print(f"Error fetching data: {response.status_code}")
        return None

    data = response.json()
    features = data.get("features", [])
    print(f"Found {len(features)} earthquakes.")

    # Flatten the GeoJSON to a flat list for DataFrame
    records = []
    for f in features:
        prop = f["properties"]
        geom = f["geometry"]["coordinates"]
        records.append({
            "id": f["id"],
            "time": datetime.fromtimestamp(prop["time"] / 1000.0).isoformat(),
            "mag": prop["mag"],
            "place": prop["place"],
            "longitude": geom[0],
            "latitude": geom[1],
            "depth": geom[2],
            "status": prop["status"],
            "tsunami": prop["tsunami"],
            "mmi": prop.get("mmi"),
            "alert": prop.get("alert")
        })

    return pd.DataFrame(records)

if __name__ == "__main__":
    df = fetch_earthquake_data(starttime="2024-01-01")
    if df is not None:
        # Move data to E: drive as requested by user
        output_dir = r"E:\APM_DATA\earthquake"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        output_path = os.path.join(output_dir, "japan_2024_catalog.csv")
        df.to_csv(output_path, index=False)
        print(f"Data saved to {output_path}")
        print(df.head())
