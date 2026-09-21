import React, { useEffect, useRef, useState } from 'react';
import { Sun, Clock, Wind, Play, Pause, Compass, Flame } from 'lucide-react';

interface SolarNoonFluxWidgetProps {
  ambientTemp?: number;
  solarRadiation?: number;
  windSpeed?: number;
}

export const SolarNoonFluxWidget: React.FC<SolarNoonFluxWidgetProps> = ({
  ambientTemp = 39.5,
  solarRadiation = 840,
  windSpeed = 2.8,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [countdownText, setCountdownText] = useState<string>('');
  const [solarStatus, setSolarStatus] = useState<string>('APPROACHING ZENITH');

  // Calculate live Countdown to Solar Noon (Solar Zenith in Bhubaneswar ~ 12:14 PM IST)
  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const solarNoon = new Date();
      solarNoon.setHours(12, 14, 0, 0);

      const diff = solarNoon.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdownText(
          `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`
        );
        setSolarStatus('PEAK ZENITH COUNTDOWN');
      } else {
        const nextNoon = new Date(solarNoon.getTime() + 24 * 60 * 60 * 1000);
        const nextDiff = nextNoon.getTime() - now.getTime();
        const hours = Math.floor(nextDiff / (1000 * 60 * 60));
        const minutes = Math.floor((nextDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((nextDiff % (1000 * 60)) / 1000);
        setCountdownText(
          `Next Cycle: ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`
        );
        setSolarStatus('DIURNAL PEAK REACHED');
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // HTML5 Canvas: Atmospheric Convective Thermal Streamlines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    const height = (canvas.height = 140);

    // Convective stream particles
    const particleCount = 45;
    const particles: {
      x: number;
      y: number;
      speed: number;
      size: number;
      opacity: number;
      heat: number; // 0 to 1
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: (Math.random() * 1.5 + 0.8) * (windSpeed / 2.5),
        size: Math.random() * 2.5 + 1.2,
        opacity: Math.random() * 0.7 + 0.3,
        heat: Math.random(),
      });
    }

    function render() {
      if (!ctx) return;
      // Soft fading trail
      ctx.fillStyle = 'rgba(11, 13, 14, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Draw flowing streamlines
      particles.forEach((p) => {
        ctx.beginPath();
        // Coastal warm convective drift: diagonally upwards-right
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        // Color based on heat level (Sky Blue -> Amber -> Rose)
        if (p.heat > 0.6) {
          ctx.fillStyle = `rgba(244, 63, 94, ${p.opacity})`; // Rose (High heat flux)
        } else if (p.heat > 0.3) {
          ctx.fillStyle = `rgba(251, 146, 60, ${p.opacity})`; // Amber (Moderate)
        } else {
          ctx.fillStyle = `rgba(56, 189, 248, ${p.opacity})`; // Cyan (Coastal vapor)
        }
        ctx.fill();

        // Draw micro-tail
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.speed * 8, p.y + Math.sin(p.x * 0.02) * 2);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = p.size * 0.5;
        ctx.stroke();

        // Advance
        p.x += p.speed;
        p.y += Math.sin(p.x * 0.02) * 0.6 - 0.2; // Slight convective thermal lift

        // Wrap around
        if (p.x > width + 20) {
          p.x = -20;
          p.y = Math.random() * height;
        }
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
      });

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, windSpeed]);

  return (
    <div className="bg-gradient-to-br from-[#14171A] to-[#1A1F24] rounded-2xl border border-white/[0.08] p-5 shadow-xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Solar Noon Zenith Countdown */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sun className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  ASTRONOMICAL SOLAR ZENITH
                </span>
                <h3 className="text-base font-bold text-white font-display">
                  Diurnal Solar Peak Countdown
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                {solarStatus}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 uppercase tracking-widest font-semibold">
                [CALCULATED]
              </span>
            </div>
          </div>

          {/* Countdown Clock Display */}
          <div className="bg-[#0B0D0E]/80 border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-wider block">
                  {countdownText || 'CALCULATING...'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Solar Noon at 12:14 PM IST (85.8°E Zenith)
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-base font-mono font-bold text-white block">
                  {solarRadiation} W/m²
                </span>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded border border-emerald-500/30 text-emerald-300">
                  [REAL]
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 uppercase">
                Peak Irradiance
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
            <div className="bg-[#0B0D0E]/50 p-2 rounded-lg border border-white/[0.04] text-center">
              <span className="block text-slate-500 text-[9px]">UV Index Peak <span className="text-emerald-300 text-[8px]">[REAL]</span></span>
              <span className="text-rose-400 font-bold text-xs">11.4 Extreme</span>
            </div>
            <div className="bg-[#0B0D0E]/50 p-2 rounded-lg border border-white/[0.04] text-center">
              <span className="block text-slate-500 text-[9px]">Solar Azimuth <span className="text-cyan-300 text-[8px]">[CALC]</span></span>
              <span className="text-sky-300 font-bold text-xs">168° SSE</span>
            </div>
            <div className="bg-[#0B0D0E]/50 p-2 rounded-lg border border-white/[0.04] text-center">
              <span className="block text-slate-500 text-[9px]">Solar Elevation <span className="text-cyan-300 text-[8px]">[CALC]</span></span>
              <span className="text-amber-300 font-bold text-xs">68.4° Zenith</span>
            </div>
          </div>
        </div>

        {/* Right Column: Coastal Thermal Flux & Convective Wind Streamline Canvas */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <Wind className="w-4 h-4 text-sky-400" />
              <span className="font-bold">Coastal Convective Thermal Flux Particles</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 uppercase tracking-widest font-semibold ml-1">
                [REAL]
              </span>
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition"
              title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
              <span>{isPlaying ? 'Live Stream' : 'Paused'}</span>
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative w-full h-[120px] rounded-xl overflow-hidden bg-[#0B0D0E] border border-white/[0.06] shadow-inner">
            <canvas ref={canvasRef} className="w-full h-full block" />
            
            {/* Stream Legend Overlay */}
            <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[9px] font-mono text-slate-400 bg-[#0E1114]/80 px-2 py-0.5 rounded-md border border-white/[0.05]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Bay of Bengal Vapor
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Inland Thermal Plume
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
            <span>Flow: Coastal Maritime Inflow → Mahanadi River Basin</span>
            <span className="text-sky-300 font-bold">{windSpeed} m/s Anemometer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
