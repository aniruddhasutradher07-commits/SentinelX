import React from 'react';
import { Activity } from 'lucide-react';

interface ThermalStressWidgetProps {
  hi: number;
  wbgt: number;
  utci: number;
}

export default function ThermalStressWidget({ hi, wbgt, utci }: ThermalStressWidgetProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Calculated Indices</h3>
        <Activity className="w-4 h-4 text-slate-400" />
      </div>
      
      <div className="flex flex-col gap-2.5 flex-1 justify-center">
        
        {/* HI */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-orange-100 bg-orange-50/30">
          <div>
            <div className="text-xs font-bold text-slate-700">Heat Index (HI)</div>
            <div className="text-[10px] text-slate-500">Apparent temperature</div>
          </div>
          <div className="text-xl font-black text-orange-600">{hi}°C</div>
        </div>

        {/* WBGT */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-red-100 bg-red-50/30">
          <div>
            <div className="text-xs font-bold text-slate-700">WBGT</div>
            <div className="text-[10px] text-slate-500">Occupational limit</div>
          </div>
          <div className="text-xl font-black text-red-600">{wbgt}°C</div>
        </div>

        {/* UTCI */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-rose-100 bg-rose-50/30">
          <div>
            <div className="text-xs font-bold text-slate-700">UTCI</div>
            <div className="text-[10px] text-slate-500">Universal Thermal</div>
          </div>
          <div className="text-xl font-black text-rose-600">{utci}°C</div>
        </div>

      </div>
    </div>
  );
}
