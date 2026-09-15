import React from "react";

/**
 * WeatherCard - SentinelX Command Center Edition
 * Clean dark glassmorphic environmental telemetry card.
 */
function WeatherCard({ icon = "🌡️", title, value, unit, description, trend, statusColor = "#38bdf8" }) {
  return (
    <div className="bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-white/[0.08] p-4 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-white/[0.15] transition-all">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            {title}
          </span>
          <span className="text-xl p-1 rounded-lg bg-white/[0.04] border border-white/[0.05]">
            {icon}
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-mono font-bold text-white tracking-tight">
            {value !== undefined && value !== null ? value : "--"}
          </span>
          {unit && (
            <span className="text-sm font-mono text-slate-400">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-sans truncate">
          {description}
        </span>
        {trend && (
          <span className="font-mono font-semibold text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-300">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export default WeatherCard;