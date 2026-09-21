const fs = require('fs');

// Ported exactly from src/utils/thermalMath.ts
function calculateHeatIndex(t_c, rh) {
  if (t_c < 26.7) return t_c;
  
  const T = (t_c * 9/5) + 32;
  const RH = rh;
  
  let HI = -42.379 + 2.04901523*T + 10.14333127*RH - 0.22475541*T*RH - 0.00683783*T*T - 0.05481717*RH*RH + 0.00122874*T*T*RH + 0.00085282*T*RH*RH - 0.00000199*T*T*RH*RH;
  
  if (RH < 13 && T >= 80 && T <= 112) {
    HI = HI - ((13-RH)/4) * Math.sqrt((17-Math.abs(T-95))/17);
  } else if (RH > 85 && T >= 80 && T <= 87) {
    HI = HI + ((RH-85)/10) * ((87-T)/5);
  }
  
  return (HI - 32) * 5/9;
}

function calculateWBGT(t_c, rh, wind_ms, solar = 800) {
  const Tw = t_c * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) + 
             Math.atan(t_c + rh) - Math.atan(rh - 1.676331) + 
             0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
  
  const wind = Math.max(wind_ms, 0.5);
  const Tg = t_c + (0.02 * solar) / (1 + wind);
  
  const wbgt = 0.7 * Tw + 0.2 * Tg + 0.1 * t_c;
  return wbgt;
}

const data = JSON.parse(fs.readFileSync('scratch/parity_data.json', 'utf8'));
let mismatches = 0;
const TOLERANCE = 0.5;

for (const row of data) {
    const ts_hi = calculateHeatIndex(row.t, row.h);
    const ts_wbgt = calculateWBGT(row.t, row.h, row.w / 3.6);
    
    if (Math.abs(ts_hi - row.hi) > TOLERANCE) {
        console.log(`HI Mismatch for T=${row.t}, H=${row.h}: Python=${row.hi.toFixed(2)}, TS=${ts_hi.toFixed(2)}`);
        mismatches++;
    }
    
    if (Math.abs(ts_wbgt - row.wbgt) > TOLERANCE) {
        console.log(`WBGT Mismatch for T=${row.t}, H=${row.h}, W=${row.w}: Python=${row.wbgt.toFixed(2)}, TS=${ts_wbgt.toFixed(2)}`);
        mismatches++;
    }
}

if (mismatches === 0) {
    console.log("Parity test PASSED. All HI and WBGT outputs match Python backend within tolerance.");
} else {
    console.log(`Parity test FAILED with ${mismatches} mismatches.`);
}
