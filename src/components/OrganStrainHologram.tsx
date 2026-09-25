import React, { useState } from 'react';
import { Heart, Brain, Droplets, Activity, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface OrganMetric {
  id: 'brain' | 'heart' | 'respiratory' | 'kidneys' | 'skin';
  name: string;
  icon: any;
  status: 'Normal' | 'Elevated Strain' | 'Critical Stress';
  primaryValue: string;
  primaryLabel: string;
  secondaryValue: string;
  secondaryLabel: string;
  interpretation: string;
  reference: string;
  x: number; // percentage in SVG
  y: number; // percentage in SVG
}

interface OrganStrainHologramProps {
  score?: number; // H-THERM Score 0-100
}

export const OrganStrainHologram: React.FC<OrganStrainHologramProps> = ({
  score = 78,
}) => {
  const [selectedOrganId, setSelectedOrganId] = useState<string>('skin');
  const [isModelExpanded, setIsModelExpanded] = useState<boolean>(true);

  // Derive dynamic organ indicators based on H-THERM score
  const isCritical = score >= 80;
  const isElevated = score >= 60;

  const organs: OrganMetric[] = [
    {
      id: 'brain',
      name: 'Central Nervous System',
      icon: Brain,
      status: 'Normal',
      primaryValue: 'NOT AVAILABLE',
      primaryLabel: 'Thermoregulatory Response',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Cognitive Fatigue',
      interpretation: 'No validated continuous cognitive metric available in current sensor array.',
      reference: 'Standard shaded rest recommended.',
      x: 50,
      y: 16,
    },
    {
      id: 'heart',
      name: 'Cardiovascular System',
      icon: Heart,
      status: isCritical ? 'Critical Stress' : isElevated ? 'Elevated Strain' : 'Normal',
      primaryValue: 'CALCULATED',
      primaryLabel: 'Estimated Tachycardia Elevation',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Estimated Cardiac Output',
      interpretation: 'Peripheral vasodilation shunts systemic blood to skin for radiative cooling.',
      reference: 'Refer to Experimental Physiology Replay for actual dataset HR patterns.',
      x: 53,
      y: 33,
    },
    {
      id: 'respiratory',
      name: 'Respiratory Airway',
      icon: Activity,
      status: 'Normal',
      primaryValue: 'NOT AVAILABLE',
      primaryLabel: 'Estimated Tachypnea',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Airway Exchange',
      interpretation: 'Respiratory rate requires specialized belt sensors not currently active.',
      reference: 'Relocation to air-filtered cooling shelter.',
      x: 47,
      y: 38,
    },
    {
      id: 'kidneys',
      name: 'Renal Function',
      icon: ShieldAlert,
      status: 'Normal',
      primaryValue: 'NOT AVAILABLE',
      primaryLabel: 'Estimated Renal Load',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Glomerular Filtration Estimate',
      interpretation: 'Renal perfusion metrics cannot be accurately determined from surface wearables.',
      reference: 'Oral Rehydration Salts (ORS) solution.',
      x: 51,
      y: 50,
    },
    {
      id: 'skin',
      name: 'Dermal & Sweat Glands',
      icon: Droplets,
      status: isCritical ? 'Critical Stress' : 'Elevated Strain',
      primaryValue: 'CALCULATED',
      primaryLabel: 'Thermoregulatory Load',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Evaporative Efficiency',
      interpretation: 'Massive trans-epidermal fluid loss impacts thermoregulation.',
      reference: 'Refer to Experimental Physiology Replay for actual dataset Skin Temp patterns.',
      x: 32,
      y: 58,
    },
  ];

  const activeOrgan = organs.find(o => o.id === selectedOrganId) || organs[4];

  const getStatusColor = (status: string) => {
    if (status === 'Critical Stress') return '#C0392B';
    if (status === 'Elevated Strain') return '#D9772E';
    return '#3A7D5C';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 p-5 w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
            PHYSIOLOGICAL RESPONSE REFERENCE
          </h2>
          <span className="text-xs text-slate-400 font-sans mt-1 block">
            Selected Subsystem: <span className="text-white font-medium">{activeOrgan.name}</span>
          </span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
          EXPERIMENTAL
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
        
        {/* LEFT 45%: Holographic Body Silhouette (5 cols out of 12 = 41.6%) */}
        <div className="lg:col-span-5 relative flex justify-center items-center py-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden">
          {/* Radar Scan Grid Line */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
          </div>

          <div className="relative w-64 h-[400px] flex items-center justify-center">
            {/* Stylized Futuristic Anatomical Silhouette */}
            <svg
              viewBox="0 0 200 400"
              className="w-full h-full filter drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]"
            >
              <defs>
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="40%" stopColor="#818cf8" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
                </linearGradient>
                <pattern id="hexPattern" width="12" height="20.7846" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
                  <path d="M6 0 L12 3.4641 L12 10.3923 L6 13.8564 L0 10.3923 L0 3.4641 Z" fill="none" stroke="rgba(56,189,248,0.15)" strokeWidth="1" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Hex Background in Body */}
              <mask id="bodyMask">
                {/* Advanced Human Path */}
                <path d="M100 20 C 112 20, 118 28, 118 42 C 118 55, 112 65, 108 68 C 120 72, 138 78, 146 95 C 152 110, 148 160, 142 195 C 140 205, 132 210, 128 215 C 128 220, 125 280, 120 350 C 118 375, 102 375, 102 350 C 102 280, 100 230, 100 230 C 100 230, 98 280, 98 350 C 98 375, 82 375, 80 350 C 75 280, 72 220, 72 215 C 68 210, 60 205, 58 195 C 52 160, 48 110, 54 95 C 62 78, 80 72, 92 68 C 88 65, 82 55, 82 42 C 82 28, 88 20, 100 20 Z" fill="white" />
              </mask>

              <rect x="0" y="0" width="200" height="400" fill="url(#hexPattern)" mask="url(#bodyMask)" />
              
              {/* Outer Shell */}
              <path d="M100 20 C 112 20, 118 28, 118 42 C 118 55, 112 65, 108 68 C 120 72, 138 78, 146 95 C 152 110, 148 160, 142 195 C 140 205, 132 210, 128 215 C 128 220, 125 280, 120 350 C 118 375, 102 375, 102 350 C 102 280, 100 230, 100 230 C 100 230, 98 280, 98 350 C 98 375, 82 375, 80 350 C 75 280, 72 220, 72 215 C 68 210, 60 205, 58 195 C 52 160, 48 110, 54 95 C 62 78, 80 72, 92 68 C 88 65, 82 55, 82 42 C 82 28, 88 20, 100 20 Z" 
                    fill="url(#bodyGrad)" 
                    stroke="#38bdf8" 
                    strokeWidth="1.5" 
                    className="animate-pulse"
              />

              {/* Central Nervous System / Spine */}
              <path d="M100 35 L100 210" stroke="#818cf8" strokeWidth="2" filter="url(#glow)" strokeDasharray="4 4" className="opacity-80" />
              
              {/* Brain node indicator */}
              <circle cx="100" cy="40" r="10" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.6" filter="url(#glow)"/>
              
              {/* Heart node indicator */}
              <path d="M95 90 C 95 90, 110 80, 110 95 C 110 110, 95 115, 95 115 C 95 115, 80 110, 80 95 C 80 80, 95 90, 95 90 Z" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.4" filter="url(#glow)"/>
              
              {/* Lungs outline */}
              <path d="M92 80 C 80 80, 70 100, 75 120 C 80 120, 92 110, 92 80 Z" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.3" filter="url(#glow)"/>
              <path d="M108 80 C 120 80, 130 100, 125 120 C 120 120, 108 110, 108 80 Z" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.3" filter="url(#glow)"/>

              {/* Joint Nodes */}
              <circle cx="72" cy="85" r="3" fill="#38bdf8" opacity="0.5" />
              <circle cx="128" cy="85" r="3" fill="#38bdf8" opacity="0.5" />
              <circle cx="62" cy="140" r="2" fill="#38bdf8" opacity="0.5" />
              <circle cx="138" cy="140" r="2" fill="#38bdf8" opacity="0.5" />
              <circle cx="85" cy="215" r="4" fill="#38bdf8" opacity="0.5" />
              <circle cx="115" cy="215" r="4" fill="#38bdf8" opacity="0.5" />
              <circle cx="78" cy="285" r="3" fill="#38bdf8" opacity="0.5" />
              <circle cx="122" cy="285" r="3" fill="#38bdf8" opacity="0.5" />
            </svg>

            {/* Glowing Interactive Organ Target Nodes */}
            {organs.map((organ) => {
              const isSelected = activeOrgan.id === organ.id;
              const color = getStatusColor(organ.status);

              return (
                <button
                  key={organ.id}
                  onClick={() => setSelectedOrganId(organ.id)}
                  style={{ left: `${organ.x}%`, top: `${organ.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none"
                  title={organ.name}
                >
                  <span
                    className={`absolute inset-0 -m-2 rounded-full opacity-75 animate-ping ${isSelected ? 'block' : 'hidden group-hover:block'}`}
                    style={{ backgroundColor: color }}
                  />
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-lg ${isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'}`}
                    style={{ backgroundColor: '#0E1114', borderColor: color, boxShadow: `0 0 12px ${color}80` }}
                  >
                    <organ.icon className="w-4 h-4" style={{ color }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT 55%: Selected physiological subsystem (7 cols out of 12 = 58.3%) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Tab Strip */}
          <div className="flex items-center gap-1 border-b border-slate-800">
            {organs.map((organ) => (
              <button
                key={organ.id}
                onClick={() => setSelectedOrganId(organ.id)}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  activeOrgan.id === organ.id
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {organ.id}
              </button>
            ))}
          </div>

          {/* Primary Signal */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-2">
              PRIMARY SIGNAL
            </span>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-mono font-bold text-white tracking-tight">
                {activeOrgan.primaryValue}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {activeOrgan.primaryLabel}
              </div>
            </div>
          </div>

          {/* Secondary Signal */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-2">
              SECONDARY SIGNAL
            </span>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-mono font-semibold text-cyan-400 tracking-tight">
                {activeOrgan.secondaryValue}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {activeOrgan.secondaryLabel}
              </div>
            </div>
          </div>

          {/* Model Interpretation Collapsible Block */}
          <div className="mt-auto bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
            <button 
              onClick={() => setIsModelExpanded(!isModelExpanded)}
              className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800/80 transition-colors"
            >
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                MODEL INTERPRETATION
              </span>
              {isModelExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            
            {isModelExpanded && (
              <div className="p-4 border-t border-slate-800/50 space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                    THERMOREGULATORY RESPONSE
                  </span>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {activeOrgan.interpretation}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                    EXPERIMENTAL PHYSIOLOGY REFERENCE
                  </span>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {activeOrgan.reference}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
