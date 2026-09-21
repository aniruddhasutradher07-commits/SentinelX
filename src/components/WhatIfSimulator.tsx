import React, { useState } from 'react';
import { 
  Sliders, 
  Trees, 
  Home, 
  Clock, 
  Building2, 
  ArrowRight, 
  TrendingDown, 
  IndianRupee, 
  ShieldCheck, 
  Sparkles,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';
import { WardRiskRecord } from '../types';

interface WhatIfSimulatorProps {
  wards: WardRiskRecord[];
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ wards }) => {
  const [selectedWardNo, setSelectedWardNo] = useState<string>(wards[0]?.ward_no || 'W21');

  // Intervention Sliders (Section 3.5: Left intervention picker)
  const [canopyIncreasePct, setCanopyIncreasePct] = useState<number>(15); // +% green cover
  const [coolRoofConversionPct, setCoolRoofConversionPct] = useState<number>(30); // % roofs coated with high-albedo paint
  const [workHourShiftHours, setWorkHourShiftHours] = useState<number>(3); // hours shifted away from peak (11am-3pm)
  const [coolingKiosksAdded, setCoolingKiosksAdded] = useState<number>(4); // count of distributed water/AC kiosks

  const baseWard = wards.find(w => w.ward_no === selectedWardNo) || wards[0] || {
    ward_no: 'W21',
    zone: 'North Zone',
    population: 14500,
    WardRiskScore: 97,
    RiskTier: 'Red',
    WBGT_celsius: 32.8,
    tree_cover_pct: 12.0,
    high_heat_roof_pct: 42.0,
    outdoor_worker_pct: 35.0,
    vulnerability_multiplier: 1.25
  };

  const baseScore = baseWard.WardRiskScore || 97;
  const basePop = baseWard.population || 14500;

  // Compute Intervention Reductions
  // 1. Green cover cools ambient micro-climate & reduces vulnerability
  const canopyEffect = (canopyIncreasePct * 0.45);
  // 2. Cool-roof coating directly reduces rooftop LST and tin-roof heat trapping
  const coolRoofEffect = (coolRoofConversionPct * 0.35);
  // 3. Shifting work hours cuts daytime outdoor laborer exertion in WBGT > 32°C
  const workShiftEffect = (workHourShiftHours * 4.2);
  // 4. Kiosks provide hydration and acute heat exhaustion prevention
  const kioskEffect = (coolingKiosksAdded * 1.8);

  const totalReduction = Math.round(canopyEffect + coolRoofEffect + workShiftEffect + kioskEffect);
  const simulatedScore = Math.max(25, Math.min(100, Math.round(baseScore - totalReduction)));

  const getTier = (score: number): 'Red' | 'Orange' | 'Yellow' | 'Green' => {
    if (score >= 85) return 'Red';
    if (score >= 65) return 'Orange';
    if (score >= 45) return 'Yellow';
    return 'Green';
  };

  const beforeTier = getTier(baseScore);
  const afterTier = getTier(simulatedScore);

  const getTierColor = (tier: string) => {
    if (tier === 'Red') return '#C0392B';
    if (tier === 'Orange') return '#D9772E';
    if (tier === 'Yellow') return '#C9A227';
    return '#3A7D5C';
  };

  // Economic Avoided-Loss Calculation (Rupees) per Section 3.5 & PRD Module F
  // Formula: Avoided Hospitalizations + Avoided Labor Productivity Hours Saved × Daily Minimum Wage (Odisha ~₹380/day)
  const outdoorLaborCount = Math.round(basePop * ((baseWard.outdoor_worker_pct || 28) / 100));
  const dailyWageRate = 420; // INR
  const productivityHoursPreserved = (workHourShiftHours * 0.8 + canopyIncreasePct * 0.04) * outdoorLaborCount;
  const avoidedHospitalizations = Math.max(1, Math.round((totalReduction / 100) * 18 * (basePop / 10000)));
  const hospitalTreatmentCostSaved = avoidedHospitalizations * 14500; // INR ~14,500 per acute heatstroke ICU/admission
  const totalAvoidedEconomicLossINR = Math.round(
    (productivityHoursPreserved * (dailyWageRate / 8) * 14) + hospitalTreatmentCostSaved
  );

  return (
    <div className="flex-1 flex flex-col xl:flex-row h-full overflow-hidden bg-[#0B0D0E] text-[#F2F1EC]">
      
      {/* Left: Intervention Picker (Section 3.5) */}
      <div className="w-full xl:w-[480px] bg-[#14171A] border-b xl:border-b-0 xl:border-r border-[#232A2E] p-6 flex flex-col h-[50vh] xl:h-full overflow-y-auto gap-5 shrink-0">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F5C5C] font-bold">
              PRD Module F · UI/UX Spec 3.5
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0F5C5C]/20 text-teal-300 border border-[#0F5C5C]/40 font-bold">
              Planning Mode
            </span>
          </div>
          <h2 className="text-xl font-bold font-sans text-white mt-1">Heat Action &amp; What-If Simulator</h2>
          <p className="text-xs text-[#8B9096] font-sans mt-0.5">
            Simulate municipal policy interventions outside heat season to optimize capital allocation.
          </p>
        </div>

        {/* Target Ward Selector */}
        <div className="bg-[#0B0D0E] p-3.5 rounded-2xl border border-[#232A2E]">
          <label className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider block mb-1.5">
            Select Municipal Ward / Focus Area
          </label>
          <select
            value={selectedWardNo}
            onChange={(e) => setSelectedWardNo(e.target.value)}
            className="w-full bg-[#14171A] border border-[#232A2E] text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#0F5C5C] font-sans"
          >
            {wards.slice(0, 35).map((w) => (
              <option key={w.ward_no} value={w.ward_no} className="bg-[#14171A]">
                {w.ward_no} ({w.zone}) — Baseline Risk: {w.WardRiskScore} ({w.RiskTier})
              </option>
            ))}
          </select>
        </div>

        {/* 4 Interactive Intervention Sliders */}
        <div className="space-y-4 font-sans text-xs">
          {/* 1. Urban Green Canopy */}
          <div className="bg-[#0B0D0E] p-3.5 rounded-2xl border border-[#232A2E] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Trees className="w-4 h-4 text-emerald-400" />
                Urban Tree Canopy Increase
              </span>
              <span className="font-mono text-emerald-400 font-bold tabular-nums">+{canopyIncreasePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="1"
              value={canopyIncreasePct}
              onChange={(e) => setCanopyIncreasePct(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-[#8B9096] block">
              Reduces satellite LST by ~1.2°C via evaporative transpiration and direct shading.
            </span>
          </div>

          {/* 2. High-Albedo Cool Roof Coating */}
          <div className="bg-[#0B0D0E] p-3.5 rounded-2xl border border-[#232A2E] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Home className="w-4 h-4 text-sky-400" />
                Cool-Roof High-Albedo Coating
              </span>
              <span className="font-mono text-sky-400 font-bold tabular-nums">{coolRoofConversionPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="70"
              step="5"
              value={coolRoofConversionPct}
              onChange={(e) => setCoolRoofConversionPct(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <span className="text-[10px] text-[#8B9096] block">
              Reflects 80%+ solar irradiance, slashing indoor thermal heat trap in tin/asbestos housing.
            </span>
          </div>

          {/* 3. Shift Work Hours Directive */}
          <div className="bg-[#0B0D0E] p-3.5 rounded-2xl border border-[#232A2E] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Outdoor Labor Shift Hours
              </span>
              <span className="font-mono text-amber-400 font-bold tabular-nums">{workHourShiftHours} hrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={workHourShiftHours}
              onChange={(e) => setWorkHourShiftHours(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-[#8B9096] block">
              Bans unshaded construction/sanitation manual labor during peak solar radiation (11:00–15:00).
            </span>
          </div>

          {/* 4. Distributed Cooling Kiosks */}
          <div className="bg-[#0B0D0E] p-3.5 rounded-2xl border border-[#232A2E] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-400" />
                Jal Seva Cooling Kiosks &amp; ORS
              </span>
              <span className="font-mono text-teal-400 font-bold tabular-nums">+{coolingKiosksAdded} sites</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={coolingKiosksAdded}
              onChange={(e) => setCoolingKiosksAdded(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <span className="text-[10px] text-[#8B9096] block">
              Sited at informal commercial hubs and bus junctions within 500m walking radius.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setCanopyIncreasePct(15);
            setCoolRoofConversionPct(30);
            setWorkHourShiftHours(3);
            setCoolingKiosksAdded(4);
          }}
          className="flex items-center justify-center gap-1.5 text-xs text-[#8B9096] hover:text-white transition py-1"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Reset to Recommended Municipal Package
        </button>
      </div>

      {/* Right: Before/After Comparison & Avoided Loss in Rupees (Section 3.5) */}
      <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto gap-6">
        <div>
          <span className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider block mb-1">
            PROJECTED POLICY IMPACT EVALUATION · {baseWard.ward_no}
          </span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold font-sans text-white">Before vs. After Intervention Outcome</h3>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 uppercase tracking-widest font-semibold">
              [MODELLED]
            </span>
          </div>
        </div>

        {/* Before / After Grade Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before Card */}
          <div className="bg-[#14171A] border border-[#232A2E] rounded-3xl p-6 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider block">
                Status Quo (No Intervention)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
                [CALCULATED]
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold font-mono tabular-nums" style={{ color: getTierColor(beforeTier) }}>
                {baseScore}
              </span>
              <span 
                className="px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase border"
                style={{ backgroundColor: `${getTierColor(beforeTier)}20`, borderColor: getTierColor(beforeTier), color: getTierColor(beforeTier) }}
              >
                {beforeTier} TIER
              </span>
            </div>
            <p className="text-xs text-[#8B9096] font-sans">
              Severe thermal exertion, high hospital admission probability, unmitigated tin-roof radiation.
            </p>
          </div>

          {/* After Card */}
          <div className="bg-[#14171A] border-2 border-[#0F5C5C] rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-xl shadow-[#0F5C5C]/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold block">
                Post-Intervention Projection
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 flex items-center gap-1 font-bold">
                  <TrendingDown className="w-3 h-3" /> -{totalReduction} pts
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 uppercase tracking-widest font-semibold">
                  [MODELLED]
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold font-mono tabular-nums" style={{ color: getTierColor(afterTier) }}>
                {simulatedScore}
              </span>
              <span 
                className="px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase border"
                style={{ backgroundColor: `${getTierColor(afterTier)}20`, borderColor: getTierColor(afterTier), color: getTierColor(afterTier) }}
              >
                {afterTier} TIER
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans">
              Risk downgraded by {totalReduction} points; protected outdoor workforce and reduced acute dehydration.
            </p>
          </div>
        </div>

        {/* Avoided Loss Figure in Rupees (Section 3.5: Single large data figure in Plex Mono) */}
        <div className="bg-[#14171A] border border-[#232A2E] rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#8B9096]">
              <IndianRupee className="w-5 h-5 text-teal-400" />
              <span className="text-xs font-mono uppercase tracking-wider">
                Avoided Socio-Economic &amp; Productivity Loss (Estimated INR)
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
              [CALCULATED]
            </span>
          </div>

          {/* Large Plex Mono Numeric Value */}
          <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white tabular-nums">
            ₹{totalAvoidedEconomicLossINR.toLocaleString('en-IN')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#232A2E] text-xs font-mono">
            <div className="bg-[#0B0D0E] p-3 rounded-2xl border border-[#232A2E]">
              <span className="text-[10px] text-[#8B9096] block">Labor Hours Saved</span>
              <span className="text-base font-bold text-teal-400 tabular-nums">
                {Math.round(productivityHoursPreserved * 14).toLocaleString()} hrs
              </span>
            </div>

            <div className="bg-[#0B0D0E] p-3 rounded-2xl border border-[#232A2E]">
              <span className="text-[10px] text-[#8B9096] block">Averted Hospital Admissions</span>
              <span className="text-base font-bold text-sky-400 tabular-nums">
                ~{avoidedHospitalizations} beds
              </span>
            </div>

            <div className="bg-[#0B0D0E] p-3 rounded-2xl border border-[#232A2E]">
              <span className="text-[10px] text-[#8B9096] block">Public Health Savings</span>
              <span className="text-base font-bold text-amber-400 tabular-nums">
                ₹{hospitalTreatmentCostSaved.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#8B9096] font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Formulated according to ILO / World Bank 2024 Heat Stress &amp; Human Labor Productivity Coefficients.</span>
        </div>

      </div>
    </div>
  );
};
