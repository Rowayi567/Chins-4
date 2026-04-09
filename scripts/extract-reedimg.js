/**
 * Run this script once with: node scripts/extract-reedimg.js
 * It reads the REED_IMG base64 line from App.jsx and writes src/reedimg.js
 */
const fs = require('fs');
const path = require('path');

const appJsx = path.join(__dirname, '..', 'App.jsx');
const outFile = path.join(__dirname, '..', 'src', 'reedimg.js');

console.log('Reading App.jsx...');
const content = fs.readFileSync(appJsx, 'utf8');
const lines = content.split('\n');

// REED_IMG is on line 4 (index 3)
const reedLine = lines[3];

if (!reedLine || !reedLine.startsWith('const REED_IMG')) {
  console.error('ERROR: Could not find REED_IMG on line 4. Check App.jsx structure.');
  process.exit(1);
}

const output = reedLine + '\nexport { REED_IMG };\n';
fs.writeFileSync(outFile, output);
console.log('Written to src/reedimg.js (' + Math.round(output.length / 1024) + ' KB)');
