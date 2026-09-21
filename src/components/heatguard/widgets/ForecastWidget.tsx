import React, { useState, useEffect } from 'react';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function ForecastWidget() {
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchForecast = async () => {
      try {
        setLoading(true);
        // Defaulting to Khordha for the dashboard scope
        const res = await fetch('/api/v1/forecast-risk?district=Khordha&horizon=5');
        if (!res.ok) throw new Error('Failed to fetch forecast');
        const data = await res.json();
        
        if (mounted) {
          setForecast(data);
          setError(false);
        }
      } catch (err) {
        if (mounted) {
          setError(true);
          console.error('Forecast error:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchForecast();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col items-center justify-center min-h-[250px]">
        <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-mono">Synthesizing 5-day risk horizon...</p>
      </div>
    );
  }

  if (error || forecast.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col items-center justify-center min-h-[250px] relative">
        <div className="flex items-center gap-1.5 mb-4 absolute top-4 left-4">
          <CalendarDays className="w-4 h-4 text-sky-600 shrink-0" />
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">5-Day Heat Risk Forecast</h3>
        </div>
        <p className="text-xs text-slate-500">Forecast data temporarily unavailable</p>
      </div>
    );
  }

  const chartData = forecast.map((f, i) => {
    const d = new Date(f.date);
    const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    
    return {
      name: i === 0 ? 'Today' : `D${i}`,
      dayLabel: dayName,
      dateLabel: dateLabel,
      score: f.risk.risk_score,
      temp: f.weather.temperature_c,
      level: f.risk.risk_tier || 'Unknown'
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-4 pr-20">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-sky-600 shrink-0" />
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">5-Day Heat Risk Forecast</h3>
        </div>
      </div>

      <div className="flex justify-between mb-6 border-b border-slate-100 pb-4">
        {chartData.map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-slate-700">{f.dayLabel}</span>
            <span className="text-[10px] text-slate-500">{f.dateLabel}</span>
            <div className={`w-3 h-3 rounded-full mt-1 mb-1 ${
              f.level.toLowerCase() === 'red' ? 'bg-red-600' : 
              f.level.toLowerCase() === 'orange' ? 'bg-orange-500' : 
              f.level.toLowerCase() === 'yellow' ? 'bg-yellow-400' : 'bg-emerald-500'
            }`}></div>
            <span className={`text-[10px] font-bold ${
              f.level.toLowerCase() === 'red' ? 'text-red-600' : 
              f.level.toLowerCase() === 'orange' ? 'text-orange-500' : 
              f.level.toLowerCase() === 'yellow' ? 'text-yellow-600' : 'text-emerald-600'
            }`}>{f.level}</span>
            <span className="text-[10px] text-slate-600 mt-1">{f.temp}°C</span>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-[140px] flex flex-col relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Model Risk Horizon (Unvalidated)</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-0.5 bg-red-500"></span> Risk Prediction</div>
             <div className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-0.5 bg-orange-400"></span> Weather Forecast (°C)</div>
          </div>
        </div>
        <div className="flex-1 w-full relative mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} dy={5} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Line yAxisId="left" type="monotone" dataKey="score" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} />
              <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={2} dot={{ r: 3, fill: '#F97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
