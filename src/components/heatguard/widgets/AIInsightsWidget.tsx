import React from 'react';
import { BrainCircuit } from 'lucide-react';

export default function AIInsightsWidget() {
  const insights = [
    "Risk is expected to increase over the next 48 hours.",
    "High humidity is reducing evaporative cooling.",
    "Low wind conditions may increase thermal stress.",
    "Several vulnerable zones require attention."
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-4 h-4 text-purple-600" />
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">AI Insights</h3>
        </div>
        <button className="text-[10px] text-sky-600 font-medium hover:underline">View Model Explanation →</button>
      </div>

      <div className="flex-1 flex flex-col gap-2.5">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></div>
            <p className="text-[11px] text-slate-700 leading-tight">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
