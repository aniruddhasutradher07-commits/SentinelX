import React from 'react';
import { Activity } from 'lucide-react';

interface HeatwaveStatusWidgetProps {
  currentTier: string;
}

export default function HeatwaveStatusWidget({ currentTier }: HeatwaveStatusWidgetProps) {
  const tier = (currentTier || 'NORMAL').toUpperCase();
  
  const isNormal = tier === 'NORMAL' || tier === 'LOW';
  const isWatch = tier === 'MODERATE' || tier === 'YELLOW';
  const isWarning = tier === 'HIGH' || tier === 'ORANGE';
  const isExtreme = tier === 'EXTREME' || tier === 'RED';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-full relative dark:bg-boxdark dark:border-strokedark">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-wide dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20">
        [CALCULATED]
      </div>
      <div className="flex items-center gap-1.5 mb-4 pr-12">
        <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
        <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate">System Heat Alert Level</h3>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full z-10 shrink-0 ${isNormal ? 'w-4 h-4 bg-emerald-500 border-[3px] border-emerald-200 ring-2 ring-emerald-600' : 'bg-emerald-500'}`}></div>
          <div className="h-0.5 flex-1 bg-emerald-200 dark:bg-emerald-900 -mx-1"></div>
        </div>
        <div className="flex-1 flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full z-10 shrink-0 ${isWatch ? 'w-4 h-4 bg-yellow-400 border-[3px] border-yellow-200 ring-2 ring-yellow-400' : 'bg-yellow-400'}`}></div>
          <div className="h-0.5 flex-1 bg-yellow-200 dark:bg-yellow-900 -mx-1"></div>
        </div>
        <div className="flex-1 flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full z-10 shrink-0 ${isWarning ? 'w-4 h-4 bg-orange-500 border-[3px] border-orange-200 ring-2 ring-orange-500' : 'bg-orange-500'}`}></div>
          <div className="h-0.5 flex-1 bg-orange-200 dark:bg-orange-900 -mx-1"></div>
        </div>
        <div className="flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full z-10 shrink-0 ${isExtreme ? 'w-4 h-4 bg-red-600 border-[3px] border-red-200 ring-2 ring-red-600' : 'bg-red-600'}`}></div>
        </div>
      </div>
      
      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mb-4 px-1">
        <span className={isNormal ? 'text-emerald-600' : ''}>Normal</span>
        <span className={`ml-2 ${isWatch ? 'text-yellow-600' : ''}`}>Watch</span>
        <span className={`ml-3 ${isWarning ? 'text-orange-600' : ''}`}>Warning</span>
        <span className={isExtreme ? 'text-red-600' : ''}>Extreme</span>
      </div>

      <div className={`rounded-lg p-3 ${isExtreme ? 'bg-red-50/50 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30' : isWarning ? 'bg-orange-50/50 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/30' : isWatch ? 'bg-yellow-50/50 border border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/30' : 'bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30'}`}>
        <div className={`text-xs font-bold mb-0.5 ${isExtreme ? 'text-red-700 dark:text-red-400' : isWarning ? 'text-orange-700 dark:text-orange-400' : isWatch ? 'text-yellow-700 dark:text-yellow-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
          {isExtreme ? 'Extreme heat conditions detected' : isWarning ? 'High heat conditions detected' : isWatch ? 'Moderate heat conditions detected' : 'Normal thermal conditions'}
        </div>
        <div className={`text-[10px] leading-tight ${isExtreme ? 'text-red-600/80 dark:text-red-400/80' : isWarning ? 'text-orange-600/80 dark:text-orange-400/80' : isWatch ? 'text-yellow-700/80 dark:text-yellow-500/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
          {isExtreme ? 'Risk expected to remain elevated. Immediate intervention recommended for high-risk zones.' : isWarning ? 'Active monitoring required. Activate cooling centers in vulnerable areas.' : isWatch ? 'Monitor environmental conditions. Vulnerable groups should limit exposure.' : 'No immediate action required. Maintain standard monitoring.'}
        </div>
      </div>
    </div>
  );
}
