import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OdishaMap } from './components/OdishaMap';
import { WardView } from './components/WardView';
import { HospitalSurgeView } from './components/HospitalSurgeView';
import { HThermCalculator } from './components/HThermCalculator';
import { AICopilotModal } from './components/AICopilotModal';
import { BenchmarksView } from './components/BenchmarksView';
import { ApiExplorer } from './components/ApiExplorer';
import { AlertDispatchModal } from './components/AlertDispatchModal';
import { 
  SystemSummary, 
  DistrictRiskRecord, 
  WardRiskRecord, 
  LiveTelemetry 
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('odisha');
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [districts, setDistricts] = useState<DistrictRiskRecord[]>([]);
  const [wards, setWards] = useState<WardRiskRecord[]>([]);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState<boolean>(false);
  const [dispatchTarget, setDispatchTarget] = useState<string>('Khordha');
  const [dispatchMessage, setDispatchMessage] = useState<string>('');

  // Initial Data Fetching
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [sumRes, distRes, wardRes, geoRes, teleRes] = await Promise.all([
          fetch('/api/v1/summary').then(r => r.json()),
          fetch('/api/v1/districts').then(r => r.json()),
          fetch('/api/v1/wards').then(r => r.json()),
          fetch('/api/v1/odisha-geojson').then(r => r.json()),
          fetch('/api/v1/live-feed').then(r => r.json()),
        ]);

        setSummary(sumRes);
        if (distRes.districts) setDistricts(distRes.districts);
        if (wardRes.wards) setWards(wardRes.wards);
        setGeoJson(geoRes);
        setTelemetry(teleRes);
      } catch (err) {
        console.error('Failed to load initial application state:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();

    // Live Telemetry Polling (every 15s)
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/live-feed');
        const data = await res.json();
        setTelemetry(data);
      } catch (e) {
        // silent fallback
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenDispatcher = (region: string, customMessage?: string) => {
    setDispatchTarget(region);
    if (customMessage) setDispatchMessage(customMessage);
    setIsDispatcherOpen(true);
  };

  const handleExportSitRep = () => {
    const sitrep = {
      report_title: 'SENTINELX ODISHA HEATWAVE SITUATION REPORT (SITREP)',
      timestamp: new Date().toISOString(),
      active_alert_level: telemetry?.telemetry.active_alert_level || 'ORANGE',
      peak_district: telemetry?.telemetry.peak_district || 'Khordha',
      peak_wbgt_celsius: telemetry?.telemetry.peak_wbgt_statewide || 32.4,
      total_districts_monitored: 30,
      total_wards_monitored: 67,
      odisha_statewide: summary?.odisha_statewide,
      bhubaneswar_urban_core: summary?.bhubaneswar_urban_core,
      statewide_districts: districts.map(d => ({
        district: d.district,
        wbgt_celsius: d.WBGT_celsius,
        risk_tier: d.RiskTier,
        population: d.population_2011_est,
      })),
    };

    const blob = new Blob([JSON.stringify(sitrep, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SentinelX_SitRep_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telemetry={telemetry}
        onOpenCopilot={() => setActiveTab('copilot')}
        onOpenDispatcher={() => handleOpenDispatcher('Khordha')}
        onExportSitRep={handleExportSitRep}
      />

      {/* Main View Container */}
      <main className="flex-1 flex overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-slate-400">Booting SentinelX Telemetry &amp; Spatial Models...</p>
          </div>
        ) : (
          <>
            {activeTab === 'odisha' && (
              <OdishaMap
                districts={districts}
                geoJson={geoJson}
                onSelectDistrict={(d) => {}}
                onDispatchAlert={(distName) => handleOpenDispatcher(distName)}
              />
            )}

            {activeTab === 'wards' && (
              <WardView
                wards={wards}
                onDispatchAlert={(wardNo) => handleOpenDispatcher(wardNo)}
              />
            )}

            {activeTab === 'hospital' && (
              <HospitalSurgeView summary={summary} />
            )}

            {activeTab === 'htherm' && (
              <HThermCalculator />
            )}

            {activeTab === 'copilot' && (
              <AICopilotModal
                onDispatchAlert={(text, region) => handleOpenDispatcher(region, text)}
              />
            )}

            {activeTab === 'benchmarks' && (
              <BenchmarksView />
            )}

            {activeTab === 'api' && (
              <ApiExplorer />
            )}
          </>
        )}
      </main>

      {/* Emergency Dispatch Dialog */}
      <AlertDispatchModal
        isOpen={isDispatcherOpen}
        onClose={() => setIsDispatcherOpen(false)}
        initialRegion={dispatchTarget}
        initialMessage={dispatchMessage}
      />
    </div>
  );
}

export default App;
