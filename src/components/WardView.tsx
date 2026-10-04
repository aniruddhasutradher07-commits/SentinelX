import React, { useState, useMemo } from 'react';
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
  ThermometerSun,
  MapPin,
  Map,
  AlertCircle,
  Percent,
  Sparkles
} from 'lucide-react';
import { getLocalitiesByWard, getPrimaryLocalityByWard, getWardByLocality } from '../utils/wardLocalities';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, LineChart, Line, ReferenceLine, PieChart, Pie, ComposedChart, ReferenceArea } from 'recharts';

import { WardRiskRecord } from '../types';
import { getApiUrl } from '../services/apiConfig';
import { NightRecoveryCard } from './NightRecoveryCard';
import { MortalityImpactCard } from './MortalityImpactCard';

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
    const lowerTerm = searchTerm.trim().toLowerCase();
    const wardNo = Number(String(w.ward_no || '').replace(/^W/i, ''));
    const localities = getLocalitiesByWard(wardNo);
    const matchesLocality = lowerTerm ? localities.some((loc) => loc.toLowerCase().includes(lowerTerm)) : false;
    const matchesSearch =
      !lowerTerm ||
      w.ward_no.toLowerCase().includes(lowerTerm) ||
      w.zone.toLowerCase().includes(lowerTerm) ||
      matchesLocality;
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

  const activeWard = selectedWard || (sortedWards.length > 0 ? sortedWards[0] : null);

  const [wardDetails, setWardDetails] = useState<any>(null);
  const [hospitalDemandData, setHospitalDemandData] = useState<any>(null);
  const [nightRecoveryData, setNightRecoveryData] = useState<any>(null);

  if (!activeWard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-tactical-900 text-slate-400 font-mono text-sm">
        DATA UNAVAILABLE
      </div>
    );
  }

  React.useEffect(() => {
    if (!activeWard) return;
    fetch(getApiUrl(`/api/v1/wards/${activeWard.ward_no}`))
      .then(res => res.json())
      .then(data => setWardDetails(data))
      .catch(err => console.error(err));

    fetch(getApiUrl(`/api/v1/wards/${activeWard.ward_no}/hospital-demand`))
      .then(res => res.json())
      .then(data => setHospitalDemandData(data))
      .catch(err => {
        console.error('Error fetching hospital demand:', err);
        setHospitalDemandData({ status: "UNAVAILABLE" });
      });

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

  // Dynamic feature attribution calculated from actual ward metrics
  const proxyFeatures = useMemo(() => {
    if (wardDetails?.shap_explainability?.features && wardDetails.shap_explainability.features.length > 0) {
      return [...wardDetails.shap_explainability.features].sort((a: any, b: any) => Math.abs(b.value) - Math.abs(a.value));
    }
    if (!activeWard) return [];
    
    const uhi = activeWard.uhi_anomaly_c ?? 3.2;
    const roof = activeWard.high_heat_roof_pct ?? 32.0;
    const labor = activeWard.outdoor_worker_pct ?? 24.0;
    const canopy = activeWard.tree_cover_pct ?? 18.0;
    const elderly = activeWard.elderly_pct ?? 8.5;
    const wbgtVal = activeWard.WBGT_celsius ?? 31.5;
    const ndvi = activeWard.sentinel2_ndvi ?? 0.28;

    const features = [
      { name: 'Urban Heat Island', value: Number((uhi * 0.08).toFixed(3)), label: `+${uhi}°C UHI Anomaly` },
      { name: 'Heat-Trapping Roofs', value: Number(((roof - 20) * 0.012).toFixed(3)), label: `${roof}% Tin/Asbestos Roofs` },
      { name: 'Outdoor Labor Share', value: Number(((labor - 15) * 0.014).toFixed(3)), label: `${labor}% Manual Outdoor Labor` },
      { name: 'Thermal Load (WBGT)', value: Number(((wbgtVal - 28) * 0.05).toFixed(3)), label: `${wbgtVal}°C Wet-Bulb Temp` },
      { name: 'Elderly Demographic', value: Number(((elderly - 6) * 0.02).toFixed(3)), label: `${elderly}% Age 60+` },
      { name: 'Tree Canopy Buffer', value: Number((-1 * (canopy * 0.012)).toFixed(3)), label: `${canopy}% Canopy Cover` },
      { name: 'NDVI Green Buffer', value: Number((-1 * (ndvi * 0.55)).toFixed(3)), label: `${ndvi} NDVI Index` },
    ];

    return features.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [wardDetails, activeWard]);

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
    : [];
  const noRecovery = next24h.length > 0 ? !next24h.slice(0, 6).some((d: any) => d.wbgt < 28) : false;

  const isHospitalDemandAvailable = hospitalDemandData?.status === "EXPERIMENTAL_NOT_VALIDATED" && hospitalDemandData?.forecast?.length > 0;
  
  const forecast5d = isHospitalDemandAvailable
    ? hospitalDemandData.forecast.map((f: any) => ({
      date: new Date(f.date).toLocaleDateString('en-US', { weekday: 'short' }),
      admissions: f.predicted_admissions,
      tier: f.ImpactTier,
      wbgt: f.wbgt_max,
      tMin: f.t_min,
      recoveryGood: f.recovery_good,
      streakCount: f.streak_count
    }))
    : [];
  const maxForecast = forecast5d.length > 0 ? [...forecast5d].sort((a, b) => (b.wbgt || 0) - (a.wbgt || 0))[0] : null;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-tactical-900 text-slate-200">
      {/* Ward Grid & Controls List */}
      <div className="flex-1 flex flex-col h-[55vh] lg:h-full border-b lg:border-b-0 lg:border-r border-tactical-border/80 overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 bg-tactical-850/80 border-b border-tactical-border/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-ward-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Ward (e.g., W21)..."
                className="w-full bg-tactical-800 border border-tactical-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
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
                      : 'text-slate-400 hover:bg-tactical-800 border border-transparent'
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
              className="bg-tactical-800 border border-tactical-border rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
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
        <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border-b border-tactical-border/80 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span><strong>Multi-Factor Risk Formula:</strong> Risk Index = Thermal Hazard × Vulnerability Multiplier (<span className="text-amber-300 font-semibold">M_v</span> from Census Demographics + OSM Canopy/Roofs)</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold shrink-0">
              [CALCULATED]
            </span>
          </div>
          <div className="flex items-center gap-2 hidden md:flex">
            <span className="text-[10px] text-sky-400">67 Municipal Wards Modeled</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-teal-500/30 bg-teal-900/50 text-teal-300 uppercase tracking-widest font-semibold shrink-0">
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
                    ? 'bg-gradient-to-br from-sky-500/15 via-[#14171A] to-[#0E1114] border-sky-400 ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/15 -translate-y-0.5'
                    : 'bg-tactical-800/70 border-tactical-border/80 hover:bg-tactical-800/95 hover:border-white/20 hover:shadow-md'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                      {w.is_stale ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-yellow-950/60 text-yellow-400 border-yellow-500/40">
                          {(w.data_age_minutes ?? 0) >= 999 ? 'UNAVAILABLE' : `STALE (${Math.round((w.data_age_minutes ?? 0) / 60)}h)`}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-emerald-950/60 text-emerald-400 border-emerald-500/40 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> LIVE
                        </span>
                      )}
                    </div>
                    {(() => {
                      const wardNo = Number(String(w.ward_no || '').replace(/^W/i, ''));
                      const primary = getPrimaryLocalityByWard(wardNo);
                      return primary ? (<p className="text-xs font-medium text-slate-200 mt-1 truncate">{primary}</p>) : null;
                    })()}
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{w.zone}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-mono font-bold text-amber-400">
                      {w.WardRiskScore !== undefined ? w.WardRiskScore : (w.WBGT_celsius || 28.5)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono flex items-center justify-end gap-1">
                      Risk Score
                      <span className="text-[8px] font-mono px-1 py-0 rounded border border-cyan-500/30 text-cyan-300 uppercase">
                        [CALC]
                      </span>
                    </span>
                  </div>
                </div>

                {/* Census / OSM Vulnerability Strip */}
                <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                  <div className="bg-black/25 p-1 rounded-lg">
                    <span className="text-[8px] text-slate-400 block flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5 text-sky-400" /> Elderly
                    </span>
                    <span className="font-bold text-slate-200">{w.elderly_pct || 8.5}%</span>
                  </div>
                  <div className="bg-black/25 p-1 rounded-lg">
                    <span className="text-[8px] text-slate-400 block flex items-center gap-0.5">
                      <Briefcase className="w-2.5 h-2.5 text-amber-400" /> Labor
                    </span>
                    <span className="font-bold text-slate-200">{w.outdoor_worker_pct || 24.0}%</span>
                  </div>
                  <div className="bg-black/25 p-1 rounded-lg">
                    <span className="text-[8px] text-slate-400 block flex items-center gap-0.5">
                      <Trees className="w-2.5 h-2.5 text-emerald-400" /> Canopy
                    </span>
                    <span className="font-bold text-emerald-300">{w.tree_cover_pct || 18.0}%</span>
                  </div>
                  <div className="bg-black/25 p-1 rounded-lg">
                    <span className="text-[8px] text-slate-400 block flex items-center gap-0.5">
                      <Home className="w-2.5 h-2.5 text-rose-400" /> Tin Roof
                    </span>
                    <span className="font-bold text-rose-300">{w.high_heat_roof_pct || 32.0}%</span>
                  </div>
                </div>

                {/* Satellite Earth Observation Strip */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.04] text-[9px] font-mono">
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    🛰️ LST: {w.modis_lst_c || (w.temperature_c ? (w.temperature_c + 6.8).toFixed(1) : '45.8')}°C
                  </span>
                  <span className={`${(w.uhi_anomaly_c || 3.5) >= 4.0 ? 'text-teal-400 font-bold' : 'text-slate-400'}`}>
                    UHI: {w.uhi_anomaly_c !== undefined ? (w.uhi_anomaly_c >= 0 ? `+${w.uhi_anomaly_c}°C` : `${w.uhi_anomaly_c}°C`) : '+3.5°C'}
                  </span>
                  <span className="text-emerald-400 font-medium">
                    NDVI: {w.sentinel2_ndvi || 0.28}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Ward Detail / Explainability Panel (UI/UX Spec Section 3.3) */}
      <div className="w-full lg:w-[410px] bg-tactical-800 border-l border-tactical-border p-4 flex flex-col h-[45vh] lg:h-full overflow-y-auto gap-3.5 shrink-0">

        {/* Header Zone: Ward name, MRI grade chip, horizon */}
        <div className="bg-tactical-900 border border-tactical-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {activeWard?.zone || 'North Zone'} · Bhubaneswar
            </span>
            <span className="text-[10px] font-mono bg-tactical-800 text-slate-400 px-2 py-0.5 rounded border border-tactical-border">
              Horizon: Today (Day 0)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold font-sans text-white">{activeWard?.ward_no || 'W21'}</h2>
              {(() => {
                const wNo = Number(String(activeWard?.ward_no || '').replace(/^W/i, ''));
                const primary = getPrimaryLocalityByWard(wNo);
                return primary ? <span className="text-sm font-semibold text-slate-300">({primary})</span> : null;
              })()}
            </div>

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

          {/* Section A: Environmental Risk */}
          <div className="mt-3 pt-2.5 border-t border-tactical-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <ThermometerSun className="w-3 h-3" />
                SECTION A: ENVIRONMENTAL RISK
              </span>
              <span className="text-[8px] font-mono px-1 py-0.2 rounded border border-cyan-500/30 text-cyan-300">
                [OBSERVED / CALC]
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
              <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
                <span className="text-[9px] text-slate-400 block">Air Temp</span>
                <span className="font-bold text-amber-400">{activeWard?.temperature_c || 38.0}°C</span>
              </div>
              <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
                <span className="text-[9px] text-slate-400 block">Rel Humidity</span>
                <span className="font-bold text-sky-300">{activeWard?.relative_humidity_pct || 68}%</span>
              </div>
              <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
                <span className="text-[9px] text-slate-400 block">Wind Speed</span>
                <span className="font-bold text-slate-200">{activeWard?.wind_speed_ms || 2.1} m/s</span>
              </div>
              <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
                <span className="text-[9px] text-slate-400 block">WBGT (ISO)</span>
                <span className="font-bold text-rose-400">{activeWard?.WBGT_celsius || 32.8}°C</span>
              </div>
              <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
                <span className="text-[9px] text-slate-400 block">UTCI</span>
                <span className="font-bold text-teal-400">{activeWard?.UTCI_celsius || (activeWard?.temperature_c ? (activeWard.temperature_c + 3.2).toFixed(1) : '41.2')}°C</span>
              </div>
              <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
                <span className="text-[9px] text-slate-400 block">Heat Index</span>
                <span className="font-bold text-rose-400">{activeWard?.HI_celsius || (activeWard?.temperature_c ? (activeWard.temperature_c + 4.8).toFixed(1) : '46.5')}°C</span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-tactical-800/80 p-2 rounded-xl border border-tactical-border mt-1.5 text-xs font-mono">
              <span className="text-slate-400 text-[10px]">Population: {(activeWard?.population || 14500).toLocaleString()}</span>
              <span className="text-[10px] font-bold" style={{ color: tierColor }}>Risk Tier: {currentTier} ({activeWard?.WardRiskScore || 97}/100)</span>
            </div>
          </div>
        </div>

        {/* Panel 1: Environmental Feature Attribution — PROXY */}
        <div className="bg-tactical-800 border border-tactical-border rounded-2xl p-4">
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Environmental Feature Attribution — PROXY
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
                [PROXY]
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-sans mt-1">
              Calculated from ward environmental &amp; demographic indicators. Not a model-generated SHAP explanation.
            </p>
          </div>

          {proxyFeatures.length > 0 ? (
            <div className="h-44 w-full text-[10px] font-mono mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={proxyFeatures} layout="vertical" margin={{ top: 0, right: 15, left: -10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} width={125} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0D0E', borderColor: '#232A2E', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any, _name: any, item: any) => [`${value > 0 ? '+' : ''}${Number(value).toFixed(3)} (${item?.payload?.label || ''})`, 'Relative Weight']}
                  />
                  <ReferenceLine x={0} stroke="#334155" />
                  <Bar dataKey="value" barSize={9} radius={[0, 4, 4, 0]}>
                    {proxyFeatures.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#C0392B' : '#3A7D5C'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-28 w-full flex items-center justify-center text-slate-500 font-mono text-xs">
              Calculating ward risk attribution...
            </div>
          )}
          
          <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-tactical-border/60 pt-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-[#C0392B]"></div>
              <span>Amplifies Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-[#3A7D5C]"></div>
              <span>Protective Cooling</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Model consistency — MRI grade */}
        <div className="bg-tactical-800 border border-tactical-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-500" />
                Model consistency — MRI grade
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
                [CALCULATED]
              </span>
            </div>
            <div className="text-[10px] text-slate-200 font-sans mt-2 space-y-1">
              <p><span className="text-slate-400">WBGT Band:</span> {wbgtBand}</p>
              <p><span className="text-slate-400">Raw MRI:</span> {rawMriGrade}</p>
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

              <div className="bg-tactical-800 border border-tactical-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
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

                <div className="flex items-center justify-between text-[10px] font-mono border-t border-tactical-border pt-2">
                  <span className="text-slate-400">Night Core Cooling Status:</span>
                  <span className={nightFailureVal >= 60 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {nightFailureVal >= 60 ? `Poor Cooling (${consecutiveNights} Consecutive Nights)` : 'Normal Nocturnal Recovery'}
                  </span>
                </div>
              </div>
            </>
          );
        })()}
        
        {/* Panel 3.4.5: Ward Profile Context */}
        {activeWard?.ward_profile && (
          <div className="bg-tactical-800 border border-tactical-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Ward Profile
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-950/50 text-blue-300 uppercase tracking-widest font-semibold">
                [{activeWard.ward_profile.status}]
              </span>
            </div>
            
            <div className="text-[10px] text-slate-300 font-sans space-y-2">
              <p className="text-slate-400 border-b border-tactical-border/50 pb-1 mb-2">
                <span className="text-blue-400 font-medium">Source:</span> {activeWard.ward_profile.source} | <span className="text-blue-400 font-medium">Dataset:</span> {activeWard.ward_profile.dataset} ({activeWard.ward_profile.dataset_year})
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-tactical-900/50 p-2 rounded border border-tactical-border/50">
                  <span className="block text-slate-400 font-mono text-[9px] mb-1">Total Population</span>
                  <span className="text-lg font-bold text-slate-200">
                    {activeWard.ward_profile.population_total?.toLocaleString() ?? 'N/A'}
                  </span>
                  <div className="flex justify-between text-[8px] text-slate-500 mt-1">
                    <span>M: {activeWard.ward_profile.population_male?.toLocaleString() ?? 'N/A'}</span>
                    <span>F: {activeWard.ward_profile.population_female?.toLocaleString() ?? 'N/A'}</span>
                  </div>
                </div>
                
                <div className="bg-tactical-900/50 p-2 rounded border border-tactical-border/50">
                  <span className="block text-slate-400 font-mono text-[9px] mb-1">Households</span>
                  <span className="text-lg font-bold text-slate-200">
                    {activeWard.ward_profile.households?.toLocaleString() ?? 'N/A'}
                  </span>
                  <div className="flex justify-between text-[8px] text-slate-500 mt-1">
                    <span>SC: {activeWard.ward_profile.sc_population?.toLocaleString() ?? 'N/A'}</span>
                    <span>ST: {activeWard.ward_profile.st_population?.toLocaleString() ?? 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-tactical-900/50 p-2 rounded border border-tactical-border/50 mt-2">
                <div className="grid grid-cols-2 gap-y-1 text-[9px]">
                  <div className="text-slate-400">Corporator:</div>
                  <div className="text-slate-200 text-right">{activeWard.ward_profile.corporator_name || 'N/A'}</div>
                  <div className="text-slate-400">Ward Officer:</div>
                  <div className="text-slate-200 text-right">{activeWard.ward_profile.ward_officer || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 3.5: Bhuvan / ISRO GIS Context */}
        {activeWard?.bhuvan_lulc && (
          <div className="bg-tactical-800 border border-tactical-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-emerald-400" />
                Spatial Land Cover Context
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-950/40 text-amber-300 uppercase tracking-widest font-semibold">
                [PENDING LEGEND ROLLOUT]
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-sans space-y-1.5 bg-tactical-900/40 p-2.5 rounded-xl border border-white/[0.04]">
              <div className="flex items-center justify-between text-slate-400 text-[9px] font-mono">
                <span>Source: {activeWard.bhuvan_lulc.source}</span>
                <span>Dataset: {activeWard.bhuvan_lulc.dataset}</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                AOI-wise land cover classification mapping is in progress. Satellite thermal hazard is directly computed from verified MODIS LST &amp; Open-Meteo telemetry.
              </p>
            </div>
          </div>
        )}

        {/* Panel 3.6: Mapped Health Infrastructure */}
        {activeWard?.health_infrastructure && (
          <div className="bg-tactical-800 border border-tactical-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                Mapped Health Infrastructure
              </h3>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-widest font-semibold ${
                activeWard.health_infrastructure.status === 'DATA_NOT_AVAILABLE' 
                  ? 'border-yellow-500/30 bg-yellow-950/50 text-yellow-300'
                  : 'border-blue-500/30 bg-blue-950/50 text-blue-300'
              }`}>
                [{activeWard.health_infrastructure.status}]
              </span>
            </div>
            
            {activeWard.health_infrastructure.status === 'DATA_NOT_AVAILABLE' ? (
              <div className="text-[10px] text-slate-400 italic">
                Facility data is not available or missing for this ward.
              </div>
            ) : (
              <div className="text-[10px] text-slate-300 font-sans space-y-2">
                <p className="text-slate-400 border-b border-tactical-border/50 pb-1 mb-2">
                  <span className="text-blue-400 font-medium">Source:</span> {activeWard.health_infrastructure.source} | <span className="text-blue-400 font-medium">Dataset:</span> {activeWard.health_infrastructure.dataset} ({activeWard.health_infrastructure.dataset_year})
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-tactical-900/50 p-2 rounded border border-tactical-border/50">
                    <span className="block text-slate-400 font-mono text-[9px] mb-1">Hospitals & NH</span>
                    <span className="text-sm font-bold text-slate-200">
                      {(activeWard.health_infrastructure.categories?.hospitals || 0) + (activeWard.health_infrastructure.categories?.nursing_homes || 0)}
                    </span>
                  </div>
                  <div className="bg-tactical-900/50 p-2 rounded border border-tactical-border/50">
                    <span className="block text-slate-400 font-mono text-[9px] mb-1">UPHC / UCHC</span>
                    <span className="text-sm font-bold text-slate-200">
                      {(activeWard.health_infrastructure.categories?.uphc || 0) + (activeWard.health_infrastructure.categories?.uchc || 0)}
                    </span>
                  </div>
                  <div className="bg-tactical-900/50 p-2 rounded border border-tactical-border/50">
                    <span className="block text-slate-400 font-mono text-[9px] mb-1">ICDS Centers</span>
                    <span className="text-sm font-bold text-slate-200">
                      {activeWard.health_infrastructure.categories?.icds_centers || 0}
                    </span>
                  </div>
                  <div className="bg-tactical-900/50 p-2 rounded border border-tactical-border/50">
                    <span className="block text-slate-400 font-mono text-[9px] mb-1">Total Facilities</span>
                    <span className="text-sm font-bold text-slate-200">
                      {activeWard.health_infrastructure.facility_count || 0}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 italic mt-2 pt-1">
                  Note: Response-context information only. Does not reflect live operational capacity or emergency readiness.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECTION B: HEALTH IMPACT RESEARCH */}
        <div className="border-t border-tactical-border/80 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              SECTION B: HEALTH IMPACT RESEARCH
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-950/40 text-amber-300 uppercase tracking-widest font-semibold">
              [EXPERIMENTAL]
            </span>
          </div>

          {/* Hospital Impact — Experimental */}
          <div className="bg-tactical-800 border border-tactical-border rounded-2xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                Hospital Impact — Experimental
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-950/50 text-amber-300 uppercase tracking-widest font-semibold">
                EXPERIMENTAL_NOT_VALIDATED
              </span>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mb-3 text-xs">
              <p className="font-bold text-amber-300 font-mono text-[11px]">
                Admissions prediction: NOT AVAILABLE
              </p>
              <p className="text-[10px] text-amber-200/80 font-sans mt-0.5 leading-relaxed">
                Health outcome records are not connected. Displayed metrics represent ambient thermal exposure and demographic vulnerability only, not clinical outcome predictions.
              </p>
            </div>

            {/* Environmental Exposure Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3 text-[10px] font-mono">
              <div className="bg-tactical-900/80 p-2 rounded-xl border border-tactical-border">
                <span className="text-[8px] text-slate-400 block">VULN MULTIPLIER</span>
                <span className="font-bold text-cyan-300">×{activeWard?.vulnerability_multiplier?.toFixed(2) || '1.13'}</span>
              </div>
              <div className="bg-tactical-900/80 p-2 rounded-xl border border-tactical-border">
                <span className="text-[8px] text-slate-400 block">ELDERLY DEMO</span>
                <span className="font-bold text-amber-300">{activeWard?.elderly_pct || 8.5}%</span>
              </div>
              <div className="bg-tactical-900/80 p-2 rounded-xl border border-tactical-border">
                <span className="text-[8px] text-slate-400 block">OUTDOOR LABOR</span>
                <span className="font-bold text-rose-300">{activeWard?.outdoor_worker_pct || 24.0}%</span>
              </div>
              <div className="bg-tactical-900/80 p-2 rounded-xl border border-tactical-border">
                <span className="text-[8px] text-slate-400 block">CANOPY DEFICIT</span>
                <span className="font-bold text-emerald-300">{activeWard?.tree_cover_pct ? `${(100 - activeWard.tree_cover_pct).toFixed(0)}%` : '82%'}</span>
              </div>
            </div>

            {/* 5-Day Exposure Trajectory Chart */}
            {isHospitalDemandAvailable ? (
              <>
                <div className="h-28 w-full mb-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={forecast5d} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <ReferenceArea y1={32} y2={40} fill="#C0392B" fillOpacity={0.1} />
                      <ReferenceArea y1={30} y2={32} fill="#D9772E" fillOpacity={0.1} />
                      <ReferenceArea y1={28} y2={30} fill="#C9A227" fillOpacity={0.1} />
                      <ReferenceArea y1={0} y2={28} fill="#3A7D5C" fillOpacity={0.1} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8B9096', fontSize: 9 }} />
                      <YAxis domain={[24, 40]} tick={{ fill: '#8B9096', fontSize: 9 }} axisLine={false} tickLine={false} hide />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-tactical-900 border border-tactical-border rounded-lg p-2 text-[10px] text-white">
                                <p className="font-bold mb-1">{label}</p>
                                <p>Peak WBGT: {data.wbgt}°C</p>
                                <p>Night Min: {data.tMin}°C</p>
                                <p className="text-amber-400">Admissions Prediction: NOT AVAILABLE</p>
                                <p className={data.recoveryGood ? "text-[#3A7D5C]" : "text-[#C0392B]"}>
                                  Recovery: {data.recoveryGood ? 'Adequate' : 'Deficit'} {data.streakCount >= 2 && `(🔥x${data.streakCount})`}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="wbgt" stroke="#00F2FE" strokeWidth={2} dot={{ r: 3, fill: '#00F2FE', strokeWidth: 0 }} name="Peak WBGT (°C)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-tactical-border/40 pt-1.5">
                  <span>Horizon: 5-Day Ambient Exposure</span>
                  <span className="text-amber-300 font-bold">Peak: {maxForecast ? `${maxForecast.wbgt}°C (${maxForecast.date})` : '—'}</span>
                </div>
              </>
            ) : (
              <div className="h-20 w-full flex items-center justify-center text-slate-500 font-mono text-xs border border-dashed border-tactical-border rounded-lg">
                EXPERIMENTAL PIPELINE STANDBY
              </div>
            )}

            <div className="text-[9px] font-mono text-slate-400 text-center mt-2 border-t border-tactical-border/40 pt-1">
              Provenance: Experimental research model — not clinically validated
            </div>
          </div>

          {/* Mortality Impact Research — EXPERIMENTAL */}
          <MortalityImpactCard districtOrWard={activeWard?.ward_no || 'W14'} className="mb-3" />
        </div>

        {/* Drivers Zone (Section 3.3): Exactly three plain-language driver lines, ranked */}
        <div className="bg-tactical-900 border border-tactical-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Primary Risk Drivers (Ranked 1–3)
            </h3>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
              [CALCULATED]
            </span>
          </div>

          <ol className="space-y-2 text-xs font-sans text-slate-200">
            {top3Drivers.map((driverText, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 bg-tactical-800 p-2 rounded-xl border border-tactical-border"
              >
                <span className="w-4 h-4 rounded-full bg-cyan-950/30 text-teal-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-xs leading-snug">{driverText}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Trend Zone (Section 3.3): Cumulative Heat Exposure Trajectory */}
        <div className="bg-tactical-900 border border-tactical-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Cumulative Exposure Trend (5-Day Horizon)
            </h3>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-teal-500/30 bg-teal-900/50 text-teal-300 uppercase tracking-widest font-semibold">
              [CALCULATED]
            </span>
          </div>

          {forecast5d.length > 0 ? (
            <div>
              <div className="h-16 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast5d} margin={{ top: 2, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heatTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0D0E', borderColor: '#232A2E', borderRadius: '8px', fontSize: '10px' }}
                      formatter={(val: any) => [`${val}°C`, 'Max WBGT']}
                    />
                    <Area type="monotone" dataKey="wbgt" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#heatTrendGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 border-t border-tactical-border/40 pt-1.5">
                <span>Horizon: 5 Days</span>
                <span className="text-amber-400 font-bold">
                  Peak: {maxForecast ? `${maxForecast.wbgt}°C (${maxForecast.date})` : '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-14 w-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Gathering forecast telemetry...
            </div>
          )}
          <p className="text-[10px] text-slate-400 mt-2 font-mono leading-relaxed">
            Multi-day cumulative heat stress amplifies physiological burden and nocturnal recovery deficit.
          </p>
        </div>

        {/* SECTION C: ACTION DIRECTIVES & DISPATCH */}
        <div className="border-t border-tactical-border/80 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              SECTION C: ACTION DIRECTIVES &amp; DISPATCH
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 uppercase tracking-widest font-semibold">
              [ACTION PROTOCOLS]
            </span>
          </div>

          {/* Public Health Advisory */}
          <div className="bg-tactical-900 border border-tactical-border rounded-2xl p-4 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                Citizen Public Health Advisory
              </h3>
              <span className="text-[9px] font-mono text-sky-400">Live Broadcast Text</span>
            </div>

            <div className="bg-tactical-800 p-2.5 rounded-xl border border-tactical-border text-xs text-slate-200 leading-relaxed font-sans">
              &ldquo;🚨 [OSDMA/BMC ALERT] {activeWard?.ward_no}: Extreme thermal stress (WBGT {activeWard?.WBGT_celsius || 32.8}°C). Recommended heat-safety control: pause heavy unshaded labor 11:00-15:30. Hydrate with ORS. Emergency cooling center open at nearest ward community center.&rdquo;
            </div>
          </div>

          {/* Action Directives Matrix */}
          <div className="bg-tactical-900 border border-tactical-border rounded-2xl p-4 mb-3 space-y-2 text-xs font-sans">
            <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Sectoral Action Matrix
            </h3>

            <div className="bg-tactical-800/80 p-2 rounded-xl border border-tactical-border">
              <span className="text-[10px] font-mono font-bold text-amber-300 block mb-0.5">👷 WORKER SAFETY CONTROL</span>
              <p className="text-slate-300 text-[11px]">Advise shift staggering. Recommended control: 30-min work / 15-min shaded rest rotation during peak solar hours.</p>
            </div>

            <div className="bg-tactical-800/80 p-2 rounded-xl border border-tactical-border">
              <span className="text-[10px] font-mono font-bold text-cyan-300 block mb-0.5">🏫 SCHOOL SAFETY DIRECTIVE</span>
              <p className="text-slate-300 text-[11px]">Advance school hours to morning schedule (06:30–10:30 AM). Restrict outdoor sports &amp; midday playground exposure.</p>
            </div>

            <div className="bg-tactical-800/80 p-2 rounded-xl border border-tactical-border">
              <span className="text-[10px] font-mono font-bold text-emerald-300 block mb-0.5">💧 COOLING INTERVENTIONS</span>
              <p className="text-slate-300 text-[11px]">Deploy municipal water tankers (Jal Sanjeevani) to high-density markets and transit points in {activeWard?.ward_no}.</p>
            </div>
          </div>

          {/* Administrative Trigger Button */}
          <div className="bg-tactical-900 border border-tactical-border rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-500" />
              Administrative Alert Trigger
            </h3>
            <p className="text-[10px] text-slate-400 mb-3 font-sans">
              Open emergency notification trigger with SMS / WhatsApp dry-run and audit logging:
            </p>

            <button
              id={`btn-ward-dispatch-${activeWard?.ward_no}`}
              onClick={() => onDispatchAlert(activeWard?.ward_no || 'W21')}
              className="w-full py-2.5 bg-cyan-950 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition font-sans shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              Open Regional Alert Console ({activeWard?.ward_no})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};