import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { OdishaMap } from './components/OdishaMap';
import { WardView } from './components/WardView';
import { HospitalSurgeView } from './components/HospitalSurgeView';
import { HThermCalculator } from './components/HThermCalculator';
import { AICopilotModal } from './components/AICopilotModal';
import { BenchmarksView } from './components/BenchmarksView';
import { ModelValidationView } from './components/ModelValidationView';
import { ApiExplorer } from './components/ApiExplorer';
import { CitizenAdvisoryView } from './components/CitizenAdvisoryView';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import WorkerSafetyTab from './components/tabs/WorkerSafetyTab';
import SchoolSafetyTab from './components/tabs/SchoolSafetyTab';
import ResourceAllocationTab from './components/tabs/ResourceAllocationTab';
import HistoricalReplayTab from './components/tabs/HistoricalReplayTab';
import { AlertDispatchModal } from './components/AlertDispatchModal';
// @ts-ignore
import Dashboard from './pages/Dashboard';
import { Zap, X, AlertCircle } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Landing from './pages/Landing';
import { subscribeToWardRiskUpdates } from './services/supabaseClient';
import { 
  SystemSummary, 
  DistrictRiskRecord, 
  WardRiskRecord, 
  LiveTelemetry 
} from './types';
import { getApiUrl, fetchWithColdStart } from './services/apiConfig';



