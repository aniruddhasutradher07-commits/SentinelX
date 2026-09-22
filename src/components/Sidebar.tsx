import React, { useState } from "react";
import {
  LayoutDashboard,
  Activity,
  BarChart2,
  Sliders,
  Users,
  ShieldAlert,
  HelpCircle,
  Settings,
  Menu,
  ChevronLeft
} from "lucide-react";
import { TabNav } from "./ui/TabNav";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

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
      className={`h-full border-r border-white/5 bg-[#030612] flex flex-col transition-all duration-300 shrink-0 ${isOpen ? 'w-64' : 'w-16'}`}
    >
      {/* Brand area inside sidebar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-3 md:px-4">
        <div className="flex items-center">
          <ShieldAlert className="w-6 h-6 text-cyan-400 shrink-0" />
          {isOpen && (
            <span className="font-tech font-bold text-white tracking-wide ml-3 whitespace-nowrap">
              Command Center
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-cyan-400 focus:outline-none transition-colors"
          aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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
          showLabels={isOpen}
          tabClassName={isOpen ? '' : 'justify-center px-0'}
        />
      </div>

    </aside>
  );
}
