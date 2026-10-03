import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Database, Radio, Globe2, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../services/apiConfig';

interface SourceHealthPanelProps {
  telemetry?: any;
  className?: string;
}

interface SourceStatus {
  name: string;
  provider: string;
  state: 'LIVE' | 'CACHED' | 'STALE' | 'EXPERIMENTAL' | 'STATIC REFERENCE' | 'CREDENTIALS_NOT_CONFIGURED' | 'UNAVAILABLE' | string;
  role: string;
  details?: string;
  updatedAt?: string | null;
}

export const SourceHealthPanel: React.FC<SourceHealthPanelProps> = ({ telemetry, className = '' }) => {
  const [cpcbStatus, setCpcbStatus] = useState<any>(null);
  const [imdStatus, setImdStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch(getApiUrl('/api/v1/cpcb/status')).then(r => r.json()).catch(() => null),
      fetch(getApiUrl('/api/v1/imd/status')).then(r => r.json()).catch(() => null),
    ]).then(([cpcb, imd]) => {
      if (isMounted) {
        setCpcbStatus(cpcb);
        setImdStatus(imd);
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [telemetry?.sync_timestamp]);

  // 1. Open-Meteo state
  const rawWeather = telemetry?.data_quality?.weather || (telemetry?.is_demo_fallback ? 'DEMO' : 'LIVE');
  let openMeteoState = 'LIVE';
  if (telemetry?.is_demo_fallback || rawWeather?.includes('SYNTHETIC')) {
    openMeteoState = 'DEMO / SYNTHETIC — NOT LIVE';
  } else if (rawWeather === 'STALE') {
    openMeteoState = 'STALE';
  } else if (rawWeather === 'UNAVAILABLE') {
    openMeteoState = 'UNAVAILABLE';
  }

  // 2. CPCB OGD state
  const cpcbRawState = cpcbStatus?.status || (cpcbStatus?.credentials_configured === false ? 'CREDENTIALS_NOT_CONFIGURED' : 'CREDENTIALS_NOT_CONFIGURED');
  let cpcbState = cpcbRawState;
  if (!['LIVE', 'CACHED', 'STALE', 'CREDENTIALS_NOT_CONFIGURED', 'UNAVAILABLE'].includes(cpcbRawState)) {
    cpcbState = 'UNAVAILABLE';
  }

  // 3. IMD state
  const imdRawState = imdStatus?.status || 'CREDENTIALS_NOT_CONFIGURED';
  let imdState = imdRawState;
  if (!['LIVE', 'CACHED', 'STALE', 'CREDENTIALS_NOT_CONFIGURED', 'UNAVAILABLE'].includes(imdRawState)) {
    imdState = 'UNAVAILABLE';
  }

  const sources: SourceStatus[] = [
    {
      name: 'Open-Meteo',
      provider: 'European ECMWF / DWD',
      state: openMeteoState,
      role: 'Live Ambient Temp, RH, Wind & Atmospheric AQI',
      details: telemetry?.sync_time_display ? `Sync: ${telemetry.sync_time_display}` : '10m Automated Polling',
      updatedAt: telemetry?.sync_timestamp
    },
    {
      name: 'CPCB OGD',
      provider: 'data.gov.in / NAMP',
      state: cpcbState,
      role: 'National Air Quality Monitoring Programme Stations',
      details: cpcbStatus?.stations_reporting ? `${cpcbStatus.stations_reporting} Station(s) Linked` : 'Haversine Nearest Station',
      updatedAt: cpcbStatus?.observed_at || cpcbStatus?.fetched_at
    },
    {
      name: 'IMD',
      provider: 'India Meteorological Dept',
      state: imdState,
      role: 'Official District Nowcasts & Severe Weather Warnings',
      details: imdStatus?.warning_category ? `Alert: ${imdStatus.warning_category}` : 'District Synoptic Feed',
      updatedAt: imdStatus?.observed_at || imdStatus?.fetched_at
    },
    {
      name: 'ERA5',
      provider: 'Copernicus CDS (ECMWF)',
      state: 'STATIC REFERENCE',
      role: '5-Year Reanalysis Baseline (2021-2025 Climatology)',
      details: '262k Hourly CDS Records · 36 Features',
      updatedAt: '2025-12-31'
    },
    {
      name: 'Bhuvan',
      provider: 'ISRO / NRSC',
      state: 'EXPERIMENTAL',
      role: 'LULC 50K AOI Land Cover & Urban Canopy Statistics',
      details: 'Bhubaneswar Urban Geometry AOI',
      updatedAt: null
    }
  ];

  const getBadgeStyle = (st: string) => {
    switch (st) {
      case 'LIVE':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40';
      case 'CACHED':
      case 'STALE':
        return 'bg-amber-950/50 text-amber-300 border-amber-500/40';
      case 'STATIC REFERENCE':
        return 'bg-slate-900 text-slate-300 border-slate-700';
      case 'EXPERIMENTAL':
        return 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-500/40';
      case 'CREDENTIALS_NOT_CONFIGURED':
        return 'bg-amber-950/40 text-amber-400 border-amber-600/40';
      case 'DEMO / SYNTHETIC — NOT LIVE':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/50';
      default:
        return 'bg-rose-950/50 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className={`glass-panel rounded-xl p-4 border border-cyan-900/40 bg-gradient-to-r from-[#060e24]/90 via-[#07132e]/90 to-[#040a1c]/90 text-slate-300 font-mono shadow-md ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-tech">
            Source Health &amp; Ingestion Registry
          </h3>
        </div>
        <span className="text-[9px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
          5 Monitored Providers
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {sources.map((s) => (
          <div
            key={s.name}
            className="bg-[#030712]/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              <div className="flex justify-between items-start gap-1 mb-1.5">
                <span className="font-bold text-white text-xs">{s.name}</span>
                <span className={`text-[8.5px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold whitespace-nowrap ${getBadgeStyle(s.state)}`}>
                  {s.state === 'LIVE' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />}
                  {s.state}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mb-1">{s.provider}</div>
              <p className="text-[9px] text-slate-500 leading-tight mb-2 line-clamp-2">{s.role}</p>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80 text-[8.5px] text-slate-400 flex justify-between items-center">
              <span className="truncate">{s.details}</span>
              {s.updatedAt && (
                <span className="text-[8px] text-slate-500 shrink-0 ml-1">
                  {s.updatedAt.slice(0, 10)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
