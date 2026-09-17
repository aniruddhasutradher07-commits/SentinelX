import React from "react";
import {
  LayoutDashboard,
  Activity,
  BarChart2,
  Sliders,
  Users,
  ShieldAlert,
  Settings,
  HelpCircle,
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "biotech", label: "Biotech & Physiology", icon: Activity },
    { id: "analytics", label: "Advanced Analytics", icon: BarChart2 },
    { id: "command", label: "Command & Control", icon: Sliders },
    { id: "demographics", label: "Population Demographics", icon: Users },
  ];

  return (
    <div className="w-16 md:w-64 h-full border-r border-white/5 bg-[#030612] flex flex-col transition-all duration-300">
      {/* Brand area inside sidebar (optional if already in top header) */}
      <div className="h-14 border-b border-white/5 flex items-center justify-center md:justify-start md:px-5">
        <ShieldAlert className="w-6 h-6 text-brand-cyan md:mr-3 shrink-0" />
        <span className="font-tech font-bold text-white hidden md:block tracking-wide">Command Center</span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1.5 custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-mono text-xs ${
                isActive
                  ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 shadow-[0_0_10px_-2px_rgba(0,242,254,0.3)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-cyan' : 'text-slate-500'}`} />
              <span className="hidden md:block font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="p-2 border-t border-white/5 space-y-1.5">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition font-mono text-xs">
          <HelpCircle className="w-4 h-4 shrink-0 text-slate-500" />
          <span className="hidden md:block">Documentation</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition font-mono text-xs">
          <Settings className="w-4 h-4 shrink-0 text-slate-500" />
          <span className="hidden md:block">Settings</span>
        </button>
      </div>
    </div>
  );
}
