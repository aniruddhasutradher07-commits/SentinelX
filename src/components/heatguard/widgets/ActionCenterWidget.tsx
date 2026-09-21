import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface ActionCenterWidgetProps {
  currentTier: string;
}

export default function ActionCenterWidget({ currentTier }: ActionCenterWidgetProps) {
  const [activeTab, setActiveTab] = useState('authorities');
  
  const tier = currentTier.toUpperCase();
  
  const getActions = () => {
    switch (tier) {
      case 'EXTREME':
      case 'RED':
        return {
          authorities: [
            "Issue targeted RED heat alert via SMS/PA",
            "Open all municipal cooling centers immediately",
            "Prepare hospitals for mass heat-stroke admissions",
            "Mandate halt on outdoor work from 11 AM - 4 PM"
          ],
          citizens: [
            "Avoid peak afternoon exposure entirely",
            "Hydrate continuously even if not thirsty",
            "Locate nearest municipal cooling center",
            "Check on elderly neighbors twice daily"
          ],
          healthcare: [
            "Activate mass-casualty heat protocol",
            "Monitor emergency admissions for heat exhaustion",
            "Ensure backup power for cooling is online"
          ]
        };
      case 'HIGH':
      case 'ORANGE':
        return {
          authorities: [
            "Issue ORANGE heat alert for vulnerable zones",
            "Review cooling center readiness",
            "Issue advisory for outdoor workers",
            "Deploy mobile hydration units to high-risk wards"
          ],
          citizens: [
            "Limit outdoor activities during afternoon",
            "Drink plenty of water and ORS",
            "Wear light, loose-fitting cotton clothing"
          ],
          healthcare: [
            "Increase staff readiness for heat-related illness",
            "Stock up on IV fluids and ORS",
            "Monitor vulnerable patient wards closely"
          ]
        };
      case 'MODERATE':
      case 'YELLOW':
        return {
          authorities: [
            "Monitor WBGT and UTCI trends closely",
            "Issue general public awareness messages",
            "Verify water supply to vulnerable zones"
          ],
          citizens: [
            "Stay hydrated throughout the day",
            "Avoid strenuous exercise at noon"
          ],
          healthcare: [
            "Standard monitoring procedures",
            "Advise outpatients on hydration"
          ]
        };
      default:
        return {
          authorities: [
            "Normal operations",
            "Maintain baseline monitoring of weather patterns"
          ],
          citizens: [
            "Normal activities",
            "Stay hydrated as usual"
          ],
          healthcare: [
            "Normal operations"
          ]
        };
    }
  };

  const actions = getActions();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col relative">
      <div className="absolute top-3 right-3 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
        Recommended
      </div>
      <div className="flex items-center justify-between mb-4 pr-24">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-sky-600" />
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">Targeted Action Plan</h3>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-3">
        <button 
          onClick={() => setActiveTab('authorities')}
          className={`flex-1 py-1.5 text-[11px] text-center ${activeTab === 'authorities' ? 'font-bold text-sky-600 border-b-2 border-sky-600' : 'font-medium text-slate-500 hover:text-slate-700'}`}
        >
          For Authorities
        </button>
        <button 
          onClick={() => setActiveTab('citizens')}
          className={`flex-1 py-1.5 text-[11px] text-center ${activeTab === 'citizens' ? 'font-bold text-sky-600 border-b-2 border-sky-600' : 'font-medium text-slate-500 hover:text-slate-700'}`}
        >
          For Citizens
        </button>
        <button 
          onClick={() => setActiveTab('healthcare')}
          className={`flex-1 py-1.5 text-[11px] text-center ${activeTab === 'healthcare' ? 'font-bold text-sky-600 border-b-2 border-sky-600' : 'font-medium text-slate-500 hover:text-slate-700'}`}
        >
          For Healthcare
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {actions[activeTab as keyof typeof actions].map((action, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded border border-slate-100">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
              tier === 'EXTREME' || tier === 'RED' ? 'bg-red-500' :
              tier === 'HIGH' || tier === 'ORANGE' ? 'bg-orange-500' :
              tier === 'MODERATE' || tier === 'YELLOW' ? 'bg-yellow-400' : 'bg-emerald-500'
            }`}></div>
            <p className="text-[11px] text-slate-700 leading-snug">{action}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-center border-t border-slate-100 pt-3">
         <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Generated for {tier} risk level</span>
      </div>
    </div>
  );
}
