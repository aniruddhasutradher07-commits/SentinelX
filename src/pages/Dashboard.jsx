import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import OverviewTab from "../components/tabs/OverviewTab";
import BiotechTab from "../components/tabs/BiotechTab";
import AnalyticsTab from "../components/tabs/AnalyticsTab";
import CommandTab from "../components/tabs/CommandTab";
import DemographicsTab from "../components/tabs/DemographicsTab";
import { getWeatherData } from "../services/weatherAPi";
import { ShieldAlert, MapPin, Clock } from "lucide-react";

export default function Dashboard({
  districts = [],
  telemetry = null,
  realtimeStatus,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const DISTRICT_COORDS = {
    Khordha: { lat: 20.2961, lon: 85.8245, name: "Khordha (Bhubaneswar Core)" },
    Cuttack: { lat: 20.4625, lon: 85.8830, name: "Cuttack Metro" },
  };

  const [selectedDistrictName, setSelectedDistrictName] = useState("Khordha");
  const [weather, setWeather] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);

  const activeDistrict = districts.find(
    (d) => d.district?.toLowerCase() === selectedDistrictName.toLowerCase()
  ) || {
    district: "Khordha",
    WBGT_celsius: 32.4,
    temperature_c: 39.2,
    relative_humidity_pct: 65,
    RiskTier: "Orange",
    vulnerability_multiplier: 1.18,
    outdoor_worker_pct: 28.5,
    tree_cover_pct: 17.2,
    high_heat_roof_pct: 33.0,
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveWeather() {
      try {
        const coords = DISTRICT_COORDS[selectedDistrictName] || DISTRICT_COORDS.Khordha;
        const data = await getWeatherData(coords.lat, coords.lon);
        
        if (isMounted && data) {
          setWeather(data);
          if (data.hourly && data.hourly.time) {
            const parsedHourly = data.hourly.time.slice(0, 24).map((t, idx) => {
              const temp = data.hourly.temperature_2m[idx];
              const rh = data.hourly.relative_humidity_2m[idx];
              const Tw = temp * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
                Math.atan(temp + rh) - Math.atan(rh - 1.676331) +
                0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
              const wbgt = 0.7 * Tw + 0.3 * temp;
              const risk = Math.round((wbgt / 35.0) * 100);
              return {
                time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                temp: Math.round(temp * 10) / 10,
                risk: Math.max(10, risk),
              };
            });
            setHourlyForecast(parsedHourly);
          }
        }
      } catch (err) {
        console.error("Live weather fetch error:", err);
      }
    }
    fetchLiveWeather();
    return () => { isMounted = false; };
  }, [selectedDistrictName]);

  const liveTemp = weather?.current?.temperature_2m ?? activeDistrict.temperature_c ?? 39.5;

  return (
    <div className="flex h-full w-full bg-[#040817] text-slate-200 overflow-hidden" 
         style={{
           backgroundImage: `radial-gradient(circle at 10% 15%, rgba(0, 242, 254, 0.035) 0%, transparent 40%), radial-gradient(circle at 90% 85%, rgba(255, 94, 54, 0.04) 0%, transparent 45%), linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)`,
           backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px'
         }}>
      
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        
        {/* Jurisdiction Header */}
        <section className="border-b border-white/5 bg-[#060e24]/60 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 hidden md:block">
                Govt of Odisha • OSDMA / NDMA
              </div>
              <h1 className="text-lg lg:text-xl font-bold font-tech text-white tracking-wide">
                Heatwave Operations Command Center
              </h1>
            </div>
            
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                <span>IST {new Date().toLocaleTimeString()}</span>
              </div>
              <span className="text-slate-600">|</span>
              <label className="text-slate-400 font-mono flex items-center gap-1.5" htmlFor="jurisdiction-select">
                <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                JURISDICTION:
              </label>
              <select
                id="jurisdiction-select"
                value={selectedDistrictName}
                onChange={(e) => setSelectedDistrictName(e.target.value)}
                className="bg-black/60 border border-white/10 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan focus:outline-none"
              >
                {Object.keys(DISTRICT_COORDS).map(d => (
                  <option key={d} value={d}>{DISTRICT_COORDS[d].name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Tab Content */}
        <main className="p-6 max-w-[1920px] mx-auto w-full">
          {activeTab === "overview" && (
            <OverviewTab telemetry={telemetry} activeDistrict={activeDistrict} weather={weather} wards={telemetry?.wards?.wards || []} />
          )}
          {activeTab === "biotech" && (
            <BiotechTab activeDistrict={activeDistrict} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab hourlyForecast={hourlyForecast} activeDistrict={activeDistrict} />
          )}
          {activeTab === "command" && (
            <CommandTab activeDistrict={activeDistrict} liveTemp={liveTemp} />
          )}
          {activeTab === "demographics" && (
            <DemographicsTab activeDistrict={activeDistrict} />
          )}
        </main>

      </div>
    </div>
  );
}
