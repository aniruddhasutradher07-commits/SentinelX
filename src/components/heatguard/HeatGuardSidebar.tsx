import React from 'react';
import { Home, Map, TrendingUp, BrainCircuit, Users, ShieldAlert, Database, FileText, Sun } from 'lucide-react';

interface HeatGuardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNavigateTab: (tab: string) => void;
}

export default function HeatGuardSidebar({ activeTab, onTabChange, onNavigateTab }: HeatGuardSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, action: () => onTabChange('dashboard') },
    { id: 'risk-map', label: 'Risk Map', icon: Map, action: () => onNavigateTab('odisha') },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp, action: () => onNavigateTab('simulator') },
    { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit, action: () => onNavigateTab('copilot') },
    { id: 'vulnerability', label: 'Vulnerability', icon: Users, action: () => onNavigateTab('wards') },
    { id: 'action-center', label: 'Action Center', icon: ShieldAlert, action: () => onNavigateTab('command') },
    { id: 'data', label: 'Data & Sources', icon: Database, action: () => onNavigateTab('api') },
    { id: 'reports', label: 'Reports', icon: FileText, action: () => onNavigateTab('benchmarks') },
  ];

  return (
    <div className="w-[230px] h-full flex flex-col bg-[#1A2639] text-slate-300 shadow-xl z-20 shrink-0">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-700/50 flex flex-col">
        <div className="flex items-center gap-2 text-white font-bold text-xl mb-1">
          <Sun className="w-6 h-6 text-orange-500" />
          HeatGuardAI
        </div>
        <p className="text-[11px] text-slate-400 font-medium">Detect Risk. Protect People.<br/>Build Resilient Communities.</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                : 'hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-sky-400' : 'text-slate-400'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer Status */}
      <div className="p-5 border-t border-slate-700/50 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-slate-400 font-medium">All systems operational</span>
        </div>
        <div className="mt-4 flex items-end justify-between opacity-50 pointer-events-none">
           <div className="text-[10px]">
             Safer People<br/>Cooler Tomorrows
           </div>
           <Sun className="w-6 h-6 text-slate-600" />
        </div>
      </div>

    </div>
  );
}
