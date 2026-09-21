import React, { useState, useEffect } from 'react';
import { Sliders, ArrowRight } from 'lucide-react';
import { calculateHeatIndex, calculateWBGT, determineRiskTier } from '../../../utils/thermalMath';

interface WhatIfScenarioWidgetProps {
  initialTemp: number;
  initialHum: number;
  initialWindKm: number;
}

export default function WhatIfScenarioWidget({ initialTemp, initialHum, initialWindKm }: WhatIfScenarioWidgetProps) {
  const [temp, setTemp] = useState(initialTemp);
  const [hum, setHum] = useState(initialHum);
  const [wind, setWind] = useState(initialWindKm);

  const [currentMetrics, setCurrentMetrics] = useState({ hi: 0, wbgt: 0, tier: 'UNKNOWN' });
  const [simMetrics, setSimMetrics] = useState({ hi: 0, wbgt: 0, tier: 'UNKNOWN' });

  useEffect(() => {
    // Initial metrics calculation
    const initHI = calculateHeatIndex(initialTemp, initialHum);
    const initWBGT = calculateWBGT(initialTemp, initialHum, initialWindKm / 3.6);
    const initTier = determineRiskTier(initHI, initWBGT);
    setCurrentMetrics({ hi: initHI, wbgt: initWBGT, tier: initTier });
  }, [initialTemp, initialHum, initialWindKm]);

  useEffect(() => {
    // Simulated metrics calculation
    const simHI = calculateHeatIndex(temp, hum);
    const simWBGT = calculateWBGT(temp, hum, wind / 3.6);
    const simTier = determineRiskTier(simHI, simWBGT);
    setSimMetrics({ hi: simHI, wbgt: simWBGT, tier: simTier });
  }, [temp, hum, wind]);

  const getTierColor = (tier: string) => {
    if (tier === 'EXTREME') return 'text-red-600 bg-red-50 border-red-100';
    if (tier === 'HIGH') return 'text-orange-600 bg-orange-50 border-orange-100';
    if (tier === 'MODERATE') return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };
  
  const getArrow = (current: number, sim: number) => {
    if (sim > current + 0.5) return <span className="text-red-500 text-[10px]">↑</span>;
    if (sim < current - 0.5) return <span className="text-emerald-500 text-[10px]">↓</span>;
    return <span className="text-slate-400 text-[10px]">-</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col relative">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
        Calculated
      </div>
      <div className="flex items-center gap-1.5 mb-4 pr-16">
        <Sliders className="w-4 h-4 text-purple-600 shrink-0" />
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">Simulate Future Conditions</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        
        {/* LEFT: SLIDERS */}
        <div className="flex flex-col gap-3 justify-center border-r border-slate-100 pr-4">
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Temp (°C)</span>
              <span className="font-bold text-slate-800">{temp}°</span>
            </div>
            <input 
              type="range" min="30" max="52" step="1" 
              value={temp} onChange={(e) => setTemp(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Humidity (%)</span>
              <span className="font-bold text-slate-800">{hum}%</span>
            </div>
            <input 
              type="range" min="10" max="100" step="1" 
              value={hum} onChange={(e) => setHum(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Wind (km/h)</span>
              <span className="font-bold text-slate-800">{wind}</span>
            </div>
            <input 
              type="range" min="0" max="40" step="1" 
              value={wind} onChange={(e) => setWind(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* RIGHT: RESULTS */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">Current</span>
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getTierColor(currentMetrics.tier)}`}>
                {currentMetrics.tier}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <div className="text-center">
              <span className="block text-[9px] text-purple-400 font-bold uppercase tracking-wider mb-1">Simulated</span>
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getTierColor(simMetrics.tier)}`}>
                {simMetrics.tier}
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500">WBGT Stress</span>
              <div className="flex items-center gap-1 font-bold text-slate-700">
                {simMetrics.wbgt.toFixed(1)}° {getArrow(currentMetrics.wbgt, simMetrics.wbgt)}
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500">Heat Index</span>
              <div className="flex items-center gap-1 font-bold text-slate-700">
                {simMetrics.hi.toFixed(1)}° {getArrow(currentMetrics.hi, simMetrics.hi)}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
