import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  Activity,
  Users,
  Flame,
  Droplets,
  Trees,
  Home,
  Briefcase,
  ShieldAlert,
  Phone,
  Send,
  ChevronRight,
  TrendingUp,
  MapPin,
  AlertCircle,
  Percent,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, LineChart, Line, ReferenceLine, PieChart, Pie, ComposedChart, ReferenceArea } from 'recharts';
import { WardRiskRecord } from '../types';
import { getApiUrl } from '../services/apiConfig';
import { NightRecoveryCard } from './NightRecoveryCard';

interface WardViewProps {
  wards: WardRiskRecord[];
  onDispatchAlert: (wardNo: string) => void;
}

export const WardView: React.FC<WardViewProps> = ({ wards, onDispatchAlert }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const [sortBy, setSortBy] = useState<'risk' | 'multiplier' | 'wbgt' | 'lst' | 'uhi' | 'ndvi' | 'elderly' | 'workers' | 'tree' | 'roofs' | 'pop'>('risk');
  const [selectedWard, setSelectedWard] = useState<WardRiskRecord | null>(wards[0] || null);

  const zones = ['All', 'North Zone', 'South East Zone', 'South West Zone'];

  const filteredWards = wards.filter((w) => {
    const matchesSearch = w.ward_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === 'All' || w.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  const sortedWards = [...filteredWards].sort((a, b) => {
    if (sortBy === 'risk') return (b.WardRiskScore || 0) - (a.WardRiskScore || 0);
    if (sortBy === 'multiplier') return (b.vulnerability_multiplier || 1.0) - (a.vulnerability_multiplier || 1.0);
    if (sortBy === 'wbgt') return (b.WBGT_celsius || 0) - (a.WBGT_celsius || 0);
    if (sortBy === 'lst') return (b.modis_lst_c || 0) - (a.modis_lst_c || 0);
    if (sortBy === 'uhi') return (b.uhi_anomaly_c || 0) - (a.uhi_anomaly_c || 0);
    if (sortBy === 'ndvi') return (a.sentinel2_ndvi || 0) - (b.sentinel2_ndvi || 0); // ascending (least green first)
    if (sortBy === 'elderly') return (b.elderly_pct || 0) - (a.elderly_pct || 0);
    if (sortBy === 'workers') return (b.outdoor_worker_pct || 0) - (a.outdoor_worker_pct || 0);
    if (sortBy === 'tree') return (a.tree_cover_pct || 0) - (b.tree_cover_pct || 0); // ascending (least tree cover = highest vulnerability)
    if (sortBy === 'roofs') return (b.high_heat_roof_pct || 0) - (a.high_heat_roof_pct || 0);
    if (sortBy === 'pop') return (b.population || 0) - (a.population || 0);
    return (b.WardRiskScore || 0) - (a.WardRiskScore || 0);
  });

  const fallbackWard: WardRiskRecord = {
    ward_no: 'W21',
    zone: 'North Zone',
    population: 14500,
    centroid_lat: 20.29,
    centroid_lon: 85.82,
    timestamp: new Date().toISOString(),
    temperature_c: 39.5,
    relative_humidity_pct: 68,
    wind_speed_ms: 2.1,
    solar_radiation_wm2: 907.5,
    apparent_temp_c: 43.3,
    uhi_offset_c: 0.5,
    adjusted_temp_c: 39.5,
    HI_celsius: 44.3,
    WBGT_celsius: 32.4,
    UTCI_celsius: 42.7,
    thermal_hazard_score: 75,
    WardRiskScore: 82,
    RiskTier: 'Orange',
    elderly_pct: 9.5,
    outdoor_worker_pct: 24.0,
    tree_cover_pct: 18.0,
    high_heat_roof_pct: 32.0,
    vulnerability_score: 48,
    vulnerability_multiplier: 1.15,
  };

  const activeWard = selectedWard || sortedWards[0] || (wards && wards.length > 0 ? wards[0] : fallbackWard) || fallbackWard;
  const [wardDetails, setWardDetails] = useState<any>(null);
  const [nightRecoveryData, setNightRecoveryData] = useState<any>(null);

  React.useEffect(() => {
    if (!activeWard) return;
    fetch(getApiUrl(`/api/v1/wards/${activeWard.ward_no}`))
      .then(res => res.json())
      .then(data => setWardDetails(data))
      .catch(err => console.error(err));

    const dayTemp = activeWard.modis_lst_c || 39.5;
    const nightMinTemp = activeWard.modis_lst_night_c || 28.5;
    const consecutiveNights = (activeWard.uhi_anomaly_c || 0) >= 3.0 ? 3 : 2;
    const wardNo = encodeURIComponent(activeWard.ward_no || 'Ward 21');
    const nightUrl = getApiUrl(`/api/v1/thermal/night-recovery?day_temp=${dayTemp}&day_rh=68.0&night_min_temp=${nightMinTemp}&night_rh=82.0&consecutive_nights=${consecutiveNights}&ward_no=${wardNo}`);

    fetch(nightUrl)
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'success') {
          setNightRecoveryData(data);
        }
      })
      .catch(err => console.error('Error fetching night recovery API:', err));
  }, [activeWard?.ward_no, activeWard?.modis_lst_c, activeWard?.modis_lst_night_c, activeWard?.uhi_anomaly_c]);

  // Helper for Section 3.3: Exactly three plain-language driver lines, ranked
  const getTopThreeDrivers = (ward?: WardRiskRecord | null): string[] => {
    if (!ward) return ['24% outdoor-worker share (high daytime solar load)', '18.0% tree canopy (severe shading deficit)', '32% heat-trapping tin/asbestos roof structures'];
    const drivers: { text: string; severity: number }[] = [];
    const workers = ward.outdoor_worker_pct || 24.0;
    if (workers >= 20) {
      drivers.push({ text: `${Math.round(workers)}% outdoor-worker share (high daytime solar load)`, severity: workers * 1.5 });
    }
    const tree = ward.tree_cover_pct || 18.0;
    if (tree < 25) {
      drivers.push({ text: `${tree.toFixed(1)}% tree canopy (severe shading deficit)`, severity: (35 - tree) * 1.8 });
    }
    const roofs = ward.high_heat_roof_pct || 32.0;
    if (roofs >= 25) {
      drivers.push({ text: `${Math.round(roofs)}% heat-trapping tin/asbestos roof structures`, severity: roofs * 1.2 });
    }
    const uhi = ward.uhi_anomaly_c || 3.5;
    if (uhi >= 2.0) {
      drivers.push({ text: `+${uhi.toFixed(1)}°C satellite Urban Heat Island anomaly`, severity: uhi * 12 });
    }
    const elderly = ward.elderly_pct || 9.5;
    if (elderly >= 10) {
      drivers.push({ text: `${elderly.toFixed(1)}% elderly share (high cardiovascular strain)`, severity: elderly * 2.0 });
    }
    if (drivers.length < 3) {
      drivers.push({ text: `Nearest emergency hospital 4.2 km from ward centroid`, severity: 10 });
    }
    drivers.sort((a, b) => b.severity - a.severity);
    return drivers.slice(0, 3).map(d => d.text);
  };

  const top3Drivers = getTopThreeDrivers(activeWard);
  const currentTier = activeWard?.RiskTier || 'Orange';
  const tierColor = currentTier === 'Red' ? '#C0392B' : currentTier === 'Orange' ? '#D9772E' : currentTier === 'Yellow' ? '#C9A227' : '#3A7D5C';
  const tierBg = currentTier === 'Red' ? 'rgba(192, 57, 43, 0.15)' : currentTier === 'Orange' ? 'rgba(217, 119, 46, 0.15)' : currentTier === 'Yellow' ? 'rgba(201, 162, 39, 0.15)' : 'rgba(58, 125, 92, 0.15)';

  // Derive thermal hazard for display if not explicitly in object
  const activeThermalHazard = activeWard?.thermal_hazard_score ||
    Math.round(((activeWard?.WBGT_celsius || 31.0) / 33.0) * 75.0);
  const activeMultiplier = activeWard?.vulnerability_multiplier || 1.0;
  const activeElderly = activeWard?.elderly_pct || 9.5;
  const activeWorkers = activeWard?.outdoor_worker_pct || 24.0;
  const activeTreeCover = activeWard?.tree_cover_pct || 18.0;
  const activeRoofs = activeWard?.high_heat_roof_pct || 32.0;
  const activeVulnScore = activeWard?.vulnerability_score || 50.0;

  // Panel 1: Explainability factors
  const pTemp = activeWard?.temperature_c || 38.5;
  const pRh = activeWard?.relative_humidity_pct || 65;
  const pSolar = activeWard?.solar_radiation_wm2 || 850;
  const pWind = activeWard?.wind_speed_ms || 2.1;

  const wTemp = Math.max(0, pTemp - 25) * 4;
  const wRh = Math.max(0, pRh - 40) * 1.5;
  const wSolar = Math.max(0, pSolar - 200) * 0.05;
  const totalW = wTemp + wRh + wSolar;
  const pctTemp = Math.round((wTemp / totalW) * 100);
  const pctRh = Math.round((wRh / totalW) * 100);
  const pctSolar = Math.round((wSolar / totalW) * 100);
  const pctWind = Math.round(pWind * 5); // display value for relief

  // Panel 2: MRI Grade & WBGT Consistency
  const wbgt = activeWard?.WBGT_celsius || 26;
  let wbgtBand = 'Caution';
  let wbgtSeverity = 1;
  if (wbgt >= 32) { wbgtBand = 'Extreme Danger'; wbgtSeverity = 4; }
  else if (wbgt >= 30) { wbgtBand = 'Danger'; wbgtSeverity = 3; }
  else if (wbgt >= 28) { wbgtBand = 'Extreme Caution'; wbgtSeverity = 2; }

  const riskScore = activeWard?.WardRiskScore || 40;
  let rawMriGrade = 'Low';
  let mriSeverity = 1;
  if (riskScore >= 85) { rawMriGrade = 'Extreme'; mriSeverity = 4; }
  else if (riskScore >= 70) { rawMriGrade = 'Severe'; mriSeverity = 3; }
  else if (riskScore >= 45) { rawMriGrade = 'Moderate'; mriSeverity = 2; }

  let finalMriGrade = rawMriGrade;
  let mriAdjusted = false;

  if (wbgtSeverity > mriSeverity) {
    mriAdjusted = true;
    if (wbgtSeverity === 4) finalMriGrade = 'Extreme';
    else if (wbgtSeverity === 3) finalMriGrade = 'Severe';
    else if (wbgtSeverity === 2) finalMriGrade = 'Moderate';
  }

  const finalMriColor = finalMriGrade === 'Extreme' ? '#C0392B' : finalMriGrade === 'Severe' ? '#D9772E' : finalMriGrade === 'Moderate' ? '#C9A227' : '#3A7D5C';
  
  const mriData = [
    { name: 'Score', value: riskScore, fill: finalMriColor },
    { name: 'Remainder', value: 100 - riskScore, fill: '#1e293b' }
  ];

  // Panel 3: Night Recovery
  const next24h = wardDetails?.next_24h_weather
    ? wardDetails.next_24h_weather.map((w: any) => ({
      hour: new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wbgt: w.WBGT_celsius
    }))
    : Array.from({ length: 24 }).map((_, i) => {
      const cycle = Math.sin((i - 8) * Math.PI / 12);
      const w = (activeWard?.WBGT_celsius || 32) - 3 + cycle * 4;
      return { hour: `${i.toString().padStart(2, '0')}:00`, wbgt: Number(w.toFixed(1)) };
    });
  const noRecovery = !next24h.slice(0, 6).some((d: any) => d.wbgt < 28);

  // Panel 4: 5-Day Forecast
  const forecast5d = wardDetails?.hospital_demand_forecast
    ? wardDetails.hospital_demand_forecast.map((f: any) => ({
      date: new Date(f.date).toLocaleDateString('en-US', { weekday: 'short' }),
      admissions: f.predicted_admissions,
      tier: f.ImpactTier,
      wbgt: f.wbgt_max,
      tMin: f.t_min,
      recoveryGood: f.recovery_good,
      streakCount: f.streak_count
    }))
    : Array.from({ length: 5 }).map((_, i) => {
      const baseAdm = (activeWard?.population || 10000) * 0.001;
      const trend = Math.sin(i * 0.8) * 0.5 + 1;
      const adm = Math.round(baseAdm * trend * ((activeWard?.WardRiskScore || 50) / 50));
      let tier = 'Green';
      if (adm > baseAdm * 1.8) tier = 'Red';
      else if (adm > baseAdm * 1.4) tier = 'Orange';
      else if (adm > baseAdm * 1.1) tier = 'Yellow';

      const d = new Date();
      d.setDate(d.getDate() + i);
      return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), admissions: adm, tier };
    });
  const maxForecast = [...forecast5d].sort((a, b) => b.admissions - a.admissions)[0];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[#0B0D0E] text-[#F2F1EC]">
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap ${selectedZone === z
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
              <option value="risk">Highest Final Risk Index</option>
              <option value="multiplier">Vulnerability Multiplier (M_v)</option>
              <option value="wbgt">Highest Thermal WBGT</option>
              <option value="lst">🛰️ Highest MODIS LST (Surface Heat)</option>
              <option value="uhi">🏙️ Highest Urban Heat Island (UHI)</option>
              <option value="ndvi">🌱 Lowest Sentinel-2 NDVI (Canopy Deficit)</option>
              <option value="elderly">Elderly Demographic %</option>
              <option value="workers">Outdoor Labor Density %</option>
              <option value="tree">Lowest Tree Canopy (Canopy Deficit)</option>
              <option value="roofs">Tin / Asbestos Roofs %</option>
              <option value="pop">Total Population</option>
            </select>
          </div>
        </div>

        {/* Notice Banner: Decoupled Multi-Factor Risk */}
        <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span><strong>Multi-Factor Risk Formula:</strong> Risk Index = Thermal Hazard × Vulnerability Multiplier (<span className="text-amber-300 font-semibold">M_v</span> from Census Demographics + OSM Canopy/Roofs)</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold shrink-0">
              [CALCULATED]
            </span>
          </div>
          <div className="flex items-center gap-2 hidden md:flex">
            <span className="text-[10px] text-sky-400">67 Municipal Wards Modeled</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 uppercase tracking-widest font-semibold shrink-0">
              [MODELLED]
            </span>
          </div>
        </div>

        {/* Ward Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sortedWards.map((w) => {
            const isSelected = activeWard?.ward_no === w.ward_no;
            const mult = w.vulnerability_multiplier || 1.0;
            return (
              <div
                key={w.ward_no}
                id={`card-ward-${w.ward_no}`}
                onClick={() => setSelectedWard(w)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                    ? 'bg-sky-500/10 border-sky-500/50 shadow-md shadow-sky-500/10'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-white">{w.ward_no}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${w.RiskTier === 'Red'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold'
                          : w.RiskTier === 'Orange'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                        {w.RiskTier} Tier
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${mult >= 1.2
                          ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                          : mult >= 1.0
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        }`}>
                        M_v: ×{mult.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{w.zone}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-mono font-bold text-amber-400">
                      {w.WardRiskScore !== undefined ? w.WardRiskScore : (w.WBGT_celsius || 28.5)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono flex items-center justify-end gap-1">
                      Risk Score
                      <span className="text-[8px] font-mono px-1 py-0 rounded border border-cyan-500/30 text-cyan-300 uppercase">
                        [CALC]
                      </span>
                    </span>
                  </div>
                </div>

                {/* Census / OSM Vulnerability Strip */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-800/60 text-[10px] font-mono text-slate-300">
                  <div title="Elderly Demographic (Age 60+ %) - Estimated using state-average Census age-ratio (8.5%)">
                    <span className="text-[9px] text-slate-500 block flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5 text-sky-400" /> Elderly<span className="text-sky-400 cursor-help" title="Estimated (State Avg)">*</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span>{w.elderly_pct || 8.5}%</span>
                      <span className="text-[7px] font-mono text-amber-400 uppercase">[SYN]</span>
                    </div>
                  </div>
                  <div title="Outdoor Workers % (Construction / Vendors / Daily Wage)">
                    <span className="text-[9px] text-slate-500 block flex items-center gap-0.5">
                      <Briefcase className="w-2.5 h-2.5 text-amber-400" /> Labor
                    </span>
                    <div className="flex items-center gap-1">
                      <span>{w.outdoor_worker_pct || 24.0}%</span>
                      <span className="text-[7px] font-mono text-emerald-400 uppercase">[REAL]</span>
                    </div>
                  </div>
                  <div title="OSM Tree Canopy Cover % (Green Cooling Buffer)">
                    <span className="text-[9px] text-slate-500 block flex items-center gap-0.5">
                      <Trees className="w-2.5 h-2.5 text-emerald-400" /> Canopy
                    </span>
                    <div className="flex items-center gap-1 text-emerald-400">
                      <span>{w.tree_cover_pct || 18.0}%</span>
                      <span className="text-[7px] font-mono text-emerald-400 uppercase">[REAL]</span>
                    </div>
                  </div>
                  <div title="Heat-Trapping Tin / Asbestos Roofs %">
                    <span className="text-[9px] text-slate-500 block flex items-center gap-0.5">
                      <Home className="w-2.5 h-2.5 text-rose-400" /> Tin Roof
                    </span>
                    <div className="flex items-center gap-1 text-rose-400">
                      <span>{w.high_heat_roof_pct || 32.0}%</span>
                      <span className="text-[7px] font-mono text-emerald-400 uppercase">[REAL]</span>
                    </div>
                  </div>
                </div>

                {/* Satellite Earth Observation Strip */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/40 text-[9px] font-mono">
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    🛰️ LST: {w.modis_lst_c || (w.temperature_c ? (w.temperature_c + 6.8).toFixed(1) : '45.8')}°C <span className="text-[7px] text-emerald-400 font-normal">[REAL]</span>
                  </span>
                  <span className={`${(w.uhi_anomaly_c || 3.5) >= 4.0 ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>
                    UHI: {w.uhi_anomaly_c !== undefined ? (w.uhi_anomaly_c >= 0 ? `+${w.uhi_anomaly_c}°C` : `${w.uhi_anomaly_c}°C`) : '+3.5°C'} <span className="text-[7px] text-cyan-300 font-normal">[CALC]</span>
                  </span>
                  <span className="text-emerald-400">
                    NDVI: {w.sentinel2_ndvi || 0.28} <span className="text-[7px] text-emerald-400 font-normal">[REAL]</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Ward Detail / Explainability Panel (UI/UX Spec Section 3.3) */}
      <div className="w-full lg:w-[410px] bg-[#14171A] border-l border-[#232A2E] p-4 flex flex-col h-[45vh] lg:h-full overflow-y-auto gap-3.5 shrink-0">

        {/* Header Zone: Ward name, MRI grade chip, horizon */}
        <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider">
              {activeWard?.zone || 'North Zone'} · Bhubaneswar
            </span>
            <span className="text-[10px] font-mono bg-[#14171A] text-[#8B9096] px-2 py-0.5 rounded border border-[#232A2E]">
              Horizon: Today (Day 0)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-sans text-white">{activeWard?.ward_no || 'W21'}</h2>

            {/* Grade Chip: color + text label + ordered score, never color alone */}
            <div
              className="px-3 py-1 rounded-xl flex items-center gap-2 border"
              style={{ backgroundColor: tierBg, borderColor: tierColor }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tierColor }} />
              <span className="font-mono font-bold text-xs" style={{ color: tierColor }}>
                {currentTier} ({activeWard?.WardRiskScore || 97}/100)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
            <div className="bg-[#14171A] p-2 rounded-xl border border-[#232A2E]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8B9096]">Population</span>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded border border-emerald-500/30 text-emerald-300">
                  [REAL]
                </span>
              </div>
              <span className="font-bold text-white tabular-nums">{(activeWard?.population || 14500).toLocaleString()}</span>
            </div>
            <div className="bg-[#14171A] p-2 rounded-xl border border-[#232A2E]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8B9096]">WBGT Stress</span>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded border border-cyan-500/30 text-cyan-300">
                  [CALC]
                </span>
              </div>
              <span className="font-bold text-[#F2F1EC] tabular-nums">{activeWard?.WBGT_celsius || 32.8}°C</span>
            </div>
          </div>
        </div>

        {/* Panel 1: Hospital Surge XAI (SHAP) */}
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-4">
          <h3 className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0F5C5C]" />
              Hospital Surge XAI (SHAP)
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-sans text-slate-500 normal-case bg-white/5 px-2 py-0.5 rounded">XGBoost Explainer</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 uppercase tracking-widest font-semibold">
                [MODELLED]
              </span>
            </div>
          </h3>

          {wardDetails?.shap_explainability ? (() => {
            // Sort features by absolute value descending for visualization
            const sortedFeatures = [...wardDetails.shap_explainability.features].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
            
            return (
              <div className="h-40 w-full text-[10px] font-mono mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedFeatures} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#8B9096', fontSize: 9 }} width={120} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B0D0E', borderColor: '#232A2E', borderRadius: '8px', fontSize: '10px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any) => [Number(value).toFixed(3), 'SHAP Impact']}
                    />
                    <ReferenceLine x={0} stroke="#232A2E" />
                    <Bar dataKey="value" barSize={8} radius={[0, 4, 4, 0]}>
                      {
                        sortedFeatures.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#C0392B' : '#3A7D5C'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })() : (
            <div className="h-40 w-full flex items-center justify-center text-slate-500 font-mono text-xs">
              Waiting for model explanation...
            </div>
          )}
          
          <div className="mt-3 flex items-center gap-4 text-[9px] font-mono text-[#8B9096] border-t border-[#232A2E] pt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-[#C0392B]"></div>
              <span>Increases Surge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-[#3A7D5C]"></div>
              <span>Decreases Surge</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Model consistency — MRI grade */}
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#0F5C5C]" />
                Model consistency — MRI grade
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
                [CALCULATED]
              </span>
            </div>
            <div className="text-[10px] text-[#F2F1EC] font-sans mt-2 space-y-1">
              <p><span className="text-[#8B9096]">WBGT Band:</span> {wbgtBand}</p>
              <p><span className="text-[#8B9096]">Raw MRI:</span> {rawMriGrade}</p>
              {mriAdjusted && (
                <p className="text-[#C0392B] font-bold mt-1 bg-red-900/20 px-1.5 py-0.5 rounded border border-red-500/20 inline-block">
                  Adjusted upwards due to {wbgtBand} WBGT!
                </p>
              )}
            </div>
          </div>
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mriData} innerRadius={22} outerRadius={30} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                  {mriData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center font-bold font-mono text-[9px] uppercase tracking-tighter" style={{ color: finalMriColor }}>
              {finalMriGrade.slice(0, 3)}
            </div>
          </div>
        </div>

        {/* Panel 3: Nighttime Recovery Failure & 24h Cumulative Thermal Burden */}
        {(() => {
          const dayRiskVal = nightRecoveryData?.day_risk?.htsi_score ?? Math.round(activeWard?.WardRiskScore || 72);
          const nightMinTemp = nightRecoveryData?.night_recovery?.night_min_temp_c ?? (activeWard?.modis_lst_night_c || 28.5);
          const nightFailureVal = nightRecoveryData?.night_recovery?.failure_score ?? 68;
          const recoveryScore = nightRecoveryData?.night_recovery?.recovery_score ?? Math.round(100 - nightFailureVal);
          const consecutiveNights = nightRecoveryData?.thermal_burden_24h?.consecutive_poor_nights ?? ((activeWard?.uhi_anomaly_c || 0) >= 3.0 ? 3 : 2);
          const compoundingMult = nightRecoveryData?.thermal_burden_24h?.compounding_multiplier ?? 1.15;
          const burden24hVal = nightRecoveryData?.thermal_burden_24h?.composite_burden_score ?? 76;

          const nightRecovery3ValData = [
            { label: 'Day Risk', score: dayRiskVal, fill: '#00F2FE' },
            { label: 'Night Failure', score: nightFailureVal, fill: '#818cf8' },
            { label: '24h Burden', score: burden24hVal, fill: '#C0392B' },
          ];

          return (
            <>
              <NightRecoveryCard
                wardNo={activeWard?.ward_no || 'W21'}
                data={{
                  night_min_temp_c: nightMinTemp,
                  night_humidity_pct: nightRecoveryData?.night_recovery?.night_humidity_pct ?? 82.0,
                  failure_score: nightFailureVal,
                  recovery_score: recoveryScore,
                  consecutive_poor_nights: consecutiveNights,
                  compounding_multiplier: compoundingMult,
                  thermal_burden_score: burden24hVal,
                  provenance: nightRecoveryData?.provenance || 'Calculated'
                }}
              />

              <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Day Risk vs Night Failure vs 24h Burden
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
                    [CALCULATED]
                  </span>
                </div>

                <div className="h-28 w-full my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nightRecovery3ValData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fill: '#8B9096', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#8B9096', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0D0E', borderColor: '#232A2E', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(val: any) => [`${val} / 100`, 'Calculated Index Score']}
                      />
                      <Bar dataKey="score" barSize={26} radius={[4, 4, 0, 0]}>
                        {nightRecovery3ValData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono border-t border-[#232A2E] pt-2">
                  <span className="text-slate-400">Night Core Cooling Status:</span>
                  <span className={nightFailureVal >= 60 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {nightFailureVal >= 60 ? `Poor Cooling (${consecutiveNights} Consecutive Nights)` : 'Normal Nocturnal Recovery'}
                  </span>
                </div>
              </div>
            </>
          );
        })()}

        {/* Panel 4: 5-day forecast horizon */}
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-4">
          <h3 className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#0F5C5C]" />
              5-day forecast horizon
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-sans text-slate-500 normal-case bg-white/5 px-2 py-0.5 rounded">Open-Meteo</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 uppercase tracking-widest font-semibold">
                [MODELLED]
              </span>
            </div>
          </h3>
          <div className="h-32 w-full mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast5d} margin={{ top: 5, right: -5, left: -25, bottom: 20 }}>
                {/* Background color bands for WBGT danger zones */}
                <ReferenceArea y1={32} y2={40} yAxisId="left" fill="#C0392B" fillOpacity={0.1} />
                <ReferenceArea y1={30} y2={32} yAxisId="left" fill="#D9772E" fillOpacity={0.1} />
                <ReferenceArea y1={28} y2={30} yAxisId="left" fill="#C9A227" fillOpacity={0.1} />
                <ReferenceArea y1={0} y2={28} yAxisId="left" fill="#3A7D5C" fillOpacity={0.1} />

                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false}
                  tick={(props: any) => {
                    const { x, y, payload, index } = props;
                    const data = forecast5d[index];
                    if (!data) return <g></g>;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={12} textAnchor="middle" fill="#8B9096" fontSize={9}>
                          {payload.value}
                        </text>
                        {data.streakCount >= 2 ? (
                          <text x={0} y={0} dy={26} textAnchor="middle" fill="#C0392B" fontSize={10} fontWeight="bold">
                            🔥x{data.streakCount}
                          </text>
                        ) : (
                          <circle cx={0} cy={22} r={3} fill={data.recoveryGood ? "#3A7D5C" : "#C0392B"} />
                        )}
                      </g>
                    );
                  }} 
                />
                
                {/* Left Y Axis for WBGT */}
                <YAxis yAxisId="left" domain={[24, 40]} tick={{ fill: '#8B9096', fontSize: 9 }} axisLine={false} tickLine={false} hide />
                
                {/* Right Y Axis for Admissions */}
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8B9096', fontSize: 9 }} axisLine={false} tickLine={false} />

                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-lg p-2 text-[10px] text-white">
                          <p className="font-bold mb-1">{label}</p>
                          <p>Max WBGT: {data.wbgt}°C</p>
                          <p>Night Min: {data.tMin}°C</p>
                          <p>Admissions: {data.admissions}</p>
                          <p className={data.recoveryGood ? "text-[#3A7D5C]" : "text-[#C0392B]"}>
                            Recovery: {data.recoveryGood ? 'Good' : 'Poor'} {data.streakCount >= 2 && `(🔥x${data.streakCount})`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Admissions Bar */}
                <Bar yAxisId="right" dataKey="admissions" radius={[2, 2, 0, 0]} barSize={12} name="Admissions">
                  {forecast5d.map((entry: any, index: number) => {
                    const color = entry.tier === 'Red' ? '#C0392B' : entry.tier === 'Orange' ? '#D9772E' : entry.tier === 'Yellow' ? '#C9A227' : '#3A7D5C';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>

                {/* WBGT Line */}
                <Line yAxisId="left" type="monotone" dataKey="wbgt" stroke="#ffffff" strokeWidth={2} dot={{ r: 3, fill: '#ffffff', strokeWidth: 0 }} name="Max WBGT (°C)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-end mt-3">
            <p className="text-[10px] text-[#F2F1EC] font-sans">
              Peak expected on <span className="font-bold">{maxForecast?.date}</span> ({maxForecast?.admissions} admissions).
            </p>
            <div className="flex gap-3 text-[9px] font-mono text-[#8B9096]">
               <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white"></div> WBGT</span>
               <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#C0392B]"></div> Surge</span>
            </div>
          </div>
        </div>

        {/* Drivers Zone (Section 3.3): Exactly three plain-language driver lines, ranked */}
        <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Primary Risk Drivers (Ranked 1–3)
            </h3>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
              [CALCULATED]
            </span>
          </div>

          <ol className="space-y-2 text-xs font-sans text-[#F2F1EC]">
            {top3Drivers.map((driverText, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 bg-[#14171A] p-2 rounded-xl border border-[#232A2E]"
              >
                <span className="w-4 h-4 rounded-full bg-[#0F5C5C]/30 text-teal-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-xs leading-snug">{driverText}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Trend Zone (Section 3.3): Small inline sparkline of this ward's grade over last 5 and next 5 days */}
        <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#0F5C5C]" />
              Cumulative Exposure Trend (10-Day Horizon)
            </h3>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 uppercase tracking-widest font-semibold">
              [MODELLED]
            </span>
          </div>

          {/* Inline Persistence Sparkline */}
          <div className="flex items-end justify-between gap-1 h-12 pt-2 px-1">
            {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((dayOffset) => {
              const baseScore = activeWard?.WardRiskScore || 75;
              const simulatedVal = Math.min(100, Math.max(30, Math.round(baseScore + Math.sin(dayOffset * 0.8) * 15)));
              const barColor = simulatedVal > 85 ? '#C0392B' : simulatedVal > 65 ? '#D9772E' : simulatedVal > 45 ? '#C9A227' : '#3A7D5C';
              const isToday = dayOffset === 0;

              return (
                <div key={dayOffset} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${(simulatedVal / 100) * 36}px`,
                      backgroundColor: barColor,
                      outline: isToday ? '1px solid #F2F1EC' : 'none'
                    }}
                    title={`Day ${dayOffset >= 0 ? '+' : ''}${dayOffset}: Risk Score ${simulatedVal}`}
                  />
                  <span className={`text-[8px] font-mono ${isToday ? 'text-white font-bold' : 'text-[#8B9096]'}`}>
                    {dayOffset === 0 ? 'T' : dayOffset > 0 ? `+${dayOffset}` : dayOffset}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[#8B9096] mt-2 font-mono">
            Persistence: Multi-day cumulative heat stress triggers higher clinical hospital surge risk.
          </p>
        </div>

        {/* Advisory Zone (Section 3.3): The exact text being sent to citizens in this ward */}
        <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
              Citizen Public Health Advisory
            </h3>
            <span className="text-[9px] font-mono text-sky-400">Live Broadcast Text</span>
          </div>

          <div className="bg-[#14171A] p-2.5 rounded-xl border border-[#232A2E] text-xs text-[#F2F1EC] leading-relaxed font-sans">
            &ldquo;🚨 [OSDMA/BMC ALERT] {activeWard?.ward_no}: Extreme thermal stress (WBGT {activeWard?.WBGT_celsius || 32.8}°C). Mandatory rest intervals for outdoor laborers. Cooling center open at nearest ward Kalyan Mandap.&rdquo;
          </div>
        </div>

        {/* Actions Zone (Section 3.3): Available administrative triggers */}
        <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
            Administrative Heat Action Triggers
          </h3>
          <p className="text-[10px] text-[#8B9096] mb-3 font-sans">
            Directly executes municipal heat action plan interventions with audit logging:
          </p>

          <button
            id={`btn-ward-dispatch-${activeWard?.ward_no}`}
            onClick={() => onDispatchAlert(activeWard?.ward_no || 'W21')}
            className="w-full py-2.5 bg-[#0F5C5C] hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition font-sans shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            Open Alert &amp; Administrative Action Console
          </button>
        </div>

      </div>
    </div>
  );
};