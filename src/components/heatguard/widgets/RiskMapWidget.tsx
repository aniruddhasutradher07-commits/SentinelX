import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { WardRiskRecord } from '../../../types';
import { getApiUrl } from '../../../services/apiConfig';

interface RiskMapWidgetProps {
  wards: WardRiskRecord[];
  activeWard: WardRiskRecord;
  onWardSelect: (wardNo: number) => void;
}

export default function RiskMapWidget({ wards, activeWard, onWardSelect }: RiskMapWidgetProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [wardGeoJson, setWardGeoJson] = useState<any>(null);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/wards-geojson'))
      .then(res => res.json())
      .then(data => setWardGeoJson(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.296, 85.824], // Bhubaneswar
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);
      mapInstanceRef.current = map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    }
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !wardGeoJson || !wardGeoJson.features) return;
    const map = mapInstanceRef.current;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const layer = L.geoJSON(wardGeoJson, {
      style: (feature) => {
        const wardNo = feature?.properties?.wardno || '';
        const wardStr = String(wardNo).replace('Ward ', '');
        const ward = wards.find(w => String(w.ward_no).replace('Ward ', '') === wardStr);
        
        const tier = (ward?.RiskTier || 'MODERATE').toUpperCase();
        const isActive = activeWard && String(activeWard.ward_no).replace('Ward ', '') === wardStr;

        const fillColor = (tier === 'RED' || tier === 'EXTREME') ? '#ef4444'
          : (tier === 'ORANGE' || tier === 'HIGH' || tier === 'SEVERE') ? '#f97316'
          : (tier === 'YELLOW' || tier === 'MODERATE') ? '#eab308'
          : '#22c55e';

        return {
          fillColor,
          weight: isActive ? 2 : 1,
          opacity: 1,
          color: isActive ? '#00F2FE' : 'rgba(255,255,255,0.2)',
          fillOpacity: isActive ? 0.8 : 0.4,
        };
      },
      onEachFeature: (feature, layer) => {
        const wardNo = feature?.properties?.wardno || '';
        const wardStr = String(wardNo).replace('Ward ', '');
        const ward = wards.find(w => String(w.ward_no).replace('Ward ', '') === wardStr);
        
        if (ward) {
          layer.bindTooltip(
            `<div class="text-xs font-sans">
              <div class="font-bold text-slate-100 flex items-center justify-between gap-3">
                <span>Ward ${wardStr}</span>
              </div>
              <div class="text-slate-300 mt-0.5">Risk Score: <b class="text-cyan-400 font-mono">${Math.round(ward.WardRiskScore || 0)}</b></div>
            </div>`,
            { sticky: true, className: 'leaflet-tooltip-dark' }
          );
        }

        layer.on({
          mouseover: (e: any) => {
            const l = e.target;
            l.setStyle({ weight: 2, color: '#00F2FE', fillOpacity: 0.8 });
          },
          mouseout: (e: any) => {
            if (geoJsonLayerRef.current) geoJsonLayerRef.current.resetStyle(e.target);
          },
          click: () => {
            const parsed = parseInt(wardStr, 10);
            if (!isNaN(parsed)) {
              onWardSelect(parsed);
            }
          },
        });
      },
    });

    layer.addTo(map);
    geoJsonLayerRef.current = layer;
  }, [wardGeoJson, wards, activeWard, onWardSelect]);

  return (
    <div className="w-full h-full relative min-h-[400px] xl:min-h-[500px]">
      
      {/* MAP LAYER */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-[#07090c]"></div>
      
      {/* OVERLAY: Map Header */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <h3 className="text-xl font-bold text-white drop-shadow-md">Bhubaneswar Urban Core</h3>
        <p className="text-sm font-medium text-gray-300 drop-shadow-md">Select a ward to view vulnerability profile</p>
      </div>

      <div className="absolute top-4 right-14 z-[1000] flex flex-col items-end gap-2 pointer-events-none">
        <span className="text-[10px] font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded border border-gray-300 uppercase tracking-widest shadow-sm">
          [OBSERVED / GIS] Ward Boundaries
        </span>
        <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-1 rounded border border-cyan-300 uppercase tracking-widest shadow-sm">
          [LIVE] Telemetry
        </span>
      </div>

      {/* OVERLAY: Legend */}
      <div className="absolute bottom-4 left-4 bg-[#0f1115]/90 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-xl z-[1000]">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Risk Tier</div>
        <div className="flex flex-col gap-3 text-xs font-semibold text-white">
          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded bg-emerald-500"></span> Low</div>
          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded bg-yellow-500"></span> Moderate</div>
          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded bg-orange-500"></span> High</div>
          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded bg-red-500"></span> Extreme</div>
        </div>
      </div>
      
    </div>
  );
}
