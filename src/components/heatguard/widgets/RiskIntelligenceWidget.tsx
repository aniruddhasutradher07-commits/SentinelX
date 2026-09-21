import React from 'react';
import { Target } from 'lucide-react';
import { WardRiskRecord } from '../../../types';

interface RiskIntelligenceWidgetProps {
  wards: WardRiskRecord[];
  district: string;
}

export default function RiskIntelligenceWidget({ wards, district }: RiskIntelligenceWidgetProps) {
  const isKhordha = district.toLowerCase() === 'khordha';
  
  // Sort wards by risk score descending
  const topWards = [...(wards || [])].sort((a, b) => (b.WardRiskScore || 0) - (a.WardRiskScore || 0)).slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col relative">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-wide">
        Live
      </div>
      
      <div className="flex items-center gap-1.5 mb-4 pr-12">
        <Target className="w-4 h-4 text-sky-600 shrink-0" />
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">Top High-Risk Zones</h3>
      </div>

      {isKhordha ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-xs text-slate-500 font-mono p-4 border border-dashed border-slate-200 rounded bg-slate-50">
            Ward-level data unavailable for full district. Please select Bhubaneswar Urban Core.
          </p>
        </div>
      ) : topWards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-xs text-slate-500">Data unavailable</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {topWards.map((ward, i) => (
            <div key={ward.ward_no || i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 w-3">{i + 1}</span>
                <span className="text-[11px] font-semibold text-slate-700">Ward {ward.ward_no}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                ward.RiskTier === 'Red' ? 'bg-red-50 text-red-600 border border-red-100' :
                ward.RiskTier === 'Orange' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                ward.RiskTier === 'Yellow' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                {ward.RiskTier?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          ))}
        </div>
      )}

      <button className="w-full mt-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors uppercase tracking-wide">
        View All Zones
      </button>
    </div>
  );
}
