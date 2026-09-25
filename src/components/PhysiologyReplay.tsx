import React, { useState, useEffect } from 'react';
import { Activity, Database, Clock, Play, Pause, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '../services/apiConfig';

interface PhysiologyData {
  timestamp: number;
  heart_rate_bpm: number;
  skin_temperature_c: number;
}

interface AvailableCombo {
  participant_id: string;
  session_type: string;
  hr_available: boolean;
  temp_available: boolean;
}

export const PhysiologyReplay: React.FC = () => {
  const [combos, setCombos] = useState<AvailableCombo[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [data, setData] = useState<PhysiologyData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<string>('LOADING');

  useEffect(() => {
    fetch(getApiUrl('/api/v1/physiology-reference'))
      .then(res => res.json())
      .then(res => {
        if (res.available && res.available.length > 0) {
          setCombos(res.available);
          const first = res.available[0];
          setSelectedSubject(first.participant_id);
          setSelectedSession(first.session_type);
        }
      })
      .catch(err => console.error("Failed to load physiology metadata", err));
  }, []);

  useEffect(() => {
    if (!selectedSubject || !selectedSession) return;
    
    // Stop any playing
    setIsPlaying(false);
    
    // Validate combination
    const isValid = combos.some(c => c.participant_id === selectedSubject && c.session_type === selectedSession);
    
    if (!isValid && combos.length > 0) {
      // If the user changed the participant and the old session is not available,
      // pick the first available session for the new participant
      const firstValidForSubject = combos.find(c => c.participant_id === selectedSubject);
      if (firstValidForSubject) {
        setSelectedSession(firstValidForSubject.session_type);
      }
      return;
    }

    setStatus('LOADING');
    fetch(getApiUrl(`/api/v1/physiology-reference?subject_id=${selectedSubject}&session_type=${selectedSession}`))
      .then(res => {
        if (!res.ok) {
          throw new Error('Data not found');
        }
        return res.json();
      })
      .then(res => {
        if (res.data && res.data.length > 0) {
          setData(res.data);
          setCurrentIndex(0);
          setStatus('LOADED');
        } else {
          setData([]);
          setStatus('NO_DATA');
        }
      })
      .catch(err => {
        console.error("Failed to load reference data", err);
        setData([]);
        setStatus('NO_DATA');
      });
  }, [selectedSubject, selectedSession, combos]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && data.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= data.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, data.length]);

  const currentData = data[currentIndex] || null;
  
  const uniqueSubjects = Array.from(new Set(combos.map(c => c.participant_id))).sort();
  const availableSessions = combos.filter(c => c.participant_id === selectedSubject).map(c => c.session_type);

  return (
    <div className="glass-panel rounded-xl border border-rose-500/30 overflow-hidden flex flex-col p-5 bg-slate-900/80 w-full">
      <div className="flex items-center justify-between mb-4 border-b border-rose-500/20 pb-3">
        <div>
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4" />
            EXPERIMENTAL PHYSIOLOGY REFERENCE
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            PhysioNet Wearable Dataset v1.0.1 • STATIC REFERENCE
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-rose-500/30 bg-rose-950/50 text-rose-300 uppercase tracking-widest font-semibold flex items-center gap-1">
            <Database className="w-3 h-3" />
            STATIC REPLAY
          </span>
          <span className="text-[8px] text-slate-500 font-sans uppercase">Not live Bhubaneswar telemetry</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-5">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Participant</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded outline-none w-24 focus:border-rose-500/50"
          >
            {uniqueSubjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Session</label>
          <select 
            value={selectedSession} 
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded outline-none w-32 focus:border-rose-500/50"
          >
            {availableSessions.map(sess => (
              <option key={sess} value={sess}>{sess}</option>
            ))}
          </select>
        </div>
        
        {status === 'LOADED' ? (
          <div className="ml-2 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[9px] uppercase tracking-widest px-2 py-1 rounded">
            Data Available
          </div>
        ) : status === 'NO_DATA' ? (
          <div className="ml-2 bg-red-950/50 border border-red-500/30 text-red-400 text-[9px] uppercase tracking-widest px-2 py-1 rounded">
            No Data Available
          </div>
        ) : null}

        <div className="flex items-end ml-auto gap-2">
           <button 
             onClick={() => setIsPlaying(!isPlaying)}
             disabled={status !== 'LOADED'}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-colors ${isPlaying ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed'}`}
           >
             {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
             {isPlaying ? 'PAUSE' : 'PLAY'}
           </button>
           <button 
             onClick={() => setCurrentIndex(0)}
             disabled={status !== 'LOADED'}
             className="px-3 py-1.5 rounded text-xs font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
           >
             RESET
           </button>
        </div>
      </div>

      {status === 'LOADED' && currentData ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-rose-500/20 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-rose-500/5 opacity-50"></div>
            <span className="text-[10px] text-rose-400 font-mono uppercase tracking-widest block mb-1">
              Heart Rate
            </span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-mono font-bold text-white tracking-tight">{Math.round(currentData.heart_rate_bpm)}</span>
              <span className="text-sm text-slate-400 font-medium mb-1">BPM</span>
            </div>
          </div>
          <div className="bg-slate-950 border border-rose-500/20 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-rose-500/5 opacity-50"></div>
            <span className="text-[10px] text-rose-400 font-mono uppercase tracking-widest block mb-1">
              Skin Temperature
            </span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-mono font-bold text-white tracking-tight">{currentData.skin_temperature_c.toFixed(1)}</span>
              <span className="text-sm text-slate-400 font-medium mb-1">°C</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 text-sm font-mono">
          {status === 'LOADING' ? (
            <span>Fetching Reference Data...</span>
          ) : (
            <>
              <span className="text-red-400 font-bold mb-1">NO PHYSIOLOGY DATA AVAILABLE</span>
              <span className="text-xs">HR / skin-temperature recording is unavailable for this participant/session.</span>
            </>
          )}
        </div>
      )}

      {status === 'LOADED' && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-slate-300">T+{currentIndex}s</span> / {data.length}s
          </div>
          <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
             <AlertTriangle className="w-3 h-3 text-amber-500" />
             Do not use for clinical diagnostics
          </div>
        </div>
      )}
    </div>
  );
};
