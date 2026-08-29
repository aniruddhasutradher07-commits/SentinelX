import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Activity, 
  Users, 
  Flame, 
  Droplets, 
  Phone, 
  Send, 
  ChevronRight,
  TrendingUp,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { WardRiskRecord, WardImpactRecord } from '../types';

interface WardViewProps {
  wards: WardRiskRecord[];
  onDispatchAlert: (wardNo: string) => void;
}

export const WardView: React.FC<WardViewProps> = ({ wards, onDispatchAlert }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const [sortBy, setSortBy] = useState<'wbgt' | 'admissions' | 'pop' | 'uhi'>('wbgt');
  const [selectedWard, setSelectedWard] = useState<WardRiskRecord | null>(wards[0] || null);

  const zones = ['All', 'North Zone', 'South East Zone', 'South West Zone'];

  const filteredWards = wards.filter((w) => {
    const matchesSearch = w.ward_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === 'All' || w.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  const sortedWards = [...filteredWards].sort((a, b) => {
    if (sortBy === 'wbgt') return (b.WBGT_celsius || 0) - (a.WBGT_celsius || 0);
    if (sortBy === 'pop') return (b.population || 0) - (a.population || 0);
    if (sortBy === 'uhi') return (b.uhi_offset_c || 0) - (a.uhi_offset_c || 0);
    return (b.WardRiskScore || 0) - (a.WardRiskScore || 0);
  });

  const activeWard = selectedWard || sortedWards[0] || wards[0];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Ward Grid & Controls List */}
      <div className="flex-1 flex flex-col h-[55vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800/80 overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-ward-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Ward (e.g., W21)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
              />
            </div>

            {/* Zone Filter */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {zones.map((z) => (
                <button
                  key={z}
                  id={`btn-zone-${z.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setSelectedZone(z)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap ${
                    selectedZone === z
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>SORT:</span>
            <select
              id="select-ward-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="wbgt">Highest WBGT</option>
              <option value="uhi">Urban Heat Island (UHI)</option>
              <option value="pop">Population Density</option>
            </select>
          </div>
        </div>

        {/* Ward Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sortedWards.map((w) => {
            const isSelected = activeWard?.ward_no === w.ward_no;
            return (
              <div
                key={w.ward_no}
                id={`card-ward-${w.ward_no}`}
                onClick={() => setSelectedWard(w)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500/50 shadow-md shadow-sky-500/10'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-white">{w.ward_no}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        w.RiskTier === 'Red'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : w.RiskTier === 'Orange'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {w.RiskTier}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{w.zone}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-mono font-bold text-amber-400">
                      {w.WBGT_celsius || 28.5}°
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">WBGT</span>
                  </div>
                </div>

                {/* Ward Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] font-mono text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pop</span>
                    <span>{(w.population || 12000).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">UHI Spike</span>
                    <span className="text-rose-400">+{w.uhi_offset_c || 0.16}°C</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Humidity</span>
                    <span>{w.relative_humidity_pct || 75}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Ward Profile Sidebar */}
      <div className="w-full lg:w-96 bg-slate-950/95 p-4 flex flex-col h-[45vh] lg:h-full overflow-y-auto gap-4 shrink-0">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-sky-400 font-semibold tracking-wider uppercase">
              BHUBANESWAR MUNICIPAL WARD
            </span>
            <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30">
              67-WARD RESOLUTION
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold font-display text-white">{activeWard?.ward_no || 'W21'}</h2>
            <span className="text-xs text-slate-400 font-mono">{activeWard?.zone || 'North Zone'}</span>
          </div>

          {/* Demographic & UHI stats */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block">Total Population</span>
              <span className="font-bold text-slate-100 text-sm">{(activeWard?.population || 13932).toLocaleString()}</span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block">Urban Heat Island (UHI)</span>
              <span className="font-bold text-rose-400 text-sm">+{activeWard?.uhi_offset_c || 0.16}°C Offset</span>
            </div>
          </div>

          {/* Key Clinical & Municipal Directives */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              BMC Heat Action Plan Directive
            </h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Deploy mist cannons along high-traffic commercial nodes.</li>
              <li>Activate Jal Seva water kiosk near ward public bus stops.</li>
              <li>Triage elderly residents to CHC/PHC cooling hydration centers.</li>
            </ul>
          </div>

          {/* Dispatch Button */}
          <button
            id={`btn-ward-dispatch-${activeWard?.ward_no}`}
            onClick={() => onDispatchAlert(activeWard?.ward_no || 'W21')}
            className="w-full mt-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-sky-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            Dispatch Ward Advisory SMS / IVRS
          </button>
        </div>
      </div>
    </div>
  );
};
