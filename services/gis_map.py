"""
services/gis_map.py — GIS & Risk Visualization Engine
=======================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Generates interactive Folium/Leaflet maps with:
  • Multi-zone heat risk overlay circles (Green / Yellow / Orange / Red)
  • Emergency infrastructure markers (hospitals, cooling centers, ambulance depots)
  • Popup cards with ward/district thermal metrics
  • India-centric default view
"""

from __future__ import annotations

import math
from typing import List, Dict, Any, Optional

try:
    import folium
    from folium.plugins import HeatMap, MarkerCluster
    FOLIUM_AVAILABLE = True
except ImportError:
    FOLIUM_AVAILABLE = False
    print("[gis_map] Warning: folium not installed — map generation disabled")


# ═══════════════════════════════════════════════════════════════════════════
# Tier → colour mapping
# ═══════════════════════════════════════════════════════════════════════════

TIER_COLORS = {
    "Normal": "#22c55e",    # Green
    "Green":  "#22c55e",
    "Low":    "#22c55e",

    "Elevated": "#eab308",  # Yellow
    "Yellow":   "#eab308",

    "Warning": "#f97316",   # Orange
    "Orange":  "#f97316",
    "High":    "#f97316",

    "Critical": "#ef4444",  # Red
    "Red":      "#ef4444",
    "Extreme":  "#ef4444",
}

TIER_FILL_OPACITY = {
    "Normal": 0.20, "Green": 0.20, "Low": 0.20,
    "Elevated": 0.30, "Yellow": 0.30,
    "Warning": 0.45, "Orange": 0.45, "High": 0.45,
    "Critical": 0.60, "Red": 0.60, "Extreme": 0.60,
}

# ═══════════════════════════════════════════════════════════════════════════
# Emergency infrastructure (mock data for demonstration)
# ═══════════════════════════════════════════════════════════════════════════

HOSPITALS = [
    {"name": "AIIMS Bhubaneswar", "lat": 20.2469, "lon": 85.8018, "type": "hospital", "beds": 960},
    {"name": "SCB Medical College, Cuttack", "lat": 20.4736, "lon": 85.8873, "type": "hospital", "beds": 1500},
    {"name": "Capital Hospital, Bhubaneswar", "lat": 20.2699, "lon": 85.8411, "type": "hospital", "beds": 600},
    {"name": "KIMS Hospital", "lat": 20.3005, "lon": 85.8260, "type": "hospital", "beds": 750},
    {"name": "SUM Hospital", "lat": 20.3208, "lon": 85.8153, "type": "hospital", "beds": 1100},
    {"name": "Hi-Tech Medical College", "lat": 20.3300, "lon": 85.8085, "type": "hospital", "beds": 500},
    {"name": "Kalinga Hospital", "lat": 20.2955, "lon": 85.8450, "type": "hospital", "beds": 300},
]

COOLING_CENTERS = [
    {"name": "BMC Cooling Shelter — Unit 4", "lat": 20.2751, "lon": 85.8402, "type": "cooling_center", "capacity": 200},
    {"name": "Community Hall — Saheed Nagar", "lat": 20.2863, "lon": 85.8466, "type": "cooling_center", "capacity": 150},
    {"name": "Ram Mandir Shelter — Old Town", "lat": 20.2521, "lon": 85.8538, "type": "cooling_center", "capacity": 100},
    {"name": "Jaydev Bhawan — Unit 9", "lat": 20.2930, "lon": 85.8378, "type": "cooling_center", "capacity": 300},
    {"name": "Indoor Stadium — Baramunda", "lat": 20.2800, "lon": 85.8090, "type": "cooling_center", "capacity": 500},
]

EMERGENCY_DEPOTS = [
    {"name": "108 Ambulance Hub — Chandrasekharpur", "lat": 20.3200, "lon": 85.8200, "type": "ambulance", "vehicles": 12},
    {"name": "ODRAF Station — Bhubaneswar", "lat": 20.2650, "lon": 85.8390, "type": "emergency", "personnel": 60},
    {"name": "Fire Station — Rasulgarh", "lat": 20.3020, "lon": 85.8570, "type": "emergency", "personnel": 45},
]


