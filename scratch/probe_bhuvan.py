import requests
import xml.etree.ElementTree as ET

url = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/ows?service=WMS&request=GetCapabilities"
try:
    resp = requests.get(url, timeout=10)
    print("Status:", resp.status_code)
    root = ET.fromstring(resp.content)
    # Just print the first 10 layer names
    layers = root.findall(".//Layer/Name")
    for l in layers[:10]:
        print(l.text)
except Exception as e:
    print("Failed:", e)
