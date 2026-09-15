import React, { useState } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Droplets, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Globe2, 
  Sparkles,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { WardRiskRecord } from '../types';

interface CitizenAdvisoryViewProps {
  wards: WardRiskRecord[];
  onBackToOperations?: () => void;
}

const ADVISORIES = {
  or: {
    langName: 'ଓଡ଼ିଆ (Odia)',
    advice: {
      Red: 'ଅତ୍ୟଧିକ ଉତ୍ତାପ ଚେତାବନୀ! ଦିନ ୧୧ଟାରୁ ଅପରାହ୍ନ ୩ଟା ମଧ୍ୟରେ ସିଧାସଳଖ ଖରାରେ କାମ କରନ୍ତୁ ନାହିଁ। ବୟସ୍କ ଓ ପିଲାମାନଙ୍କୁ ଛାଇରେ ରଖନ୍ତୁ ଏବଂ ପ୍ରଚୁର ପାଣି ପିଅନ୍ତୁ।',
      Orange: 'ଗ୍ରୀଷ୍ମ ପ୍ରବାହ ସତର୍କତା। ଘରୁ ବାହାରିବା ସମୟରେ ଛତା ଓ ପାଣି ବୋତଲ ସାଙ୍ଗରେ ନିଅନ୍ତୁ। ଶ୍ରମିକମାନେ ୧୫ ମିନିଟ୍ ଅନ୍ତରରେ ବିଶ୍ରାମ ନିଅନ୍ତୁ।',
      Yellow: 'ସାଧାରଣ ଉଷ୍ମତା। ପର୍ଯ୍ୟାପ୍ତ ପାଣି ଓ ତରଳ ପାନୀୟ ଗ୍ରହଣ କରନ୍ତୁ।',
      Green: 'ପାଣିପାଗ ସ୍ୱାଭାବିକ। କୌଣସି ଜରୁରୀ ସତର୍କତା ଆବଶ୍ୟକ ନାହିଁ।'
    },
    coolingCenter: 'ସହିଦ ନଗର କଲ୍ୟାଣ ମଣ୍ଡପ କୁଲିଂ କେନ୍ଦ୍ର (ଜଳ ସେବା)',
    walkTime: '୬ ମିନିଟ୍ ଚାଲିବା ବାଟ',
    dialIvr: 'ଟୋଲ-ଫ୍ରି ୧୦୭୭ ଡାଏଲ୍ କରନ୍ତୁ (ମାଗଣା IVR ସେବା)'
  },
  en: {
    langName: 'English (EN)',
    advice: {
      Red: 'Severe heat emergency. Cease unshaded heavy manual work between 11:00 AM and 3:00 PM. Keep elderly residents in cool areas and hydrate constantly with ORS.',
      Orange: 'Elevated heatwave strain. Rest in shaded intervals every 20 minutes. Avoid direct midday sun.',
      Yellow: 'Moderate humidity and warm conditions. Stay hydrated throughout the day.',
      Green: 'Thermal conditions are currently within normal comfort thresholds.'
    },
    coolingCenter: 'Saheed Nagar Community Kalyan Mandap (Free ORS & AC Kiosk)',
    walkTime: '6 min walk (420 m)',
    dialIvr: 'Dial Toll-Free 1077 (Free Multilingual Voice Advisory)'
  },
  hi: {
    langName: 'हिन्दी (Hindi)',
    advice: {
      Red: 'अत्यधिक भीषण लू की चेतावनी! दोपहर 11 बजे से 3 बजे के बीच धूप में भारी शारीरिक श्रम से बचें। बुजुर्गों को ठंडे कमरों में रखें और ओआरएस/पानी पीते रहें।',
      Orange: 'भीषण गर्मी की चेतावनी। धूप में निकलने से बचें और हर 20 मिनट में पानी पिएं।',
      Yellow: 'सामान्य गर्मी। पर्याप्त जलपान करते रहें।',
      Green: 'मौसम सामान्य है। कोई विशेष चेतावनी नहीं।'
    },
    coolingCenter: 'शहीद नगर कल्याण मंडप सार्वजनिक कूलिंग केंद्र',
    walkTime: '6 मिनट की पैदल दूरी',
    dialIvr: 'टोल-फ्री 1077 पर कॉल करें (मुफ्त वॉयस संदेश)'
  }
};

