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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col relative dark:bg-boxdark dark:border-strokedark">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-wide dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20">
        [LIVE]
      </div>
      
      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Observed / Input Data</h3>
      
      <div className="grid grid-cols-2 gap-3 flex-1">
        
        {/* Temp */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 dark:bg-meta-4 dark:border-strokedark">
          <div className="p-1.5 bg-red-100 text-red-600 rounded-md shrink-0 dark:bg-red-500/20 dark:text-red-400">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium dark:text-slate-400">Temperature</div>
            <div className="text-lg font-bold text-slate-800 leading-none mt-0.5 dark:text-white">{temp}°C</div>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 dark:bg-meta-4 dark:border-strokedark">
          <div className="p-1.5 bg-sky-100 text-sky-600 rounded-md shrink-0 dark:bg-sky-500/20 dark:text-sky-400">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium dark:text-slate-400">Humidity</div>
            <div className="text-lg font-bold text-slate-800 leading-none mt-0.5 dark:text-white">{humidity}%</div>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 dark:bg-meta-4 dark:border-strokedark">
          <div className="p-1.5 bg-slate-200 text-slate-600 rounded-md shrink-0 dark:bg-slate-700 dark:text-slate-300">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium dark:text-slate-400">Wind Speed</div>
            <div className="text-lg font-bold text-slate-800 leading-none mt-0.5 dark:text-white">{wind} km/h</div>
          </div>
        </div>

        {/* Radiation */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 dark:bg-meta-4 dark:border-strokedark">
          <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md shrink-0 dark:bg-orange-500/20 dark:text-orange-400">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium dark:text-slate-400">Solar Rad</div>
            <div className="text-lg font-bold text-slate-800 leading-none mt-0.5 dark:text-white">{radiation}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
