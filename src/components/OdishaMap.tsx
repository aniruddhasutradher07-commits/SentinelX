import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Flame, 
  Droplets, 
  Wind, 
  Sun, 
  Activity, 
  Users, 
  AlertTriangle, 
  ChevronRight, 
  Sliders, 
  TrendingUp, 
  Calendar,
  Send
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { DistrictRiskRecord, DistrictImpactRecord } from '../types';

interface OdishaMapProps {
  districts: DistrictRiskRecord[];
  geoJson: any;
  onSelectDistrict: (district: DistrictRiskRecord) => void;
  onDispatchAlert: (districtName: string) => void;
}

export const OdishaMap: React.FC<OdishaMapProps> = ({
  districts,
  geoJson,
  onSelectDistrict,
  onDispatchAlert,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Khordha');
  const [metricMode, setMetricMode] = useState<'wbgt' | 'risk' | 'admissions' | 'temp'>('wbgt');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(12); // Noon peak default
  const [districtDetail, setDistrictDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Get unique districts list
  const uniqueDistricts = districts.reduce((acc: DistrictRiskRecord[], cur) => {
    if (!acc.some(d => d.district === cur.district)) {
      acc.push(cur);
    }
    return acc;
  }, []);

  // Sort by WBGT descending
  const sortedDistricts = [...uniqueDistricts].sort((a, b) => (b.WBGT_celsius || 0) - (a.WBGT_celsius || 0));

  const currentDistrict = uniqueDistricts.find(d => d.district.toLowerCase() === selectedDistrictName.toLowerCase()) || uniqueDistricts[0];

  // Fetch detailed district profile when selection changes
  useEffect(() => {
    if (!selectedDistrictName) return;
    setLoadingDetail(true);
    fetch(`/api/v1/districts/${encodeURIComponent(selectedDistrictName)}`)
      .then(res => res.json())
      .then(data => {
        setDistrictDetail(data);
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error('Failed to load district detail:', err);
        setLoadingDetail(false);
      });
  }, [selectedDistrictName]);

  // Color helper based on metric
  const getFeatureColor = (districtName: string) => {
    const dist = uniqueDistricts.find(d => d.district.toLowerCase() === districtName.toLowerCase());
    if (!dist) return '#334155';

    if (metricMode === 'wbgt') {
      const wbgt = dist.WBGT_celsius || 26;
      if (wbgt >= 32) return '#f43f5e'; // Red
      if (wbgt >= 30) return '#fb923c'; // Orange
      if (wbgt >= 28) return '#facc15'; // Yellow
      return '#34d399'; // Green
    }

    if (metricMode === 'risk') {
      const tier = dist.RiskTier;
      if (tier === 'Red') return '#f43f5e';
      if (tier === 'Orange') return '#fb923c';
      if (tier === 'Yellow') return '#facc15';
      return '#34d399';
    }

    if (metricMode === 'temp') {
      const temp = dist.temperature_c || 30;
      if (temp >= 40) return '#e11d48';
      if (temp >= 36) return '#ea580c';
      if (temp >= 32) return '#ca8a04';
      return '#059669';
    }

    // admissions
    const tier = dist.RiskTier;
    if (tier === 'Red' || tier === 'Orange') return '#f43f5e';
    if (tier === 'Yellow') return '#fb923c';
    return '#34d399';
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.4, 84.5], // Center of Odisha
        zoom: 7.2,
        minZoom: 6,
        maxZoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Dark Carto tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing layer if any
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    if (geoJson && geoJson.features) {
      const layer = L.geoJSON(geoJson, {
        style: (feature) => {
          const dname = feature?.properties?.dtname || feature?.properties?.district || feature?.properties?.NAME_2 || '';
          const isSelected = dname.toLowerCase() === selectedDistrictName.toLowerCase();
          return {
            fillColor: getFeatureColor(dname),
            weight: isSelected ? 2.5 : 1,
            opacity: 1,
            color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
            dashArray: isSelected ? '' : '2',
            fillOpacity: isSelected ? 0.85 : 0.65,
          };
        },
        onEachFeature: (feature, layer) => {
          const dname = feature?.properties?.dtname || feature?.properties?.district || feature?.properties?.NAME_2 || '';
          const dist = uniqueDistricts.find(d => d.district.toLowerCase() === dname.toLowerCase());

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({
                weight: 2,
                color: '#ffffff',
                fillOpacity: 0.9,
              });
            },
            mouseout: (e) => {
              if (geoJsonLayerRef.current) {
                geoJsonLayerRef.current.resetStyle(e.target);
              }
            },
            click: () => {
              setSelectedDistrictName(dname);
              if (dist) onSelectDistrict(dist);
            },
          });

          if (dist) {
            layer.bindTooltip(
              `<div class="text-xs font-sans">
                <div class="font-bold text-slate-100">${dname}</div>
                <div class="text-slate-300">WBGT: <b class="text-sky-300">${dist.WBGT_celsius}°C</b></div>
                <div class="text-slate-300">Risk: <b class="${
                  dist.RiskTier === 'Red' ? 'text-red-400' : dist.RiskTier === 'Orange' ? 'text-amber-400' : 'text-emerald-400'
                }">${dist.RiskTier}</b></div>
              </div>`,
              { sticky: true, className: 'leaflet-tooltip-dark' }
            );
          }
        },
      });

      layer.addTo(map);
      geoJsonLayerRef.current = layer;
    }
  }, [geoJson, uniqueDistricts, metricMode, selectedDistrictName]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Map Main Canvas */}
      <div className="flex-1 flex flex-col relative h-[50vh] lg:h-full">
        {/* Map Filter & Metric Toolbar Overlay */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
          <span className="text-[11px] font-mono text-slate-400 px-2 font-semibold">LAYER:</span>
          {(['wbgt', 'risk', 'admissions', 'temp'] as const).map((m) => (
            <button
              key={m}
              id={`btn-metric-${m}`}
              onClick={() => setMetricMode(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                metricMode === m
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {m === 'wbgt' && '🔥 WBGT (Physiology)'}
              {m === 'risk' && '🛡️ Composite Risk'}
              {m === 'admissions' && '🏥 Hospital Impact'}
              {m === 'temp' && '🌡️ Dry Bulb Temp'}
            </button>
          ))}
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-lg text-[11px] font-mono text-slate-300">
          <div className="font-semibold text-slate-200 mb-1.5 flex items-center justify-between gap-4">
            <span>THERMAL RISK TIER</span>
            <span className="text-[10px] text-slate-500">NDMA / WBGT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Green (&lt;28°C)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Yellow (28-30°C)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Orange (30-32°C)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Red (&gt;32°C)</span>
          </div>
        </div>

        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Right Sidebar: District Deep-Dive & Top Hotspots */}
      <div className="w-full lg:w-96 bg-slate-950/95 border-t lg:border-t-0 lg:border-l border-slate-800/80 flex flex-col h-[50vh] lg:h-full overflow-y-auto z-10 p-4 gap-4">
        {/* District Header Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase text-sky-400 font-semibold tracking-wide">
              DISTRICT PROFILE · ODISHA
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              currentDistrict?.RiskTier === 'Red'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : currentDistrict?.RiskTier === 'Orange'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {currentDistrict?.RiskTier || 'Yellow'} Tier
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <h2 className="text-2xl font-bold font-display text-white tracking-tight">
              {currentDistrict?.district || 'Khordha'}
            </h2>
            <div className="text-right">
              <span className="text-3xl font-mono font-black text-amber-400">
                {currentDistrict?.WBGT_celsius || 31.8}°
              </span>
              <span className="text-xs text-slate-400 block -mt-1 font-mono">WBGT Index</span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Flame className="w-3 h-3 text-rose-400" /> Air Temp
              </div>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {currentDistrict?.temperature_c || 38.5}°C
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Droplets className="w-3 h-3 text-sky-400" /> Humidity
              </div>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {currentDistrict?.relative_humidity_pct || 75}%
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Users className="w-3 h-3 text-emerald-400" /> Pop (Est)
              </div>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {((currentDistrict?.population_2011_est || 1500000) / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>

          {/* Alert Dispatch Action */}
          <button
            id={`btn-dispatch-${currentDistrict?.district || 'Khordha'}`}
            onClick={() => onDispatchAlert(currentDistrict?.district || 'Khordha')}
            className="w-full mt-3 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            Dispatch District SMS/IVRS Alert
          </button>
        </div>

        {/* Hospital Surge Forecast (5-Day DLNM+XGBoost) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-400" />
              5-Day Hospital Admission Surge
            </span>
            <span className="text-[10px] font-mono text-slate-400">2-Stage DLNM</span>
          </div>

          {districtDetail?.hospital_impact_forecast && districtDetail.hospital_impact_forecast.length > 0 ? (
            <div className="h-32 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtDetail.hospital_impact_forecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(v) => v.slice(5)} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelFormatter={(v) => `Date: ${v}`}
                    formatter={(val: any) => [`${val} admissions/day`, 'Predicted Surge']}
                  />
                  <Bar dataKey="predicted_admissions" radius={[4, 4, 0, 0]}>
                    {districtDetail.hospital_impact_forecast.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.ImpactTier === 'Red' ? '#f43f5e' : entry.ImpactTier === 'Orange' ? '#fb923c' : '#facc15'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-4 text-center">Loading surge projections...</div>
          )}
        </div>

        {/* Top 5 Thermal Hotspots Leaderboard */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Statewide Thermal Hotspots
            </span>
            <span className="text-[10px] font-mono text-slate-400">Peak WBGT</span>
          </div>

          <div className="space-y-2">
            {sortedDistricts.slice(0, 5).map((dist, idx) => (
              <div
                key={dist.district}
                id={`hotspot-row-${dist.district}`}
                onClick={() => setSelectedDistrictName(dist.district)}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                  dist.district.toLowerCase() === selectedDistrictName.toLowerCase()
                    ? 'bg-sky-500/15 border border-sky-500/40 text-white'
                    : 'bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-400">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold font-sans">{dist.district}</div>
                    <div className="text-[10px] text-slate-500">{dist.RiskTier} Alert Tier</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-amber-400">{dist.WBGT_celsius}°C</span>
                  <ChevronRight className="w-3.5 h-3.5 inline ml-1 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
