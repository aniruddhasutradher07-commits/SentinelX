import React from "react";
import {
  LayoutDashboard,
  Activity,
  BarChart2,
  Sliders,
  Users,
  ShieldAlert,
  HelpCircle,
  Settings,
} from "lucide-react";
import { TabNav } from "./ui/TabNav";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "biotech", label: "Biotech & Physiology", icon: Activity },
    { id: "analytics", label: "Advanced Analytics", icon: BarChart2 },
    { id: "command", label: "Command & Control", icon: Sliders },
    { id: "demographics", label: "Population Demographics", icon: Users },
  ];

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="w-16 md:w-64 h-full border-r border-white/5 bg-[#030612] flex flex-col transition-all duration-300 shrink-0"
    >
      {/* Brand area inside sidebar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-center md:justify-start md:px-5">
        <ShieldAlert className="w-6 h-6 text-cyan-400 md:mr-3 shrink-0" />
        <span className="font-tech font-bold text-white hidden md:block tracking-wide">
          Command Center
        </span>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          orientation="vertical"
          variant="glass"
          ariaLabel="Sidebar Menu"
        />
      </div>

      {/* Bottom Menu */}
      <div className="p-2 border-t border-white/5 space-y-1.5">
        <button
          type="button"
          aria-label="Open Documentation"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <HelpCircle className="w-4 h-4 shrink-0 text-slate-500" />
          <span className="hidden md:block">Documentation</span>
        </button>
        <button
          type="button"
          aria-label="Open Settings"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-500" />
          <span className="hidden md:block">Settings</span>
        </button>
      </div>
    </aside>
  );
}
