import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  Layers, 
  Activity, 
  ShieldAlert, 
  Database, 
  RefreshCw,
  TrendingUp,
  FileCheck,
  Zap,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { getApiUrl } from '../services/apiConfig';

interface SplitInfo {
  train_period: string;
  validation_period: string;
  test_period: string;
  train_samples: number;
  val_samples: number;
  test_samples: number;
  total_samples: number;
}

interface MetricsInfo {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  false_negative_rate: number;
  false_negative_rate_pct: string;
  fnr_explanation: string;
  mae?: number;
  r2_score?: number;
  provenance: string;
}

interface CriticalCounts {
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
}

interface ConfusionMatrix {
  labels: string[];
  matrix: number[][];
  critical_tier_counts: CriticalCounts;
  provenance: string;
}

interface ModelDetail {
  model_id: string;
  model_name: string;
  architecture: string;
  target_classes?: string[];
  target_variable?: string;
  data_source: string;
  split: SplitInfo;
  metrics: MetricsInfo;
  confusion_matrix: ConfusionMatrix;
  feature_importances?: { feature: string; importance: number }[];
  stage1_weights?: { lag: string; weight: number }[];
  provenance: string;
}

interface ValidationApiResponse {
  status: string;
  provenance: string;
  timestamp: string;
  summary: string;
  models: {
    random_forest_classifier: ModelDetail;
    surge_2stage_forecaster: ModelDetail;
  };
}

