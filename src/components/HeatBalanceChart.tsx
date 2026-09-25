import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

const data = [
  { name: 'Evaporative Cooling', value: 45, color: '#38bdf8' },
  { name: 'Radiative/Convective', value: 20, color: '#34d399' },
  { name: 'Retained Thermal Strain', value: 35, color: '#f43f5e' },
];

export const HeatBalanceChart: React.FC = () => {
  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-700/50 flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
          Metabolic Heat Balance
        </h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
          MODELED
        </span>
      </div>
      <p className="text-[10px] text-slate-400 mb-2 font-mono">Thermoregulatory energy distribution</p>
      
      <div className="flex-1 flex items-center justify-center relative min-h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              stroke="none"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              formatter={(value: number) => [`${value}%`, 'Distribution']}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Activity className="w-5 h-5 text-slate-500 mb-1 opacity-50" />
          <span className="text-xs font-bold text-white font-mono">100%</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-300">{item.name}</span>
            </div>
            <span className="text-white font-bold">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
