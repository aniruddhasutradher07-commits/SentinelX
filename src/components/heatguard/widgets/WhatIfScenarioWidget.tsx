import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowDown, AlertTriangle } from 'lucide-react';
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
    const initHI = calculateHeatIndex(initialTemp, initialHum);
    const initWBGT = calculateWBGT(initialTemp, initialHum, initialWindKm / 3.6);
    const initTier = determineRiskTier(initHI, initWBGT);
    setCurrentMetrics({ hi: initHI, wbgt: initWBGT, tier: initTier });
  }, [initialTemp, initialHum, initialWindKm]);

  useEffect(() => {
    const simHI = calculateHeatIndex(temp, hum);
    const simWBGT = calculateWBGT(temp, hum, wind / 3.6);
    const simTier = determineRiskTier(simHI, simWBGT);
    setSimMetrics({ hi: simHI, wbgt: simWBGT, tier: simTier });
  }, [temp, hum, wind]);

  const getTierColor = (tier: string) => {
    const t = tier.toLowerCase();
    if (t === 'extreme' || t === 'red') return 'text-red-500';
    if (t === 'high' || t === 'severe' || t === 'orange') return 'text-orange-500';
    if (t === 'moderate' || t === 'yellow') return 'text-yellow-500';
    return 'text-emerald-500';
  };
  
  const getArrow = (current: number, sim: number) => {
    if (sim > current + 0.1) {
      const diff = (sim - current).toFixed(1);
      return <span className="text-red-500 text-[10px] ml-auto font-bold tracking-widest">+ {diff}°</span>;
    }
    if (sim < current - 0.1) {
      const diff = (current - sim).toFixed(1);
      return <span className="text-emerald-500 text-[10px] ml-auto font-bold tracking-widest">- {diff}°</span>;
    }
    return <span className="text-gray-400 text-[10px] ml-auto font-mono tracking-widest">UNCHANGED</span>;
  };

  const handleReset = () => {
    setTemp(initialTemp);
    setHum(initialHum);
    setWind(initialWindKm);
  };

  return (
    <div className="w-full flex flex-col xl:flex-row items-stretch justify-between gap-8 py-8 border-b border-t border-gray-200 dark:border-white/10 relative">
      
      {/* 1. CURRENT CONDITIONS */}
      <div className="flex flex-col flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">Current Conditions</h3>
        
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Temperature</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{initialTemp.toFixed(1)}°C</span>
          </div>
          <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Humidity</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{initialHum.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Wind</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{initialWindKm.toFixed(1)} <span className="text-xs text-gray-500 font-normal">km/h</span></span>
          </div>
        </div>
      </div>

      {/* CONNECTOR 1 */}
      <div className="hidden xl:flex items-center justify-center shrink-0 text-gray-300 dark:text-gray-700">
        <ArrowRight strokeWidth={1} className="w-8 h-8" />
      </div>
      <div className="flex xl:hidden items-center justify-center text-gray-300 dark:text-gray-700 w-full">
        <ArrowDown strokeWidth={1} className="w-6 h-6" />
      </div>

      {/* 2. ADJUST CONDITIONS */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Adjust Conditions</h3>
          <button onClick={handleReset} className="text-[9px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 uppercase tracking-widest border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded">
            Reset
          </button>
        </div>
        
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex justify-between text-xs text-gray-500 uppercase tracking-widest mb-2">
              <span>Temperature</span>
              <span className="font-bold text-gray-900 dark:text-white">{temp}°C</span>
            </div>
            <input 
              type="range" min="30" max="52" step="1" 
              value={temp} onChange={(e) => setTemp(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 uppercase tracking-widest mb-2">
              <span>Humidity</span>
              <span className="font-bold text-gray-900 dark:text-white">{hum}%</span>
            </div>
            <input 
              type="range" min="10" max="100" step="1" 
              value={hum} onChange={(e) => setHum(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 uppercase tracking-widest mb-2">
              <span>Wind</span>
              <span className="font-bold text-gray-900 dark:text-white">{wind} km/h</span>
            </div>
            <input 
              type="range" min="0" max="40" step="1" 
              value={wind} onChange={(e) => setWind(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      </div>

      {/* CONNECTOR 2 */}
      <div className="hidden xl:flex items-center justify-center shrink-0 text-gray-300 dark:text-gray-700">
        <ArrowRight strokeWidth={1} className="w-8 h-8" />
      </div>
      <div className="flex xl:hidden items-center justify-center text-gray-300 dark:text-gray-700 w-full">
        <ArrowDown strokeWidth={1} className="w-6 h-6" />
      </div>

      {/* 3. SIMULATED RESPONSE */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Simulated Response</h3>
          <div className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/30 uppercase tracking-wide">
            [SIMULATED]
          </div>
        </div>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Heat Index</span>
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-gray-900 dark:text-white">{simMetrics.hi.toFixed(1)}°</span>
              {getArrow(currentMetrics.hi, simMetrics.hi)}
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">WBGT</span>
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-gray-900 dark:text-white">{simMetrics.wbgt.toFixed(1)}°</span>
              {getArrow(currentMetrics.wbgt, simMetrics.wbgt)}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between mt-auto pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Scenario Risk Tier</span>
            <div className={`text-2xl font-bold tracking-tight uppercase ${getTierColor(simMetrics.tier)}`}>
              {simMetrics.tier}
            </div>
            {currentMetrics.tier !== simMetrics.tier && (
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                Shifted from <span className="text-gray-900 dark:text-white">{currentMetrics.tier}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
          <AlertTriangle className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
          <span className="text-[9px] text-gray-500 tracking-wider">UTCI requires advanced solar inputs; unavailable in simulation.</span>
        </div>

      </div>

    </div>
  );
}
