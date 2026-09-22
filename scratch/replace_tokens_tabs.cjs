const fs = require('fs');

function applyTacticalTokens(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Hardcoded hex colors
  content = content.replace(/bg-\[\#0B0D0E\]/g, 'bg-tactical-900');
  content = content.replace(/bg-\[\#14171A\]/g, 'bg-tactical-800');
  content = content.replace(/border-\[\#232A2E\]/g, 'border-tactical-border');
  content = content.replace(/text-\[\#F2F1EC\]/g, 'text-slate-200');
  content = content.replace(/text-\[\#8B9096\]/g, 'text-slate-400');
  content = content.replace(/text-\[\#0F5C5C\]/g, 'text-cyan-500');
  content = content.replace(/bg-\[\#0F5C5C\]/g, 'bg-cyan-950');

  // Slate backgrounds mapped to tactical
  content = content.replace(/bg-slate-950/g, 'bg-tactical-850');
  content = content.replace(/bg-slate-900/g, 'bg-tactical-800');
  content = content.replace(/border-slate-800/g, 'border-tactical-border');

  fs.writeFileSync(filePath, content);
  console.log(`Updated tokens in ${filePath}`);
}

const files = [
  'src/components/tabs/WorkerSafetyTab.tsx',
  'src/components/tabs/SchoolSafetyTab.tsx',
  'src/components/tabs/ResourceAllocationTab.tsx',
  'src/components/tabs/HistoricalReplayTab.tsx',
  'src/components/tabs/DemographicsTab.tsx',
  'src/components/tabs/OverviewTab.tsx',
  'src/components/ModelValidationView.tsx',
  'src/components/HospitalSurgeView.tsx',
  'src/components/CitizenAdvisoryView.tsx'
];

files.forEach(applyTacticalTokens);
