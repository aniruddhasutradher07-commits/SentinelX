import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React/Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom animated pulsing marker for hot zones
const pulseIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="position:relative;">
          <div class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-rose-500 opacity-75" style="top:-12px; left:-12px;"></div>
          <div class="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border border-white" style="top:-6px; left:-6px;"></div>
         </div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});



// Ensure the map resizes properly when container changes
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

export function LiveRadarMap({ peakTemp = 42.5 }: { peakTemp?: number }) {
  const center: [number, number] = [20.296, 85.8245]; // Bhubaneswar

  return (
    <div className="absolute inset-0 top-12 bottom-0 w-full rounded-lg overflow-hidden border border-white/10 bg-[#071120]">
      
      {/* Dark Tactical Map Base */}
      <MapContainer 
        center={center} 
        zoom={10} 
        style={{ height: '100%', width: '100%', backgroundColor: '#071120' }}
        zoomControl={false}
      >
        <MapResizer />
        
        {/* OpenStreetMap Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Main Hotspot Marker */}
        <Marker position={center} icon={pulseIcon}>
          <Popup className="tactical-popup">
            <div className="text-slate-800 font-mono text-xs">
              <strong className="block text-sm border-b pb-1 mb-1">Bhubaneswar Core</strong>
              Temp: <span className="text-rose-600 font-bold">{peakTemp}°C</span><br/>
              Status: <span className="text-orange-500">Critical Heat Plume</span>
            </div>
          </Popup>
        </Marker>

        {/* Secondary Marker (Industrial Area) */}
        <Marker position={[20.35, 85.88]} icon={pulseIcon}>
          <Popup className="tactical-popup">
            <div className="text-slate-800 font-mono text-xs">
              <strong className="block text-sm border-b pb-1 mb-1">Industrial Sector</strong>
              Temp: <span className="text-orange-600 font-bold">{(peakTemp - 3).toFixed(1)}°C</span><br/>
              Status: <span className="text-yellow-600">Elevated Thermal Stress</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Tactical Overlays */}
      <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md p-3 rounded-lg border border-cyan-500/20 text-[10px] font-mono shadow-[0_0_15px_rgba(0,255,255,0.05)] text-cyan-400 space-y-1">
           <div className="text-white font-bold block border-b border-cyan-500/20 pb-1 mb-1 uppercase tracking-wider">Live Radar Link</div>
           <div>SYSTEM: <span className="text-white">RAINVIEWER API</span></div>
           <div>BASE: <span className="text-white">CARTO DARK MATTER</span></div>
           <div className="mt-2 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse block"></span>
             <span className="text-cyan-300">RECEIVING LIVE FEED...</span>
           </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[1000] pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-rose-500/30 text-[9px] font-mono shadow-[0_0_15px_rgba(225,29,72,0.1)] text-rose-400 flex items-center gap-2">
           <span className="animate-ping w-1.5 h-1.5 rounded-full bg-rose-500 block"></span>
           LIVE INTERACTIVE MAP
        </div>
      </div>
    </div>
  );
}
