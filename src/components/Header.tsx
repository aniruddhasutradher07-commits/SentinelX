import React from 'react';

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  telemetry?: any;
  onOpenCopilot?: () => void;
  onOpenDispatcher?: () => void;
  onExportSitRep?: () => void;
  realtimeStatus?: {
    connected: boolean;
    status: 'connected' | 'reconnecting' | 'disconnected';
    channelType: string;
  };
  onSimulateSensorPulse?: () => void;
  isSimulatingPulse?: boolean;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-[#030612]/95 border-b border-white/10 backdrop-blur-xl px-5 py-2.5 flex items-center justify-between gap-4 shrink-0 z-30 shadow-lg">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3.5">
        <div className="relative group">
          <img 
            src="/heatguard-logo.png" 
            alt="HeatGuard AI Logo" 
            className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-transform group-hover:scale-105" 
          />
          <div 
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#030612] shadow-sm animate-pulse" 
            title="System Status: Online" 
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-wide text-white font-tech leading-tight">
              HeatGuard<span className="bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">AI</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold tracking-wider">
              SYSTEM STATUS: ONLINE
            </span>
          </div>
          <span className="text-xs text-slate-400 tracking-wide font-medium">
            Predict Heat. Protect People.
          </span>
        </div>
      </div>

      {/* Sleek status indicator */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs font-mono text-slate-300 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span>LIVE ENVIRONMENTAL MONITORING</span>
        </div>
      </div>
    </header>
  );
};