# ═══════════════════════════════════════════════════════════════════════════
# Icon helpers
# ═══════════════════════════════════════════════════════════════════════════

def _icon_for_type(infra_type: str) -> dict:
    """Return folium Icon kwargs for a given infrastructure type."""
    mapping = {
        "hospital":       {"icon": "plus-sign", "prefix": "glyphicon", "color": "red"},
        "cooling_center": {"icon": "home",      "prefix": "glyphicon", "color": "blue"},
        "ambulance":      {"icon": "road",      "prefix": "glyphicon", "color": "orange"},
        "emergency":      {"icon": "fire",      "prefix": "glyphicon", "color": "darkred"},
    }
    return mapping.get(infra_type, {"icon": "info-sign", "prefix": "glyphicon", "color": "gray"})


# ═══════════════════════════════════════════════════════════════════════════
# Popup HTML builder
# ═══════════════════════════════════════════════════════════════════════════

def _zone_popup_html(zone: Dict[str, Any]) -> str:
    """Build a rich HTML popup for a risk zone marker."""
    name = zone.get("name", zone.get("ward_no", zone.get("district", "Zone")))
    tier = zone.get("risk_tier", zone.get("RiskTier", "Normal"))
    color = TIER_COLORS.get(tier, "#888")
    temp = zone.get("temperature_c", "—")
    rh = zone.get("humidity_pct", zone.get("relative_humidity_pct", "—"))
    htsi = zone.get("htsi_score", zone.get("WardRiskScore", "—"))
    uv = zone.get("uv_index", "—")
    aqi = zone.get("aqi", "—")

    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; min-width: 220px;">
      <h4 style="margin:0 0 6px 0; color:{color}; border-bottom:2px solid {color}; padding-bottom:4px;">
        {name}
      </h4>
      <table style="font-size:13px; width:100%;">
        <tr><td><b>Risk Tier</b></td><td style="color:{color}; font-weight:bold;">{tier}</td></tr>
        <tr><td><b>Temp</b></td><td>{temp} °C</td></tr>
        <tr><td><b>Humidity</b></td><td>{rh} %</td></tr>
        <tr><td><b>HTSI / Risk</b></td><td>{htsi}</td></tr>
        <tr><td><b>UV Index</b></td><td>{uv}</td></tr>
        <tr><td><b>AQI</b></td><td>{aqi}</td></tr>
      </table>
    </div>
    """


def _infra_popup_html(infra: Dict[str, Any]) -> str:
    """Build popup for emergency infrastructure markers."""
    name = infra.get("name", "Facility")
    infra_type = infra.get("type", "").replace("_", " ").title()
    extra = ""
    if "beds" in infra:
        extra = f"<tr><td><b>Beds</b></td><td>{infra['beds']}</td></tr>"
    elif "capacity" in infra:
        extra = f"<tr><td><b>Capacity</b></td><td>{infra['capacity']}</td></tr>"
    elif "vehicles" in infra:
        extra = f"<tr><td><b>Vehicles</b></td><td>{infra['vehicles']}</td></tr>"
    elif "personnel" in infra:
        extra = f"<tr><td><b>Personnel</b></td><td>{infra['personnel']}</td></tr>"

    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; min-width: 180px;">
      <h4 style="margin:0 0 4px 0;">🏥 {name}</h4>
      <table style="font-size:13px;">
        <tr><td><b>Type</b></td><td>{infra_type}</td></tr>
        {extra}
      </table>
    </div>
    """


# ═══════════════════════════════════════════════════════════════════════════
# Main map generator
# ═══════════════════════════════════════════════════════════════════════════

