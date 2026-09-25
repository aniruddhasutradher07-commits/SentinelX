import os
import csv
from typing import List, Dict, Optional

DATASET_ROOT = "data/wearable-device-dataset-from-induced-stress-and-structured-exercise-sessions-1.0.1/Wearable_Dataset"

import datetime

def parse_time_row(row_val: str) -> float:
    try:
        return float(row_val)
    except ValueError:
        # It's likely a datetime string like "2013-03-03 17:43:47"
        try:
            dt = datetime.datetime.strptime(row_val.strip(), "%Y-%m-%d %H:%M:%S")
            return dt.timestamp()
        except Exception:
            return 0.0

def is_valid_sensor_file(file_path: str) -> bool:
    if not os.path.exists(file_path) or os.path.getsize(file_path) < 10:
        return False
    try:
        with open(file_path, 'r') as f:
            reader = csv.reader(f)
            parse_time_row(next(reader)[0]) # initial time
            float(next(reader)[0]) # hz
        return True
    except Exception:
        return False

def get_available_subjects_and_sessions() -> List[Dict]:
    """Scans the dataset directory and returns available valid subjects and their sessions."""
    result = []
    if not os.path.exists(DATASET_ROOT):
        return result
    
    for session_type in ["STRESS", "AEROBIC", "ANAEROBIC"]:
        session_path = os.path.join(DATASET_ROOT, session_type)
        if not os.path.exists(session_path):
            continue
            
        for subject_id in os.listdir(session_path):
            if subject_id.startswith('.'):
                continue
            subject_path = os.path.join(session_path, subject_id)
            if os.path.isdir(subject_path):
                hr_path = os.path.join(subject_path, "HR.csv")
                temp_path = os.path.join(subject_path, "TEMP.csv")
                
                hr_valid = is_valid_sensor_file(hr_path)
                temp_valid = is_valid_sensor_file(temp_path)
                
                if hr_valid and temp_valid:
                    result.append({
                        "participant_id": subject_id,
                        "session_type": session_type,
                        "hr_available": hr_valid,
                        "temp_available": temp_valid
                    })
    # Sort for deterministic behavior
    result.sort(key=lambda x: (x["participant_id"], x["session_type"]))
    return result

def load_sensor_data(file_path: str) -> Optional[tuple[float, float, List[float]]]:
    """Reads a PhysioNet Empatica E4 CSV and returns (initial_time, hz, values)."""
    if not os.path.exists(file_path):
        return None
        
    with open(file_path, 'r') as f:
        reader = csv.reader(f)
        try:
            initial_time = parse_time_row(next(reader)[0])
            hz = float(next(reader)[0])
            values = [float(row[0]) for row in reader if row]
            return initial_time, hz, values
        except (StopIteration, ValueError, IndexError):
            return None

def get_physiology_reference(subject_id: str, session_type: str, max_samples: int = 100) -> Dict:
    """Returns a bounded, time-aligned subset of HR and TEMP for a subject/session."""
    base_path = os.path.join(DATASET_ROOT, session_type, subject_id)
    
    hr_data = load_sensor_data(os.path.join(base_path, "HR.csv"))
    temp_data = load_sensor_data(os.path.join(base_path, "TEMP.csv"))
    
    if not hr_data or not temp_data:
        return {
            "status": "NOT_FOUND",
            "message": "Data not available for this subject and session."
        }
        
    hr_time, hr_hz, hr_vals = hr_data
    temp_time, temp_hz, temp_vals = temp_data
    
    # Align and bound. Since HR is 1Hz and TEMP is 4Hz, we'll return the first `max_samples` of HR
    # and match the corresponding TEMP reading (roughly 4th sample).
    # To keep it simple, we just return the first N HR readings and a matched TEMP reading.
    
    samples = []
    # Use HR as the base time (1 Hz)
    num_samples = min(len(hr_vals), max_samples)
    
    for i in range(num_samples):
        current_time = hr_time + i * (1.0 / hr_hz)
        
        # Find closest TEMP index. TEMP time is temp_time + j * (1.0 / temp_hz)
        # j = (current_time - temp_time) * temp_hz
        temp_idx = int(round((current_time - temp_time) * temp_hz))
        
        # Bounds check
        temp_idx = max(0, min(temp_idx, len(temp_vals) - 1))
        
        samples.append({
            "timestamp": current_time,
            "heart_rate_bpm": hr_vals[i],
            "skin_temperature_c": temp_vals[temp_idx]
        })
        
    return {
        "subject_id": subject_id,
        "session_type": session_type,
        "sample_count": len(samples),
        "source": "PhysioNet",
        "dataset_version": "1.0.1",
        "status": "STATIC_REFERENCE",
        "start_time": hr_time,
        "end_time": hr_time + (num_samples - 1) * (1.0 / hr_hz) if num_samples > 0 else hr_time,
        "data": samples
    }
