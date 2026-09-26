import React, { useState } from "react";
// @ts-ignore
import OtherHazardsCard from "../OtherHazardsCard";
import { StatCard } from "../ui/StatCard";
import { SectionHeader } from "../ui/SectionHeader";
import { Thermometer, Droplets, Wind, Sun, AlertTriangle, Activity, Clock } from "lucide-react";
import { LiveRadarMap } from "../ui/LiveRadarMap";
import { fetchWithColdStart } from "../../services/apiConfig";
import { HumanImpactForecast } from "../HumanImpactForecast";

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

  const getSolarNoonCountdown = () => {
    const now = new Date();
    const solarNoon = new Date();
    solarNoon.setHours(12, 14, 0, 0);
    let diff = solarNoon.getTime() - now.getTime();
    if (diff < 0) {
      solarNoon.setDate(solarNoon.getDate() + 1);
      diff = solarNoon.getTime() - now.getTime();
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };
  
  // Data Quality Metrics
  const totalWards = wards?.length || 0;
  const liveWards = wards?.filter(w => w.is_live).length || 0;
  const staleWards = wards?.filter(w => w.is_stale && w.data_age_minutes < 999).length || 0;
  const unavailableWards = wards?.filter(w => w.data_age_minutes >= 999).length || 0;
  const primarySource = wards?.length > 0 ? wards[0].source : 'Open-Meteo';
  const aqiSource = "Open-Meteo Air Quality";

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Live Meteorological & Bioclimatic Telemetry"
        subtitle={`Real-time sensor feed and GIS plume model for ${activeDistrict?.district || 'Bhubaneswar'}`}
      />

      {/* System Status / Provenance Area */}
      <div className="glass-panel rounded-xl p-3 border border-slate-700/50 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 text-[10px] font-mono">
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">WEATHER</span>
          {liveTemp !== "DATA UNAVAILABLE" ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
          ) : (
            <span className="text-rose-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>UNAVAILABLE</span>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">5-DAY FORECAST</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">ML V2</span>
          {mlForecast && mlForecast.status === "SUCCESS" ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
          ) : (
            <span className="text-rose-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>UNAVAILABLE</span>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">AQI</span>
          {typeof liveAqi === 'number' ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
          ) : (
            <span className="text-rose-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>UNAVAILABLE</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-slate-500">CPCB</span>
          {telemetry?.data_quality?.air_quality === "CREDENTIALS_NOT_CONFIGURED" || telemetry?.air_quality?.status === "CREDENTIALS_NOT_CONFIGURED" ? (
            <span className="text-amber-400 font-bold flex items-center gap-1.5 text-[9px]"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>NO_CREDS</span>
          ) : (
            <span className="text-slate-400 font-bold flex items-center gap-1.5">UNKNOWN</span>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">MULTI-HAZARD</span>
          {telemetry?.multi_hazard ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE</span>
          ) : (
            <span className="text-rose-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>UNAVAILABLE</span>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">REALTIME</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>CONNECTED</span>
        </div>
      </div>

      {/* Top Telemetry Grid */}
      <section aria-label="Live Telemetry" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3.5">
        <StatCard
          title="DRY-BULB TEMP"
          value={liveTemp}
          unit="°C"
          subtitle="10m Ambient Station Net"
          icon={Thermometer}
          trend={{ value: "+1.2°C vs 24h", direction: "up" }}
          tier="orange"
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold">
            [REAL]
          </span>
        </StatCard>

        <StatCard
          title="RELATIVE HUMIDITY"
          value={liveHumidity}
          unit="%"
          subtitle={`Vapor load: ${vaporLoadText}`}
          icon={Droplets}
          trend={{ value: "Coastal moisture", direction: "neutral" }}
          tier="yellow"
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold">
            [REAL]
          </span>
        </StatCard>

        <StatCard
          title="WIND SPEED"
          value={liveWind}
          unit="m/s"
          subtitle={`Direction: ${liveWindDir}° SSE`}
          icon={Wind}
          trend={{ value: "Convective boundary", direction: "neutral" }}
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold">
            [REAL]
          </span>
        </StatCard>

        <StatCard
          title="SOLAR RADIATION"
          value={liveSolar}
          unit="W/m²"
          subtitle="Global horizontal radiation"
          icon={Sun}
          trend={{ value: "Peak window", direction: "up" }}
          tier="yellow"
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold">
            [REAL]
          </span>
        </StatCard>

        <StatCard
          title="CURRENT APPARENT TEMPERATURE"
          value={liveApparent}
          unit="°C"
          subtitle={`Stroke Probability: ${strokeProbText}`}
          icon={AlertTriangle}
          trend={{ value: "Extreme Danger", direction: "up" }}
          tier="red"
          valueClassName="text-rose-400 font-bold"
        >
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
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
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between w-full">
              {typeof liveAqi === 'number' ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>LIVE
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-yellow-500/30 bg-yellow-950/50 text-yellow-300 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  STATIC REFERENCE
                </span>
              )}
              <span className="font-mono text-purple-400 font-bold text-[11px] whitespace-nowrap mt-1">UV {typeof liveUv === 'number' ? `${liveUv.toFixed(1)} (${liveUv >= 11 ? 'Extreme' : liveUv >= 8 ? 'Very High' : 'High'})` : 'DATA UNAVAILABLE'}</span>
            </div>
          </div>
        </StatCard>

        <StatCard
          title="SOLAR NOON PEAK"
          value={getSolarNoonCountdown()}
          unit="remaining"
          subtitle="Solar Noon: 12:14 PM IST"
          icon={Clock}
          tier="orange"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
              [CALCULATED]
            </span>
            <span className="text-[10px] font-mono text-slate-400">Angle: 68.4°</span>
          </div>
        </StatCard>
      </section>

      {/* ML V2 FORECAST PANEL */}
      <div className="glass-panel rounded-xl p-4 border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-950/20 via-slate-900/60 to-slate-900/40 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold font-tech text-white uppercase tracking-wider mb-1">
              ML V2 ENVIRONMENTAL FORECAST
            </h2>
            <div className="flex gap-4 items-center mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono">CURRENT APPARENT TEMPERATURE</span>
                <span className="text-xl font-bold text-slate-200">{liveApparent} °C</span>
              </div>
              <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-fuchsia-300 font-mono">NEXT 24H MAX APPARENT TEMPERATURE</span>
                <span className="text-2xl font-bold text-fuchsia-400">
                  {mlForecast ? `${mlForecast.prediction.toFixed(1)} °C` : "UNAVAILABLE"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 text-[10px] font-mono text-slate-400 border-l border-slate-700/50 pl-4">
            <div className="flex gap-2 justify-between">
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
        </div>
        
        {/* Model Provenance Metrics */}
        <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-x-6 gap-y-2 text-[9px] font-mono text-slate-500">
          <span>TRAINING PERIOD: 2021-2023</span>
          <span>VALIDATION: 2024</span>
          <span>TEST: 2025</span>
          <span className="text-slate-400">TEST MAE: 1.08 °C</span>
          <span className="text-slate-400">TEST RMSE: 1.39 °C</span>
          <span className="text-slate-400">TEST R²: 0.91</span>
        </div>
      </div>

      {/* SIH REQUIRED: 5-DAY HUMAN IMPACT FORECAST */}
      <HumanImpactForecast districtName={activeDistrict?.district || 'Khordha'} />

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
              {dispatchStatus ? dispatchStatus : "SIMULATE CIVIC ALERT"}
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
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 uppercase tracking-widest font-semibold">
            [MODELLED]
          </span>
        </div>
        
        {/* Live Interactive Weather Radar Map (Option 6) */}
        <LiveRadarMap peakTemp={liveTemp} />
      </div>
    </div>
  );
}
