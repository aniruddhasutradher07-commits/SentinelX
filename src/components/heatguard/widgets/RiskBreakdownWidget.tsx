import React from 'react';
import { Layers } from 'lucide-react';
import { WardRiskRecord } from '../../../types';

interface RiskBreakdownWidgetProps {
  ward: WardRiskRecord | null;
}

export default function RiskBreakdownWidget({ ward }: RiskBreakdownWidgetProps) {
  if (!ward) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col justify-center items-center text-slate-500 text-sm">
        Select a ward to view risk breakdown.
      </div>
    );
  }

  // Risk Index = Thermal Hazard × Vulnerability Multiplier
  const riskScore = ward.WardRiskScore || 0;
  const mult = ward.vulnerability_multiplier || 1.0;
  // Reverse engineering thermal hazard for display if not explicitly in API (or just use HI)
  const thermalHazard = (riskScore / mult).toFixed(1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col relative dark:bg-boxdark dark:border-strokedark">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
        [CALCULATED]
      </div>
      
      <div className="flex items-center gap-1.5 mb-4 pr-16">
        <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
        <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate">Risk Breakdown</h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-4">
        
        {/* Formula Representation */}
        <div className="flex items-center justify-between text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{thermalHazard}</span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Base Hazard</span>
          </div>
          <div className="text-lg font-mono text-slate-400">×</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{mult.toFixed(2)}</span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Vuln. Multiplier</span>
          </div>
          <div className="text-lg font-mono text-slate-400">=</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-red-500 dark:text-red-400">{Math.round(riskScore)}</span>
            <span className="text-[10px] text-red-400/80 uppercase font-semibold mt-0.5">Risk Score</span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Canopy Cover Reduction</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {ward.tree_cover_pct ? `${ward.tree_cover_pct.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">High Heat Roofs</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {ward.high_heat_roof_pct ? `${ward.high_heat_roof_pct.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Elderly Population</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {ward.elderly_pct ? `${ward.elderly_pct.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
