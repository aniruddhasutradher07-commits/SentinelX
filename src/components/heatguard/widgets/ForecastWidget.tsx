import React from 'react';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function ForecastWidget() {
  // Using static demo data to illustrate the shape of a 5-day forecast
  // since a validated 5-day ML risk forecast endpoint is not currently available
  const forecast = [
    { day: 'Today', date: '15 Sep', level: 'Extreme', hi: 42, lo: 30 },
    { day: 'Tue', date: '16 Sep', level: 'Extreme', hi: 41, lo: 29 },
    { day: 'Wed', date: '17 Sep', level: 'High', hi: 39, lo: 28 },
    { day: 'Thu', date: '18 Sep', level: 'High', hi: 38, lo: 27 },
    { day: 'Fri', date: '19 Sep', level: 'Moderate', hi: 36, lo: 27 },
  ];

  const chartData = [
    { name: 'Today', score: 82, temp: 45 },
    { name: 'D1', score: 80, temp: 44 },
    { name: 'D2', score: 65, temp: 40 },
    { name: 'D3', score: 62, temp: 38 },
    { name: 'D4', score: 50, temp: 36 },
    { name: 'D5', score: 45, temp: 35 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col relative">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wide">
        Demo Data
      </div>
      
      <div className="flex items-center justify-between mb-4 pr-20">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-sky-600 shrink-0" />
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">5-Day Heat Risk Forecast</h3>
        </div>
      </div>

      <div className="flex justify-between mb-6 border-b border-slate-100 pb-4">
        {forecast.map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-slate-700">{f.day}</span>
            <span className="text-[10px] text-slate-500">{f.date}</span>
            <div className={`w-3 h-3 rounded-full mt-1 mb-1 ${
              f.level === 'Extreme' ? 'bg-red-600' : 
              f.level === 'High' ? 'bg-orange-500' : 'bg-yellow-400'
            }`}></div>
            <span className={`text-[10px] font-bold ${
              f.level === 'Extreme' ? 'text-red-600' : 
              f.level === 'High' ? 'text-orange-500' : 'text-yellow-600'
            }`}>{f.level}</span>
            <span className="text-[10px] text-slate-600 mt-1">{f.hi}° / {f.lo}°</span>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-[140px] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Model Risk Horizon (Unvalidated)</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-0.5 bg-red-500"></span> Risk Prediction</div>
             <div className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-0.5 bg-orange-400"></span> Weather Forecast (°C)</div>
          </div>
        </div>
        <div className="flex-1 w-full relative mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} dy={5} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} domain={[30, 50]} />
              <Line yAxisId="left" type="monotone" dataKey="score" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} />
              <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={2} dot={{ r: 3, fill: '#F97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
