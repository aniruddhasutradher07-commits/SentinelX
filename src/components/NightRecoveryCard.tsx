import React from 'react';
import { Moon, ShieldAlert, ThermometerSnowflake, Flame, Activity } from 'lucide-react';
import { getTierColor } from '../utils/riskTier';
import { StatCard } from './ui/StatCard';
import { SectionHeader } from './ui/SectionHeader';

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
  wardNo?: string;
  className?: string;
}

export const NightRecoveryCard: React.FC<NightRecoveryCardProps> = ({
  data,
  wardNo = 'Ward 21',
  className,
}) => {
  const minTemp = data?.night_min_temp_c ?? 28.5;
  const rh = data?.night_humidity_pct ?? 82.0;
  const failureScore = data?.failure_score ?? 68.4;
  const recoveryScore = data?.recovery_score ?? Math.round(100 - failureScore);
  const tier = data?.risk_tier || (failureScore >= 70 ? 'Red' : failureScore >= 50 ? 'Orange' : failureScore >= 30 ? 'Yellow' : 'Green');
  const streak = data?.consecutive_poor_nights ?? 2;
  const multiplier = data?.compounding_multiplier ?? 1.15;
  const burdenScore = data?.thermal_burden_score ?? 76.5;
  const provenance = data?.provenance || 'Calculated';

  const tierStyle = getTierColor(tier);

  return (
    <div
      role="region"
      aria-label="Nighttime Recovery Failure & 24h Thermal Burden"
      className={`glass-panel p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${tierStyle.border} ${className || ''}`}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none blur-3xl opacity-15 -mr-12 -mt-12"
        style={{ backgroundColor: tierStyle.hex }}
      />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold font-tech text-white uppercase tracking-wider block">
                NIGHTTIME RECOVERY INDEX
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Nocturnal Cooling &amp; 24h Thermal Burden
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 uppercase tracking-widest font-semibold">
            [{provenance}]
          </span>
        </div>

        {/* Tier & Core Metrics */}
        <div className="grid grid-cols-2 gap-3 my-3">
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono block mb-0.5">NIGHT MIN TEMP</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white">{minTemp}°C</span>
              <span className="text-[10px] font-mono text-slate-400">({rh}% RH)</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 block mt-0.5 font-semibold">
              Threshold: &gt;26°C Non-Cooling
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono block mb-0.5">24h THERMAL BURDEN</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white" style={{ color: tierStyle.hex }}>
                {burdenScore}
              </span>
              <span className="text-[10px] font-mono text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] font-mono text-rose-400 block mt-0.5 font-semibold">
              Streak: {streak} Nights (×{multiplier} Penalty)
            </span>
          </div>
        </div>
      </div>

      {/* Recovery Status Bar & Footer */}
      <div className="mt-2 pt-2 border-t border-white/5 space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Physiological Recovery:</span>
          <span className="font-bold" style={{ color: tierStyle.hex }}>
            {recoveryScore}% ({tier} Tier)
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${failureScore}%`, backgroundColor: tierStyle.hex }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{wardNo} · Epidemiological Risk</span>
          <span className="text-slate-300">
            {streak >= 2 ? `⚠️ Consecutive Heat Stress (+${Math.round((multiplier - 1) * 100)}%)` : 'Normal Night Cooling'}
          </span>
        </div>
      </div>
    </div>
  );
};
