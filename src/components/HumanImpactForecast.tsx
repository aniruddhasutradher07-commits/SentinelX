import React, { useEffect, useState } from 'react';
import { getApiUrl, fetchWithColdStart } from '../services/apiConfig';
import { Activity } from 'lucide-react';

interface HumanImpactForecastProps {
  districtName?: string;
}

export const HumanImpactForecast: React.FC<HumanImpactForecastProps> = ({ districtName = 'Khordha' }) => {
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const url = `/api/v1/forecast-risk?district=${districtName}&horizon=5`;
        const res = await fetchWithColdStart(url);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (isMounted) {
          setForecast(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [districtName]);

  return (
    <div className="glass-panel rounded-xl border border-white/[0.08] bg-[#14171A]/80 p-5 mt-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold font-tech text-white uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            5-DAY HUMAN IMPACT FORECAST
          </h2>
          <p className="text-xs text-slate-400 mt-1">Multi-index environmental hazard, clinical surge, and mortality risk</p>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-slate-400 py-10 text-center font-mono">Loading 5-day horizon...</div>
      ) : forecast.length === 0 ? (
        <div className="text-xs text-slate-400 py-10 text-center font-mono">DATA UNAVAILABLE</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {forecast.slice(0, 5).map((day, idx) => (
            <div key={idx} className="bg-[#0B0D0E]/80 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2 shadow-lg">
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                <span className="font-bold text-white text-sm font-display">DAY {idx + 1}</span>
                <span className="text-[10px] text-slate-400 font-mono">{day.date}</span>
              </div>
              
              <div className="text-[10px] space-y-1.5 mt-1 font-mono text-slate-300 flex-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tmax:</span>
                  <span className="text-amber-400 font-bold">{day.weather?.temperature_c}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RH:</span>
                  <span className="text-sky-300">{day.weather?.relative_humidity_pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wind:</span>
                  <span className="text-slate-300">{day.weather?.wind_speed_kmh} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Solar:</span>
                  <span className="text-slate-300">{day.weather?.solar_radiation_wm2 ? `${day.weather.solar_radiation_wm2} W/m²` : 'N/A'}</span>
                </div>
                
                <div className="flex justify-between mt-2 border-t border-white/[0.05] pt-1">
                  <span className="text-slate-500">Heat Index (HI):</span>
                  <span className="text-rose-400 font-bold">{day.thermal?.hi_celsius}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WBGT:</span>
                  <span className="text-rose-400 font-bold">{day.thermal?.wbgt_celsius}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UTCI:</span>
                  <span className="text-rose-400 font-bold">{day.thermal?.utci_celsius}°C</span>
                </div>
                {day.thermal?.apparent_temperature_c !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Apparent T:</span>
                    <span className="text-rose-400 font-bold">{day.thermal?.apparent_temperature_c}°C</span>
                  </div>
                )}
                
                <div className="flex flex-col mt-2 pt-2 border-t border-white/[0.05]">
                  <span className="text-slate-500 mb-1">Thermal Risk Tier:</span>
                  <span className="text-[11px] font-bold text-white">{day.risk?.risk_tier} (Score: {day.risk?.risk_score})</span>
                </div>
              </div>

              {/* Hospital Section */}
              <div className="mt-3 bg-amber-950/20 border border-amber-500/20 rounded p-2 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-amber-400">HOSPITAL SURGE RISK</span>
                <span className="text-[8px] text-slate-400 font-mono">EXPERIMENTAL / NOT VALIDATED</span>
                <div className="flex justify-between text-[10px] font-mono mt-1">
                  <span className="text-slate-500">Admissions:</span>
                  <span className="text-white">N/A</span>
                </div>
              </div>

              {/* Mortality Section */}
              <div className="mt-2 bg-rose-950/20 border border-rose-500/20 rounded p-2 flex flex-col gap-1 text-center">
                <span className="text-[9px] font-bold text-rose-400">MORTALITY RISK PROXY</span>
                <span className="text-[10px] font-mono text-white mt-1">EXPERIMENTAL / UNAVAILABLE</span>
              </div>
              
              <div className="mt-3 pt-2 text-[8px] font-mono text-slate-500 text-center border-t border-white/[0.05]">
                {day.provenance} {day.model_status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
