import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, Cpu, ActivitySquare, ArrowRight } from 'lucide-react';

export default function Landing() {
  
  // Optional lightweight scroll observer for the cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e12] text-white font-sans overflow-x-hidden selection:bg-orange-500/30">
      
      {/* Background glow effects to prove glassmorphism */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-md bg-[#0a0e12]/50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-wide uppercase">Sentinel<span className="text-orange-500">X</span></span>
        </div>
        <div>
          <Link 
            to="/" 
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Access Command Center &rarr;
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 flex flex-col items-center justify-center text-center min-h-[90vh]">
        
        {/* Molecule Illustration (CSS/SVG) */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-12 flex items-center justify-center animate-[spin_60s_linear_infinite]">
          {/* Central glow */}
          <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full"></div>
          
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            <defs>
              <linearGradient id="molGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="molGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
            
            {/* Primary Connections */}
            <line x1="100" y1="100" x2="135" y2="60" stroke="url(#molGrad)" strokeWidth="2.5" className="opacity-80" />
            <line x1="100" y1="100" x2="60" y2="80" stroke="url(#molGrad)" strokeWidth="2.5" className="opacity-80" />
            <line x1="100" y1="100" x2="120" y2="145" stroke="url(#molGrad)" strokeWidth="2.5" className="opacity-80" />
            <line x1="100" y1="100" x2="65" y2="135" stroke="url(#molGrad)" strokeWidth="2.5" className="opacity-80" />
            
            {/* Secondary Branch 1 (Top Right) */}
            <line x1="135" y1="60" x2="170" y2="40" stroke="url(#molGrad2)" strokeWidth="1.5" className="opacity-50" />
            <line x1="135" y1="60" x2="165" y2="85" stroke="url(#molGrad)" strokeWidth="1.5" className="opacity-60" />
            <line x1="170" y1="40" x2="190" y2="65" stroke="url(#molGrad)" strokeWidth="1" className="opacity-40" />
            <line x1="165" y1="85" x2="190" y2="65" stroke="url(#molGrad2)" strokeWidth="1" className="opacity-30" />
            <line x1="165" y1="85" x2="155" y2="115" stroke="url(#molGrad)" strokeWidth="1.5" className="opacity-40" />

            {/* Secondary Branch 2 (Top Left) */}
            <line x1="60" y1="80" x2="30" y2="45" stroke="url(#molGrad2)" strokeWidth="1.5" className="opacity-50" />
            <line x1="60" y1="80" x2="20" y2="90" stroke="url(#molGrad)" strokeWidth="1.5" className="opacity-60" />
            <line x1="30" y1="45" x2="15" y2="65" stroke="url(#molGrad)" strokeWidth="1" className="opacity-30" />
            <line x1="20" y1="90" x2="15" y2="65" stroke="url(#molGrad2)" strokeWidth="1" className="opacity-40" />

            {/* Secondary Branch 3 (Bottom Right) */}
            <line x1="120" y1="145" x2="155" y2="160" stroke="url(#molGrad)" strokeWidth="1.5" className="opacity-60" />
            <line x1="120" y1="145" x2="95" y2="175" stroke="url(#molGrad2)" strokeWidth="1.5" className="opacity-50" />
            <line x1="155" y1="160" x2="135" y2="185" stroke="url(#molGrad)" strokeWidth="1" className="opacity-40" />
            <line x1="95" y1="175" x2="135" y2="185" stroke="url(#molGrad2)" strokeWidth="1" className="opacity-30" />
            <line x1="155" y1="115" x2="155" y2="160" stroke="url(#molGrad)" strokeWidth="1" className="opacity-30" />

            {/* Secondary Branch 4 (Bottom Left) */}
            <line x1="65" y1="135" x2="35" y2="155" stroke="url(#molGrad)" strokeWidth="1.5" className="opacity-50" />
            <line x1="65" y1="135" x2="70" y2="170" stroke="url(#molGrad2)" strokeWidth="1.5" className="opacity-60" />
            <line x1="35" y1="155" x2="45" y2="180" stroke="url(#molGrad)" strokeWidth="1" className="opacity-40" />
            <line x1="70" y1="170" x2="45" y2="180" stroke="url(#molGrad2)" strokeWidth="1" className="opacity-30" />
            <line x1="20" y1="90" x2="35" y2="155" stroke="url(#molGrad)" strokeWidth="1" className="opacity-20" />

            {/* Cross-linking for complexity */}
            <line x1="60" y1="80" x2="135" y2="60" stroke="url(#molGrad)" strokeWidth="1" className="opacity-20" />
            <line x1="65" y1="135" x2="120" y2="145" stroke="url(#molGrad2)" strokeWidth="1" className="opacity-20" />
            <line x1="60" y1="80" x2="65" y2="135" stroke="url(#molGrad)" strokeWidth="1" className="opacity-10" />

            {/* Center Node */}
            <circle cx="100" cy="100" r="14" fill="url(#molGrad)" className="animate-pulse" />
            
            {/* Level 1 Nodes */}
            <circle cx="135" cy="60" r="9" fill="url(#molGrad2)" />
            <circle cx="60" cy="80" r="8" fill="url(#molGrad)" />
            <circle cx="120" cy="145" r="10" fill="url(#molGrad2)" />
            <circle cx="65" cy="135" r="7" fill="url(#molGrad)" />
            
            {/* Level 2 Nodes */}
            <circle cx="170" cy="40" r="5" fill="#f97316" />
            <circle cx="165" cy="85" r="6" fill="#ef4444" />
            <circle cx="155" cy="115" r="4" fill="#ea580c" />
            <circle cx="30" cy="45" r="5" fill="#f97316" />
            <circle cx="20" cy="90" r="4" fill="#ef4444" />
            <circle cx="155" cy="160" r="6" fill="#f97316" />
            <circle cx="95" cy="175" r="5" fill="#ef4444" />
            <circle cx="35" cy="155" r="4" fill="#f97316" />
            <circle cx="70" cy="170" r="5" fill="#ea580c" />
            
            {/* Level 3 Nodes */}
            <circle cx="190" cy="65" r="3" fill="#ef4444" />
            <circle cx="15" cy="65" r="3" fill="#ea580c" />
            <circle cx="135" cy="185" r="3" fill="#f97316" />
            <circle cx="45" cy="180" r="2.5" fill="#ef4444" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl drop-shadow-sm">
          From Weather Data to <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Human Survival</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 font-medium">
          Translating raw meteorological inputs into physiological human risk, enabling proactive emergency response and targeted dispatch.
        </p>
        
        <Link 
          to="/" 
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded hover:bg-gray-200 transition-colors"
        >
          Explore the Platform
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 border border-white rounded scale-105 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </Link>
      </section>

      {/* Features Grid */}
      <section className="relative max-w-7xl mx-auto px-6 pb-32 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-0 p-6 rounded-xl bg-white/[0.03] backdrop-blur-[16px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(249,115,22,0.1)] group">
            <div className="w-12 h-12 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ActivitySquare className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold mb-2 tracking-wide uppercase">Thermal Stress Engine</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Calculates advanced bio-meteorological metrics (WBGT, UTCI) to measure actual human physiological strain.
            </p>
          </div>

          {/* Card 2 */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100 p-6 rounded-xl bg-white/[0.03] backdrop-blur-[16px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(6,182,212,0.1)] group">
            <div className="w-12 h-12 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="text-lg font-bold mb-2 tracking-wide uppercase">Vulnerability Mapping</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Cross-references weather exposure with demographic density, elderly population, and infrastructure access.
            </p>
          </div>

          {/* Card 3 */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200 p-6 rounded-xl bg-white/[0.03] backdrop-blur-[16px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(168,85,247,0.1)] group">
            <div className="w-12 h-12 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-bold mb-2 tracking-wide uppercase">AI Incident Copilot</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              On-demand operational intelligence providing natural language querying of live telemetry and action protocols.
            </p>
          </div>

          {/* Card 4 */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300 p-6 rounded-xl bg-white/[0.03] backdrop-blur-[16px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(239,68,68,0.1)] group">
            <div className="w-12 h-12 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold mb-2 tracking-wide uppercase">Hospital Surge Forecasting</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Predictive modeling to anticipate healthcare capacity strain 5 days in advance based on cascading heat exposure.
            </p>
          </div>

        </div>
      </section>

      {/* Footer / Hackathon Panel */}
      <section className="relative max-w-4xl mx-auto px-6 pb-20 z-10">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-[24px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] text-center">
          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest">
            Problem Statement 26083
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-wide">
            Built for Smart India Hackathon 2026
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8 font-medium">
            A comprehensive, resilience-first command platform addressing localized heat-stress mapping and vulnerability-aware dispatch strategies.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider rounded hover:bg-white/20 transition-colors"
          >
            View Live Demo
          </Link>
        </div>
      </section>
      
    </div>
  );
}
