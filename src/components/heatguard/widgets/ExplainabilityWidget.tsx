import React from 'react';
import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';

interface ExplainabilityWidgetProps {
  temperature: number;
  humidity: number;
  wind: number;
}

export default function ExplainabilityWidget({ temperature, humidity, wind }: ExplainabilityWidgetProps) {
  const isTempHigh = temperature > 38;
  const isHumHigh = humidity > 60;
  const isWindLow = wind < 10;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col relative dark:bg-boxdark dark:border-strokedark">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
        [CALCULATED]
      </div>
      
      <div className="flex items-center gap-1.5 mb-2 pr-20">
        <AlertTriangle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
        <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate">What changed</h3>
      </div>
      
      <div className="flex flex-col gap-3 flex-1 justify-center text-sm mt-2">
        <div className="space-y-1.5">
          {isTempHigh && (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-xs">
              <span className="font-semibold w-16">Temp</span>
              <ArrowUp className="w-3.5 h-3.5 text-red-500" />
              <span>2.1°C</span>
            </div>
          )}

          {isHumHigh && (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-xs">
              <span className="font-semibold w-16">Humidity</span>
              <ArrowUp className="w-3.5 h-3.5 text-sky-500" />
              <span>8%</span>
            </div>
          )}

          {isWindLow && (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-xs">
              <span className="font-semibold w-16">Wind</span>
              <ArrowDown className="w-3.5 h-3.5 text-orange-500" />
              <span>1.4 m/s</span>
            </div>
          )}

          {(!isTempHigh && !isHumHigh && !isWindLow) && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No extreme environmental factors detected currently.
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-strokedark">
          <span className="font-bold text-slate-700 dark:text-slate-200 block text-xs mb-0.5">Calculated effect:</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Thermal stress increased.</span>
        </div>
      </div>
    </div>
  );
}