function CommandCenter() {
  const [activeTab, setActiveTab] = useState<string>('command');
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [districts, setDistricts] = useState<DistrictRiskRecord[]>([]);
  const [wards, setWards] = useState<WardRiskRecord[]>([]);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [wardGeoJson, setWardGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCloudWakingUp, setIsCloudWakingUp] = useState<boolean>(false);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState<boolean>(false);
  const isFallbackRef = React.useRef(false);

  // Realtime CDC State
  const [realtimeStatus, setRealtimeStatus] = useState<{
    connected: boolean;
    status: 'connected' | 'reconnecting' | 'disconnected';
    channelType: string;
  }>({
    connected: false,
    status: 'reconnecting',
    channelType: 'Connecting to Realtime stream...',
  });
  const [isSimulatingPulse, setIsSimulatingPulse] = useState<boolean>(false);
  const [realtimeToast, setRealtimeToast] = useState<{
    message: string;
    subtext?: string;
    timestamp: string;
    wardNo?: string;
  } | null>(null);

  // Modals state
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState<boolean>(false);
  const [dispatchTarget, setDispatchTarget] = useState<string>('Khordha');
  const [dispatchMessage, setDispatchMessage] = useState<string>('');

  // Initial Data Fetching with Cold-Start Resilience
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          fetchWithColdStart('/api/v1/summary', { onColdStart: setIsCloudWakingUp }).then(r => r.json()),
          fetchWithColdStart('/api/v1/districts').then(r => r.json()),
          fetchWithColdStart('/api/v1/wards').then(r => r.json()),
          fetchWithColdStart('/api/v1/odisha-geojson').then(r => r.json()),
          fetchWithColdStart('/api/v1/wards-geojson').then(r => r.json()),
          fetchWithColdStart('/api/v1/live-feed').then(r => r.json()),
        ]);

        const sumRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const distRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const wardRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const geoRes = results[3].status === 'fulfilled' ? results[3].value : null;
        const wardGeoRes = results[4].status === 'fulfilled' ? results[4].value : null;
        const teleRes = results[5].status === 'fulfilled' ? results[5].value : null;

        const hasLiveDistricts = distRes?.districts && distRes.districts.length > 0;
        const hasLiveWards = wardRes?.wards && wardRes.wards.length > 0;
        
        const useFallback = !hasLiveDistricts || !hasLiveWards;
        setIsUsingFallbackData(useFallback);
        isFallbackRef.current = useFallback;

        if (sumRes) setSummary(sumRes);
        setDistricts(hasLiveDistricts ? distRes.districts : []);
        setWards(hasLiveWards ? wardRes.wards : []);
        if (geoRes) setGeoJson(geoRes);
        if (wardGeoRes) setWardGeoJson(wardGeoRes);
        if (teleRes) setTelemetry(teleRes);
      } catch (err) {
        console.error('Failed to load initial application state:', err);
        setDistricts([]);
        setWards([]);
        setIsUsingFallbackData(true);
        isFallbackRef.current = true;
      } finally {
        setLoading(false);
        setIsCloudWakingUp(false);
      }
    }

    loadInitialData();

    // Live Telemetry Polling (every 15s)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(getApiUrl('/api/v1/live-feed'));
        const data = await res.json();
        setTelemetry(data);

        // Attempt recovery if we were stuck on fallback data
        if (isFallbackRef.current) {
          try {
            const [dRes, wRes] = await Promise.all([
              fetch(getApiUrl('/api/v1/districts')).then(r => r.json()),
              fetch(getApiUrl('/api/v1/wards')).then(r => r.json())
            ]);
            if (dRes?.districts?.length > 0 && wRes?.wards?.length > 0) {
              setDistricts(dRes.districts);
              setWards(wRes.wards);
              setIsUsingFallbackData(false);
              isFallbackRef.current = false;
            }
          } catch(e) {
            // still failing
          }
        }
      } catch (e) {
        // silent fallback
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Supabase Realtime CDC Listener (with Fallback to Local SSE Stream)
  useEffect(() => {
    const unsubscribe = subscribeToWardRiskUpdates(
      (event) => {
        const record = event.record;
        if (!record) return;

        const wardNo = record.ward_no;
        if (!wardNo) return;

        // 1. Instantly update wards list in state without page reload
        setWards((prevWards) => {
          const idx = prevWards.findIndex(
            (w) => String(w.ward_no).toUpperCase() === String(wardNo).toUpperCase()
          );
          if (idx >= 0) {
            const updated = [...prevWards];
            updated[idx] = { ...updated[idx], ...record };
            return updated;
          } else {
            return [record, ...prevWards];
          }
        });

        // 2. Trigger Floating Live CDC Alert Banner
        const wbgtVal = record.WBGT_celsius ?? record.wbgt ?? 32.5;
        const riskScore = record.WardRiskScore ?? record.risk_score ?? 75;
        const tier = record.RiskTier ?? (riskScore >= 85 ? 'Red' : (riskScore >= 70 ? 'Orange' : 'Yellow'));
        const multiplier = record.vulnerability_multiplier ? ` · M_v: ${record.vulnerability_multiplier}` : '';

        setRealtimeToast({
          message: `⚡ [REALTIME CDC] Ward ${wardNo} Telemetry Ingested`,
          subtext: `WBGT: ${wbgtVal}°C · Risk Index: ${riskScore} (${tier} Alert)${multiplier}`,
          timestamp: new Date().toLocaleTimeString(),
          wardNo: String(wardNo),
        });

        // Auto-dismiss toast after 6 seconds
        setTimeout(() => {
          setRealtimeToast((curr) => (curr?.wardNo === String(wardNo) ? null : curr));
        }, 6000);
      },
      (status, channelType) => {
        setRealtimeStatus({
          connected: status === 'connected',
          status,
          channelType,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Simulated IoT / AWS Sensor Ingestion for SIH Jury Demo
  const handleSimulatePulse = async () => {
    try {
      setIsSimulatingPulse(true);
      const demoWards = ['W21', 'W04', 'W12', 'W35', 'W42', 'W58', 'W15', 'W09'];
      const targetWard = demoWards[Math.floor(Math.random() * demoWards.length)];
      await fetch(getApiUrl(`/api/v1/realtime/simulate-update?ward_no=${targetWard}`), {
        method: 'POST',
      });
    } catch (err) {
      console.error('Pulse simulation error:', err);
    } finally {
      setTimeout(() => setIsSimulatingPulse(false), 600);
    }
  };

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
        realtimeStatus={realtimeStatus}
        onSimulateSensorPulse={handleSimulatePulse}
        isSimulatingPulse={isSimulatingPulse}
      />

      {/* Fallback Data Warning Banner */}
      {isUsingFallbackData && (
        <div className="bg-amber-950/80 border-b border-amber-500/50 px-4 py-2 flex justify-center items-center gap-3 z-40 relative shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-amber-200 text-xs font-mono">
            Reconnecting to live backend — showing cached reference data
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-900/60 text-amber-300 uppercase tracking-widest font-semibold shadow-sm">
            [SYNTHETIC]
          </span>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 flex overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 px-4 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-slate-400">Booting SentinelX Telemetry &amp; Spatial Models...</p>
            {isCloudWakingUp && (
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-sky-950/80 border border-sky-500/30 text-[11px] font-mono text-sky-300 animate-pulse max-w-md">
                ☁️ Connecting to live Render cloud backend (https://sentinelx-pi9j.onrender.com)... Initial spin-up may take ~30s on free instance.
              </div>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'command' && (
              <Dashboard
                districts={districts}
                wards={wards}
                telemetry={telemetry}
                summary={summary}
                onOpenDispatcher={(region: string) => handleOpenDispatcher(region)}
                onNavigateTab={(tab: string) => setActiveTab(tab)}
                realtimeStatus={realtimeStatus}
              />
            )}

            {activeTab === 'odisha' && (
              <OdishaMap
                districts={districts}
                geoJson={geoJson}
                wardData={wards}
                wardGeoJson={wardGeoJson}
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

            {activeTab === 'citizen' && (
              <CitizenAdvisoryView
                wards={wards}
                onBackToOperations={() => setActiveTab('wards')}
              />
            )}

            {activeTab === 'simulator' && (
              <WhatIfSimulator
                wards={wards}
              />
            )}

            {activeTab === 'worker_safety' && (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#0B0D0E]">
                <WorkerSafetyTab wards={wards} />
              </div>
            )}

            {activeTab === 'school_safety' && (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#0B0D0E]">
                <SchoolSafetyTab wards={wards} />
              </div>
            )}

            {activeTab === 'resource_allocation' && (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#0B0D0E]">
                <ResourceAllocationTab />
              </div>
            )}

            {activeTab === 'historical_replay' && (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#0B0D0E]">
                <HistoricalReplayTab />
              </div>
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

            {activeTab === 'validation' && (
              <ModelValidationView />
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

      {/* Floating Realtime CDC Telemetry Ingestion Banner */}
      {realtimeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900/95 border border-emerald-500/50 rounded-xl p-3.5 shadow-2xl shadow-emerald-950/70 backdrop-blur-md transition-all animate-bounce-short">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-emerald-300 font-mono">
                  {realtimeToast.message}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {realtimeToast.timestamp}
                </span>
              </div>
              {realtimeToast.subtext && (
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-snug">
                  {realtimeToast.subtext}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Postgres CDC synchronized live dashboard</span>
              </div>
            </div>
            <button
              onClick={() => setRealtimeToast(null)}
              className="text-slate-400 hover:text-slate-200 text-xs p-0.5 rounded hover:bg-slate-800"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CommandCenter />} />
        <Route path="/landing" element={<Landing />} />
      </Routes>
    </Router>
  );
}
