import React, { useEffect, useState } from 'react';
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
    const ward = wards.find((w: any) => w.ward_no === wardNo);
    if (!ward) return '#334155'; // Unknown/slate
    
    // Use actual backend data risk state
    const risk = ward.WardRiskScore || 0;
    if (risk >= 80) return '#e11d48'; // Extreme - rose
    if (risk >= 60) return '#ea580c'; // High - orange
    if (risk >= 40) return '#ca8a04'; // Elevated - yellow
    return '#16a34a'; // Low - green
  };

  const styleGeoJson = (feature: any) => {
    const wardNo = feature.properties?.WARD_NO || feature.properties?.ward_no;
    return {
      fillColor: getWardRiskColor(wardNo),
      weight: 1,
      opacity: 1,
      color: '#0f172a',
      dashArray: '3',
      fillOpacity: 0.6
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const wardNo = feature.properties?.WARD_NO || feature.properties?.ward_no;
    const ward = wards.find((w: any) => w.ward_no === wardNo);
    
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#38bdf8',
          dashArray: '',
          fillOpacity: 0.8
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(styleGeoJson(feature));
      },
      click: () => {
        if (onWardSelect && ward) {
          onWardSelect(ward);
        }
      }
    });

    if (ward) {
      layer.bindTooltip(`Ward ${wardNo} - ${ward.telemetry?.status || 'UNKNOWN'}<br/>Temp: ${ward.temperature_c || 'N/A'}°C`, { sticky: true });
    } else {
      layer.bindTooltip(`Ward ${wardNo} - No Data`, { sticky: true });
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