export const CitizenAdvisoryView: React.FC<CitizenAdvisoryViewProps> = ({ wards, onBackToOperations }) => {
  const [selectedWardNo, setSelectedWardNo] = useState<string>(wards[0]?.ward_no || 'W21');
  const [selectedLang, setSelectedLang] = useState<'or' | 'en' | 'hi'>('or');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const activeWard = wards.find(w => w.ward_no === selectedWardNo) || wards[0] || {
    ward_no: 'W21',
    zone: 'North Zone',
    RiskTier: 'Red',
    WardRiskScore: 97,
    WBGT_celsius: 32.8,
    temperature_c: 40.2
  };

  const currentTier = (activeWard.RiskTier || 'Red') as 'Red' | 'Orange' | 'Yellow' | 'Green';
  const tierColor = currentTier === 'Red' ? '#C0392B' : currentTier === 'Orange' ? '#D9772E' : currentTier === 'Yellow' ? '#C9A227' : '#3A7D5C';
  const tierBg = currentTier === 'Red' ? 'rgba(192, 57, 43, 0.15)' : currentTier === 'Orange' ? 'rgba(217, 119, 46, 0.15)' : currentTier === 'Yellow' ? 'rgba(201, 162, 39, 0.15)' : 'rgba(58, 125, 92, 0.15)';

  const t = ADVISORIES[selectedLang];
  const adviceSentence = t.advice[currentTier] || t.advice.Red;

  const handlePlayVoice = () => {
    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device.');
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `${activeWard.ward_no}. ${adviceSentence}. ${t.coolingCenter}.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = selectedLang === 'or' ? 'hi-IN' : selectedLang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-[#0B0D0E] text-[#F2F1EC] overflow-y-auto">
      {/* Citizen Advisory Single Card (UI/UX Spec Section 3.4) */}
      <div className="max-w-md w-full bg-[#14171A] border border-[#232A2E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
        
        {/* Top Bar: Ward Selector & Language Toggle */}
        <div className="flex items-center justify-between border-b border-[#232A2E] pb-4">
          <div>
            <label className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider block">Your Ward / ଅଞ୍ଚଳ</label>
            <select
              value={selectedWardNo}
              onChange={(e) => setSelectedWardNo(e.target.value)}
              className="bg-[#0B0D0E] border border-[#232A2E] text-white font-bold text-sm rounded-xl px-2.5 py-1 mt-0.5 focus:outline-none focus:border-[#0F5C5C] font-sans"
            >
              {wards.slice(0, 30).map((w) => (
                <option key={w.ward_no} value={w.ward_no} className="bg-[#14171A]">
                  {w.ward_no} ({w.zone})
                </option>
              ))}
            </select>
          </div>

          {/* Language Switcher */}
          <div className="flex gap-1 bg-[#0B0D0E] p-1 rounded-xl border border-[#232A2E]">
            {(['or', 'en', 'hi'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLang(lang)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  selectedLang === lang
                    ? 'bg-[#0F5C5C] text-white'
                    : 'text-[#8B9096] hover:text-white'
                }`}
              >
                {lang === 'or' ? 'ଓଡ଼ିଆ' : lang === 'en' ? 'EN' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>

        {/* Big Today's Risk Grade Display (Section 3.4: large type, colour + text label + ordered position) */}
        <div 
          className="p-5 rounded-2xl border text-center space-y-2 transition-all"
          style={{ backgroundColor: tierBg, borderColor: tierColor }}
        >
          <span className="text-[11px] font-mono uppercase tracking-widest block" style={{ color: tierColor }}>
            TODAY&apos;S WARD HEAT RISK STATUS
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight" style={{ color: tierColor }}>
            {currentTier.toUpperCase()}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0B0D0E]/60 text-xs font-mono font-bold text-[#F2F1EC] border border-white/10">
            <span>Score: {activeWard.WardRiskScore || 97}/100</span>
            <span>·</span>
            <span>WBGT {activeWard.WBGT_celsius || 32.8}°C</span>
          </div>
        </div>

        {/* One Plain Sentence of Advice (Section 3.4) */}
        <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-2xl p-4">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
            ⚡ Direct Citizen Advisory
          </span>
          <p className="text-sm font-sans leading-relaxed text-[#F2F1EC]">
            {adviceSentence}
          </p>
        </div>

        {/* Nearest Cooling Point with Walking Time (Section 3.4) */}
        <div className="bg-[#0B0D0E] border border-[#232A2E] rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 border border-teal-500/30">
            <Droplets className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#8B9096] uppercase tracking-wider block">Nearest Public Cooling Shelter</span>
            <h4 className="text-xs font-bold text-white font-sans">{t.coolingCenter}</h4>
            <div className="flex items-center gap-1.5 text-xs text-teal-400 font-mono pt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.walkTime}</span>
            </div>
          </div>
        </div>

        {/* Tappable Phone Icon / IVR Voice Audio Trigger (Section 3.4 & Section 12 Demo step 9) */}
        <button
          type="button"
          onClick={handlePlayVoice}
          className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-bold font-sans transition border shadow-lg ${
            isPlayingVoice
              ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
              : 'bg-[#0F5C5C] hover:bg-teal-700 border-[#0F5C5C] text-white shadow-teal-900/30'
          }`}
        >
          {isPlayingVoice ? (
            <>
              <VolumeX className="w-4 h-4" />
              <span>ସତର୍କତା ବନ୍ଦ କରନ୍ତୁ / Stop Voice Call</span>
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              <span>{selectedLang === 'or' ? 'ସ୍ୱର ବାର୍ତ୍ତା ଶୁଣନ୍ତୁ (Odia Voice Alert)' : selectedLang === 'hi' ? 'वॉयस संदेश सुनें (Hindi Voice Alert)' : 'Listen to Voice Advisory (IVRS)'}</span>
            </>
          )}
        </button>

        <div className="text-center">
          <span className="text-[11px] font-mono text-[#8B9096] block">
            {t.dialIvr}
          </span>
          {onBackToOperations && (
            <button
              onClick={onBackToOperations}
              className="mt-3 text-xs text-teal-400 hover:text-teal-300 underline font-mono"
            >
              ← Return to Municipal Operations Room
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
