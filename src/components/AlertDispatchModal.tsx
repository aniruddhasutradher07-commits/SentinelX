import React, { useState } from 'react';
import { 
  Send, 
  X, 
  CheckCircle2, 
  Radio, 
  Phone, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { AlertDispatchResponse } from '../types';

interface AlertDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRegion?: string;
  initialMessage?: string;
}

export const AlertDispatchModal: React.FC<AlertDispatchModalProps> = ({
  isOpen,
  onClose,
  initialRegion = 'Khordha',
  initialMessage,
}) => {
  const [region, setRegion] = useState(initialRegion);
  const [phone, setPhone] = useState('+91-9437012345');
  const [message, setMessage] = useState(
    initialMessage || `🚨 [SENTINELX EMERGENCY HEAT ADVISORY] Region: ${initialRegion} - Extreme WBGT thermal strain & hospital surge alert. Suspend unshaded heavy physical labor between 11:00 AM - 4:00 PM.`
  );
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<AlertDispatchResponse | null>(null);

  if (!isOpen) return null;

  const handleDispatch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/alerts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: region,
          recipient_phone: phone,
          advisory_text: message,
        }),
      });
      const data: AlertDispatchResponse = await res.json();
      setReceipt(data);
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 relative shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {receipt ? (
          /* Receipt View */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold font-display text-white">Emergency Advisory Dispatched</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Gateway: {receipt.gateway}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-bold">{receipt.dispatch_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Region:</span>
                <span className="text-slate-200">{receipt.district || receipt.ward_no || 'Target Area'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient Phone:</span>
                <span className="text-slate-200">{receipt.recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-400">{new Date(receipt.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                <span className="text-slate-500 block mb-1">Payload:</span>
                {receipt.message_payload}
              </div>
            </div>

            <button
              onClick={() => {
                setReceipt(null);
                onClose();
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition border border-slate-800"
            >
              Done / Return to Command Center
            </button>
          </div>
        ) : (
          /* Dispatch Form View */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-white">Emergency SMS / IVRS Dispatcher</h2>
                <p className="text-xs text-slate-400">OSDMA / BMC Automated Health Alert Trigger</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target District / Ward</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Emergency Gateway Recipient</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-94370XXXXX"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Alert Broadcast Text</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-sky-500 text-xs font-sans"
                />
              </div>
            </div>

            <button
              onClick={handleDispatch}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Transmitting...' : 'Dispatch Emergency Broadcast'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
