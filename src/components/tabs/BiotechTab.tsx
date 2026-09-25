import React from "react";
import { OrganStrainHologram } from "../../components/OrganStrainHologram";
import { HThermCalculator } from "../../components/HThermCalculator";
import { NightRecoveryCard, NightRecoveryData } from "../../components/NightRecoveryCard";
import { HeatBalanceChart } from "../../components/HeatBalanceChart";
import { PhysiologyReplay } from "../../components/PhysiologyReplay";
import { StatCard } from "../ui/StatCard";
import { SectionHeader } from "../ui/SectionHeader";
import { Activity, ShieldAlert, HeartPulse } from "lucide-react";

interface BiotechTabProps {
  activeDistrict: {
    WBGT_celsius?: number;
    vulnerability_multiplier?: number;
    [key: string]: any;
  };
  telemetry?: any;
  weather?: any;
  hourlyForecast?: any[];
}

export default function BiotechTab({ activeDistrict, telemetry, weather, hourlyForecast }: BiotechTabProps) {
  const wbgtVal = activeDistrict?.WBGT_celsius ?? 32.4;
  const hThermScore = Math.min(
    100,
    Math.round((wbgtVal / 34.0) * 78.0 * (activeDistrict?.vulnerability_multiplier || 1.15))
  );

  // Extract Live Telemetry for HThermCalculator
  const envRisk = telemetry?.environmental_risk || {};
  const liveTemp = envRisk.temperature_c ?? weather?.current?.temperature_2m;
  const liveRh = envRisk.humidity_pct ?? weather?.current?.relative_humidity_2m;
  const liveWind = envRisk.wind_speed_ms ?? (weather?.current?.wind_speed_10m ? weather.current.wind_speed_10m / 3.6 : undefined);
  // Only use solar radiation if it's explicitly available from backend telemetry or verified weather (not fallback mock)
  const liveSolar = weather?.current?.surface_solar_radiation; // OpenMeteo verified shortwave radiation

  // Calculate Night Recovery metrics from historical/hourly telemetry
  const nightHours = hourlyForecast?.filter(h => {
    const d = new Date(h.time);
    return d.getHours() >= 22 || d.getHours() <= 5;
  }) || [];
  
  let nightMinTemp: number | undefined = undefined;
  let nightAvgRh: number | undefined = undefined;
  
  if (nightHours.length > 0) {
    nightMinTemp = Math.min(...nightHours.map(h => h.temperature_2m));
    const rhSum = nightHours.reduce((acc, h) => acc + h.relative_humidity_2m, 0);
    nightAvgRh = Math.round(rhSum / nightHours.length);
  }

  const nightRecoveryData: NightRecoveryData = {
    night_min_temp_c: nightMinTemp,
    night_humidity_pct: nightAvgRh,
    // explicitly omitting consecutive_poor_nights, thermal_burden_score, failure_score 
    // so they show NOT AVAILABLE / EXPERIMENTAL as requested.
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <SectionHeader
          title="BIOTECH & PHYSIOLOGY"
          subtitle="Environmental Conditions → Physiological Response Model"
          icon={Activity}
        />
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono mb-2 bg-slate-900/50 p-2.5 rounded-lg border border-white/5 w-fit">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE ENVIRONMENTAL INPUT
          </div>
          <div className="text-slate-400 border-l border-slate-700 pl-4">
            Source: <span className="text-white">Open-Meteo</span>
          </div>
          <div className="text-slate-400 border-l border-slate-700 pl-4 flex items-center gap-1.5">
            Mode: <span className="text-cyan-400">CALCULATED</span> / <span className="text-amber-400">EXPERIMENTAL</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-full border border-slate-700/50">
            <HThermCalculator 
              liveTemp={liveTemp} 
              liveRh={liveRh} 
              liveWind={liveWind} 
              liveSolar={liveSolar} 
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 flex flex-col">
          <NightRecoveryCard data={nightRecoveryData} className="w-full" />
          <HeatBalanceChart />
        </div>
      </div>

      {/* Experimental Physiology Replay Area */}
      <div className="grid grid-cols-1 gap-6">
        <PhysiologyReplay />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 glass-panel rounded-xl border border-cyan-500/20 overflow-hidden relative min-h-[400px]">
           <OrganStrainHologram />
        </div>
      </div>
    </div>
  );
}
