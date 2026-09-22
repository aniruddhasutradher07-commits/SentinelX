import React, { useState } from 'react';
import { Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { WardRiskRecord } from '../../../types';
import { fetchWithColdStart } from '../../../services/apiConfig';

interface ActionCenterWidgetProps {
  ward: WardRiskRecord | null;
  districtTier: string;
  districtName: string;
}

export default function ActionCenterWidget({ ward, districtTier, districtName }: ActionCenterWidgetProps) {
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [dispatchMessage, setDispatchMessage] = useState<string | null>(null);

  const riskTier = (ward?.RiskTier || districtTier || 'NORMAL').toUpperCase();
  const geoContext = ward ? `Ward ${String(ward.ward_no).replace('Ward ', '')}` : `${districtName} District`;

  const getActions = () => {
    switch (riskTier) {
      case 'EXTREME':
      case 'RED':
        return {
          immediate: [
            "Increase hydration and rest breaks",
            "Prioritize monitoring of outdoor workers",
            "Review high-exposure locations immediately"
          ],
          operational: [
            "Prepare local extreme-heat messaging",
            "Monitor highly vulnerable demographics",
            "Coordinate emergency medical field teams"
          ],
          communication: [
            "Targeted SMS alerts to ward residents",
            "Emergency radio broadcasts",
            "Admin dispatch to local hospitals"
          ]
        };
      case 'HIGH':
      case 'ORANGE':
        return {
          immediate: [
            "Limit outdoor activities during afternoon",
            "Deploy mobile hydration units",
            "Issue advisory for outdoor workers"
          ],
          operational: [
            "Review cooling center readiness",
            "Increase staff readiness for heat illness",
            "Stock up on IV fluids and ORS"
          ],
          communication: [
            "Targeted SMS alerts to vulnerable groups",
            "WhatsApp broadcast to community leaders",
            "Admin dispatch to healthcare facilities"
          ]
        };
      case 'MODERATE':
      case 'YELLOW':
        return {
          immediate: [
            "Monitor WBGT and UTCI trends closely",
            "Verify water supply to vulnerable zones",
            "Stay hydrated throughout the day"
          ],
          operational: [
            "Standard monitoring procedures",
            "Advise outpatients on hydration",
            "Prepare for potential escalation"
          ],
          communication: [
            "General public awareness messages",
            "Social media advisories"
          ]
        };
      default:
        return {
          immediate: ["Maintain baseline monitoring"],
          operational: ["Normal operations"],
          communication: ["No alerts necessary"]
        };
    }
  };

  const actions = getActions();

  const handleDispatch = async (channel: string) => {
    setDispatchStatus('sending');
    setDispatchMessage(null);
    try {
      const payload = ward ? { ward_no: ward.ward_no } : { district: districtName };
      
      const res = await fetchWithColdStart('/api/v1/alerts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.dispatch_status === 'SUCCESS' || data.dispatch_status === 'BROADCAST_TRANSMITTED') {
        setDispatchStatus('success');
        setDispatchMessage(`Dispatched via ${channel} successfully.`);
      } else {
        setDispatchStatus('error');
        setDispatchMessage(`Dispatch failed: ${data.dispatch_status}`);
      }
    } catch (err) {
      setDispatchStatus('error');
      setDispatchMessage('Failed to connect to dispatch API.');
    }
    
    setTimeout(() => {
      setDispatchStatus('idle');
      setDispatchMessage(null);
    }, 5000);
  };

  const activeTierColor = (riskTier === 'RED' || riskTier === 'EXTREME') ? 'text-red-500'
    : (riskTier === 'ORANGE' || riskTier === 'HIGH') ? 'text-orange-500'
    : (riskTier === 'YELLOW' || riskTier === 'MODERATE') ? 'text-yellow-500'
    : 'text-emerald-500';

  return (
    <div className="w-full flex flex-col md:flex-row gap-12 py-8 border-b border-t border-gray-200 dark:border-white/10 relative">
      <div className="absolute top-4 right-4 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 dark:bg-indigo-900/10 dark:text-indigo-400 dark:border-indigo-800/30 uppercase tracking-widest hidden md:block">
        [RECOMMENDED]
      </div>

      {/* 1. CURRENT RISK */}
      <div className="flex flex-col md:w-1/4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">Current Risk</h3>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col border-b border-gray-200 dark:border-white/10 pb-4">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Target Area</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">{geoContext}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Operational Tier</span>
            <span className={`text-3xl font-bold tracking-tight uppercase ${activeTierColor}`}>
              {riskTier}
            </span>
            {ward && (
              <span className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-2">Score {Math.round(ward.WardRiskScore || 0)}</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. PRIORITY ACTIONS */}
      <div className="flex flex-col md:w-2/4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">Priority Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-cyan-500 bg-cyan-50 dark:bg-cyan-900/10 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/30">01</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Immediate</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              {actions.immediate.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-cyan-500 bg-cyan-50 dark:bg-cyan-900/10 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/30">02</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Operational</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              {actions.operational.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:col-span-2 border-t border-gray-200 dark:border-white/10 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-cyan-500 bg-cyan-50 dark:bg-cyan-900/10 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/30">03</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Communication</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              {actions.communication.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. DISPATCH */}
      <div className="flex flex-col md:w-1/4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">Dispatch System</h3>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => handleDispatch('SMS')}
            disabled={dispatchStatus === 'sending'}
            className="group flex items-center justify-between w-full py-3 px-4 bg-gray-50 dark:bg-[#151821] border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 rounded text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest disabled:opacity-50 transition-all"
          >
            <span>SMS Network</span>
            <Send className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-500 transition-colors" />
          </button>
          
          <button 
            onClick={() => handleDispatch('WhatsApp')}
            disabled={dispatchStatus === 'sending'}
            className="group flex items-center justify-between w-full py-3 px-4 bg-gray-50 dark:bg-[#151821] border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 rounded text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest disabled:opacity-50 transition-all"
          >
            <span>WhatsApp Broadcast</span>
            <Send className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-500 transition-colors" />
          </button>
          
          <button 
            onClick={() => handleDispatch('Admin Notification')}
            disabled={dispatchStatus === 'sending'}
            className="group flex items-center justify-between w-full py-3 px-4 bg-gray-50 dark:bg-[#151821] border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 rounded text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest disabled:opacity-50 transition-all"
          >
            <span>Admin Alert</span>
            <Send className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-500 transition-colors" />
          </button>
        </div>

        <div className="mt-auto pt-6 flex flex-col items-center justify-center min-h-[48px]">
          {dispatchStatus === 'idle' && (
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Ready to dispatch</span>
          )}
          {dispatchStatus === 'sending' && (
            <span className="text-[10px] text-cyan-500 uppercase tracking-widest font-mono flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Sending...
            </span>
          )}
          {dispatchStatus === 'success' && (
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> {dispatchMessage}
            </span>
          )}
          {dispatchStatus === 'error' && (
            <span className="text-[10px] text-red-500 uppercase tracking-widest font-mono flex items-center gap-2 text-center">
              <XCircle className="w-3 h-3 shrink-0" /> {dispatchMessage}
            </span>
          )}
        </div>
      </div>
      
    </div>
  );
}
