import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithColdStart } from '../services/apiConfig';
import { subscribeToWardRiskUpdates } from '../services/supabaseClient';
import { SystemSummary, DistrictRiskRecord, WardRiskRecord, LiveTelemetry } from '../types';

interface SentinelDataContextProps {
  summary: SystemSummary | null;
  districts: DistrictRiskRecord[];
  wards: WardRiskRecord[];
  telemetry: LiveTelemetry | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isCloudWakingUp: boolean;
}

const SentinelDataContext = createContext<SentinelDataContextProps>({
  summary: null,
  districts: [],
  wards: [],
  telemetry: null,
  loading: true,
  error: null,
  lastUpdated: null,
  isCloudWakingUp: false,
});

export const useSentinelData = () => useContext(SentinelDataContext);

export const SentinelDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [districts, setDistricts] = useState<DistrictRiskRecord[]>([]);
  const [wards, setWards] = useState<WardRiskRecord[]>([]);
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isCloudWakingUp, setIsCloudWakingUp] = useState<boolean>(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          fetchWithColdStart('/api/v1/summary', { onColdStart: setIsCloudWakingUp }).then(r => r.json()),
          fetchWithColdStart('/api/v1/districts').then(r => r.json()),
          fetchWithColdStart('/api/v1/wards').then(r => r.json()),
          fetchWithColdStart('/api/v1/live-feed').then(r => r.json()),
        ]);

        const sumRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const distRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const wardRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const teleRes = results[3].status === 'fulfilled' ? results[3].value : null;

        if (sumRes) setSummary(sumRes);
        if (distRes?.districts) setDistricts(distRes.districts);
        if (wardRes?.wards) setWards(wardRes.wards);
        if (teleRes) setTelemetry(teleRes);
        setLastUpdated(new Date().toISOString());
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load SentinelX telemetry.');
        setLoading(false);
      }
    }
    loadInitialData();

    // Setup realtime stream
    const unsubscribe = subscribeToWardRiskUpdates((update) => {
      setWards(prev => {
        const idx = prev.findIndex(w => w.ward_no === update.record.ward_no);
        if (idx === -1) return prev;
        const newWards = [...prev];
        newWards[idx] = { ...newWards[idx], ...update.record };
        setLastUpdated(new Date().toISOString());
        return newWards;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SentinelDataContext.Provider value={{ summary, districts, wards, telemetry, loading, error, lastUpdated, isCloudWakingUp }}>
      {children}
    </SentinelDataContext.Provider>
  );
};
