import React from "react";
import {
  AlertTriangle,
  Thermometer,
  Activity,
  Clock,
  Send,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";

/**
 * EarlyWarning - SentinelX Command Center Edition
 * Real-time Early Heatwave Warning & Disaster Response Directives.
 */
function EarlyWarning({
  locationName = "Khordha (Bhubaneswar)",
  severity = "EXTREME",
  temperature = 40.5,
  heatIndex = 47.8,
  stressIndex = 8.8,
  peakHours = "11:30 AM – 4:00 PM",
  onDispatch,
}) {
  const isExtreme = severity === "EXTREME" || severity === "Red";
  const tierColor = isExtreme ? "#C0392B" : "#D9772E";

  const directives = [
    "Halt all outdoor construction and manual labor between peak hours.",
    "Activate municipal cooling centers (Jal Chhatras) and emergency hydration kiosks.",
    "Ensure 24/7 dedicated cooling beds and IV fluid supplies at CHCs and district hospitals.",
    "Issue automated SMS & voice IVRS advisory in Odia, Hindi, and English.",
  ];

  return (
    <div className="relative bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-rose-500/30 p-5 shadow-2xl overflow-hidden">
      {/* Glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 w-44 h-44 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: tierColor }}
      />

      {/* Alert Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-display">
                Disaster Management Heatwave Directive
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                NDMA LEVEL 3
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated early warning protocol for {locationName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className="px-3 py-1 rounded-full text-xs font-mono font-bold border"
            style={{
              backgroundColor: `${tierColor}25`,
              borderColor: `${tierColor}60`,
              color: "#ffffff",
            }}
          >
            {severity} ALERT
          </span>

          {onDispatch && (
            <button
              onClick={onDispatch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-rose-950/50 transition active:scale-95 font-mono"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Alert</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning Message Box */}
      <div className="mt-4 bg-rose-950/30 border-l-4 border-rose-500 rounded-xl p-3.5 text-xs text-rose-200">
        <strong className="text-white block mb-0.5 font-sans">
          Critical Thermal Hazard Advisory:
        </strong>
        Extreme bioclimatic stress conditions detected. Immediate administrative action mandated to avoid heat stroke morbidity and excess cardiovascular hospital surge.
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="bg-[#0B0D0E]/60 rounded-xl p-3 border border-white/[0.05]">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <Thermometer className="w-4 h-4 text-amber-400" />
            Dry-Bulb Temperature
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {temperature}°C
          </p>
        </div>

        <div className="bg-[#0B0D0E]/60 rounded-xl p-3 border border-white/[0.05]">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <Thermometer className="w-4 h-4 text-rose-400" />
            Heat Index (Apparent)
          </div>
          <p className="text-2xl font-bold font-mono text-rose-300 mt-1">
            {heatIndex}°C
          </p>
        </div>

        <div className="bg-[#0B0D0E]/60 rounded-xl p-3 border border-white/[0.05]">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <Activity className="w-4 h-4 text-purple-400" />
            Thermal Stress Index
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {stressIndex} / 10
          </p>
        </div>
      </div>

      {/* Peak Window & Directives */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>
            Peak Vulnerability Window: <strong className="text-amber-300">{peakHours}</strong>
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Source: State Disaster Management Authority (OSDMA / NDMA)
        </div>
      </div>

      {/* Action Directives List */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {directives.map((dir, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 bg-[#0B0D0E]/50 p-2.5 rounded-xl border border-white/[0.04] text-slate-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{dir}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EarlyWarning;