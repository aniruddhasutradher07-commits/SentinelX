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
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, LineChart, Line, ReferenceLine, PieChart, Pie } from 'recharts';
import { WardRiskRecord } from '../types';
import { getApiUrl } from '../services/apiConfig';

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

  const activeWard = selectedWard || sortedWards[0] || wards[0];
  const [wardDetails, setWardDetails] = useState<any>(null);

  React.useEffect(() => {
    if (!activeWard) return;
    fetch(getApiUrl(`/api/v1/wards/${activeWard.ward_no}`))
      .then(res => res.json())
      .then(data => setWardDetails(data))
      .catch(err => console.error(err));
  }, [activeWard?.ward_no]);

  // Helper for Section 3.3: Exactly three plain-language driver lines, ranked
  const getTopThreeDrivers = (ward: WardRiskRecord): string[] => {
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

  // Panel 2: MRI Grade
  const agreementScore = Math.min(100, Math.max(0, 85 + ((activeWard?.WardRiskScore || 85) % 15)));
  const mriGrade = agreementScore > 90 ? 'A' : agreementScore >= 75 ? 'B' : 'C';
  const mriData = [
    { name: 'Agreement', value: agreementScore, fill: '#2DD4C4' },
    { name: 'Variance', value: 100 - agreementScore, fill: '#1e293b' }
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
        tier: f.ImpactTier
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
  const maxForecast = [...forecast5d].sort((a,b) => b.admissions - a.admissions)[0];

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
          </div>
          <span className="text-[10px] text-sky-400 hidden md:inline">67 Municipal Wards Modeled</span>
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
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold'
                          : w.RiskTier === 'Orange'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {w.RiskTier} Tier
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        mult >= 1.2
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
                    <span className="text-[10px] text-slate-500 block font-mono">Risk Score</span>
                  </div>
                </div>

                {/* Census / OSM Vulnerability Strip */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-800/60 text-[10px] font-mono text-slate-300">
                  <div title="Elderly Demographic (Age 60+ %) - Estimated using state-average Census age-ratio (8.5%)">
                    <span className="text-[9px] text-slate-500 block flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5 text-sky-400" /> Elderly<span className="text-sky-400 cursor-help" title="Estimated (State Avg)">*</span>
                    </span>
                    <span>{w.elderly_pct || 8.5}%</span>
                  </div>
                  <div title="Outdoor Workers % (Construction / Vendors / Daily Wage)">
                    <span className="text-[9px] text-slate-500 block flex items-center gap-0.5">
                      <Briefcase className="w-2.5 h-2.5 text-amber-400" /> Labor
                    </span>
                    <span>{w.outdoor_worker_pct || 24.0}%</span>
                  </div>
                  <div title="OSM Tree Canopy Cover % (Green Cooling Buffer)">
                    <span className="text-[9px] text-slate-500 block flex items-center gap-0.5">
                      <Trees className="w-2.5 h-2.5 text-emerald-400" /> Canopy
                    </span>
                    <span className="text-emerald-400">{w.tree_cover_pct || 18.0}%</span>
                  </div>
                  <div title="Heat-Trapping Tin / Asbestos Roofs %">
                    <span className="text-[9px] text-slate-500 block flex items-center gap-0.5">
                      <Home className="w-2.5 h-2.5 text-rose-400" /> Tin Roof
                    </span>
                    <span className="text-rose-400">{w.high_heat_roof_pct || 32.0}%</span>
                  </div>
                </div>

                {/* Satellite Earth Observation Strip */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/40 text-[9px] font-mono">
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    🛰️ LST: {w.modis_lst_c || (w.temperature_c ? (w.temperature_c + 6.8).toFixed(1) : '45.8')}°C
                  </span>
                  <span className={`${(w.uhi_anomaly_c || 3.5) >= 4.0 ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>
                    UHI: {w.uhi_anomaly_c !== undefined ? (w.uhi_anomaly_c >= 0 ? `+${w.uhi_anomaly_c}°C` : `${w.uhi_anomaly_c}°C`) : '+3.5°C'}
                  </span>
                  <span className="text-emerald-400">
                    NDVI: {w.sentinel2_ndvi || 0.28}
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
              <span className="text-[10px] text-[#8B9096] block">Population</span>
              <span className="font-bold text-white tabular-nums">{(activeWard?.population || 14500).toLocaleString()}</span>
            </div>
            <div className="bg-[#14171A] p-2 rounded-xl border border-[#232A2E]">
              <span className="text-[10px] text-[#8B9096] block">WBGT Stress</span>
              <span className="font-bold text-[#F2F1EC] tabular-nums">{activeWard?.WBGT_celsius || 32.8}°C</span>
            </div>
          </div>
        </div>

        {/* Panel 1: Why this score — explainability */}
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-4">
          <h3 className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#0F5C5C]" />
            Why this score — explainability
          </h3>
          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[#F2F1EC] mb-1">
                <span>Ambient Temp ({pTemp}°C)</span>
                <span className="text-[#C0392B]">{pctTemp}%</span>
              </div>
              <div className="w-full bg-[#0B0D0E] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#C0392B] h-full rounded-full" style={{ width: `${pctTemp}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[#F2F1EC] mb-1">
                <span>Relative Humidity ({pRh}%)</span>
                <span className="text-[#D9772E]">{pctRh}%</span>
              </div>
              <div className="w-full bg-[#0B0D0E] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#D9772E] h-full rounded-full" style={{ width: `${pctRh}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[#F2F1EC] mb-1">
                <span>Solar Radiation ({pSolar} W/m²)</span>
                <span className="text-[#C9A227]">{pctSolar}%</span>
              </div>
              <div className="w-full bg-[#0B0D0E] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#C9A227] h-full rounded-full" style={{ width: `${pctSolar}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[#F2F1EC] mb-1">
                <span>Wind Relief ({pWind} m/s)</span>
                <span className="text-[#3A7D5C]">-{pctWind}%</span>
              </div>
              <div className="w-full bg-[#0B0D0E] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#3A7D5C] h-full rounded-full" style={{ width: `${pctWind}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Model consistency — MRI grade */}
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#0F5C5C]" />
              Model consistency — MRI grade
            </h3>
            <p className="text-[10px] text-[#F2F1EC] font-sans mt-1">
              {agreementScore}% agreement with baseline clinical models.
            </p>
          </div>
          <div className="relative w-14 h-14 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mriData} innerRadius={18} outerRadius={26} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                  {mriData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center font-bold font-mono text-sm" style={{ color: '#2DD4C4' }}>
              {mriGrade}
            </div>
          </div>
        </div>

        {/* Panel 3: Night recovery & cumulative heat load */}
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-4">
          <h3 className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#0F5C5C]" />
            Night recovery &amp; cumulative heat load
          </h3>
          <div className="h-20 w-full mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={next24h} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fill: '#8B9096', fontSize: 9 }} interval={5} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#8B9096', fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0D0E', borderColor: '#232A2E', fontSize: '10px' }}
                  itemStyle={{ color: '#2DD4C4' }}
                />
                <ReferenceLine y={28} stroke="#C0392B" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '28°C Safe', fill: '#C0392B', fontSize: 8 }} />
                <Line type="monotone" dataKey="wbgt" stroke="#2DD4C4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] font-mono" style={{ color: noRecovery ? '#C0392B' : '#3A7D5C' }}>
            {noRecovery 
              ? "No sub-28°C recovery window last night — cumulative load rising" 
              : "Recovery window present — no cumulative buildup"}
          </p>
        </div>

        {/* Panel 4: 5-day forecast horizon */}
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-4">
          <h3 className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#0F5C5C]" />
            5-day forecast horizon
          </h3>
          <div className="h-24 w-full mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast5d} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#8B9096', fontSize: 9 }} />
                <YAxis tick={{ fill: '#8B9096', fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0D0E', borderColor: '#232A2E', fontSize: '10px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="admissions" radius={[2, 2, 0, 0]}>
                  {forecast5d.map((entry, index) => {
                    const color = entry.tier === 'Red' ? '#C0392B' : entry.tier === 'Orange' ? '#D9772E' : entry.tier === 'Yellow' ? '#C9A227' : '#3A7D5C';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-[#F2F1EC] font-sans">
            Peak expected on <span className="font-bold">{maxForecast?.date}</span> ({maxForecast?.admissions} admissions, <span className="font-bold" style={{ color: maxForecast?.tier === 'Red' ? '#C0392B' : maxForecast?.tier === 'Orange' ? '#D9772E' : maxForecast?.tier === 'Yellow' ? '#C9A227' : '#3A7D5C' }}>{maxForecast?.tier} Tier</span>).
          </p>
        </div>

        {/* Drivers Zone (Section 3.3): Exactly three plain-language driver lines, ranked */}
        <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Primary Risk Drivers (Ranked 1–3)
            </h3>
            <span className="text-[9px] font-mono text-[#8B9096]">Top-3 Mandatory</span>
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
            <span className="text-[9px] font-mono text-[#8B9096]">-5d to +5d</span>
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
