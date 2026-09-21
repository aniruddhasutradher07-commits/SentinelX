import React from 'react';

interface HeroRiskWidgetProps {
  score: number;
  level: string;
  description: string;
  trend: string;
}

export default function HeroRiskWidget({ score, level, description, trend }: HeroRiskWidgetProps) {
  // SVG Circle calculation
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col justify-between">
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Heat Risk Score</h3>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
          Trend: {trend}
        </span>
      </div>

      <div className="flex items-center gap-5">
        
        {/* Gauge */}
        <div className="relative w-[84px] h-[84px] shrink-0">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="42"
              cy="42"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-red-50"
            />
            {/* Progress circle */}
            <circle
              cx="42"
              cy="42"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-red-600 transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-red-600 leading-none">{score}</span>
            <span className="text-[9px] font-bold text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Text Details */}
        <div>
          <div className="text-2xl font-black text-red-600 uppercase tracking-tight mb-1">
            {level}
          </div>
          <p className="text-sm text-slate-600 leading-snug">
            {description}
          </p>
        </div>

      </div>

    </div>
  );
}
