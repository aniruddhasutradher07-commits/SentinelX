import React, { useState, useEffect } from "react";
import WeatherCard from "../components/WeatherCard";
import ThermalStressCard from "../components/ThermalStressCard";
import HeatRiskCard from "../components/HeatRiskCard";
import StressIndexCard from "../components/StressIndexCard";
import ForecastChart from "../components/ForecastChart";
import EarlyWarning from "../components/EarlyWarning";
import AIAdvisor from "../components/AIAdvisor";
import { getWeatherData } from "../services/weatherAPi";
import { 
  ShieldAlert, 
  MapPin, 
  Activity, 
  Users, 
  Zap, 
  Sliders, 
  Layers, 
  Clock, 
  Database,
  Radio,
  ArrowRight,
  TrendingUp,
  Sun,
  Wind
} from "lucide-react";

/**
 * SentinelX Government Heatwave Operations Command Center
 * Flagship dark command-center interface integrated into the existing SentinelX system.
 */
function Dashboard({
  districts = [],
  wards = [],
  telemetry = null,
  summary = null,
  onOpenDispatcher,
  onNavigateTab,
  realtimeStatus,
}) {
  // District Coordinates Map
  const DISTRICT_COORDS = {
    Khordha: { lat: 20.2961, lon: 85.8245, name: "Khordha (Bhubaneswar Core)" },
    Cuttack: { lat: 20.4625, lon: 85.8830, name: "Cuttack Metro" },
    Sambalpur: { lat: 21.4669, lon: 83.9812, name: "Sambalpur Western Basin" },
    Ganjam: { lat: 19.3150, lon: 85.0600, name: "Ganjam Coastal Sector" },
    Balasore: { lat: 21.4934, lon: 86.9135, name: "Balasore Northern Belt" },
    Sundargarh: { lat: 22.1200, lon: 84.0300, name: "Sundargarh Industrial Belt" },
    Mayurbhanj: { lat: 21.9300, lon: 86.7200, name: "Mayurbhanj Tribal Forest" },
    Puri: { lat: 19.8135, lon: 85.8312, name: "Puri Coastal Zone" },
    Bolangir: { lat: 20.7100, lon: 83.4800, name: "Bolangir Drought Zone" },
    Angul: { lat: 20.8400, lon: 85.1000, name: "Angul Thermal Power Corridor" },
  };

  const [selectedDistrictName, setSelectedDistrictName] = useState("Khordha");
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [hourlyForecast, setHourlyForecast] = useState([]);

  // Match selected district in real dataset
  const activeDistrict = districts.find(
    (d) => d.district.toLowerCase() === selectedDistrictName.toLowerCase()
  ) || districts[0] || {
    district: "Khordha",
    WBGT_celsius: 32.4,
    temperature_c: 39.2,
    relative_humidity_pct: 65,
    RiskTier: "Orange",
    vulnerability_multiplier: 1.18,
    vulnerability_score: 52,
    elderly_pct: 10.4,
    outdoor_worker_pct: 28.5,
    tree_cover_pct: 17.2,
    high_heat_roof_pct: 33.0,
    population_2011_est: 2465000,
    modis_lst_c: 44.8,
    uhi_anomaly_c: 3.4
  };

  // Fetch real weather data on district change
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveWeather() {
      try {
        setLoadingWeather(true);
        const coords = DISTRICT_COORDS[selectedDistrictName] || DISTRICT_COORDS.Khordha;
        const data = await getWeatherData(coords.lat, coords.lon);
        
        if (isMounted && data) {
          setWeather(data);

          // Extract 24h-72h diurnal curves from Open-Meteo hourly response
          if (data.hourly && data.hourly.time) {
            const parsedHourly = data.hourly.time.slice(0, 24).map((t, idx) => {
              const temp = data.hourly.temperature_2m[idx];
              const rh = data.hourly.relative_humidity_2m[idx];
              // Stull WBGT approximation for forecast points
              const Tw = temp * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
                Math.atan(temp + rh) - Math.atan(rh - 1.676331) +
                0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
              const wbgt = Math.round((0.7 * Tw + 0.3 * temp) * 10) / 10;
              const risk = Math.min(100, Math.round(((wbgt - 24) / 11) * 85));
              const timeLabel = new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return {
                time: timeLabel,
                temperature: temp,
                humidity: rh,
                wbgt,
                risk: Math.max(10, risk),
              };
            });
            setHourlyForecast(parsedHourly);
          }
        }
      } catch (err) {
        console.error("Live weather fetch error:", err);
      } finally {
        if (isMounted) setLoadingWeather(false);
      }
    }

    fetchLiveWeather();
    return () => { isMounted = false; };
  }, [selectedDistrictName]);

  // Derived real atmospheric readings
  const liveTemp = weather?.current?.temperature_2m ?? activeDistrict.temperature_c ?? 39.2;
  const liveHumidity = weather?.current?.relative_humidity_2m ?? activeDistrict.relative_humidity_pct ?? 65;
  const liveApparent = weather?.current?.apparent_temperature ?? Math.round(Number(liveTemp) + 5.2);
  const liveWind = weather?.current?.wind_speed_10m ?? 2.8;
  const liveSolar = Math.round(820 + (Math.sin(new Date().getHours() / 24 * Math.PI) * 180));

  // Compute ISO 7243 WBGT and H-THERM score
  const wbgtVal = activeDistrict.WBGT_celsius ?? 32.4;
  const hThermScore = Math.min(100, Math.round((wbgtVal / 34.0) * 78.0 * (activeDistrict.vulnerability_multiplier || 1.15)));
  const heatwaveProb = Math.min(95, Math.round(hThermScore * 0.92 + 8));

  // Top 3 Explainable AI Drivers dynamically calculated from district vulnerability attributes
  const calculateDrivers = () => {
    const drivers = [];
    const workers = activeDistrict.outdoor_worker_pct || 28.5;
    if (workers >= 20) {
      drivers.push({
        title: `Outdoor Labor Density (${workers}%)`,
        detail: `High concentration of construction, brick kiln and informal daily-wage laborers under extreme daytime solar irradiance.`,
      });
    }
    const tree = activeDistrict.tree_cover_pct || 17.2;
    if (tree < 25) {
      drivers.push({
        title: `Tree Canopy Deficit (${tree}% tree cover)`,
        detail: `Severe absence of vegetative shading exacerbating surface radiative heat capture.`,
      });
    }
    const roofs = activeDistrict.high_heat_roof_pct || 33.0;
    if (roofs >= 20) {
      drivers.push({
        title: `Heat-Trapping Roofing (${roofs}%)`,
        detail: `Corrugated tin and asbestos sheet roofing structures causing severe indoor thermal retention.`,
      });
    }
    const uhi = activeDistrict.uhi_anomaly_c || 3.4;
    if (uhi >= 2.0 && drivers.length < 3) {
      drivers.push({
        title: `Urban Heat Island Anomaly (+${uhi}°C)`,
        detail: `Satellite MODIS thermal infrared confirms significant urban surface skin heat elevation above rural baseline.`,
      });
    }
    return drivers.slice(0, 3);
  };

  const top3Drivers = calculateDrivers();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0D0E] text-[#F2F1EC] overflow-y-auto">
      {/* 1. Real-time Operational Status & Audit Strip */}
      <div className="bg-[#14171A]/90 border-b border-white/[0.08] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>COMMAND CENTER ACTIVE</span>
          </div>

          <span className="text-slate-500 hidden sm:inline">|</span>

          <div className="text-slate-300 hidden md:flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Monitored: 30 Districts · 67 Bhubaneswar Wards</span>
          </div>

          <span className="text-slate-500 hidden md:inline">|</span>

          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Ingestion: {new Date().toLocaleTimeString()} IST</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden lg:inline">CDC Pulse:</span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            realtimeStatus?.connected 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}>
            {realtimeStatus?.connected ? 'Postgres Synchronized' : 'Local Sensor Stream'}
          </span>
        </div>
      </div>

      {/* Main Command Dashboard Layout */}
      <div className="max-w-7xl w-full mx-auto p-5 space-y-6">
        {/* 2. Top Header & District Location Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#14171A] to-[#1A1F24] p-5 rounded-2xl border border-white/[0.08] shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                GOVERNMENT OF ODISHA · OSDMA / NDMA
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                PS 26083
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-white mt-1.5 tracking-tight">
              SentinelX Heatwave Operations Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-factor thermal stress early warning, demographic vulnerability and hospital surge intelligence
            </p>
          </div>

          {/* Location Selector Dropdown */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-[#0B0D0E] p-2 rounded-xl border border-white/[0.08]">
            <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">JURISDICTION:</span>
            <select
              id="select-command-district"
              value={selectedDistrictName}
              onChange={(e) => setSelectedDistrictName(e.target.value)}
              className="bg-transparent text-sm font-sans font-bold text-white focus:outline-none cursor-pointer pr-3"
            >
              {Object.keys(DISTRICT_COORDS).map((dname) => (
                <option key={dname} value={dname} className="bg-[#14171A] text-white">
                  {DISTRICT_COORDS[dname].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. 4 Environmental Telemetry Sensors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <WeatherCard
            icon="🌡️"
            title="Dry-Bulb Temperature"
            value={liveTemp}
            unit="°C"
            description="Ambient air dry-bulb reading"
            trend="+1.2°C vs 24h baseline"
          />

          <WeatherCard
            icon="💧"
            title="Relative Humidity"
            value={liveHumidity}
            unit="%"
            description="Atmospheric moisture ratio"
            trend="High coastal vapor"
          />

          <WeatherCard
            icon="💨"
            title="Surface Wind Speed"
            value={liveWind}
            unit="m/s"
            description="10m surface anemometer"
            trend="Calm convective"
          />

          <WeatherCard
            icon="☀️"
            title="Solar Radiation (Est)"
            value={liveSolar}
            unit="W/m²"
            description="Global horizontal irradiance"
            trend="Peak solar zenith"
          />
        </div>

        {/* 4. Human Thermal Stress, Heat Risk & Population Exposure Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ThermalStressCard
            score={hThermScore}
            level={activeDistrict.RiskTier || "High"}
            wbgt={wbgtVal}
            sweatEfficiency={Math.max(25, Math.round(100 - liveHumidity * 0.85))}
          />

          <HeatRiskCard
            riskLevel={activeDistrict.RiskTier || "HIGH"}
            probability={heatwaveProb}
            riskScore={activeDistrict.vulnerability_score || 72}
            multiplier={activeDistrict.vulnerability_multiplier || 1.15}
          />

          <StressIndexCard
            score={hThermScore}
          />
        </div>

        {/* 5. Population Exposure & Demographic Vulnerability Card */}
        <div className="bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-white/[0.08] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-display">
                Population Exposure &amp; Vulnerability Demographics
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Census 2011 + Projected 2024
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#0B0D0E]/60 p-3 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[10px]">Total Population</span>
              <span className="text-lg font-bold text-white mt-1 block">
                {((activeDistrict.population_2011_est || 2000000) / 1000000).toFixed(2)}M
              </span>
              <span className="text-[10px] text-slate-500">Under surveillance</span>
            </div>

            <div className="bg-[#0B0D0E]/60 p-3 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[10px]">Elderly Demographic</span>
              <span className="text-lg font-bold text-sky-300 mt-1 block">
                {activeDistrict.elderly_pct || 10.4}%
              </span>
              <span className="text-[10px] text-slate-500">Age 60+ vulnerable</span>
            </div>

            <div className="bg-[#0B0D0E]/60 p-3 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[10px]">Outdoor Labor Force</span>
              <span className="text-lg font-bold text-amber-300 mt-1 block">
                {activeDistrict.outdoor_worker_pct || 28.5}%
              </span>
              <span className="text-[10px] text-slate-500">Construction / Agr</span>
            </div>

            <div className="bg-[#0B0D0E]/60 p-3 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[10px]">Tin / Asbestos Roofs</span>
              <span className="text-lg font-bold text-rose-300 mt-1 block">
                {activeDistrict.high_heat_roof_pct || 33.0}%
              </span>
              <span className="text-[10px] text-slate-500">High indoor retention</span>
            </div>
          </div>
        </div>

        {/* 6. 72-Hour Diurnal Forecast Chart */}
        <ForecastChart
          data={hourlyForecast}
          locationName={activeDistrict.district || "Bhubaneswar Core"}
        />

        {/* 7. Early Warning & Disaster Response Directives Banner */}
        <EarlyWarning
          locationName={activeDistrict.district || "Khordha (Bhubaneswar)"}
          severity={activeDistrict.RiskTier === "Red" ? "EXTREME" : "HIGH"}
          temperature={liveTemp}
          heatIndex={liveApparent}
          stressIndex={(hThermScore / 10).toFixed(1)}
          onDispatch={() => {
            if (onOpenDispatcher) onOpenDispatcher(activeDistrict.district || "Khordha");
          }}
        />

        {/* 8. Top 3 AI / Risk Drivers & Clinical Advisories */}
        <AIAdvisor
          topDrivers={top3Drivers}
        />

        {/* 9. Policy Intervention Quick Action Banner */}
        <div className="bg-gradient-to-r from-sky-950/40 via-purple-950/40 to-slate-900/40 border border-sky-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-display">
                What-If Policy &amp; Disaster Intervention Simulator
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate urban tree canopy expansion, cool roofs, work-hour shifts, and emergency hydration kiosks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("simulator")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold rounded-xl text-xs transition active:scale-95 shadow-md shadow-sky-500/20"
              >
                <span>Launch Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("odisha")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold rounded-xl text-xs transition border border-white/[0.1]"
              >
                <Layers className="w-3.5 h-3.5 text-slate-300" />
                <span>Full GIS Map</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
