import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { Activity, ShieldAlert, Cpu, ActivitySquare, ArrowRight } from 'lucide-react';
import heatguardLogo from '../assets/heatguard-logo.png';

interface LandingProps {
  inApp?: boolean;
  onOpenCommand?: () => void;
}

export default function Landing({ inApp = false, onOpenCommand }: LandingProps) {
  // Optional lightweight scroll observer for the cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
          }
        });
      },
      { threshold: 0.05 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleCommandClick = (e: React.MouseEvent) => {
    if (onOpenCommand) {
      e.preventDefault();
      onOpenCommand();
    }
  };

  return (
    <div className={`min-h-screen bg-[#0a0e12] text-white font-sans overflow-x-hidden selection:bg-orange-500/30 ${inApp ? 'relative' : ''}`}>
      
      {/* Background glow effects to prove glassmorphism */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className={`${inApp ? 'sticky top-0' : 'fixed top-0 left-0 right-0'} z-50 flex items-center justify-between px-6 sm:px-8 py-5 backdrop-blur-md bg-[#0a0e12]/80 border-b border-white/5`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={heatguardLogo} 
              alt="HeatGuard AI Logo" 
              className="w-8 h-8 rounded-lg object-contain bg-white/5 p-1 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-wide uppercase">
            HeatGuard <span className="text-orange-500">AI</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
            PS 26083
          </span>
        </div>
        <div>
          {onOpenCommand ? (
            <button
              onClick={handleCommandClick}
              className="text-sm font-medium text-orange-400 hover:text-white transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30"
            >
              Access Command Center &rarr;
            </button>
          ) : (
            <Link 
              to="/app" 
              className="text-sm font-medium text-orange-400 hover:text-white transition-colors px-3.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30"
            >
              Access Command Center &rarr;
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-36 lg:pb-24 px-6 flex flex-col items-center justify-center text-center min-h-[85vh]">
        
        {/* Molecule Illustration (CSS/SVG) */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-10 flex items-center justify-center animate-[spin_60s_linear_infinite]">
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

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl drop-shadow-sm">
          From Weather Data to <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-500 to-red-600">Human Survival</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mb-10 font-medium leading-relaxed">
          Translating raw meteorological inputs into physiological human risk, enabling proactive emergency response and targeted dispatch.
        </p>
        
        {onOpenCommand ? (
          <button 
            onClick={handleCommandClick}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shadow-lg shadow-white/10"
          >
            Explore the Platform
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <Link 
            to="/app" 
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
          >
            Explore the Platform
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </section>

      {/* Features Grid */}
      <section className="relative max-w-7xl mx-auto px-6 pb-28 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="animate-on-scroll opacity-100 translate-y-0 transition-all duration-500 p-6 rounded-xl bg-white/[0.04] backdrop-blur-[16px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/[0.07] hover:border-orange-500/30 hover:shadow-[0_8px_32px_0_rgba(249,115,22,0.15)] group">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ActivitySquare className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold mb-2 tracking-wide uppercase text-white">Thermal Stress Engine</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Calculates advanced bio-meteorological metrics (WBGT, UTCI) to measure actual human physiological strain.
            </p>
          </div>

          {/* Card 2 */}
          <div className="animate-on-scroll opacity-100 translate-y-0 transition-all duration-500 delay-75 p-6 rounded-xl bg-white/[0.04] backdrop-blur-[16px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/[0.07] hover:border-cyan-500/30 hover:shadow-[0_8px_32px_0_rgba(6,182,212,0.15)] group">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="text-lg font-bold mb-2 tracking-wide uppercase text-white">Vulnerability Mapping</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Cross-references weather exposure with demographic density, elderly population, and infrastructure access.
            </p>
          </div>

          {/* Card 3 */}
          <div className="animate-on-scroll opacity-100 translate-y-0 transition-all duration-500 delay-150 p-6 rounded-xl bg-white/[0.04] backdrop-blur-[16px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/[0.07] hover:border-purple-500/30 hover:shadow-[0_8px_32px_0_rgba(168,85,247,0.15)] group">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-bold mb-2 tracking-wide uppercase text-white">AI Incident Copilot</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              On-demand operational intelligence providing natural language querying of live telemetry and action protocols.
            </p>
          </div>

          {/* Card 4 */}
          <div className="animate-on-scroll opacity-100 translate-y-0 transition-all duration-500 delay-200 p-6 rounded-xl bg-white/[0.04] backdrop-blur-[16px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/[0.07] hover:border-red-500/30 hover:shadow-[0_8px_32px_0_rgba(239,68,68,0.15)] group">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold mb-2 tracking-wide uppercase text-white">Hospital Surge Forecasting</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Predictive modeling to anticipate healthcare capacity strain 5 days in advance based on cascading heat exposure.
            </p>
          </div>

        </div>
      </section>

      {/* Footer / Hackathon Panel */}
      <section className="relative max-w-4xl mx-auto px-6 pb-20 z-10">
        <div className="animate-on-scroll opacity-100 translate-y-0 transition-all duration-700 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-[24px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] text-center">
          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold uppercase tracking-widest text-orange-400">
            Problem Statement 26083
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-wide text-white">
            Built for Smart India Hackathon 2026
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8 font-medium">
            A comprehensive, resilience-first command platform addressing localized heat-stress mapping and vulnerability-aware dispatch strategies.
          </p>
          {onOpenCommand ? (
            <button 
              onClick={handleCommandClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
            >
              View Live Demo
            </button>
          ) : (
            <Link 
              to="/app" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors"
            >
              View Live Demo
            </Link>
          )}
        </div>
      </section>
      
    </div>
  );
}
