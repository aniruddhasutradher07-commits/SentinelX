import sys
import os
import csv
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app

client = TestClient(app)

def test_era5_map_endpoint():
    # Test missing parameters
    response = client.get("/api/v1/map/era5")
    assert response.status_code == 422
    
    # Test valid parameters
    response = client.get("/api/v1/map/era5?date=2024-05-15&variable=temperature_c")
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "VALIDATED_DATA_AVAILABLE"
    assert data["date"] == "2024-05-15"
    assert data["variable"] == "temperature_c"
    assert len(data["data"]) > 0
    assert "Validated" in data["message"]

def test_era5_grid_mapping_csv():
    csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "ml_v2", "era5_grid_mapping.csv")
    assert os.path.exists(csv_path), "ERA5 mapping CSV should exist"
    
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
    assert len(rows) == 67, "Should map all 67 wards"
    
    unique_grids = set()
    for row in rows:
        lat = float(row["era5_grid_latitude"])
        lon = float(row["era5_grid_longitude"])
        unique_grids.add((lat, lon))
        
        # Grid must be 0.25 resolution
        assert lat % 0.25 == 0
        assert lon % 0.25 == 0
        
        # Verify distance is calculated and is a float
        # assert float(row["distance_km"]) >= 0
    
    # Ensure duplicate grid point handling works (67 wards map to fewer unique grids)
    assert len(unique_grids) < 67
    assert len(unique_grids) > 0
