import React, { useState } from 'react';
import { Heart, Brain, Droplets, Activity, ShieldAlert, Sparkles, X } from 'lucide-react';

interface OrganMetric {
  id: 'brain' | 'heart' | 'kidneys' | 'skin' | 'respiratory';
  name: string;
  icon: any;
  status: 'Normal' | 'Elevated Strain' | 'Critical Stress';
  value: string;
  subtext: string;
  clinicalImpact: string;
  countermeasure: string;
  x: number; // percentage in SVG
  y: number; // percentage in SVG
}

interface OrganStrainHologramProps {
  score?: number; // H-THERM Score 0-100
  wbgt?: number;
  ambientTemp?: number;
}

export const OrganStrainHologram: React.FC<OrganStrainHologramProps> = ({
  score = 78,
  wbgt = 32.4,
  ambientTemp = 39.5,
}) => {
  const [selectedOrgan, setSelectedOrgan] = useState<OrganMetric | null>(null);

  // Derive dynamic organ indicators based on H-THERM score
  const isCritical = score >= 80;
  const isElevated = score >= 60;

  const organs: OrganMetric[] = [
    {
      id: 'brain',
      name: 'Central Nervous System (Brain)',
      icon: Brain,
      status: isCritical ? 'Critical Stress' : isElevated ? 'Elevated Strain' : 'Normal',
      value: isCritical ? 'Hyperthermia Delirium Risk' : isElevated ? 'Cognitive Fatigue (+35% lag)' : 'Optimal Neurological Function',
      subtext: isCritical ? 'Core temp >39.0°C danger' : 'Reaction time slowed by 420ms',
      clinicalImpact: 'Impaired thermoregulatory hypothalamus signaling leading to heat syncope, dizziness, and loss of motor coordination.',
      countermeasure: 'Immediate shaded rest, cranial cold pack immersion, electrolyte replacement.',
      x: 50,
      y: 16,
    },
    {
      id: 'heart',
      name: 'Cardiovascular System (Heart)',
      icon: Heart,
      status: isCritical ? 'Critical Stress' : isElevated ? 'Elevated Strain' : 'Normal',
      value: `+${Math.round(score * 0.35 + 8)} BPM Tachycardia Elevation`,
      subtext: `Cardiac output ${ (1.0 + score * 0.006).toFixed(2) }× baseline`,
      clinicalImpact: 'Peripheral vasodilation shunts systemic blood to skin for radiative cooling, causing diastolic pressure drops and stroke risk.',
      countermeasure: 'Cessation of physical exertion, passive supine positioning with elevated legs.',
      x: 53,
      y: 33,
    },
    {
      id: 'respiratory',
      name: 'Respiratory Airway (Lungs)',
      icon: Activity,
      status: isElevated ? 'Elevated Strain' : 'Normal',
      value: `${Math.round(14 + score * 0.12)} Breaths/min Tachypnea`,
      subtext: 'High-enthalpy convective heat intake',
      clinicalImpact: 'Inhaling ambient air at >38°C accelerates respiratory heat exchange and mucosal moisture loss.',
      countermeasure: 'Relocation to air-filtered cooling shelter, nasal hydration spray.',
      x: 47,
      y: 38,
    },
    {
      id: 'kidneys',
      name: 'Renal Function (Kidneys)',
      icon: ShieldAlert,
      status: isCritical ? 'Critical Stress' : isElevated ? 'Elevated Strain' : 'Normal',
      value: isCritical ? 'Severe AKI Hypovolemia Risk' : isElevated ? 'Elevated Filtration Burden' : 'Stable Electrolyte Balance',
      subtext: `GFR strain: -${Math.round(score * 0.25)}% filtration rate`,
      clinicalImpact: 'Prolonged sweating without oral rehydration causes acute tubular necrosis and elevated serum creatinine.',
      countermeasure: 'Oral Rehydration Salts (ORS) solution with sodium chloride and potassium citrate.',
      x: 51,
      y: 50,
    },
    {
      id: 'skin',
      name: 'Dermal & Sweat Glands (Skin)',
      icon: Droplets,
      status: isCritical ? 'Critical Stress' : 'Elevated Strain',
      value: `${(0.4 + score * 0.012).toFixed(2)} Liters/Hour Sweat Loss`,
      subtext: `Evaporative efficiency: ${Math.max(20, Math.round(100 - score * 0.75))}%`,
      clinicalImpact: 'Massive trans-epidermal fluid loss leads to hyponatremia, painful heat cramps, and dermal prickling.',
      countermeasure: 'Evaporative misting spray, loose open-weave cotton clothing, cool damp towels.',
      x: 32,
      y: 58,
    },
  ];

  const activeOrgan = selectedOrgan || organs[0];

  const getStatusColor = (status: string) => {
    if (status === 'Critical Stress') return '#C0392B';
    if (status === 'Elevated Strain') return '#D9772E';
    return '#3A7D5C';
  };

  return (
    <div className="bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-white/[0.08] p-5 shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div 
        className="pointer-events-none absolute -left-10 -top-10 w-48 h-48 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: getStatusColor(activeOrgan.status) }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-display">
                Biotech Human Physiological Strain Hologram
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold">
                ISO 7933 / PHS Model
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
                [CALCULATED]
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-organ heat strain distribution modeled at {wbgt}°C WBGT &amp; {ambientTemp}°C dry-bulb
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Click any organ node to inspect pathology
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Holographic Body Silhouette with Interactive Glowing Nodes */}
        <div className="lg:col-span-5 relative flex justify-center items-center py-2 bg-[#0B0D0E]/60 rounded-2xl border border-white/[0.05]">
          {/* Radar Scan Grid Line */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-20">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
          </div>

          <div className="relative w-64 h-96 flex items-center justify-center">
            {/* Stylized Futuristic Anatomical Silhouette */}
            <svg
              viewBox="0 0 200 360"
              className="w-full h-full filter drop-shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            >
              <defs>
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                </linearGradient>
                <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect x="0" y="0" width="200" height="360" fill="url(#gridPattern)" />

              {/* Head */}
              <ellipse cx="100" cy="50" rx="24" ry="30" fill="url(#bodyGrad)" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Neck */}
              <rect x="92" y="80" width="16" height="16" rx="4" fill="url(#bodyGrad)" stroke="#38bdf8" strokeWidth="1" />
              {/* Torso & Shoulders */}
              <path
                d="M 52 100 Q 100 88 148 100 L 138 200 Q 100 206 62 200 Z"
                fill="url(#bodyGrad)"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              {/* Left Arm */}
              <path d="M 52 100 L 32 180 L 26 240" fill="none" stroke="#38bdf8" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
              {/* Right Arm */}
              <path d="M 148 100 L 168 180 L 174 240" fill="none" stroke="#38bdf8" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
              {/* Pelvis */}
              <path d="M 62 200 L 138 200 L 126 230 L 74 230 Z" fill="url(#bodyGrad)" stroke="#38bdf8" strokeWidth="1" />
              {/* Left Leg */}
              <path d="M 80 230 L 74 300 L 72 350" fill="none" stroke="#38bdf8" strokeWidth="16" strokeLinecap="round" opacity="0.6" />
              {/* Right Leg */}
              <path d="M 120 230 L 126 300 L 128 350" fill="none" stroke="#38bdf8" strokeWidth="16" strokeLinecap="round" opacity="0.6" />

              {/* Spine line */}
              <line x1="100" y1="85" x2="100" y2="220" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2 2" />
            </svg>

            {/* Glowing Interactive Organ Target Nodes */}
            {organs.map((organ) => {
              const isSelected = activeOrgan.id === organ.id;
              const color = getStatusColor(organ.status);

              return (
                <button
                  key={organ.id}
                  onClick={() => setSelectedOrgan(organ)}
                  style={{
                    left: `${organ.x}%`,
                    top: `${organ.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none"
                  title={organ.name}
                >
                  {/* Outer Pulsing Aura */}
                  <span
                    className={`absolute inset-0 -m-2 rounded-full opacity-75 animate-ping ${
                      isSelected ? 'block' : 'hidden group-hover:block'
                    }`}
                    style={{ backgroundColor: color }}
                  />

                  {/* Organ Node Button */}
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-lg ${
                      isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                    }`}
                    style={{
                      backgroundColor: '#0E1114',
                      borderColor: color,
                      boxShadow: `0 0 12px ${color}80`,
                    }}
                  >
                    <organ.icon className="w-4 h-4" style={{ color }} />
                  </div>

                  {/* Pulsing Tag */}
                  <span className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#14171A] border border-white/[0.1] text-slate-300 whitespace-nowrap shadow opacity-80 group-hover:opacity-100">
                    {organ.id.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Organ Pathology & Countermeasure Panel */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="bg-[#0B0D0E]/80 border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <activeOrgan.icon
                  className="w-5 h-5"
                  style={{ color: getStatusColor(activeOrgan.status) }}
                />
                <h4 className="text-base font-bold text-white font-display">
                  {activeOrgan.name}
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${getStatusColor(activeOrgan.status)}20`,
                    borderColor: `${getStatusColor(activeOrgan.status)}60`,
                    color: getStatusColor(activeOrgan.status) === '#3A7D5C' ? '#a7f3d0' : '#ffffff',
                  }}
                >
                  {activeOrgan.status}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
                  [CALCULATED]
                </span>
              </div>
            </div>

            <div className="mt-3 bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold font-mono text-white tracking-tight">
                  {activeOrgan.value}
                </div>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded border border-cyan-500/30 text-cyan-300 uppercase">
                  [CALC]
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {activeOrgan.subtext}
              </div>
            </div>

            {/* Pathophysiology */}
            <div className="mt-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block mb-1">
                PATHOPHYSIOLOGY &amp; CLINICAL STRAIN
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeOrgan.clinicalImpact}
              </p>
            </div>

            {/* Countermeasure */}
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                RECOMMENDED DISASTER INTERVENTION
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                ✓ {activeOrgan.countermeasure}
              </p>
            </div>
          </div>

          {/* Quick Selector Pills for all 5 systems */}
          <div className="grid grid-cols-5 gap-2">
            {organs.map((organ) => {
              const isSelected = activeOrgan.id === organ.id;
              const color = getStatusColor(organ.status);
              return (
                <button
                  key={organ.id}
                  onClick={() => setSelectedOrgan(organ)}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isSelected
                      ? 'bg-white/[0.12] border-sky-400 shadow-md scale-[1.02]'
                      : 'bg-[#0B0D0E]/50 border-white/[0.05] hover:bg-white/[0.05]'
                  }`}
                >
                  <organ.icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                  <span className="text-[10px] font-mono block text-slate-300 capitalize truncate">
                    {organ.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
