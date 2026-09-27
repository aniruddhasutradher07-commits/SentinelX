import React, { useEffect, useState } from 'react';
import { CloudSun, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../services/apiConfig';

interface IMDContextCardProps {
  district?: string;
  className?: string;
}

export const IMDContextCard: React.FC<IMDContextCardProps> = ({
  district = 'Khordha',
  className = ''
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(getApiUrl(`/api/v1/imd/status?district=${encodeURIComponent(district)}`))
      .then(res => res.json())
      .then(resData => {
        if (isMounted) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setData({
            source: "India Meteorological Department (IMD)",
            source_type: "official_government",
            district,
            status: "CREDENTIALS_NOT_CONFIGURED",
            warning_category: null,
            nowcast: null,
            observed_at: null,
            fetched_at: null,
            reason: "IMD_API_KEY_NOT_CONFIGURED",
            provenance: "Unconfigured"
          });
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [district]);

  const status = data?.status || 'CREDENTIALS_NOT_CONFIGURED';
  const isConfigured = status === 'LIVE' || status === 'STALE';
  const warningCategory = data?.warning_category;

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
          <CloudSun className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
            IMD OFFICIAL CONTEXT
          </h3>
        </div>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest font-semibold ${statusBadgeStyle}`}>
          {status}
        </span>
      </div>

      {/* Main Status / Context Body */}
      {isConfigured ? (
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center bg-tactical-800 p-2 rounded-xl border border-tactical-border">
            <span className="text-slate-400">Jurisdiction</span>
            <span className="font-bold text-white">{data?.district || district}</span>
          </div>
          <div className="flex justify-between items-center bg-tactical-800 p-2 rounded-xl border border-tactical-border">
            <span className="text-slate-400">Official Warning Category</span>
            <span className="font-bold text-amber-300">{warningCategory || 'NO WARNING ACTIVE'}</span>
          </div>
          {data?.nowcast && (
            <div className="bg-tactical-800 p-2.5 rounded-xl border border-tactical-border">
              <span className="text-[10px] text-slate-400 block mb-1">IMD NOWCAST BULLET:</span>
              <p className="text-slate-200 text-xs font-sans leading-relaxed">{data.nowcast}</p>
            </div>
          )}
          <div className="flex justify-between text-[10px] text-slate-500 pt-1">
            <span>Observed: {data?.observed_at ? new Date(data.observed_at).toLocaleTimeString() : 'N/A'}</span>
            <span>Fetched: {data?.fetched_at ? new Date(data.fetched_at).toLocaleTimeString() : 'N/A'}</span>
          </div>
        </div>
      ) : (
        <div className="bg-tactical-800/80 border border-slate-700/60 rounded-xl p-3 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-slate-300 font-sans">
              <span className="font-bold text-slate-100 block mb-0.5">
                Official IMD API Credentials Not Configured
              </span>
              Official IMD warnings are shown strictly when returned by the IMD connector. HeatGuard AI does not synthesize synthetic IMD warnings from external forecasts.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1 text-[10px] font-mono text-slate-400 border-t border-tactical-border/40 pt-2">
            <div>Provider: <span className="text-slate-200">IMD Mausam Portal</span></div>
            <div>District: <span className="text-slate-200">{district}</span></div>
            <div>Warning Category: <span className="text-slate-400">NOT AVAILABLE</span></div>
            <div>Status: <span className="text-amber-400 font-bold">{status}</span></div>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="text-[9px] font-mono text-slate-400 text-center border-t border-tactical-border/40 pt-1.5">
        Source: India Meteorological Department · MoES | Direct Government Telemetry
      </div>
    </div>
  );
};
