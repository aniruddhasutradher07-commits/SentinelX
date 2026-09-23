import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

function TerrainGrid({ peakTemp }: { peakTemp: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geomRef = useRef<THREE.PlaneGeometry>(null);

  // Constants for the grid
  const width = 20;
  const height = 20;
  const segments = 40;

  // Store original positions to calculate displacement
  const originalPositions = useMemo(() => {
    const geom = new THREE.PlaneGeometry(width, height, segments, segments);
    const pos = geom.attributes.position.array as Float32Array;
    return new Float32Array(pos);
  }, []);

  useFrame((state) => {
    if (!geomRef.current) return;
    const time = state.clock.getElapsedTime();
    const positions = geomRef.current.attributes.position.array as Float32Array;

    // Hazard core parameters
    const coreX = 0;
    const coreY = 0;
    const maxElevation = peakTemp > 43 ? 4 : peakTemp > 38 ? 2.5 : 1.5;
    
    // Secondary hazard parameter
    const secX = 5;
    const secY = -4;

    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions[i];
      const y = originalPositions[i + 1];

      // Distance from main core
      const distMain = Math.sqrt(Math.pow(x - coreX, 2) + Math.pow(y - coreY, 2));
      // Distance from secondary core
      const distSec = Math.sqrt(Math.pow(x - secX, 2) + Math.pow(y - secY, 2));

      // Gaussian bell curve for elevation (Main Core)
      const elevationMain = maxElevation * Math.exp(-(distMain * distMain) / 8);
      
      // Gaussian bell curve for elevation (Secondary Core)
      const elevationSec = (maxElevation * 0.5) * Math.exp(-(distSec * distSec) / 5);

      // Add continuous wave effect (breathing/pulsing)
      const wave = Math.sin(distMain * 2 - time * 3) * 0.2;
      const baseNoise = Math.sin(x * 1.5 + time) * Math.cos(y * 1.5 + time) * 0.1;

      // Z is the upward axis since PlaneGeometry is on XY plane
      positions[i + 2] = elevationMain + elevationSec + (elevationMain > 0.1 ? wave : 0) + baseNoise;
    }

    geomRef.current.attributes.position.needsUpdate = true;
    geomRef.current.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry ref={geomRef} args={[width, height, segments, segments]} />
      <meshStandardMaterial 
        color="#00ffff" 
        wireframe={true} 
        emissive="#004444"
        emissiveIntensity={0.5}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

function DataPillars() {
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Main Core Pillar */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 8, 8]} />
        <meshBasicMaterial color="#ff3333" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 6.2, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* Secondary Core Pillar */}
      <mesh position={[5, 1, -4]}>
        <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
        <meshBasicMaterial color="#ff9900" transparent opacity={0.6} />
      </mesh>
      <mesh position={[5, 3.2, -4]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#ff9900" />
      </mesh>
    </group>
  );
}

export function HolographicTerrainMap({ peakTemp = 44 }: { peakTemp?: number }) {
  return (
    <div className="absolute inset-0 top-12 bottom-0 w-full rounded-lg overflow-hidden border border-white/10 bg-[#020617]">
      {/* Scanline overlay for that tactical screen feel */}
      <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,255,255,0.2) 2px, rgba(0,255,255,0.2) 4px)' }}></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'radial-gradient(circle at center, transparent 30%, #020617 95%)' }}></div>

      <Canvas camera={{ position: [0, 6, 10], fov: 45 }}>
        <fog attach="fog" args={['#020617', 5, 20]} />
        
        {/* Ambient lighting for the grid */}
        <ambientLight intensity={0.2} />
        
        {/* Intense red light at the main hazard core */}
        <pointLight position={[0, 1, 0]} color="#ff0000" intensity={40} distance={10} />
        <pointLight position={[0, 4, 0]} color="#ff3333" intensity={20} distance={15} />
        
        {/* Orange light at the secondary hazard core */}
        <pointLight position={[5, 1, -4]} color="#ffaa00" intensity={15} distance={8} />

        <TerrainGrid peakTemp={peakTemp} />
        <DataPillars />

        {/* 3D Floating Tactical Text */}
        <Text 
          position={[0, 6.7, 0]} 
          color="#ff3333" 
          fontSize={0.4} 
          anchorX="center" 
          anchorY="middle"
        >
          {`CRITICAL PLUME: ${peakTemp}°C`}
        </Text>
        <Text 
          position={[0, 6.3, 0]} 
          color="#ffffff" 
          fontSize={0.2} 
          anchorX="center" 
          anchorY="middle"
        >
          BHUBANESWAR CORE
        </Text>

        <Text 
          position={[5, 3.7, -4]} 
          color="#ff9900" 
          fontSize={0.3} 
          anchorX="center" 
          anchorY="middle"
        >
          INDUSTRIAL SEC
        </Text>

        <OrbitControls 
          autoRotate 
          autoRotateSpeed={0.5} 
          enableZoom={false} 
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2} // Prevent looking completely from below
          minPolarAngle={Math.PI / 4}   // Prevent looking completely from top down
        />
      </Canvas>

      {/* UI Overlays */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md p-2.5 rounded-lg border border-cyan-500/20 text-[10px] font-mono shadow-[0_0_15px_rgba(0,255,255,0.05)] text-cyan-400 space-y-1">
        <div className="text-white font-bold block border-b border-white/10 pb-1 mb-1 uppercase tracking-wider">Holographic Telemetry</div>
        <div>RENDER: <span className="text-white">WEBGL / THREE.JS</span></div>
        <div>TOPOLOGY: <span className="text-white">DYNAMIC PERLIN</span></div>
        <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-rose-400 font-bold">THERMAL ANOMALY DETECTED</span>
        </div>
      </div>
    </div>
  );
}
