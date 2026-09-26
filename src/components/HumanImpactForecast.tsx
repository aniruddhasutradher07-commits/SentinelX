import React, { useEffect, useState } from 'react';
import { getApiUrl, fetchWithColdStart } from '../services/apiConfig';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface HumanImpactForecastProps {
  districtName?: string;
}

export const HumanImpactForecast: React.FC<HumanImpactForecastProps> = ({ districtName = 'Khordha' }) => {
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          if (Array.isArray(data)) {
            setForecast(data);
          } else if (data && Array.isArray(data.data)) {
            setForecast(data.data);
          } else if (data && Array.isArray(data.forecast)) {
            setForecast(data.forecast);
          } else {
            setForecast([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Error fetching forecast');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [districtName]);

  const chartData = forecast.slice(0, 5).map((day, idx) => ({
    name: `Day ${idx + 1}`,
    date: day.date,
    'Risk Score': day.risk?.risk_score,
    WBGT: day.thermal?.wbgt_celsius,
    Tmax: day.weather?.temperature_c,
    UTCI: day.thermal?.utci_celsius,
    tier: day.risk?.risk_tier
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0B0D0E]/90 border border-slate-700 p-3 rounded shadow-xl text-[10px] font-mono">
          <p className="text-white font-bold mb-1">{label} ({data.date})</p>
          <p className="text-rose-400">Risk Score: {data['Risk Score']} ({data.tier})</p>
          <p className="text-amber-400">Tmax: {data.Tmax}°C</p>
          <p className="text-sky-300">WBGT: {data.WBGT}°C</p>
          <p className="text-purple-300">UTCI: {data.UTCI}°C</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-xl border border-white/[0.08] bg-[#14171A]/80 p-5 mt-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold font-tech text-white uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            {districtName.toUpperCase()} 5-DAY ENVIRONMENTAL OUTLOOK
          </h2>
          <p className="text-xs text-slate-400 mt-1">Environmental thermal stress and impact indicators</p>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 font-semibold whitespace-nowrap">
            [FORECAST]
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-rose-500/30 bg-rose-950/50 text-rose-300 font-semibold whitespace-nowrap">
            [EXPERIMENTAL MODEL RISK HORIZON]
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-slate-400 py-10 text-center font-mono">Loading 5-day horizon...</div>
      ) : errorMsg ? (
        <div className="text-xs text-slate-400 py-10 text-center font-mono">
          5-DAY FORECAST TEMPORARILY UNAVAILABLE
          {process.env.NODE_ENV === 'development' && <div className="text-[9px] opacity-50 mt-2">{errorMsg}</div>}
        </div>
      ) : forecast.length === 0 ? (
        <div className="text-xs text-slate-400 py-10 text-center font-mono">DATA UNAVAILABLE</div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Main Chart */}
          <div className="h-[250px] w-full bg-[#0B0D0E]/50 border border-slate-700/30 rounded-xl p-4">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">5-DAY THERMAL RISK OUTLOOK</h3>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                 <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                 <YAxis yAxisId="left" stroke="#f43f5e" fontSize={10} domain={[0, 100]} />
                 <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} domain={['auto', 'auto']} />
                 <Tooltip content={<CustomTooltip />} />
                 <Legend wrapperStyle={{ fontSize: '10px' }} />
                 <Line yAxisId="left" type="monotone" dataKey="Risk Score" stroke="#f43f5e" strokeWidth={2} activeDot={{ r: 6 }} />
                 <Line yAxisId="right" type="monotone" dataKey="WBGT" stroke="#38bdf8" strokeWidth={2} />
               </LineChart>
             </ResponsiveContainer>
          </div>

          {/* Cards below */}
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
                    <span className="text-slate-500">Heat Index:</span>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
