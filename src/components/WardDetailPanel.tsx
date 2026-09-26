import React from 'react';

export function WardDetailPanel({ ward }: { ward?: any }) {
  if (!ward) {
    return (
      <div className="glass-panel rounded-xl p-4 border border-slate-700/50 flex items-center justify-center h-full w-full">
        <span className="text-slate-500 font-mono text-sm tracking-widest">SELECT A WARD ON THE MAP</span>
      </div>
    );
  }

  const { ward_no } = ward;

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-700/50 flex flex-col h-full w-full text-slate-300 font-mono overflow-y-auto">
      <div className="flex justify-between items-start mb-4 border-b border-slate-700/50 pb-2">
        <div>
          <h3 className="text-xl font-tech font-bold text-white tracking-wider">WARD {ward_no}</h3>
          <span className="text-xs text-slate-400">{ward.zone || 'Unknown Zone'}</span>
        </div>
        <div className="text-right">
          <span className="text-xs bg-emerald-950/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold tracking-wider">
            LIVE
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Conditions */}
        <section>
          <h4 className="text-[10px] font-bold text-cyan-400 mb-2 uppercase border-b border-slate-700/50 pb-1">Current Conditions</h4>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-500 block mb-1">Temperature</span>
              <span className="text-white text-sm font-bold">{ward.temperature_c || 'N/A'} °C</span>
            </div>
            <div className="bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-500 block mb-1">Humidity</span>
              <span className="text-white text-sm font-bold">{ward.relative_humidity_pct || 'N/A'} %</span>
            </div>
            <div className="bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-500 block mb-1">Wind</span>
              <span className="text-white text-sm font-bold">{ward.wind_speed_ms || 'N/A'} m/s</span>
            </div>
            <div className="bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-500 block mb-1">Solar</span>
              <span className="text-white text-sm font-bold">{ward.solar_radiation_wm2 || 'N/A'} W/m²</span>
            </div>
            <div className="bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-500 block mb-1">Heat Index (HI)</span>
              <span className="text-rose-300 text-sm font-bold">{ward.HI_celsius || 'N/A'} °C</span>
            </div>
            <div className="bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-500 block mb-1">WBGT</span>
              <span className="text-rose-300 text-sm font-bold">{ward.WBGT_celsius || 'N/A'} °C</span>
            </div>
            <div className="bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-500 block mb-1">UTCI</span>
              <span className="text-rose-300 text-sm font-bold">{ward.UTCI_celsius || 'N/A'} °C</span>
            </div>
            <div className="bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-500 block mb-1">AQI</span>
              <span className="text-amber-300 text-sm font-bold">{ward.aqi || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Risk & Vulnerability */}
        <section>
          <h4 className="text-[10px] font-bold text-amber-400 mb-2 uppercase border-b border-slate-700/50 pb-1">Risk &amp; Vulnerability</h4>
          <div className="space-y-2 text-[10px]">
            <div className="flex justify-between items-center bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-400">Risk Score</span>
              <span className="text-rose-400 font-bold">{ward.WardRiskScore || 'N/A'}/100</span>
            </div>
            <div className="flex justify-between items-center bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-400">Risk Tier</span>
              <span className="text-rose-400 font-bold uppercase">{ward.RiskTier || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-400">Population</span>
              <span className="text-white font-bold">{ward.population?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-400">Elderly %</span>
              <span className="text-amber-300 font-bold">{ward.elderly_pct || 'N/A'}%</span>
            </div>
            <div className="flex justify-between items-center bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-400">Outdoor Worker %</span>
              <span className="text-amber-300 font-bold">{ward.outdoor_worker_pct || 'N/A'}%</span>
            </div>
            <div className="flex justify-between items-center bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-400">Vulnerability Score</span>
              <span className="text-amber-300 font-bold">{ward.vulnerability_score || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-400">Vulnerability Tier</span>
              <span className="text-rose-400 font-bold">{ward.vulnerability_tier || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center bg-[#040817] p-2 rounded border border-slate-700/50">
              <span className="text-slate-400">Dominant Factor</span>
              <span className="text-amber-300 font-bold uppercase">{ward.dominant_factor?.replace(/_/g, ' ') || 'N/A'}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
