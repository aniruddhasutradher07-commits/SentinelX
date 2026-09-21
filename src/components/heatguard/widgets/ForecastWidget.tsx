import React from 'react';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function ForecastWidget() {
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-sky-600" />
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">5-Day Heat Risk Forecast</h3>
        </div>
        <button className="text-[10px] text-sky-600 font-medium hover:underline">View Details →</button>
      </div>

      <div className="flex justify-between mb-6">
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Risk Trend (Next 5 Days)</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-0.5 bg-red-500"></span> Heat Risk Score</div>
             <div className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-0.5 bg-orange-400"></span> Temperature (°C)</div>
          </div>
        </div>
        <div className="flex-1 w-full relative">
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
