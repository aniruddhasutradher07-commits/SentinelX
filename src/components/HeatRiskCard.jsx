import React from "react";
import { AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";

/**
 * HeatRiskCard - SentinelX Command Center Edition
 * Heatwave Severity & Exposure Index with NDMA alert tiers.
 */
function HeatRiskCard({ riskLevel = "HIGH", probability = 78, riskScore = 72, multiplier = 1.15 }) {
  const getTierColor = (lvl) => {
    const l = String(lvl || "").toLowerCase();
    if (l.includes("extreme") || l.includes("red") || l.includes("severe")) return "#C0392B";
    if (l.includes("high") || l.includes("orange")) return "#D9772E";
    if (l.includes("moderate") || l.includes("yellow")) return "#C9A227";
    return "#3A7D5C";
  };

  const tierColor = getTierColor(riskLevel);

  return (
    <div className="relative bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-white/[0.08] p-5 shadow-xl overflow-hidden flex flex-col justify-between">
      {/* Ambient backlight glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: tierColor }}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                OPERATIONAL SEVERITY
              </p>
              <h3 className="text-base font-bold text-white font-display">
                Heatwave Risk Index
              </h3>
            </div>
          </div>

          <span
            className="px-2.5 py-1 rounded-full text-xs font-mono font-bold border"
            style={{
              backgroundColor: `${tierColor}20`,
              borderColor: `${tierColor}60`,
              color: tierColor === "#3A7D5C" ? "#a7f3d0" : "#ffffff",
            }}
          >
            {riskLevel.toUpperCase()} ALERT
          </span>
        </div>

        {/* Hero Probability & Score */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-mono font-black text-white tracking-tight">
                {probability}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Heatwave Exceedance Probability
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-mono font-bold text-sky-300">
              {riskScore}
            </span>
            <span className="block text-[10px] font-mono text-slate-400">
              Compound Index (0-100)
            </span>
          </div>
        </div>

        {/* Probability Bar */}
        <div className="mt-4">
          <div className="h-2 w-full bg-[#0B0D0E] rounded-full overflow-hidden border border-white/[0.05]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(5, probability))}%`,
                backgroundColor: tierColor,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>Low (&lt;40%)</span>
            <span>Moderate (40-60%)</span>
            <span>Severe (&gt;75%)</span>
          </div>
        </div>
      </div>

      {/* Multiplier & Factor Info */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-400">
          Vulnerability Multiplier (M_v):
        </span>
        <span className="text-purple-300 font-bold">
          ×{Number(multiplier || 1.0).toFixed(2)} Compound
        </span>
      </div>
    </div>
  );
}

export default HeatRiskCard;