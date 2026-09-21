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
  Send,
  Globe,
  Layers,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { DistrictRiskRecord } from '../types';
import { getApiUrl } from '../services/apiConfig';

interface OdishaMapProps {
  districts: DistrictRiskRecord[];
  geoJson: any;
  wardData?: any[];
  wardGeoJson?: any;
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
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const wardLayerRef = useRef<L.GeoJSON | null>(null);
  const pulseMarkersRef = useRef<L.LayerGroup | null>(null);
  const coolingLayerRef = useRef<L.LayerGroup | null>(null);
  const hospitalLayerRef = useRef<L.LayerGroup | null>(null);
  const routingPolylineLayerRef = useRef<L.LayerGroup | null>(null);
  const underservedOverlayRef = useRef<L.LayerGroup | null>(null);

  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Khordha');
  const [metricMode, setMetricMode] = useState<'wbgt' | 'risk' | 'vulnerability' | 'lst' | 'uhi' | 'admissions' | 'temp'>('wbgt');
  const [baseMapStyle, setBaseMapStyle] = useState<'dark' | 'satellite'>('dark');
  const [districtDetail, setDistrictDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [wardGeoJson, setWardGeoJson] = useState<any>(null);
  const [wardData, setWardData] = useState<any[]>([]);
  const [showWards, setShowWards] = useState<boolean>(false);

  const [activeLayers, setActiveLayers] = useState({
    thermal_stress: true,
    vulnerability: true,
    cooling_centers: true,
    emergency_routing: true,
  });
  const [showUnderservedHighRisk, setShowUnderservedHighRisk] = useState<boolean>(false);
  const [coolingGaps, setCoolingGaps] = useState<any[]>([]);
  const [coolingCentersCatalog, setCoolingCentersCatalog] = useState<any[]>([]);
  const [hospitalsCatalog, setHospitalsCatalog] = useState<any[]>([]);

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
    fetch(getApiUrl(`/api/v1/districts/${encodeURIComponent(selectedDistrictName)}`))
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

  // Color helper based on metric using PRD Risk & Operations palette
  const getFeatureColor = (districtName: string) => {
    const dist = uniqueDistricts.find(d => d.district.toLowerCase() === districtName.toLowerCase());
    if (!dist) return '#1e293b';

    if (metricMode === 'vulnerability') {
      const mult = dist.vulnerability_multiplier || 1.0;
      if (mult >= 1.25) return '#9333ea'; // Purple (Extreme compound vulnerability)
      if (mult >= 1.10) return '#C0392B'; // Red (High vulnerability)
      if (mult >= 0.95) return '#D9772E'; // Orange (Moderate)
      return '#3A7D5C'; // Resilient green canopy buffer
    }

    if (metricMode === 'lst') {
      const lst = dist.modis_lst_c || (dist.temperature_c ? dist.temperature_c + 7.2 : 44.5);
      if (lst >= 48) return '#7e22ce'; // Deep Purple (Extreme Radiant Skin Heat)
      if (lst >= 44) return '#C0392B'; // Red
      if (lst >= 40) return '#D9772E'; // Orange
      return '#3A7D5C'; // Resilient Cool buffer
    }

    if (metricMode === 'uhi') {
      const uhi = dist.uhi_anomaly_c !== undefined ? dist.uhi_anomaly_c : ((dist.temperature_c || 38) > 38 ? 3.6 : 1.2);
      if (uhi >= 4.0) return '#7e22ce'; // Extreme Hotspot
      if (uhi >= 2.5) return '#C0392B'; // High UHI
      if (uhi >= 1.0) return '#C9A227'; // Moderate
      return '#3A7D5C'; // Cooling Buffer
    }

    if (metricMode === 'wbgt') {
      const wbgt = dist.WBGT_celsius || 26;
      if (wbgt >= 32) return '#C0392B'; // Red
      if (wbgt >= 30) return '#D9772E'; // Orange
      if (wbgt >= 28) return '#C9A227'; // Yellow
      return '#3A7D5C'; // Green
    }

    if (metricMode === 'risk') {
      const tier = dist.RiskTier;
      if (tier === 'Red') return '#C0392B';
      if (tier === 'Orange') return '#D9772E';
      if (tier === 'Yellow') return '#C9A227';
      return '#3A7D5C';
    }

    if (metricMode === 'temp') {
      const temp = dist.temperature_c || 30;
      if (temp >= 40) return '#C0392B';
      if (temp >= 36) return '#D9772E';
      if (temp >= 32) return '#C9A227';
      return '#3A7D5C';
    }

    // admissions
    const tier = dist.RiskTier;
    if (tier === 'Red' || tier === 'Orange') return '#C0392B';
    if (tier === 'Yellow') return '#D9772E';
    return '#3A7D5C';
  };

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const INDIA_BOUNDS: L.LatLngBoundsExpression = [
        [5.0, 65.0],
        [38.5, 98.5]
      ];

      const map = L.map(mapContainerRef.current, {
        center: [20.45, 84.8], // Center of Odisha
        zoom: 7.2,
        minZoom: 5,
        maxZoom: 16,
        maxBounds: INDIA_BOUNDS,
        maxBoundsViscosity: 0.85,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);
      mapInstanceRef.current = map;

      // Zoom-dependent ward layer toggle
      map.on('zoomend', () => {
        const z = map.getZoom();
        setShowWards(z >= 9);
      });
    }
  }, []);

  // Fetch ward GeoJSON + telemetry on mount
  useEffect(() => {
    fetch(getApiUrl('/api/v1/wards-geojson'))
      .then(res => res.json())
      .then(data => setWardGeoJson(data))
      .catch(() => {});

    fetch(getApiUrl('/api/v1/wards'))
      .then(res => res.json())
      .then(data => setWardData(data.wards || []))
      .catch(() => {});

    fetch(getApiUrl('/api/v1/resource-allocation/cooling-gaps'))
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setCoolingGaps(data.wards || []);
          setCoolingCentersCatalog(data.available_cooling_centers || []);
        }
      })
      .catch(() => {});

    fetch(getApiUrl('/api/v1/resource-allocation/emergency-routing?ward=Ward%2018'))
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setHospitalsCatalog(data.all_nearby_hospitals || []);
        }
      })
      .catch(() => {});
  }, []);

  // Render ward-level GeoJSON overlay + animated pulse markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing ward layer
    if (wardLayerRef.current) {
      map.removeLayer(wardLayerRef.current);
      wardLayerRef.current = null;
    }
    // Remove existing pulse markers
    if (pulseMarkersRef.current) {
      map.removeLayer(pulseMarkersRef.current);
      pulseMarkersRef.current = null;
    }

    if (!showWards || !wardGeoJson || !wardGeoJson.features) return;

    // Ward boundary choropleth
    const wardLayer = L.geoJSON(wardGeoJson, {
      style: (feature) => {
        const wardNo = feature?.properties?.wardno || '';
        const ward = wardData.find(w => w.ward_no === wardNo);
        const risk = ward?.WardRiskScore || 50;
        const tier = ward?.RiskTier || 'Yellow';
        const fillColor = tier === 'Red' ? '#ef4444'
          : tier === 'Orange' ? '#f97316'
          : tier === 'Yellow' ? '#eab308'
          : '#22c55e';

        return {
          fillColor,
          weight: 1.5,
          opacity: 1,
          color: 'rgba(255,255,255,0.35)',
          fillOpacity: 0.55,
        };
      },
      onEachFeature: (feature, layer) => {
        const wardNo = feature?.properties?.wardno || '';
        const ward = wardData.find(w => w.ward_no === wardNo);
        const pop = feature?.properties?.totalwardpopulation || 'N/A';
        const zone = feature?.properties?.municipalzone || '';

        layer.bindTooltip(
          `<div class="text-xs font-sans">
            <div class="font-bold text-slate-100 flex items-center justify-between gap-3">
              <span>Ward ${wardNo}</span>
              <span class="text-[10px] font-mono px-1.5 py-0.2 rounded" style="background-color: ${
                ward?.RiskTier === 'Red' ? '#ef4444' : ward?.RiskTier === 'Orange' ? '#f97316' : ward?.RiskTier === 'Yellow' ? '#eab308' : '#22c55e'
              }">${ward?.RiskTier || '—'}</span>
            </div>
            <div class="text-slate-300 mt-0.5">Zone: <b>${zone}</b></div>
            <div class="text-slate-300">Population: <b class="text-cyan-300 font-mono">${Number(pop).toLocaleString()}</b></div>
            <div class="text-slate-300">WBGT: <b class="text-amber-300 font-mono">${ward?.WBGT_celsius || '—'}°C</b></div>
            <div class="text-slate-300">Risk Score: <b class="text-rose-300 font-mono">${ward?.WardRiskScore || '—'}/100</b></div>
            <div class="text-slate-300">UHI: <b class="text-purple-300 font-mono">${ward?.uhi_thermal_anomaly_c || '—'}°C</b></div>
          </div>`,
          { sticky: true, className: 'leaflet-tooltip-dark' }
        );

        layer.on({
          mouseover: (e: any) => {
            e.target.setStyle({ weight: 3, color: '#38bdf8', fillOpacity: 0.85 });
          },
          mouseout: (e: any) => {
            if (wardLayerRef.current) wardLayerRef.current.resetStyle(e.target);
          },
        });
      },
    });

    wardLayer.addTo(map);
    wardLayerRef.current = wardLayer;

    // Animated pulse markers for critical/high-risk wards
    const pulseGroup = L.layerGroup();
    const criticalWards = wardData.filter(w => w.RiskTier === 'Red' || w.RiskTier === 'Orange');

    criticalWards.forEach(w => {
      const lat = w.centroid_lat;
      const lng = w.centroid_lon;
      if (!lat || !lng) return;

      const isRed = w.RiskTier === 'Red';
      const color = isRed ? '#ef4444' : '#f97316';
      const size = isRed ? 18 : 14;

      const pulseIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:${size}px;height:${size}px;">
            <div style="
              position:absolute;top:0;left:0;width:100%;height:100%;
              background:${color};border-radius:50%;opacity:0.9;
              box-shadow:0 0 8px ${color};
            "></div>
            <div style="
              position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
              width:${size * 2.5}px;height:${size * 2.5}px;
              border:2px solid ${color};border-radius:50%;opacity:0;
              animation:sentinelPulse 2s ease-out infinite;
            "></div>
            <div style="
              position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
              width:${size * 2.5}px;height:${size * 2.5}px;
              border:2px solid ${color};border-radius:50%;opacity:0;
              animation:sentinelPulse 2s ease-out 0.6s infinite;
            "></div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([lat, lng], { icon: pulseIcon, interactive: true });
      marker.bindTooltip(
        `<div class="text-xs font-mono"><b class="text-rose-300">⚠ ${w.ward_no}</b> — Risk: <b>${w.WardRiskScore}/100</b><br/>WBGT: ${w.WBGT_celsius}°C | UHI: ${w.uhi_thermal_anomaly_c}°C</div>`,
        { className: 'leaflet-tooltip-dark' }
      );
      pulseGroup.addLayer(marker);
    });

    pulseGroup.addTo(map);
    pulseMarkersRef.current = pulseGroup;

  }, [showWards, wardGeoJson, wardData]);

  // Render Cooling Centers, Hospital Routing Vectors, and Underserved High-Risk Overlays
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // 1. Cooling Centers Layer
    if (coolingLayerRef.current) map.removeLayer(coolingLayerRef.current);
    if (activeLayers.cooling_centers && coolingCentersCatalog.length > 0) {
      const coolGroup = L.layerGroup();
      coolingCentersCatalog.forEach(c => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#0284c7;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 0 10px rgba(2,132,199,0.8);font-size:11px;">❄️</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const marker = L.marker([c.lat, c.lon], { icon });
        marker.bindTooltip(
          `<div class="text-xs font-sans">
            <b class="text-cyan-300">${c.name}</b><br/>
            Type: ${c.type}<br/>
            Capacity: <b class="text-white">${c.capacity} persons</b>
            <div class="text-[10px] text-amber-300 mt-1">[SYNTHETIC CATALOG]</div>
          </div>`,
          { className: 'leaflet-tooltip-dark' }
        );
        coolGroup.addLayer(marker);
      });
      coolGroup.addTo(map);
      coolingLayerRef.current = coolGroup;
    }

    // 2. Hospitals & Emergency Transport Routing Vectors Layer
    if (hospitalLayerRef.current) map.removeLayer(hospitalLayerRef.current);
    if (routingPolylineLayerRef.current) map.removeLayer(routingPolylineLayerRef.current);

    if (activeLayers.emergency_routing) {
      const hospGroup = L.layerGroup();
      const polyGroup = L.layerGroup();

      const hospitalCoords: Record<string, [number, number]> = {
        "AIIMS Bhubaneswar": [20.2469, 85.8018],
        "Capital Hospital, Bhubaneswar": [20.2699, 85.8411],
        "KIMS Hospital": [20.3005, 85.8260],
        "SUM Hospital": [20.3208, 85.8153],
        "Hi-Tech Medical College": [20.3300, 85.8085],
        "Kalinga Hospital": [20.2955, 85.8450],
        "SCB Medical College, Cuttack": [20.4736, 85.8873]
      };

      hospitalsCatalog.forEach(h => {
        const coords = hospitalCoords[h.hospital_name];
        if (!coords) return;
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#e11d48;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 0 10px rgba(225,29,72,0.8);font-size:11px;">🏥</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const marker = L.marker(coords, { icon });
        marker.bindTooltip(
          `<div class="text-xs font-sans">
            <b class="text-rose-300">${h.hospital_name}</b><br/>
            Trauma: ${h.trauma_level}<br/>
            Beds: <b class="text-white">${h.bed_capacity} Beds</b><br/>
            Contact: ${h.emergency_contact}
            <div class="text-[10px] text-amber-300 mt-1">[SYNTHETIC CATALOG]</div>
          </div>`,
          { className: 'leaflet-tooltip-dark' }
        );
        hospGroup.addLayer(marker);
      });

      // Draw Emergency Routing Lines connecting High-Risk Wards to nearest Hospital
      const wardCentroids: Record<string, [number, number]> = {
        "Ward 1": [20.3550, 85.8180],
        "Ward 5": [20.3220, 85.8210],
        "Ward 12": [20.2980, 85.8150],
        "Ward 18": [20.2810, 85.8080],
        "Ward 21": [20.2863, 85.8466],
        "Ward 27": [20.2680, 85.8390],
        "Ward 34": [20.2480, 85.8350],
        "Ward 42": [20.2580, 85.7820],
        "Ward 51": [20.2210, 85.7480],
        "Ward 60": [20.3050, 85.8620],
      };

      if (coolingGaps.length > 0) {
        coolingGaps.forEach(g => {
          if (g.exposure_tier === 'CRITICAL' || g.exposure_tier === 'HIGH') {
            const origin = wardCentroids[g.ward_no] || [20.2810, 85.8080];
            const dest = hospitalCoords["KIMS Hospital"] || [20.3005, 85.8260];
            const line = L.polyline([origin, dest], {
              color: '#f43f5e',
              weight: 2.5,
              dashArray: '5, 8',
              opacity: 0.85,
            });
            line.bindTooltip(
              `<div class="text-xs font-mono text-rose-300">
                🚑 Ambulance Advisory Vector (${g.ward_no} ➔ KIMS)<br/>
                Est. Transit: ~10.8 min | Advisory Only
              </div>`,
              { sticky: true, className: 'leaflet-tooltip-dark' }
            );
            polyGroup.addLayer(line);
          }
        });
      }

      hospGroup.addTo(map);
      polyGroup.addTo(map);
      hospitalLayerRef.current = hospGroup;
      routingPolylineLayerRef.current = polyGroup;
    }

    // 3. Underserved High-Risk Areas Filter Overlay
    if (underservedOverlayRef.current) map.removeLayer(underservedOverlayRef.current);
    if (showUnderservedHighRisk && coolingGaps.length > 0) {
      const underservedGroup = L.layerGroup();
      const underserved = coolingGaps.filter(g => 
        (g.exposure_tier === 'CRITICAL' || g.exposure_tier === 'HIGH') && 
        g.cooling_access_tier === 'DEFICIT'
      );

      const wardCentroids: Record<string, [number, number]> = {
        "Ward 1": [20.3550, 85.8180],
        "Ward 5": [20.3220, 85.8210],
        "Ward 12": [20.2980, 85.8150],
        "Ward 18": [20.2810, 85.8080],
        "Ward 21": [20.2863, 85.8466],
        "Ward 27": [20.2680, 85.8390],
        "Ward 34": [20.2480, 85.8350],
        "Ward 42": [20.2580, 85.7820],
        "Ward 51": [20.2210, 85.7480],
        "Ward 60": [20.3050, 85.8620],
      };

      underserved.forEach(g => {
        const coords = wardCentroids[g.ward_no] || [20.2810, 85.8080];
        const circle = L.circle(coords, {
          radius: 1400,
          color: '#f43f5e',
          weight: 4,
          fillColor: '#f43f5e',
          fillOpacity: 0.5,
          dashArray: '6, 6',
        });
        circle.bindTooltip(
          `<div class="text-xs font-sans">
            <div class="font-bold text-rose-300 flex items-center gap-1.5">
              <span>🚨 UNDERSERVED HIGH-RISK ZONE</span>
            </div>
            <div class="text-white mt-1">Ward: <b>${g.ward_no} (${g.ward_name})</b></div>
            <div class="text-slate-300">Temp: <b class="text-rose-400 font-mono">${g.temperature_c}°C</b></div>
            <div class="text-slate-300">Access: <b class="text-rose-400">${g.cooling_access_tier}</b></div>
            <div class="text-cyan-300 mt-1 font-semibold">Action: ${g.priority_recommendation}</div>
            <div class="text-[10px] text-cyan-400 mt-0.5">[CALCULATED GAP]</div>
          </div>`,
          { sticky: true, className: 'leaflet-tooltip-dark' }
        );
        underservedGroup.addLayer(circle);
      });

      underservedGroup.addTo(map);
      underservedOverlayRef.current = underservedGroup;
    }
  }, [activeLayers, showUnderservedHighRisk, coolingCentersCatalog, hospitalsCatalog, coolingGaps]);

  // Update Basemap Tiles (Carto Dark Matter vs. ArcGIS Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    if (baseMapStyle === 'satellite') {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
      ).addTo(map);
      baseTileLayerRef.current = satLayer;
    } else {
      const darkLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        }
      ).addTo(map);
      baseTileLayerRef.current = darkLayer;
    }
  }, [baseMapStyle]);

  // Update GeoJSON Layer with district boundaries
  useEffect(() => {
    if (!mapInstanceRef.current) return;
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
          const isSatellite = baseMapStyle === 'satellite';
          
          return {
            fillColor: getFeatureColor(dname),
            weight: isSelected ? 3 : isSatellite ? 1.5 : 1,
            opacity: 1,
            color: isSelected 
              ? '#38bdf8' 
              : isSatellite 
              ? 'rgba(255, 255, 255, 0.45)' 
              : 'rgba(255, 255, 255, 0.18)',
            dashArray: isSelected ? '' : isSatellite ? '' : '2',
            fillOpacity: isSelected ? 0.85 : isSatellite ? 0.6 : 0.65,
          };
        },
        onEachFeature: (feature, layer) => {
          const dname = feature?.properties?.dtname || feature?.properties?.district || feature?.properties?.NAME_2 || '';
          const dist = uniqueDistricts.find(d => d.district.toLowerCase() === dname.toLowerCase());

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({
                weight: 2.5,
                color: '#ffffff',
                fillOpacity: 0.9,
              });
            },
            mouseout: (e) => {
              if (geoJsonLayerRef.current) {
                geoJsonLayerRef.current.resetStyle(e.target);
              }
            },
            click: (e) => {
              setSelectedDistrictName(dname);
              if (dist) onSelectDistrict(dist);
              // Fly to clicked polygon bounds smoothly
              try {
                const bounds = e.target.getBounds();
                map.flyToBounds(bounds, {
                  padding: [60, 60],
                  maxZoom: 9.5,
                  duration: 0.9,
                });
              } catch (err) {
                // Leaflet bounds calculation fallback
              }
            },
          });

          if (dist) {
            layer.bindTooltip(
              `<div class="text-xs font-sans">
                <div class="font-bold text-slate-100 flex items-center justify-between gap-3">
                  <span>${dname}</span>
                  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded" style="background-color: ${
                    dist.RiskTier === 'Red' ? '#C0392B' : dist.RiskTier === 'Orange' ? '#D9772E' : dist.RiskTier === 'Yellow' ? '#C9A227' : '#3A7D5C'
                  }">${dist.RiskTier}</span>
                </div>
                <div class="text-slate-300 mt-1">WBGT: <b class="text-amber-300 font-mono">${dist.WBGT_celsius}°C</b></div>
                <div class="text-slate-300">Vulnerability M_v: <b class="text-purple-300 font-mono">×${(dist.vulnerability_multiplier || 1.0).toFixed(2)}</b></div>
              </div>`,
              { sticky: true, className: 'leaflet-tooltip-dark' }
            );
          }
        },
      });

      layer.addTo(map);
      geoJsonLayerRef.current = layer;
    }
  }, [geoJson, uniqueDistricts, metricMode, selectedDistrictName, baseMapStyle]);

  const riskTierColor = currentDistrict?.RiskTier === 'Red' 
    ? '#C0392B' 
    : currentDistrict?.RiskTier === 'Orange' 
    ? '#D9772E' 
    : currentDistrict?.RiskTier === 'Yellow' 
    ? '#C9A227' 
    : '#3A7D5C';

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[#0B0D0E] text-[#F2F1EC]">
      {/* Map Main Canvas */}
      <div className="flex-1 flex flex-col relative h-[50vh] lg:h-full">
        {/* Top Control Bar: Layer Switcher & Basemap Toggle */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Layer Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#14171A]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/[0.08] shadow-2xl pointer-events-auto">
            <span className="text-[10px] font-mono text-slate-400 px-2 font-bold tracking-wider">LAYER:</span>
            {(['wbgt', 'risk', 'vulnerability', 'lst', 'uhi', 'admissions', 'temp'] as const).map((m) => (
              <button
                key={m}
                id={`btn-metric-${m}`}
                onClick={() => setMetricMode(m)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition ${
                  metricMode === m
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 font-semibold'
                    : 'text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                {m === 'wbgt' && '🔥 WBGT (Thermal Stress)'}
                {m === 'risk' && '🛡️ Risk Index (Hazard × M_v)'}
                {m === 'vulnerability' && '👥 Vulnerability Layer (Census/OSM)'}
                {m === 'lst' && '🛰️ MODIS LST (Surface Skin)'}
                {m === 'uhi' && '🏙️ Urban Heat Island (UHI)'}
                {m === 'admissions' && '🏥 Hospital Impact'}
                {m === 'temp' && '🌡️ Dry Bulb Temp'}
              </button>
            ))}
          </div>

          {/* Basemap Switcher (Dark vs Satellite) */}
          <div className="flex items-center gap-1 bg-[#14171A]/90 backdrop-blur-xl p-1 rounded-2xl border border-white/[0.08] shadow-2xl pointer-events-auto">
            <button
              id="btn-basemap-dark"
              onClick={() => setBaseMapStyle('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition ${
                baseMapStyle === 'dark'
                  ? 'bg-white/[0.12] text-white font-bold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Dark Canvas</span>
            </button>
            <button
              id="btn-basemap-satellite"
              onClick={() => setBaseMapStyle('satellite')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition ${
                baseMapStyle === 'satellite'
                  ? 'bg-gradient-to-r from-emerald-500/30 to-sky-500/30 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>🛰️ Satellite</span>
            </button>
          </div>
        </div>

        {/* Ward Mode Active Indicator */}
        {showWards && (
          <div className="absolute top-16 left-3 z-[1000] flex items-center gap-2 bg-gradient-to-r from-rose-500/20 to-amber-500/20 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-rose-500/30 shadow-2xl pointer-events-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider">
              Ward-Level Drill-Down Active · 67 Wards · Bhubaneswar
            </span>
          </div>
        )}
        {/* Task 11: Bento-Glass Multi-Layer Control Panel & Underserved Filter Button */}
        <div className="absolute top-16 left-3 z-[1000] bg-slate-900/90 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-800/80 shadow-2xl space-y-3 pointer-events-auto max-w-[285px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              GIS Layer Controls
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
              Multi-Layer
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-sans">
            {/* Thermal Stress Layer */}
            <label className="flex items-center justify-between text-slate-200 cursor-pointer hover:text-white p-1 rounded hover:bg-slate-800/50 transition-colors">
              <span className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Thermal Stress (HTSI)
              </span>
              <input
                type="checkbox"
                checked={activeLayers.thermal_stress}
                onChange={(e) => setActiveLayers(prev => ({ ...prev, thermal_stress: e.target.checked }))}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-950 cursor-pointer"
              />
            </label>

            {/* Population Vulnerability Layer */}
            <label className="flex items-center justify-between text-slate-200 cursor-pointer hover:text-white p-1 rounded hover:bg-slate-800/50 transition-colors">
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Vulnerability Index
              </span>
              <input
                type="checkbox"
                checked={activeLayers.vulnerability}
                onChange={(e) => setActiveLayers(prev => ({ ...prev, vulnerability: e.target.checked }))}
                className="rounded border-slate-700 text-purple-500 focus:ring-purple-500 bg-slate-950 cursor-pointer"
              />
            </label>

            {/* Cooling Centers & Gaps Layer */}
            <label className="flex items-center justify-between text-slate-200 cursor-pointer hover:text-white p-1 rounded hover:bg-slate-800/50 transition-colors">
              <span className="flex items-center gap-2">
                <LifeBuoy className="w-3.5 h-3.5 text-sky-400" />
                Cooling Hubs & Gaps
              </span>
              <input
                type="checkbox"
                checked={activeLayers.cooling_centers}
                onChange={(e) => setActiveLayers(prev => ({ ...prev, cooling_centers: e.target.checked }))}
                className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-950 cursor-pointer"
              />
            </label>

            {/* Hospitals & Emergency Transport Routes Layer */}
            <label className="flex items-center justify-between text-slate-200 cursor-pointer hover:text-white p-1 rounded hover:bg-slate-800/50 transition-colors">
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                Hospitals & Routing
              </span>
              <input
                type="checkbox"
                checked={activeLayers.emergency_routing}
                onChange={(e) => setActiveLayers(prev => ({ ...prev, emergency_routing: e.target.checked }))}
                className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-950 cursor-pointer"
              />
            </label>
          </div>

          {/* Underserved High-Risk Filter Overlay Button */}
          <button
            onClick={() => setShowUnderservedHighRisk(!showUnderservedHighRisk)}
            className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md font-sans ${
              showUnderservedHighRisk
                ? 'bg-rose-600 text-white shadow-rose-900/50 animate-pulse border border-rose-400'
                : 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border border-rose-500/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
            {showUnderservedHighRisk ? 'Underserved Overlay ON' : 'Show Underserved High-Risk'}
          </button>

          {/* Note on skipped dynamic layers */}
          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 leading-tight space-y-1 font-sans">
            <div>• <i>Construction Sites</i> & <i>Schools</i> layers run dynamically on shift/classroom inputs without static GIS directories.</div>
          </div>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-[#14171A]/90 backdrop-blur-xl p-3 rounded-2xl border border-white/[0.08] shadow-2xl text-[11px] font-mono text-slate-300 pointer-events-auto">
          {metricMode === 'vulnerability' ? (
            <>
              <div className="font-semibold text-slate-200 mb-1.5 flex items-center justify-between gap-4">
                <span>CENSUS/OSM VULNERABILITY MULTIPLIER</span>
                <span className="text-[10px] text-purple-400 font-bold">M_v [0.70 - 1.50]</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3A7D5C' }}></span> Buffer (&lt;0.95)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D9772E' }}></span> Moderate (0.95-1.10)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C0392B' }}></span> High (1.10-1.25)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Severe (&gt;1.25)</span>
              </div>
            </>
          ) : metricMode === 'lst' ? (
            <>
              <div className="font-semibold text-slate-200 mb-1.5 flex items-center justify-between gap-4">
                <span>MODIS TERRA/AQUA LAND SURFACE TEMP (LST)</span>
                <span className="text-[10px] text-cyan-400 font-bold">Thermal Infrared 1km</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3A7D5C' }}></span> &lt;40°C Skin</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D9772E' }}></span> 40-44°C Moderate</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C0392B' }}></span> 44-48°C High</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> &gt;48°C Extreme Radiant</span>
              </div>
            </>
          ) : metricMode === 'uhi' ? (
            <>
              <div className="font-semibold text-slate-200 mb-1.5 flex items-center justify-between gap-4">
                <span>URBAN HEAT ISLAND (UHI) ANOMALY</span>
                <span className="text-[10px] text-purple-400 font-bold">ΔT (vs Rural Baseline)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3A7D5C' }}></span> Cool Island (&lt;+1.0°C)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C9A227' }}></span> Moderate (+1.0 - +2.5°C)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C0392B' }}></span> High UHI (+2.5 - +4.0°C)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Severe Hotspot (&gt;+4.0°C)</span>
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold text-slate-200 mb-1.5 flex items-center justify-between gap-4">
                <span>OPERATIONAL THERMAL RISK TIER</span>
                <span className="text-[10px] text-slate-400">NDMA / WBGT Standard</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3A7D5C' }}></span> Green (&lt;28°C)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C9A227' }}></span> Yellow (28-30°C)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D9772E' }}></span> Orange (30-32°C)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C0392B' }}></span> Red (&gt;32°C)</span>
              </div>
            </>
          )}
        </div>

        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Right Sidebar: District Deep-Dive & Top Hotspots */}
      <div className="w-full lg:w-[410px] bg-[#0E1114]/95 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-white/[0.08] flex flex-col h-[50vh] lg:h-full overflow-y-auto z-10 p-4 gap-4">
        {/* District Header Card with Ambient Glow */}
        <div className="relative bg-gradient-to-br from-[#14171A] to-[#1A1F24] border border-white/[0.08] rounded-2xl p-4 shadow-xl overflow-hidden">
          {/* Ambient Glow behind Hero Metric */}
          <div 
            className="pointer-events-none absolute -right-6 -top-6 w-36 h-36 rounded-full blur-3xl opacity-25"
            style={{ backgroundColor: riskTierColor }}
          />

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              DISTRICT PROFILE · ODISHA
            </span>
            <div className="flex items-center gap-1.5">
              <span 
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full text-white border"
                style={{ 
                  backgroundColor: `${riskTierColor}33`, 
                  borderColor: `${riskTierColor}66`,
                  color: riskTierColor === '#3A7D5C' ? '#a7f3d0' : '#ffffff'
                }}
              >
                {currentDistrict?.RiskTier || 'Yellow'} Alert Tier
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                M_v: ×{(currentDistrict?.vulnerability_multiplier || 1.0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <h2 className="text-2xl font-bold font-display text-white tracking-tight">
                {currentDistrict?.district || 'Khordha'}
              </h2>
              <span className="text-xs text-slate-400 font-sans">Centroid: 20.2°N, 85.8°E</span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-mono font-black tracking-tight" style={{ color: riskTierColor }}>
                {currentDistrict?.WBGT_celsius || 31.8}°
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono uppercase font-semibold">WBGT Heat Stress</span>
            </div>
          </div>

          {/* Quick Atmospheric Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.08]">
            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                <Flame className="w-3 h-3 text-rose-400" /> Air Temp
              </div>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {currentDistrict?.temperature_c || 38.5}°C
              </div>
            </div>

            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                <Droplets className="w-3 h-3 text-sky-400" /> Humidity
              </div>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {currentDistrict?.relative_humidity_pct || 75}%
              </div>
            </div>

            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                <Users className="w-3 h-3 text-emerald-400" /> Population
              </div>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {((currentDistrict?.population_2011_est || 1500000) / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>

          {/* Census & OSM Vulnerability Multipliers with progress indicators */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.08]">
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-mono">
              <span className="text-indigo-400 font-semibold uppercase tracking-wider">Census &amp; OSM Multipliers</span>
              <span className="text-slate-400 text-[10px]">Composite Score: {currentDistrict?.vulnerability_score || 48}/100</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
              <div className="bg-[#0B0D0E]/60 p-1.5 rounded-xl border border-white/[0.05] text-center">
                <span className="text-slate-400 block text-[9px]">Elderly</span>
                <span className="text-sky-300 font-bold">{currentDistrict?.elderly_pct || 9.8}%</span>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: `${Math.min(100, (currentDistrict?.elderly_pct || 9.8) * 5)}%` }} />
                </div>
              </div>
              <div className="bg-[#0B0D0E]/60 p-1.5 rounded-xl border border-white/[0.05] text-center">
                <span className="text-slate-400 block text-[9px]">Labor</span>
                <span className="text-amber-300 font-bold">{currentDistrict?.outdoor_worker_pct || 28.0}%</span>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, (currentDistrict?.outdoor_worker_pct || 28.0) * 2)}%` }} />
                </div>
              </div>
              <div className="bg-[#0B0D0E]/60 p-1.5 rounded-xl border border-white/[0.05] text-center">
                <span className="text-slate-400 block text-[9px]">Canopy</span>
                <span className="text-emerald-300 font-bold">{currentDistrict?.tree_cover_pct || 18.2}%</span>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, (currentDistrict?.tree_cover_pct || 18.2) * 2.5)}%` }} />
                </div>
              </div>
              <div className="bg-[#0B0D0E]/60 p-1.5 rounded-xl border border-white/[0.05] text-center">
                <span className="text-slate-400 block text-[9px]">Tin Roof</span>
                <span className="text-rose-300 font-bold">{currentDistrict?.high_heat_roof_pct || 32.5}%</span>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                  <div className="bg-rose-400 h-full rounded-full" style={{ width: `${Math.min(100, (currentDistrict?.high_heat_roof_pct || 32.5) * 2)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Satellite Earth Observation (MODIS LST & NASA POWER) */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.08]">
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-mono">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                🛰️ Earth Observation Layer
              </span>
              <span className="text-[10px] text-slate-400">MODIS &amp; NASA POWER</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
              <div className="bg-[#0B0D0E]/60 p-1.5 rounded-xl border border-white/[0.05] text-center">
                <span className="text-slate-400 block text-[9px]">MODIS LST</span>
                <span className="text-rose-400 font-bold">{currentDistrict?.modis_lst_c || (Number(currentDistrict?.temperature_c || 38.5) + 6.8).toFixed(1)}°C</span>
              </div>
              <div className="bg-[#0B0D0E]/60 p-1.5 rounded-xl border border-white/[0.05] text-center">
                <span className="text-slate-400 block text-[9px]">UHI Anomaly</span>
                <span className="text-purple-400 font-bold">{currentDistrict?.uhi_anomaly_c !== undefined ? (currentDistrict.uhi_anomaly_c >= 0 ? `+${currentDistrict.uhi_anomaly_c}°C` : `${currentDistrict.uhi_anomaly_c}°C`) : '+3.4°C'}</span>
              </div>
              <div className="bg-[#0B0D0E]/60 p-1.5 rounded-xl border border-white/[0.05] text-center">
                <span className="text-slate-400 block text-[9px]">NASA Solar</span>
                <span className="text-amber-300 font-bold">{currentDistrict?.nasa_solar_wm2 || 908} W/m²</span>
              </div>
            </div>
          </div>

          {/* Alert Dispatch Action */}
          <button
            id={`btn-dispatch-${currentDistrict?.district || 'Khordha'}`}
            onClick={() => onDispatchAlert(currentDistrict?.district || 'Khordha')}
            className="w-full mt-3 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 active:scale-[0.99]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch SMS / IVRS Alert to {currentDistrict?.district || 'Khordha'}</span>
          </button>
        </div>

        {/* Hospital Surge Forecast (5-Day DLNM+XGBoost) */}
        <div className="bg-[#14171A]/80 border border-white/[0.08] rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-400" />
              5-Day Hospital Surge Projections
            </span>
            <span className="text-[10px] font-mono text-slate-400">2-Stage DLNM Model</span>
          </div>

          {districtDetail?.hospital_impact_forecast && districtDetail.hospital_impact_forecast.length > 0 ? (
            <div className="h-32 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtDetail.hospital_impact_forecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(v) => v.slice(5)} 
                    tick={{ fill: '#8B9096', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                  />
                  <YAxis tick={{ fill: '#8B9096', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#14171A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#F2F1EC' }}
                    labelFormatter={(v) => `Date: ${v}`}
                    formatter={(val: any) => [`${val} admissions/day`, 'Predicted Surge']}
                  />
                  <Bar dataKey="predicted_admissions" radius={[6, 6, 0, 0]}>
                    {districtDetail.hospital_impact_forecast.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.ImpactTier === 'Red' ? '#C0392B' : entry.ImpactTier === 'Orange' ? '#D9772E' : '#C9A227'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-6 text-center font-mono">Loading DLNM surge curves...</div>
          )}
        </div>

        {/* Top 5 Thermal Hotspots Leaderboard */}
        <div className="bg-[#14171A]/80 border border-white/[0.08] rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Statewide Thermal Hotspots
            </span>
            <span className="text-[10px] font-mono text-slate-400">Ranked by WBGT</span>
          </div>

          <div className="space-y-2">
            {sortedDistricts.slice(0, 5).map((dist, idx) => {
              const isSelected = dist.district.toLowerCase() === selectedDistrictName.toLowerCase();
              const rankColor = idx === 0 
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' 
                : idx === 1 
                ? 'bg-slate-300/20 text-slate-200 border-slate-300/30' 
                : idx === 2 
                ? 'bg-amber-700/20 text-amber-500 border-amber-600/30' 
                : 'bg-slate-800 text-slate-400 border-white/[0.05]';

              return (
                <div
                  key={dist.district}
                  id={`hotspot-row-${dist.district}`}
                  onClick={() => setSelectedDistrictName(dist.district)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-sky-500/15 border border-sky-500/50 text-white shadow-sm shadow-sky-500/10'
                      : 'bg-[#0B0D0E]/50 border border-white/[0.05] hover:bg-white/[0.05] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center border ${rankColor}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold font-sans">{dist.district}</div>
                      <div className="text-[10px] text-slate-400">{dist.RiskTier} Alert Tier</div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-300">{dist.WBGT_celsius}°C</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition ${isSelected ? 'text-sky-400 translate-x-0.5' : 'text-slate-500'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
