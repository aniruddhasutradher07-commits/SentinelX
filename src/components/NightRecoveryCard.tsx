import React from 'react';
import { Moon, Thermometer, Droplets, Flame, AlertTriangle, CheckCircle } from 'lucide-react';

export interface NightRecoveryData {
  night_min_temp_c?: number;
  night_humidity_pct?: number;
  night_heat_index_c?: number;
  recovery_score?: number;      // 0-100 (100 = full cooling)
  failure_score?: number;       // 0-100 (100 = severe failure)
  risk_tier?: string;
  is_poor_recovery?: boolean;
  consecutive_poor_nights?: number;
  compounding_multiplier?: number;
  thermal_burden_score?: number;
  daytime_htsi?: number;
  provenance?: string;
}

export interface NightRecoveryCardProps {
  data?: NightRecoveryData;
  className?: string;
}

function RecoveryRing({ score }: { score: number }) {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f43f5e';

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        {/* Track */}
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        {/* Progress */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-mono font-bold text-white">{score}</span>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

export const NightRecoveryCard: React.FC<NightRecoveryCardProps> = ({ data, className }) => {
  const minTemp = data?.night_min_temp_c;
  const rh = data?.night_humidity_pct;
  const burdenScore = data?.thermal_burden_score;
  const recoveryScore = data?.recovery_score;
  const streak = data?.consecutive_poor_nights;
  const multiplier = data?.compounding_multiplier;
  const isPoor = data?.is_poor_recovery;

  // Derive status
  const hasMinTemp = minTemp !== undefined && !isNaN(minTemp);
  const hasRh = rh !== undefined && !isNaN(rh);
  const hasBurden = burdenScore !== undefined && !isNaN(burdenScore);
  const hasRecovery = recoveryScore !== undefined && !isNaN(recoveryScore);

  // Color for min temp
  const tempColor = !hasMinTemp ? 'text-slate-400' : minTemp >= 30 ? 'text-rose-400' : minTemp >= 26 ? 'text-amber-400' : 'text-emerald-400';
  const rhColor = !hasRh ? 'text-slate-400' : rh >= 85 ? 'text-amber-400' : 'text-cyan-400';

  return (
    <div className={`relative rounded-xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-indigo-950/30 to-slate-900/90 backdrop-blur-sm flex flex-col ${className || ''}`}>
      {/* Animated background shimmer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.08)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/20">
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Nighttime Recovery</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Nocturnal Cooling · 24h Thermal Burden</p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
          CALCULATED
        </span>
      </div>

      {/* Metric grid */}
      <div className="relative grid grid-cols-3 gap-3 px-5 py-4">
        {/* Night Min Temp */}
        <div className="flex flex-col gap-1 bg-slate-900/60 rounded-lg p-3 border border-slate-800/50">
          <div className="flex items-center gap-1 mb-1">
            <Thermometer className="w-3 h-3 text-indigo-400" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Night Min</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-mono font-bold tabular-nums ${tempColor}`}>
              {hasMinTemp ? minTemp.toFixed(1) : '—'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">°C</span>
          </div>
          {!hasMinTemp && (
            <span className="text-[9px] text-slate-600 font-mono mt-0.5">No data</span>
          )}
        </div>

        {/* Night Humidity */}
        <div className="flex flex-col gap-1 bg-slate-900/60 rounded-lg p-3 border border-slate-800/50">
          <div className="flex items-center gap-1 mb-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Humidity</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-mono font-bold tabular-nums ${rhColor}`}>
              {hasRh ? rh : '—'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">%</span>
          </div>
          {!hasRh && (
            <span className="text-[9px] text-slate-600 font-mono mt-0.5">No data</span>
          )}
        </div>

        {/* 24h Thermal Burden */}
        <div className="flex flex-col gap-1 bg-slate-900/60 rounded-lg p-3 border border-slate-800/50">
          <div className="flex items-center gap-1 mb-1">
            <Flame className="w-3 h-3 text-rose-400" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Burden</span> <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider bg-amber-500/20 px-1 rounded" style={{backgroundColor: '#ffbf00', opacity: 0.8}}>EXPERIMENTAL DERIVED INDICATOR</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-mono font-bold tabular-nums ${hasBurden ? (burdenScore! >= 70 ? 'text-rose-400' : burdenScore! >= 40 ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-400'}`}>
              {hasBurden ? burdenScore : '—'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">/100</span>
          </div>
          {!hasBurden && (
            <span className="text-[9px] text-slate-600 font-mono mt-0.5">No data</span>
          )}
        </div>
      </div>

      {/* Recovery Status Footer */}
      <div className="relative mt-auto px-5 pb-5">
        <div className="flex items-center gap-4 bg-slate-900/70 rounded-xl p-4 border border-slate-800/60">
          {hasRecovery ? (
            <RecoveryRing score={recoveryScore!} />
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-700/60 flex flex-col items-center justify-center">
              <Moon className="w-5 h-5 text-slate-600 mb-1" />
              <span className="text-[9px] text-slate-600 font-mono uppercase text-center leading-tight">No data</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recovery Status</span>
              {hasRecovery ? (
                recoveryScore! >= 60
                  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-950/40 text-amber-400 uppercase tracking-widest">EXPERIMENTAL</span>
              )}
            </div>

            {streak !== undefined ? (
              <div className="space-y-1">
                <p className="text-xs text-slate-300 font-mono">
                  {streak} consecutive poor night{streak !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Compounding ×{(multiplier || 1.0).toFixed(2)} penalty factor
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                Insufficient historical night data for validated recovery-streak calculation.
                {hasMinTemp && (
                  <span className="text-indigo-400"> Night temps available from Open-Meteo hourly.</span>
                )}
              </p>
            )}

            {isPoor && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-400 font-mono font-semibold">
                <AlertTriangle className="w-3 h-3" />
                POOR NOCTURNAL RECOVERY DETECTED
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
