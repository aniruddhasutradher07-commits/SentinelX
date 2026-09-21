import React, { useState, useEffect } from 'react';
import { 
  HardHat, 
  Droplets, 
  Clock, 
  ShieldAlert, 
  Sun, 
  Umbrella, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  RefreshCw,
  Building2,
  Users,
  Award
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { getApiUrl } from '../../services/apiConfig';
import { StatCard } from '../ui/StatCard';
import { SectionHeader } from '../ui/SectionHeader';

interface TimeBlock {
  block_label: string;
  start_hour: number;
  end_hour: number;
  ambient_temp_c: number;
  relative_humidity_pct: number;
  effective_wbgt_c: number;
  exposure_score: number;
  risk_tier: string;
  risk_color: string;
  rest_minutes_per_hour: number;
  water_ml_per_hour: number;
  directive: string;
  provenance: string;
}

interface WorkerSafetyApiResponse {
  status: string;
  provenance: string;
  timestamp: string;
  request_params: {
    ward_no: string;
    worker_count: number;
    work_type: string;
    work_intensity: string;
    shift_hours: string;
    has_shade: boolean;
    has_water: boolean;
  };
  summary: {
    peak_exposure_score: number;
    peak_risk_tier: string;
    peak_effective_wbgt_c: number;
    total_water_liters_required_site: number;
    total_ors_sachets_required_site: number;
    avg_rest_minutes_per_hour: number;
    provenance: string;
  };
  time_blocks: TimeBlock[];
}

interface WorkerSafetyTabProps {
  wards?: any[];
}

export default function WorkerSafetyTab({ wards }: WorkerSafetyTabProps) {
  const [wardNo, setWardNo] = useState<string>('Ward 21');
  const [workerCount, setWorkerCount] = useState<number>(45);
  const [workType, setWorkType] = useState<string>('Heavy Masonry');
  const [workIntensity, setWorkIntensity] = useState<string>('Heavy');
  const [shiftStart, setShiftStart] = useState<number>(7);
  const [shiftEnd, setShiftEnd] = useState<number>(16);
  const [hasShade, setHasShade] = useState<boolean>(false);
  const [hasWater, setHasWater] = useState<boolean>(true);

  const [data, setData] = useState<WorkerSafetyApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchWorkerSafety = async () => {
    setLoading(true);
    try {
      const url = getApiUrl(
        `/api/v1/worker-safety?ward_no=${encodeURIComponent(wardNo)}&worker_count=${workerCount}&work_type=${encodeURIComponent(workType)}&work_intensity=${encodeURIComponent(workIntensity)}&shift_start_hour=${shiftStart}&shift_end_hour=${shiftEnd}&has_shade=${hasShade}&has_water=${hasWater}`
      );
      const res = await fetch(url);
      const json = await res.json();
      if (json && json.summary) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching worker safety data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerSafety();
  }, [wardNo, workType, workIntensity, shiftStart, shiftEnd, hasShade, hasWater]);

  const getTierColorHex = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'EXTREME': return '#F87171'; // Red
      case 'HIGH': return '#FB923C'; // Orange
      case 'MODERATE': return '#FACC15'; // Yellow
      case 'LOW':
      default: return '#4ADE80'; // Green
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Construction Worker Heat Safety Module"
        subtitle="Time-sliced thermal exposure analysis, mandatory work-rest cycles & ORS hydration directives"
        icon={HardHat}
      />

      {/* Inputs Form Bento Card */}
      <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            Site &amp; Work Shift Configuration
          </h3>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 font-semibold uppercase">
            [CALCULATED]
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Target Ward */}
          <div>
            <label className="text-slate-400 block mb-1">Target Ward Location</label>
            <select
              value={wardNo}
              onChange={(e) => setWardNo(e.target.value)}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Ward 21">Ward 21 (Old Town Core)</option>
              <option value="Ward 04">Ward 04 (Patia IT Hub)</option>
              <option value="Ward 12">Ward 12 (Jayadev Vihar)</option>
              <option value="Ward 35">Ward 35 (Rasulgarh Industrial)</option>
              <option value="Ward 42">Ward 42 (Khandagiri Transit)</option>
            </select>
          </div>

          {/* Worker Count */}
          <div>
            <label className="text-slate-400 block mb-1">Worker Headcount on Site</label>
            <input
              type="number"
              min="1"
              max="5000"
              value={workerCount}
              onChange={(e) => setWorkerCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Work Activity Type */}
          <div>
            <label className="text-slate-400 block mb-1">Activity Type</label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Heavy Masonry">Heavy Masonry</option>
              <option value="Roofing / Sheet Laying">Roofing / Sheet Laying</option>
              <option value="Steel Rebar Tying">Steel Rebar Tying</option>
              <option value="Paving / Asphalting">Paving / Asphalting</option>
              <option value="Excavation / Trenching">Excavation / Trenching</option>
              <option value="Scaffolding">Scaffolding</option>
            </select>
          </div>

          {/* Metabolic Work Intensity */}
          <div>
            <label className="text-slate-400 block mb-1">Metabolic Intensity</label>
            <select
              value={workIntensity}
              onChange={(e) => setWorkIntensity(e.target.value)}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Light">Light (Inspection/Supervision)</option>
              <option value="Moderate">Moderate (Carpentry/Plumbing)</option>
              <option value="Heavy">Heavy (Brickwork/Concrete Mixing)</option>
              <option value="Very Heavy">Very Heavy (Manual Trenching/Shoveling)</option>
            </select>
          </div>

          {/* Shift Hours */}
          <div>
            <label className="text-slate-400 block mb-1">Shift Start Hour</label>
            <select
              value={shiftStart}
              onChange={(e) => setShiftStart(parseInt(e.target.value))}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              {Array.from({ length: 16 }, (_, i) => i + 5).map((h) => (
                <option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Shift End Hour</label>
            <select
              value={shiftEnd}
              onChange={(e) => setShiftEnd(parseInt(e.target.value))}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              {Array.from({ length: 16 }, (_, i) => i + 9).map((h) => (
                <option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</option>
              ))}
            </select>
          </div>

          {/* Site Mitigations */}
          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={hasShade}
                onChange={(e) => setHasShade(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
              />
              <Umbrella className="w-3.5 h-3.5 text-amber-400" />
              Shaded Rest Shed Available
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={hasWater}
                onChange={(e) => setHasWater(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
              />
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              Chilled Water &amp; ORS Provided
            </label>
          </div>

          {/* Action Trigger */}
          <div className="flex items-end">
            <button
              onClick={fetchWorkerSafety}
              disabled={loading}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Recalculate Exposure
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {data && data.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="PEAK SHIFT EXPOSURE"
            value={data.summary.peak_exposure_score}
            unit="/ 100"
            subtitle={`Peak Effective WBGT: ${data.summary.peak_effective_wbgt_c}°C`}
            icon={Activity}
            tier={data.summary.peak_risk_tier.toLowerCase() as any}
          >
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Risk Tier: <strong className="text-white">{data.summary.peak_risk_tier}</strong></span>
              <span className="text-cyan-300 border border-cyan-500/30 px-1 rounded">[CALCULATED]</span>
            </div>
          </StatCard>

          <StatCard
            title="REQUIRED SITE WATER"
            value={data.summary.total_water_liters_required_site}
            unit="Liters"
            subtitle={`${workerCount} workers across ${data.request_params.shift_hours}`}
            icon={Droplets}
            tier="green"
          >
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>ORS Sachets: <strong className="text-white">{data.summary.total_ors_sachets_required_site} pkts</strong></span>
              <span className="text-cyan-300 border border-cyan-500/30 px-1 rounded">[CALCULATED]</span>
            </div>
          </StatCard>

          <StatCard
            title="WORK-REST DIRECTIVE"
            value={data.summary.avg_rest_minutes_per_hour}
            unit="min / hr"
            subtitle="Mandatory shaded rest cycle"
            icon={Clock}
            tier="orange"
          >
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Shade Mitigation: <strong className={hasShade ? 'text-emerald-400' : 'text-rose-400'}>{hasShade ? 'Active (-3.5°C)' : 'Missing'}</strong></span>
              <span className="text-cyan-300 border border-cyan-500/30 px-1 rounded">[CALCULATED]</span>
            </div>
          </StatCard>

          <StatCard
            title="STATUTORY COMPLIANCE"
            value={data.summary.peak_risk_tier === 'EXTREME' ? 'HALT ADVISORY' : 'ACTIVE'}
            unit=""
            subtitle="Factories Act / DMA 2005"
            icon={ShieldAlert}
            tier={data.summary.peak_risk_tier === 'EXTREME' ? 'red' : 'green'}
          >
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Status: <strong className="text-white">Odisha HAP Aligned</strong></span>
              <span className="text-cyan-300 border border-cyan-500/30 px-1 rounded">[CALCULATED]</span>
            </div>
          </StatCard>
        </div>
      )}

      {/* Time-Sliced Exposure Bar Chart */}
      {data && data.time_blocks && (
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              Time-Sliced Effective WBGT Thermal Exposure Across Shift
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 font-semibold uppercase">
              [CALCULATED]
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.time_blocks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="block_label" tick={{ fill: '#8B9096', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[15, 45]} tick={{ fill: '#8B9096', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0D0E', borderColor: '#232A2E', borderRadius: '8px', fontSize: '10px' }}
                  formatter={(val: any, name: any, props: any) => [`${val}°C Effective WBGT`, `Risk: ${props.payload.risk_tier}`]}
                />
                <Bar dataKey="effective_wbgt_c" barSize={32} radius={[4, 4, 0, 0]}>
                  {data.time_blocks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getTierColorHex(entry.risk_tier)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Shift Directives & Recovery Break Table */}
      {data && data.time_blocks && (
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Mandatory Recovery-Break &amp; Hydration Schedule (Time-Sliced Directives)
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 font-semibold uppercase">
              [CALCULATED]
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {data.time_blocks.map((block, idx) => {
              const borderStyle = block.risk_tier === 'EXTREME' ? 'border-rose-500/40 bg-rose-950/20'
                : block.risk_tier === 'HIGH' ? 'border-amber-500/40 bg-amber-950/20'
                : block.risk_tier === 'MODERATE' ? 'border-yellow-500/30 bg-yellow-950/10'
                : 'border-emerald-500/30 bg-emerald-950/10';

              return (
                <div key={idx} className={`border rounded-xl p-3.5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${borderStyle}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {block.block_label}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        block.risk_tier === 'EXTREME' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : block.risk_tier === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : block.risk_tier === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {block.risk_tier} RISK ({block.effective_wbgt_c}°C WBGT)
                      </span>
                      <span className="text-[9px] font-mono text-cyan-300 border border-cyan-500/30 px-1 rounded">
                        [CALCULATED]
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans">{block.directive}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Mandatory Rest</span>
                      <strong className="text-amber-300">{block.rest_minutes_per_hour} min / hr</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Hydration Target</span>
                      <strong className="text-cyan-300">{block.water_ml_per_hour} ml / hr</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
