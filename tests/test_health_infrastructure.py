import sys
import os

# Ensure we can import services
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.health_infra import health_infra

def test_health_infra():
    # Number of valid wards loaded. We know Ward 7 is missing and we have 66 wards out of 67.
    # The actual records check
    total_mapped_facilities = 0
    wards_with_data = 0
    missing_ward_7 = "W7" not in health_infra.wards_cache
    
    for w_key, info in health_infra.wards_cache.items():
        if info["status"] == "STATIC_REFERENCE":
            wards_with_data += 1
            total_mapped_facilities += info["facility_count"]
            
    print(f"--- Health Infrastructure Validation ---")
    print(f"Total wards with data: {wards_with_data}")
    print(f"Total CSV records parsed: {health_infra.total_csv_records}")
    print(f"Total mapped facilities: {total_mapped_facilities}")
    print(f"Is Ward 7 missing? {missing_ward_7}")
    
    assert health_infra.total_csv_records == 423, f"Expected 423 records, got {health_infra.total_csv_records}"
    assert wards_with_data == 66, f"Expected 66 wards, got {wards_with_data}"
    assert missing_ward_7 == True, "Expected Ward 7 to be missing"
    
    # Check null preservation
    w21_info = health_infra.get_ward_infrastructure("W21")
    if w21_info["status"] == "STATIC_REFERENCE":
        print("\n--- Sample Ward (W21) Facilities ---")
        for f in w21_info["facilities"][:3]:
            print(f"- {f['name']} ({f['type']})")
            print(f"  Beds: {f['beds']}, Doctors: {f['doctors']}")
            
            if f['beds'] is None:
                print("  -> NA correctly parsed as None")

    print("\n--- Test Passed Successfully! ---")

if __name__ == "__main__":
    test_health_infra()
