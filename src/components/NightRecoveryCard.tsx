import React from 'react';
import { getTierColor } from '../utils/riskTier';

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

export const NightRecoveryCard: React.FC<NightRecoveryCardProps> = ({
  data,
  className,
}) => {
  const minTemp = data?.night_min_temp_c;
  const rh = data?.night_humidity_pct;
  const failureScore = data?.failure_score;
  const recoveryScore = data?.recovery_score;
  const tier = data?.risk_tier || (failureScore !== undefined ? (failureScore >= 70 ? 'Red' : failureScore >= 50 ? 'Orange' : failureScore >= 30 ? 'Yellow' : 'Green') : 'Neutral');
  const streak = data?.consecutive_poor_nights;
  const multiplier = data?.compounding_multiplier;
  const burdenScore = data?.thermal_burden_score;

  const tierStyle = getTierColor(tier);

  return (
    <div className={`glass-panel p-5 rounded-xl border border-slate-700/50 flex flex-col justify-between ${className || ''}`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
            NIGHTTIME RECOVERY
          </h2>
          <span className="text-xs text-slate-400 font-sans mt-1 block">
            Nocturnal Cooling & 24h Thermal Burden
          </span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
          CALCULATED
        </span>
      </div>

      {/* Metric Columns */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-300 mb-1">Night Minimum</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-white">{minTemp !== undefined ? minTemp : 'N/A'}</span>
            <span className="text-xs font-mono text-slate-500">°C</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-300 mb-1">Night Humidity</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-white">{rh !== undefined ? rh : 'N/A'}</span>
            <span className="text-xs font-mono text-slate-500">%</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-300 mb-1">24h Thermal Burden</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-white">{burdenScore !== undefined ? burdenScore : 'N/A'}</span>
            <span className="text-xs font-mono text-slate-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* Recovery Status */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">Recovery Status</span>
          <span className={`text-xs font-bold font-mono tracking-wider ${recoveryScore !== undefined ? 'text-white' : 'text-amber-400'}`}>
            {recoveryScore !== undefined ? `${recoveryScore}%` : 'EXPERIMENTAL'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
          {streak === undefined 
            ? 'Insufficient historical night data for validated recovery-streak calculation.' 
            : `Streak: ${streak} Consecutive Nights (×${multiplier || 1.0} Penalty)`}
        </p>
      </div>

    </div>
  );
};
