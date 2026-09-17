import React, { useState } from "react";
import OtherHazardsCard from "../OtherHazardsCard";
import { fetchWithColdStart } from "../../services/apiConfig";

export default function OverviewTab({ telemetry, activeDistrict, weather }) {
  const [dispatchStatus, setDispatchStatus] = useState("");

  const handleSiren = async () => {
    setDispatchStatus("Broadcasting...");
    try {
      await fetchWithColdStart("/api/v1/alerts/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ward_no: "ALL",
          advisory_text: `Civic Siren Initiated for ${activeDistrict?.district}`
        })
      });
      setTimeout(() => setDispatchStatus("SIREN BROADCAST SUCCESS"), 800);
      setTimeout(() => setDispatchStatus(""), 4000);
    } catch (err) {
      setDispatchStatus("FAILED");
      setTimeout(() => setDispatchStatus(""), 3000);
    }
  };
  const liveTemp = weather?.current?.temperature_2m ?? activeDistrict.temperature_c ?? 39.5;
  const liveHumidity = weather?.current?.relative_humidity_2m ?? activeDistrict.relative_humidity_pct ?? 68;
  const liveWind = weather?.current?.wind_speed_10m ?? 2.8;
  const liveSolar = Math.round(820 + (Math.sin(new Date().getHours() / 24 * Math.PI) * 180));
  const liveApparent = weather?.current?.apparent_temperature ?? Math.round(Number(liveTemp) + 5.2);

  return (
    <div className="space-y-5">
      {/* Top Telemetry Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3.5">
        <div className="glass-panel rounded-xl p-3.5 flex flex-col justify-between border-l-4 border-l-brand-orange">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>DRY-BULB TEMP</span>
            <span className="text-brand-orange">🌡️ Live</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-tech font-bold text-white tracking-tight">{liveTemp}</span>
              <span className="text-sm font-mono text-slate-400">°C</span>
            </div>
            <p className="text-[11px] text-brand-orange/90 font-mono mt-0.5">+1.2°C vs 24h baseline</p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">10m Ambient Station Net</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 flex flex-col justify-between border-l-4 border-l-brand-cyan">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>RELATIVE HUMIDITY</span>
            <span className="text-brand-cyan">💧 Vapor</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-tech font-bold text-white tracking-tight">{liveHumidity}</span>
              <span className="text-sm font-mono text-slate-400">%</span>
            </div>
            <p className="text-[11px] text-brand-cyan font-mono mt-0.5">High coastal moisture index</p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">Atmospheric vapor load: High</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 flex flex-col justify-between border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>SURFACE WIND SPEED</span>
            <span>🍃 10m</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-tech font-bold text-white tracking-tight">{liveWind}</span>
              <span className="text-sm font-mono text-slate-400">m/s</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5">Calm convective boundary</p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">Direction: 168° SSE Marine Inflow</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 flex flex-col justify-between border-l-4 border-l-brand-amber">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>SOLAR RADIATION (EST)</span>
            <span className="text-brand-amber">☀️ Zenith</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-tech font-bold text-white tracking-tight">{liveSolar}</span>
              <span className="text-sm font-mono text-slate-400">W/m²</span>
            </div>
            <p className="text-[11px] text-brand-amber font-mono mt-0.5">Peak solar irradiance window</p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">Global horizontal irradiation</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 flex flex-col justify-between border-l-4 border-l-brand-red bg-gradient-to-b from-brand-red/10 to-transparent">
          <div className="flex items-center justify-between text-[11px] text-brand-red font-mono font-bold">
            <span>HEAT INDEX (FEELS LIKE)</span>
            <span className="animate-ping w-1.5 h-1.5 rounded-full bg-brand-red"></span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-tech font-bold text-brand-red tracking-tight">{liveApparent}</span>
              <span className="text-sm font-mono text-slate-300">°C</span>
            </div>
            <p className="text-[11px] text-red-300 font-mono mt-0.5">Extreme Danger Threshold</p>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">Heat Stroke Probability: Extreme</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 flex flex-col justify-between border-l-4 border-l-brand-purple">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>AQI & UV INDEX</span>
            <span className="text-brand-purple">🟣 Bio</span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-tech font-bold text-white">142</span>
              <span className="text-[10px] font-mono text-brand-amber block">Unhealthy Mod</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-tech font-bold text-brand-purple">9.0</span>
              <span className="text-[10px] font-mono text-brand-purple block">Very High UV</span>
            </div>
          </div>
          <div class="text-[10px] text-slate-500 font-mono truncate">O3 + PM2.5 Microparticle load</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 flex flex-col justify-between col-span-2 md:col-span-4 xl:col-span-1 border border-brand-amber/30 bg-brand-amber/5">
          <div className="flex items-center justify-between text-[11px] text-brand-amber font-mono font-semibold">
            <span>DIURNAL SOLAR PEAK</span>
            <span className="text-xs">⏳</span>
          </div>
          <div className="my-2">
            <div className="text-xl font-mono font-bold text-white tracking-widest">
              11h : 05m : 38s
            </div>
            <p className="text-[11px] text-brand-amber/80 font-mono mt-0.5">Solar Noon: 12:14 PM IST</p>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/5 pt-1">
            <span>UV Index Peak: 11.4</span>
            <span>Angle: 68.4°</span>
          </div>
        </div>
      </section>

      {/* Multi-Hazard & Directive Banner */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8">
           <OtherHazardsCard telemetry={telemetry} />
        </div>
        <div className="xl:col-span-4 glass-panel rounded-xl p-4 border-l-4 border-l-brand-red bg-gradient-to-r from-brand-red/15 via-black/40 to-black/20 relative overflow-hidden flex flex-col justify-center">
            <h2 className="text-sm font-bold font-tech text-white uppercase tracking-wider mb-2">Disaster Directive</h2>
            <p className="text-xs text-slate-300 font-sans mb-3">
              <strong className="text-white font-semibold">Critical Thermal Hazard Advisory:</strong> Extreme bioclimatic stress conditions detected across {activeDistrict.district || 'Bhubaneswar'} and coastal plain corridor. Immediate administrative mandate invoked.
            </p>
            <button onClick={handleSiren} className="w-full py-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-orange text-white font-tech font-bold text-xs shadow-glow-orange transition relative" type="button">
                {dispatchStatus ? dispatchStatus : "BROADCAST CIVIC SIREN"}
            </button>
        </div>
      </div>

      {/* Map */}
      <div className="glass-panel rounded-xl p-4 border border-brand-orange/20 relative overflow-hidden w-full h-[500px]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 z-10 relative">
          <div className="flex items-center gap-2">
            <span className="text-sm font-tech font-bold text-white">Hyperlocal Live GIS Hazard Risk Contour</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold">
              THERMAL PLUME: ACTIVE
            </span>
          </div>
        </div>
        
        {/* Procedural Map SVG from User's Mockup */}
        <div className="absolute inset-0 top-12 bottom-0 w-full rounded-lg overflow-hidden border border-white/10 bg-[#071120] flex items-center justify-center">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 400">
            <defs>
              <radialGradient id="heatCoreVijayawada" cx="45%" cy="52%" r="48%">
                <stop offset="0%" stopColor="#FF2E93" stopOpacity="0.85"></stop>
                <stop offset="25%" stopColor="#FF5E36" stopOpacity="0.8"></stop>
                <stop offset="55%" stopColor="#FFB703" stopOpacity="0.7"></stop>
                <stop offset="78%" stopColor="#06D6A0" stopOpacity="0.45"></stop>
                <stop offset="100%" stopColor="#08142c" stopOpacity="0.05"></stop>
              </radialGradient>
              <linearGradient id="riverPath" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.4"></stop>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8"></stop>
              </linearGradient>
            </defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"></path>
            </pattern>
            <rect width="100%" height="100%" fill="url(#gridPattern)"></rect>
            <path d="M -20,200 Q 150,220 300,190 T 550,260 T 820,240" fill="none" stroke="url(#riverPath)" strokeWidth="26" strokeLinecap="round"></path>
            <circle cx="360" cy="210" r="180" fill="url(#heatCoreVijayawada)"></circle>
            
            <g transform="translate(350, 185)">
              <circle cx="10" cy="10" r="22" fill="none" stroke="#FF2E93" strokeWidth="1.5" className="animate-ping"></circle>
              <circle cx="10" cy="10" r="6" fill="#FF2E93"></circle>
              <rect x="22" y="2" width="150" height="22" rx="4" fill="rgba(5, 12, 30, 0.85)" stroke="#FF2E93" strokeWidth="1"></rect>
              <text x="30" y="17" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="Space Grotesk">{activeDistrict.district || 'Bhubaneswar'} Core ({liveTemp}°C)</text>
            </g>
          </svg>
          
          <div className="absolute top-3 left-3 bg-black/80 p-2.5 rounded-lg border border-white/15 text-[10px] font-mono space-y-1.5 shadow-lg">
            <span className="text-white font-bold block border-b border-white/10 pb-1 uppercase tracking-wider">Risk Level Severity</span>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-emerald-400"></span> <span className="text-white">Low (&lt; 30°C)</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-yellow-400"></span> <span className="text-white">Moderate (31 - 38°C)</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-brand-orange"></span> <span className="text-white">High (39 - 43°C)</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-brand-red animate-pulse"></span> <span className="font-bold text-red-300">Extreme (44°C+)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
