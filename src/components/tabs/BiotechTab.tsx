import React from "react";
import { OrganStrainHologram } from "../../components/OrganStrainHologram";
import { HThermCalculator } from "../../components/HThermCalculator";
import { NightRecoveryCard, NightRecoveryData } from "../../components/NightRecoveryCard";
import { HeatBalanceChart } from "../../components/HeatBalanceChart";
import { PhysiologyReplay } from "../../components/PhysiologyReplay";
import { SectionHeader } from "../ui/SectionHeader";
import { Activity } from "lucide-react";

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
  const liveSolar = weather?.current?.surface_solar_radiation;

  // Calculate Night Recovery metrics from raw hourly weather data (Open-Meteo format)
  // weather.hourly = { time: string[], temperature_2m: number[], relative_humidity_2m: number[] }
  let nightMinTemp: number | undefined = undefined;
  let nightAvgRh: number | undefined = undefined;

  const hourlyRaw = weather?.hourly;
  if (hourlyRaw?.time && hourlyRaw?.temperature_2m && hourlyRaw?.relative_humidity_2m) {
    const nightIndices: number[] = [];
    hourlyRaw.time.forEach((isoStr: string, idx: number) => {
      const hour = new Date(isoStr).getHours();
      if (hour >= 22 || hour <= 5) {
        nightIndices.push(idx);
      }
    });

    if (nightIndices.length > 0) {
      const nightTemps = nightIndices.map((i: number) => hourlyRaw.temperature_2m[i]).filter((v: number) => typeof v === 'number');
      const nightRhs = nightIndices.map((i: number) => hourlyRaw.relative_humidity_2m[i]).filter((v: number) => typeof v === 'number');

      if (nightTemps.length > 0) {
        nightMinTemp = Math.round(Math.min(...nightTemps) * 10) / 10;
      }
      if (nightRhs.length > 0) {
        nightAvgRh = Math.round(nightRhs.reduce((a: number, b: number) => a + b, 0) / nightRhs.length);
      }
    }
  }

  // Derive a rough thermal burden from daytime WBGT + night minimum temp
  let thermalBurden: number | undefined = undefined;
  if (nightMinTemp !== undefined) {
    // Simplified: higher WBGT + higher night floor = higher burden
    const dayContrib = Math.min(100, Math.round((wbgtVal / 38) * 70));
    const nightPenalty = Math.min(30, Math.max(0, Math.round((nightMinTemp - 24) * 3)));
    thermalBurden = Math.min(100, dayContrib + nightPenalty);
  }

  const nightRecoveryData: NightRecoveryData = {
    night_min_temp_c: nightMinTemp,
    night_humidity_pct: nightAvgRh,
    thermal_burden_score: thermalBurden,
    // recovery_score and streak remain undefined → shows "EXPERIMENTAL" label as designed
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
          <NightRecoveryCard data={nightRecoveryData} className="w-full flex-1" />
          <HeatBalanceChart />
        </div>
      </div>

      {/* Experimental Physiology Replay Area */}
      <div className="grid grid-cols-1 gap-6">
        <PhysiologyReplay />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 glass-panel rounded-xl border border-cyan-500/20 overflow-hidden relative min-h-[400px]">
           <OrganStrainHologram score={hThermScore} />
        </div>
      </div>
    </div>
  );
}
