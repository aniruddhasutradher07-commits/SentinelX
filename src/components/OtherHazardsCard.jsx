import React from 'react';
import { CloudRain, Waves, Tornado, Mountain } from 'lucide-react';

export default function OtherHazardsCard({ telemetry }) {
  // Extract multi_hazard from the live-feed polling telemetry
  const mh = telemetry?.multi_hazard || {
    heavy_rain: { risk_level: 'No Threat' },
    flood_risk: { risk_level: 'No Threat' },
    cyclone: { risk_level: 'No Threat' },
    landslide: { risk_level: 'No Threat' }
  };

  const getRiskStyles = (risk) => {
    if (risk === 'Critical') return 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.3)]';
    if (risk === 'Warning') return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    if (risk === 'Monitoring') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  };

  const hazards = [
    { label: 'Heavy Rain', icon: CloudRain, color: 'text-sky-400', risk: mh.heavy_rain.risk_level },
    { label: 'Flood Risk', icon: Waves, color: 'text-cyan-400', risk: mh.flood_risk.risk_level },
    { label: 'Cyclone', icon: Tornado, color: 'text-slate-400', risk: mh.cyclone.risk_level },
    { label: 'Landslide', icon: Mountain, color: 'text-amber-700', risk: mh.landslide.risk_level },
  ];

  return (
    <div className="bg-[#14171A] rounded-2xl p-5 border border-white/[0.08]">
      <h3 className="text-sm font-bold text-white font-display flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
        Multi-Hazard & Secondary Threat Signals
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {hazards.map((h, i) => (
          <div key={i} className="flex flex-col bg-[#0B0D0E] p-3 rounded-xl border border-white/[0.05] justify-between">
            <div className="flex items-center gap-2 mb-3">
              <h.icon className={`w-4 h-4 ${h.color}`} />
              <span className="text-xs text-slate-300 font-semibold">{h.label}</span>
            </div>
            
            <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold border text-center ${getRiskStyles(h.risk)}`}>
              {h.risk.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
