import React, { useState } from 'react';
import { 
  Code, 
  Play, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  RefreshCw,
  Server
} from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  desc: string;
  isAi?: boolean;
  sampleQuery?: string;
  sampleBody?: any;
}

export const ApiExplorer: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<Endpoint>({
    method: 'GET',
    path: '/api/v1/summary',
    desc: 'City-wide & Statewide live KPIs, peak risk zones, and ML hospital surge forecast.',
  });
  const [requestUrl, setRequestUrl] = useState('/api/v1/summary');
  const [requestBody, setRequestBody] = useState('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints: Endpoint[] = [
    {
      method: 'GET',
      path: '/api/v1/summary',
      desc: 'City-wide & Statewide live summary KPIs, peak risk zones, and hospital surge forecast.',
    },
    {
      method: 'GET',
      path: '/api/v1/status',
      desc: 'System health, pipeline metadata, and monitored domains.',
    },
    {
      method: 'GET',
      path: '/api/v1/districts',
      desc: 'All 30 Odisha districts with live thermal metrics (WBGT, HI, UTCI) and risk tiers.',
    },
    {
      method: 'GET',
      path: '/api/v1/districts/Khordha',
      desc: 'Single district deep-dive profile (current weather + 5-day surge predictions).',
    },
    {
      method: 'GET',
      path: '/api/v1/wards',
      desc: 'All 67 Bhubaneswar municipal wards with demographic profiles and UHI offsets.',
    },
    {
      method: 'GET',
      path: '/api/v1/wards/W21',
      desc: 'Single ward deep-dive profile (24h hourly series + DLNM/XGBoost hospital demand).',
    },
    {
      method: 'GET',
      path: '/api/v1/live-feed',
      desc: 'Real-time telemetry stream consumed by dashboard auto-polling (every 15s).',
    },
    {
      method: 'POST',
      path: '/api/v1/ai/copilot',
      desc: 'Google Gemini 1.5 Flash AI Incident Commander operational response engine.',
      isAi: true,
      sampleBody: { message: 'What are the cooling protocols when WBGT exceeds 32C?' },
    },
    {
      method: 'POST',
      path: '/api/v1/ai/advisory',
      desc: 'Multilingual AI emergency SMS/IVRS advisory generator (English, Hindi, and Odia).',
      isAi: true,
      sampleBody: {
        district_or_ward: 'Khordha',
        vulnerability_group: 'outdoor_laborers',
        language: 'or',
      },
    },
    {
      method: 'POST',
      path: '/api/v1/h-therm/calculate',
      desc: 'Computes real-time H-THERM physiological strain, sweat deficit rate, and work-rest cycles.',
      sampleBody: {
        temperature_c: 41.5,
        relative_humidity_pct: 72,
        wind_speed_ms: 1.5,
        solar_radiation_wm2: 850,
        exertion_level: 'heavy',
      },
    },
    {
      method: 'POST',
      path: '/api/v1/alerts/dispatch',
      desc: 'Automated SMS/IVRS emergency advisory trigger simulation via OSDMA/BMC gateway.',
      sampleBody: {
        ward_no: 'W21',
        recipient_phone: '+91-9437012345',
        advisory_text: '🚨 [BMC SENTINELX EMERGENCY ADVISORY] Ward: W21 - Severe thermal strain alert.',
      },
    },
    {
      method: 'GET',
      path: '/api/v1/benchmarks',
      desc: 'Historical NDMA / OSDMA heatwave mortality and hospital surge calibration datasets.',
    },
  ];

  const handleSelectEndpoint = (ep: Endpoint) => {
    setActiveEndpoint(ep);
    setRequestUrl(ep.path);
    setRequestBody(ep.sampleBody ? JSON.stringify(ep.sampleBody, null, 2) : '');
    setResponseData(null);
    setResponseStatus(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponseData(null);
    try {
      const options: RequestInit = {
        method: activeEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (activeEndpoint.method === 'POST' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(requestUrl, options);
      setResponseStatus(res.status);
      const data = await res.json();
      setResponseData(data);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (!responseData) return;
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row h-full">
      {/* Endpoints Sidebar List (4 cols) */}
      <div className="w-full lg:w-96 bg-slate-950/90 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-4 flex flex-col h-[40vh] lg:h-full overflow-y-auto shrink-0 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">REST API Catalog</h2>
        </div>

        {endpoints.map((ep, idx) => {
          const isSelected = activeEndpoint.path === ep.path && activeEndpoint.method === ep.method;
          return (
            <div
              key={idx}
              id={`endpoint-item-${idx}`}
              onClick={() => handleSelectEndpoint(ep)}
              className={`p-2.5 rounded-xl border cursor-pointer transition ${
                isSelected
                  ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm'
                  : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  ep.method === 'GET'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {ep.method}
                </span>
                {ep.isAi && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    AI
                  </span>
                )}
                <span className="font-mono text-xs font-semibold text-slate-200 truncate">{ep.path}</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-sans">{ep.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Main Request & Live Response Console (8 cols) */}
      <div className="flex-1 bg-slate-900/40 p-4 lg:p-6 overflow-y-auto flex flex-col space-y-4">
        {/* Request Header & URL Editor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                activeEndpoint.method === 'GET'
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {activeEndpoint.method}
              </span>
              <span className="text-xs text-slate-300 font-sans">{activeEndpoint.desc}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="input-api-url"
              type="text"
              value={requestUrl}
              onChange={(e) => setRequestUrl(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <button
              id="btn-execute-api"
              onClick={handleExecute}
              disabled={loading}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shrink-0"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Execute</span>
            </button>
          </div>

          {/* JSON Body editor for POST */}
          {activeEndpoint.method === 'POST' && (
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-mono text-slate-400 block">Request Payload (JSON)</label>
              <textarea
                id="textarea-api-body"
                rows={4}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}
        </div>

        {/* Live Response Panel */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300">Live JSON Response</span>
              {responseStatus && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  responseStatus >= 200 && responseStatus < 300
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  HTTP {responseStatus}
                </span>
              )}
            </div>

            {responseData && (
              <button
                id="btn-copy-response"
                onClick={copyResponse}
                className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {responseData ? (
              <pre className="font-mono text-xs text-sky-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-600">
                Click "Execute" above to test the REST API endpoint live.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
