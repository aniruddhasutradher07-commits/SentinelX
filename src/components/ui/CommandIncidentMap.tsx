import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getApiUrl } from '../../services/apiConfig';

const INDIA_BOUNDS = L.latLngBounds(
  L.latLng(19.0, 84.0),
  L.latLng(22.0, 88.0)
);

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

interface CommandIncidentMapProps {
  activeHazards: any[];
  selectedHazard: any;
}

export function CommandIncidentMap({ activeHazards, selectedHazard }: CommandIncidentMapProps) {
  const [wardGeoJson, setWardGeoJson] = useState<any>(null);
  const [layerMode, setLayerMode] = useState<'LIVE' | 'HISTORICAL'>('LIVE');
  const [era5Variable, setEra5Variable] = useState<string>('temperature_c');
  const [era5Status, setEra5Status] = useState<string>('');
  
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/wards-geojson'))
      .then(res => res.json())
      .then(data => setWardGeoJson(data))
      .catch(err => console.error("Failed to load geojson", err));
  }, []);

  useEffect(() => {
    if (layerMode === 'HISTORICAL') {
      setEra5Status('FETCHING...');
      fetch(getApiUrl(`/api/v1/map/era5?date=2024-05-15&variable=${era5Variable}`))
        .then(res => res.json())
        .then(data => {
          setEra5Status(data.status); 
        })
        .catch(() => {
          setEra5Status('DATA_PENDING');
        });
    } else {
      setEra5Status('');
    }
  }, [layerMode, era5Variable]);

  useEffect(() => {
    if (mapRef.current && selectedHazard && selectedHazard.lat && selectedHazard.lon) {
      mapRef.current.flyTo([selectedHazard.lat, selectedHazard.lon], 11, { duration: 1 });
    } else if (mapRef.current) {
      mapRef.current.flyTo([20.296, 85.8245], 11, { duration: 1 });
    }
  }, [selectedHazard]);

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties;
    const wardNo = props.wardno || props.WardNo || props.OBJECTID;
    
    const popupContent = `
      <div class="text-slate-800 font-mono text-xs p-1">
        <strong class="block text-sm border-b pb-1 mb-1">Ward ${wardNo}</strong>
        ${layerMode === 'HISTORICAL' ? 
          `<div>ERA5 GRID <span class="text-slate-500">Nearest 0.25°</span></div>
           <div class="mt-1">
             <span class="text-slate-500 block">VALUE</span>
             <span class="text-rose-500 font-bold">${era5Status === 'DATA_PENDING' ? 'DATA PENDING' : 'N/A'}</span>
           </div>
           <div class="mt-1">
             <span class="text-slate-500 block">SOURCE</span>
             <span>ERA5 / Copernicus</span>
           </div>` 
          : 
          `<div class="mt-1">
             <span class="text-slate-500 block">LIVE HAZARD</span>
             <span class="${activeHazards.length > 0 ? 'text-amber-500' : 'text-slate-400'} font-bold">
               ${activeHazards.length > 0 ? activeHazards.length + ' Active Signal(s)' : 'NO ACTIVE HAZARD SIGNAL'}
             </span>
           </div>`
        }
      </div>
    `;
    
    layer.bindPopup(popupContent, { className: 'tactical-popup' });
  };

  const getStyle = () => {
    return {
      fillColor: layerMode === 'HISTORICAL' ? '#334155' : '#0ea5e9',
      weight: 1,
      opacity: 0.5,
      color: 'rgba(255,255,255,0.2)',
      fillOpacity: layerMode === 'HISTORICAL' ? 0.3 : 0.1,
    };
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-2 left-2 right-2 z-[1000] flex justify-between pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => setLayerMode('LIVE')}
            className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded border ${layerMode === 'LIVE' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-black/50 border-white/10 text-slate-400 hover:bg-white/5'}`}
          >
            LIVE OPERATIONAL LAYER
          </button>
          <button 
            onClick={() => setLayerMode('HISTORICAL')}
            className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded border ${layerMode === 'HISTORICAL' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-black/50 border-white/10 text-slate-400 hover:bg-white/5'}`}
          >
            HISTORICAL ERA5 LAYER
          </button>
        </div>

        {layerMode === 'HISTORICAL' && (
          <div className="pointer-events-auto">
            <select 
              value={era5Variable}
              onChange={(e) => setEra5Variable(e.target.value)}
              className="bg-black/80 border border-rose-500/30 text-rose-300 text-[10px] uppercase font-bold py-1 px-2 rounded outline-none"
            >
              <option value="temperature_c">Temperature</option>
              <option value="relative_humidity_pct">Humidity</option>
              <option value="apparent_temperature_c">Apparent Temperature</option>
              <option value="wind_speed_ms">Wind</option>
              <option value="precipitation_mm">Rainfall</option>
              <option value="pressure_hpa">Pressure</option>
              <option value="cloud_cover_pct">Cloud Cover</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 bg-[#071120] relative z-0">
        <MapContainer
          center={[20.296, 85.8245]}
          zoom={11}
          style={{ height: '100%', width: '100%', backgroundColor: '#071120' }}
          zoomControl={false}
          maxBounds={INDIA_BOUNDS}
          ref={mapRef}
        >
          <MapResizer />
          <TileLayer
            attribution='&copy; OSM'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />

          {wardGeoJson && (
            <GeoJSON 
              data={wardGeoJson} 
              style={getStyle} 
              onEachFeature={onEachFeature}
              key={layerMode + era5Status}
            />
          )}

        </MapContainer>
      </div>

      <div className="absolute bottom-2 left-2 z-[1000] pointer-events-none">
        {layerMode === 'HISTORICAL' ? (
           <div className="bg-black/80 p-2 rounded border border-rose-500/20 text-[10px] font-mono text-rose-400">
             <div className="font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {era5Status === 'DATA_PENDING' ? 'ERA5 DATA PENDING' : era5Status || 'ERA5 HISTORICAL LAYER'}
             </div>
             <div className="text-slate-500 mt-1 opacity-80">Extraction from Copernicus active...</div>
           </div>
        ) : (
           <div className="bg-black/80 p-2 rounded border border-cyan-500/20 text-[10px] font-mono text-cyan-400">
             <div className="font-bold flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${activeHazards.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-cyan-500'}`}></span>
                {activeHazards.length > 0 ? `${activeHazards.length} ACTIVE SIGNAL(S)` : 'NO ACTIVE HAZARD SIGNAL'}
             </div>
             {(!selectedHazard || (!selectedHazard.lat && !selectedHazard.lon)) && selectedHazard && (
                <div className="text-amber-500 mt-1">LOCATION DATA NOT AVAILABLE</div>
             )}
           </div>
        )}
      </div>

      <div className="absolute bottom-2 right-2 z-[1000] pointer-events-none">
        <div className="bg-black/80 p-2 rounded border border-white/10 text-[9px] font-mono text-slate-400">
          <div className="font-bold text-white mb-1 uppercase tracking-wider">
            {layerMode === 'HISTORICAL' ? era5Variable.split('_')[0] : 'Legend'}
          </div>
          {layerMode === 'HISTORICAL' ? (
            <div className="flex items-center gap-1 mt-1 opacity-50">
               <div className="w-full h-1.5 bg-gradient-to-r from-blue-500 via-yellow-500 to-rose-500 rounded px-8"></div>
               <span>{era5Variable.includes('pct') ? '%' : era5Variable.includes('c') ? '°C' : era5Variable.includes('mm') ? 'mm' : era5Variable.includes('ms') ? 'm/s' : 'hPa'}</span>
            </div>
          ) : (
             <div className="space-y-1 mt-1">
               <div className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-sm inline-block"></span> Alert Zone</div>
               <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#334155] rounded-sm inline-block"></span> Normal</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
