import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app
from services.physiology_reference import get_available_subjects_and_sessions, get_physiology_reference

client = TestClient(app)

def test_dataset_discovery():
    subjects = get_available_subjects_and_sessions()
    assert isinstance(subjects, list)
    if len(subjects) > 0:
        assert "participant_id" in subjects[0]
        assert "session_type" in subjects[0]
        assert "hr_available" in subjects[0]
        assert "temp_available" in subjects[0]

def test_missing_data_handling():
    result = get_physiology_reference("S99", "STRESS")
    assert result["status"] == "NOT_FOUND"

def get_first_valid():
    subjects = get_available_subjects_and_sessions()
    if subjects:
        return subjects[0]["participant_id"], subjects[0]["session_type"]
    return None, None

def test_subject_session_filtering():
    pid, sess = get_first_valid()
    if not pid:
        return
        
    result = get_physiology_reference(pid, sess, max_samples=10)
    assert result["subject_id"] == pid
    assert result["session_type"] == sess
    assert result["sample_count"] > 0
    assert result["sample_count"] <= 10

def test_hr_temp_schema_and_timestamp_parsing():
    pid, sess = get_first_valid()
    if not pid:
        return
        
    result = get_physiology_reference(pid, sess, max_samples=5)
    data = result["data"]
    assert len(data) > 0
    sample = data[0]
    
    assert "timestamp" in sample
    assert "heart_rate_bpm" in sample
    assert "skin_temperature_c" in sample
    
    assert isinstance(sample["timestamp"], float)
    assert isinstance(sample["heart_rate_bpm"], float)
    assert isinstance(sample["skin_temperature_c"], float)

def test_static_reference_labeling_and_api_shape():
    pid, sess = get_first_valid()
    if not pid:
        return
        
    response = client.get(f"/api/v1/physiology-reference?subject_id={pid}&session_type={sess}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "STATIC_REFERENCE"
    assert data["source"] == "PhysioNet"
    assert data["dataset_version"] == "1.0.1"
    assert "start_time" in data
    assert "end_time" in data
    assert "data" in data
    assert len(data["data"]) > 0

def test_api_invalid_returns_404():
    response = client.get("/api/v1/physiology-reference?subject_id=S99&session_type=STRESS")
    assert response.status_code == 404
    assert response.json()["detail"] == "HR / skin-temperature recording is unavailable for this participant/session."

def test_api_no_params_returns_available():
    response = client.get("/api/v1/physiology-reference")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "STATIC_REFERENCE"
    assert "available" in data
    assert isinstance(data["available"], list)
