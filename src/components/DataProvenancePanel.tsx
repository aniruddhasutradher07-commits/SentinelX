import React from 'react';

export function DataProvenancePanel({ telemetry }: { telemetry?: any }) {
  const rawCpcb = telemetry?.data_quality?.air_quality || telemetry?.air_quality?.status || "CREDENTIALS_NOT_CONFIGURED";
  const cpcbStatus = ["LIVE", "STALE", "UNAVAILABLE", "CREDENTIALS_NOT_CONFIGURED"].includes(rawCpcb) ? rawCpcb : "CREDENTIALS_NOT_CONFIGURED";
  const rawImd = telemetry?.data_quality?.imd || telemetry?.imd_context?.status || "CREDENTIALS_NOT_CONFIGURED";
  const imdStatus = ["LIVE", "STALE", "UNAVAILABLE", "CREDENTIALS_NOT_CONFIGURED"].includes(rawImd) ? rawImd : "CREDENTIALS_NOT_CONFIGURED";
  
  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-700/50 w-full font-mono text-[10px] text-slate-300">
      <h3 className="text-sm font-tech font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">
        Data & Provenance
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="bg-[#040817] p-3 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1 uppercase">Weather (Live)</span>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">Open-Meteo</span>
            {telemetry?.data_quality?.weather === "LIVE" ? (
              <span className="text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/30">LIVE</span>
            ) : telemetry?.data_quality?.weather?.includes("SYNTHETIC") || telemetry?.is_demo_fallback || telemetry?.is_synthetic ? (
              <span className="text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-500/30">DEMO / SYNTHETIC — NOT LIVE</span>
            ) : (
              <span className="text-rose-400 bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-500/30">UNAVAILABLE</span>
            )}
          </div>
        </div>

        <div className="bg-[#040817] p-3 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1 uppercase">Air Quality (Live)</span>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">Open-Meteo</span>
            <span className="text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/30">LIVE</span>
          </div>
        </div>
        
        <div className="bg-[#040817] p-3 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1 uppercase">Air Quality (Reference)</span>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">CPCB OGD</span>
            <span className={`px-1.5 py-0.5 rounded border ${
              cpcbStatus === 'LIVE' ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30' :
              cpcbStatus === 'STALE' ? 'text-amber-400 bg-amber-950/30 border-amber-500/30' :
              cpcbStatus === 'CREDENTIALS_NOT_CONFIGURED' ? 'text-amber-400 bg-amber-950/30 border-amber-500/30' :
              'text-rose-400 bg-rose-950/30 border-rose-500/30'
            }`}>{cpcbStatus}</span>
          </div>
        </div>

        <div className="bg-[#040817] p-3 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1 uppercase">District Warning Context</span>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">IMD</span>
            <span className={`px-1.5 py-0.5 rounded border ${
              imdStatus === 'LIVE' ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30' :
              imdStatus === 'STALE' ? 'text-amber-400 bg-amber-950/30 border-amber-500/30' :
              imdStatus === 'CREDENTIALS_NOT_CONFIGURED' ? 'text-amber-400 bg-amber-950/30 border-amber-500/30' :
              'text-rose-400 bg-rose-950/30 border-rose-500/30'
            }`}>{imdStatus}</span>
          </div>
        </div>

        <div className="bg-[#040817] p-3 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1 uppercase">Demographics / OGD</span>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">Odisha Govt OGD</span>
            <span className="text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">STATIC REFERENCE (2019)</span>
          </div>
        </div>

        <div className="bg-[#040817] p-3 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1 uppercase">Map / Geography</span>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">ISRO / NRSC Bhuvan</span>
            <span className="text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-500/30">PENDING ROLLOUT</span>
          </div>
        </div>

        <div className="bg-[#040817] p-3 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1 uppercase">ML V2 Training</span>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">ERA5 (2021-2025)</span>
            <span className="text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">HISTORICAL SOURCE</span>
          </div>
        </div>

        <div className="bg-[#040817] p-3 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1 uppercase">Physiology Rules</span>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">ACGIH / OSHA</span>
            <span className="text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-500/30">EXPERIMENTAL REFERENCE</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
