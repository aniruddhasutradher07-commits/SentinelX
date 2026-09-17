import React from "react";
import ForecastChart from "../../components/ForecastChart";
import AIAdvisor from "../../components/AIAdvisor";

export default function AnalyticsTab({ hourlyForecast, activeDistrict }) {
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
      <div className="glass-panel rounded-xl p-4 border border-brand-cyan/20">
         <ForecastChart forecast={hourlyForecast} />
      </div>

      <div className="glass-panel rounded-xl p-4 border border-indigo-500/30">
        <AIAdvisor topDrivers={top3Drivers} />
      </div>
    </div>
  );
}
