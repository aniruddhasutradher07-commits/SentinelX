import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Hospital, 
  LifeBuoy, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  RefreshCw, 
  ShieldAlert, 
  Building2,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { getApiUrl } from '../../services/apiConfig';
import { StatCard } from '../ui/StatCard';
import { SectionHeader } from '../ui/SectionHeader';

interface WardCoolingGap {
  ward_no: string;
  ward_name: string;
  temperature_c: number;
  vulnerability_score: number;
  population: number;
  exposure_tier: string;
  cooling_access_tier: string;
  nearest_cooling_center: string;
  nearest_distance_km: number;
  nearest_capacity: number;
  priority_recommendation: string;
  provenance: string;
}

interface CoolingGapsApiResponse {
  status: string;
  provenance: string;
  catalogs_provenance: string;
  summary: {
    total_wards_evaluated: number;
    deficit_wards_count: number;
    adequate_wards_count: number;
    active_cooling_centers_catalog: number;
  };
  wards: WardCoolingGap[];
  available_cooling_centers: Array<{
    name: string;
    lat: number;
    lon: number;
    capacity: number;
    type: string;
  }>;
}

interface HospitalRoute {
  hospital_name: string;
  trauma_level: string;
  bed_capacity: number;
  emergency_contact: string;
  straight_line_distance_km: number;
  estimated_transit_minutes: number;
  response_priority_tier: string;
  provenance: string;
}

interface EmergencyRoutingApiResponse {
  status: string;
  provenance: string;
  catalogs_provenance: string;
  advisory_disclaimer: string;
  origin_ward: {
    ward_no: string;
    ward_name: string;
    temperature_c: number;
    vulnerability_score: number;
  };
  primary_recommended_hospital: HospitalRoute;
  all_nearby_hospitals: HospitalRoute[];
}

