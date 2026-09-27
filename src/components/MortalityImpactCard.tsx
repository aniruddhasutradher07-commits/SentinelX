import React, { useEffect, useState } from 'react';
import { ShieldAlert, Info, Activity, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '../services/apiConfig';

interface MortalityRiskResponse {
  status: string;
  experimental: boolean;
  provenance: string;
  target_entity: string;
  horizon_days: number;
  data_availability: string;
  target_status: string;
  target_definition: string;
  predicted_mortality: null | number;
  environmental_hazard_risk?: {
    composite_hazard_score: number;
    risk_tier: string;
    classification: string;
  };
  model_metadata?: {
    model_type: string;
    validation_status: string;
    disclaimer: string;
  };
  forecast?: Array<{
    day: number;
    date: string;
    wbgt_celsius: number;
    utci_celsius: number;
    heat_index_celsius: number;
    environmental_hazard_score: number;
    environmental_exposure_tier: string;
    predicted_mortality: null | number;
    mortality_prediction_status: string;
  }>;
}

interface MortalityImpactCardProps {
  districtOrWard?: string;
  className?: string;
}

export const MortalityImpactCard: React.FC<MortalityImpactCardProps> = ({
  districtOrWard = 'Khordha',
  className = ''
}) => {
  const [data, setData] = useState<MortalityRiskResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const isWard = districtOrWard.toUpperCase().startsWith('W');
    const param = isWard ? `ward=${encodeURIComponent(districtOrWard)}` : `district=${encodeURIComponent(districtOrWard)}`;
    
    fetch(getApiUrl(`/api/v1/mortality-risk?${param}&horizon=5`))
      .then(res => res.json())
      .then(resData => {
        if (isMounted) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setData({
            status: "EXPERIMENTAL_NOT_VALIDATED",
            experimental: true,
            provenance: "Experimental research model — not clinically validated",
            target_entity: districtOrWard,
            horizon_days: 5,
            data_availability: "METEOROLOGICAL_CONNECTED_HEALTH_OUTCOMES_DISCONNECTED",
            target_status: "HEALTH OUTCOME DATASET NOT CONNECTED",
            target_definition: "Daily Excess Mortality",
            predicted_mortality: null,
            environmental_hazard_risk: {
              composite_hazard_score: 75.0,
              risk_tier: "Orange",
              classification: "ENVIRONMENTAL EXPOSURE PROXY"
            }
          });
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [districtOrWard]);

  const hazard = data?.environmental_hazard_risk;

  return (
    <div className={`bg-tactical-900 border border-tactical-border rounded-2xl p-4 flex flex-col gap-3 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
            Mortality Impact Research
          </h3>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-amber-500/40 bg-amber-950/40 text-amber-300 uppercase tracking-widest font-semibold">
          EXPERIMENTAL
        </span>
      </div>

      {/* Target Status / Disconnection Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-amber-200/90 font-sans">
            <span className="font-bold text-amber-300 block">
              Validated mortality prediction unavailable — health outcome dataset not connected.
            </span>
            Civil registration and hospital death registers are disconnected from this platform. Ambient thermal burden is reported strictly as an environmental exposure proxy.
          </div>
        </div>
      </div>

      {/* Research Grid Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-tactical-800/80 p-2 rounded-xl border border-tactical-border/60">
          <span className="text-[9px] text-slate-400 block uppercase">Model Status</span>
          <span className="font-bold text-amber-300 text-[10px] break-words">
            {data?.status || 'EXPERIMENTAL_NOT_VALIDATED'}
          </span>
        </div>
        <div className="bg-tactical-800/80 p-2 rounded-xl border border-tactical-border/60">
          <span className="text-[9px] text-slate-400 block uppercase">Target Registry</span>
          <span className="font-bold text-rose-300 text-[10px]">
            DISCONNECTED
          </span>
        </div>
        <div className="bg-tactical-800/80 p-2 rounded-xl border border-tactical-border/60">
          <span className="text-[9px] text-slate-400 block uppercase">Forecast Horizon</span>
          <span className="font-bold text-cyan-300 text-[10px]">
            {data?.horizon_days || 5} Days
          </span>
        </div>
        <div className="bg-tactical-800/80 p-2 rounded-xl border border-tactical-border/60">
          <span className="text-[9px] text-slate-400 block uppercase">Predicted Mortality</span>
          <span className="font-bold text-slate-400 text-[10px]">
            NULL (N/A)
          </span>
        </div>
      </div>

      {/* Environmental Exposure Proxy Score */}
      <div className="bg-tactical-800/90 border border-tactical-border rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase block">
            Environmental Hazard Risk
          </span>
          <span className="text-[11px] font-bold text-slate-200">
            {hazard?.classification || 'ENVIRONMENTAL EXPOSURE PROXY'}
          </span>
          <p className="text-[9px] text-slate-400 font-sans mt-0.5">
            Reflects atmospheric and radiant load, not clinical mortality probability.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold font-mono text-amber-400">
            {hazard?.composite_hazard_score ? hazard.composite_hazard_score.toFixed(1) : '75.0'}
          </span>
          <span className="text-[9px] text-slate-400 font-mono block">
            / 100 ({hazard?.risk_tier || 'Orange'})
          </span>
        </div>
      </div>

      {/* Provenance Footer */}
      <div className="text-[9px] font-mono text-slate-400 text-center border-t border-tactical-border/40 pt-2">
        Provenance: {data?.provenance || 'Experimental research model — not clinically validated'}
      </div>
    </div>
  );
};
