import React from "react";
import { Brain, HeartPulse } from "lucide-react";

/**
 * StressIndexCard - SentinelX Command Center Edition
 * Neuro-cardiovascular stress index with exertion breakdown.
 */
function StressIndexCard({ score = 74 }) {
  const stressIndex = (score / 10).toFixed(1);

  const getTier = (s) => {
    const num = Number(s);
    if (num >= 8.5) return { label: "CRITICAL", color: "#C0392B" };
    if (num >= 6.5) return { label: "ELEVATED", color: "#D9772E" };
    if (num >= 4.0) return { label: "MODERATE", color: "#C9A227" };
    return { label: "NORMAL", color: "#3A7D5C" };
  };

  const { label, color } = getTier(stressIndex);

  return (
    <div className="relative bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-white/[0.08] p-5 shadow-xl overflow-hidden flex flex-col justify-between">
      {/* Glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 w-28 h-28 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: color }}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-purple-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                PHYSIOLOGICAL STRAIN
              </p>
              <h3 className="text-base font-bold text-white font-display">
                Neuro-Cardio Strain
              </h3>
            </div>
          </div>

          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border"
            style={{
              backgroundColor: `${color}20`,
              borderColor: `${color}50`,
              color: color === "#3A7D5C" ? "#a7f3d0" : "#ffffff",
            }}
          >
            {label}
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-4xl font-mono font-black text-white tracking-tight">
            {stressIndex}
          </span>
          <span className="text-base font-mono text-slate-400">/ 10</span>
        </div>

        <p className="text-[11px] text-slate-400 mt-1">
          Cardiovascular strain index under continuous heat exposure.
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-3 gap-1.5 text-[10px] font-mono text-center">
        <div className="bg-[#0B0D0E]/60 p-1.5 rounded-lg border border-white/[0.05]">
          <span className="text-slate-500 block text-[9px]">Resting</span>
          <span className="text-emerald-400 font-bold">{(score * 0.45 / 10).toFixed(1)}/10</span>
        </div>
        <div className="bg-[#0B0D0E]/60 p-1.5 rounded-lg border border-white/[0.05]">
          <span className="text-slate-500 block text-[9px]">Moderate</span>
          <span className="text-amber-400 font-bold">{stressIndex}/10</span>
        </div>
        <div className="bg-[#0B0D0E]/60 p-1.5 rounded-lg border border-white/[0.05]">
          <span className="text-slate-500 block text-[9px]">Heavy Work</span>
          <span className="text-rose-400 font-bold">{Math.min(10, (score * 1.35 / 10)).toFixed(1)}/10</span>
        </div>
      </div>
    </div>
  );
}

export default StressIndexCard;