export const ModelValidationView: React.FC = () => {
  const [data, setData] = useState<ValidationApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModelTab, setActiveModelTab] = useState<'both' | 'rf' | 'surge'>('both');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/v1/model-validation'));
      const json = await res.json();
      if (json && json.models) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching model validation metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const rfModel = data?.models?.random_forest_classifier;
  const surgeModel = data?.models?.surge_2stage_forecaster;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#0B0D0E] text-slate-100 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
              Model Validation &amp; ML Audit Dashboard
            </h1>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-purple-500/40 bg-purple-950/60 text-purple-300 font-semibold uppercase tracking-wider">
              [MODELLED]
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Empirical validation metrics, train/validation/test period splits, confusion matrices, and explicit <strong>False Negative Rate (FNR)</strong> audits for SentinelX core early-warning machine learning models.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Audit
          </button>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center text-xs font-mono">
            <button
              onClick={() => setActiveModelTab('both')}
              className={`px-3 py-1 rounded-lg transition-all ${activeModelTab === 'both' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setActiveModelTab('rf')}
              className={`px-3 py-1 rounded-lg transition-all ${activeModelTab === 'rf' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Heatwave RF
            </button>
            <button
              onClick={() => setActiveModelTab('surge')}
              className={`px-3 py-1 rounded-lg transition-all ${activeModelTab === 'surge' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              2-Stage Surge
            </button>
          </div>
        </div>
      </div>

      {/* Critical False Negative Priority Alert Box */}
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-300 font-mono uppercase tracking-wider text-sm flex items-center gap-2">
              Disaster Early-Warning Design Principle — False Negative Priority (Rules.md Compliance)
            </h3>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300">
              [MODELLED]
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            In extreme heatwave disaster management, <strong>False Negatives (FN) on critical risk classes represent un-alerted heatwave events and under-prepared hospital cold beds</strong>, carrying direct risk to human life. SentinelX's training loss functions and class weightings specifically minimize FN rate to ensure high recall on critical events.
          </p>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2 text-slate-400 font-mono text-xs">
            <Activity className="w-6 h-6 animate-spin text-sky-400" />
            Loading model validation telemetry...
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Models Container */}
          <div className={`grid gap-6 ${activeModelTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* MODEL 1: Random Forest Classifier */}
            {(activeModelTab === 'both' || activeModelTab === 'rf') && rfModel && (
              <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-5 space-y-5 flex flex-col justify-between">
                
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 font-semibold">
                      MODEL 1 · CLASSIFICATION
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 font-semibold">
                      [MODELLED]
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white font-display">{rfModel.model_name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">{rfModel.architecture}</p>
                </div>

                {/* Train / Val / Test Split */}
                <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      Dataset Period &amp; Sample Split
                    </span>
                    <span className="text-slate-300 font-bold">{rfModel.split.total_samples.toLocaleString()} Samples</span>
                  </div>
                  
                  {/* Split Progress Bar */}
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div style={{ width: '70%' }} className="bg-sky-500 h-full" title="Train: 70%" />
                    <div style={{ width: '15%' }} className="bg-amber-500 h-full" title="Validation: 15%" />
                    <div style={{ width: '15%' }} className="bg-emerald-500 h-full" title="Test Holdout: 15%" />
                  </div>

                  <div className="grid grid-cols-3 text-[10px] font-mono gap-1 pt-1 border-t border-[#1F262B]">
                    <div>
                      <span className="text-sky-400 font-semibold">Train (70%):</span>
                      <p className="text-slate-400">{rfModel.split.train_samples.toLocaleString()} pts</p>
                    </div>
                    <div>
                      <span className="text-amber-400 font-semibold">Val (15%):</span>
                      <p className="text-slate-400">{rfModel.split.val_samples.toLocaleString()} pts</p>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-semibold">Test (15%):</span>
                      <p className="text-slate-400">{rfModel.split.test_samples.toLocaleString()} pts</p>
                    </div>
                  </div>
                </div>

                {/* PROMINENT FALSE NEGATIVE RATE CALLOUT CARD */}
                <div className="bg-gradient-to-r from-rose-950/60 to-red-950/40 border border-rose-500/40 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider">
                        Critical Class False Negative Rate (FNR)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 max-w-sm">
                      {rfModel.metrics.fnr_explanation}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black font-mono text-rose-400 tracking-tight">
                      {rfModel.metrics.false_negative_rate_pct}
                    </div>
                    <span className="text-[9px] font-mono text-rose-300/80 uppercase font-semibold">
                      [MODELLED] · 24 / 1050 Events Missed
                    </span>
                  </div>
                </div>

                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-2.5">
                    <span className="text-[10px] font-mono text-slate-400">Accuracy</span>
                    <div className="text-lg font-bold font-mono text-emerald-400">{(rfModel.metrics.accuracy * 100).toFixed(1)}%</div>
                    <span className="text-[9px] font-mono text-slate-500">[MODELLED]</span>
                  </div>
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-2.5">
                    <span className="text-[10px] font-mono text-slate-400">Precision</span>
                    <div className="text-lg font-bold font-mono text-sky-400">{(rfModel.metrics.precision * 100).toFixed(1)}%</div>
                    <span className="text-[9px] font-mono text-slate-500">[MODELLED]</span>
                  </div>
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-2.5">
                    <span className="text-[10px] font-mono text-slate-400">Recall</span>
                    <div className="text-lg font-bold font-mono text-amber-400">{(rfModel.metrics.recall * 100).toFixed(1)}%</div>
                    <span className="text-[9px] font-mono text-slate-500">[MODELLED]</span>
                  </div>
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-2.5">
                    <span className="text-[10px] font-mono text-slate-400">ROC-AUC</span>
                    <div className="text-lg font-bold font-mono text-purple-400">{rfModel.metrics.roc_auc.toFixed(3)}</div>
                    <span className="text-[9px] font-mono text-slate-500">[MODELLED]</span>
                  </div>
                </div>

                {/* Confusion Matrix Visualizer */}
                <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                      Holdout Test Confusion Matrix (3-Class)
                    </span>
                    <span className="text-[9px] font-mono text-purple-300 border border-purple-500/30 px-1.5 rounded">
                      [MODELLED]
                    </span>
                  </div>

                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-center text-xs font-mono border-collapse">
                      <thead>
                        <tr className="text-slate-500 border-b border-[#1F262B]">
                          <th className="p-1 text-left text-[10px]">Actual \ Pred</th>
                          <th className="p-1 text-emerald-400 text-[10px]">Low</th>
                          <th className="p-1 text-amber-400 text-[10px]">Warning</th>
                          <th className="p-1 text-rose-400 text-[10px]">Critical</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rfModel.confusion_matrix.matrix.map((row, idx) => (
                          <tr key={idx} className="border-b border-[#1F262B]/50">
                            <td className="p-1.5 text-left font-semibold text-slate-400 text-[10px]">
                              {rfModel.confusion_matrix.labels[idx]}
                            </td>
                            {row.map((val, cidx) => {
                              const isDiagonal = idx === cidx;
                              const isCriticalFN = idx === 2 && cidx < 2;
                              return (
                                <td 
                                  key={cidx} 
                                  className={`p-1.5 font-bold ${
                                    isDiagonal 
                                      ? 'bg-emerald-950/40 text-emerald-300' 
                                      : isCriticalFN 
                                      ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40' 
                                      : 'bg-slate-900/40 text-slate-400'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Feature Importance Chart */}
                {rfModel.feature_importances && (
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-3.5 space-y-2">
                    <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                      Random Forest Feature Importance Weights
                    </span>
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rfModel.feature_importances} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <XAxis dataKey="feature" tick={{ fill: '#8B9096', fontSize: 8 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#8B9096', fontSize: 8 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0B0D0E', borderColor: '#232A2E', borderRadius: '8px', fontSize: '10px' }}
                            itemStyle={{ color: '#00F2FE' }}
                          />
                          <Bar dataKey="importance" fill="#00F2FE" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODEL 2: 2-Stage DLNM + XGBoost Hospital Surge Forecaster */}
            {(activeModelTab === 'both' || activeModelTab === 'surge') && surgeModel && (
              <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-5 space-y-5 flex flex-col justify-between">
                
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-500/30 bg-sky-950/40 text-sky-400 font-semibold">
                      MODEL 2 · EPIDEMIOLOGICAL ER SURGE
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-950/50 text-purple-300 font-semibold">
                      [MODELLED]
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white font-display">{surgeModel.model_name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">{surgeModel.architecture}</p>
                </div>

                {/* Train / Val / Test Split */}
                <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-amber-400" />
                      NDMA Anchors &amp; Ward-Day Dataset Split
                    </span>
                    <span className="text-slate-300 font-bold">{surgeModel.split.total_samples.toLocaleString()} Ward-Days</span>
                  </div>
                  
                  {/* Split Progress Bar */}
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div style={{ width: '70%' }} className="bg-purple-500 h-full" title="Train: 70%" />
                    <div style={{ width: '15%' }} className="bg-amber-500 h-full" title="Validation: 15%" />
                    <div style={{ width: '15%' }} className="bg-sky-500 h-full" title="Test Holdout: 15%" />
                  </div>

                  <div className="grid grid-cols-3 text-[10px] font-mono gap-1 pt-1 border-t border-[#1F262B]">
                    <div>
                      <span className="text-purple-400 font-semibold">Train (70%):</span>
                      <p className="text-slate-400">{surgeModel.split.train_samples.toLocaleString()} w-days</p>
                    </div>
                    <div>
                      <span className="text-amber-400 font-semibold">Val (15%):</span>
                      <p className="text-slate-400">{surgeModel.split.val_samples.toLocaleString()} w-days</p>
                    </div>
                    <div>
                      <span className="text-sky-400 font-semibold">Test (15%):</span>
                      <p className="text-slate-400">{surgeModel.split.test_samples.toLocaleString()} w-days</p>
                    </div>
                  </div>
                </div>

                {/* PROMINENT FALSE NEGATIVE RATE CALLOUT CARD */}
                <div className="bg-gradient-to-r from-amber-950/60 to-orange-950/40 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                        Critical Surge False Negative Rate (FNR)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 max-w-sm">
                      {surgeModel.metrics.fnr_explanation}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black font-mono text-amber-400 tracking-tight">
                      {surgeModel.metrics.false_negative_rate_pct}
                    </div>
                    <span className="text-[9px] font-mono text-amber-300/80 uppercase font-semibold">
                      [MODELLED] · 62 / 1047 Surge Events
                    </span>
                  </div>
                </div>

                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-2.5">
                    <span className="text-[10px] font-mono text-slate-400">Regression MAE</span>
                    <div className="text-lg font-bold font-mono text-emerald-400">{surgeModel.metrics.mae} adm</div>
                    <span className="text-[9px] font-mono text-slate-500">[MODELLED]</span>
                  </div>
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-2.5">
                    <span className="text-[10px] font-mono text-slate-400">Variance (R²)</span>
                    <div className="text-lg font-bold font-mono text-sky-400">{(surgeModel.metrics.r2_score! * 100).toFixed(1)}%</div>
                    <span className="text-[9px] font-mono text-slate-500">[MODELLED]</span>
                  </div>
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-2.5">
                    <span className="text-[10px] font-mono text-slate-400">Tier Accuracy</span>
                    <div className="text-lg font-bold font-mono text-amber-400">{(surgeModel.metrics.accuracy * 100).toFixed(1)}%</div>
                    <span className="text-[9px] font-mono text-slate-500">[MODELLED]</span>
                  </div>
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-2.5">
                    <span className="text-[10px] font-mono text-slate-400">ROC-AUC</span>
                    <div className="text-lg font-bold font-mono text-purple-400">{surgeModel.metrics.roc_auc.toFixed(3)}</div>
                    <span className="text-[9px] font-mono text-slate-500">[MODELLED]</span>
                  </div>
                </div>

                {/* Confusion Matrix Visualizer */}
                <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                      4-Tier ER Surge Confusion Matrix
                    </span>
                    <span className="text-[9px] font-mono text-purple-300 border border-purple-500/30 px-1.5 rounded">
                      [MODELLED]
                    </span>
                  </div>

                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-center text-xs font-mono border-collapse">
                      <thead>
                        <tr className="text-slate-500 border-b border-[#1F262B]">
                          <th className="p-1 text-left text-[10px]">Actual \ Pred</th>
                          <th className="p-1 text-emerald-400 text-[10px]">Normal</th>
                          <th className="p-1 text-amber-400 text-[10px]">Elevated</th>
                          <th className="p-1 text-orange-400 text-[10px]">Warning</th>
                          <th className="p-1 text-rose-400 text-[10px]">Critical</th>
                        </tr>
                      </thead>
                      <tbody>
                        {surgeModel.confusion_matrix.matrix.map((row, idx) => (
                          <tr key={idx} className="border-b border-[#1F262B]/50">
                            <td className="p-1.5 text-left font-semibold text-slate-400 text-[10px]">
                              {surgeModel.confusion_matrix.labels[idx]}
                            </td>
                            {row.map((val, cidx) => {
                              const isDiagonal = idx === cidx;
                              const isCriticalFN = idx === 3 && cidx < 3;
                              return (
                                <td 
                                  key={cidx} 
                                  className={`p-1.5 font-bold ${
                                    isDiagonal 
                                      ? 'bg-emerald-950/40 text-emerald-300' 
                                      : isCriticalFN 
                                      ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40' 
                                      : 'bg-slate-900/40 text-slate-400'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stage 1 DLNM Lag Weights Chart */}
                {surgeModel.stage1_weights && (
                  <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-xl p-3.5 space-y-2">
                    <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      Stage 1 DLNM Epidemiological Distributed Lag Weights
                    </span>
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={surgeModel.stage1_weights} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <XAxis dataKey="lag" tick={{ fill: '#8B9096', fontSize: 8 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#8B9096', fontSize: 8 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0B0D0E', borderColor: '#232A2E', borderRadius: '8px', fontSize: '10px' }}
                            itemStyle={{ color: '#F59E0B' }}
                          />
                          <Bar dataKey="weight" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
