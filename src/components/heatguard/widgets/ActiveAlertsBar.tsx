import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function ActiveAlertsBar() {
  return (
    <div className="bg-white border-t border-slate-200 h-12 flex items-center px-6 shrink-0 z-10 relative">
      <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider pr-6 border-r border-slate-200 shrink-0">
        <AlertCircle className="w-4 h-4" />
        Active Alerts (3)
      </div>

      <div className="flex-1 flex items-center overflow-hidden px-6 gap-8">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
          <span className="text-xs text-slate-600 font-medium">Extreme Heat Risk in Khordha (12:00 PM – 5:00 PM)</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
          <span className="text-xs text-slate-600 font-medium">High Thermal Stress in Jatni and Begunia</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0"></span>
          <span className="text-xs text-slate-600 font-medium">Heatwave likely to continue for next 2 days</span>
        </div>
      </div>

      <button className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 pl-6 border-l border-slate-200 shrink-0">
        View All Alerts <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
