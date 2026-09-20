import React from 'react';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-4 gap-2 text-cyan-400', className)} role="status">
      <Loader2 className={cn('animate-spin text-cyan-400', sizeMap[size])} />
      {label && <span className="text-xs text-slate-400 font-mono tracking-wide">{label}</span>}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No Data Available',
  description = 'There are currently no records to display.',
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('glass-panel-sub p-8 rounded-xl flex flex-col items-center justify-center text-center border border-white/5', className)}>
      <div className="p-3 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400 mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-sm font-bold text-slate-200 uppercase font-tech tracking-wide">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with SentinelX engine.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('glass-panel p-6 rounded-xl border border-rose-500/30 bg-rose-950/10 flex flex-col items-center justify-center text-center', className)} role="alert">
      <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-rose-200 uppercase font-tech tracking-wide">{title}</h4>
      <p className="text-xs text-rose-300/80 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
        >
          Retry Request
        </button>
      )}
    </div>
  );
}
