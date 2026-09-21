import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function ActionCenterWidget() {
  const actions = [
    "Activate heat action protocol",
    "Open/extend cooling centers",
    "Issue targeted alerts to high-risk zones",
    "Consider outdoor work-hour adjustments",
    "Prepare healthcare facilities"
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col">
      <div className="flex items-center gap-1.5 mb-4">
        <ShieldAlert className="w-4 h-4 text-sky-600" />
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Recommended Actions</h3>
      </div>

      <div className="flex border-b border-slate-200 mb-3">
        <button className="flex-1 py-1.5 text-[11px] font-bold text-sky-600 border-b-2 border-sky-600 text-center">For Authorities</button>
        <button className="flex-1 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 text-center">For Citizens</button>
        <button className="flex-1 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 text-center">For Healthcare</button>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {actions.map((action, i) => (
          <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
            <input 
              type="checkbox" 
              defaultChecked={i === 0 || i === 1 || i === 2 || i === 4}
              className="mt-0.5 rounded text-sky-600 border-slate-300 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer" 
            />
            <span className="text-[11px] text-slate-700 leading-tight group-hover:text-slate-900">{action}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
        <button className="bg-[#1A2639] hover:bg-slate-800 text-white text-[11px] font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5" />
          Generate Advisory
        </button>
      </div>
    </div>
  );
}
