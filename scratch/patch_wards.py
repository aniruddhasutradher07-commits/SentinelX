import re

path = "routers/sentinelx.py"
with open(path, "r") as f:
    content = f.read()

# Replace the ward building loop logic
# We need to import imd_client and cpcb_client in the function
content = re.sub(
    r"from services\.ingestion import fetch_multi_location, WeatherReading",
    r"from services.ingestion import fetch_multi_location, WeatherReading\n    from services.imd_client import imd_client\n    from services.cpcb_client import cpcb_client\n    imd_ctx = imd_client.get_district_context(\"Khordha\")",
    content
)

# Replace the wards.append payload
old_payload = """        wards.append({
            "ward_no": w_no,
            "zone": p.get("municipalzone") or "North Zone",
            "population": pop,
            "centroid_lat": locations[idx]["lat"],
            "centroid_lon": locations[idx]["lon"],
            "timestamp": now_ts,
            "temperature_c": temp,
            "relative_humidity_pct": rh,
            "wind_speed_ms": wind,
            "solar_radiation_wm2": solar,
            "apparent_temp_c": round(temp + 3.8, 1),
            "uhi_offset_c": uhi,
            "adjusted_temp_c": temp,
            "HI_celsius": hi,
            "WBGT_celsius": wbgt,
            "UTCI_celsius": utci,
            "thermal_hazard_score": hazard,
            "WardRiskScore": risk_score,
            "RiskTier": tier,
            "modis_lst_day_c": lst_day,
            "modis_lst_night_c": lst_night,
            "copernicus_ndvi": ndvi,
            "uhi_thermal_anomaly_c": uhi_anomaly,
            "uhi_hotspot_tier": uhi_tier,
            "nasa_surface_solar_wm2": 912.4,
            "is_live": w_data.is_live,
            "is_stale": w_data.is_stale,
            "data_age_minutes": w_data.data_age_minutes,
            "source": w_data.source,
            "observed_at": w_data.observed_at,
            "fetched_at": w_data.fetched_at,
            "uv_index": w_data.uv_index,
            "aqi": w_data.aqi,
            "aqi_standard": w_data.aqi_standard,
            **vuln
        })"""

new_payload = """        
        cpcb_ctx = cpcb_client.map_ward_to_station(locations[idx]["lat"], locations[idx]["lon"])
        
        # Override AQI if CPCB is live/stale (not unavailable)
        aqi_val = cpcb_ctx.get("aqi") if cpcb_ctx.get("status") in ("LIVE", "STALE") else w_data.aqi

        wards.append({
            "ward_no": w_no,
            "zone": p.get("municipalzone") or "North Zone",
            "population": pop,
            "centroid_lat": locations[idx]["lat"],
            "centroid_lon": locations[idx]["lon"],
            "timestamp": now_ts,
            "temperature_c": temp,
            "relative_humidity_pct": rh,
            "wind_speed_ms": wind,
            "solar_radiation_wm2": solar,
            "apparent_temp_c": round(temp + 3.8, 1),
            "uhi_offset_c": uhi,
            "adjusted_temp_c": temp,
            "HI_celsius": hi,
            "WBGT_celsius": wbgt,
            "UTCI_celsius": utci,
            "thermal_hazard_score": hazard,
            "WardRiskScore": risk_score,
            "RiskTier": tier,
            "modis_lst_day_c": lst_day,
            "modis_lst_night_c": lst_night,
            "copernicus_ndvi": ndvi,
            "uhi_thermal_anomaly_c": uhi_anomaly,
            "uhi_hotspot_tier": uhi_tier,
            "nasa_surface_solar_wm2": 912.4,
            
            # Legacy fields for compatibility
            "is_live": w_data.is_live,
            "is_stale": w_data.is_stale,
            "data_age_minutes": w_data.data_age_minutes,
            "source": w_data.source,
            "observed_at": w_data.observed_at,
            "fetched_at": w_data.fetched_at,
            "uv_index": w_data.uv_index,
            "aqi": aqi_val,
            "aqi_standard": w_data.aqi_standard,
            **vuln,
            
            # Unified structure
            "telemetry": {
                "temperature_c": temp,
                "relative_humidity_pct": rh,
                "wind_speed_ms": wind,
                "uv_index": w_data.uv_index,
                "source": w_data.source,
                "status": "LIVE" if not w_data.is_stale else "STALE",
                "observed_at": w_data.observed_at,
                "fetched_at": w_data.fetched_at,
                "data_age_minutes": w_data.data_age_minutes
            },
            "air_quality": cpcb_ctx,
            "imd_context": imd_ctx,
            "data_quality": {
                "weather": "LIVE" if not w_data.is_stale else "STALE",
                "air_quality": cpcb_ctx.get("status", "UNAVAILABLE"),
                "imd": imd_ctx.get("status", "UNAVAILABLE")
            }
        })"""

content = content.replace(old_payload, new_payload)

with open(path, "w") as f:
    f.write(content)
print("Patched routers/sentinelx.py")
