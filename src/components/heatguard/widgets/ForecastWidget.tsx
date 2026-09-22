import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

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
      <div className="w-full flex flex-col items-center justify-center min-h-[300px] border-b border-t border-gray-200 dark:border-white/10 py-8">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mb-4"></div>
        <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Synthesizing forecast horizon...</p>
      </div>
    );
  }

  if (error || forecast.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[200px] border-b border-t border-gray-200 dark:border-white/10 py-8">
        <p className="text-xs text-red-500 font-mono uppercase tracking-widest">Forecast data temporarily unavailable</p>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    const t = tier.toLowerCase();
    if (t === 'red' || t === 'extreme') return 'text-red-500';
    if (t === 'orange' || t === 'high' || t === 'severe') return 'text-orange-500';
    if (t === 'yellow' || t === 'moderate') return 'text-yellow-500';
    return 'text-emerald-500';
  };

  let peakIndex = 0;
  let maxScore = forecast[0].risk.risk_score;
  for (let i = 1; i < forecast.length; i++) {
    if (forecast[i].risk.risk_score > maxScore) {
      maxScore = forecast[i].risk.risk_score;
      peakIndex = i;
    }
  }

  return (
    <div className="w-full border-b border-t border-gray-200 dark:border-white/10 py-10 relative">
      <div className="flex flex-col md:flex-row w-full relative">
        
        {/* Continuous Timeline Background Line */}
        <div className="hidden md:block absolute top-[52px] left-0 right-0 h-px bg-gray-200 dark:bg-white/10 z-0"></div>

        {forecast.map((f, i) => {
          const d = new Date(f.date);
          const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
          const dateLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          const isPeak = i === peakIndex;
          const isFirst = i === 0;
          
          return (
            <div key={i} className={`flex-1 flex flex-col items-start px-6 ${!isFirst ? 'md:border-l md:border-gray-200 md:dark:border-white/10' : ''} relative z-10`}>
              
              {/* Date Header anchored */}
              <div className="w-full mb-8 relative bg-gray-50 dark:bg-[#0f1115] py-2">
                <div className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{dayName}</div>
                <div className="text-[10px] text-gray-500 font-mono uppercase mt-1">{dateLabel}</div>
                
                {isPeak && (
                  <div className="absolute top-2 right-0 md:right-auto md:left-24 text-[9px] font-bold text-orange-500 uppercase tracking-widest border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-900/10 px-2 py-0.5 rounded">
                    Peak model value
                  </div>
                )}
              </div>
              
              {/* Weather [FORECAST] */}
              <div className="w-full mb-6">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">[FORECAST]</div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] text-gray-500 uppercase font-medium">Temp</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{f.weather.temperature_c}°C</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] text-gray-500 uppercase font-medium">RH</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{f.weather.relative_humidity_pct}%</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] text-gray-500 uppercase font-medium">Wind</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{f.weather.wind_speed_kmh} <span className="text-[9px] text-gray-500 font-normal">km/h</span></span>
                  </div>
                </div>
              </div>
              
              {/* Calculated [CALCULATED] */}
              <div className="w-full mb-6">
                <div className="text-[9px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-widest mb-3">[CALCULATED]</div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] text-gray-500 uppercase font-medium">HI</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{f.thermal.hi_celsius}°C</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] text-gray-500 uppercase font-medium">WBGT</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{f.thermal.wbgt_celsius}°C</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] text-gray-500 uppercase font-medium">UTCI</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{f.thermal.utci_celsius}°C</span>
                  </div>
                </div>
              </div>
              
              {/* Model [EXPERIMENTAL] */}
              <div className="w-full mt-auto pt-6 border-t border-gray-200 dark:border-white/10 group relative">
                <div className="text-[9px] font-bold text-purple-500 uppercase tracking-widest flex items-center gap-1 mb-3">
                  [EXPERIMENTAL]
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                </div>
                
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl z-50 border border-gray-700">
                  <span className="font-bold text-purple-400 block mb-1">Experimental / Unvalidated</span>
                  Risk horizon is generated by the current model but has not yet been validated as a multi-day health-outcome prediction.
                </div>
                
                <div className="flex flex-col">
                  <span className={`text-xl font-bold uppercase tracking-tight ${getTierColor(f.risk.risk_tier)}`}>{f.risk.risk_tier}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Score {Math.round(f.risk.risk_score)}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
