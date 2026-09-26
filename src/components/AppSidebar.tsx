import React, { useState } from 'react';
import {
  ShieldAlert,
  MapPin,
  Building2,
  HardHat,
  GraduationCap,
  LifeBuoy,
  Calculator,
  History,
  Sparkles,
  Activity,
  Database,
  Bot,
  Users,
  ChevronDown,
  ChevronRight,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../utils/cn';

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavGroup {
  label: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'COMMAND',
    items: [
      { id: 'command', label: 'Command Center', icon: ShieldAlert },
      { id: 'odisha', label: 'Odisha Statewide', icon: MapPin },
      { id: 'wards', label: 'Bhubaneswar Core', icon: Building2 },
    ],
  },
  {
    label: 'SAFETY & ACTION',
    items: [
      { id: 'worker_safety', label: 'Worker Safety', icon: HardHat },
      { id: 'school_safety', label: 'School Safety', icon: GraduationCap },
      { id: 'resource_allocation', label: 'Resource Allocation', icon: LifeBuoy },
      { id: 'simulator', label: 'What-If Simulator', icon: Calculator },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { id: 'historical_replay', label: 'Historical Replay', icon: History, badge: '1998–2019' },
      { id: 'htherm', label: 'H-THERM Calculator', icon: Sparkles },
      { id: 'hospital', label: 'Hospital Surge ML', icon: Activity, badge: 'EXPERIMENTAL' },
      { id: 'benchmarks', label: 'NDMA Validation', icon: Database },
    ],
  },
  {
    label: 'ASSISTANCE',
    items: [
      { id: 'copilot', label: 'AI Copilot', icon: Bot },
    ],
  },
  {
    label: 'CITIZEN',
    items: [
      { id: 'citizen', label: 'Citizen Advisory', icon: Users },
    ],
  },
];

export default function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <aside
      aria-label="App Navigation"
      className={cn(
        'h-full border-r border-white/5 bg-[#030612] flex flex-col shrink-0 transition-all duration-300',
        isOpen ? 'w-60' : 'w-[52px]'
      )}
    >
      {/* Brand header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0" />
          {isOpen && (
            <span className="font-bold text-sm text-white tracking-wider whitespace-nowrap truncate">
              SentinelX
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-500 hover:text-cyan-400 transition-colors p-1 rounded focus:outline-none"
          aria-label={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation groups */}
      <div className="flex-1 overflow-y-auto py-3 px-1.5 custom-scrollbar space-y-1">
        {NAV_GROUPS.map((group) => {
          const isCollapsed = !!collapsedGroups[group.label];
          const hasActiveItem = group.items.some((item) => item.id === activeTab);

          return (
            <div key={group.label} className="mb-1">
              {/* Group header */}
              {isOpen && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold tracking-[0.12em] uppercase rounded transition-colors',
                    hasActiveItem
                      ? 'text-cyan-400/80'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                  aria-expanded={!isCollapsed}
                >
                  <span>{group.label}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  ) : (
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  )}
                </button>
              )}

              {/* Group items */}
              {(!isCollapsed || !isOpen) && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={isOpen ? undefined : item.label}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] font-medium rounded-md transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                          isOpen ? 'justify-start' : 'justify-center',
                          isActive
                            ? 'bg-cyan-500/12 text-cyan-400 border border-cyan-500/25 shadow-[0_0_8px_rgba(0,242,254,0.08)]'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0',
                            isActive ? 'text-cyan-400' : 'text-slate-500'
                          )}
                        />
                        {isOpen && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {isOpen && item.badge && (
                          <span
                            className={cn(
                              'ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full whitespace-nowrap',
                              isActive
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/25'
                                : 'bg-white/5 text-slate-500 border border-white/5'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      {isOpen && (
        <div className="border-t border-white/5 px-3 py-2.5 text-[10px] font-mono text-slate-600 leading-relaxed">
          SIH 2026-083 • OSDMA / NDMA
        </div>
      )}
    </aside>
  );
}
