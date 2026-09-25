import React, { useState } from "react";
import { Sliders, Activity, CheckCircle2, AlertTriangle, ShieldAlert, MapPin, Clock, Info } from "lucide-react";
import { fetchWithColdStart } from "../../services/apiConfig";
import { SectionHeader } from "../ui/SectionHeader";
import { CommandIncidentMap } from '../ui/CommandIncidentMap';

interface CommandTabProps {
  activeDistrict?: {
    district?: string;
    [key: string]: any;
  };
  liveTemp?: number;
  telemetry?: any;
}

export default function CommandTab({ activeDistrict, liveTemp, telemetry }: CommandTabProps) {
  const [dispatchStatus, setDispatchStatus] = useState("");
  const [simTemp, setSimTemp] = useState(2);
  const [simRoof, setSimRoof] = useState(35);
  const [simMist, setSimMist] = useState(20);
  const [customMessage, setCustomMessage] = useState("");

  const multiHazard = telemetry?.multi_hazard || {};
  const activeHazards: any[] = [];

  Object.keys(multiHazard).forEach((key) => {
    if (['cyclone', 'heavy_rain', 'flood', 'landslide', 'rain'].includes(key)) {
      const hazardData = multiHazard[key];
      if (
        hazardData?.status === 'ACTIVE' || 
        hazardData?.status === 'WATCH' || 
        hazardData?.status === 'RAINING'
      ) {
        let typeLabel = key.replace(/_/g, ' ').toUpperCase();
        if (key === 'cyclone' && hazardData.system_type) {
          typeLabel = hazardData.system_type;
        }
        
        activeHazards.push({
          type: typeLabel,
          severity: hazardData.status === 'ACTIVE' || hazardData.status === 'RAINING' ? 'CRITICAL' : 'WARNING',
          source: hazardData.source || 'NOT AVAILABLE',
          timestamp: hazardData.observed_at || hazardData.fetched_at || null,
          status: hazardData.status,
          message: hazardData.message || 'NOT AVAILABLE',
          value_mm: hazardData.value_mm,
          lat: hazardData.latitude,
          lon: hazardData.longitude
        });
      }
    }
  });

  const [selectedHazardIdx, setSelectedHazardIdx] = useState<number>(0);
  
  const selectedHazard = activeHazards[selectedHazardIdx] || null;

  const handleDispatch = async (type: string, isDemo: boolean = false) => {
    if (isDemo) {
      setDispatchStatus(`DEMO ACTION: ${type} (UI ONLY)`);
      setTimeout(() => setDispatchStatus(""), 3000);
      return;
    }

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
    <div className="space-y-6">
      <SectionHeader
        title="Command & Control Operations"
        subtitle="Live Incident Management & Dispatch Routing"
        icon={ShieldAlert}
      />

      {/* 1. ACTIVE INCIDENTS & 2. RESPONSE STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-panel rounded-xl p-5 border border-slate-700/50">
          <h4 className="text-sm font-bold font-tech text-white flex items-center gap-1.5 uppercase mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active Incidents
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-2 font-semibold">Severity</th>
                  <th className="pb-2 font-semibold">Incident</th>
                  <th className="pb-2 font-semibold">Location</th>
                  <th className="pb-2 font-semibold">Source</th>
                  <th className="pb-2 font-semibold">Last Updated</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeHazards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500">NO ACTIVE INCIDENTS DETECTED</td>
                  </tr>
                ) : (
                  activeHazards.map((hazard: any, idx: number) => (
                    <tr 
                      key={idx} 
                      className={`border-b border-white/5 cursor-pointer transition-colors ${selectedHazardIdx === idx ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      onClick={() => setSelectedHazardIdx(idx)}
                    >
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold ${hazard.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {hazard.severity || 'WARNING'}
                        </span>
                      </td>
                      <td className="py-2 text-white font-bold">{hazard.type.replace(/_/g, ' ')}</td>
                      <td className="py-2">{activeDistrict?.district || 'Regional'}</td>
                      <td className="py-2 text-cyan-400">{hazard.source}</td>
                      <td className="py-2">{hazard.timestamp ? new Date(hazard.timestamp).toLocaleTimeString() : 'NOT AVAILABLE'}</td>
                      <td className={`py-2 font-bold ${hazard.status === 'CRITICAL' || hazard.status === 'ACTIVE' || hazard.status === 'RAINING' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {hazard.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel rounded-xl p-5 border border-slate-700/50 flex flex-col">
          <h4 className="text-sm font-bold font-tech text-white flex items-center gap-1.5 uppercase mb-4">
            <Activity className="w-4 h-4 text-cyan-400" />
            Response Status
          </h4>
          <div className="flex-1 flex flex-col justify-center items-center gap-4">
             <div className="w-full bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
               <span className="text-slate-400">Active Field Teams</span>
               <span className="text-slate-500 font-bold">NOT AVAILABLE</span>
             </div>
             <div className="w-full bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
               <span className="text-slate-400">Shelters Open</span>
               <span className="text-amber-400 font-bold bg-amber-400/10 px-1 rounded">EXPERIMENTAL</span>
             </div>
             <div className="w-full bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
               <span className="text-slate-400">Evacuation Orders</span>
               <span className="text-slate-500 font-bold">0</span>
             </div>
          </div>
        </div>
      </div>

      {/* 3. INCIDENT DETAILS & 4. INCIDENT MAP & 5. RESPONSE TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DETAILS */}
        <div className="lg:col-span-4 glass-panel rounded-xl p-5 border border-slate-700/50">
          <h4 className="text-sm font-bold font-tech text-white flex items-center gap-1.5 uppercase mb-4">
            <Info className="w-4 h-4 text-emerald-400" />
            Incident Details
          </h4>
          {selectedHazard ? (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block mb-0.5">Incident</span>
                <span className="text-white font-bold text-sm">{selectedHazard.type.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Severity</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold w-fit ${selectedHazard.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {selectedHazard.severity || 'WARNING'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Location</span>
                <span className="text-slate-300">{activeDistrict?.district || 'Regional'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Source</span>
                <span className="text-cyan-400">{selectedHazard.source}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Detected</span>
                <span className="text-slate-300">{selectedHazard.timestamp ? new Date(selectedHazard.timestamp).toLocaleString() : 'NOT AVAILABLE'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Status</span>
                <span className={`font-bold ${selectedHazard.status === 'CRITICAL' || selectedHazard.status === 'ACTIVE' || selectedHazard.status === 'RAINING' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedHazard.status}
                </span>
              </div>
              
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleDispatch("ACKNOWLEDGE", true)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition outline-none w-full"
                >
                  ACKNOWLEDGE (DEMO ACTION)
                </button>
                <button
                  type="button"
                  onClick={() => handleDispatch("ESCALATE", true)}
                  className="px-3 py-2 rounded-lg bg-rose-900/50 hover:bg-rose-800 text-rose-200 border border-rose-500/30 text-xs font-bold transition outline-none w-full"
                >
                  ESCALATE (DEMO ACTION)
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
              NO INCIDENT SELECTED
            </div>
          )}
        </div>

        {/* MAP */}
        <div className="lg:col-span-5 glass-panel rounded-xl border border-slate-700/50 flex flex-col overflow-hidden min-h-[400px] relative bg-slate-900/80">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 pointer-events-none">
            <MapPin className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm font-bold font-tech text-white uppercase drop-shadow-md">
              Incident Map
            </h4>
          </div>
          <div className="flex-1 relative z-0">
             <CommandIncidentMap activeHazards={activeHazards} selectedHazard={selectedHazard} />
          </div>
        </div>

        {/* TIMELINE */}
        <div className="lg:col-span-3 glass-panel rounded-xl p-5 border border-slate-700/50 flex flex-col">
          <h4 className="text-sm font-bold font-tech text-white flex items-center gap-1.5 uppercase mb-4">
            <Clock className="w-4 h-4 text-cyan-400" />
            Response Timeline
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs font-mono text-slate-500 text-center px-4">
              NO RESPONSE EVENT DATA AVAILABLE
            </span>
          </div>
        </div>
      </div>

      {/* 6. POLICY SIMULATOR & 7. EMERGENCY FACILITY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulator */}
        <div className="glass-panel rounded-xl p-5 border border-cyan-500/20 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold font-tech text-white flex items-center gap-1.5 uppercase">
              <Sliders className="w-4 h-4 text-cyan-400" />
              What-If Policy Simulator
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 uppercase tracking-widest font-semibold">
                [MODELLED]
              </span>
            </div>
          </div>
          
          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300">Ambient Temperature Shift</span>
                <span className="text-amber-400 font-bold">+2.0°C</span>
              </div>
              <input
                type="range" min="-5" max="5" value={simTemp}
                onChange={(e) => setSimTemp(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300">Cool Roof Deployment</span>
                <span className="text-cyan-400 font-bold">+{simRoof}% Coverage</span>
              </div>
              <input
                type="range" min="0" max="100" value={simRoof}
                onChange={(e) => setSimRoof(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300">Urban Misting Dampening</span>
                <span className="text-emerald-400 font-bold">+{simMist}% Hum.</span>
              </div>
              <input
                type="range" min="0" max="100" value={simMist}
                onChange={(e) => setSimMist(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between text-sm mt-4">
              <span className="text-slate-300">Projected Risk Index:</span>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-rose-400 line-through">87</span>
                <span className="text-slate-400">➔</span>
                <span className="text-emerald-400">{newRisk}</span>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded border border-purple-500/30 text-purple-300 uppercase">
                  [MOD]
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDispatch("SIMULATE DISPATCH", true)}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition outline-none mt-2"
            >
              SIMULATE DISPATCH (DEMO ACTION)
            </button>
          </div>
        </div>

        {/* Emergency Facility Panel */}
        <div className="glass-panel rounded-xl p-5 border border-rose-500/20 opacity-80 hover:opacity-100 transition-opacity flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold font-tech text-white flex items-center gap-1.5 uppercase">
                <Activity className="w-4 h-4 text-rose-400" />
                Emergency Facility Panel
              </h4>
              <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                EXPERIMENTAL
              </span>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 text-xs font-mono mb-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Nearest Trauma Center</span>
                <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">NOT AVAILABLE</span>
              </div>
              <div className="flex justify-between text-slate-400 mt-2">
                <span>ICU Beds Status:</span>
                <span className="text-slate-500 font-bold">NOT AVAILABLE</span>
              </div>
              <div className="flex justify-between text-slate-400 mt-1">
                <span>Resource Adequacy:</span>
                <span className="text-amber-400 font-bold">EXPERIMENTAL</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 font-tech relative">
            {dispatchStatus && !dispatchStatus.includes("DEMO") && (
              <div className="p-2 bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-center text-[10px] font-bold rounded flex items-center justify-center gap-2">
                {dispatchStatus.includes("SUCCESS") ? <CheckCircle2 className="w-3 h-3" /> : null}
                {dispatchStatus}
              </div>
            )}
            {dispatchStatus && dispatchStatus.includes("DEMO") && (
              <div className="p-2 bg-slate-800 border border-slate-600 text-slate-300 text-center text-[10px] font-bold rounded flex items-center justify-center gap-2">
                {dispatchStatus}
              </div>
            )}
            
            <div>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Broadcast Message (e.g. Odisha Heatwave Alert)..." 
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDispatch("Mass SMS", false)}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center transition outline-none shadow shadow-rose-900"
              >
                BROADCAST ALERT
              </button>
              <button
                type="button"
                onClick={() => handleDispatch("Trauma Routing", true)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition outline-none"
              >
                ROUTE (DEMO)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
