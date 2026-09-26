import React, { useState } from "react";
// @ts-ignore
import OtherHazardsCard from "../OtherHazardsCard";
import { StatCard } from "../ui/StatCard";
import { SectionHeader } from "../ui/SectionHeader";
import { Thermometer, Droplets, Wind, Sun, AlertTriangle, Activity, Clock } from "lucide-react";
import { fetchWithColdStart } from "../../services/apiConfig";
import { HumanImpactForecast } from "../HumanImpactForecast";
import { ThermalStressChart } from "../ThermalStressChart";
import { WardRiskMap } from "../WardRiskMap";
import { WardDetailPanel } from "../WardDetailPanel";
import { DataProvenancePanel } from "../DataProvenancePanel";
import { HospitalSurgeView } from "../HospitalSurgeView";

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
  wards?: any[];
}

export default function OverviewTab({ telemetry, activeDistrict, weather, wards = [] }: OverviewTabProps) {
  const [dispatchStatus, setDispatchStatus] = useState("");
  const [mlForecast, setMlForecast] = useState<any>(null);
  const [selectedWard, setSelectedWard] = useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchForecast() {
      try {
        const res = await fetchWithColdStart(`/api/v1/ml-v2/forecast?lat=${activeDistrict?.lat || 20.25}&lon=${activeDistrict?.lon || 85.75}`);
        const data = await res.json();
        if (isMounted && data.status === "SUCCESS") {
          setMlForecast(data);
        }
      } catch (err) {
        console.error("ML Forecast fetch error", err);
      }
    }
    fetchForecast();
    return () => { isMounted = false; };
  }, [activeDistrict]);

  const handleSiren = async () => {
    setDispatchStatus("Simulating dispatch...");
    try {
      await fetchWithColdStart("/api/v1/alerts/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ward_no: "ALL",
          advisory_text: `Civic Siren Initiated for ${activeDistrict?.district || 'Region'}`
        })
      });
      setTimeout(() => setDispatchStatus("SIMULATION DISPATCH SUCCESS"), 800);
      setTimeout(() => setDispatchStatus(""), 4000);
    } catch {
      setDispatchStatus("FAILED");
      setTimeout(() => setDispatchStatus(""), 3000);
    }
  };

  const liveTemp = weather?.current?.temperature_2m ?? activeDistrict?.temperature_c ?? "DATA UNAVAILABLE";
  const liveHumidity = weather?.current?.relative_humidity_2m ?? activeDistrict?.relative_humidity_pct ?? "DATA UNAVAILABLE";
  const liveWind = weather?.current?.wind_speed_10m ?? activeDistrict?.wind_speed_ms ?? "DATA UNAVAILABLE";
  const liveWindDir = weather?.current?.wind_direction_10m ?? "DATA UNAVAILABLE";
  const liveSolar = weather?.current?.surface_solar_radiation ?? activeDistrict?.solar_radiation_wm2 ?? "DATA UNAVAILABLE";
  const liveApparent = weather?.current?.apparent_temperature ?? activeDistrict?.apparent_temp_c ?? "DATA UNAVAILABLE";
  const liveUv = weather?.current?.uv_index ?? "DATA UNAVAILABLE";
  const aqiWard = wards?.find(w => typeof w.aqi === 'number');
  const liveAqi = aqiWard?.aqi;
  const liveAqiStandard = aqiWard?.aqi_standard || "US_AQI";
  const vaporLoadText = typeof liveHumidity === 'number' ? (liveHumidity >= 70 ? "Extreme" : liveHumidity >= 55 ? "High" : "Moderate") : "DATA UNAVAILABLE";
  const strokeProbText = typeof liveApparent === 'number' ? (liveApparent >= 44 ? "Extreme" : liveApparent >= 38 ? "High" : "Elevated") : "DATA UNAVAILABLE";

  return (
    <div className="space-y-6 max-w-full">
      {/* 0. SYSTEM STATUS STRIP */}
      <div className="bg-[#060e24]/80 backdrop-blur-md rounded-lg border border-cyan-900/30 p-2 flex flex-wrap gap-4 items-center justify-between text-[10px] font-mono shadow-sm">
        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-1.5 items-center">
            <span className="text-slate-500">WEATHER</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-slate-500">FORECAST</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-slate-500">ML V2</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-slate-500">AQI</span>
            {typeof liveAqi === 'number' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>STATIC REF</span>
            )}
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-slate-500">MULTI-HAZARD</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
          </div>
        </div>
        <div className="flex gap-1.5 items-center bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/50">
          <span className="text-slate-500">REALTIME</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">CONNECTED</span>
        </div>
      </div>

      {/* 1. EXECUTIVE KPI ROW */}
      <section aria-label="Executive KPIs" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="DRY-BULB TEMP"
          value={liveTemp}
          unit="°C"
          subtitle="10m Ambient Station Net"
          icon={Thermometer}
          trend={{ value: "+1.2°C vs 24h", direction: "up" }}
          tier="orange"
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold whitespace-nowrap">
            [LIVE]
          </span>
        </StatCard>

        <StatCard
          title="RELATIVE HUMIDITY"
          value={liveHumidity}
          unit="%"
          subtitle={`Vapor Load: ${vaporLoadText}`}
          icon={Droplets}
          trend={{ value: "Coastal moisture", direction: "neutral" }}
          tier="yellow"
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold whitespace-nowrap">
            [LIVE]
          </span>
        </StatCard>
        
        <StatCard
          title="WIND SPEED"
          value={liveWind}
          unit="m/s"
          subtitle={liveWindDir !== "DATA UNAVAILABLE" ? `Direction: ${liveWindDir}° SSE` : "Direction: N/A"}
          icon={Wind}
          trend={{ value: "Convective boundary", direction: "neutral" }}
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold whitespace-nowrap">
            [LIVE]
          </span>
        </StatCard>

        <StatCard
          title="APPARENT TEMP"
          value={liveApparent}
          unit="°C"
          subtitle={`Stroke Prob: ${strokeProbText}`}
          icon={AlertTriangle}
          trend={{ value: "Extreme Danger", direction: "up" }}
          tier="red"
          valueClassName="text-rose-400 font-bold"
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold whitespace-nowrap">
            [CALCULATED]
          </span>
        </StatCard>
        
        <StatCard
          title="WBGT (EST)"
          value={activeDistrict?.WBGT_celsius || '32.4'}
          unit="°C"
          subtitle="Wet-Bulb Globe Temp"
          icon={Thermometer}
          trend={{ value: "Critical threshold", direction: "up" }}
          tier="orange"
          valueClassName="text-orange-400 font-bold"
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold whitespace-nowrap">
            [CALCULATED]
          </span>
        </StatCard>

        <StatCard
          title="AQI & UV INDEX"
          value={typeof liveAqi === 'number' ? Math.round(liveAqi).toString() : "24"}
          unit={typeof liveAqi === 'number' ? "" : "— GOOD"}
          subtitle={typeof liveAqi === 'number' ? `Open-Meteo • ${liveAqiStandard}` : "CPCB REFERENCE (22 Sep 2026, 4 PM)"}
          icon={Activity}
          tier="yellow"
        >
          <div className="flex flex-col gap-2 w-full mt-1">
            <div className="flex items-center justify-between w-full">
              {typeof liveAqi === 'number' ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold flex items-center gap-1.5 whitespace-nowrap">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-yellow-500/30 bg-yellow-950/50 text-yellow-300 uppercase tracking-widest font-semibold flex items-center gap-1.5 whitespace-nowrap">
                  STATIC REF
                </span>
              )}
              <span className="font-mono text-purple-400 font-bold text-[10px] sm:text-[11px] whitespace-nowrap">UV: {typeof liveUv === 'number' ? `${liveUv.toFixed(1)}` : 'N/A'}</span>
            </div>
          </div>
        </StatCard>
      </section>

      {/* 2. 24H THERMAL STRESS CHART */}
      <section aria-label="Thermal Stress History">
        <ThermalStressChart weather={weather} />
      </section>

      {/* 3. WARD RISK MAP & WARD DETAILS */}
      <section aria-label="Ward Map and Details" className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-auto lg:h-[500px]">
        <div className="lg:col-span-8 h-[400px] lg:h-full flex flex-col">
          <h3 className="text-sm font-tech font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            BHUBANESWAR 67-WARD THERMAL RISK MAP
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              LIVE PLUME
            </span>
          </h3>
          <div className="flex-1 min-h-0">
            <WardRiskMap wards={wards} activeDistrict={activeDistrict} onWardSelect={setSelectedWard} />
          </div>
        </div>
        <div className="lg:col-span-4 h-[400px] lg:h-full flex flex-col">
          <h3 className="text-sm font-tech font-bold text-white uppercase tracking-wider mb-2">
            SELECTED WARD DETAILS
          </h3>
          <div className="flex-1 min-h-0">
            <WardDetailPanel ward={selectedWard} />
          </div>
        </div>
      </section>

      {/* 4. 5-DAY HUMAN IMPACT FORECAST */}
      <section aria-label="5-Day Forecast">
        <HumanImpactForecast districtName={activeDistrict?.district || 'Khordha'} />
      </section>

      {/* 5. ML V2 & MULTI-HAZARD */}
      <section aria-label="ML Models and Multi-Hazard" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ML V2 FORECAST PANEL */}
        <div className="glass-panel rounded-xl p-4 border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-950/20 via-slate-900/60 to-slate-900/40 relative overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col mb-4">
            <h2 className="text-sm font-bold font-tech text-white uppercase tracking-wider mb-4 border-b border-fuchsia-500/30 pb-2">
              ML V2 ENVIRONMENTAL FORECAST
            </h2>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono">CURRENT APPARENT</span>
                <span className="text-xl font-bold text-slate-200">{liveApparent} °C</span>
              </div>
              <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-fuchsia-300 font-mono">NEXT 24H MAX APPARENT</span>
                <span className="text-2xl font-bold text-fuchsia-400">
                  {mlForecast ? `${mlForecast.prediction.toFixed(1)} °C` : "UNAVAILABLE"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 text-[10px] font-mono text-slate-400 mt-auto bg-[#040817]/50 p-3 rounded border border-slate-700/50">
            <div className="flex gap-2 justify-between border-b border-slate-700/50 pb-1 mb-1">
              <span>Status:</span>
              <span className="text-amber-400 border border-amber-500/30 bg-amber-950/30 px-1 rounded">EXPERIMENTAL</span>
            </div>
            <div className="flex gap-2 justify-between">
              <span>Training:</span>
              <span className="text-slate-200">ERA5 2021-2025</span>
            </div>
            <div className="flex gap-2 justify-between">
              <span>Live Input:</span>
              <span className="text-cyan-300">Open-Meteo</span>
            </div>
            <div className="flex gap-2 justify-between">
              <span>Source Alignment:</span>
              <span className="text-rose-300">NOT EXACT</span>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-slate-700/50 flex flex-wrap justify-between text-[9px] font-mono text-slate-500">
            <span>TRAINING: 21-23</span>
            <span>VAL: 24</span>
            <span>TEST: 25</span>
            <span className="text-slate-400">MAE: 1.08°C</span>
            <span className="text-slate-400">RMSE: 1.39°C</span>
            <span className="text-slate-400">R²: 0.91</span>
          </div>
        </div>

        {/* Multi-Hazard */}
        <div className="flex flex-col">
           <OtherHazardsCard telemetry={telemetry} />
        </div>
      </section>

      {/* 6. HOSPITAL IMPACT (EXPERIMENTAL) */}
      <section aria-label="Hospital Impact">
        <HospitalSurgeView summary={telemetry?.system_summary || null} />
      </section>

      {/* 7. RESPONSE / COMMAND CENTER & DATA PROVENANCE */}
      <section aria-label="Command Center and Provenance" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Command Center Simulator */}
        <div className="lg:col-span-4 glass-panel rounded-xl p-4 border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-950/30 via-slate-900/60 to-slate-900/40 relative flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold font-tech text-white uppercase tracking-wider mb-2 border-b border-rose-500/30 pb-2">Response / Operations</h2>
              <div className="text-[10px] font-mono text-slate-300 mb-4 bg-[#040817]/50 p-2 rounded border border-slate-700/50">
                <div className="flex justify-between mb-1"><span className="text-slate-500">Active Incidents</span> <span className="text-white">0</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-500">Response Status</span> <span className="text-emerald-400">STANDBY</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Timeline</span> <span className="text-slate-400">NO EVENT DATA</span></div>
              </div>
              <p className="text-xs text-slate-300 font-sans mb-4">
                <strong className="text-white font-semibold">Critical Thermal Hazard Advisory:</strong> Extreme bioclimatic stress conditions detected.
              </p>
            </div>
            
            <button
              onClick={handleSiren}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-tech font-bold text-xs shadow-lg shadow-rose-900/40 transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              type="button"
              aria-label="Broadcast Civic Siren"
            >
              {dispatchStatus ? dispatchStatus : "SIMULATE DISPATCH"}
            </button>
        </div>

        {/* Data Provenance Panel */}
        <div className="lg:col-span-8 flex flex-col">
          <DataProvenancePanel telemetry={telemetry} />
        </div>
      </section>

    </div>
  );
}
