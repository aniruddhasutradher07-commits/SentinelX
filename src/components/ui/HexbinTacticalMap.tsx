import React, { useMemo } from 'react';

interface HexagonProps {
  x: number;
  y: number;
  radius: number;
  temp: number;
  delay: number;
}

const Hexagon = ({ x, y, radius, temp, delay }: HexagonProps) => {
  // Calculate hexagon points
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle_deg = 60 * i - 30;
      const angle_rad = Math.PI / 180 * angle_deg;
      pts.push(`${x + radius * Math.cos(angle_rad)},${y + radius * Math.sin(angle_rad)}`);
    }
    return pts.join(' ');
  }, [x, y, radius]);

  // Determine color based on temperature
  let fillStr = 'rgba(0, 242, 254, 0.05)';
  let strokeStr = 'rgba(0, 242, 254, 0.15)';
  let isCritical = false;
  let isHigh = false;
  let isModerate = false;

  if (temp >= 43) {
    fillStr = 'rgba(225, 29, 72, 0.4)'; // Rose 600
    strokeStr = 'rgba(244, 63, 94, 0.8)'; // Rose 500
    isCritical = true;
  } else if (temp >= 39) {
    fillStr = 'rgba(234, 88, 12, 0.4)'; // Orange 600
    strokeStr = 'rgba(249, 115, 22, 0.8)'; // Orange 500
    isHigh = true;
  } else if (temp >= 35) {
    fillStr = 'rgba(202, 138, 4, 0.3)'; // Yellow 600
    strokeStr = 'rgba(234, 179, 8, 0.6)'; // Yellow 500
    isModerate = true;
  } else if (temp >= 30) {
    fillStr = 'rgba(5, 150, 105, 0.2)'; // Emerald 600
    strokeStr = 'rgba(16, 185, 129, 0.4)'; // Emerald 500
  }

  // Animation classes
  const animationClass = isCritical 
    ? 'animate-[pulse_2s_ease-in-out_infinite]' 
    : 'animate-[pulse_4s_ease-in-out_infinite]';

  return (
    <g className={animationClass} style={{ animationDelay: `${delay}s` }}>
      <polygon 
        points={points} 
        fill={fillStr} 
        stroke={strokeStr} 
        strokeWidth={isCritical || isHigh ? "1.5" : "1"}
        className="transition-all duration-500 hover:fill-cyan-500/30 cursor-crosshair"
      />
      
      {/* Show temperature text in critical/high hexagons */}
      {(isCritical || isHigh || isModerate) && Math.random() > 0.4 && (
        <text 
          x={x} 
          y={y + 3} 
          fill={isCritical ? "#fff" : strokeStr} 
          fontSize={radius * 0.5} 
          fontWeight="bold" 
          fontFamily="monospace"
          textAnchor="middle"
          className="pointer-events-none"
        >
          {temp.toFixed(1)}
        </text>
      )}
      
      {/* Crosshair in the absolute hottest cells */}
      {temp >= 44 && (
        <>
          <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="#fff" strokeWidth="1" />
          <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="#fff" strokeWidth="1" />
        </>
      )}
    </g>
  );
};

