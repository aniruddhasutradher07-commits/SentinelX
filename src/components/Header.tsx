import React from 'react';
import { 
  ShieldAlert, 
  Bot, 
  Send, 
  Download, 
  Zap,
} from 'lucide-react';
import { LiveTelemetry } from '../types';

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

  return (
    <header className="bg-tactical-850/95 border-b border-tactical-border/80 backdrop-blur-md px-4 py-2 flex items-center justify-between gap-3 shrink-0 z-30">
      {/* Brand & Live Pulse */}
      <div className="flex items-center justify-between w-full lg:w-auto gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-slate-100">SentinelX</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 font-semibold">
                SIH26083
              </span>
              <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/40 text-amber-300">
                MoES / NCMRWF
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight hidden sm:block">
              Environmental Hazard Intelligence
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
            className={`hidden md:flex items-center space-x-1 px-2 py-1 rounded border transition-all ${
              realtimeStatus?.connected 
                ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300' 
                : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
            }`}
            title={realtimeStatus?.channelType || 'Realtime Postgres CDC / SSE Active'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${realtimeStatus?.connected ? 'bg-cyan-400 live-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] tracking-wide font-medium">
              {realtimeStatus?.connected ? 'CDC REALTIME' : 'CDC SYNC'}
            </span>
          </div>

          <div className={`flex items-center space-x-1 px-2 py-1 rounded border ${
            telemetry?.telemetry.active_alert_level === 'RED'
              ? 'bg-red-950/40 border-red-800/50 text-red-400'
              : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              telemetry?.telemetry.active_alert_level === 'RED' ? 'bg-red-400' : 'bg-amber-400'
            } live-pulse`}></span>
            <span className="text-[10px] font-bold tracking-wider uppercase">
              {telemetry?.telemetry.active_alert_level || 'ORANGE'} ALERT
            </span>
          </div>
        </div>
      </div>

      {/* Navigation moved to sidebar */}

      {/* Quick Trigger Action Buttons */}
      <div className="flex items-center space-x-2 font-mono text-[11px]">
        {onSimulateSensorPulse && (
          <button
            id="btn-simulate-pulse"
            onClick={onSimulateSensorPulse}
            disabled={isSimulatingPulse}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/40 transition disabled:opacity-50"
            title="Simulate Realtime Ingestion of Ward IoT / AWS Telemetry"
          >
            <Zap className={`w-3.5 h-3.5 text-emerald-400 ${isSimulatingPulse ? 'animate-spin' : ''}`} />
            <span className="font-medium">SIMULATION: Ingest Sensor Pulse</span>
          </button>
        )}

        <button
          id="btn-quick-copilot"
          onClick={onOpenCopilot}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-purple-950/50 border border-purple-600/40 text-purple-300 hover:bg-purple-900/40 transition"
          title="Open AI Incident Commander"
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span>Ask AI Copilot</span>
        </button>

        <button
          id="btn-quick-dispatch"
          onClick={onOpenDispatcher}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-semibold tracking-wide transition shadow-sm"
          title="Dispatch SMS/IVRS Advisory"
        >
          <Send className="w-3.5 h-3.5 text-black" />
          <span>Dispatch Alert</span>
        </button>

        <button
          id="btn-quick-sitrep"
          onClick={onExportSitRep}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-tactical-800 border border-slate-700 text-slate-300 hover:bg-tactical-700 transition"
          title="Export State Heatwave Situation Report"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>SitRep</span>
        </button>
      </div>
    </header>
  );
};
