import React, { useEffect, useRef } from 'react';
import { Map, Marker, config } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Fix for Vite dev server worker resolution error (net::ERR_FAILED)
config.WORKER_URL = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl-csp-worker.js";

export function HazardMapLibre() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite'
          }
        ]
      },
      center: [85.8245, 20.296], // Bhubaneswar
      zoom: 12,
      pitch: 45, // Add a bit of 3D tilt for tactical feel
      bearing: -17.6,
      attributionControl: false
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add a GeoJSON source for the hazard plume (approximated as a circle using turf or simple polygon)
      // Since we don't have turf, we can just use a large point with a huge blurred circle radius
      map.current.addSource('hazard-plume', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { heat: 100 },
              geometry: {
                type: 'Point',
                coordinates: [85.8245, 20.296]
              }
            },
            {
              type: 'Feature',
              properties: { heat: 70 },
              geometry: {
                type: 'Point',
                coordinates: [85.88, 20.32] // Industrial area approx
              }
            }
          ]
        }
      });

      // Add heatmap layer
      map.current.addLayer({
        id: 'hazard-heat',
        type: 'heatmap',
        source: 'hazard-plume',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'heat'],
            0, 0,
            100, 1
          ],
          'heatmap-intensity': 1.5,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(8, 20, 44, 0)',
            0.2, '#3A7D5C',
            0.4, '#C9A227',
            0.6, '#D9772E',
            0.8, '#C0392B',
            1, 'rgba(255, 0, 0, 1)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9, 50,
            15, 300
          ],
          'heatmap-opacity': 0.8
        }
      });

      // Add pulsating marker at core
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-full bg-rose-500/50 border-2 border-rose-400 flex items-center justify-center animate-ping';
      const innerEl = document.createElement('div');
      innerEl.className = 'w-2 h-2 rounded-full bg-white';
      el.appendChild(innerEl);

      new Marker({ element: el })
        .setLngLat([85.8245, 20.296])
        .addTo(map.current);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 top-12 bottom-0 w-full rounded-lg overflow-hidden border border-white/10">
      <div ref={mapContainer} className="w-full h-full brightness-[0.7] contrast-[1.2] saturate-[0.8]" />
      
      {/* Overlay UI elements */}
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-cyan-500/20 text-[9px] font-mono shadow-[0_0_15px_rgba(0,255,255,0.05)] text-cyan-400 space-y-1 text-right pointer-events-none">
        <div>SYSTEM: <span className="text-white">MAPLIBRE GL</span></div>
        <div>PROJECTION: <span className="text-white">MERCATOR (PITCH: 45°)</span></div>
        <div>HEATMAP: <span className="text-rose-400 animate-pulse">ACTIVE REAL-TIME</span></div>
      </div>
      
      {/* Overlay crosshair in center for tactical feel */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className="w-8 h-8 border border-white/20 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-white/50 rounded-full"></div>
         </div>
         <div className="absolute w-[1px] h-full bg-white/5"></div>
         <div className="absolute w-full h-[1px] bg-white/5"></div>
      </div>
    </div>
  );
}
