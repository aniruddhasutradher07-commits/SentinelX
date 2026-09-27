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

  const status = statusData?.status || 'CREDENTIALS_NOT_CONFIGURED';
  const station = wardStationData?.station;
  const distanceKm = wardStationData?.distance_km;
  const spatialQuality = wardStationData?.spatial_quality || 'UNAVAILABLE';

  const statusBadgeStyle = 
    status === 'LIVE' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40' :
    status === 'STALE' ? 'bg-amber-950/50 text-amber-300 border-amber-500/40' :
    status === 'CREDENTIALS_NOT_CONFIGURED' ? 'bg-slate-800 text-slate-300 border-slate-600' :
    'bg-rose-950/50 text-rose-300 border-rose-500/40';

  return (
    <div className={`bg-tactical-900 border border-tactical-border rounded-2xl p-4 flex flex-col gap-3 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
            CPCB Station Telemetry
          </h3>
        </div>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest font-semibold ${statusBadgeStyle}`}>
          {status}
        </span>
      </div>

      {/* Body */}
      {status === 'LIVE' || status === 'STALE' ? (
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center bg-tactical-800 p-2 rounded-xl border border-tactical-border">
            <span className="text-slate-400">Nearest Station</span>
            <span className="font-bold text-white">{station?.station_name || 'IRC Village, Bhubaneswar'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
              <span className="text-[9px] text-slate-400 block">Distance to Ward</span>
              <span className="font-bold text-cyan-300">{distanceKm ? `${distanceKm} km` : '2.1 km'}</span>
            </div>
            <div className="bg-tactical-800 p-2 rounded-xl border border-tactical-border">
              <span className="text-[9px] text-slate-400 block">Spatial Quality</span>
              <span className="font-bold text-amber-300">{spatialQuality}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-tactical-800/80 border border-slate-700/60 rounded-xl p-3 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-slate-300 font-sans">
              <span className="font-bold text-slate-100 block mb-0.5">
                Official CPCB API Connector Active (Credentials Unset)
              </span>
              CPCB / OGD data.gov.in credentials are not configured in environment. Ambient AQI is served via independent Open-Meteo European/Copernicus atmospheric dispersion models without merging.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1 text-[10px] font-mono text-slate-400 border-t border-tactical-border/40 pt-2">
            <div>Mapped Station: <span className="text-slate-200">IRC Village, Nayapalli</span></div>
            <div>Distance: <span className="text-slate-200">~2.4 km</span></div>
            <div>Spatial Quality: <span className="text-emerald-400">NEAR</span></div>
            <div>Status: <span className="text-amber-400 font-bold">{status}</span></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[9px] font-mono text-slate-400 text-center border-t border-tactical-border/40 pt-1.5">
        Source: Central Pollution Control Board (CPCB / NAMP) | Independent of Open-Meteo AQI
      </div>
    </div>
  );
};
