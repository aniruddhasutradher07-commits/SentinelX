import React from "react";
import { OrganStrainHologram } from "../../components/OrganStrainHologram";

export default function BiotechTab({ activeDistrict }) {
  const wbgtVal = activeDistrict.WBGT_celsius ?? 32.4;
  const hThermScore = Math.min(100, Math.round((wbgtVal / 34.0) * 78.0 * (activeDistrict.vulnerability_multiplier || 1.15)));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Human Thermal Stress */}
        <div className="glass-panel rounded-xl p-3.5 border border-brand-orange/30 relative">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="text-brand-orange font-bold">BIOTECH PHYSIO</span>
            <span className="px-1.5 py-0.2 bg-brand-orange/20 text-brand-orange text-[9px] rounded font-bold">HIGH</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-tech font-bold text-white">{hThermScore}</span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] font-mono text-brand-amber mt-0.5 font-semibold">{wbgtVal}°C ISO 7243 WBGT</div>
          <div className="mt-2 text-[10px] font-mono text-slate-400 border-t border-white/5 pt-1.5 space-y-0.5">
            <div className="flex justify-between"><span>Sweat Evap Deficit:</span> <span className="text-brand-orange">42%</span></div>
            <div className="flex justify-between"><span>Work/Rest Ratio:</span> <span className="text-white">30m Work / 30m Rest</span></div>
          </div>
        </div>

        {/* Heatwave Risk Index */}
        <div className="glass-panel rounded-xl p-3.5 border border-brand-red/30 relative">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="text-brand-red font-bold">SEVERITY INDEX</span>
            <span className="px-1.5 py-0.2 bg-brand-red/20 text-brand-red text-[9px] rounded font-bold">HIGH ALERT</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-tech font-bold text-white">80</span>
            <span className="text-xs font-mono text-slate-400">%</span>
          </div>
          <div className="text-[11px] font-mono text-brand-red mt-0.5 font-semibold">Compound: 43.3 (0-100)</div>
          <div className="mt-2 text-[10px] font-mono text-slate-400 border-t border-white/5 pt-1.5 space-y-0.5">
            <div className="flex justify-between"><span>Exceedance Prob:</span> <span className="text-brand-red">82%</span></div>
            <div className="flex justify-between"><span>Vulnerability Multi:</span> <span className="text-white">x1.05 Comp</span></div>
          </div>
        </div>

        {/* Neuro-Cardio Strain */}
        <div className="glass-panel rounded-xl p-3.5 border border-brand-purple/30 relative">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="text-brand-purple font-bold">NEURO-CARDIO</span>
            <span className="px-1.5 py-0.2 bg-brand-purple/20 text-brand-purple text-[9px] rounded font-bold">ELEVATED</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-tech font-bold text-white">7.8</span>
            <span className="text-xs font-mono text-slate-400">/ 10</span>
          </div>
          <div className="text-[11px] font-mono text-purple-300 mt-0.5 font-semibold">Cardiovascular Overload</div>
          <div className="mt-2 text-[10px] font-mono text-slate-400 border-t border-white/5 pt-1.5 space-y-0.5">
            <div className="flex justify-between"><span>Resting Index:</span> <span className="text-slate-300">3.5 / 10</span></div>
            <div className="flex justify-between"><span>Heavy Exertion:</span> <span className="text-brand-red font-bold">10.0 / 10</span></div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-brand-cyan/20 overflow-hidden w-full h-[600px] relative">
         <OrganStrainHologram />
      </div>
    </div>
  );
}
