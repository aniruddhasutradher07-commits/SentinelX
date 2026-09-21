import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function ExplainabilityWidget() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col">
      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Why is Risk High?</h3>
      
      <div className="flex flex-col gap-3 flex-1 justify-center text-sm">
        
        <div className="flex items-start gap-2">
          <ArrowUp className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-slate-700 block">High temperature</span>
            <span className="text-xs text-slate-500">Increases base heat load</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <ArrowDown className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-slate-700 block">High humidity</span>
            <span className="text-xs text-slate-500">Reduces evaporative cooling</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <ArrowUp className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-slate-700 block">High solar radiation</span>
            <span className="text-xs text-slate-500">Increases thermal exposure</span>
          </div>
        </div>

      </div>
    </div>
  );
}
