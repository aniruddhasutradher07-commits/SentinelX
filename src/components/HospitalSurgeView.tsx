import React from 'react';
import { ShieldCheck, Stethoscope } from 'lucide-react';
import { SystemSummary } from '../types';

interface HospitalSurgeViewProps {
  summary?: SystemSummary | null;
}

export const HospitalSurgeView: React.FC<HospitalSurgeViewProps> = ({ summary }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/50 border border-tactical-border rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold uppercase">
                EXPERIMENTAL_NOT_VALIDATED
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 uppercase tracking-widest font-semibold">
                [EXPERIMENTAL]
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-mono text-slate-400">EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-white mt-1">
              Hospital Impact — Experimental
            </h1>
            <p className="text-xs text-amber-400 max-w-2xl mt-1 font-semibold">
              WARNING: This is an unvalidated experimental pipeline. Do not use for clinical or emergency decisions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-tactical-850/70 border border-amber-500/30 p-3 rounded-xl text-right">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-amber-400 block">Predicted Admissions</span>
              </div>
              <span className="text-lg font-bold font-mono text-amber-500">N/A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Metrics Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-tactical-800/80 border border-tactical-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-400">Peak WBGT Exposure</h2>
          <span className="text-2xl font-bold text-white block mt-2">
            {summary?.odisha_statewide?.peak_wbgt_celsius || 'N/A'} °C
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Experimental metric</span>
        </div>

        <div className="bg-tactical-800/80 border border-tactical-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-400">Recovery Status</h2>
          <span className="text-2xl font-bold text-amber-400 block mt-2">
            Marginal
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Based on physiological models</span>
        </div>

        <div className="bg-tactical-800/80 border border-tactical-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-400">Impact Tier</h2>
          <span className="text-2xl font-bold text-orange-400 block mt-2">
            Elevated Risk
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Synthetic demonstration data</span>
        </div>
      </div>

    </div>
  );
};
