// Utility functions for calculating human thermal stress metrics in the browser
// This mirrors the Python `core/thermal_stress.py` engine for interactive what-if simulations.

export function calculateHeatIndex(t_c: number, rh: number): number {
  if (t_c < 26.7) return t_c;
  
  // Convert to Fahrenheit for Rothfusz regression
  const T = (t_c * 9/5) + 32;
  const RH = rh;
  
  let HI = -42.379 + 2.04901523*T + 10.14333127*RH - 0.22475541*T*RH - 0.00683783*T*T - 0.05481717*RH*RH + 0.00122874*T*T*RH + 0.00085282*T*RH*RH - 0.00000199*T*T*RH*RH;
  
  if (RH < 13 && T >= 80 && T <= 112) {
    HI = HI - ((13-RH)/4) * Math.sqrt((17-Math.abs(T-95))/17);
  } else if (RH > 85 && T >= 80 && T <= 87) {
    HI = HI + ((RH-85)/10) * ((87-T)/5);
  }
  
  // Back to Celsius
  return (HI - 32) * 5/9;
}

export function calculateWBGT(t_c: number, rh: number, wind_ms: number): number {
  // Simplified Stull (2011) empirical natural wet bulb
  const Tw = t_c * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) + 
             Math.atan(t_c + rh) - Math.atan(rh - 1.676331) + 
             0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
  
  // Approximate Black Globe Temperature based on T_c and standard high solar load
  // If wind increases, globe temperature approaches air temp
  // Simulated high solar (800 W/m2)
  const Tg = t_c + (20.0 * Math.exp(-wind_ms * 0.3));
  
  // WBGT formula (outdoors with solar)
  const wbgt = 0.7 * Tw + 0.2 * Tg + 0.1 * t_c;
  return wbgt;
}

export function determineRiskTier(hi: number, wbgt: number): string {
  if (wbgt >= 32 || hi >= 54) return 'EXTREME';
  if (wbgt >= 29 || hi >= 41) return 'HIGH';
  if (wbgt >= 27 || hi >= 32) return 'MODERATE';
  return 'LOW';
}
