import React, { useState } from 'react';
import HeatGuardSidebar from './HeatGuardSidebar';
import HeatGuardHeader from './HeatGuardHeader';
import HeroRiskWidget from './widgets/HeroRiskWidget';
import WeatherInputsWidget from './widgets/WeatherInputsWidget';
import ThermalStressWidget from './widgets/ThermalStressWidget';
import ExplainabilityWidget from './widgets/ExplainabilityWidget';
import HeatwaveStatusWidget from './widgets/HeatwaveStatusWidget';
import RiskMapWidget from './widgets/RiskMapWidget';
import RiskIntelligenceWidget from './widgets/RiskIntelligenceWidget';
import VulnerabilityWidget from './widgets/VulnerabilityWidget';
import ForecastWidget from './widgets/ForecastWidget';
import AIInsightsWidget from './widgets/AIInsightsWidget';
import ActionCenterWidget from './widgets/ActionCenterWidget';
import ActiveAlertsBar from './widgets/ActiveAlertsBar';
import { DistrictRiskRecord, WardRiskRecord, LiveTelemetry, SystemSummary } from '../../types';

interface HeatGuardDashboardProps {
  districts: DistrictRiskRecord[];
  wards: WardRiskRecord[];
  telemetry: LiveTelemetry | null;
  summary: SystemSummary | null;
  onNavigateTab: (tab: string) => void;
  geoJson?: any;
  wardGeoJson?: any;
}

export default function HeatGuardDashboard({
  districts,
  wards,
  telemetry,
  summary,
  onNavigateTab,
  geoJson,
  wardGeoJson
}: HeatGuardDashboardProps) {
  const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');

  const khordha = districts?.find(d => d.district.toLowerCase() === 'khordha') || districts?.[0];
  
  const score = khordha?.DistrictRiskScore ? Math.round(khordha.DistrictRiskScore) : 82;
  const level = khordha?.RiskTier?.toUpperCase() || 'EXTREME';
  const description = `Human thermal stress is ${level === 'EXTREME' || level === 'RED' ? 'very high' : 'elevated'} in ${khordha?.district || 'Khordha'}.`;
  
  const temp = khordha?.temperature_c || 40.2;
  const humidity = khordha?.relative_humidity_pct || 68;
  const wind = khordha?.wind_speed_ms ? Number((khordha.wind_speed_ms * 3.6).toFixed(1)) : 12;
  const radiation = khordha?.solar_radiation_wm2 ? (khordha.solar_radiation_wm2 > 800 ? 'High' : (khordha.solar_radiation_wm2 > 400 ? 'Moderate' : 'Low')) : 'High';
  
  const hi = khordha?.HI_celsius ? Math.round(khordha.HI_celsius) : 47;
  const wbgt = khordha?.WBGT_celsius ? Number(khordha.WBGT_celsius.toFixed(1)) : 31.4;
  const utci = khordha?.UTCI_celsius ? Math.round(khordha.UTCI_celsius) : 40;

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* LEFT SIDEBAR - Deep Navy */}
      <HeatGuardSidebar activeTab={activeSidebarTab} onTabChange={setActiveSidebarTab} onNavigateTab={onNavigateTab} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F3F4F6]">
        {/* TOP HEADER */}
        <HeatGuardHeader />

        {/* SCROLLABLE GRID CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar">
          
          {/* ROW 1: Hero, Weather, Thermal, Explainability */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <HeroRiskWidget score={score} level={level} description={description} trend="Increasing" />
            </div>
            <div className="md:col-span-3">
              <WeatherInputsWidget temp={temp} humidity={humidity} wind={wind} radiation={radiation} />
            </div>
            <div className="md:col-span-3">
              <ThermalStressWidget hi={hi} wbgt={wbgt} utci={utci} />
            </div>
            <div className="md:col-span-3">
              <ExplainabilityWidget />
            </div>
          </div>

          {/* ROW 2: Map & Intelligence */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 flex flex-col">
              <RiskMapWidget geoJson={geoJson} wardGeoJson={wardGeoJson} />
            </div>
            <div className="md:col-span-4 flex flex-col space-y-4">
              <RiskIntelligenceWidget />
              <VulnerabilityWidget />
            </div>
          </div>

          {/* ROW 3: Forecast, AI, Action */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 flex flex-col">
              <ForecastWidget />
            </div>
            <div className="md:col-span-4 flex flex-col space-y-4">
              <HeatwaveStatusWidget />
              <AIInsightsWidget />
            </div>
            <div className="md:col-span-4 flex flex-col">
              <ActionCenterWidget />
            </div>
          </div>

        </div>

        {/* BOTTOM ACTIVE ALERTS BAR */}
        <ActiveAlertsBar />
      </div>
    </div>
  );
}
