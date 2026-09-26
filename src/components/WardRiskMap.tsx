import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

export function WardRiskMap({ wards = [], activeDistrict = null, onWardSelect }: { wards?: any[], activeDistrict?: any, onWardSelect?: any }) {
  const [geoData, setGeoData] = useState(null);
  
  // Normalize ward ID from GeoJSON
  const normalizeWardId = (properties: any) => {
    if (!properties) return null;
    let raw = properties.wardno || properties.WARD_NO || properties.ward_no || properties.sno || properties.SNO;
    if (!raw) return null;
    raw = String(raw).trim().toUpperCase();
    return raw.startsWith('W') ? raw : `W${raw}`;
  };

  // Build a lookup map of backend wards
  const wardDataById = useMemo(() => {
    const map = new Map();
    if (wards) {
      wards.forEach(w => {
        if (w.ward_no) map.set(w.ward_no.toUpperCase(), w);
      });
    }
    return map;
  }, [wards]);

  useEffect(() => {
    fetch('/wards_bhubaneswar.geojson')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
      })
      .catch(err => {
        console.error("Failed to load geojson", err);
      });
  }, []);

  const getWardRiskColor = (wardNo: string) => {
    const ward = wardDataById.get(wardNo);
    if (!ward) return '#334155'; // Unknown/slate
    
    // Use actual backend data risk state
    const risk = ward.WardRiskScore || 0;
    if (risk >= 80) return '#e11d48'; // Extreme - rose
    if (risk >= 60) return '#ea580c'; // High - orange
    if (risk >= 40) return '#ca8a04'; // Elevated - yellow
    return '#16a34a'; // Low - green
  };

  const styleGeoJson = (feature: any) => {
    const wardNo = normalizeWardId(feature.properties);
    return {
      fillColor: wardNo ? getWardRiskColor(wardNo) : '#334155',
      weight: 1,
      opacity: 1,
      color: '#0f172a',
      dashArray: '',
      fillOpacity: 0.6
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const wardNo = normalizeWardId(feature.properties);
    const ward = wardNo ? wardDataById.get(wardNo) : null;
    
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#38bdf8',
          fillOpacity: 0.9
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(styleGeoJson(feature));
      },
      click: () => {
        if (ward && onWardSelect) {
          onWardSelect(ward);
        }
      }
    });

    if (ward) {
      const tooltipContent = `
        <div style="font-family: monospace; font-size: 11px;">
          <strong>WARD ${wardNo}</strong><br/>
          ${ward.zone || 'Unknown Zone'}<br/>
          Risk Score: ${ward.WardRiskScore || 'N/A'}<br/>
          Risk Tier: ${ward.RiskTier || 'N/A'}<br/>
          Temperature: ${ward.temperature_c || 'N/A'} °C<br/>
          WBGT: ${ward.WBGT_celsius || 'N/A'} °C<br/>
          UTCI: ${ward.UTCI_celsius || 'N/A'} °C
        </div>
      `;
      layer.bindTooltip(tooltipContent, { sticky: true });
    } else {
      layer.bindTooltip(`Ward geometry ID unavailable`, { sticky: true });
    }
  };

  const center = [20.296, 85.8245];

  return (
    <div className="w-full h-full min-h-[400px] relative rounded-lg overflow-hidden border border-slate-700/50 bg-[#071120]">
      <MapContainer 
        center={center as any} 
        zoom={11} 
        style={{ height: '100%', width: '100%', backgroundColor: '#071120' }}
        zoomControl={false}
      >
        <MapResizer />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {geoData && (
          <GeoJSON 
            data={geoData} 
            style={styleGeoJson}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      
      {/* Status Overlay */}
      <div className="absolute top-2 left-2 z-[400] flex gap-2">
        <div className="bg-[#071120]/90 text-[10px] font-mono text-slate-300 border border-slate-700/50 p-2 rounded backdrop-blur shadow-xl pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${wardDataById.size > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className="font-bold text-white tracking-wider">{wardDataById.size > 0 ? '67 WARDS' : 'NO WARDS'}</span>
          </div>
          <span className={wardDataById.size > 0 ? "text-emerald-400" : "text-rose-400"}>
            {wardDataById.size > 0 ? 'LIVE DATA' : 'DATA UNAVAILABLE'}
          </span>
        </div>
      </div>
      
      {/* Legend & Overlays */}
      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
        <div className="bg-[#040817]/90 backdrop-blur-md p-3 rounded border border-slate-700 text-[10px] font-mono text-slate-300">
          <div className="font-bold text-white mb-2 uppercase border-b border-slate-700 pb-1">Risk Legend</div>
          <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-rose-600 rounded-sm"></span> EXTREME (80+)</div>
          <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-orange-600 rounded-sm"></span> HIGH (60-79)</div>
          <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-yellow-600 rounded-sm"></span> ELEVATED (40-59)</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-600 rounded-sm"></span> LOW (0-39)</div>
        </div>
      </div>
      
      {!geoData && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-[#071120]/80">
          <div className="text-rose-500 font-mono text-sm border border-rose-500/30 bg-rose-950/50 px-4 py-2 rounded">
            WARD GEOMETRY UNAVAILABLE
          </div>
        </div>
      )}
    </div>
  );
}
