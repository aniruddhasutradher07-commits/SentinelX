import React, { useState } from "react";
import { Sliders, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { fetchWithColdStart } from "../../services/apiConfig";
import { SectionHeader } from "../ui/SectionHeader";

interface CommandTabProps {
  activeDistrict?: {
    district?: string;
    [key: string]: any;
  };
  liveTemp?: number;
}

export default function CommandTab({ activeDistrict, liveTemp }: CommandTabProps) {
  const [dispatchStatus, setDispatchStatus] = useState("");
  const [simTemp, setSimTemp] = useState(2);
  const [simRoof, setSimRoof] = useState(35);
  const [simMist, setSimMist] = useState(20);
  const [customMessage, setCustomMessage] = useState("");

  const handleDispatch = async (type: string) => {
    setDispatchStatus(`Dispatching ${type}...`);
    const payloadText = customMessage.trim() ? customMessage : `Emergency: ${type} initiated for ${activeDistrict?.district || 'Region'}`;
    try {
      await fetchWithColdStart("/api/v1/alerts/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ward_no: "ALL",
          advisory_text: payloadText
        })
      });
      setTimeout(() => setDispatchStatus(`${type} SUCCESS`), 800);
      setTimeout(() => setDispatchStatus(""), 4000);
    } catch {
      setDispatchStatus("FAILED");
      setTimeout(() => setDispatchStatus(""), 3000);
    }
  };

  // Basic linear physics model for simulator
  const baseRisk = 87;
  const newRisk = Math.max(10, Math.round(baseRisk + (simTemp * 2) - (simRoof * 0.15) - (simMist * 0.2)));

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Command & Intervention Dispatch"
        subtitle="Policy simulation and real-time emergency dispatch routing"
        icon={Sliders}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Simulator */}
        <div className="glass-panel rounded-xl p-5 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold font-tech text-white flex items-center gap-1.5 uppercase">
              <Sliders className="w-5 h-5 text-cyan-400" />
              What-If Policy Simulator
            </h4>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
              AI Physics
            </span>
          </div>
          
          <p className="text-xs text-slate-400 font-mono mb-6">Simulate urban canopy shading, cool-roofs & misting effects</p>
          
          <div className="space-y-5 font-mono text-xs">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300">Ambient Temperature Shift</span>
                <span className="text-amber-400 font-bold">+2.0°C</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                value={simTemp}
                onChange={(e) => setSimTemp(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                aria-label="Ambient Temperature Shift"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300">Cool Roof Deployment</span>
                <span className="text-cyan-400 font-bold">+{simRoof}% Coverage</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simRoof}
                onChange={(e) => setSimRoof(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                aria-label="Cool Roof Deployment"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300">Urban Misting Dampening</span>
                <span className="text-emerald-400 font-bold">+{simMist}% Hum.</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simMist}
                onChange={(e) => setSimMist(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                aria-label="Urban Misting Dampening"
              />
            </div>

            <div className="p-3 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between text-sm mt-6">
              <span className="text-slate-300">Projected Risk Index:</span>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-rose-400 line-through">87</span>
                <span className="text-slate-400">➔</span>
                <span className="text-emerald-400">{newRisk} ({newRisk - baseRisk > 0 ? '+' : ''}{newRisk - baseRisk} pts)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Dispatch */}
        <div className="glass-panel rounded-xl p-5 border border-rose-500/25 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold font-tech text-white flex items-center gap-1.5 uppercase">
                <Activity className="w-5 h-5 text-rose-400" />
                Nearest Emergency Surge
              </h4>
              <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                Tier-1 Trauma
              </span>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 text-sm font-mono mb-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Capital Hospital, BBSR</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">3.2 km | 8 mins</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>Heat Stroke ICU Beds:</span>
                <span className="text-amber-400 font-bold">14 / 20 Available</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>IV Fluid Reserves:</span>
                <span className="text-emerald-400 font-bold">98% Adequacy</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 font-tech relative">
            {dispatchStatus && (
              <div className="p-2 bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-center text-xs font-bold rounded flex items-center justify-center gap-2">
                {dispatchStatus.includes("SUCCESS") ? <CheckCircle2 className="w-4 h-4" /> : null}
                {dispatchStatus}
              </div>
            )}
            
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block" htmlFor="custom-advisory-msg">
                Custom Regional Advisory (Optional)
              </label>
              <textarea
                id="custom-advisory-msg"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g. ओडिशा में हीटवेव अलर्ट..." 
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDispatch("108 Ambulance")}
                className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-sm font-bold flex items-center justify-center gap-2 transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                🚑 Dispatch 108
              </button>
              <button
                type="button"
                onClick={() => handleDispatch("Trauma Routing")}
                className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-sm font-bold flex items-center justify-center gap-2 transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                🏥 Route to Trauma
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleDispatch("Mass SMS")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-amber-500 hover:brightness-110 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-rose-900/30 transition flex items-center justify-center gap-2 mt-2 outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              BROADCAST MASS SMS TO WARDS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
