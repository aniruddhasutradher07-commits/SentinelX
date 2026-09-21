import React, { useState, useEffect } from 'react';
import { CalendarDays, AlertCircle, Info } from 'lucide-react';

export default function ForecastWidget() {
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchForecast = async () => {
      try {
        setLoading(true);
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-mono">Synthesizing 5-day risk horizon...</p>
      </div>
    );
  }

  if (error || forecast.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col items-center justify-center min-h-[300px] relative">
        <div className="flex items-center gap-1.5 mb-4 absolute top-4 left-4">
          <CalendarDays className="w-4 h-4 text-sky-600 shrink-0" />
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">5-Day Heat Risk Forecast</h3>
        </div>
        <p className="text-xs text-slate-500">Forecast data temporarily unavailable</p>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    const t = tier.toLowerCase();
    if (t === 'red' || t === 'extreme') return 'bg-red-500 text-white border-red-600';
    if (t === 'orange' || t === 'high') return 'bg-orange-500 text-white border-orange-600';
    if (t === 'yellow' || t === 'moderate') return 'bg-yellow-400 text-slate-800 border-yellow-500';
    return 'bg-emerald-500 text-white border-emerald-600';
  };

  const generateExplanation = (data: any[]) => {
    if (data.length < 2) return <span className="font-bold block mb-0.5">What changed as risk increased?</span>;
    
    const day1 = data[0];
    let peakDay = data[0];
    for (let i = 1; i < data.length; i++) {
      if (data[i].risk.risk_score > peakDay.risk.risk_score) {
        peakDay = data[i];
      }
    }
    
    if (peakDay.risk.risk_score <= day1.risk.risk_score) {
      return (
        <>
          <span className="font-bold block mb-0.5">Risk stability</span>
          Risk is expected to gradually decrease or stabilize over the horizon.
        </>
      );
    }
    
    const deltas = [];
    if (peakDay.weather.temperature_c > day1.weather.temperature_c + 0.5) {
      const diff = (peakDay.weather.temperature_c - day1.weather.temperature_c).toFixed(1);
      deltas.push(<div key="temp">↑ Temperature +{diff}°C</div>);
    }
    if (peakDay.weather.relative_humidity_pct > day1.weather.relative_humidity_pct + 2) {
      const diff = Math.round(peakDay.weather.relative_humidity_pct - day1.weather.relative_humidity_pct);
      deltas.push(<div key="hum">↑ Humidity +{diff}%</div>);
    }
    if (peakDay.weather.wind_speed_kmh < day1.weather.wind_speed_kmh - 1) {
      const diff = Math.round(day1.weather.wind_speed_kmh - peakDay.weather.wind_speed_kmh);
      deltas.push(<div key="wind">↓ Wind -{diff} km/h</div>);
    }
    
    if (deltas.length === 0) return (
      <>
        <span className="font-bold block mb-0.5">What changed as risk increased?</span>
        Risk increase driven by compounding localized factors.
      </>
    );
    
    return (
      <div className="w-full">
        <span className="font-bold block mb-1">What changed as risk increased?</span>
        <div className="flex flex-col gap-0.5 text-[10px] font-mono text-slate-600 mb-1">
          {deltas}
        </div>
        <p className="text-[10px] italic mt-1 text-slate-500">These conditions were associated with higher calculated thermal stress.</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-sky-600 shrink-0" />
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">5-Day Forecast Pipeline</h3>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 overflow-x-auto custom-scrollbar pb-2">
        {forecast.map((f, i) => {
          const d = new Date(f.date);
          const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
          const dateLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          
          return (
            <div key={i} className="flex-1 min-w-[140px] bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col">
              <div className="text-center border-b border-slate-200 pb-2 mb-2">
                <div className="text-[11px] font-bold text-slate-800">{dayName}</div>
                <div className="text-[9px] text-slate-500">{dateLabel}</div>
              </div>
              
              {/* Weather */}
              <div className="mb-3">
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Weather</div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="text-slate-500">Temp</div><div className="text-slate-700 font-semibold text-right">{f.weather.temperature_c}°C</div>
                  <div className="text-slate-500">Hum</div><div className="text-slate-700 font-semibold text-right">{f.weather.relative_humidity_pct}%</div>
                  <div className="text-slate-500">Wind</div><div className="text-slate-700 font-semibold text-right">{f.weather.wind_speed_kmh}km/h</div>
                </div>
              </div>
              
              {/* Calculated */}
              <div className="mb-3">
                <div className="text-[9px] font-bold text-emerald-500 uppercase mb-1">Calculated</div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="text-slate-500">HI</div><div className="text-slate-700 font-semibold text-right">{f.thermal.hi_celsius}°C</div>
                  <div className="text-slate-500">WBGT</div><div className="text-slate-700 font-semibold text-right">{f.thermal.wbgt_celsius}°C</div>
                  <div className="text-slate-500">UTCI</div><div className="text-slate-700 font-semibold text-right">{f.thermal.utci_celsius}°C</div>
                </div>
              </div>
              
              {/* Model */}
              <div className="mt-auto pt-2 border-t border-slate-200 relative group">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[9px] font-bold text-amber-500 uppercase flex items-center gap-1">
                    Model
                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                  </div>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-10">
                  <span className="font-bold text-amber-400 block mb-1">Experimental / Unvalidated</span>
                  Risk horizon is generated by the current model but has not yet been validated as a multi-day health-outcome prediction.
                </div>
                
                <div className={`mt-2 py-1 px-2 rounded border text-center text-[10px] font-bold uppercase tracking-wider ${getTierColor(f.risk.risk_tier)}`}>
                  {f.risk.risk_tier} ({(f.risk.risk_score).toFixed(0)})
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {forecast.length > 0 && (
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-blue-800 w-full flex flex-col">
            {generateExplanation(forecast)}
          </div>
        </div>
      )}
    </div>
  );
}
