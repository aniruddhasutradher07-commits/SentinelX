import React, { useState } from 'react';
import { Map as MapIcon, Plus, Minus, Crosshair } from 'lucide-react';

interface RiskMapWidgetProps {
  geoJson?: any;
  wardGeoJson?: any;
}

export default function RiskMapWidget({ geoJson, wardGeoJson }: RiskMapWidgetProps) {
  const [activeDay, setActiveDay] = useState('Today');
  
  const layers = [
    { id: 'risk', label: 'Heat Risk', default: true },
    { id: 'temp', label: 'Temperature', default: false },
    { id: 'hum', label: 'Humidity', default: false },
    { id: 'wbgt', label: 'WBGT', default: false },
    { id: 'utci', label: 'UTCI', default: false },
    { id: 'vul', label: 'Vulnerability', default: true },
    { id: 'pop', label: 'Population Density', default: false },
    { id: 'hosp', label: 'Hospitals', default: true },
    { id: 'cool', label: 'Cooling Centers', default: true },
    { id: 'block', label: 'Blocks / Wards', default: false },
  ];

  const days = ['Today', '+1 Day', '+2 Days', '+3 Days', '+4 Days', '+5 Days'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col min-h-[400px]">
      
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <MapIcon className="w-4 h-4 text-slate-500" />
            Khordha Heat Risk Map
          </h3>
          <p className="text-[11px] text-slate-500">Ward / Zone Level Assessment</p>
        </div>
        <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
          ● LIVE
        </div>
      </div>

      <div className="flex-1 relative bg-[#E5E9EC] rounded-lg border border-slate-200 overflow-hidden">
        
        {/* Placeholder Map Background - a stylized representation for the UI */}
        <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/7/92/56.png')] bg-cover bg-center opacity-50"></div>
        
        {/* Mock Khordha Shape (Centered) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[60%] h-[60%] bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 opacity-80 mix-blend-multiply rounded-3xl blur-[2px] transform rotate-12 scale-x-125"></div>
          
          <div className="absolute text-white font-bold text-shadow-sm text-sm" style={{ top: '45%', left: '42%' }}>Khordha</div>
          <div className="absolute text-white/90 font-bold text-shadow-sm text-xs" style={{ top: '35%', left: '55%' }}>Jatni</div>
          <div className="absolute text-white/90 font-bold text-shadow-sm text-xs" style={{ top: '55%', left: '30%' }}>Begunia</div>
        </div>

        {/* Map Controls Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <button className="w-8 h-8 bg-white border border-slate-200 rounded-md shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <Plus className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 bg-white border border-slate-200 rounded-md shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <Minus className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 bg-white border border-slate-200 rounded-md shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 mt-1">
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur border border-slate-200 rounded-lg p-2.5 shadow-sm">
          <div className="flex flex-col gap-1.5 text-[10px] font-medium text-slate-600">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Moderate</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Extreme</div>
          </div>
        </div>

        {/* Map Layers Right */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-3 shadow-sm w-[160px]">
          <h4 className="text-[11px] font-bold text-slate-700 mb-2">Map Layers</h4>
          <div className="flex flex-col gap-1.5 text-[11px] text-slate-600">
            {layers.map(layer => (
              <label key={layer.id} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                <input type="checkbox" defaultChecked={layer.default} className="rounded text-sky-500 border-slate-300 focus:ring-sky-500 w-3 h-3" />
                {layer.label}
              </label>
            ))}
          </div>
        </div>

        {/* Days Toggle Bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur border border-slate-200 rounded-lg shadow-sm p-1 flex">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                activeDay === day 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

      </div>

    </div>
  );
}
