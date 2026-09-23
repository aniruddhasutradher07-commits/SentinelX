# Bhuvan LULC 50K AOI Proof of Concept (POC) Report

## POC Execution Details
- **Selected Ward:** W9 (Unknown)
- **Geometry Source:** `wards_bhubaneswar.geojson`
- **Geometry Type:** Polygon
- **Approximate Area:** N/A (Validated as standard Polygon)
- **Endpoint:** `https://bhuvan-app1.nrsc.gov.in/api/lulc/curl_aoi.php`
- **Method:** GET
- **Request Timestamp:** 2026-09-23T11:53:12
- **HTTP Status:** 200
- **Response Size:** 41 bytes

## Response Details
- **Response Structure:** Array of objects containing State and LULC codes as keys.
- **State:** "OR"
- **Returned LULC Codes and Values:**
  - `'l01'`: 3.3
  - `'l06'`: 0.17
- **Units Documented:** Not explicitly documented in the JSON response (likely square kilometers or percentage, but exact unit is unconfirmed).

## Provenance
- **source:** "ISRO/NRSC Bhuvan"
- **dataset:** "LULC 50K"
- **method:** "LULC 50K AOI Wise Statistics API"
- **integration_status:** "POC_ONLY"

## Limitations
- The returned response uses LULC codes (e.g., `'l01'`, `'l06'`) which require an official data dictionary to interpret properly (e.g., matching to built-up, vegetation, water bodies, etc.).
- SentinelX is deliberately not guessing these meanings to prevent fabrication.
- Area unit is not strictly defined in the JSON.

## Final POC Status
**API_RESPONSE_RECEIVED**
