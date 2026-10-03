import React from 'react';

export type ProvenanceType =
  | 'LIVE'
  | 'CALCULATED'
  | 'FORECAST'
  | 'EXPERIMENTAL'
  | 'STATIC REFERENCE'
  | 'CACHED'
  | 'UNAVAILABLE'
  | 'SIMULATED'
  | 'CREDENTIALS_NOT_CONFIGURED'
  | 'DEMO';

interface ProvenanceBadgeProps {
  type: ProvenanceType | string;
  className?: string;
  size?: 'xs' | 'sm';
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  type,
  className = '',
  size = 'xs'
}) => {
  const norm = (type || 'UNAVAILABLE').toUpperCase().trim();

  let text = norm;
  let style = 'bg-slate-800 text-slate-300 border-slate-600';
  let hasPulse = false;

  if (norm === 'LIVE') {
    text = 'LIVE';
    style = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    hasPulse = true;
  } else if (norm === 'CALCULATED') {
    text = 'CALCULATED';
    style = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
  } else if (norm === 'FORECAST') {
    text = 'FORECAST';
    style = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
  } else if (norm === 'EXPERIMENTAL' || norm.includes('EXPERIMENTAL')) {
    text = 'EXPERIMENTAL';
    style = 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-500/40';
  } else if (norm === 'STATIC REFERENCE' || norm.includes('STATIC')) {
    text = 'STATIC REFERENCE';
    style = 'bg-slate-900/80 text-slate-400 border-slate-700';
  } else if (norm === 'CACHED' || norm === 'STALE') {
    text = norm === 'STALE' ? 'STALE' : 'CACHED';
    style = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
  } else if (norm === 'SIMULATED' || norm.includes('SIMULAT')) {
    text = 'SIMULATED';
    style = 'bg-orange-950/60 text-orange-300 border-orange-500/40';
  } else if (norm === 'CREDENTIALS_NOT_CONFIGURED' || norm.includes('CREDENTIAL')) {
    text = 'CREDENTIALS_NOT_CONFIGURED';
    style = 'bg-amber-950/40 text-amber-400 border-amber-600/40';
  } else if (norm.includes('DEMO') || norm.includes('SYNTHETIC')) {
    text = 'DEMO / SYNTHETIC — NOT LIVE';
    style = 'bg-amber-950/60 text-amber-300 border-amber-500/50';
  } else if (norm === 'UNAVAILABLE' || norm.includes('UNAVAIL')) {
    text = 'UNAVAILABLE';
    style = 'bg-rose-950/60 text-rose-300 border-rose-500/40';
  }

  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase tracking-widest font-semibold rounded border whitespace-nowrap ${padding} ${style} ${className}`}
      title={`Data Provenance: ${text}`}
    >
      {hasPulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      )}
      [{text}]
    </span>
  );
};