export function HexbinTacticalMap({ peakTemp = 44.2 }: { peakTemp?: number }) {
  // Grid generation
  const width = 800;
  const height = 450;
  const radius = 18; // Hexagon size
  
  const hexWidth = Math.sqrt(3) * radius;
  const hexHeight = 2 * radius;
  const colDistance = hexWidth;
  const rowDistance = (3 / 4) * hexHeight;
  
  const cols = Math.ceil(width / colDistance) + 1;
  const rows = Math.ceil(height / rowDistance) + 1;

  // Heat cores
  const core1 = { x: width * 0.45, y: height * 0.5, temp: peakTemp, radius: 150 };
  const core2 = { x: width * 0.8, y: height * 0.3, temp: peakTemp - 4, radius: 100 };
  const core3 = { x: width * 0.25, y: height * 0.7, temp: peakTemp - 9, radius: 120 };

  const hexes = useMemo(() => {
    const list = [];
    for (let r = -1; r < rows; r++) {
      const offset = (r % 2 === 0) ? 0 : hexWidth / 2;
      for (let c = -1; c < cols; c++) {
        const x = c * colDistance + offset;
        const y = r * rowDistance;

        // Calculate temperature based on distance to cores
        const dist1 = Math.sqrt(Math.pow(x - core1.x, 2) + Math.pow(y - core1.y, 2));
        const dist2 = Math.sqrt(Math.pow(x - core2.x, 2) + Math.pow(y - core2.y, 2));
        const dist3 = Math.sqrt(Math.pow(x - core3.x, 2) + Math.pow(y - core3.y, 2));

        const t1 = core1.temp * Math.exp(-Math.pow(dist1 / core1.radius, 2));
        const t2 = core2.temp * Math.exp(-Math.pow(dist2 / core2.radius, 2));
        const t3 = core3.temp * Math.exp(-Math.pow(dist3 / core3.radius, 2));

        // Base temperature is 28
        let temp = 28 + Math.max(t1, t2, t3);
        
        // Add some perlin-like noise
        temp += Math.sin(x * 0.05) * Math.cos(y * 0.05) * 2;

        const delay = Math.random() * 2; // Random animation delay

        list.push(<Hexagon key={`${r}-${c}`} x={x} y={y} radius={radius - 1.5} temp={temp} delay={delay} />);
      }
    }
    return list;
  }, [rows, cols, hexWidth, colDistance, rowDistance, core1, core2, core3, radius]);

  return (
    <div className="absolute inset-0 top-12 bottom-0 w-full rounded-lg overflow-hidden border border-white/10 bg-[#020617] flex items-center justify-center">
      
      {/* Dynamic Hexbin Grid */}
      <svg className="w-full h-full relative z-0" preserveAspectRatio="xMidYMid slice" viewBox={`0 0 ${width} ${height}`}>
        {/* Background glow for the main core */}
        <radialGradient id="hexCoreGlow" cx="45%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#ea580c" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <rect width="100%" height="100%" fill="url(#hexCoreGlow)" />
        
        {hexes}

        {/* Map Boundaries/Rivers for context (Stylized) */}
        <path d="M 50,450 Q 250,300 400,200 T 800,100" fill="none" stroke="rgba(0, 242, 254, 0.3)" strokeWidth="3" strokeDasharray="10 5" opacity="0.6" />
        
        {/* Targeted Zones Overlays */}
        <g transform={`translate(${core1.x}, ${core1.y})`}>
          <circle cx="0" cy="0" r="100" fill="none" stroke="#e11d48" strokeWidth="1" strokeDasharray="4 8" className="animate-[spin_20s_linear_infinite]" />
          <path d="M -110,0 L -90,0 M 110,0 L 90,0 M 0,-110 L 0,-90 M 0,110 L 0,90" stroke="#e11d48" strokeWidth="2" opacity="0.7" />
        </g>

        <g transform={`translate(${core2.x}, ${core2.y})`}>
          <circle cx="0" cy="0" r="70" fill="none" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 6" className="animate-[spin_15s_linear_infinite]" />
        </g>
      </svg>
      
      {/* CSS Tactical Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)' }}></div>
      <div className="absolute top-0 left-0 w-full h-8 bg-cyan-400/20 blur-xl animate-[ping_4s_linear_infinite] pointer-events-none z-20" style={{ transform: 'translateY(1000%)' }}></div>

      {/* Overlays / Legends */}
      <div className="absolute top-3 left-3 bg-[#020617]/80 backdrop-blur-md p-3 rounded-lg border border-cyan-500/20 text-[10px] font-mono shadow-[0_0_15px_rgba(0,255,255,0.05)] text-cyan-400 space-y-1.5 min-w-[140px]">
        <span className="text-white font-bold block border-b border-cyan-500/20 pb-1 uppercase tracking-wider">Hexbin Topology</span>
        <div className="flex items-center justify-between">
          <span className="text-rose-400 font-bold">Critical</span>
          <span className="w-3 h-3 block bg-rose-600/40 border border-rose-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-orange-400">High</span>
          <span className="w-3 h-3 block bg-orange-600/40 border border-orange-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-yellow-400">Elevated</span>
          <span className="w-3 h-3 block bg-yellow-600/30 border border-yellow-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Normal</span>
          <span className="w-3 h-3 block bg-emerald-600/20 border border-emerald-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></span>
        </div>
      </div>

      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-cyan-500/20 text-[9px] font-mono shadow-[0_0_15px_rgba(0,255,255,0.05)] text-right space-y-1">
        <div className="text-cyan-400">SYSTEM: <span className="text-white">QUANTUM GRID V2</span></div>
        <div className="text-cyan-400">ANALYSIS: <span className="text-rose-400 font-bold animate-pulse">THERMAL SPIKE</span></div>
        <div className="text-cyan-400">RESOLUTION: <span className="text-white">500m / HEX</span></div>
      </div>
    </div>
  );
}
