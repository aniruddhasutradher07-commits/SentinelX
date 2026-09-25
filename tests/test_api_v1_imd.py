import os
import pytest
import urllib.request
from unittest.mock import MagicMock

@pytest.mark.skipif(os.environ.get("RUN_LIVE_API_TESTS") != "1", reason="Opt-in test, requires live network and may fail SSL verification")
def test_imd_live_api():
    req = urllib.request.Request("https://mausam.imd.gov.in/api/v1/warnings", headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req)
    body = res.read().decode('utf-8')
    assert len(body) > 0
    if 'EXTREMELY HEAVY' in body.upper():
        print("FOUND EXTREMELY HEAVY RAIN")
