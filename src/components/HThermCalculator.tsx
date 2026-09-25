import React, { useState, useEffect } from 'react';
import { HThermResult } from '../types';
import { getApiUrl } from '../services/apiConfig';

export interface HThermCalculatorProps {
  liveTemp?: number;
  liveRh?: number;
  liveWind?: number;
  liveSolar?: number | null;
}

export const HThermCalculator: React.FC<HThermCalculatorProps> = ({ 
  liveTemp, 
  liveRh, 
  liveWind, 
  liveSolar 
}) => {
  const [temp, setTemp] = useState<number>(liveTemp ?? 41.5);
  const [rh, setRh] = useState<number>(liveRh ?? 72);
  const [wind, setWind] = useState<number>(liveWind ?? 1.5);
  const [solar, setSolar] = useState<number>(liveSolar ?? 850);
  const [exertion, setExertion] = useState<'resting' | 'moderate' | 'heavy'>('heavy');
  const [result, setResult] = useState<HThermResult | null>(null);

  useEffect(() => {
    if (liveTemp !== undefined) setTemp(liveTemp);
    if (liveRh !== undefined) setRh(liveRh);
    if (liveWind !== undefined) setWind(liveWind);
    if (liveSolar !== undefined && liveSolar !== null) setSolar(liveSolar);
  }, [liveTemp, liveRh, liveWind, liveSolar]);

  const calculateHTherm = async () => {
    try {
      const res = await fetch(getApiUrl('/api/v1/h-therm/calculate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature_c: temp,
          relative_humidity_pct: rh,
          wind_speed_ms: wind,
          solar_radiation_wm2: solar,
          exertion_level: exertion,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Failed to calculate H-THERM:', err);
    }
  };

  useEffect(() => {
    calculateHTherm();
  }, [temp, rh, wind, solar, exertion]);

  const wbgt = result?.physiological_metrics.wbgt_celsius || 33.2;
  const strainScore = result?.physiological_metrics.h_therm_score || 88.5;
  const sweatEff = result?.physiological_metrics.sweat_evaporation_efficiency_pct || 42.0;
  const maxExertion = result?.clinical_advisory.maximum_continuous_outdoor_work_minutes || 15;
  const tier = result?.physiological_metrics.human_thermal_strain_tier || 'Extreme';

  return (
    <div className="flex-1 p-4 lg:p-6 bg-slate-900/80">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div>
            <h2 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wide">
              Environmental Inputs
            </h2>
            <div className="space-y-3">
              {/* Temp Row */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium">Ambient Temperature</span>
                  <span className="text-[9px] text-cyan-400 font-mono mt-0.5">TELEMETRY</span>
                </div>
                <div className="flex items-center gap-4">
                  <input type="range" min="20" max="50" step="0.5" value={temp} onChange={e => setTemp(parseFloat(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg appearance-none accent-slate-500" />
                  <div className="w-16 text-right">
                    <span className="text-lg font-bold text-white font-mono">{temp}</span>
                    <span className="text-xs text-slate-400 font-mono ml-1">°C</span>
                  </div>
                </div>
              </div>

              {/* RH Row */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium">Relative Humidity</span>
                  <span className="text-[9px] text-cyan-400 font-mono mt-0.5">TELEMETRY</span>
                </div>
                <div className="flex items-center gap-4">
                  <input type="range" min="10" max="100" step="1" value={rh} onChange={e => setRh(parseFloat(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg appearance-none accent-slate-500" />
                  <div className="w-16 text-right">
                    <span className="text-lg font-bold text-white font-mono">{rh}</span>
                    <span className="text-xs text-slate-400 font-mono ml-1">%</span>
                  </div>
                </div>
              </div>

              {/* Wind Row */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium">Wind Speed</span>
                  <span className="text-[9px] text-cyan-400 font-mono mt-0.5">TELEMETRY</span>
                </div>
                <div className="flex items-center gap-4">
                  <input type="range" min="0.1" max="15" step="0.1" value={wind} onChange={e => setWind(parseFloat(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg appearance-none accent-slate-500" />
                  <div className="w-16 text-right">
                    <span className="text-lg font-bold text-white font-mono">{wind}</span>
                    <span className="text-xs text-slate-400 font-mono ml-1">m/s</span>
                  </div>
                </div>
              </div>

              {/* Solar Row */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium">Solar Radiation</span>
                  <span className="text-[9px] text-cyan-400 font-mono mt-0.5">TELEMETRY</span>
                </div>
                <div className="flex items-center gap-4">
                  <input type="range" min="0" max="1200" step="50" value={solar} onChange={e => setSolar(parseFloat(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg appearance-none accent-slate-500" />
                  <div className="w-16 text-right">
                    <span className="text-lg font-bold text-white font-mono">{solar}</span>
                    <span className="text-xs text-slate-400 font-mono ml-1">W/m²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wide">
              Occupational Metabolic Workload
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'resting', label: 'RESTING', sub: '1.0× metabolic' },
                { id: 'moderate', label: 'MODERATE', sub: '1.35× metabolic' },
                { id: 'heavy', label: 'HEAVY', sub: '1.75× metabolic' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setExertion(item.id as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    exertion === item.id 
                      ? 'bg-slate-800 border-slate-600 text-white' 
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold tracking-wider">{item.label}</span>
                  <span className="text-[10px] font-mono mt-0.5 opacity-80">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT: Output (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              H-THERM RESULT
            </h2>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
              CALCULATED
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-6 mb-6 border-b border-slate-800/80">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-mono font-black text-white">{wbgt}</span>
              <span className="text-xl font-mono text-slate-400">°C</span>
            </div>
            <span className="text-xs font-mono text-slate-500 mt-2 uppercase tracking-widest">
              WBGT
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-300">Heat Strain</span>
                <span className="text-[10px] text-slate-500 font-mono">H-Therm Score</span>
              </div>
              <div className="text-right flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-white">{strainScore}</span>
                <span className="text-[10px] font-mono text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-300">Sweat Deficit</span>
                <span className="text-[10px] text-slate-500 font-mono">Evaporative Efficiency</span>
              </div>
              <div className="text-right flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-white">{sweatEff}%</span>
                <span className="text-[10px] font-mono text-slate-500">effective</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-300">Maximum Outdoor Exertion</span>
                <span className="text-[10px] text-slate-500 font-mono">Safe work limit</span>
              </div>
              <div className="text-right flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-white">{maxExertion}</span>
                <span className="text-[10px] font-mono text-slate-500">min/hour</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              tier.includes('Extreme') 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : tier === 'High' 
                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider">RISK STATE</span>
              <span className="text-sm font-black uppercase tracking-widest">{tier}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
