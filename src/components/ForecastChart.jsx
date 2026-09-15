import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { Calendar, Clock, TrendingUp } from "lucide-react";

/**
 * ForecastChart - SentinelX Command Center Edition
 * 24h-72h Diurnal Temperature, Humidity & Thermal Stress Hazard Forecast.
 */
function ForecastChart({ data = [], locationName = "Bhubaneswar Core" }) {
  const [horizon, setHorizon] = useState("24h");

  // Default fallback data if live forecast is loading
  const defaultForecast = [
    { time: "06:00", temperature: 29.5, humidity: 82, risk: 38, wbgt: 27.2 },
    { time: "09:00", temperature: 33.8, humidity: 74, risk: 54, wbgt: 29.8 },
    { time: "12:00", temperature: 38.2, humidity: 62, risk: 78, wbgt: 32.6 },
    { time: "14:00", temperature: 40.1, humidity: 55, risk: 85, wbgt: 33.4 },
    { time: "16:00", temperature: 38.6, humidity: 59, risk: 76, wbgt: 32.1 },
    { time: "18:00", temperature: 34.2, humidity: 68, risk: 58, wbgt: 29.5 },
    { time: "21:00", temperature: 31.0, humidity: 76, risk: 44, wbgt: 28.0 },
    { time: "00:00", temperature: 29.2, humidity: 80, risk: 36, wbgt: 26.8 },
    { time: "03:00", temperature: 28.0, humidity: 84, risk: 32, wbgt: 25.9 },
  ];

  const activeData = data && data.length > 0 ? (horizon === "24h" ? data.slice(0, 12) : data) : defaultForecast;

  return (
    <div className="bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-white/[0.08] p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white font-display">
              72-Hour Thermal Stress &amp; Hazard Forecast
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Diurnal curve of dry-bulb temperature (°C) vs. composite thermal risk index for {locationName}
          </p>
        </div>

        {/* Horizon Toggle */}
        <div className="flex items-center gap-1 bg-[#0B0D0E] p-1 rounded-xl border border-white/[0.06] self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setHorizon("24h")}
            className={`px-3 py-1 rounded-lg transition ${
              horizon === "24h"
                ? "bg-white/[0.12] text-white font-bold shadow-inner"
                : "text-slate-400 hover:text-white"
            }`}
          >
            24-Hour
          </button>
          <button
            onClick={() => setHorizon("72h")}
            className={`px-3 py-1 rounded-lg transition ${
              horizon === "72h"
                ? "bg-white/[0.12] text-white font-bold shadow-inner"
                : "text-slate-400 hover:text-white"
            }`}
          >
            72-Hour Horizon
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={activeData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />

            <XAxis
              dataKey="time"
              tick={{ fill: "#8B9096", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            />

            <YAxis
              yAxisId="temperature"
              domain={[20, 48]}
              tick={{ fill: "#8B9096", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            />

            <YAxis
              yAxisId="risk"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: "#8B9096", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#14171A",
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#F2F1EC",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
              }}
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(val, name) => [
                name === "Dry-Bulb Temp" ? `${val}°C` : `${val} / 100`,
                name,
              ]}
            />

            <Area
              yAxisId="temperature"
              type="monotone"
              dataKey="temperature"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorTemp)"
              name="Dry-Bulb Temp"
            />

            <Area
              yAxisId="risk"
              type="monotone"
              dataKey="risk"
              stroke="#ef4444"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#colorRisk)"
              name="Thermal Risk Index"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-white/[0.08] text-xs font-mono text-slate-400">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded-full bg-amber-400"></span>
            <span>Dry-Bulb Temperature (°C)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded-full bg-rose-500"></span>
            <span>Thermal Risk Index (0-100)</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          Source: Open-Meteo &amp; SentinelX Physics Engine
        </span>
      </div>
    </div>
  );
}

export default ForecastChart;