export default function ResourceAllocationTab() {
  const [gapsData, setGapsData] = useState<CoolingGapsApiResponse | null>(null);
  const [selectedWard, setSelectedWard] = useState<string>('Ward 18');
  const [routingData, setRoutingData] = useState<EmergencyRoutingApiResponse | null>(null);
  
  const [loadingGaps, setLoadingGaps] = useState<boolean>(false);
  const [loadingRouting, setLoadingRouting] = useState<boolean>(false);
  const [filterTier, setFilterTier] = useState<string>('ALL');

  const fetchCoolingGaps = async () => {
    setLoadingGaps(true);
    try {
      const res = await fetch(getApiUrl('/api/v1/resource-allocation/cooling-gaps'));
      const json = await res.json();
      if (json.status === 'success') {
        setGapsData(json);
      }
    } catch (e) {
      console.error('Failed to fetch cooling gaps:', e);
    } finally {
      setLoadingGaps(false);
    }
  };

  const fetchEmergencyRouting = async (targetWard: string) => {
    setLoadingRouting(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/resource-allocation/emergency-routing?ward=${encodeURIComponent(targetWard)}`));
      const json = await res.json();
      if (json.status === 'success') {
        setRoutingData(json);
      }
    } catch (e) {
      console.error('Failed to fetch emergency routing:', e);
    } finally {
      setLoadingRouting(false);
    }
  };

  useEffect(() => {
    fetchCoolingGaps();
    fetchEmergencyRouting(selectedWard);
  }, []);

  const handleWardChange = (ward: string) => {
    setSelectedWard(ward);
    fetchEmergencyRouting(ward);
  };

  const filteredWards = gapsData?.wards.filter(w => {
    if (filterTier === 'ALL') return true;
    return w.cooling_access_tier === filterTier;
  }) || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-wide">Cooling-Center Optimization & Emergency Routing</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
              [CALCULATED]
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
              [SYNTHETIC CATALOGS]
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Detect ward-level cooling access deficits, optimize temporary shelter deployments, and view advisory emergency hospital transport routes.
          </p>
        </div>
        <button
          onClick={() => { fetchCoolingGaps(); fetchEmergencyRouting(selectedWard); }}
          disabled={loadingGaps || loadingRouting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-cyan-900/30 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loadingGaps || loadingRouting ? 'animate-spin' : ''}`} />
          Refresh Optimization Engine
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Wards Audited"
          value={gapsData?.summary.total_wards_evaluated || 10}
          icon={Building2}
          subtitle="Bhubaneswar Centroids (67 Grid)"
        />
        <StatCard
          title="Cooling Access Deficit"
          value={gapsData?.summary.deficit_wards_count || 4}
          icon={ShieldAlert}
          subtitle="Requires Temp Canopy & ORS"
        />
        <StatCard
          title="Active Cooling Hubs"
          value={gapsData?.summary.active_cooling_centers_catalog || 7}
          icon={LifeBuoy}
          subtitle="Fixed Relief Shelters Catalog"
        />
        <StatCard
          title="Tertiary Trauma Centers"
          value={routingData?.all_nearby_hospitals.length || 7}
          icon={Hospital}
          subtitle="Emergency Hospitals Network"
        />
      </div>

      {/* Section 1: Cooling-Center Gap Matrix */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <SectionHeader title="Cooling-Center Gap Optimization Matrix" icon={MapPin} />
              <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
                [CALCULATED]
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Cross-references ward thermal stress + population density with distance to nearest fixed cooling center.
            </p>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 ml-1.5" />
            {['ALL', 'DEFICIT', 'MARGINAL', 'ADEQUATE'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterTier === tier
                    ? tier === 'DEFICIT'
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                      : tier === 'MARGINAL'
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      : tier === 'ADEQUATE'
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                      : 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Wards Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ward / Area</th>
                <th className="py-3 px-4">Peak Temp</th>
                <th className="py-3 px-4">Exposure Tier</th>
                <th className="py-3 px-4">Nearest Cooling Center</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Access Status</th>
                <th className="py-3 px-4 text-right">Priority Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredWards.map((w) => (
                <tr key={w.ward_no} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-medium text-white">
                    <div className="font-semibold">{w.ward_no}</div>
                    <div className="text-xs text-slate-400">{w.ward_name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-rose-400 font-bold">{w.temperature_c}°C</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      w.exposure_tier === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      w.exposure_tier === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-700/50 text-slate-300'
                    }`}>
                      {w.exposure_tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-200">{w.nearest_cooling_center}</td>
                  <td className="py-3.5 px-4 text-cyan-300">{w.nearest_distance_km} km</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                      w.cooling_access_tier === 'DEFICIT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      w.cooling_access_tier === 'MARGINAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {w.cooling_access_tier === 'DEFICIT' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                      {w.cooling_access_tier === 'ADEQUATE' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {w.cooling_access_tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                      w.cooling_access_tier === 'DEFICIT' 
                        ? 'bg-rose-950/60 text-rose-200 border-rose-700/60 font-semibold' 
                        : 'bg-slate-800/80 text-slate-300 border-slate-700'
                    }`}>
                      {w.priority_recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Emergency Hospital Advisory Routing */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <SectionHeader title="Emergency Medical Hospital Advisory Routing" icon={Navigation} />
              <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
                [CALCULATED]
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Provides straight-line Haversine distance and urban ambulance transit time estimates for heatstroke triage.
            </p>
          </div>

          {/* Ward Selection Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Origin Ward:</span>
            <select
              value={selectedWard}
              onChange={(e) => handleWardChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
            >
              {gapsData?.wards.map((w) => (
                <option key={w.ward_no} value={w.ward_no}>
                  {w.ward_no} ({w.ward_name})
                </option>
              )) || [
                <option key="Ward 18" value="Ward 18">Ward 18 (Baramunda Bus Stand)</option>,
                <option key="Ward 42" value="Ward 42">Ward 42 (Khandagiri Slum)</option>,
                <option key="Ward 60" value="Ward 60">Ward 60 (Rasulgarh Industrial)</option>
              ]}
            </select>
          </div>
        </div>

        {/* Disclaimer Warning Box */}
        <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">ADVISORY ONLY NOTICE: </span>
            {routingData?.advisory_disclaimer || "Advisory dispatch recommendation only. Does not trigger live 108 emergency CAD API."}
          </div>
        </div>

        {/* Primary Hospital Card & Alternative Hospitals Grid */}
        {routingData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Recommended Hospital (Large Highlight Card) */}
            <div className="lg:col-span-1 bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" /> Primary Recommended Facility
                </span>
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                  {routingData.primary_recommended_hospital.response_priority_tier}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{routingData.primary_recommended_hospital.hospital_name}</h3>
                <p className="text-xs text-cyan-300 font-medium mt-1">
                  {routingData.primary_recommended_hospital.trauma_level}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-400 text-xs block">Straight-Line Dist</span>
                  <span className="text-lg font-bold text-cyan-300 font-mono">
                    {routingData.primary_recommended_hospital.straight_line_distance_km} km
                  </span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-400 text-xs block">Est. Transit Time</span>
                  <span className="text-lg font-bold text-amber-300 font-mono flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-400 inline" />
                    {routingData.primary_recommended_hospital.estimated_transit_minutes} min
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Total Bed Capacity:</span>
                  <span className="font-semibold text-white">{routingData.primary_recommended_hospital.bed_capacity} Beds</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Trauma Hotline:</span>
                  <span className="font-semibold text-cyan-300 flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                    {routingData.primary_recommended_hospital.emergency_contact}
                  </span>
                </div>
              </div>
            </div>

            {/* Alternative Tertiary Hospitals List */}
            <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Hospital className="w-4 h-4 text-cyan-400" />
                Alternative Nearby Medical Centers ({routingData.all_nearby_hospitals.length - 1} Backup Centers)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {routingData.all_nearby_hospitals.slice(1).map((h) => (
                  <div key={h.hospital_name} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl space-y-2 transition-all">
                    <div className="flex justify-between items-start">
                      <h5 className="font-semibold text-sm text-slate-200">{h.hospital_name}</h5>
                      <span className="text-xs font-mono text-cyan-400 font-semibold">{h.straight_line_distance_km} km</span>
                    </div>
                    <p className="text-xs text-slate-400">{h.trauma_level} • {h.bed_capacity} Beds</p>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-amber-400 font-medium">~{h.estimated_transit_minutes} min transit</span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-slate-400" /> {h.emergency_contact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
