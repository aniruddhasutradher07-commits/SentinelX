import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Droplets, 
  Clock, 
  ShieldAlert, 
  Sun, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  RefreshCw,
  School,
  Users,
  BookOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { getApiUrl } from '../../services/apiConfig';
import { StatCard } from '../ui/StatCard';
import { SectionHeader } from '../ui/SectionHeader';

interface TimeBlock {
  block_label: string;
  ambient_temp_c: number;
  classroom_temp_c: number;
  effective_wbgt_c: number;
  exposure_score: number;
  risk_tier: string;
  risk_color: string;
  is_outdoor_peak: boolean;
  provenance: string;
}

interface ActionDirective {
  title: string;
  priority: string;
  action: string;
  statutory_citation: string;
}

interface SchoolSafetyApiResponse {
  status: string;
  provenance: string;
  timestamp: string;
  request_params: {
    school_name: string;
    ward_no: string;
    student_count: number;
    age_group: string;
    ventilation_type: string;
    has_outdoor_activity: boolean;
    outdoor_activity_slot: string;
    school_timing_shift: string;
  };
  summary: {
    overall_risk_score: number;
    peak_risk_tier: string;
    peak_effective_wbgt_c: number;
    total_water_liters_required_school: number;
    ors_reserve_packets_required: number;
    recommended_shift: string;
    provenance: string;
  };
  action_engine_directives: ActionDirective[];
  time_blocks: TimeBlock[];
}

interface SchoolSafetyTabProps {
  wards?: any[];
}

