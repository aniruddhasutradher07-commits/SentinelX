import React from 'react';
import { ShieldAlert, Activity } from 'lucide-react';

interface ExecutiveSummaryWidgetProps {
  districtName: string;
  riskTier: string;
  temperature: number;
  humidity: number;
  peakDay: string;
}

export default function ExecutiveSummaryWidget({ districtName, riskTier, temperature, humidity, peakDay }: ExecutiveSummaryWidgetProps) {
  
  const getActionRecommendation = (tier: string) => {
    const t = tier.toLowerCase();
    if (t === 'red' || t === 'extreme') return 'Mass targeted heat advisory, active cooling centers';
    if (t === 'orange' || t === 'high') return 'Targeted heat advisory, review readiness';
    if (t === 'yellow' || t === 'moderate') return 'General public awareness';
    return 'Normal operations';
  };

  const drivers = [];
  if (temperature > 38) drivers.push('high temperature');
  if (humidity > 60) drivers.push('elevated humidity');
  
  const driverStr = drivers.length > 0 ? `driven primarily by ${drivers.join(' and ')}.` : 'driven by localized environmental factors.';

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-sm border border-slate-700 p-4 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
        <Activity className="w-32 h-32 -mt-4 -mr-4" />
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4 text-amber-400" />
        <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Executive Summary</h3>
      </div>
      
      <p className="text-[13px] md:text-sm font-medium leading-relaxed mb-4 text-slate-100 max-w-4xl relative z-10">
        {districtName} is currently under <span className={`font-bold ${riskTier.toLowerCase() === 'extreme' ? 'text-red-400' : 'text-amber-400'}`}>{riskTier} Heat Risk</span>, with elevated thermal stress {driverStr}
      </p>
      
      <div className="flex flex-wrap gap-4 md:gap-8 text-[11px] relative z-10">
        <div>
          <span className="text-slate-400 uppercase block mb-1">Peak Projected Risk</span>
          <span className="font-bold text-white">{peakDay}</span>
        </div>
        <div>
          <span className="text-slate-400 uppercase block mb-1">Priority</span>
          <span className="font-bold text-white">High-vulnerability zones</span>
        </div>
        <div>
          <span className="text-slate-400 uppercase block mb-1">Recommended Response</span>
          <span className="font-bold text-white">{getActionRecommendation(riskTier)}</span>
        </div>
      </div>
    </div>
  );
}
