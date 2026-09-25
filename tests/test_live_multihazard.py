import pytest
from services.live_multihazard import LiveMultiHazard
import datetime

class MockLiveMultiHazard(LiveMultiHazard):
    def __init__(self):
        super().__init__()
        self.mock_htmls = {}

    def _safe_fetch(self, url):
        return self.mock_htmls.get(url, None)

def test_deep_depression_detection():
    mh = MockLiveMultiHazard()
    mh.mock_htmls["https://mausam.imd.gov.in/responsive/cycloneinformation.php"] = "some text DEEP DEPRESSION over bay of bengal LAT. 19.5 N LONG. 86.5 E"
    c = mh.fetch_cyclone_status()
    assert c["status"] == "ACTIVE"
    assert c["system_type"] == "DEEP DEPRESSION"

def test_heavy_rain_detection_variants():
    mh = MockLiveMultiHazard()
    url = "https://mausam.imd.gov.in/imd_latest/contents/subdivisionwise-warning_mc.php?id=10"
    
    # Very Heavy Rain in Odisha
    mh.mock_htmls[url] = "ODISHA WILL EXPERIENCE VERY HEAVY RAIN"
    c = mh.fetch_heavy_rain_status()
    assert c["status"] == "ACTIVE"
    assert c["message"] == "VERY HEAVY RAIN"

    # Extremely Heavy Rain in Khurda
    mh.mock_htmls[url] = "KHURDA DISTRICT EXTREMELY HEAVY RAIN"
    c = mh.fetch_heavy_rain_status()
    assert c["status"] == "ACTIVE"
    assert c["message"] == "EXTREMELY HEAVY RAIN"

    # Heavy rain in Bhubaneswar
    mh.mock_htmls[url] = "BHUBANESWAR EXPECTS HEAVY RAIN"
    c = mh.fetch_heavy_rain_status()
    assert c["status"] == "WATCH"
    assert c["message"] == "HEAVY RAIN"

def test_unavailable_semantics():
    mh = MockLiveMultiHazard()
    mh.mock_htmls = {} # all will fail
    c = mh.fetch_heavy_rain_status()
    assert c["status"] == "UNAVAILABLE"

def test_cache_overwrite_protection():
    mh = MockLiveMultiHazard()
    url = "https://mausam.imd.gov.in/imd_latest/contents/subdivisionwise-warning_mc.php?id=10"
    mh.mock_htmls[url] = "ODISHA EXTREMELY HEAVY RAIN"
    mh.mock_htmls["https://mausam.imd.gov.in/responsive/cycloneinformation.php"] = "CYCLONIC STORM"
    
    # 1. Sync success
    res1 = mh.sync()
    assert res1["heavy_rain"]["status"] == "ACTIVE"
    assert res1["cyclone"]["status"] == "ACTIVE"
    
    # 2. Source fails, should preserve old status
    mh.mock_htmls.clear() # mock network failure
    res2 = mh.sync()
    assert res2["heavy_rain"]["status"] == "ACTIVE"
    assert res2["heavy_rain"]["message"] == "EXTREMELY HEAVY RAIN"
    assert res2["cyclone"]["status"] == "ACTIVE"
