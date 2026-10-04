import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  LifeBuoy,
  Search
} from 'lucide-react';
import { DistrictRiskRecord } from '../types';
import { getApiUrl } from '../services/apiConfig';
import { getPrimaryLocalityByWard, getLocalitiesByWard } from '../utils/wardLocalities';

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
  wardData: propsWardData,
  wardGeoJson: propsWardGeoJson,
  onSelectDistrict,
  onDispatchAlert,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const wardLayerRef = useRef<L.GeoJSON | null>(null);
  const pulseMarkersRef = useRef<L.LayerGroup | null>(null);
  const coolingLayerRef = useRef<L.LayerGroup | null>(null);
  const hospitalLayerRef = useRef<L.LayerGroup | null>(null);
  const underservedOverlayRef = useRef<L.LayerGroup | null>(null);

  // Selected ward defaults to W1 or existing selected ward
  const [selectedWardNo, setSelectedWardNo] = useState<string>('W1');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Khordha');
  const [metricMode, setMetricMode] = useState<'wbgt' | 'temp' | 'risk' | 'vulnerability' | 'uhi'>('wbgt');
  const [layerPanelOpen, setLayerPanelOpen] = useState<boolean>(true);

  // Searchable Ward Selector State
  const [wardSelectorOpen, setWardSelectorOpen] = useState<boolean>(false);
  const [wardSearchTerm, setWardSearchTerm] = useState<string>('');
  const wardSelectorRef = useRef<HTMLDivElement>(null);

  const [hospitalDemand, setHospitalDemand] = useState<any>(null);
  const [hospitalLoading, setHospitalLoading] = useState<boolean>(false);
  const [hospitalError, setHospitalError] = useState<boolean>(false);
  const [forecastData, setForecastData] = useState<any[]>([]);

  // Close ward dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wardSelectorRef.current && !wardSelectorRef.current.contains(e.target as Node)) {
        setWardSelectorOpen(false);
      }
    };
    if (wardSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wardSelectorOpen]);

  const [wardGeoJson, setWardGeoJson] = useState<any>(propsWardGeoJson || null);
  const [wardData, setWardData] = useState<any[]>(propsWardData || []);
  const [showWards, setShowWards] = useState<boolean>(true);

  const [activeLayers, setActiveLayers] = useState({
    hospitals: false,
    cooling_centers: false,
  });
  const [showUnderservedHighRisk, setShowUnderservedHighRisk] = useState<boolean>(false);
  const [coolingGaps, setCoolingGaps] = useState<any[]>([]);
  const [coolingCentersCatalog, setCoolingCentersCatalog] = useState<any[]>([]);
  const [hospitalsCatalog, setHospitalsCatalog] = useState<any[]>([]);

  // Sync props if provided
  useEffect(() => {
    if (propsWardData && propsWardData.length > 0) {
      setWardData(propsWardData);
    }
  }, [propsWardData]);

  useEffect(() => {
    if (propsWardGeoJson) {
      setWardGeoJson(propsWardGeoJson);
    }
  }, [propsWardGeoJson]);

  // Unique districts list
  const uniqueDistricts = useMemo(() => {
    return (districts || []).reduce((acc: DistrictRiskRecord[], cur) => {
      if (cur && cur.district && !acc.some(d => d.district === cur.district)) {
        acc.push(cur);
      }
      return acc;
    }, []);
  }, [districts]);

  // Sort by WBGT descending
  const sortedDistricts = useMemo(() => {
    return [...uniqueDistricts].sort((a, b) => (b.WBGT_celsius || 0) - (a.WBGT_celsius || 0));
  }, [uniqueDistricts]);

  const fallbackDistrict: DistrictRiskRecord = {
    district: 'Khordha',
    population_2011_est: 1870115,
    centroid_lat: 20.18,
    centroid_lon: 85.62,
    timestamp: new Date().toISOString(),
    temperature_c: 39.5,
    relative_humidity_pct: 68,
    wind_speed_ms: 2.8,
    solar_radiation_wm2: 840,
    apparent_temp_c: 44.7,
    HI_celsius: 44.6,
    WBGT_celsius: 32.4,
    UTCI_celsius: 43.3,
    DistrictRiskScore: 78,
    RiskTier: 'Orange',
    vulnerability_multiplier: 1.15,
    elderly_pct: 9.8,
    outdoor_worker_pct: 28.0,
    tree_cover_pct: 18.2,
    high_heat_roof_pct: 32.5,
    vulnerability_score: 48,
    modis_lst_c: 46.3,
    uhi_anomaly_c: 3.4,
    nasa_solar_wm2: 908,
  };

  const currentDistrict = (uniqueDistricts.length > 0
    ? uniqueDistricts.find(d => d.district && d.district.toLowerCase() === (selectedDistrictName || '').toLowerCase()) || uniqueDistricts[0]
    : fallbackDistrict) || fallbackDistrict;

  // Resolved current selected ward record
  const currentWard = useMemo(() => {
    if (!wardData || wardData.length === 0) return null;
    const cleanId = selectedWardNo.replace(/^W/i, '').trim();
    return wardData.find(w => {
      const wNo = String(w.ward_no || '').replace(/^W/i, '').trim();
      return wNo === cleanId || w.ward_no === selectedWardNo;
    }) || wardData[0] || null;
  }, [wardData, selectedWardNo]);

  // Filtered wards for searchable dropdown
  const filteredWards = useMemo(() => {
    if (!wardData || wardData.length === 0) return [];
    if (!wardSearchTerm.trim()) return wardData;
    const term = wardSearchTerm.toLowerCase().trim();
    return wardData.filter(w => {
      const wNo = String(w.ward_no || '').toLowerCase();
      const zone = String(w.zone || '').toLowerCase();
      const name = String(w.ward_name || '').toLowerCase();
      const wardNum = Number(String(w.ward_no || '').replace(/^W/i, '').trim());
      const localities = getLocalitiesByWard(wardNum);
      const matchesLocality = localities.some(loc => loc.toLowerCase().includes(term));
      return wNo.includes(term) || zone.includes(term) || name.includes(term) || matchesLocality;
    });
  }, [wardData, wardSearchTerm]);

  // Handle Ward Selection (Search Dropdown or Map Click)
  const handleSelectWard = (wNo: string) => {
    const cleanNo = String(wNo).replace(/^W/i, '').trim();
    const normalized = `W${cleanNo}`;
    setSelectedWardNo(normalized);
    setWardSelectorOpen(false);
    setWardSearchTerm('');

    // Highlight and focus polygon on Leaflet map if available
    if (mapInstanceRef.current && wardLayerRef.current) {
      let targetLayer: any = null;
      wardLayerRef.current.eachLayer((l: any) => {
        const rawNo = l.feature?.properties?.wardno || '';
        if (String(rawNo).replace(/^W/i, '').trim() === cleanNo) {
          targetLayer = l;
        }
      });
      if (targetLayer && targetLayer.getBounds) {
        try {
          mapInstanceRef.current.flyToBounds(targetLayer.getBounds(), {
            padding: [70, 70],
            maxZoom: 14,
            duration: 0.8,
          });
          targetLayer.setStyle({ weight: 3.5, color: '#38bdf8', fillOpacity: 0.9 });
        } catch (e) {}
      }
    }
  };

  // Map Color Helper based on Active Metric
  const getFeatureColor = (districtName: string): string => {
    const dist = uniqueDistricts.find(d => d.district.toLowerCase() === districtName.toLowerCase());
    if (!dist) return '#1A1F24';

    if (metricMode === 'wbgt') {
      const val = dist.WBGT_celsius || 30;
      if (val >= 32) return '#C0392B';
      if (val >= 30) return '#D9772E';
      if (val >= 28) return '#C9A227';
      return '#3A7D5C';
    }

    if (metricMode === 'temp') {
      const val = dist.temperature_c || 38;
      if (val >= 42) return '#C0392B';
      if (val >= 40) return '#D9772E';
      if (val >= 37) return '#C9A227';
      return '#3A7D5C';
    }

    if (metricMode === 'risk') {
      const tier = dist.RiskTier || 'Yellow';
      if (tier === 'Red') return '#C0392B';
      if (tier === 'Orange') return '#D9772E';
      if (tier === 'Yellow') return '#C9A227';
      return '#3A7D5C';
    }

    if (metricMode === 'vulnerability') {
      const val = dist.vulnerability_multiplier || 1.0;
      if (val >= 1.25) return '#8B5CF6';
      if (val >= 1.10) return '#C0392B';
      if (val >= 0.95) return '#D9772E';
      return '#3A7D5C';
    }

    if (metricMode === 'uhi') {
      const val = dist.uhi_anomaly_c || 2.0;
      if (val >= 4.0) return '#9333ea';
      if (val >= 2.5) return '#C0392B';
      if (val >= 1.0) return '#C9A227';
      return '#3A7D5C';
    }

    return '#C9A227';
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const INDIA_BOUNDS: L.LatLngBoundsExpression = [
        [5.0, 65.0],
        [38.5, 98.5]
      ];

      const map = L.map(mapContainerRef.current, {
        center: [20.2961, 85.8245],
        zoom: 11,
        minZoom: 6,
        maxZoom: 16,
        maxBounds: INDIA_BOUNDS,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);
      mapInstanceRef.current = map;

      // Plain solid dark background
      const container = map.getContainer();
      if (container) {
        container.style.backgroundColor = '#0a0e12';
      }

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    }
  }, []);

  // Fetch Ward GeoJSON + Catalogues on mount
  useEffect(() => {
    fetch(getApiUrl('/api/v1/wards-geojson'))
      .then(res => res.json())
      .then(data => setWardGeoJson(data))
      .catch(() => {});

    fetch(getApiUrl('/api/v1/wards'))
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.wards)) {
          setWardData(data.wards);
        }
      })
      .catch(() => {});

    fetch(getApiUrl('/api/v1/resource-allocation/cooling-gaps'))
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'success') {
          setCoolingGaps(data.wards || []);
          setCoolingCentersCatalog(data.available_cooling_centers || []);
        }
      })
      .catch(() => {});

    fetch(getApiUrl('/api/v1/resource-allocation/emergency-routing?ward=Ward%2018'))
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'success') {
          setHospitalsCatalog(data.all_nearby_hospitals || []);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Hospital Demand for Selected Ward immediately on load & when selected ward changes
  useEffect(() => {
    const wardToFetch = selectedWardNo || 'W1';
    setHospitalLoading(true);
    setHospitalError(false);

    fetch(getApiUrl(`/api/v1/wards/${encodeURIComponent(wardToFetch)}/hospital-demand`))
      .then(res => {
        if (!res.ok) throw new Error('Hospital demand request failed');
        return res.json();
      })
      .then(data => {
        if (data && data.status === 'EXPERIMENTAL_NOT_VALIDATED' && Array.isArray(data.forecast) && data.forecast.length > 0) {
          setHospitalDemand(data);
          setForecastData(data.forecast);
          setHospitalError(false);
        } else {
          setHospitalDemand(data || null);
          setForecastData([]);
          setHospitalError(false);
        }
        setHospitalLoading(false);
      })
      .catch(err => {
        console.error('Failed to load hospital demand:', err);
        setHospitalDemand(null);
        setForecastData([]);
        setHospitalError(true);
        setHospitalLoading(false);
      });
  }, [selectedWardNo]);

  // Render Ward-Level GeoJSON overlay with real data
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing ward layer
    if (wardLayerRef.current) {
      map.removeLayer(wardLayerRef.current);
      wardLayerRef.current = null;
    }
    if (pulseMarkersRef.current) {
      map.removeLayer(pulseMarkersRef.current);
      pulseMarkersRef.current = null;
    }

    if (!showWards || !wardGeoJson || !wardGeoJson.features) return;

    const wardLayer = L.geoJSON(wardGeoJson, {
      style: (feature) => {
        const rawNo = feature?.properties?.wardno || '';
        const cleanNo = String(rawNo).replace(/^W/i, '').trim();
        const ward = wardData.find(w => String(w.ward_no || '').replace(/^W/i, '').trim() === cleanNo);
        const isSelected = selectedWardNo.replace(/^W/i, '').trim() === cleanNo;

        let fillColor = '#eab308';
        if (metricMode === 'wbgt') {
          const val = ward?.WBGT_celsius || 30;
          fillColor = val >= 32 ? '#C0392B' : val >= 30 ? '#D9772E' : val >= 28 ? '#C9A227' : '#3A7D5C';
        } else if (metricMode === 'temp') {
          const val = ward?.temperature_c || 38;
          fillColor = val >= 42 ? '#C0392B' : val >= 40 ? '#D9772E' : val >= 37 ? '#C9A227' : '#3A7D5C';
        } else if (metricMode === 'vulnerability') {
          const mult = ward?.vulnerability_multiplier || 1.0;
          fillColor = mult >= 1.25 ? '#8B5CF6' : mult >= 1.10 ? '#C0392B' : mult >= 0.95 ? '#D9772E' : '#3A7D5C';
        } else if (metricMode === 'uhi') {
          const uhi = ward?.uhi_anomaly_c || ward?.uhi_thermal_anomaly_c || 2.0;
          fillColor = uhi >= 4.0 ? '#9333ea' : uhi >= 2.5 ? '#C0392B' : uhi >= 1.0 ? '#C9A227' : '#3A7D5C';
        } else {
          // Default risk index
          const tier = ward?.RiskTier || 'Yellow';
          fillColor = tier === 'Red' ? '#C0392B' : tier === 'Orange' ? '#D9772E' : tier === 'Yellow' ? '#C9A227' : '#3A7D5C';
        }

        return {
          fillColor,
          weight: isSelected ? 3 : 1.2,
          opacity: 1,
          color: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.3)',
          fillOpacity: isSelected ? 0.85 : 0.6,
        };
      },
      onEachFeature: (feature, layer) => {
        const rawNo = feature?.properties?.wardno || '';
        const cleanNo = String(rawNo).replace(/^W/i, '').trim();
        const ward = wardData.find(w => String(w.ward_no || '').replace(/^W/i, '').trim() === cleanNo);
        const pop = feature?.properties?.totalwardpopulation || ward?.population || 'N/A';
        const zone = feature?.properties?.municipalzone || ward?.zone || 'Bhubaneswar';
        const wardNoNum = Number(cleanNo);
        const primaryLocality = !isNaN(wardNoNum) ? getPrimaryLocalityByWard(wardNoNum) : null;

        layer.bindTooltip(
          `<div class="text-xs font-sans">
            <div class="font-bold text-slate-100 flex items-center justify-between gap-3">
              <span>Ward ${cleanNo}</span>
              <span class="text-[10px] font-mono px-1.5 py-0.2 rounded" style="background-color: ${
                ward?.RiskTier === 'Red' ? '#C0392B' : ward?.RiskTier === 'Orange' ? '#D9772E' : ward?.RiskTier === 'Yellow' ? '#C9A227' : '#3A7D5C'
              }">${ward?.RiskTier || '—'}</span>
            </div>
            ${primaryLocality ? `<div class="text-slate-200 font-medium text-[11px] mt-0.5">${primaryLocality}</div>` : ''}
            <div class="text-slate-300 mt-1">Zone: <b>${zone}</b></div>
            <div class="text-slate-300">Temp: <b class="text-amber-300 font-mono">${ward?.temperature_c ?? '—'}°C</b></div>
            <div class="text-slate-300">WBGT: <b class="text-amber-300 font-mono">${ward?.WBGT_celsius ?? '—'}°C</b></div>
            <div class="text-slate-300">UTCI: <b class="text-rose-300 font-mono">${ward?.UTCI_celsius ?? '—'}°C</b></div>
            <div class="text-slate-300">Population: <b class="text-cyan-300 font-mono">${typeof pop === 'number' ? pop.toLocaleString() : pop}</b></div>
          </div>`,
          { sticky: true, className: 'leaflet-tooltip-dark' }
        );

        layer.on({
          click: () => handleSelectWard(cleanNo),
          mouseover: (e: any) => {
            e.target.setStyle({ weight: 2.8, color: '#38bdf8', fillOpacity: 0.9 });
          },
          mouseout: (e: any) => {
            if (wardLayerRef.current) wardLayerRef.current.resetStyle(e.target);
          },
        });
      },
    });

    wardLayer.addTo(map);
    wardLayerRef.current = wardLayer;

    // Animated pulse markers for Critical/High-Risk wards
    const pulseGroup = L.layerGroup();
    const criticalWards = wardData.filter(w => w.RiskTier === 'Red' || w.RiskTier === 'Orange');

    criticalWards.forEach(w => {
      const lat = w.centroid_lat;
      const lng = w.centroid_lon;
      if (!lat || !lng) return;

      const isRed = w.RiskTier === 'Red';
      const color = isRed ? '#ef4444' : '#f97316';
      const size = isRed ? 14 : 11;

      const pulseIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:${size}px;height:${size}px;">
            <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:${color};border-radius:50%;opacity:0.9;box-shadow:0 0 6px ${color};"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size * 2.2}px;height:${size * 2.2}px;border:2px solid ${color};border-radius:50%;opacity:0;animation:sentinelPulse 2s ease-out infinite;"></div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      pulseGroup.addLayer(L.marker([lat, lng], { icon: pulseIcon }));
    });

    pulseGroup.addTo(map);
    pulseMarkersRef.current = pulseGroup;
  }, [showWards, wardGeoJson, wardData, metricMode, selectedWardNo]);

  // Handle Infrastructure & Operational Overlays (Hospitals & Cooling Hubs)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // 1. Cooling Centers Layer (Static Reference Catalog)
    if (coolingLayerRef.current) map.removeLayer(coolingLayerRef.current);
    if (activeLayers.cooling_centers && coolingCentersCatalog.length > 0) {
      const coolGroup = L.layerGroup();
      coolingCentersCatalog.forEach(c => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#0284c7;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 0 8px rgba(2,132,199,0.8);font-size:10px;">❄️</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const marker = L.marker([c.lat, c.lon], { icon });
        marker.bindTooltip(
          `<div class="text-xs font-sans">
            <b class="text-cyan-300">${c.name}</b><br/>
            Type: ${c.type}<br/>
            Capacity: <b class="text-white">${c.capacity} persons</b>
            <div class="text-[9px] text-slate-400 mt-1">[STATIC REFERENCE]</div>
          </div>`,
          { className: 'leaflet-tooltip-dark' }
        );
        coolGroup.addLayer(marker);
      });
      coolGroup.addTo(map);
      coolingLayerRef.current = coolGroup;
    }

    // 2. Hospitals (Static Reference Catalog - No Fake Routing Lines)
    if (hospitalLayerRef.current) map.removeLayer(hospitalLayerRef.current);
    if (activeLayers.hospitals) {
      const hospGroup = L.layerGroup();
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
          html: `<div style="background:#e11d48;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 0 8px rgba(225,29,72,0.8);font-size:10px;">🏥</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const marker = L.marker(coords, { icon });
        marker.bindTooltip(
          `<div class="text-xs font-sans">
            <b class="text-rose-300">${h.hospital_name}</b><br/>
            Trauma Level: ${h.trauma_level}<br/>
            Beds: <b class="text-white">${h.bed_capacity} Beds</b>
            <div class="text-[9px] text-slate-400 mt-1">[STATIC REFERENCE]</div>
          </div>`,
          { className: 'leaflet-tooltip-dark' }
        );
        hospGroup.addLayer(marker);
      });

      hospGroup.addTo(map);
      hospitalLayerRef.current = hospGroup;
    }

    // 3. Underserved High-Risk Filter Overlay
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
          radius: 1200,
          color: '#f43f5e',
          weight: 3,
          fillColor: '#f43f5e',
          fillOpacity: 0.45,
          dashArray: '5, 5',
        });
        circle.bindTooltip(
          `<div class="text-xs font-sans">
            <b class="text-rose-300">UNDERSERVED HIGH-RISK ZONE</b><br/>
            Ward: <b>${g.ward_no}</b><br/>
            Temp: ${g.temperature_c}°C · Access: ${g.cooling_access_tier}
            <div class="text-[9px] text-cyan-400 mt-1">[CALCULATED GAP]</div>
          </div>`,
          { sticky: true, className: 'leaflet-tooltip-dark' }
        );
        underservedGroup.addLayer(circle);
      });

      underservedGroup.addTo(map);
      underservedOverlayRef.current = underservedGroup;
    }
  }, [activeLayers, showUnderservedHighRisk, coolingCentersCatalog, hospitalsCatalog, coolingGaps]);

  // District GeoJSON Boundary layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

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
            color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.16)',
            dashArray: isSelected ? '' : '2',
            fillOpacity: isSelected ? 0.75 : 0.5,
          };
        },
        onEachFeature: (feature, layer) => {
          const dname = feature?.properties?.dtname || feature?.properties?.district || feature?.properties?.NAME_2 || '';
          const dist = uniqueDistricts.find(d => d.district.toLowerCase() === dname.toLowerCase());

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({ weight: 2, color: '#ffffff', fillOpacity: 0.85 });
            },
            mouseout: (e) => {
              if (geoJsonLayerRef.current) {
                geoJsonLayerRef.current.resetStyle(e.target);
              }
            },
            click: (e) => {
              setSelectedDistrictName(dname);
              if (dist) onSelectDistrict(dist);
              try {
                const bounds = e.target.getBounds();
                map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 9.5, duration: 0.8 });
              } catch (err) {}
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
                <div class="text-slate-300">Vulnerability M_v: <b class="text-teal-300 font-mono">×${(dist.vulnerability_multiplier || 1.0).toFixed(2)}</b></div>
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

  // Layer statistics based strictly on verified data
  const isMetricLive = metricMode === 'wbgt' || metricMode === 'temp';
  const isMetricCalc = metricMode === 'risk' || metricMode === 'vulnerability' || metricMode === 'uhi';
  let liveLayersCount = isMetricLive ? 1 : 0;
  let calcLayersCount = isMetricCalc ? 1 : 0;
  if (showUnderservedHighRisk) calcLayersCount += 1;

  let visibleLayersCount = 1; // Base metric
  if (activeLayers.hospitals) visibleLayersCount += 1;
  if (activeLayers.cooling_centers) visibleLayersCount += 1;
  if (showUnderservedHighRisk) visibleLayersCount += 1;

  // Environmental summary statistics for Hospital Impact card (calculated ONLY when forecast exists)
  const peakWbgt = forecastData.length > 0
    ? Math.max(...forecastData.map((d: any) => d.wbgt_max || 0)).toFixed(1)
    : null;
  const goodRecoveryCount = forecastData.filter((d: any) => d.recovery_good === true).length;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[#0B0D0E] text-[#F2F1EC]">
      {/* Map Main Canvas */}
      <div className="flex-1 flex flex-col relative h-[50vh] lg:h-full">
        {/* Top Header: Clean GIS Command Center Bar with Compact Searchable Ward Selector */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Title & Compact Searchable Ward Selector */}
          <div className="bg-[#14171A]/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/[0.08] shadow-2xl pointer-events-auto space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h1 className="text-xs font-bold font-sans text-white tracking-wide uppercase">
                BHUBANESWAR THERMAL RISK MAP
              </h1>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase font-semibold">
                67 WARDS · LIVE DATA
              </span>
            </div>

            {/* Compact Searchable Ward Selector Button & Dropdown */}
            <div ref={wardSelectorRef} className="relative">
              <button
                id="btn-select-ward"
                onClick={() => setWardSelectorOpen(!wardSelectorOpen)}
                className="w-full flex items-center justify-between gap-3 bg-[#0B0D0E]/90 hover:bg-[#1A1F24] border border-white/20 rounded-xl px-2.5 py-1 text-xs font-mono text-slate-100 transition shadow-sm"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold font-sans shrink-0">SELECT WARD:</span>
                  <span className="font-bold text-amber-300 truncate">
                    {selectedWardNo}{(() => {
                      const wNum = Number(String(selectedWardNo || '').replace(/^W/i, '').trim());
                      const loc = getPrimaryLocalityByWard(wNum);
                      return loc ? ` · ${loc}` : '';
                    })()} — {currentWard?.zone || 'Zone'}
                  </span>
                </span>
                <span className="text-slate-400 text-[10px]">▼</span>
              </button>

              {/* Dropdown Menu with Search */}
              {wardSelectorOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#14171A]/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-2 z-[2000] space-y-2">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={wardSearchTerm}
                      onChange={(e) => setWardSearchTerm(e.target.value)}
                      placeholder="Search Ward or Locality (e.g. Pahal, W5)..."
                      autoFocus
                      className="w-full bg-[#0B0D0E] border border-white/15 rounded-lg pl-7 pr-2 py-1 text-[11px] font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-none">
                    {filteredWards.length === 0 ? (
                      <div className="p-2 text-center text-[10px] font-mono text-slate-500">No matching ward</div>
                    ) : (
                      filteredWards.map((w: any) => {
                        const wNo = w.ward_no ? (w.ward_no.startsWith('W') ? w.ward_no : `W${w.ward_no}`) : 'W?';
                        const isCurrent = wNo.toLowerCase() === selectedWardNo.toLowerCase();
                        const wNum = Number(String(w.ward_no || '').replace(/^W/i, '').trim());
                        const primaryLoc = getPrimaryLocalityByWard(wNum);
                        return (
                          <button
                            key={wNo}
                            onClick={() => handleSelectWard(wNo)}
                            className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-[11px] font-mono transition ${
                              isCurrent
                                ? 'bg-sky-500/20 text-white font-bold border border-sky-500/30'
                                : 'text-slate-300 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="truncate">{wNo} {primaryLoc ? `· ${primaryLoc}` : ''}</span>
                              <span className="text-[9px] text-slate-400 font-sans truncate">{w.zone || 'Zone'}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 shrink-0 font-mono">{w.WBGT_celsius ? `${w.WBGT_celsius}°C` : ''}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Toolbar: Visible Layer Counter & Last Updated */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="bg-[#14171A]/95 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/[0.08] shadow-2xl flex items-center gap-2 text-[10px] font-mono">
              <span className="text-slate-400">VISIBLE LAYERS: <b className="text-white">{visibleLayersCount}</b></span>
              <span className="text-slate-700">|</span>
              <span className="text-emerald-400">LIVE: <b>{liveLayersCount}</b></span>
              <span className="text-slate-700">|</span>
              <span className="text-teal-400">CALCULATED: <b>{calcLayersCount}</b></span>
            </div>
            <div className="bg-[#14171A]/95 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/[0.08] shadow-2xl text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>UPDATED {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Collapsible MAP LAYERS Panel */}
        <div className="absolute top-24 left-3 z-[1000] bg-[#14171A]/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl pointer-events-auto max-w-[280px] transition-all">
          <div 
            onClick={() => setLayerPanelOpen(!layerPanelOpen)}
            className="p-3 flex items-center justify-between cursor-pointer border-b border-white/[0.06] select-none hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-white font-sans uppercase tracking-wider">MAP LAYERS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                Controls
              </span>
              <span className="text-slate-400 text-xs">{layerPanelOpen ? '▲' : '▼'}</span>
            </div>
          </div>

          {layerPanelOpen && (
            <div className="p-3 space-y-3 max-h-[calc(100vh-270px)] overflow-y-auto text-xs font-sans scrollbar-none">
              {/* Group 1: THERMAL */}
              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-bold">
                  THERMAL
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setMetricMode('wbgt')}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition ${
                      metricMode === 'wbgt' ? 'bg-sky-500/20 text-white border border-sky-500/40' : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      WBGT Heat Stress
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      LIVE
                    </span>
                  </button>

                  <button
                    onClick={() => setMetricMode('temp')}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition ${
                      metricMode === 'temp' ? 'bg-sky-500/20 text-white border border-sky-500/40' : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      Dry Bulb Temperature
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      LIVE
                    </span>
                  </button>

                  <button
                    onClick={() => setMetricMode('risk')}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition ${
                      metricMode === 'risk' ? 'bg-sky-500/20 text-white border border-sky-500/40' : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-orange-400" />
                      Risk Index (Hazard × M_v)
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      CALCULATED
                    </span>
                  </button>
                </div>
              </div>

              {/* Group 2: EXPOSURE & VULNERABILITY */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-bold">
                  EXPOSURE &amp; VULNERABILITY
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setMetricMode('vulnerability')}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition ${
                      metricMode === 'vulnerability' ? 'bg-sky-500/20 text-white border border-sky-500/40' : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      Vulnerability Index (Census/OSM)
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      CALCULATED
                    </span>
                  </button>

                  <button
                    onClick={() => setMetricMode('uhi')}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition ${
                      metricMode === 'uhi' ? 'bg-sky-500/20 text-white border border-sky-500/40' : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-rose-400" />
                      Urban Heat Island (UHI)
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      CALCULATED
                    </span>
                  </button>

                  {/* MODIS LST - Explicitly Pending Rollout */}
                  <div className="w-full flex items-center justify-between p-1.5 rounded-lg text-slate-500 cursor-not-allowed">
                    <span className="flex items-center gap-2 opacity-60">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      MODIS LST (Surface Skin)
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-white/10 uppercase">
                      PENDING ROLLOUT
                    </span>
                  </div>
                </div>
              </div>

              {/* Group 3: INFRASTRUCTURE */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-bold">
                  INFRASTRUCTURE
                </div>
                <div className="space-y-1">
                  <label className="flex items-center justify-between p-1.5 rounded-lg text-slate-200 hover:bg-white/[0.04] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      Hospitals &amp; Trauma Centers
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-white/10">
                        STATIC REF
                      </span>
                      <input
                        type="checkbox"
                        checked={activeLayers.hospitals}
                        onChange={(e) => setActiveLayers(prev => ({ ...prev, hospitals: e.target.checked }))}
                        className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-950 cursor-pointer"
                      />
                    </div>
                  </label>

                  {/* Live Routing - Explicitly Unavailable */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg text-slate-500 cursor-not-allowed">
                    <span className="flex items-center gap-2 opacity-60">
                      <Send className="w-3.5 h-3.5 text-slate-500" />
                      Live Emergency Routing
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 border border-white/10">
                      UNAVAILABLE
                    </span>
                  </div>

                  <label className="flex items-center justify-between p-1.5 rounded-lg text-slate-200 hover:bg-white/[0.04] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <LifeBuoy className="w-3.5 h-3.5 text-sky-400" />
                      Cooling Hubs Catalog
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-white/10">
                        STATIC REF
                      </span>
                      <input
                        type="checkbox"
                        checked={activeLayers.cooling_centers}
                        onChange={(e) => setActiveLayers(prev => ({ ...prev, cooling_centers: e.target.checked }))}
                        className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-950 cursor-pointer"
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Group 4: OPERATIONS */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-bold">
                  OPERATIONS
                </div>
                <div className="space-y-1">
                  <label className="flex items-center justify-between p-1.5 rounded-lg text-slate-200 hover:bg-white/[0.04] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Underserved High-Risk Filter
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        CALCULATED
                      </span>
                      <input
                        type="checkbox"
                        checked={showUnderservedHighRisk}
                        onChange={(e) => setShowUnderservedHighRisk(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950 cursor-pointer"
                      />
                    </div>
                  </label>

                  <div className="flex items-center justify-between p-1.5 rounded-lg text-slate-500 cursor-not-allowed" title="Dynamically generated safety overlays. No static site directory is assumed.">
                    <span className="flex items-center gap-2 opacity-60">
                      <Sliders className="w-3.5 h-3.5 text-slate-500" />
                      Construction Sites
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 border border-white/10">
                      UNAVAILABLE
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-1.5 rounded-lg text-slate-500 cursor-not-allowed" title="Dynamically generated safety overlays. No static site directory is assumed.">
                    <span className="flex items-center gap-2 opacity-60">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      Schools &amp; Playgrounds
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 border border-white/10">
                      UNAVAILABLE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Single Floating Thermal Risk Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-[#14171A]/95 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl border border-white/[0.08] shadow-2xl text-[11px] font-mono text-slate-300 pointer-events-auto">
          <div className="flex items-center gap-4">
            <span className="font-bold text-white text-xs">THERMAL RISK</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3A7D5C' }}></span>
                <span className="text-[10px]">LOW (&lt;28°C)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C9A227' }}></span>
                <span className="text-[10px]">ELEVATED (28–30°C)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D9772E' }}></span>
                <span className="text-[10px]">HIGH (30–32°C)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C0392B' }}></span>
                <span className="text-[10px]">EXTREME (&gt;32°C)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Right Sidebar: Selected Ward Profile & Redesigned Hospital Impact */}
      <div className="w-full lg:w-[420px] bg-[#0E1114]/95 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-white/[0.08] flex flex-col h-[50vh] lg:h-full overflow-y-auto z-10 p-4 gap-4 scrollbar-none">
        {/* Selected Ward Profile Card */}
        <div className="bg-[#14171A]/90 border border-white/[0.08] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              SELECTED WARD PROFILE
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                currentWard?.RiskTier === 'Red'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : currentWard?.RiskTier === 'Orange'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : currentWard?.RiskTier === 'Yellow'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {currentWard?.RiskTier || 'Yellow'} Alert
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                M_v: ×{(currentWard?.vulnerability_multiplier || 1.15).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-display text-white tracking-tight">
                  {selectedWardNo}
                </h2>
                {(() => {
                  const wNum = Number(String(selectedWardNo || '').replace(/^W/i, '').trim());
                  const primaryLoc = getPrimaryLocalityByWard(wNum);
                  return primaryLoc ? (
                    <span className="text-sm font-semibold text-slate-300">
                      ({primaryLoc})
                    </span>
                  ) : null;
                })()}
              </div>
              <span className="text-xs text-slate-400 font-sans">
                {currentWard?.zone || 'Bhubaneswar'} · Centroid: {currentWard?.centroid_lat?.toFixed(2) || '20.29'}°N, {currentWard?.centroid_lon?.toFixed(2) || '85.82'}°E
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-mono font-black tracking-tight text-amber-400">
                {currentWard?.WBGT_celsius || 32.1}°
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono uppercase font-semibold">
                WBGT Heat Stress
              </span>
            </div>
          </div>

          {/* Thermal Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/[0.08] text-center">
            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[9px] font-mono uppercase">Air Temp</span>
              <span className="text-sm font-bold font-mono text-slate-100">{currentWard?.temperature_c || 38.5}°C</span>
            </div>
            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[9px] font-mono uppercase">WBGT</span>
              <span className="text-sm font-bold font-mono text-amber-400">{currentWard?.WBGT_celsius || 32.1}°C</span>
            </div>
            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[9px] font-mono uppercase">UTCI</span>
              <span className="text-sm font-bold font-mono text-rose-400">{currentWard?.UTCI_celsius || 43.1}°C</span>
            </div>
            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[9px] font-mono uppercase">Hazard</span>
              <span className="text-sm font-bold font-mono text-teal-400">{currentWard?.thermal_hazard_score || 72}/100</span>
            </div>
          </div>

          {/* Vulnerability & Population Grid */}
          <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs font-mono">
            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[9px] uppercase">Population</span>
              <span className="font-bold text-slate-200">
                {currentWard?.population ? Number(currentWard.population).toLocaleString() : '18,500'}
              </span>
            </div>
            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[9px] uppercase">Vuln Score</span>
              <span className="text-teal-300">
                {currentWard?.vulnerability_score || 58}/100
              </span>
            </div>
            <div className="bg-[#0B0D0E]/60 p-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[9px] uppercase">Telemetry</span>
              <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> LIVE
              </span>
            </div>
          </div>

          {/* Alert Dispatch Action */}
          <button
            id={`btn-dispatch-${selectedWardNo}`}
            onClick={() => onDispatchAlert(selectedWardNo)}
            className="w-full mt-3 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 active:scale-[0.99]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch SMS / IVRS Alert to {selectedWardNo}</span>
          </button>
        </div>

        {/* Redesigned Hospital Impact Panel (Strict Data-Truth & Clean Empty State) */}
        <div className="bg-[#14171A]/90 border border-white/[0.08] rounded-2xl p-4 shadow-xl space-y-3">
          {/* Header with Compact Badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5 font-sans">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  HOSPITAL IMPACT
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  EXPERIMENTAL
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                {currentWard?.zone || 'Municipal Zone'}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                WARD {selectedWardNo}
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                EXPERIMENTAL_NOT_VALIDATED
              </span>
            </div>
          </div>

          {/* Compact Provenance Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-[9px] font-mono leading-relaxed">
            <div className="font-bold text-amber-300 uppercase tracking-wider">
              EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA
            </div>
            <div className="font-bold text-amber-400/90 uppercase tracking-wider">
              NOT OPERATIONAL
            </div>
            <div className="text-slate-400 mt-1 flex items-center justify-between border-t border-amber-500/15 pt-1">
              <span>Source: Open-Meteo</span>
              <span>Horizon: 5 days</span>
            </div>
          </div>

          {/* Dynamic Content States */}
          {hospitalLoading ? (
            <div className="py-6 px-3 bg-[#0B0D0E]/60 border border-white/[0.05] rounded-xl text-center space-y-1">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-amber-400 border-t-transparent mb-1"></div>
              <div className="text-xs font-mono text-slate-200 font-bold">WARD {selectedWardNo}</div>
              <div className="text-[10px] font-mono text-slate-400">Loading experimental environmental indicators...</div>
            </div>
          ) : hospitalError ? (
            <div className="py-5 px-3 bg-[#0B0D0E]/60 border border-white/[0.05] rounded-xl text-center space-y-1">
              <AlertTriangle className="w-4 h-4 text-amber-500/80 mx-auto mb-1" />
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                HOSPITAL IMPACT DATA UNAVAILABLE
              </div>
              <div className="text-xs text-slate-300 font-semibold">
                Ward {selectedWardNo}
              </div>
              <p className="text-[10px] text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                Unable to retrieve the experimental environmental indicators.
              </p>
            </div>
          ) : hospitalDemand?.status !== 'EXPERIMENTAL_NOT_VALIDATED' || !forecastData || forecastData.length === 0 ? (
            /* CRITICAL: Clean Empty State with NO fake 0/5 or empty summary cards */
            <div className="py-5 px-3 bg-[#0B0D0E]/60 border border-white/[0.05] rounded-xl text-center space-y-1">
              <AlertTriangle className="w-4 h-4 text-amber-500/80 mx-auto mb-1" />
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                HOSPITAL IMPACT DATA UNAVAILABLE
              </div>
              <div className="text-xs text-slate-300 font-semibold">
                Ward {selectedWardNo}
              </div>
              <p className="text-[10px] text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                No experimental hospital-impact forecast is currently available for this ward.
              </p>
            </div>
          ) : (
            /* SUCCESS STATE: Render Environmental Indicators Strip AND 5-Day Table */
            <div className="space-y-3">
              {/* Environmental Indicators Strip */}
              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold mb-1 px-0.5">
                  ENVIRONMENTAL INDICATORS
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#0B0D0E]/80 rounded-xl border border-white/[0.05] text-center">
                  <div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">5-DAY OUTLOOK</div>
                    <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">5 DAYS</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">PEAK WBGT</div>
                    <div className="text-xs font-bold font-mono text-amber-400 mt-0.5">{peakWbgt}°C</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">RECOVERY</div>
                    <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">{goodRecoveryCount}/5</div>
                  </div>
                </div>
              </div>

              {/* 5-Day Compact Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px] font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400">
                      <th className="py-1.5 px-2 font-semibold">DATE</th>
                      <th className="py-1.5 px-2 font-semibold">WBGT MAX</th>
                      <th className="py-1.5 px-2 font-semibold">T MIN</th>
                      <th className="py-1.5 px-2 font-semibold">RECOVERY</th>
                      <th className="py-1.5 px-2 font-semibold">IMPACT</th>
                      <th className="py-1.5 px-2 font-semibold text-right">ADMISSIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {forecastData.map((day: any, idx: number) => {
                      const tier = (day.ImpactTier || 'Green').toLowerCase();
                      const tierBg =
                        tier === 'red' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                        tier === 'orange' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                        tier === 'yellow' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' :
                        'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                      
                      const formattedDate = day.date ? new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${idx + 1}`;

                      return (
                        <tr key={day.date || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-1.5 px-2 font-medium text-slate-200">{formattedDate}</td>
                          <td className="py-1.5 px-2 text-slate-300 font-bold">{day.wbgt_max != null ? `${day.wbgt_max}°C` : '—'}</td>
                          <td className="py-1.5 px-2 text-slate-400">{day.t_min != null ? `${day.t_min}°C` : '—'}</td>
                          <td className="py-1.5 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${day.recovery_good ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              {day.recovery_good ? 'Good' : 'Not Good'}
                            </span>
                          </td>
                          <td className="py-1.5 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${tierBg}`}>
                              {day.ImpactTier || 'Green'}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-slate-500">
                            {day.predicted_admissions != null ? day.predicted_admissions : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Statewide Thermal Hotspots Leaderboard */}
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
