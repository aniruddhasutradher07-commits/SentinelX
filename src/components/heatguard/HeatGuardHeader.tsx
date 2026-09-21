import React from 'react';
import { Search, MapPin, Bell, User } from 'lucide-react';

export default function HeatGuardHeader() {
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  return (
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
        
        {/* Location Selector */}
        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm border-r border-slate-200 pr-6">
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
  );
}
