import React from 'react';
import { WardRiskRecord } from '../../../types';
import { ArrowRight, ArrowDown } from 'lucide-react';

interface HeatRiskPipelineWidgetProps {
  ward: WardRiskRecord;
}

export default function HeatRiskPipelineWidget({ ward }: HeatRiskPipelineWidgetProps) {
  if (!ward) return null;

  const temp = ward.temperature_c?.toFixed(1) || '--';
  const hum = ward.relative_humidity_pct?.toFixed(0) || '--';

  const hi = ward.HI_celsius?.toFixed(1) || '--';
  const wbgt = ward.WBGT_celsius?.toFixed(1) || '--';
  const utci = ward.UTCI_celsius?.toFixed(1) || '--';

  const score = Math.round(ward.WardRiskScore || 0);
  const tier = (ward.RiskTier || 'EXTREME').toUpperCase();

  const getRiskColor = (t: string) => {
    if (t === 'EXTREME' || t === 'RED') return 'text-red-500';
    if (t === 'HIGH' || t === 'ORANGE') return 'text-orange-500';
    if (t === 'MODERATE' || t === 'YELLOW') return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const riskColor = getRiskColor(tier);

  return (
    <div className="w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 py-8 border-b border-t border-gray-200 dark:border-white/10">
      
      {/* 1. WEATHER */}
      <div className="flex flex-col flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Weather Inputs</h3>
        
        <div className="flex items-center gap-4 mb-3">
          <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{temp}°C</div>
          <div className="text-gray-300 dark:text-gray-600 font-light text-2xl">·</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{hum}% <span className="text-lg font-medium text-gray-500">RH</span></div>
        </div>
        
        <div>
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest opacity-80 border border-cyan-200 dark:border-cyan-800/30 px-2 py-1 rounded bg-cyan-50 dark:bg-cyan-900/10">
            [LIVE]
          </span>
        </div>
      </div>

      {/* CONNECTOR 1 */}
      <div className="hidden xl:flex items-center justify-center shrink-0 text-gray-300 dark:text-gray-700">
        <ArrowRight strokeWidth={1} className="w-8 h-8" />
      </div>
      <div className="flex xl:hidden items-center justify-center text-gray-300 dark:text-gray-700 w-full">
        <ArrowDown strokeWidth={1} className="w-6 h-6" />
      </div>

      {/* 2. THERMAL STRESS */}
      <div className="flex flex-col flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Thermal Indices</h3>
        
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{hi}°</span>
            <span className="text-xs font-medium text-gray-500 uppercase">HI</span>
          </div>
          <div className="text-gray-300 dark:text-gray-600 font-light text-2xl">·</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{wbgt}°</span>
            <span className="text-xs font-medium text-gray-500 uppercase">WBGT</span>
          </div>
          <div className="text-gray-300 dark:text-gray-600 font-light text-2xl">·</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{utci}°</span>
            <span className="text-xs font-medium text-gray-500 uppercase">UTCI</span>
          </div>
        </div>
        
        <div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest opacity-80 border border-blue-200 dark:border-blue-800/30 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/10">
            [CALCULATED]
          </span>
        </div>
      </div>

      {/* CONNECTOR 2 */}
      <div className="hidden xl:flex items-center justify-center shrink-0 text-gray-300 dark:text-gray-700">
        <ArrowRight strokeWidth={1} className="w-8 h-8" />
      </div>
      <div className="flex xl:hidden items-center justify-center text-gray-300 dark:text-gray-700 w-full">
        <ArrowDown strokeWidth={1} className="w-6 h-6" />
      </div>

      {/* 3. HUMAN RISK */}
      <div className="flex flex-col flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Human Risk Impact</h3>
        
        <div className="flex items-center gap-4 mb-3">
          <div className={`text-3xl font-bold tracking-tight ${riskColor}`}>{score}</div>
          <div className="text-gray-300 dark:text-gray-600 font-light text-2xl">·</div>
          <div className={`text-3xl font-bold tracking-tight uppercase ${riskColor}`}>{tier}</div>
        </div>
        
        <div className="flex gap-2">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest opacity-80 border border-blue-200 dark:border-blue-800/30 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/10">
            [CALCULATED]
          </span>
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest opacity-80 border border-purple-200 dark:border-purple-800/30 px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/10">
            [EXPERIMENTAL]
          </span>
        </div>
      </div>

    </div>
  );
}
