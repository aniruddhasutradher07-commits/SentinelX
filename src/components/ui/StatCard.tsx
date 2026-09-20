import React from 'react';
import { cn } from '../../utils/cn';
import { getTierColor } from '../../utils/riskTier';
import { RiskTier } from '../../types';

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string | number;
    direction?: 'up' | 'down' | 'neutral';
    label?: string;
  };
  tier?: RiskTier;
  className?: string;
  valueClassName?: string;
  children?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  tier,
  className,
  valueClassName,
  children,
}: StatCardProps) {
  const tierStyle = tier ? getTierColor(tier) : null;

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'glass-panel p-4 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between',
        tierStyle ? tierStyle.border : 'border-white/10 hover:border-white/20',
        className
      )}
    >
      {/* Risk Tier subtle background highlight */}
      {tierStyle && (
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none blur-2xl opacity-10 -mr-10 -mt-10"
          style={{ backgroundColor: tierStyle.hex }}
        />
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-tech">
            {title}
          </span>
          {Icon && (
            <div
              className={cn(
                'p-1.5 rounded-lg border bg-white/5',
                tierStyle ? tierStyle.border : 'border-white/10'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4',
                  tierStyle ? tierStyle.text : 'text-cyan-400'
                )}
              />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 my-1">
          <span
            className={cn(
              'text-2xl font-bold font-mono text-white tracking-tight',
              valueClassName
            )}
          >
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-slate-400 font-mono">
              {unit}
            </span>
          )}
        </div>
      </div>

      {(subtitle || trend || children) && (
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400 text-[11px]">{subtitle}</span>}
          
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-mono font-medium text-[11px]',
                trend.direction === 'up' && 'text-emerald-400',
                trend.direction === 'down' && 'text-rose-400',
                trend.direction === 'neutral' && 'text-slate-400'
              )}
            >
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.value} {trend.label}
            </span>
          )}

          {children}
        </div>
      )}
    </div>
  );
}
