import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { WardRiskRecord } from '../../../types';

interface AIInsightsWidgetProps {
  wards: WardRiskRecord[];
}

export default function AIInsightsWidget({ wards }: AIInsightsWidgetProps) {
  // Generate insights based on actual data
  const insights: string[] = [];
  
  if (wards && wards.length > 0) {
    const topWard = [...wards].sort((a, b) => (b.WardRiskScore || 0) - (a.WardRiskScore || 0))[0];
    
    // Insight 1: Risk Trend
    insights.push(
      topWard.RiskTier === 'Red' || topWard.RiskTier === 'Orange' 
        ? "Elevated thermal risk detected across monitored zones."
        : "Risk trend remains stable within moderate parameters."
    );
    
    // Insight 2: Peak zone
    if (topWard && topWard.zone) {
      insights.push(`Top high-risk zone identified: ${topWard.zone} (${Math.round(topWard.WardRiskScore)}/100).`);
    }

    // Insight 3: Environmental drivers
    if (topWard && topWard.temperature_c > 38 && topWard.relative_humidity_pct > 60) {
      insights.push("Compounding effect of high temperature and humidity is amplifying thermal stress.");
    } else if (topWard && topWard.temperature_c > 40) {
      insights.push("Extreme dry-bulb temperature is the primary driver of risk.");
    } else if (topWard && topWard.relative_humidity_pct > 70) {
      insights.push("High relative humidity is significantly suppressing evaporative cooling.");
    }
  }

  if (insights.length === 0) {
    insights.push("Awaiting sufficient telemetry to generate analytical insights.");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col flex-1 relative dark:bg-boxdark dark:border-strokedark">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase tracking-wide dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
        Model Prediction
      </div>
      <div className="flex items-center justify-between mb-4 pr-16">
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">AI Insights</h3>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2.5">
        {insights.slice(0, 4).map((insight, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-tight">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
