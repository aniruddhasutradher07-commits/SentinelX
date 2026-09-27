import React, { useState } from 'react';
import { Send, ShieldAlert, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../services/apiConfig';

interface RegionalAlertTriggerProps {
  initialWard?: string;
  className?: string;
}

export const RegionalAlertTrigger: React.FC<RegionalAlertTriggerProps> = ({
  initialWard = 'W14',
  className = ''
}) => {
  const [ward, setWard] = useState(initialWard);
  const [tier, setTier] = useState<'Yellow' | 'Orange' | 'Red'>('Orange');
  const [channel, setChannel] = useState<'SMS' | 'WhatsApp'>('SMS');
  const [dryRun, setDryRun] = useState(true);
  const [recipient, setRecipient] = useState('+91-94370XXXXX');
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const previewMessage = `🚨 [HeatGuard AI Emergency Alert] Ward ${ward}: ${tier.toUpperCase()} Thermal Alert. Recommended heat-safety control: pause heavy unshaded labor 11:00-15:30. Hydrate with ORS. Dial 108 for medical distress.`;

  const handleDispatch = async () => {
    setLoading(true);
    setDispatchResult(null);

    try {
      const res = await fetch(getApiUrl('/api/v1/alerts/dispatch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ward_no: ward,
          channel,
          alert_tier: tier,
          message: previewMessage,
          recipient_phone: recipient,
          dry_run: dryRun
        })
      });

      const data = await res.json();
      setDispatchResult(data);
    } catch {
      setDispatchResult({
        status: 'FAILED',
        delivery_status: 'FAILED',
        reason: 'Network error contacting dispatch gateway.'
      });
    } finally {
      setLoading(false);
    }
  };

  const deliveryStatus = dispatchResult?.delivery_status || dispatchResult?.status;

  const statusBadgeColor =
    deliveryStatus === 'SENT' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' :
    deliveryStatus === 'DEMO ACTION' ? 'bg-slate-800 text-slate-200 border-slate-600' :
    deliveryStatus === 'CREDENTIALS_NOT_CONFIGURED' ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' :
    deliveryStatus === 'FAILED' ? 'bg-rose-950/60 text-rose-300 border-rose-500/40' :
    '';

  return (
    <div className={`bg-tactical-900 border border-tactical-border rounded-2xl p-4 flex flex-col gap-3.5 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
            Regional Alert Trigger
          </h3>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 uppercase tracking-widest font-semibold">
          DISPATCH PROTOCOL
        </span>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Ward Selection</label>
          <input
            type="text"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder="e.g. W14"
            className="w-full bg-tactical-800 border border-tactical-border rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Alert Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as any)}
            className="w-full bg-tactical-800 border border-tactical-border rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="Yellow">Yellow (Watch)</option>
            <option value="Orange">Orange (Warning)</option>
            <option value="Red">Red (Severe)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as any)}
            className="w-full bg-tactical-800 border border-tactical-border rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="SMS">SMS Gateway</option>
            <option value="WhatsApp">WhatsApp Cloud API</option>
          </select>
        </div>
      </div>

      {/* Dry Run Toggle */}
      <div className="flex items-center justify-between bg-tactical-800/80 p-2.5 rounded-xl border border-tactical-border">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-200">DRY RUN MODE (Default Active)</span>
          <span className="text-[10px] text-slate-400 font-sans">
            Simulates dispatch pipeline without contacting carrier networks.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDryRun(!dryRun)}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition border ${
            dryRun
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
          }`}
        >
          {dryRun ? 'DRY RUN: ON' : 'LIVE DISPATCH'}
        </button>
      </div>

      {/* Message Preview */}
      <div className="bg-black/40 border border-tactical-border/70 rounded-xl p-2.5 flex flex-col gap-1">
        <span className="text-[9px] font-mono text-slate-400 uppercase">Message Preview:</span>
        <p className="text-xs text-slate-300 font-sans leading-relaxed select-all">
          {previewMessage}
        </p>
      </div>

      {/* Dispatch Button */}
      <button
        type="button"
        disabled={loading}
        onClick={handleDispatch}
        className="w-full py-2.5 rounded-xl bg-cyan-950 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition outline-none shadow-md font-sans disabled:opacity-50"
      >
        {loading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5" />
        )}
        {loading ? 'Processing Dispatch...' : `Execute Regional Dispatch (${dryRun ? 'DEMO ACTION' : 'CARRIER GATEWAY'})`}
      </button>

      {/* Truthful Delivery Status Display */}
      {dispatchResult && (
        <div className={`p-3 rounded-xl border flex flex-col gap-1 text-xs font-mono ${statusBadgeColor}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 uppercase">
              {deliveryStatus === 'SENT' ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
              Status: {deliveryStatus}
            </span>
            <span className="text-[10px] opacity-75">{dispatchResult.audit_id || ''}</span>
          </div>
          {dispatchResult.reason && (
            <p className="text-[11px] font-sans opacity-90 mt-0.5 leading-tight">
              {dispatchResult.reason}
            </p>
          )}
          {dispatchResult.provenance && (
            <p className="text-[10px] opacity-80 italic mt-0.5">
              {dispatchResult.provenance}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
