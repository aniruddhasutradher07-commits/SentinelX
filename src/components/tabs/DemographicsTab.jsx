import React from "react";

export default function DemographicsTab({ activeDistrict }) {
  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-xl p-4 border border-brand-orange/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-tech text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-orange">👥</span>
              Population Exposure Demographics
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Census 2024 Proj</span>
          </div>
          <p className="text-xs text-slate-400 font-mono mb-5">Vulnerable population clusters under live surveillance in {activeDistrict?.district || 'Bhubaneswar'}</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center font-mono">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">TOTAL POPULATION</span>
              <span className="text-2xl font-tech font-bold text-white">2.00M</span>
              <span className="text-[10px] text-slate-500 block mt-1">Under active grid</span>
            </div>
            
            <div className="p-4 rounded-xl bg-black/40 border border-brand-orange/30">
              <span className="text-xs text-brand-orange block mb-1">ELDERLY (AGE 60+)</span>
              <span className="text-2xl font-tech font-bold text-brand-orange">9.8%</span>
              <span className="text-[10px] text-slate-500 block mt-1">Cardio-vulnerable</span>
            </div>
            
            <div className="p-4 rounded-xl bg-black/40 border border-brand-amber/30">
              <span className="text-xs text-brand-amber block mb-1">OUTDOOR LABOR</span>
              <span className="text-2xl font-tech font-bold text-brand-amber">26%</span>
              <span className="text-[10px] text-slate-500 block mt-1">Const / Agri / Rickshaw</span>
            </div>
            
            <div className="p-4 rounded-xl bg-black/40 border border-brand-red/30">
              <span className="text-xs text-brand-red block mb-1">ASBESTOS / TIN ROOF</span>
              <span className="text-2xl font-tech font-bold text-brand-red">25.5%</span>
              <span className="text-[10px] text-slate-500 block mt-1">High indoor retention</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 rounded-lg bg-brand-orange/10 border border-brand-orange/30 text-xs font-mono text-brand-orange">
          ⚠️ <strong>High Risk Zone:</strong> Slum clusters in Ward 24, 38 & 51 show &gt;42°C roof indoor retention at 22:00 IST.
        </div>
      </div>
    </div>
  );
}
