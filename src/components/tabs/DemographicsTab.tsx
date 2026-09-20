import React from "react";
import { SectionHeader } from "../ui/SectionHeader";
import { StatCard } from "../ui/StatCard";
import { Users, AlertTriangle, ShieldCheck, Home } from "lucide-react";

interface DemographicsTabProps {
  activeDistrict: {
    district?: string;
    [key: string]: any;
  };
}

export default function DemographicsTab({ activeDistrict }: DemographicsTabProps) {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Population Exposure & Vulnerability Demographics"
        subtitle={`Vulnerable population clusters under live surveillance in ${activeDistrict?.district || 'Bhubaneswar'}`}
        icon={Users}
      />

      <div className="glass-panel rounded-xl p-4 border border-white/10 flex flex-col justify-between">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="TOTAL POPULATION"
            value="2.00M"
            subtitle="Under active grid surveillance"
            icon={Users}
            trend={{ value: "Census 2024 Proj", direction: "neutral" }}
          />

          <StatCard
            title="ELDERLY (AGE 60+)"
            value="9.8%"
            subtitle="Cardio-vulnerable cohort"
            icon={AlertTriangle}
            tier="orange"
            trend={{ value: "High Priority", direction: "up" }}
          />

          <StatCard
            title="OUTDOOR LABOR"
            value="26%"
            subtitle="Const / Agri / Rickshaw"
            icon={ShieldCheck}
            tier="yellow"
            trend={{ value: "Work-rest required", direction: "up" }}
          />

          <StatCard
            title="ASBESTOS / TIN ROOF"
            value="25.5%"
            subtitle="High indoor thermal retention"
            icon={Home}
            tier="red"
            trend={{ value: "Slum Cluster Vulnerable", direction: "up" }}
          />
        </div>

        <div className="mt-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-300 flex items-center gap-2" role="alert">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>High Risk Zone:</strong> Slum clusters in Ward 24, 38 & 51 show &gt;42°C roof indoor retention at 22:00 IST.
          </span>
        </div>
      </div>
    </div>
  );
}
