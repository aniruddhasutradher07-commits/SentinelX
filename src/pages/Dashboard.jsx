import { useEffect, useState } from "react";
import { getWeatherData } from "../services/weatherAPi";
import React from "react";
import Header from "../components/Header";
import WeatherCard from "../components/WeatherCard";
import ThermalStressCard from "../components/ThermalStressCard";
import HeatRiskCard from "../components/HeatRiskCard";
import AIAdvisor from "../components/AIAdvisor";
import ForecastChart from "../components/ForecastChart";
import HeatRiskMap from "../components/HeatRiskMap";
import EarlyWarning from "../components/EarlyWarning";
import StressIndexCard from "../components/StressIndexCard";

import heatData from "../data/heatData";

function Dashboard() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
    async function fetchWeather() {
      try {
        const data = await getWeatherData(28.6139, 77.2090);
        setWeather(data);
      } catch (err) {
        setError("Unable to fetch weather data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">
              Extreme Heat Early Warning System
            </p>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              HeatGuard AI Dashboard
            </h1>

            <p className="text-slate-500 mt-2">
              Monitor environmental conditions and human thermal stress.
            </p>

          </div>

          <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">

            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>

            <span className="text-sm font-medium text-green-700">
              Live Data
            </span>

          </div>

        </div>


        {/* Location */}
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-6">

          <p className="text-sm text-slate-500">
            Current Location
          </p>

          <p className="text-lg font-semibold text-slate-900 mt-1">
            📍 {heatData.location}
          </p>

        </div>


        {/* Weather cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <WeatherCard
            icon="🌡️"
            title="Temperature"
            value={weather ? weather.current.temperature_2m : heatData.temperature}
            unit="°C"
            description="Current air temperature"
          />

          <WeatherCard
            icon="💧"
            title="Humidity"
            value={weather ? weather.current.relative_humidity_2m : heatData.humidity}
            unit="%"
            description="Relative humidity"
          />

          <WeatherCard
            icon="🌡️"
            title="Heat Index"
            value={weather ? weather.current.apparent_temperature : heatData.heatIndex}
            unit="°C"
            description="Feels-like temperature"
          />

        </div>


        {/* Risk section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">

          <HeatRiskCard
            riskLevel={heatData.riskLevel}
            probability={heatData.heatwaveProbability}
          />

          <ThermalStressCard
            score={heatData.thermalStress}
            level={heatData.riskLevel}
          />

          <StressIndexCard
          score={heatData.thermalStress}
          />

        </div>

{/* Forecast Chart */}
<div className="mt-5">

  <ForecastChart />

</div>

{/* Heat Risk Map */}
<div className="mt-5">
  <HeatRiskMap />
</div>

{/* Early Warning */}
<div className="mt-5">
  <EarlyWarning />
</div>

{/* AI Advisor */}
<div className="mt-5">

  <AIAdvisor />

</div>

      </div>

    </main>
  );
}

export default Dashboard;
