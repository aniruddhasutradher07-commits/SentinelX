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
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-teal-500/30 bg-teal-950/50 text-teal-300 uppercase tracking-widest font-semibold">
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
              <span className="text-lg font-bold font-mono text-amber-400">N/A</span>
            </div>

            <div className="bg-tactical-850/70 border border-amber-500/30 p-3 rounded-xl text-right">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-amber-400 block">Predicted Mortality</span>
              </div>
              <span className="text-lg font-bold font-mono text-amber-400">N/A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Integrity Mandate Card */}
      <div className="bg-[#030712]/90 border border-amber-500/40 rounded-xl p-4 font-mono text-xs text-slate-300">
        <div className="flex items-center gap-2 text-amber-400 font-bold mb-1 uppercase tracking-wider text-[11px]">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Clinical &amp; Hospital Modeling Integrity Mandate</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
          Admissions = <span className="font-mono text-amber-400 font-bold">N/A</span> · Mortality = <span className="font-mono text-amber-400 font-bold">N/A</span>.
          In compliance with medical research integrity and NDMA guidelines, HeatGuard AI strictly prohibits returning fabricated patient admissions or heatstroke mortality counts. Verified clinical registries are not linked to this node.
        </p>
      </div>

      {/* Basic Metrics Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-tactical-800/80 border border-tactical-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-400">Peak WBGT Exposure</h2>
          <span className="text-2xl font-bold text-white block mt-2">
            {summary?.odisha_statewide?.peak_wbgt_celsius || 'N/A'} °C
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Bio-meteorological calculated metric</span>
        </div>

        <div className="bg-tactical-800/80 border border-tactical-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-400">Physiological Load</h2>
          <span className="text-2xl font-bold text-amber-400 block mt-2">
            Marginal
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Based on ISO 7243 work-rest curves</span>
        </div>

        <div className="bg-tactical-800/80 border border-tactical-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-400">Research Status</h2>
          <span className="text-2xl font-bold text-fuchsia-400 block mt-2">
            EXPERIMENTAL
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Non-clinical research evaluation</span>
        </div>
      </div>

    </div>
  );
};