def generate_risk_map(
    zones: List[Dict[str, Any]],
    center_lat: float = 20.2961,
    center_lon: float = 85.8245,
    zoom: int = 11,
    show_hospitals: bool = True,
    show_cooling_centers: bool = True,
    show_emergency: bool = True,
    title: str = "SentinelX — Heat Risk Map",
) -> str:
    """
    Generate an interactive Folium HTML map with multi-zone heat risk overlays
    and nearby emergency infrastructure.

    Parameters
    ----------
    zones : list of dicts
        Each zone must have: lat, lon, and optionally: name, risk_tier,
        temperature_c, humidity_pct, htsi_score, uv_index, aqi, radius_m.
    center_lat, center_lon : float
        Map center coordinates.
    zoom : int
        Initial zoom level.
    show_hospitals, show_cooling_centers, show_emergency : bool
        Whether to include infrastructure layers.
    title : str
        Map title (shown in control layer).

    Returns
    -------
    str : Complete HTML string of the interactive map.
    """
    if not FOLIUM_AVAILABLE:
        return _fallback_map_html(title)

    # India-centric sovereign bounding box clamping
    india_bounds = [[5.0, 65.0], [38.5, 98.5]]

    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=zoom,
        min_zoom=5,
        max_bounds=True,
        max_bounds_viscosity=1.0,
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attr="SentinelX / THERMO-SHIELD AI — Sovereign India GIS &copy; Esri",
    )
    m.fit_bounds(india_bounds)

    # Add alternative tile layers
    folium.TileLayer("OpenStreetMap", name="Street Map").add_to(m)
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr="Esri", name="Satellite"
    ).add_to(m)

    # ── Risk zone circles ────────────────────────────────────────────
    risk_layer = folium.FeatureGroup(name="🔥 Heat Risk Zones")

    for zone in zones:
        lat = zone.get("lat", zone.get("centroid_lat", center_lat))
        lon = zone.get("lon", zone.get("centroid_lon", center_lon))
        tier = zone.get("risk_tier", zone.get("RiskTier", "Normal"))
        color = TIER_COLORS.get(tier, "#888")
        opacity = TIER_FILL_OPACITY.get(tier, 0.3)
        radius = zone.get("radius_m", 800)

        folium.Circle(
            location=[lat, lon],
            radius=radius,
            color=color,
            weight=2,
            fill=True,
            fill_color=color,
            fill_opacity=opacity,
            popup=folium.Popup(_zone_popup_html(zone), max_width=280),
            tooltip=zone.get("name", zone.get("ward_no", zone.get("district", "Zone"))),
        ).add_to(risk_layer)

    risk_layer.add_to(m)

    # ── Emergency infrastructure ─────────────────────────────────────
    if show_hospitals:
        hosp_layer = folium.FeatureGroup(name="🏥 Hospitals")
        for h in HOSPITALS:
            icon_kw = _icon_for_type(h["type"])
            folium.Marker(
                location=[h["lat"], h["lon"]],
                popup=folium.Popup(_infra_popup_html(h), max_width=250),
                tooltip=h["name"],
                icon=folium.Icon(**icon_kw),
            ).add_to(hosp_layer)
        hosp_layer.add_to(m)

    if show_cooling_centers:
        cool_layer = folium.FeatureGroup(name="❄️ Cooling Centers")
        for c in COOLING_CENTERS:
            icon_kw = _icon_for_type(c["type"])
            folium.Marker(
                location=[c["lat"], c["lon"]],
                popup=folium.Popup(_infra_popup_html(c), max_width=250),
                tooltip=c["name"],
                icon=folium.Icon(**icon_kw),
            ).add_to(cool_layer)
        cool_layer.add_to(m)

    if show_emergency:
        emerg_layer = folium.FeatureGroup(name="🚑 Emergency Responders")
        for e in EMERGENCY_DEPOTS:
            icon_kw = _icon_for_type(e["type"])
            folium.Marker(
                location=[e["lat"], e["lon"]],
                popup=folium.Popup(_infra_popup_html(e), max_width=250),
                tooltip=e["name"],
                icon=folium.Icon(**icon_kw),
            ).add_to(emerg_layer)
        emerg_layer.add_to(m)

    # ── Heatmap intensity layer (if enough points) ───────────────────
    if len(zones) >= 3:
        heat_data = []
        for z in zones:
            lat = z.get("lat", z.get("centroid_lat", center_lat))
            lon = z.get("lon", z.get("centroid_lon", center_lon))
            score = z.get("htsi_score", z.get("WardRiskScore", 50))
            if isinstance(score, (int, float)):
                heat_data.append([lat, lon, float(score)])
        if heat_data:
            heat_layer = folium.FeatureGroup(name="🌡️ Thermal Heatmap")
            HeatMap(
                heat_data,
                radius=25,
                blur=20,
                max_zoom=13,
                gradient={0.3: "#22c55e", 0.5: "#eab308", 0.7: "#f97316", 1.0: "#ef4444"},
            ).add_to(heat_layer)
            heat_layer.add_to(m)

    # ── Layer control + title ────────────────────────────────────────
    folium.LayerControl(collapsed=False).add_to(m)

    # Title overlay
    title_html = f"""
    <div style="position: fixed; top: 10px; left: 60px; z-index: 1000;
                background: rgba(15,23,42,0.90); color: #f8fafc;
                padding: 10px 18px; border-radius: 8px;
                font-family: 'Segoe UI', sans-serif; font-size: 15px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.4);
                border: 1px solid rgba(255,255,255,0.1);">
      🛡️ <b>{title}</b>
      <span style="font-size:11px; color:#94a3b8;"> — SIH 2026 PS 26083</span>
    </div>
    """
    m.get_root().html.add_child(folium.Element(title_html))

    # Legend
    legend_html = """
    <div style="position: fixed; bottom: 30px; right: 20px; z-index: 1000;
                background: rgba(15,23,42,0.92); color: #f8fafc;
                padding: 12px 16px; border-radius: 8px;
                font-family: 'Segoe UI', sans-serif; font-size: 12px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1);">
      <b style="font-size:13px;">Risk Levels</b><br/>
      <span style="color:#22c55e;">●</span> Normal (HTSI &lt; 30)<br/>
      <span style="color:#eab308;">●</span> Elevated (30-50)<br/>
      <span style="color:#f97316;">●</span> Warning (50-70)<br/>
      <span style="color:#ef4444;">●</span> Critical (70-100)<br/>
      <hr style="border-color:rgba(255,255,255,0.1); margin:6px 0;"/>
      <span style="color:#ef4444;">+</span> Hospital &nbsp;
      <span style="color:#3b82f6;">⌂</span> Cooling Center &nbsp;
      <span style="color:#f97316;">🚑</span> Emergency
    </div>
    """
    m.get_root().html.add_child(folium.Element(legend_html))

    return m._repr_html_()


