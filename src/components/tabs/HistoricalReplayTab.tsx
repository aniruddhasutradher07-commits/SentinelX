import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  History, 
  Flame, 
  Activity, 
  ShieldAlert, 
  FileText, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen
} from 'lucide-react';
import { getApiUrl } from '../../services/apiConfig';
import { StatCard } from '../ui/StatCard';
import { SectionHeader } from '../ui/SectionHeader';

interface DayPlayback {
  day_number: number;
  day_title: string;
  real_weather: {
    temp_c: number;
    humidity_pct: number;
    night_min_temp_c: number;
    provenance: string;
  };
  modelled_htsi: {
    score: number;
    risk_tier: string;
    feels_like_c: number;
    provenance: string;
  };
  modelled_surge: {
    expected_daily_admissions: number;
    surge_pct: number;
    icu_utilization_pct: number;
    provenance: string;
  };
  modelled_directives: string[];
}

interface EventSummary {
  event_year: number;
  event_name: string;
  date_range: string;
  location: string;
  reported_peak_temp_c: number;
  confirmed_deaths_label: string;
  source_citation: string;
  provenance_badge: string;
  historical_context: string;
}

interface PlaybackApiResponse {
  status: string;
  event_summary: EventSummary;
  playback_state: {
    current_step: number;
    total_steps: number;
    current_day: DayPlayback;
  };
  all_days: DayPlayback[];
}

