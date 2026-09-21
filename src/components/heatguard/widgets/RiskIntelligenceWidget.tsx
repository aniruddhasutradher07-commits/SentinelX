import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';

export default function RiskIntelligenceWidget() {
  const hotspots = [
    { name: 'Khordha (Municipal Area)', level: 'Extreme', color: 'bg-red-600' },
    { name: 'Jatni', level: 'Extreme', color: 'bg-red-600' },
    { name: 'Begunia', level: 'High', color: 'bg-orange-500' },
    { name: 'Tangi', level: 'High', color: 'bg-orange-500' },
    { name: 'Balianta', level: 'High', color: 'bg-orange-500' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col">
      <div className="flex items-center gap-1.5 mb-4">
        <Target className="w-4 h-4 text-sky-600" />
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Risk Intelligence</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 border-b border-slate-100 pb-5">
        <div>
          <div className="text-[10px] text-slate-500 font-medium mb-1">Thermal Stress</div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-600"></span> Extreme
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-medium mb-1">Mortality Risk</div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-orange-500">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span> High
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-medium mb-1">Vulnerability Level</div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-600"></span> High
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-medium mb-1">Risk Trend</div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-red-600">
            <AlertTriangle className="w-3.5 h-3.5" /> Increasing
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Top 5 High-Risk Zones</h4>
        <button className="text-[10px] text-sky-600 font-medium hover:underline">View All →</button>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {hotspots.map((spot, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">{idx + 1}. {spot.name}</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${spot.color}`}></span>
              <span className={`font-medium ${spot.level === 'Extreme' ? 'text-red-600' : 'text-orange-500'}`}>{spot.level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
