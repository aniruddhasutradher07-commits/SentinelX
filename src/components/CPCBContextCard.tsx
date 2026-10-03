import React, { useEffect, useState } from 'react';
import { Wind, Info, MapPin } from 'lucide-react';
import { getApiUrl } from '../services/apiConfig';

interface CPCBContextCardProps {
  wardNo?: string;
  className?: string;
}

export const CPCBContextCard: React.FC<CPCBContextCardProps> = ({
  wardNo = 'W14',
  className = ''
}) => {
  const [statusData, setStatusData] = useState<any>(null);
  const [wardStationData, setWardStationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch(getApiUrl('/api/v1/cpcb/status')).then(r => r.json()).catch(() => null),
      fetch(getApiUrl(`/api/v1/cpcb/ward/${encodeURIComponent(wardNo)}`)).then(r => r.json()).catch(() => null)
    ]).then(([st, ws]) => {
      if (isMounted) {
        setStatusData(st);
        setWardStationData(ws);
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [wardNo]);

  const status = statusData?.status || wardStationData?.status || 'CREDENTIALS_NOT_CONFIGURED';
  const stationName = wardStationData?.station_name || wardStationData?.station?.station_name || (statusData?.station_names && statusData.station_names[0]) || null;
  const distanceKm = wardStationData?.distance_to_ward_km || wardStationData?.distance_km;
  const spatialQuality = wardStationData?.spatial_quality || 'UNAVAILABLE';
  const observedAt = wardStationData?.observed_at || statusData?.observed_at || null;
  const fetchedAt = wardStationData?.fetched_at || statusData?.fetched_at || null;
  const aqiVal = wardStationData?.aqi;
  const aqiStd = wardStationData?.aqi_standard || 'IN_NAQI';
  const pollutants = wardStationData?.pollutants || {};

  const statusBadgeStyle = 
    status === 'LIVE' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40' :
    status === 'STALE' || status === 'CACHED' ? 'bg-amber-950/50 text-amber-300 border-amber-500/40' :
    status === 'CREDENTIALS_NOT_CONFIGURED' ? 'bg-slate-800 text-slate-300 border-slate-600' :
    'bg-rose-950/50 text-rose-300 border-rose-500/40';

  return (
    <div className={`bg-tactical-900 border border-tactical-border rounded-2xl p-4 flex flex-col gap-3 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
            CPCB OGD Station Telemetry
          </h3>
        </div>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest font-semibold ${statusBadgeStyle}`}>
          {status === 'LIVE' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />}
          {status}
        </span>
      </div>

      {/* Body */}
      {status === 'LIVE' || status === 'STALE' || status === 'CACHED' ? (
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center bg-tactical-800 p-2 rounded-xl border border-tactical-border">
            <span className="text-slate-400">Station</span>
            <span className="font-bold text-white truncate max-w-[200px]" title={stationName || 'Bhubaneswar Central'}>
              {stationName || 'Bhubaneswar Central Station'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
              <span className="text-[9px] text-slate-400 block">Distance to Ward</span>
              <span className="font-bold text-cyan-300">{distanceKm ? `${distanceKm} km` : 'Near Ward'}</span>
            </div>
            <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
              <span className="text-[9px] text-slate-400 block">Spatial Quality</span>
              <span className="font-bold text-amber-300">{spatialQuality}</span>
            </div>
          </div>

          {aqiVal !== null && aqiVal !== undefined && (
            <div className="flex justify-between items-center bg-tactical-800 p-2 rounded-xl border border-tactical-border">
              <span className="text-slate-400">Computed NAQI (Sub-Index)</span>
              <span className="font-bold text-emerald-400">{Math.round(aqiVal)} ({aqiStd})</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 bg-tactical-850 p-2 rounded-lg border border-white/5">
            <div>
              <span className="block text-slate-500">Observed At:</span>
              <span className="text-slate-300">{observedAt ? observedAt.replace('T', ' ').slice(0, 19) : 'Available'}</span>
            </div>
            <div>
              <span className="block text-slate-500">Fetched At:</span>
              <span className="text-slate-300">{fetchedAt ? fetchedAt.replace('T', ' ').slice(0, 19) : 'Live Cache'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-tactical-800/80 border border-slate-700/60 rounded-xl p-3 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-slate-300 font-sans">
              <span className="font-bold text-slate-100 block mb-0.5">
                Official CPCB API Connector (Fallback Pipeline Active)
              </span>
              {status === 'CREDENTIALS_NOT_CONFIGURED' ? (
                <>CPCB / OGD data.gov.in credentials are not configured in environment. Ambient AQI is served via independent Open-Meteo European/Copernicus atmospheric dispersion models without merging.</>
              ) : (
                <>CPCB station network is currently unavailable from upstream data.gov.in. Telemetry gracefully degraded to Open-Meteo atmospheric reference.</>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1 text-[10px] font-mono text-slate-400 border-t border-tactical-border/40 pt-2">
            <div>Source: <span className="text-slate-200">CPCB / OGD</span></div>
            <div>Status: <span className="text-amber-400 font-bold">{status}</span></div>
            <div>Observed At: <span className="text-slate-400">{observedAt || 'N/A'}</span></div>
            <div>Fetched At: <span className="text-slate-400">{fetchedAt || 'N/A'}</span></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[9px] font-mono text-slate-400 text-center border-t border-tactical-border/40 pt-1.5 flex justify-between items-center">
        <span>Source: Central Pollution Control Board (CPCB / OGD)</span>
        <span className="text-slate-500">Portal: data.gov.in</span>
      </div>
    </div>
  );
};
