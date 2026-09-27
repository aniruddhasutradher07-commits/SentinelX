import React, { useState } from 'react';
import { Heart, Brain, Droplets, Activity, Shield, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface OrganMetric {
  id: 'brain' | 'heart' | 'respiratory' | 'kidneys' | 'skin';
  name: string;
  shortName: string;
  icon: any;
  status: 'Normal' | 'Elevated Strain' | 'Critical Stress';
  primaryValue: string;
  primaryLabel: string;
  secondaryValue: string;
  secondaryLabel: string;
  interpretation: string;
  recommendation: string;
  x: number;
  y: number;
  accent: string;
}

interface OrganStrainHologramProps {
  score?: number;
}

export const OrganStrainHologram: React.FC<OrganStrainHologramProps> = ({ score = 78 }) => {
  const [selectedOrganId, setSelectedOrganId] = useState<string>('skin');
  const [isModelExpanded, setIsModelExpanded] = useState<boolean>(true);

  const isCritical = score >= 80;
  const isElevated = score >= 60;

  const organs: OrganMetric[] = [
    {
      id: 'brain',
      name: 'Central Nervous System',
      shortName: 'BRAIN',
      icon: Brain,
      status: 'Normal',
      primaryValue: 'NOT AVAILABLE',
      primaryLabel: 'Thermoregulatory Response',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Cognitive Fatigue Index',
      interpretation: 'No validated continuous cognitive metric is available in the current sensor array. CNS thermoregulatory response requires core temp or near-infrared spectroscopy.',
      recommendation: 'Mandatory shaded rest. Limit outdoor cognitive tasks. Monitor for confusion, slurred speech as heat stroke precursors.',
      x: 50,
      y: 14,
      accent: '#a78bfa',
    },
    {
      id: 'heart',
      name: 'Cardiovascular System',
      shortName: 'HEART',
      icon: Heart,
      status: isCritical ? 'Critical Stress' : isElevated ? 'Elevated Strain' : 'Normal',
      primaryValue: 'CALCULATED',
      primaryLabel: 'Estimated Tachycardia Elevation',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Estimated Cardiac Output',
      interpretation: 'Peripheral vasodilation shunts systemic blood to dermal vasculature for radiative cooling. Cardiac output increases 2–3× at extreme WBGT levels above 33°C.',
      recommendation: 'Refer to PhysioNet Experimental Replay for actual dataset HR patterns. Restrict heavy exertion above WBGT 28°C.',
      x: 53,
      y: 32,
      accent: '#f43f5e',
    },
    {
      id: 'respiratory',
      name: 'Respiratory System',
      shortName: 'LUNGS',
      icon: Activity,
      status: 'Normal',
      primaryValue: 'NOT AVAILABLE',
      primaryLabel: 'Estimated Tachypnea Rate',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Pulmonary Ventilation',
      interpretation: 'Respiratory rate estimation requires specialized impedance belt sensors not currently active in the IoT node array.',
      recommendation: 'Relocate affected workers to air-filtered cooling shelter. Avoid PM2.5 co-exposure during heatwave events.',
      x: 47,
      y: 39,
      accent: '#38bdf8',
    },
    {
      id: 'kidneys',
      name: 'Renal Function',
      shortName: 'RENAL',
      icon: Shield,
      status: 'Normal',
      primaryValue: 'NOT AVAILABLE',
      primaryLabel: 'Estimated Renal Perfusion Load',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Glomerular Filtration Estimate',
      interpretation: 'Renal perfusion cannot be accurately determined from surface wearables. Sustained dehydration above 2% bodyweight degrades GFR significantly.',
      recommendation: 'ORS (Oral Rehydration Salts) solution. Minimum 750 mL/hr for outdoor workers under extreme WBGT conditions.',
      x: 51,
      y: 51,
      accent: '#34d399',
    },
    {
      id: 'skin',
      name: 'Dermal & Sweat Glands',
      shortName: 'SKIN',
      icon: Droplets,
      status: isCritical ? 'Critical Stress' : 'Elevated Strain',
      primaryValue: 'CALCULATED',
      primaryLabel: 'Thermoregulatory Load',
      secondaryValue: 'NOT AVAILABLE',
      secondaryLabel: 'Evaporative Efficiency',
      interpretation: 'Trans-epidermal fluid loss rate at WBGT >33°C exceeds physiological replacement threshold. Sweat rate typically 0.5–1.5 L/hr; above this, thermoregulation becomes compromised.',
      recommendation: 'Refer to PhysioNet Experimental Replay for actual Skin Temp patterns. Apply evaporative cooling (misting, wet towels) at work sites.',
      x: 32,
      y: 58,
      accent: '#fb923c',
    },
  ];

  const activeOrgan = organs.find(o => o.id === selectedOrganId) || organs[4];

  const statusConfig: Record<string, { label: string; color: string; bg: string; ring: string }> = {
    'Critical Stress': { label: 'CRITICAL STRESS', color: '#f43f5e', bg: 'bg-rose-500/10', ring: 'border-rose-500/50' },
    'Elevated Strain': { label: 'ELEVATED STRAIN', color: '#fb923c', bg: 'bg-orange-500/10', ring: 'border-orange-500/50' },
    'Normal': { label: 'NORMAL', color: '#34d399', bg: 'bg-emerald-500/10', ring: 'border-emerald-500/50' },
  };

  const sc = statusConfig[activeOrgan.status];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 p-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
              EXPERIMENTAL PHYSIOLOGY REFERENCE
            </h2>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              Selected: <span className="text-slate-300 font-medium">{activeOrgan.name}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status pill */}
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest"
            style={{ color: sc.color, borderColor: `${sc.color}40`, backgroundColor: `${sc.color}12` }}
          >
            {sc.label}
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
            EXPERIMENTAL
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0">

        {/* LEFT — Holographic Body Silhouette */}
        <div className="lg:col-span-5 relative flex justify-center items-center py-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden">
          {/* Animated radar scan line */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
              style={{ animation: 'scanLine 4s linear infinite' }}
            />
          </div>

          {/* Corner decorations */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-cyan-500/30" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-cyan-500/30" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-cyan-500/30" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-cyan-500/30" />

          <div className="relative w-56 h-[380px] flex items-center justify-center">
            <svg viewBox="0 0 200 400" className="w-full h-full filter drop-shadow-[0_0_20px_rgba(56,189,248,0.25)]">
              <defs>
                <linearGradient id="bodyGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
                  <stop offset="40%" stopColor="#818cf8" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.06" />
                </linearGradient>
                <pattern id="hexP2" width="12" height="20.78" patternUnits="userSpaceOnUse" patternTransform="scale(0.55)">
                  <path d="M6 0 L12 3.46 L12 10.39 L6 13.86 L0 10.39 L0 3.46 Z" fill="none" stroke="rgba(56,189,248,0.12)" strokeWidth="1" />
                </pattern>
                <filter id="glow2">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <mask id="bodyMask2">
                  <path d="M100 20 C 112 20, 118 28, 118 42 C 118 55, 112 65, 108 68 C 120 72, 138 78, 146 95 C 152 110, 148 160, 142 195 C 140 205, 132 210, 128 215 C 128 220, 125 280, 120 350 C 118 375, 102 375, 102 350 C 102 280, 100 230, 100 230 C 100 230, 98 280, 98 350 C 98 375, 82 375, 80 350 C 75 280, 72 220, 72 215 C 68 210, 60 205, 58 195 C 52 160, 48 110, 54 95 C 62 78, 80 72, 92 68 C 88 65, 82 55, 82 42 C 82 28, 88 20, 100 20 Z" fill="white" />
                </mask>
              </defs>

              <rect x="0" y="0" width="200" height="400" fill="url(#hexP2)" mask="url(#bodyMask2)" />
              <path d="M100 20 C 112 20, 118 28, 118 42 C 118 55, 112 65, 108 68 C 120 72, 138 78, 146 95 C 152 110, 148 160, 142 195 C 140 205, 132 210, 128 215 C 128 220, 125 280, 120 350 C 118 375, 102 375, 102 350 C 102 280, 100 230, 100 230 C 100 230, 98 280, 98 350 C 98 375, 82 375, 80 350 C 75 280, 72 220, 72 215 C 68 210, 60 205, 58 195 C 52 160, 48 110, 54 95 C 62 78, 80 72, 92 68 C 88 65, 82 55, 82 42 C 82 28, 88 20, 100 20 Z"
                fill="url(#bodyGrad2)" stroke="#38bdf8" strokeWidth="1.5"
                style={{ animation: 'pulse 3s ease-in-out infinite' }}
              />

              {/* Spine */}
              <path d="M100 35 L100 210" stroke="#818cf8" strokeWidth="1.5" filter="url(#glow2)" strokeDasharray="3 5" opacity="0.7" />

              {/* Internal organ outlines */}
              <circle cx="100" cy="40" r="8" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.5" filter="url(#glow2)" />
              <path d="M95 90 C 95 90, 110 80, 110 95 C 110 110, 95 115, 95 115 C 95 115, 80 110, 80 95 C 80 80, 95 90, 95 90 Z" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.35" filter="url(#glow2)" />
              <path d="M92 80 C 80 80, 70 100, 75 120 C 80 120, 92 110, 92 80 Z" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.3" filter="url(#glow2)" />
              <path d="M108 80 C 120 80, 130 100, 125 120 C 120 120, 108 110, 108 80 Z" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.3" filter="url(#glow2)" />
              <ellipse cx="88" cy="158" rx="10" ry="14" fill="none" stroke="#34d399" strokeWidth="0.8" opacity="0.25" filter="url(#glow2)" />
              <ellipse cx="112" cy="158" rx="10" ry="14" fill="none" stroke="#34d399" strokeWidth="0.8" opacity="0.25" filter="url(#glow2)" />

              {/* Joint nodes */}
              {[
                [72, 85], [128, 85], [62, 140], [138, 140],
                [85, 215], [115, 215], [78, 285], [122, 285]
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="2.5" fill="#38bdf8" opacity="0.45" />
              ))}
            </svg>

            {/* Interactive organ hotspots */}
            {organs.map((organ) => {
              const isSelected = activeOrgan.id === organ.id;
              return (
                <button
                  key={organ.id}
                  onClick={() => setSelectedOrganId(organ.id)}
                  style={{ left: `${organ.x}%`, top: `${organ.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none"
                  title={organ.name}
                >
                  {isSelected && (
                    <span
                      className="absolute inset-0 -m-3 rounded-full opacity-40 animate-ping"
                      style={{ backgroundColor: organ.accent }}
                    />
                  )}
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-lg ${isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10 opacity-70 hover:opacity-100'}`}
                    style={{
                      backgroundColor: '#0c1117',
                      borderColor: organ.accent,
                      boxShadow: isSelected ? `0 0 16px ${organ.accent}70` : `0 0 6px ${organ.accent}30`,
                    }}
                  >
                    <organ.icon className="w-3.5 h-3.5" style={{ color: organ.accent }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Data Panel */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">

          {/* Organ Tab Strip */}
          <div className="flex items-center gap-1 bg-slate-950/60 rounded-xl p-1 border border-slate-800/60">
            {organs.map((organ) => {
              const isActive = activeOrgan.id === organ.id;
              return (
                <button
                  key={organ.id}
                  onClick={() => setSelectedOrganId(organ.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  style={isActive ? { backgroundColor: `${organ.accent}22`, color: organ.accent } : {}}
                >
                  <organ.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{organ.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Primary Signal */}
          <div className="bg-slate-950/60 border rounded-xl p-4 transition-all duration-300" style={{ borderColor: `${activeOrgan.accent}30` }}>
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block mb-2">
              PRIMARY SIGNAL
            </span>
            <div className="flex items-end justify-between gap-3">
              <div
                className={`text-2xl font-mono font-bold tracking-tight ${activeOrgan.primaryValue === 'NOT AVAILABLE' ? 'text-slate-500' : 'text-white'}`}
              >
                {activeOrgan.primaryValue}
              </div>
              <span
                className="text-xs font-medium text-right"
                style={{ color: `${activeOrgan.accent}cc` }}
              >
                {activeOrgan.primaryLabel}
              </span>
            </div>
            {activeOrgan.primaryValue === 'NOT AVAILABLE' && (
              <p className="text-[10px] text-slate-600 font-mono mt-2">Sensor not active in current node array</p>
            )}
            {activeOrgan.primaryValue === 'CALCULATED' && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] text-cyan-400 font-mono">Derived from H-THERM biophysical model</span>
              </div>
            )}
          </div>

          {/* Secondary Signal */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4">
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block mb-2">
              SECONDARY SIGNAL
            </span>
            <div className="flex items-end justify-between gap-3">
              <div className={`text-xl font-mono font-semibold tracking-tight ${activeOrgan.secondaryValue === 'NOT AVAILABLE' ? 'text-slate-600' : 'text-cyan-400'}`}>
                {activeOrgan.secondaryValue}
              </div>
              <span className="text-xs text-slate-500 font-medium text-right">{activeOrgan.secondaryLabel}</span>
            </div>
          </div>

          {/* Model Interpretation Collapsible */}
          <div className="flex-1 bg-slate-950/80 border border-slate-800/60 rounded-xl overflow-hidden flex flex-col">
            <button
              onClick={() => setIsModelExpanded(!isModelExpanded)}
              className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800/60 transition-colors"
            >
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Model Interpretation
              </span>
              {isModelExpanded
                ? <ChevronUp className="w-4 h-4 text-slate-500" />
                : <ChevronDown className="w-4 h-4 text-slate-500" />
              }
            </button>

            {isModelExpanded && (
              <div className="p-4 border-t border-slate-800/50 space-y-4 flex-1">
                <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800/40">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1.5">
                    Thermoregulatory Response
                  </span>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {activeOrgan.interpretation}
                  </p>
                </div>
                <div className="bg-slate-900/40 rounded-lg p-3 border border-emerald-500/10">
                  <span className="text-[9px] font-mono text-emerald-500/80 uppercase tracking-widest block mb-1.5">
                    Reference guidance
                  </span>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {activeOrgan.recommendation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scan line keyframe injected inline */}
      <style>{`
        @keyframes scanLine {
          0% { top: -2px; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
