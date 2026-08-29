import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Flame, 
  Droplets, 
  Wind, 
  Sun, 
  HeartHandshake, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { HThermResult } from '../types';

export const HThermCalculator: React.FC = () => {
  const [temp, setTemp] = useState<number>(41.5);
  const [rh, setRh] = useState<number>(72);
  const [wind, setWind] = useState<number>(1.5);
  const [solar, setSolar] = useState<number>(850);
  const [exertion, setExertion] = useState<'resting' | 'moderate' | 'heavy'>('heavy');
  const [result, setResult] = useState<HThermResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const calculateHTherm = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/h-therm/calculate', {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateHTherm();
  }, [temp, rh, wind, solar, exertion]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold uppercase">
            Biotechnology + Physiotherapy Core Innovation
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-xs font-mono text-slate-400">Thermoregulatory Limit &amp; Metabolic Workload Simulator</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold font-display text-white mt-1">
          H-THERM Physiological Human Thermal Strain Calculator
        </h1>
        <p className="text-xs text-slate-400 max-w-3xl mt-1">
          Beyond simple temperature: models vapor pressure deficit, sweat evaporation failure, 
          and metabolic heat accumulation for outdoor construction workers and vulnerable citizens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Controls & Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-sky-400" />
            Environmental &amp; Metabolic Workload Parameters
          </h2>

          {/* Air Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> Ambient Air Temperature (Dry Bulb)
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">{temp}°C</span>
            </div>
            <input
              id="slider-temp"
              type="range"
              min="20"
              max="50"
              step="0.5"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>20°C (Mild)</span>
              <span>35°C (Warm)</span>
              <span>50°C (Extreme Heat)</span>
            </div>
          </div>

          {/* Relative Humidity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Droplets className="w-3.5 h-3.5 text-sky-400" /> Relative Humidity (RH)
              </span>
              <span className="font-mono font-bold text-sky-400 text-sm">{rh}%</span>
            </div>
            <input
              id="slider-rh"
              type="range"
              min="10"
              max="100"
              step="1"
              value={rh}
              onChange={(e) => setRh(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>10% (Dry)</span>
              <span>60% (Moderate)</span>
              <span>100% (Saturated / Zero Evap)</span>
            </div>
          </div>

          {/* Wind Speed Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Wind className="w-3.5 h-3.5 text-emerald-400" /> Wind Speed (Convective Cooling)
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{wind} m/s</span>
            </div>
            <input
              id="slider-wind"
              type="range"
              min="0.1"
              max="15.0"
              step="0.1"
              value={wind}
              onChange={(e) => setWind(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Solar Radiation Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Solar Radiant Flux (Global Horizontal)
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">{solar} W/m²</span>
            </div>
            <input
              id="slider-solar"
              type="range"
              min="0"
              max="1200"
              step="50"
              value={solar}
              onChange={(e) => setSolar(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Physical Exertion Multiplier (Physiotherapy) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-200 block">
              Occupational Metabolic Workload (K_exertion multiplier)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'resting', label: 'Resting / Sedentary', mult: '1.0x' },
                { id: 'moderate', label: 'Moderate Labor', mult: '1.35x' },
                { id: 'heavy', label: 'Heavy Construction', mult: '1.75x' },
              ].map((item) => (
                <button
                  key={item.id}
                  id={`btn-exertion-${item.id}`}
                  onClick={() => setExertion(item.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    exertion === item.id
                      ? 'bg-sky-500/15 border-sky-500 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold font-sans">{item.label}</div>
                  <div className="text-[10px] font-mono text-sky-400 font-semibold">{item.mult} metabolic burn</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Real-Time Physiological Output & Clinical Directives (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-rose-400" />
                Physiological Strain Output
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                result?.physiological_metrics.human_thermal_strain_tier.includes('Extreme')
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : result?.physiological_metrics.human_thermal_strain_tier === 'High'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {result?.physiological_metrics.human_thermal_strain_tier || 'High'} Tier
              </span>
            </div>

            {/* Big H-THERM Score Display */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-mono text-slate-400 block uppercase">
                H-THERM Composite Score (0-100)
              </span>
              <div className="text-4xl font-mono font-black text-rose-400 my-1">
                {result?.physiological_metrics.h_therm_score || 88.5}
              </div>
              <div className="text-xs font-semibold text-slate-300">
                {result?.physiological_metrics.human_thermal_strain_tier || 'Extreme Heat Strain'}
              </div>
            </div>

            {/* Intermediate Physiological Metrics */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs font-mono">
                <span className="text-[10px] text-slate-400 block">Wet-Bulb Globe (WBGT)</span>
                <span className="text-base font-bold text-amber-400">
                  {result?.physiological_metrics.wbgt_celsius || 33.2}°C
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs font-mono">
                <span className="text-[10px] text-slate-400 block">Sweat Evaporation Deficit</span>
                <span className="text-base font-bold text-sky-400">
                  {result?.physiological_metrics.sweat_evaporation_efficiency_pct || 42.0}% eff.
                </span>
              </div>
            </div>

            {/* Clinical Work-to-Rest & Hydration Guidelines */}
            <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-800">
              <div className="flex items-start gap-2.5 text-xs">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Max Continuous Outdoor Exertion:</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {result?.clinical_advisory.maximum_continuous_outdoor_work_minutes || 15} minutes max per hour
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <Droplets className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Required Hourly Hydration:</span>
                  <span className="text-sky-300 font-mono font-bold">
                    {result?.clinical_advisory.required_hourly_hydration_ml || 1000} ml/hr (Electrolytes/ORS)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Cooling Intervention:</span>
                  <span className="text-slate-300">
                    {result?.clinical_advisory.cooling_intervention || 'Mandatory shaded rest and ice-towel cooling.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 font-sans">
            <b className="text-slate-200">Physiotherapy Directive:</b> {result?.clinical_advisory.vulnerable_protocols}
          </div>
        </div>
      </div>
    </div>
  );
};
