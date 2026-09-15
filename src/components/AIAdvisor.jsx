import React from "react";
import { Sparkles, Brain, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

/**
 * AIAdvisor - SentinelX Command Center Edition
 * Top 3 Explainable AI Risk Drivers & Public Health Clinical Advisories.
 */
function AIAdvisor({
  topDrivers = [],
  recommendations = [],
  dominantFactor = "Outdoor Labor Density"
}) {
  const defaultDrivers = [
    {
      title: "Outdoor Labor Density (31.5%)",
      detail: "High concentration of construction and informal outdoor workers under peak solar load.",
      severity: "High",
    },
    {
      title: "Tree Canopy Deficit (16.2%)",
      detail: "Severe lack of urban shade structures causing radiative ground surface heat accumulation.",
      severity: "High",
    },
    {
      title: "Tin / Asbestos Roofs (34.0%)",
      detail: "High-heat building envelope materials amplifying indoor thermal retention overnight.",
      severity: "Moderate",
    },
  ];

  const defaultRecommendations = [
    "Mandate strict work halts between 11:30 AM and 3:30 PM for informal outdoor workers.",
    "Target rapid deployment of Jal Chhatras (hydration stations) within 300m of high-density wards.",
    "Issue targeted advisories to elderly individuals and patients on beta-blockers/antihypertensives.",
    "Activate misting systems at major transit hubs and vegetable markets.",
  ];

  const driversList = topDrivers && topDrivers.length > 0 ? topDrivers : defaultDrivers;
  const recsList = recommendations && recommendations.length > 0 ? recommendations : defaultRecommendations;

  return (
    <div className="bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-white/[0.08] p-5 shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              AI Risk Explainability &amp; Public Health Advisor
            </h3>
            <p className="text-xs text-slate-400">
              Machine learning driver attribution &amp; clinical intervention directices
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
          SHAP / DLNM Explainability
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Top 3 Risk Drivers */}
        <div>
          <div className="flex items-center gap-1.5 mb-3 text-xs font-mono text-amber-400 font-semibold uppercase">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top 3 Compound Risk Drivers</span>
          </div>

          <div className="space-y-2.5">
            {driversList.slice(0, 3).map((driver, index) => {
              const title = typeof driver === "string" ? driver : driver.title || driver.name || "Risk Driver";
              const detail = typeof driver === "object" ? driver.detail || driver.description : "";
              return (
                <div
                  key={index}
                  className="bg-[#0B0D0E]/60 border border-white/[0.05] rounded-xl p-3 flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white font-sans">
                      {title}
                    </p>
                    {detail && (
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Clinical & Public Health Advisories */}
        <div>
          <div className="flex items-center gap-1.5 mb-3 text-xs font-mono text-sky-400 font-semibold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Public Health Intervention Directives</span>
          </div>

          <div className="space-y-2.5">
            {recsList.slice(0, 4).map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5 bg-[#0B0D0E]/60 border border-white/[0.05] rounded-xl p-3 text-xs text-slate-300"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAdvisor;