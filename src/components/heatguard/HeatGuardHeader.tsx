import React, { useState } from 'react';
import { Search, MapPin, Bell, Info, X } from 'lucide-react';

export default function HeatGuardHeader() {
  const [showProvenance, setShowProvenance] = useState(false);
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  return (
    <>
      <header className="h-[72px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search location (ward / block / village)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-slate-700"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-6">
          
          <button onClick={() => setShowProvenance(true)} className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-full hover:bg-sky-100 transition-colors">
            <Info className="w-3.5 h-3.5" />
            View Data Provenance
          </button>
          
          {/* Location Selector */}
          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm border-l pl-6 border-r border-slate-200 pr-6">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span>Khordha, Odisha</span>
          </div>

          {/* Live Status & Time */}
          <div className="flex flex-col items-end border-r border-slate-200 pr-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Data
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Updated {currentTime}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              AK
            </div>
          </div>

        </div>
      </header>

      {/* Data Provenance Modal */}
      {showProvenance && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-600" />
                Data Provenance & Reliability
              </h3>
              <button onClick={() => setShowProvenance(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-50">
              <p className="text-xs text-slate-600 mb-4">
                SentinelX distinguishes between raw data, deterministic thermal physics calculations, and experimental machine learning models.
              </p>
              <div className="overflow-hidden rounded border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 uppercase">
                    <tr>
                      <th className="px-3 py-2 font-bold border-b border-slate-200">Layer</th>
                      <th className="px-3 py-2 font-bold border-b border-slate-200">Source</th>
                      <th className="px-3 py-2 font-bold border-b border-slate-200">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-slate-700 divide-y divide-slate-100">
                    <tr><td className="px-3 py-2 font-medium">Weather</td><td className="px-3 py-2">Open-Meteo API</td><td className="px-3 py-2"><span className="text-blue-600 font-bold text-[9px] uppercase border border-blue-200 bg-blue-50 px-1 rounded">Forecast</span></td></tr>
                    <tr><td className="px-3 py-2 font-medium">Heat Index (HI)</td><td className="px-3 py-2">SentinelX Thermal Engine</td><td className="px-3 py-2"><span className="text-emerald-600 font-bold text-[9px] uppercase border border-emerald-200 bg-emerald-50 px-1 rounded">Calculated</span></td></tr>
                    <tr><td className="px-3 py-2 font-medium">WBGT</td><td className="px-3 py-2">SentinelX Thermal Engine</td><td className="px-3 py-2"><span className="text-emerald-600 font-bold text-[9px] uppercase border border-emerald-200 bg-emerald-50 px-1 rounded">Calculated</span></td></tr>
                    <tr><td className="px-3 py-2 font-medium">UTCI</td><td className="px-3 py-2">SentinelX Thermal Engine</td><td className="px-3 py-2"><span className="text-emerald-600 font-bold text-[9px] uppercase border border-emerald-200 bg-emerald-50 px-1 rounded">Calculated</span></td></tr>
                    <tr><td className="px-3 py-2 font-medium">Risk Score</td><td className="px-3 py-2">SentinelX Model</td><td className="px-3 py-2"><span className="text-amber-600 font-bold text-[9px] uppercase border border-amber-200 bg-amber-50 px-1 rounded">Experimental</span></td></tr>
                    <tr><td className="px-3 py-2 font-medium">GIS</td><td className="px-3 py-2">SentinelX GIS Layer</td><td className="px-3 py-2"><span className="text-slate-500 font-bold text-[9px] uppercase border border-slate-200 bg-slate-100 px-1 rounded">Available</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowProvenance(false)} className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow-sm hover:bg-slate-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
