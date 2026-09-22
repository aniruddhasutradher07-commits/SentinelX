import React from 'react';
import { WardRiskRecord } from '../../../types';

interface HeroRiskWidgetProps {
  ward: WardRiskRecord;
}

export default function HeroRiskWidget({ ward }: HeroRiskWidgetProps) {
  if (!ward) return null;

  const score = Math.round(ward.WardRiskScore || 0);
  const tier = (ward.RiskTier || 'EXTREME').toUpperCase();
  const geoText = `Bhubaneswar Urban Core · Ward ${String(ward.ward_no).replace('Ward ', '')}`;

  const temp = ward.temperature_c?.toFixed(1) || '--';
  const hum = ward.relative_humidity_pct?.toFixed(0) || '--';
  const wind = ward.wind_speed_ms?.toFixed(1) || '--';
  const solar = ward.solar_radiation_wm2?.toFixed(0) || '--';

  const getRiskColor = (t: string) => {
    if (t === 'EXTREME' || t === 'RED') return 'text-red-500';
    if (t === 'HIGH' || t === 'ORANGE') return 'text-orange-500';
    if (t === 'MODERATE' || t === 'YELLOW') return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const colorClass = getRiskColor(tier);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 w-full py-6">
      
      {/* LEFT: Dominant Risk Score */}
      <div className="flex flex-col">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-6">Current Heat Risk</h2>
        
        <div className="flex items-baseline gap-6">
          <div className={`text-[88px] font-bold leading-none tracking-tighter ${colorClass}`}>
            {score}
          </div>
          <div className="flex flex-col justify-end pb-2">
            <div className={`text-3xl font-bold tracking-tight uppercase ${colorClass}`}>
              {tier}
            </div>
            <div className="text-gray-400 text-sm tracking-wide mt-1">
              {geoText}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Telemetry Context */}
      <div className="flex gap-8 md:gap-12 pb-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</span>
          <span className="text-2xl font-semibold text-gray-900 dark:text-white">{temp}°C</span>
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 mt-1 uppercase tracking-widest opacity-80">[LIVE]</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Humidity</span>
          <span className="text-2xl font-semibold text-gray-900 dark:text-white">{hum}%</span>
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 mt-1 uppercase tracking-widest opacity-80">[LIVE]</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wind</span>
          <span className="text-2xl font-semibold text-gray-900 dark:text-white">{wind}m/s</span>
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 mt-1 uppercase tracking-widest opacity-80">[LIVE]</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Solar</span>
          <span className="text-2xl font-semibold text-gray-900 dark:text-white">{solar}W/m²</span>
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 mt-1 uppercase tracking-widest opacity-80">[LIVE]</span>
        </div>
      </div>
      
    </div>
  );
}
