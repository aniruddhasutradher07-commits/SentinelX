import React from 'react';
import { Activity } from 'lucide-react';

export default function HeatwaveStatusWidget() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col mb-4 relative">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-wide">
        Live
      </div>
      <div className="flex items-center gap-1.5 mb-4 pr-12">
        <Activity className="w-4 h-4 text-sky-600 shrink-0" />
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">System Heat Alert Level</h3>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 z-10 shrink-0"></div>
          <div className="h-0.5 flex-1 bg-emerald-200 -mx-1"></div>
        </div>
        <div className="flex-1 flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 z-10 shrink-0"></div>
          <div className="h-0.5 flex-1 bg-yellow-200 -mx-1"></div>
        </div>
        <div className="flex-1 flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 z-10 shrink-0"></div>
          <div className="h-0.5 flex-1 bg-orange-200 -mx-1"></div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-600 z-10 shrink-0 border-[3px] border-red-200 ring-2 ring-red-600"></div>
        </div>
      </div>
      
      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mb-4 px-1">
        <span>Normal</span>
        <span className="ml-2">Watch</span>
        <span className="ml-3">Warning</span>
        <span className="text-red-600">Extreme</span>
      </div>

      <div className="bg-red-50/50 border border-red-100 rounded-lg p-3">
        <div className="text-xs font-bold text-red-700 mb-0.5">Extreme heat conditions detected</div>
        <div className="text-[10px] text-red-600/80 leading-tight">
          Risk expected to remain elevated over the next several days. Immediate intervention recommended for high-risk zones.
        </div>
      </div>
    </div>
  );
}
