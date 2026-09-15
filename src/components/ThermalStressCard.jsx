import React from "react";
import { User, Activity, AlertCircle, ShieldCheck } from "lucide-react";

/**
 * ThermalStressCard - SentinelX Command Center Edition
 * Displays real Human Thermal Stress (WBGT + H-THERM physiological index),
 * sweat evaporation efficiency deficit, and operational severity tier.
 */
function ThermalStressCard({ score = 74, level = "High", wbgt = 31.8, sweatEfficiency = 42 }) {
  // PRD Risk Palette
  const getTierColor = (lvl) => {
    const l = String(lvl || "").toLowerCase();
    if (l.includes("extreme") || l.includes("red") || l.includes("severe")) return "#C0392B";
    if (l.includes("high") || l.includes("orange")) return "#D9772E";
    if (l.includes("moderate") || l.includes("yellow")) return "#C9A227";
    return "#3A7D5C";
  };

  const tierColor = getTierColor(level);

  return (
    <div className="relative bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-white/[0.08] p-5 shadow-xl overflow-hidden flex flex-col justify-between">
      {/* Ambient backlight glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: tierColor }}
      />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                BIOTECH PHYSIOLOGY
              </p>
              <h3 className="text-base font-bold text-white font-display">
                Human Thermal Stress
              </h3>
            </div>
          </div>

          <div
            className="px-2.5 py-1 rounded-full text-xs font-mono font-bold border"
            style={{
              backgroundColor: `${tierColor}20`,
              borderColor: `${tierColor}60`,
              color: tierColor === "#3A7D5C" ? "#a7f3d0" : "#ffffff",
            }}
          >
            {level.toUpperCase()}
          </div>
        </div>

        {/* Hero Score & Gauge */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-mono font-black text-white tracking-tight">
                {Math.round(score)}
              </span>
              <span className="text-sm font-mono text-slate-400">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              H-THERM Composite Exertion Strain
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-mono font-bold text-amber-300">
              {wbgt}°C
            </span>
            <span className="block text-[10px] font-mono text-slate-400">
              ISO 7243 WBGT
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full bg-[#0B0D0E] rounded-full overflow-hidden border border-white/[0.05]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(5, score))}%`,
                backgroundColor: tierColor,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>0 Low</span>
            <span>40 Mod</span>
            <span>65 High</span>
            <span>85+ Extreme</span>
          </div>
        </div>
      </div>

      {/* Physiological Indicators Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
          <span className="text-[10px] text-slate-400 block">Sweat Evap Deficit</span>
          <span className="text-sky-300 font-bold">{sweatEfficiency}% capacity</span>
        </div>
        <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
          <span className="text-[10px] text-slate-400 block">Work/Rest Cycle</span>
          <span className="text-amber-300 font-bold">
            {score >= 80 ? "15m Work / 45m Rest" : score >= 60 ? "30m Work / 30m Rest" : "45m Work / 15m Rest"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ThermalStressCard;