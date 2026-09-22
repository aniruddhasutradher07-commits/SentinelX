import React, { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import HeroRiskWidget from "../../components/heatguard/widgets/HeroRiskWidget";
import HeatRiskPipelineWidget from "../../components/heatguard/widgets/HeatRiskPipelineWidget";
import ForecastWidget from "../../components/heatguard/widgets/ForecastWidget";
import WhatIfScenarioWidget from "../../components/heatguard/widgets/WhatIfScenarioWidget";
import RiskMapWidget from "../../components/heatguard/widgets/RiskMapWidget";
import VulnerabilityWidget from "../../components/heatguard/widgets/VulnerabilityWidget";
import ActionCenterWidget from "../../components/heatguard/widgets/ActionCenterWidget";
import { useSentinelData } from "../../context/SentinelDataContext";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const { districts, wards, loading, error, lastUpdated } = useSentinelData();
  const [activeWardNo, setActiveWardNo] = useState<string | null>(null);

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-6 border border-red-200">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
        <h3 className="font-bold">System Error</h3>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (loading || !wards || !wards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Initializing Intelligence Core...</p>
      </div>
    );
  }

  const districtName = "Khordha";
  const districtData = districts?.find(d => d.district.toLowerCase() === districtName.toLowerCase());
  const districtRiskTier = districtData?.RiskTier || "EXTREME";

  const defaultWard = [...wards].sort((a, b) => (b.WardRiskScore || 0) - (a.WardRiskScore || 0))[0];
  const activeWard = activeWardNo ? wards.find(w => w.ward_no === activeWardNo) || defaultWard : defaultWard;
  
  const windKmh = activeWard.wind_speed_ms ? activeWard.wind_speed_ms * 3.6 : 12;

  return (
    <>
      <PageMeta
        title="HeatGuardAI | Intelligence Command"
        description="Predict Heat. Protect People."
      />
      
      {/* COMMAND CENTER HEADER */}
      <div className="flex justify-between items-end mb-8 pt-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">HeatGuardAI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Localized Human Heat-Risk Intelligence</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium text-gray-900 dark:text-white">{districtName} District</div>
          {lastUpdated && (
            <div className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-widest flex items-center justify-end gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              Live: {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-16 pb-20">
        
        {/* 1. CURRENT HEAT RISK (HERO) */}
        <section>
          <HeroRiskWidget ward={activeWard} />
        </section>

        {/* 2. WHY? (PIPELINE) */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Intelligence Pipeline</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Translating meteorological inputs into physiological risk</p>
          </div>
          <HeatRiskPipelineWidget ward={activeWard} />
        </section>

        {/* 3. HOW DOES IT CHANGE? (FORECAST) */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">5-Day Forecast Horizon</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">District-wide evolution of weather, thermal stress, and human risk</p>
          </div>
          <ForecastWidget />
        </section>

        {/* 4. WHAT IF? (SCENARIO) */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Scenario Simulator</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adjust environmental variables to observe risk escalation</p>
          </div>
          <WhatIfScenarioWidget
            initialTemp={activeWard.temperature_c}
            initialHum={activeWard.relative_humidity_pct}
            initialWindKm={Math.round(windKmh)}
          />
        </section>

        {/* 5. WHERE + WHO? (GIS + VULNERABILITY) */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Geographic Exposure</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">High-resolution vulnerability mapping for targeted intervention</p>
          </div>
          <div className="flex flex-col xl:flex-row gap-0 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151821]">
            <div className="xl:w-2/3 h-[500px] xl:h-auto border-b xl:border-b-0 xl:border-r border-gray-200 dark:border-white/10 relative">
              <RiskMapWidget 
                wards={wards} 
                activeWard={activeWard} 
                onWardSelect={(no) => setActiveWardNo(`Ward ${no}`)} 
              />
            </div>
            <div className="xl:w-1/3">
              <VulnerabilityWidget ward={activeWard} />
            </div>
          </div>
        </section>

        {/* 6. WHAT SHOULD AUTHORITIES DO? (ACTION CENTER) */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Action Center</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recommended operational protocols based on current risk tier</p>
          </div>
          <ActionCenterWidget 
            ward={activeWard}
            districtTier={districtRiskTier} 
            districtName={districtName}
          />
        </section>

      </div>
    </>
  );
}
