import React from 'react';
import { CloudRain, Waves, Tornado, Mountain, Radio } from 'lucide-react';

export default function OtherHazardsCard({ telemetry }) {
  const mh = telemetry?.multi_hazard || {
    overall_status: 'UNAVAILABLE',
    updated_at: 'N/A',
    cyclone: { status: 'UNAVAILABLE', message: 'No Data' },
    heavy_rain: { status: 'UNAVAILABLE', message: 'No Data' },
    flood: { status: 'UNAVAILABLE', message: 'No Data' },
    landslide: { status: 'UNAVAILABLE', message: 'No Data' }
  };

  const getStatusStyles = (status) => {
    if (status === 'ACTIVE' || status === 'EXTREMELY HEAVY RAIN' || status === 'VERY HEAVY RAIN') return 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.3)]';
    if (status === 'WATCH' || status === 'HEAVY RAIN' || status === 'RAINING') return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    if (status === 'NO_ACTIVE_SIGNAL' || status === 'NO ACTIVE SIGNAL' || status === 'NO RAIN') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  };

  const getStatusText = (status) => {
    if (status === 'NO_ACTIVE_SIGNAL') return 'NO ACTIVE SIGNAL';
    return status || 'UNAVAILABLE';
  };

  return (
    <div className="bg-[#14171A] rounded-2xl p-5 border border-white/[0.08]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
          MULTI-HAZARD & SECONDARY THREAT SIGNALS
        </h3>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono text-indigo-400 font-semibold tracking-wider">LIVE HAZARD MONITOR ({mh.overall_status})</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* CYCLONIC DISTURBANCE */}
        <div className="flex flex-col bg-[#0B0D0E] p-3 rounded-xl border border-white/[0.05] justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tornado className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300 font-semibold uppercase">CYCLONIC DISTURBANCE</span>
            </div>
            <div className={`px-2 py-1 mb-2 rounded text-[10px] font-mono font-bold border text-center ${getStatusStyles(mh.cyclone?.status)}`}>
              {getStatusText(mh.cyclone?.status)}
            </div>
            {mh.cyclone?.status && mh.cyclone.status !== 'UNAVAILABLE' && mh.cyclone.status !== 'NO_ACTIVE_SIGNAL' && (
              <div className="text-[10px] text-slate-400 font-mono mb-2">
                <div className="text-white font-bold">{mh.cyclone.system_type || 'SYSTEM'}</div>
                <div>{mh.cyclone.message}</div>
                {mh.cyclone.latitude && mh.cyclone.longitude && (
                  <div className="mt-1">Pos: {mh.cyclone.latitude}°N, {mh.cyclone.longitude}°E</div>
                )}
              </div>
            )}
          </div>
          <div className="text-[9px] text-slate-500 mt-2 border-t border-white/5 pt-2">
            <div>Source: {mh.cyclone?.source || 'IMD'}</div>
            <div>Updated: {mh.cyclone?.fetched_at ? new Date(mh.cyclone.fetched_at).toLocaleTimeString() : 'N/A'}</div>
          </div>
        </div>

        {/* HEAVY RAIN */}
        <div className="flex flex-col bg-[#0B0D0E] p-3 rounded-xl border border-white/[0.05] justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CloudRain className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-slate-300 font-semibold uppercase">HEAVY RAIN (IMD)</span>
            </div>
            <div className={`px-2 py-1 mb-2 rounded text-[10px] font-mono font-bold border text-center ${getStatusStyles(mh.heavy_rain?.status)}`}>
              {getStatusText(mh.heavy_rain?.status)}
            </div>
            {mh.heavy_rain?.status && mh.heavy_rain.status !== 'UNAVAILABLE' && mh.heavy_rain.status !== 'NO_ACTIVE_SIGNAL' && (
              <div className="text-[10px] text-slate-400 mb-2">
                <div>{mh.heavy_rain.message}</div>
              </div>
            )}
          </div>
          <div className="text-[9px] text-slate-500 mt-2 border-t border-white/5 pt-2">
            <div>Source: {mh.heavy_rain?.source || 'IMD'}</div>
            <div>Updated: {mh.heavy_rain?.fetched_at ? new Date(mh.heavy_rain.fetched_at).toLocaleTimeString() : 'N/A'}</div>
          </div>
        </div>
        
        {/* RAIN */}
        <div className="flex flex-col bg-[#0B0D0E] p-3 rounded-xl border border-white/[0.05] justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CloudRain className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-300 font-semibold uppercase">RAIN (OPEN-METEO)</span>
            </div>
            <div className={`px-2 py-1 mb-2 rounded text-[10px] font-mono font-bold border text-center ${getStatusStyles(mh.rain?.status || 'UNAVAILABLE')}`}>
              {getStatusText(mh.rain?.status || 'UNAVAILABLE')}
            </div>
            {mh.rain?.status && mh.rain.status !== 'UNAVAILABLE' && mh.rain.status !== 'NO_ACTIVE_SIGNAL' && (
              <div className="text-[10px] text-slate-400 mb-2 font-mono">
                <div className="text-white font-bold">{mh.rain?.value_mm ?? 'NOT AVAILABLE'} {mh.rain?.value_mm !== undefined && mh.rain?.value_mm !== null ? 'mm / last hour' : ''}</div>
              </div>
            )}
          </div>
          <div className="text-[9px] text-slate-500 mt-2 border-t border-white/5 pt-2">
            <div>Source: {mh.rain?.source || 'Open-Meteo'}</div>
            <div className="flex justify-between">
              <span>Updated: {mh.rain?.fetched_at ? new Date(mh.rain.fetched_at).toLocaleTimeString() : 'N/A'}</span>
              <span className={mh.rain?.freshness === 'LIVE' ? 'text-emerald-400' : 'text-yellow-400'}>{mh.rain?.freshness || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* FLOOD RISK */}
        <div className="flex flex-col bg-[#0B0D0E] p-3 rounded-xl border border-white/[0.05] justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300 font-semibold uppercase">FLOOD RISK</span>
            </div>
            <div className={`px-2 py-1 mb-2 rounded text-[10px] font-mono font-bold border text-center ${getStatusStyles(mh.flood?.status)}`}>
              {getStatusText(mh.flood?.status)}
            </div>
            {mh.flood?.status && mh.flood.status !== 'UNAVAILABLE' && mh.flood.status !== 'NO_ACTIVE_SIGNAL' && (
              <div className="text-[10px] text-slate-400 mb-2">
                <div>{mh.flood.message}</div>
              </div>
            )}
          </div>
          <div className="text-[9px] text-slate-500 mt-2 border-t border-white/5 pt-2">
            <div>Source: {mh.flood?.source || 'CWC / SACHET'}</div>
            <div>Updated: {mh.flood?.fetched_at ? new Date(mh.flood.fetched_at).toLocaleTimeString() : 'N/A'}</div>
          </div>
        </div>

        {/* LANDSLIDE */}
        <div className="flex flex-col bg-[#0B0D0E] p-3 rounded-xl border border-white/[0.05] justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mountain className="w-4 h-4 text-amber-700" />
              <span className="text-xs text-slate-300 font-semibold uppercase">LANDSLIDE</span>
            </div>
            <div className={`px-2 py-1 mb-2 rounded text-[10px] font-mono font-bold border text-center ${getStatusStyles(mh.landslide?.status)}`}>
              {getStatusText(mh.landslide?.status)}
            </div>
            {mh.landslide?.status && mh.landslide.status !== 'UNAVAILABLE' && mh.landslide.status !== 'NO_ACTIVE_SIGNAL' && (
              <div className="text-[10px] text-slate-400 mb-2">
                <div>{mh.landslide.message}</div>
              </div>
            )}
          </div>
          <div className="text-[9px] text-slate-500 mt-2 border-t border-white/5 pt-2">
            <div>Source: {mh.landslide?.source || 'SACHET / official source'}</div>
            <div>Updated: {mh.landslide?.fetched_at ? new Date(mh.landslide.fetched_at).toLocaleTimeString() : 'N/A'}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
