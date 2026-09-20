import React from 'react';
import { cn } from '../../utils/cn';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4', className)}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-tech text-white tracking-wide uppercase">
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2 self-start sm:self-auto">{action}</div>}
    </div>
  );
}
