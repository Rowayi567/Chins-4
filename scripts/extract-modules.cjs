#!/usr/bin/env node
// Extracts REED_IMG from App.jsx -> src/reedimg.js
// and replaces inline constants/components with imports in App.jsx

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const appPath = path.join(ROOT, 'App.jsx');
let src = fs.readFileSync(appPath, 'utf8');

// --- 1. Extract REED_IMG ---
const reedImgMatch = src.match(/const REED_IMG = '(data:image\/[^']+)';/);
if (!reedImgMatch) {
  console.log('REED_IMG not found in App.jsx - skipping extraction');
} else {
  const reedImgValue = reedImgMatch[1];
  const reedimgPath = path.join(ROOT, 'src', 'reedimg.js');
  fs.writeFileSync(reedimgPath, `export const REED_IMG = '${reedImgValue}';\n`);
  console.log(`Wrote src/reedimg.js (${Math.round(reedImgValue.length/1024)}KB)`);

  // Remove the REED_IMG const from App.jsx
  src = src.replace(/const REED_IMG = 'data:image\/[^']+';/, '// REED_IMG imported from src/reedimg.js');
}

// --- 2. Replace const API line and add imports at top ---
const existingImport = src.includes("from './src/constants.js'") || src.includes("from './src/reedimg.js'");
if (!existingImport) {
  // Add imports after the React import line
  const reactImportMatch = src.match(/^(import \{[^}]+\} from 'react';)/m);
  if (reactImportMatch) {
    const insertAfter = reactImportMatch[0];
    const newImports = [
      `import { REED_IMG, C, DM, BLOBS, globalStyles, STATUS_OPTIONS, PHOTO_SEEDS, personPhoto, NEARBY, NEARBY_STATUSES } from './src/constants.js';`,
      `import { supabase } from './src/supabase.js';`,
      `import { callReed, uploadPhoto } from './src/api.js';`,
      `import { REED_PROMPT } from './src/prompt.js';`,
      `import BlobBackground from './src/components/BlobBackground.jsx';`,
      `import { useVoiceReed } from './src/hooks/useVoiceReed.js';`,
      `import ChatInputBar from './src/components/ChatInputBar.jsx';`,
      `import TabIcon from './src/components/TabIcon.jsx';`,
      `import Dots from './src/components/Dots.jsx';`,
      `import ReedAvatar from './src/components/ReedAvatar.jsx';`,
      `import ReedCharacter from './src/components/ReedCharacter.jsx';`,
      `import VoiceNotePlayer from './src/components/VoiceNotePlayer.jsx';`,
      `import ReportBlockMenu from './src/components/ReportBlockMenu.jsx';`,
      `import ReportModal from './src/components/ReportModal.jsx';`,
    ].join('\n');
    src = src.replace(insertAfter, insertAfter + '\n' + newImports);
    console.log('Added imports to App.jsx');
  }
}

// --- 3. Remove now-duplicate inline definitions that were extracted ---
// These were extracted to src/ files - mark them as imported
const toRemove = [
  // supabase client
  { pattern: /const supabase = createClient\([^;]+\);/s, name: 'supabase createClient' },
  // C color object
  { pattern: /const C = \{[\s\S]*?\};(?=\s*\n\s*const DM)/, name: 'C colors object' },
  // DM font
  { pattern: /const DM = "[^"]+";/, name: 'DM const' },
  // BLOBS
  { pattern: /const BLOBS = \[[\s\S]*?\];(?=\s*\n\s*(export|const|function|\/\/))/m, name: 'BLOBS' },
];

// We'll skip aggressive removal for safety and just note what was found
for (const item of toRemove) {
  const match = src.match(item.pattern);
  if (match) {
    console.log(`Found inline ${item.name} - still present (manual cleanup needed)`);
  } else {
    console.log(`${item.name} not found (may already be removed)`);
  }
}

fs.writeFileSync(appPath, src);
console.log('Done. App.jsx updated.');
console.log(`App.jsx size: ${Math.round(fs.statSync(appPath).size / 1024)}KB`);
