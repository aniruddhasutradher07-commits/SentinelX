import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

export interface TabNavProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'pills' | 'underline' | 'glass';
  className?: string;
  tabClassName?: string;
  ariaLabel?: string;
  showLabels?: boolean;
}

export function TabNav<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  orientation = 'horizontal',
  variant = 'glass',
  className,
  tabClassName,
  ariaLabel = 'Navigation Tabs',
  showLabels = true,
}: TabNavProps<T>) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <nav
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className={cn(
        'flex gap-2',
        isHorizontal ? 'flex-row overflow-x-auto custom-scrollbar' : 'flex-col w-full',
        variant === 'glass' && 'p-1.5 rounded-xl glass-panel-sub border border-white/5',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(tab.id);
              }
            }}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-all duration-200 rounded-lg select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
              isHorizontal ? 'whitespace-nowrap' : 'w-full justify-start',
              isActive
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,242,254,0.15)] font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent',
              tabClassName
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-cyan-400' : 'text-slate-400')} />}
            {showLabels && <span className="truncate">{tab.label}</span>}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-semibold rounded-full font-mono',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'bg-white/10 text-slate-300',
                  tab.badgeColor
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
