import React, { useEffect, useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  Microscope, 
  Stethoscope, 
  Bot 
} from 'lucide-react';
import { NDMABenchmark } from '../types';

export const BenchmarksView: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<NDMABenchmark[]>([]);

  useEffect(() => {
    fetch('/api/v1/benchmarks')
      .then(res => res.json())
      .then(data => {
        if (data.benchmarks) setBenchmarks(data.benchmarks);
      })
      .catch(err => console.error('Failed to load benchmarks:', err));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold uppercase">
            Model Ground-Truth Calibration
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-xs font-mono text-slate-400">NDMA / OSDMA / Lancet Countdown Historical Data</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold font-display text-white mt-1">
          Historical Benchmark &amp; Epidemiological Validation
        </h1>
        <p className="text-xs text-slate-400 max-w-3xl mt-1">
          Calibrated against published Odisha Special Relief Commissioner (SRC) and Parliament reports 
          from 1998, 2015, and 2024 to establish dose-response mortality and surge curves.
        </p>
      </div>

      {/* 3 Discipline Synergy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white font-display">AI / ML &amp; Systems</h3>
          <ul className="text-xs text-slate-400 mt-2 space-y-1.5 list-disc list-inside">
            <li>2-Stage DLNM + XGBoost Model</li>
            <li>R² = 0.566 explanatory power</li>
            <li>MAE = 0.90 admissions/day</li>
            <li>GeoJSON spatial ward pipeline</li>
          </ul>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/30">
            <Microscope className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white font-display">Biotechnology</h3>
          <ul className="text-xs text-slate-400 mt-2 space-y-1.5 list-disc list-inside">
            <li>Thermoregulatory failure limits</li>
            <li>Sweat evaporative deficit index</li>
            <li>Atmospheric vapor pressure deficit</li>
            <li>Core temperature escalation math</li>
          </ul>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3 border border-sky-500/30">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white font-display">Physiotherapy</h3>
          <ul className="text-xs text-slate-400 mt-2 space-y-1.5 list-disc list-inside">
            <li>Physical metabolic workload K_exertion</li>
            <li>Work-to-rest interval cycles</li>
            <li>Occupational worker strain tiers</li>
            <li>Clinical cooling interventions</li>
          </ul>
        </div>
      </div>

      {/* Historical Benchmarks Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-emerald-400" />
          Documented Odisha Heatwave Catastrophes (Calibration Set)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">EVENT YEAR</th>
                <th className="py-2.5 px-3">HEAT EVENT NAME</th>
                <th className="py-2.5 px-3">PEAK TEMP (°C)</th>
                <th className="py-2.5 px-3">CASUALTIES</th>
                <th className="py-2.5 px-3">SOURCE CITATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {benchmarks.length > 0 ? (
                benchmarks.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 font-bold text-amber-400">{b.event_year}</td>
                    <td className="py-3 px-3 font-sans font-semibold text-white">{b.event_name}</td>
                    <td className="py-3 px-3 font-bold text-rose-400">{b.reported_peak_temp_c}°C</td>
                    <td className="py-3 px-3 font-bold text-slate-100">{b.confirmed_deaths.toLocaleString()}</td>
                    <td className="py-3 px-3 text-[11px] text-slate-400 max-w-xs">{b.source}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    Loading benchmark records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
