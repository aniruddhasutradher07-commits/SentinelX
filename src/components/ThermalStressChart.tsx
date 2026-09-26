import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ThermalStressChartProps {
  weather: any;
}

export function ThermalStressChart({ weather }: ThermalStressChartProps) {
  if (!weather || !weather.hourly || !weather.hourly.time || weather.hourly.time.length < 24) {
    return (
      <div className="glass-panel rounded-xl p-4 border border-slate-700/50 w-full h-[180px] flex flex-col items-center justify-center text-center">
        <span className="text-rose-400 font-mono text-sm tracking-widest font-bold mb-2">24-HOUR OBSERVATION HISTORY UNAVAILABLE</span>
        <p className="text-slate-400 text-xs font-sans mb-3">Hourly observation series is not available from the current ward API.</p>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300">
          Current ward telemetry: LIVE
        </span>
      </div>
    );
  }

  const data = [];
  const startIndex = Math.max(0, weather.hourly.time.findIndex((t: string) => new Date(t) > new Date()) - 24);
  const plotSlice = startIndex >= 0 ? startIndex : 0;
  
  for (let i = plotSlice; i < plotSlice + 24; i++) {
    const t = weather.hourly.time[i];
    if (!t) break;
    const temp = weather.hourly.temperature_2m[i];
    const rh = weather.hourly.relative_humidity_2m[i];
    const apparent = weather.hourly.apparent_temperature[i];
    
    data.push({
      time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Temperature: temp,
      'Apparent Temp': apparent,
    });
  }

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-700/50 flex flex-col w-full h-[300px] relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-tech font-bold text-white uppercase tracking-wider">
          Thermal Stress — 24 Hour Profile
        </h3>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          WBGT HOURLY SERIES UNAVAILABLE
        </span>
      </div>
      <div className="flex-1 w-full text-[10px] font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#64748b' }} tickMargin={10} minTickGap={30} />
            <YAxis stroke="#475569" tick={{ fill: '#64748b' }} domain={['dataMin - 2', 'dataMax + 2']} unit="°C" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
            <Line type="monotone" dataKey="Temperature" stroke="#eab308" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="Apparent Temp" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
