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
  Code 
} from 'lucide-react';
import { LiveTelemetry } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telemetry: LiveTelemetry | null;
  onOpenCopilot: () => void;
  onOpenDispatcher: () => void;
  onExportSitRep: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetry,
  onOpenCopilot,
  onOpenDispatcher,
  onExportSitRep,
}) => {
  const tabs = [
    { id: 'odisha', label: 'Odisha Statewide', icon: MapPin, badge: '30 Districts' },
    { id: 'wards', label: 'Bhubaneswar Core', icon: Building2, badge: '67 Wards' },
    { id: 'hospital', label: 'Hospital Surge ML', icon: Activity, badge: 'DLNM + XGB' },
    { id: 'htherm', label: 'H-THERM Calc', icon: Calculator, badge: 'Physiology' },
    { id: 'copilot', label: 'AI Copilot & Alerts', icon: Sparkles, badge: 'Gemini AI' },
    { id: 'benchmarks', label: 'NDMA Validation', icon: Database, badge: '1998-2024' },
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

        {/* Live Telemetry Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
            <span className="text-emerald-400 text-[11px] font-semibold">LIVE</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 text-[11px]">
              {telemetry?.telemetry.peak_district || 'Khordha'}: {telemetry?.telemetry.peak_wbgt_statewide || 32.4}°C WBGT
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
      <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 lg:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-sm shadow-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Trigger Action Buttons */}
      <div className="flex items-center gap-2">
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
