import React from 'react';
import { Thermometer, Droplets, Wind, Sun } from 'lucide-react';

interface WeatherInputsWidgetProps {
  temp: number;
  humidity: number;
  wind: number;
  radiation: string;
}

export default function WeatherInputsWidget({ temp, humidity, wind, radiation }: WeatherInputsWidgetProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col">
      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Observed / Input Data</h3>
      
      <div className="grid grid-cols-2 gap-3 flex-1">
        
        {/* Temp */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="p-1.5 bg-red-100 text-red-600 rounded-md shrink-0">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Temperature</div>
            <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">{temp}°C</div>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="p-1.5 bg-sky-100 text-sky-600 rounded-md shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Humidity</div>
            <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">{humidity}%</div>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="p-1.5 bg-slate-200 text-slate-600 rounded-md shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Wind Speed</div>
            <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">{wind} km/h</div>
          </div>
        </div>

        {/* Radiation */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md shrink-0">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Solar Rad</div>
            <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">{radiation}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
