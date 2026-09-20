import React from "react";
// @ts-ignore
import ForecastChart from "../../components/ForecastChart";
// @ts-ignore
import AIAdvisor from "../../components/AIAdvisor";
import { SectionHeader } from "../ui/SectionHeader";
import { BarChart2 } from "lucide-react";

interface AnalyticsTabProps {
  hourlyForecast?: any[];
  activeDistrict?: {
    outdoor_worker_pct?: number;
    tree_cover_pct?: number;
    high_heat_roof_pct?: number;
    [key: string]: any;
  };
}

export default function AnalyticsTab({ hourlyForecast, activeDistrict }: AnalyticsTabProps) {
  const workers = activeDistrict?.outdoor_worker_pct || 28.5;
  const tree = activeDistrict?.tree_cover_pct || 17.2;
  const roof = activeDistrict?.high_heat_roof_pct || 33.0;

  const top3Drivers = [
    {
      title: `Outdoor Labor Density (${workers}%)`,
      detail: `High concentration of construction, brick kiln and informal daily-wage laborers under extreme daytime solar irradiance.`,
    },
    {
      title: `Tree Canopy Deficit (${tree}%)`,
      detail: `Lack of vegetative shading exacerbating surface radiative heat capture in transit rings.`,
    },
    {
      title: `Heat-Trapping Roofing (${roof}%)`,
      detail: `Corrugated tin & asbestos sheets causing nocturnal indoor thermal traps.`,
    }
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Advanced Analytics & AI Risk Attribution"
        subtitle="Hourly predictive trends and primary vulnerability driver breakdown"
        icon={BarChart2}
      />

      <div className="glass-panel rounded-xl p-4 border border-cyan-500/20">
         <ForecastChart forecast={hourlyForecast} />
      </div>

      <div className="glass-panel rounded-xl p-4 border border-indigo-500/30">
        <AIAdvisor topDrivers={top3Drivers} />
      </div>
    </div>
  );
}