export default function SchoolSafetyTab({ wards }: SchoolSafetyTabProps) {
  const [schoolName, setSchoolName] = useState<string>('Capital High School, Ward 21');
  const [wardNo, setWardNo] = useState<string>('Ward 21');
  const [studentCount, setStudentCount] = useState<number>(450);
  const [ageGroup, setAgeGroup] = useState<string>('Primary (Ages 5-10)');
  const [ventilationType, setVentilationType] = useState<string>('Ceiling Fans Only');
  const [hasOutdoorActivity, setHasOutdoorActivity] = useState<boolean>(true);
  const [outdoorActivitySlot, setOutdoorActivitySlot] = useState<string>('11:00 - 12:30 PM');
  const [schoolTimingShift, setSchoolTimingShift] = useState<string>('07:30 AM - 01:30 PM (Normal Shift)');

  const [data, setData] = useState<SchoolSafetyApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSchoolSafety = async () => {
    setLoading(true);
    try {
      const url = getApiUrl(
        `/api/v1/school-safety?school_name=${encodeURIComponent(schoolName)}&ward_no=${encodeURIComponent(wardNo)}&student_count=${studentCount}&age_group=${encodeURIComponent(ageGroup)}&ventilation_type=${encodeURIComponent(ventilationType)}&has_outdoor_activity=${hasOutdoorActivity}&outdoor_activity_slot=${encodeURIComponent(outdoorActivitySlot)}&school_timing_shift=${encodeURIComponent(schoolTimingShift)}`
      );
      const res = await fetch(url);
      const json = await res.json();
      if (json && json.summary) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching school safety data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolSafety();
  }, [schoolName, wardNo, studentCount, ageGroup, ventilationType, hasOutdoorActivity, outdoorActivitySlot, schoolTimingShift]);

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
        title="School Heat Safety & Child Protection Module"
        subtitle="Classroom thermal risk diagnostics, child physiological vulnerability & NDMA Action Engine directives"
        icon={GraduationCap}
      />

      {/* Configuration Inputs Bento Card */}
      <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2">
            <School className="w-4 h-4 text-purple-400" />
            School &amp; Classroom Environment Configuration
          </h3>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 font-semibold uppercase">
            [CALCULATED]
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* School Name */}
          <div>
            <label className="text-slate-400 block mb-1">School Identifier</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Target Ward */}
          <div>
            <label className="text-slate-400 block mb-1">Ward Location</label>
            <select
              value={wardNo}
              onChange={(e) => setWardNo(e.target.value)}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Ward 21">Ward 21 (Old Town Core)</option>
              <option value="Ward 04">Ward 04 (Patia School Zone)</option>
              <option value="Ward 12">Ward 12 (Jayadev Vihar)</option>
              <option value="Ward 35">Ward 35 (Rasulgarh)</option>
              <option value="Ward 42">Ward 42 (Khandagiri)</option>
            </select>
          </div>

          {/* Student Headcount */}
          <div>
            <label className="text-slate-400 block mb-1">Enrolled Students</label>
            <input
              type="number"
              min="10"
              max="5000"
              value={studentCount}
              onChange={(e) => setStudentCount(Math.max(10, parseInt(e.target.value) || 10))}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Age Group */}
          <div>
            <label className="text-slate-400 block mb-1">Student Age Group</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Primary (Ages 5-10)">Primary (Ages 5-10) — High Vulnerability</option>
              <option value="Middle (Ages 11-14)">Middle (Ages 11-14) — Moderate Vulnerability</option>
              <option value="Secondary (Ages 15-18)">Secondary (Ages 15-18) — Standard</option>
            </select>
          </div>

          {/* Classroom Ventilation */}
          <div>
            <label className="text-slate-400 block mb-1">Classroom Ventilation</label>
            <select
              value={ventilationType}
              onChange={(e) => setVentilationType(e.target.value)}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Ceiling Fans Only">Ceiling Fans Only</option>
              <option value="Natural Ventilation (Open Windows)">Natural Ventilation (Open Windows)</option>
              <option value="Air Conditioned (HVAC)">Air Conditioned (HVAC)</option>
              <option value="Tin Roof / Poor Ventilation">Tin Roof / Poor Ventilation (+4.5°C Heat Trap)</option>
            </select>
          </div>

          {/* Outdoor Activity Slot */}
          <div>
            <label className="text-slate-400 block mb-1">Playground / PE Slot</label>
            <select
              value={outdoorActivitySlot}
              onChange={(e) => setOutdoorActivitySlot(e.target.value)}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="09:00 - 10:30 AM">09:00 - 10:30 AM (Cool Morning)</option>
              <option value="11:00 - 12:30 PM">11:00 - 12:30 PM (Midday Sun)</option>
              <option value="01:30 - 03:00 PM">01:30 - 03:00 PM (Peak Solar Heat)</option>
            </select>
          </div>

          {/* School Shift */}
          <div>
            <label className="text-slate-400 block mb-1">Operating Shift</label>
            <select
              value={schoolTimingShift}
              onChange={(e) => setSchoolTimingShift(e.target.value)}
              className="w-full bg-[#0B0D0E] border border-[#232A2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="07:30 AM - 01:30 PM (Normal Shift)">07:30 AM - 01:30 PM (Normal Shift)</option>
              <option value="06:30 AM - 11:00 AM (Morning School)">06:30 AM - 11:00 AM (Morning School)</option>
            </select>
          </div>

          {/* Toggles & Trigger */}
          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={hasOutdoorActivity}
                onChange={(e) => setHasOutdoorActivity(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-0"
              />
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Outdoor Sports Scheduled
            </label>

            <button
              onClick={fetchSchoolSafety}
              disabled={loading}
              className="py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Run Safety Assessment
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {data && data.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="OVERALL SCHOOL RISK"
            value={data.summary.overall_risk_score}
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
            title="SCHOOL WATER TARGET"
            value={data.summary.total_water_liters_required_school}
            unit="Liters"
            subtitle={`${studentCount} students (${ageGroup.split(' ')[0]})`}
            icon={Droplets}
            tier="green"
          >
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>ORS Reserve: <strong className="text-white">{data.summary.ors_reserve_packets_required} pkts</strong></span>
              <span className="text-cyan-300 border border-cyan-500/30 px-1 rounded">[CALCULATED]</span>
            </div>
          </StatCard>

          <StatCard
            title="RECOMMENDED TIMING"
            value={data.summary.recommended_shift.includes('Morning') ? 'MORNING SHIFT' : 'NORMAL SHIFT'}
            unit=""
            subtitle={data.summary.recommended_shift}
            icon={Clock}
            tier={data.summary.recommended_shift.includes('Morning') ? 'orange' : 'green'}
          >
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Shift Advisory: <strong className="text-white">{data.summary.recommended_shift.includes('Morning') ? '06:30 - 11:00 AM' : 'Standard'}</strong></span>
              <span className="text-cyan-300 border border-cyan-500/30 px-1 rounded">[CALCULATED]</span>
            </div>
          </StatCard>

          <StatCard
            title="ACTION DIRECTIVES"
            value={data.action_engine_directives ? data.action_engine_directives.length : 0}
            unit="Directives"
            subtitle="SentinelX Action Engine"
            icon={ShieldAlert}
            tier={data.summary.peak_risk_tier === 'EXTREME' ? 'red' : 'orange'}
          >
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Status: <strong className="text-white">Odisha SME Aligned</strong></span>
              <span className="text-cyan-300 border border-cyan-500/30 px-1 rounded">[CALCULATED]</span>
            </div>
          </StatCard>
        </div>
      )}

      {/* Hourly Exposure Bar Chart */}
      {data && data.time_blocks && (
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              Classroom &amp; Playground Heat Stress Profile Across School Hours
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
                  formatter={(val: any, name: any, props: any) => [
                    `${val}°C Effective WBGT (Classroom: ${props.payload.classroom_temp_c}°C)`,
                    `Risk: ${props.payload.risk_tier}`
                  ]}
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

      {/* Action Engine Directives Panel (Copilot Pattern) */}
      {data && data.action_engine_directives && (
        <div className="bg-[#14171A] border border-[#232A2E] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              SentinelX Action Engine — Statutory School Protection Directives
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 font-semibold uppercase">
              [CALCULATED]
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {data.action_engine_directives.map((dir, idx) => {
              const borderStyle = dir.priority === 'CRITICAL' || dir.priority === 'URGENT'
                ? 'border-rose-500/40 bg-rose-950/20'
                : dir.priority === 'HIGH'
                ? 'border-amber-500/40 bg-amber-950/20'
                : 'border-emerald-500/30 bg-emerald-950/10';

              return (
                <div key={idx} className={`border rounded-xl p-4 space-y-2 ${borderStyle}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={`w-4 h-4 ${dir.priority === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`} />
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">{dir.title}</h4>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      dir.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : dir.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {dir.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-sans leading-relaxed">{dir.action}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-[#1F262B]">
                    <span>Citation: <strong className="text-slate-300">{dir.statutory_citation}</strong></span>
                    <span className="text-cyan-300 border border-cyan-500/30 px-1 rounded">[CALCULATED]</span>
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