def generate_national_map(
    states: List[Dict[str, Any]],
    center_lat: float = 22.5,
    center_lon: float = 82.0,
    zoom: int = 5,
) -> str:
    """Generate a Pan-India overview map with state-level risk markers."""
    if not FOLIUM_AVAILABLE:
        return _fallback_map_html("National Risk Map")

    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=zoom,
        min_zoom=5,
        max_bounds=True,
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attr="SentinelX GIS &copy; Esri",
    )

    for state in states:
        lat = state.get("lat", 22.0)
        lon = state.get("lon", 78.0)
        tier = state.get("tier", state.get("risk_tier", "Normal"))
        color = TIER_COLORS.get(tier, "#888")

        folium.CircleMarker(
            location=[lat, lon],
            radius=10,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.7,
            popup=state.get("name", "State"),
            tooltip=f"{state.get('name', 'State')} — {tier}",
        ).add_to(m)

    folium.LayerControl().add_to(m)
    return m._repr_html_()


def _fallback_map_html(title: str) -> str:
    """Simple HTML fallback when folium is not installed."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><title>{title}</title></head>
    <body style="background:#0f172a; color:#f8fafc; font-family:sans-serif;
                 display:flex; justify-content:center; align-items:center; height:100vh;">
      <div style="text-align:center;">
        <h2>🗺️ {title}</h2>
        <p>Install <code>folium</code> to enable interactive maps:</p>
        <code style="background:#1e293b; padding:8px 16px; border-radius:4px;">
          pip install folium
        </code>
      </div>
    </body>
    </html>
    """
