import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';

interface DirectivePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export const DirectivePDFModal: React.FC<DirectivePDFModalProps> = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate a mock SHA-256 for demo purposes
  const mockSha = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:bg-white print:backdrop-blur-none">
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-directive, #printable-directive * {
            visibility: visible;
          }
          #printable-directive {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 20mm;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden print:w-full print:h-auto print:border-none print:rounded-none">
        
        {/* Header - Hidden during print */}
        <div className="no-print flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck size={20} />
            <h2 className="font-semibold text-lg tracking-wide">Official Collector Directive (Preview)</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-lg shadow-emerald-900/50"
            >
              <Printer size={16} />
              Export to PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-800/50 print:p-0 print:bg-white print:overflow-visible">
          
          {/* Printable Document (A4 format roughly) */}
          <div 
            id="printable-directive"
            className="bg-white text-black mx-auto max-w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl relative"
          >
            {/* Government Letterhead Header */}
            <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
              <div className="flex justify-center mb-4">
                {/* Mock Ashoka Chakra / Government Logo */}
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-slate-800 rounded-full flex items-center justify-center relative">
                     <div className="w-full h-[2px] bg-slate-800 absolute"></div>
                     <div className="h-full w-[2px] bg-slate-800 absolute"></div>
                     <div className="w-full h-[2px] bg-slate-800 absolute rotate-45"></div>
                     <div className="h-full w-[2px] bg-slate-800 absolute rotate-45"></div>
                  </div>
                </div>
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">Government of Odisha</h1>
              <h2 className="text-lg font-semibold text-slate-700 mt-1">Office of the District Magistrate & Collector</h2>
              <p className="text-sm text-slate-500 mt-2 font-mono">Disaster Management Authority (Section 144 / DMA 2005)</p>
            </div>

            {/* Meta Info */}
            <div className="flex justify-between text-sm mb-8 font-mono border-b border-slate-200 pb-4">
              <div>
                <p><strong>Order No:</strong> NDMA/OD/HEAT/{Math.floor(Math.random() * 10000)}</p>
                <p><strong>Date/Time:</strong> {timestamp} IST</p>
              </div>
              <div className="text-right text-xs text-slate-500 max-w-xs break-all">
                <p className="font-semibold text-slate-700">Digital Signature Hash (SHA-256):</p>
                {mockSha}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-8">
              <p className="font-bold underline text-lg">SUBJECT: Statutory Heat Action Directive & Emergency Healthcare Mobilization</p>
            </div>

            {/* Body */}
            <div className="prose max-w-none text-slate-800 space-y-4">
              {content.split('\n').map((paragraph, i) => (
                <p key={i} className={paragraph.startsWith('*') || paragraph.startsWith('-') ? 'ml-4' : ''}>
                  {/* Basic markdown-like bold parsing */}
                  {paragraph.split('**').map((chunk, j) => j % 2 === 1 ? <strong key={j}>{chunk}</strong> : chunk)}
                </p>
              ))}
            </div>

            {/* Signature Block */}
            <div className="mt-24 pt-8 flex justify-end">
              <div className="text-center">
                <div className="w-48 h-16 border-b-2 border-slate-800 border-dashed mb-2 flex items-end justify-center pb-2">
                  <span className="font-serif text-2xl text-blue-800 transform -rotate-2 italic">E-Signed</span>
                </div>
                <p className="font-bold">District Magistrate / Collector</p>
                <p className="text-sm text-slate-600">Chairperson, District Disaster Management Authority</p>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] border-t border-slate-300 pt-4 text-xs text-center text-slate-500 font-mono">
              <p>Generated by SentinelX AI Incident Commander (MoES/NDMA) • Not Valid Without E-Office Seal</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
