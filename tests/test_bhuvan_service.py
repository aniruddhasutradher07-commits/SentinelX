import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.bhuvan_lulc import BhuvanLULCService
from database import SessionLocal
from models import BhuvanLULCCache

def test_wkt_generation_polygon():
    geom = {
        "type": "Polygon",
        "coordinates": [
            [[85.8, 20.2], [85.9, 20.2], [85.9, 20.3], [85.8, 20.3], [85.8, 20.2]]
        ]
    }
    wkt = BhuvanLULCService._create_wkt(geom)
    assert wkt == "POLYGON ((85.8 20.2, 85.9 20.2, 85.9 20.3, 85.8 20.3, 85.8 20.2))"

def test_wkt_generation_multipolygon():
    geom = {
        "type": "MultiPolygon",
        "coordinates": [
            [
                [[85.8, 20.2], [85.9, 20.2], [85.9, 20.3], [85.8, 20.3], [85.8, 20.2]]
            ]
        ]
    }
    wkt = BhuvanLULCService._create_wkt(geom)
    assert wkt == "MULTIPOLYGON (((85.8 20.2, 85.9 20.2, 85.9 20.3, 85.8 20.3, 85.8 20.2)))"

def test_wkt_invalid_type():
    with pytest.raises(ValueError):
        BhuvanLULCService._create_wkt({"type": "Point", "coordinates": [85.8, 20.2]})

def test_get_ward_context_non_rollout():
    db = SessionLocal()
    ctx = BhuvanLULCService.get_ward_context("W1", db)
    assert ctx["status"] == "PENDING_ROLLOUT"
    db.close()

def test_get_ward_context_missing():
    db = SessionLocal()
    # Delete if exists to test missing
    db.query(BhuvanLULCCache).filter(BhuvanLULCCache.ward_no == "W9").delete()
    db.commit()
    
    ctx = BhuvanLULCService.get_ward_context("W9", db)
    assert ctx["status"] == "PENDING_FETCH"
    db.close()

# Mock sync test could be added here, but would require requests mock. 
# We'll stick to logic tests.