export default function HistoricalReplayTab() {
  const [selectedYear, setSelectedYear] = useState<string>('1998');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackData, setPlaybackData] = useState<PlaybackApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPlayback = async (year: string, step: number) => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/historical-replay/playback?year=${year}&day_step=${step}`));
      const json = await res.json();
      if (json.status === 'success') {
        setPlaybackData(json);
      }
    } catch (e) {
      console.error('Failed to fetch historical playback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayback(selectedYear, currentStep);
  }, [selectedYear, currentStep]);

  // Handle Play/Pause auto-advance timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= 5) {
            setIsPlaying(false);
            return 1;
          }
          return prev + 1;
        });
      }, 2500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setCurrentStep(1);
    setIsPlaying(false);
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    setIsPlaying(false);
  };

  const summary = playbackData?.event_summary;
  const currentDay = playbackData?.playback_state.current_day;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-tactical-800/80 border border-tactical-border p-5 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-wide">Historical Event Replay Engine</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
              [REAL SOURCED BENCHMARKS]
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full">
              [MODELLED RECONSTRUCTION]
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Reconstruct day-by-day thermal strain curves, ER hospital surge forecasts, and Action Engine statutory directives across Odisha's landmark heatwave catastrophes.
          </p>
        </div>

        {/* Year Selector Buttons */}
        <div className="flex items-center gap-2 bg-tactical-850/80 p-1.5 rounded-xl border border-tactical-border shrink-0">
          {[
            { year: '1998', label: '1998 Catastrophe', deaths: '~2,042 Deaths' },
            { year: '2015', label: '2015 Pre-Monsoon', deaths: '67 Deaths' },
            { year: '2019', label: '2019 Cyclone Fani', deaths: '2.2x Surge' },
          ].map(item => (
            <button
              key={item.year}
              onClick={() => handleYearChange(item.year)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center ${
                selectedYear === item.year
                  ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-rose-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] font-mono opacity-80">{item.deaths}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sourced NDMA Event Profile Banner */}
      {summary && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border border-tactical-border rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-tactical-border pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">{summary.event_name}</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono">
                [{summary.provenance_badge}]
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Jurisdiction: <span className="text-white font-semibold">{summary.location}</span> ({summary.date_range})
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl">
              <span className="text-slate-400 text-xs block">Sourced Mortality Figure</span>
              <span className="text-sm font-bold text-rose-300 font-sans">{summary.confirmed_deaths_label}</span>
            </div>
            <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl">
              <span className="text-slate-400 text-xs block">Reported Peak Air Temp</span>
              <span className="text-base font-bold text-amber-300 font-mono">{summary.reported_peak_temp_c}°C</span>
            </div>
            <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl">
              <span className="text-slate-400 text-xs block">Official Source Citation</span>
              <span className="text-xs text-slate-300 italic font-sans">{summary.source_citation}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 pt-1 leading-relaxed">
            <b className="text-amber-300">Disaster Context: </b>{summary.historical_context}
          </p>
        </div>
      )}

      {/* Playback Control Bar */}
      <div className="bg-tactical-800/80 border border-tactical-border p-4 rounded-2xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              {isPlaying ? 'Pause Replay' : 'Play Timeline'}
            </button>

            <button
              onClick={() => { setCurrentStep(1); setIsPlaying(false); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Reset to Day 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 bg-tactical-850 border border-tactical-border rounded-xl p-1">
              <button
                onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
                disabled={currentStep <= 1}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-cyan-300 font-bold">
                Day {currentStep} / 5
              </span>
              <button
                onClick={() => handleStepChange(Math.min(5, currentStep + 1))}
                disabled={currentStep >= 5}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-medium">
            Timeline Focus: <span className="text-white font-bold">{currentDay?.day_title}</span>
          </div>
        </div>

        {/* Day Step Timeline Buttons */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {playbackData?.all_days.map((d) => (
            <button
              key={d.day_number}
              onClick={() => handleStepChange(d.day_number)}
              className={`py-2 px-2 rounded-xl text-xs font-medium transition-all text-left border ${
                currentStep === d.day_number
                  ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-950/50 font-bold'
                  : 'bg-tactical-850/60 border-tactical-border text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="text-[10px] uppercase font-mono text-cyan-400">Day {d.day_number}</div>
              <div className="truncate text-xs font-semibold">{d.day_title.split(':')[1] || d.day_title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dual Provenance Bento Grid: Real vs Modelled Reconstruction */}
      {currentDay && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Real Historical Sourced Weather */}
          <div className="bg-tactical-800/70 border border-tactical-border rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-tactical-border pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Historical Synoptic Weather
              </span>
              <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                [REAL SOURCED DATA]
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl flex justify-between items-center">
                <span className="text-slate-400 font-sans">Peak Daytime Air Temp:</span>
                <span className="text-lg font-bold text-rose-400">{currentDay.real_weather.temp_c}°C</span>
              </div>
              <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl flex justify-between items-center">
                <span className="text-slate-400 font-sans">Relative Humidity:</span>
                <span className="text-base font-bold text-cyan-300">{currentDay.real_weather.humidity_pct}%</span>
              </div>
              <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl flex justify-between items-center">
                <span className="text-slate-400 font-sans">Nighttime Min Temp:</span>
                <span className="text-base font-bold text-amber-300">{currentDay.real_weather.night_min_temp_c}°C</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] font-sans">
              <b>Provenance Note: </b>Weather readings represent sourced historical station data recorded during the {summary?.event_year} heatwave event.
            </div>
          </div>

          {/* Card 2: Reconstructed SentinelX HTSI & Surge Model */}
          <div className="bg-tactical-800/70 border border-tactical-border rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-tactical-border pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-400" />
                Reconstructed SentinelX AI Outputs
              </span>
              <span className="px-2 py-0.5 text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
                [MODELLED RECONSTRUCTION]
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl flex justify-between items-center">
                <span className="text-slate-400 font-sans">Reconstructed HTSI Score:</span>
                <span className="text-lg font-bold text-purple-300">{currentDay.modelled_htsi.score} / 100</span>
              </div>
              <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl flex justify-between items-center">
                <span className="text-slate-400 font-sans">Reconstructed Risk Tier:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  currentDay.modelled_htsi.risk_tier.includes('RED') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                  currentDay.modelled_htsi.risk_tier === 'ORANGE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {currentDay.modelled_htsi.risk_tier}
                </span>
              </div>
              <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl flex justify-between items-center">
                <span className="text-slate-400 font-sans">Predicted Daily ER Admissions:</span>
                <span className="text-base font-bold text-rose-400">{currentDay.modelled_surge.expected_daily_admissions} (+{currentDay.modelled_surge.surge_pct}%)</span>
              </div>
              <div className="bg-tactical-850/60 border border-tactical-border p-3 rounded-xl flex justify-between items-center">
                <span className="text-slate-400 font-sans">ICU Bed Utilization:</span>
                <span className="text-base font-bold text-amber-300">{currentDay.modelled_surge.icu_utilization_pct}%</span>
              </div>
            </div>

            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-purple-300 text-[11px] font-sans">
              <b>Provenance Note: </b>Represents what SentinelX's 2-stage DLNM+XGBoost surge model would have predicted if active in {summary?.event_year}.
            </div>
          </div>

          {/* Card 3: Reconstructed Disaster Action Engine Directives */}
          <div className="bg-tactical-800/70 border border-tactical-border rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-tactical-border pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                Action Engine Advisory Directives
              </span>
              <span className="px-2 py-0.5 text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
                [MODELLED RECONSTRUCTION]
              </span>
            </div>

            <div className="space-y-2.5">
              {currentDay.modelled_directives.map((dir, idx) => (
                <div key={idx} className="bg-tactical-850/70 border border-tactical-border p-3 rounded-xl text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200 leading-relaxed font-sans">{dir}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-cyan-300 text-[11px] font-sans">
              <b>Emergency Impact: </b>These statutory directives simulate the proactive early-warning response SentinelX would have issued to mitigate casualties.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
