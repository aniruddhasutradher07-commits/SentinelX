import React from 'react';
import { 
  ShieldAlert, 
  Radio, 
  Bot, 
  Send, 
  Download, 
  MapPin, 
  Building2, 
  Activity, 
  Calculator, 
  Sparkles, 
  Database, 
  Code,
  Zap,
  Users,
  Cpu,
  HardHat,
  GraduationCap,
  LifeBuoy,
  History
} from 'lucide-react';
import { LiveTelemetry } from '../types';
import { TabNav } from './ui/TabNav';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telemetry: LiveTelemetry | null;
  onOpenCopilot: () => void;
  onOpenDispatcher: () => void;
  onExportSitRep: () => void;
  realtimeStatus?: {
    connected: boolean;
    status: 'connected' | 'reconnecting' | 'disconnected';
    channelType: string;
  };
  onSimulateSensorPulse?: () => void;
  isSimulatingPulse?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetry,
  onOpenCopilot,
  onOpenDispatcher,
  onExportSitRep,
  realtimeStatus,
  onSimulateSensorPulse,
  isSimulatingPulse,
}) => {
  const tabs = [
    { id: 'command', label: 'Command Center', icon: ShieldAlert, badge: 'Stitch/Figma' },
    { id: 'odisha', label: 'Odisha Statewide', icon: MapPin, badge: 'Overview 3.1' },
    { id: 'wards', label: 'Bhubaneswar Core', icon: Building2, badge: 'Operations 3.2' },
    { id: 'citizen', label: 'Citizen Advisory', icon: Users, badge: 'Public 3.4' },
    { id: 'simulator', label: 'What-If Simulator', icon: Calculator, badge: 'Planning 3.5' },
    { id: 'worker_safety', label: 'Worker Safety', icon: HardHat, badge: 'Occupational' },
    { id: 'school_safety', label: 'School Safety', icon: GraduationCap, badge: 'Pediatric' },
    { id: 'resource_allocation', label: 'Resource Allocation', icon: LifeBuoy, badge: 'Spatial AI' },
    { id: 'historical_replay', label: 'Historical Replay', icon: History, badge: '1998-2019' },
    { id: 'hospital', label: 'Hospital Surge ML', icon: Activity, badge: 'DLNM + XGB' },
    { id: 'htherm', label: 'H-THERM Calc', icon: Sparkles, badge: 'Physiology' },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, badge: 'Gemini' },
    { id: 'benchmarks', label: 'NDMA Validation', icon: Database, badge: '1998-2024' },
    { id: 'validation', label: 'Model Validation', icon: Cpu, badge: 'Audit ML' },
    { id: 'api', label: 'API Explorer', icon: Code, badge: 'REST' },
  ];

  return (
    <header className="bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-4 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0 z-30">
      {/* Brand & Live Pulse */}
      <div className="flex items-center justify-between w-full lg:w-auto gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-amber-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base tracking-tight text-white">SentinelX</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-semibold">
                SIH26083
              </span>
              <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                MoES / NCMRWF
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Human Thermal Stress &amp; Hospital Surge Early Warning
            </p>
          </div>
        </div>

        {/* Live Telemetry Pill & CDC Realtime Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
            <span className="text-emerald-400 text-[11px] font-semibold">LIVE</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 text-[11px]">
              {telemetry?.telemetry.peak_district || 'Khordha'}: {telemetry?.telemetry.peak_wbgt_statewide || 32.4}°C WBGT
            </span>
          </div>

          {/* Realtime CDC Postgres / SSE status badge */}
          <div 
            className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono border transition-all ${
              realtimeStatus?.connected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
            title={realtimeStatus?.channelType || 'Realtime Postgres CDC / SSE Active'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${realtimeStatus?.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="font-semibold tracking-wider">
              {realtimeStatus?.connected ? 'CDC REALTIME' : 'CDC SYNC'}
            </span>
          </div>

          <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            telemetry?.telemetry.active_alert_level === 'RED'
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}>
            {telemetry?.telemetry.active_alert_level || 'ORANGE'} ALERT
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <TabNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        orientation="horizontal"
        variant="glass"
        ariaLabel="Main Dashboard Views"
        className="max-w-full"
      />

      {/* Quick Trigger Action Buttons */}
      <div className="flex items-center gap-2">
        {onSimulateSensorPulse && (
          <button
            id="btn-simulate-pulse"
            onClick={onSimulateSensorPulse}
            disabled={isSimulatingPulse}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 active:scale-95 transition text-xs font-semibold shadow-sm shadow-emerald-500/10 disabled:opacity-50"
            title="Simulate Realtime Ingestion of Ward IoT / AWS Telemetry (Triggers Live CDC Refresh for SIH Jury Demo)"
          >
            <Zap className={`w-3.5 h-3.5 text-emerald-400 ${isSimulatingPulse ? 'animate-spin' : 'animate-pulse'}`} />
            <span className="hidden sm:inline">⚡ Ingest Sensor Pulse</span>
            <span className="text-[9px] px-1 py-0.5 bg-emerald-500/30 rounded font-mono uppercase text-emerald-200">SIH Demo</span>
          </button>
        )}

        <button
          id="btn-quick-copilot"
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition text-xs font-medium"
          title="Open AI Incident Commander"
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Ask AI Copilot</span>
        </button>

        <button
          id="btn-quick-dispatch"
          onClick={onOpenDispatcher}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition text-xs font-medium"
          title="Dispatch SMS/IVRS Advisory"
        >
          <Send className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Dispatch Alert</span>
        </button>

        <button
          id="btn-quick-sitrep"
          onClick={onExportSitRep}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition text-xs font-medium"
          title="Export State Heatwave Situation Report"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">SitRep</span>
        </button>
      </div>
    </header>
  );
};
