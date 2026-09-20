import React from "react";
import { OrganStrainHologram } from "../../components/OrganStrainHologram";
import { StatCard } from "../ui/StatCard";
import { SectionHeader } from "../ui/SectionHeader";
import { Activity, ShieldAlert, HeartPulse } from "lucide-react";

interface BiotechTabProps {
  activeDistrict: {
    WBGT_celsius?: number;
    vulnerability_multiplier?: number;
    [key: string]: any;
  };
}

export default function BiotechTab({ activeDistrict }: BiotechTabProps) {
  const wbgtVal = activeDistrict?.WBGT_celsius ?? 32.4;
  const hThermScore = Math.min(
    100,
    Math.round((wbgtVal / 34.0) * 78.0 * (activeDistrict?.vulnerability_multiplier || 1.15))
  );

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Biotech & Physiological Stress Diagnostics"
        subtitle="3D Organ Strain Telemetry and Cellular Dehydration Analytics"
        icon={Activity}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Human Thermal Stress */}
        <StatCard
          title="BIOTECH PHYSIO INDEX"
          value={hThermScore}
          unit="/ 100"
          subtitle={`${wbgtVal}°C ISO 7243 WBGT`}
          icon={Activity}
          tier="orange"
          trend={{ value: "Sweat Deficit: 42%", direction: "up" }}
        >
          <div className="text-[10px] font-mono text-slate-400">
            Work/Rest: <span className="text-white font-semibold">30m / 30m</span>
          </div>
        </StatCard>

        {/* Heatwave Risk Index */}
        <StatCard
          title="SEVERITY INDEX"
          value="80"
          unit="%"
          subtitle="Compound: 43.3 (0-100)"
          icon={ShieldAlert}
          tier="red"
          trend={{ value: "Exceedance Prob: 82%", direction: "up" }}
        >
          <div className="text-[10px] font-mono text-slate-400">
            Vulnerability Multi: <span className="text-white font-semibold">x1.05 Comp</span>
          </div>
        </StatCard>

        {/* Neuro-Cardio Strain */}
        <StatCard
          title="NEURO-CARDIO STRAIN"
          value="7.8"
          unit="/ 10"
          subtitle="Cardiovascular Overload"
          icon={HeartPulse}
          tier="orange"
          trend={{ value: "Exertion: 10.0 / 10", direction: "up" }}
        >
          <div className="text-[10px] font-mono text-slate-400">
            Resting Index: <span className="text-slate-300">3.5 / 10</span>
          </div>
        </StatCard>
      </div>

      <div className="glass-panel rounded-xl border border-cyan-500/20 overflow-hidden w-full h-[600px] relative">
        <OrganStrainHologram />
      </div>
    </div>
  );
}
