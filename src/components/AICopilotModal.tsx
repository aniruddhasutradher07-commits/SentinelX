import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Languages, 
  Copy, 
  Check, 
  MessageSquare, 
  ShieldAlert, 
  User, 
  RefreshCw 
} from 'lucide-react';
import { AICopilotResponse } from '../types';

interface AICopilotModalProps {
  onClose?: () => void;
  onDispatchAlert: (text: string, region: string) => void;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({ onClose, onDispatchAlert }) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'advisory'>('chat');

  // Chat state
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; source?: string }>>([
    {
      sender: 'bot',
      text: "🛡️ **SentinelX AI Incident Commander Ready.**\n\nI am connected to real-time NCMRWF/ERA5 telemetry, 30 Odisha districts, and 67 Bhubaneswar wards. How can I assist disaster management operations today?",
      source: 'Google Gemini AI Copilot',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Advisory Generator state
  const [targetRegion, setTargetRegion] = useState('Khordha');
  const [targetGroup, setTargetGroup] = useState('outdoor_laborers');
  const [targetLang, setTargetLang] = useState<'en' | 'or' | 'hi'>('or');
  const [advisoryResult, setAdvisoryResult] = useState<string>('');
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);
  const [copied, setCopied] = useState(false);

  const presetQueries = [
    'What are the mandatory cooling protocols when WBGT > 32°C?',
    'How should Capital Hospital prepare for 48-hour lagged heat surge?',
    'What work-rest cycle should BMC enforce for outdoor construction workers?',
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { sender: 'user' as const, text: textToSend }];
    setMessages(newMessages);
    setInputPrompt('');
    setLoadingChat(true);

    try {
      const res = await fetch('/api/v1/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });
      const data: AICopilotResponse = await res.json();

      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: data.response,
          source: data.source,
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: 'Error contacting AI Copilot. Please check your network connection.',
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleGenerateAdvisory = async () => {
    setLoadingAdvisory(true);
    setCopied(false);
    try {
      const res = await fetch('/api/v1/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district_or_ward: targetRegion,
          vulnerability_group: targetGroup,
          language: targetLang,
        }),
      });
      const data = await res.json();
      setAdvisoryResult(data.response);
    } catch (err) {
      console.error('Failed to generate advisory:', err);
    } finally {
      setLoadingAdvisory(false);
    }
  };

  const copyToClipboard = () => {
    if (!advisoryResult) return;
    navigator.clipboard.writeText(advisoryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col h-full space-y-4">
      {/* Tab Selector */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0">
        <div className="flex items-center gap-2">
          <button
            id="subtab-chat"
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'chat'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Incident Commander Chat
          </button>

          <button
            id="subtab-advisory"
            onClick={() => setActiveSubTab('advisory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'advisory'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Languages className="w-4 h-4" />
            Multilingual Advisory Generator (EN / OR / HI)
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline mr-2">
          Powered by Google Gemini 1.5 Flash + Clinical Domain Engine
        </span>
      </div>

      {/* VIEW 1: Incident Commander Chat */}
      {activeSubTab === 'chat' && (
        <div className="flex-1 flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden min-h-[450px]">
          {/* Preset Prompts Bar */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold shrink-0">Quick Queries:</span>
            {presetQueries.map((p, idx) => (
              <button
                key={idx}
                id={`btn-preset-query-${idx}`}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-sky-300 hover:border-sky-500/40 whitespace-nowrap transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.sender === 'user' ? 'bg-sky-500 text-white' : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                }`}>
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-sky-600/90 text-white rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                  {m.source && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-purple-400">
                      Engine: {m.source}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loadingChat && (
              <div className="flex gap-3 max-w-xl">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  Generating operational response...
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2 shrink-0">
            <input
              id="input-copilot-prompt"
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask SentinelX AI Incident Commander (e.g. WBGT cooling threshold, surge mitigation)..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              id="btn-send-copilot"
              onClick={() => handleSendMessage()}
              disabled={loadingChat || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: Multilingual Advisory Generator */}
      {activeSubTab === 'advisory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Advisory Parameters
            </h2>

            {/* Target Region */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target District or Ward</label>
              <input
                id="input-advisory-region"
                type="text"
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value)}
                placeholder="e.g. Khordha, Cuttack, W21, W34"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Target Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Demographic / Vulnerability</label>
              <select
                id="select-advisory-group"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="outdoor_laborers">Outdoor Construction &amp; Manual Laborers</option>
                <option value="elderly_citizens">Elderly Citizens &amp; Chronic Patients</option>
                <option value="urban_slums">Informal Settlements / Urban Heat Islands</option>
                <option value="schools">Schools &amp; Daytime Public Transit</option>
              </select>
            </div>

            {/* Target Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Broadcast Language</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'or', label: 'Odia (ଓଡ଼ିଆ)' },
                  { id: 'hi', label: 'Hindi (हिन्दी)' },
                  { id: 'en', label: 'English' },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    id={`btn-lang-${lang.id}`}
                    onClick={() => setTargetLang(lang.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition ${
                      targetLang === lang.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action */}
            <button
              id="btn-generate-advisory"
              onClick={handleGenerateAdvisory}
              disabled={loadingAdvisory}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loadingAdvisory ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Generate Multilingual Broadcast Advisory</span>
            </button>
          </div>

          {/* Right Advisory Output (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-200">Broadcast SMS/IVRS Message Payload</h3>
                {advisoryResult && (
                  <button
                    id="btn-copy-advisory"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 min-h-[220px] text-xs leading-relaxed text-slate-200 font-sans whitespace-pre-wrap">
                {advisoryResult || (
                  <div className="text-slate-500 flex flex-col items-center justify-center h-48 text-center">
                    <Languages className="w-8 h-8 mb-2 opacity-30" />
                    Click "Generate Multilingual Broadcast Advisory" to generate clinical warning text.
                  </div>
                )}
              </div>
            </div>

            {advisoryResult && (
              <button
                id="btn-dispatch-generated-advisory"
                onClick={() => onDispatchAlert(advisoryResult, targetRegion)}
                className="w-full mt-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-sky-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Simulate Immediate Broadcast to {targetRegion} Health Officers</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
