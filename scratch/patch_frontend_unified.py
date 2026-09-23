import re

path = "src/types.ts"
try:
    with open(path, "r") as f:
        content = f.read()

    new_types = """
  telemetry?: {
    temperature_c: number;
    relative_humidity_pct: number;
    wind_speed_ms: number;
    uv_index: number;
    source: string;
    status: string;
    observed_at: string;
    fetched_at: string;
    data_age_minutes: number;
  };
  air_quality?: {
    status: string;
    aqi?: number;
    aqi_standard?: string;
    source?: string;
    station_id?: string;
    station_name?: string;
    prominent_pollutant?: string;
    distance_to_ward_km?: number;
    spatial_quality?: string;
    observed_at?: string;
    fetched_at?: string;
    data_age_minutes?: number;
    reason?: string;
  };
  imd_context?: {
    status: string;
    district?: string;
    warning_level?: string;
    nowcast?: string;
    source?: string;
    observed_at?: string;
    fetched_at?: string;
    data_age_minutes?: number;
    reason?: string;
  };
  data_quality?: {
    weather: string;
    air_quality: string;
    imd: string;
  };
"""
    # Insert new fields into WardRiskRecord
    if "telemetry?:" not in content:
        content = re.sub(
            r"(export interface WardRiskRecord \{[\s\S]*?)(\})",
            r"\1" + new_types + r"\2",
            content
        )
        with open(path, "w") as f:
            f.write(content)
        print("Patched types.ts")
except Exception as e:
    print(f"Skipping types.ts: {e}")

path = "src/components/WardView.tsx"
try:
    with open(path, "r") as f:
        content = f.read()

    live_data_panel = """
      {/* LIVE DATA SOURCES PANEL */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 shadow flex flex-col gap-3">
        <h3 className="text-white font-semibold flex justify-between items-center text-sm border-b border-slate-700 pb-2">
          <span>LIVE DATA SOURCES</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* IMD Source */}
          <div className="bg-slate-900 rounded p-3 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">IMD</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeWard.imd_context?.status === 'LIVE' ? 'bg-emerald-900 text-emerald-400' : activeWard.imd_context?.status === 'STALE' ? 'bg-amber-900 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                {activeWard.imd_context?.status || 'UNAVAILABLE'}
              </span>
            </div>
            {activeWard.imd_context?.status === 'UNAVAILABLE' ? (
              <div className="text-slate-500 mt-2">{activeWard.imd_context.reason || 'Not configured'}</div>
            ) : (
              <div className="mt-2 text-slate-300">
                <div>District: <span className="text-white">{activeWard.imd_context?.district}</span></div>
                <div>Warning: <span className="text-white">{activeWard.imd_context?.warning_level || 'NO WARNING'}</span></div>
                {activeWard.imd_context?.nowcast && <div>Nowcast: <span className="text-white">{activeWard.imd_context.nowcast}</span></div>}
                <div className="text-slate-500 mt-1">Age: {activeWard.imd_context?.data_age_minutes} min</div>
              </div>
            )}
          </div>

          {/* CPCB Source */}
          <div className="bg-slate-900 rounded p-3 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">CPCB AQI</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeWard.air_quality?.status === 'LIVE' ? 'bg-emerald-900 text-emerald-400' : activeWard.air_quality?.status === 'STALE' ? 'bg-amber-900 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                {activeWard.air_quality?.status || 'UNAVAILABLE'}
              </span>
            </div>
            {activeWard.air_quality?.status === 'UNAVAILABLE' ? (
              <div className="text-slate-500 mt-2">{activeWard.air_quality.reason || 'Not configured'}</div>
            ) : (
              <div className="mt-2 text-slate-300">
                <div>Station: <span className="text-white">{activeWard.air_quality?.station_name}</span></div>
                <div>Distance: <span className="text-white">{activeWard.air_quality?.distance_to_ward_km} km</span> <span className="text-[9px] px-1 py-0.5 bg-slate-800 rounded">{activeWard.air_quality?.spatial_quality}</span></div>
                <div>AQI: <span className="text-white">{activeWard.air_quality?.aqi}</span> {activeWard.air_quality?.prominent_pollutant && <span>({activeWard.air_quality.prominent_pollutant})</span>}</div>
                <div className="text-slate-500 mt-1">Age: {activeWard.air_quality?.data_age_minutes} min</div>
              </div>
            )}
          </div>

          {/* Open-Meteo Source */}
          <div className="bg-slate-900 rounded p-3 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Open-Meteo</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeWard.telemetry?.status === 'LIVE' ? 'bg-emerald-900 text-emerald-400' : activeWard.telemetry?.status === 'STALE' ? 'bg-amber-900 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                {activeWard.telemetry?.status || 'UNAVAILABLE'}
              </span>
            </div>
            <div className="mt-2 text-slate-300">
                <div>Temp: <span className="text-white">{activeWard.telemetry?.temperature_c}°C</span></div>
                <div>RH: <span className="text-white">{activeWard.telemetry?.relative_humidity_pct}%</span></div>
                <div>Wind: <span className="text-white">{activeWard.telemetry?.wind_speed_ms} m/s</span></div>
                <div className="text-slate-500 mt-1">Age: {activeWard.telemetry?.data_age_minutes} min</div>
            </div>
          </div>
        </div>
      </div>
"""
    # Insert it right before the "Key Metrics" section
    if "LIVE DATA SOURCES PANEL" not in content:
        content = content.replace("{/* Key Metrics */}", live_data_panel + "\n      {/* Key Metrics */}")
        with open(path, "w") as f:
            f.write(content)
        print("Patched WardView.tsx")
except Exception as e:
    print(f"Skipping WardView.tsx: {e}")
