import React, { useState } from "react";
// @ts-ignore
import OtherHazardsCard from "../OtherHazardsCard";
import { fetchWithColdStart } from "../../services/apiConfig";
import { StatCard } from "../ui/StatCard";
import { SectionHeader } from "../ui/SectionHeader";
import { Thermometer, Droplets, Wind, Sun, AlertTriangle, Activity, Clock } from "lucide-react";

interface DistrictInfo {
  district?: string;
  temperature_c?: number;
  relative_humidity_pct?: number;
  [key: string]: any;
}

interface OverviewTabProps {
  telemetry: any;
  activeDistrict: DistrictInfo;
  weather: any;
}

export default function OverviewTab({ telemetry, activeDistrict, weather }: OverviewTabProps) {
  const [dispatchStatus, setDispatchStatus] = useState("");

  const handleSiren = async () => {
    setDispatchStatus("Broadcasting...");
    try {
      await fetchWithColdStart("/api/v1/alerts/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ward_no: "ALL",
          advisory_text: `Civic Siren Initiated for ${activeDistrict?.district || 'Region'}`
        })
      });
      setTimeout(() => setDispatchStatus("SIREN BROADCAST SUCCESS"), 800);
      setTimeout(() => setDispatchStatus(""), 4000);
    } catch {
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
      <SectionHeader
        title="Live Meteorological & Bioclimatic Telemetry"
        subtitle={`Real-time sensor feed and GIS plume model for ${activeDistrict?.district || 'Bhubaneswar'}`}
      />

      {/* Top Telemetry Grid */}
      <section aria-label="Live Telemetry" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3.5">
        <StatCard
          title="DRY-BULB TEMP"
          value={liveTemp}
          unit="°C"
          subtitle="10m Ambient Station Net"
          icon={Thermometer}
          trend={{ value: "+1.2°C vs 24h", direction: "up" }}
          tier="orange"
        />

        <StatCard
          title="RELATIVE HUMIDITY"
          value={liveHumidity}
          unit="%"
          subtitle="Vapor load: High"
          icon={Droplets}
          trend={{ value: "Coastal moisture", direction: "neutral" }}
          tier="yellow"
        />

        <StatCard
          title="WIND SPEED"
          value={liveWind}
          unit="m/s"
          subtitle="Direction: 168° SSE"
          icon={Wind}
          trend={{ value: "Convective boundary", direction: "neutral" }}
        />

        <StatCard
          title="SOLAR RADIATION"
          value={liveSolar}
          unit="W/m²"
          subtitle="Global horizontal radiation"
          icon={Sun}
          trend={{ value: "Peak window", direction: "up" }}
          tier="yellow"
        />

        <StatCard
          title="HEAT INDEX (FEELS LIKE)"
          value={liveApparent}
          unit="°C"
          subtitle="Stroke Probability: Extreme"
          icon={AlertTriangle}
          trend={{ value: "Extreme Danger", direction: "up" }}
          tier="red"
          valueClassName="text-rose-400 font-bold"
        />

        <StatCard
          title="AQI & UV INDEX"
          value="142"
          unit="AQI"
          subtitle="O3 + PM2.5 Microparticle"
          icon={Activity}
          tier="yellow"
        >
          <div className="text-right">
            <span className="font-mono text-purple-400 font-bold text-xs">UV 9.0 (Very High)</span>
          </div>
        </StatCard>

        <StatCard
          title="SOLAR NOON PEAK"
          value="11h 05m"
          unit="remaining"
          subtitle="Solar Noon: 12:14 PM IST"
          icon={Clock}
          tier="orange"
        >
          <span className="text-[10px] font-mono text-slate-400">Angle: 68.4°</span>
        </StatCard>
      </section>

      {/* Multi-Hazard & Directive Banner */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8">
           <OtherHazardsCard telemetry={telemetry} />
        </div>
        <div className="xl:col-span-4 glass-panel rounded-xl p-4 border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-950/30 via-slate-900/60 to-slate-900/40 relative overflow-hidden flex flex-col justify-center">
            <h2 className="text-sm font-bold font-tech text-white uppercase tracking-wider mb-2">Disaster Directive</h2>
            <p className="text-xs text-slate-300 font-sans mb-3">
              <strong className="text-white font-semibold">Critical Thermal Hazard Advisory:</strong> Extreme bioclimatic stress conditions detected across {activeDistrict?.district || 'Bhubaneswar'} and coastal plain corridor. Immediate administrative mandate invoked.
            </p>
            <button
              onClick={handleSiren}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-tech font-bold text-xs shadow-lg shadow-rose-900/40 transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              type="button"
              aria-label="Broadcast Civic Siren"
            >
              {dispatchStatus ? dispatchStatus : "BROADCAST CIVIC SIREN"}
            </button>
        </div>
      </div>

      {/* Map */}
      <div className="glass-panel rounded-xl p-4 border border-amber-500/20 relative overflow-hidden w-full h-[500px]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 z-10 relative">
          <div className="flex items-center gap-2">
            <span className="text-sm font-tech font-bold text-white">Hyperlocal Live GIS Hazard Risk Contour</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              THERMAL PLUME: ACTIVE
            </span>
          </div>
        </div>
        
        {/* Procedural Map SVG */}
        <div className="absolute inset-0 top-12 bottom-0 w-full rounded-lg overflow-hidden border border-white/10 bg-[#071120] flex items-center justify-center">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 400" aria-label="GIS Hazard Plume Contour Map">
            <defs>
              <radialGradient id="heatCoreVijayawada" cx="45%" cy="52%" r="48%">
                <stop offset="0%" stopColor="#C0392B" stopOpacity="0.85"></stop>
                <stop offset="25%" stopColor="#D9772E" stopOpacity="0.8"></stop>
                <stop offset="55%" stopColor="#C9A227" stopOpacity="0.7"></stop>
                <stop offset="78%" stopColor="#3A7D5C" stopOpacity="0.45"></stop>
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
              <circle cx="10" cy="10" r="22" fill="none" stroke="#C0392B" strokeWidth="1.5" className="animate-ping"></circle>
              <circle cx="10" cy="10" r="6" fill="#C0392B"></circle>
              <rect x="22" y="2" width="150" height="22" rx="4" fill="rgba(5, 12, 30, 0.85)" stroke="#C0392B" strokeWidth="1"></rect>
              <text x="30" y="17" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="Space Grotesk">{activeDistrict?.district || 'Bhubaneswar'} Core ({liveTemp}°C)</text>
            </g>
          </svg>
          
          <div className="absolute top-3 left-3 bg-black/80 p-2.5 rounded-lg border border-white/15 text-[10px] font-mono space-y-1.5 shadow-lg">
            <span className="text-white font-bold block border-b border-white/10 pb-1 uppercase tracking-wider">Risk Level Severity</span>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#3A7D5C]"></span> <span className="text-white">Low (&lt; 30°C)</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#C9A227]"></span> <span className="text-white">Moderate (31 - 38°C)</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#D9772E]"></span> <span className="text-white">High (39 - 43°C)</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#C0392B] animate-pulse"></span> <span className="font-bold text-rose-300">Extreme (44°C+)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
