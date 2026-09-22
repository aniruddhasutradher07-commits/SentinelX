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
    <article
      role="region"
      aria-label={title}
      className={cn(
        'p-3.5 rounded-lg bg-tactical-800/90 border border-tactical-border relative overflow-hidden flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="tracking-wide uppercase font-semibold">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              'w-7 h-7 rounded flex items-center justify-center',
              tierStyle ? `${tierStyle.border} ${tierStyle.bg} ${tierStyle.text}` : 'bg-tactical-950/40 border border-cyan-700/50 text-cyan-400'
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="my-2 flex items-baseline space-x-2">
        <span
          className={cn(
            'text-3xl lg:text-4xl font-mono font-bold text-white tracking-tight',
            valueClassName
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-lg font-mono text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {(subtitle || trend || children) && (
        <div className="pt-2 border-t border-tactical-border/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          {subtitle && <span>{subtitle}</span>}
          
          {trend && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded font-semibold border',
                trend.direction === 'up' && 'bg-red-950/50 text-red-300 border-red-800/40',
                trend.direction === 'down' && 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40',
                trend.direction === 'neutral' && 'bg-tactical-700/80 text-cyan-300 border-cyan-800/40'
              )}
            >
              {trend.direction === 'up' && '↑ '}
              {trend.direction === 'down' && '↓ '}
              {trend.value} {trend.label && trend.label}
            </span>
          )}

          {children}
        </div>
      )}
    </article>
  );
}
