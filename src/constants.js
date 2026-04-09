// REED_IMG: the large base64 image string lives in reedimg.js
// Run `node scripts/extract-reedimg.js` once to generate src/reedimg.js automatically.
// After generating reedimg.js, remove this comment.
export { REED_IMG } from './reedimg.js';

export const C = {
  bg: "#054a43",
  surface: "rgba(255,255,255,0.07)",
  surfaceUp: "rgba(255,255,255,0.11)",
  border: "rgba(255,255,255,0.12)",
  accent: "#4BC1A0",
  accentDim: "rgba(75,193,160,0.15)",
  accentGlow: "rgba(75,193,160,0.3)",
  amber: "#E1814C",
  text: "#FFFFFF",
  textSub: "rgba(255,255,255,0.7)",
  textDim: "rgba(255,255,255,0.4)",
  silverDim: "rgba(255,255,255,0.08)",
};

export const DM = "'DM Sans', sans-serif";

export const PHOTO_SEEDS = { 1:64, 2:91, 3:26, 4:52, 5:48, 6:15, 7:83, 8:39, 9:73, 10:10, 11:58, 12:77 };
export const personPhoto = (id, size=300) => "https://picsum.photos/seed/chins"+(PHOTO_SEEDS[id]||id)+"/"+(size)+"/"+(size);

export const NEARBY = [];

export const NEARBY_STATUSES = {};

export const STATUS_OPTIONS = [
  { id:"running",    emoji:"🏃", label:"Going for a run" },
  { id:"parkrun",    emoji:"🏅", label:"Parkrun tomorrow" },
  { id:"hiking",     emoji:"🥾", label:"Going hiking" },
  { id:"boardgames", emoji:"🎲", label:"Board games tonight" },
  { id:"coffee",     emoji:"☕", label:"Grabbing coffee" },
  { id:"walk",       emoji:"🚶", label:"Long walk" },
  { id:"cycling",    emoji:"🚴", label:"Bike ride" },
  { id:"food",       emoji:"🍜", label:"Getting food" },
  { id:"climbing",   emoji:"🧗", label:"Bouldering session" },
  { id:"music",      emoji:"🎵", label:"Gig or record shopping" },
];

export const BLOBS = [
  { x:22, y:15, r:90,  c:"#FF9A8B", d:0,   dur:9  },
  { x:76, y:10, r:74,  c:"#A8EDEA", d:1.2, dur:11 },
  { x:52, y:32, r:100, c:"#FEE140", d:0.4, dur:8  },
  { x:10, y:50, r:70,  c:"#c084fc", d:2.0, dur:10 },
  { x:86, y:42, r:82,  c:"#84fab0", d:0.8, dur:12 },
  { x:38, y:60, r:94,  c:"#f093fb", d:1.5, dur:9.5},
  { x:68, y:70, r:78,  c:"#4facfe", d:0.2, dur:11 },
  { x:18, y:78, r:86,  c:"#43e97b", d:1.8, dur:10 },
  { x:88, y:76, r:66,  c:"#f7971e", d:0.6, dur:13 },
];

export const globalStyles = `  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');\n  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --sat: env(safe-area-inset-top, 0px); --sab: env(safe-area-inset-bottom, 0px); }\n  body { background: #021a16; }\n  @keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }\n  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }\n  @keyframes tilefloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-7px)} }\n  @keyframes reedBob { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-5px)} }\n  @keyframes reedBounce { 0%{transform:translateY(0px)} 100%{transform:translateY(-10px)} }\n  @keyframes reedRun { 0%{transform:rotate(-8deg) translateY(0)} 100%{transform:rotate(8deg) translateY(-4px)} }\n  @keyframes bubbleIn { from{opacity:0;transform:translateX(-50%) scale(0.85)} to{opacity:1;transform:translateX(-50%) scale(1)} }\n  @keyframes targetPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }\n  @keyframes float3 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-8px)} }\n  @keyframes float4 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-12px)} }\n  @keyframes float5 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-6px)} }\n  @keyframes drift0 { 0%{transform:translate(-50%,-50%) translate(0,0)} 25%{transform:translate(-50%,-50%) translate(18px,-22px)} 50%{transform:translate(-50%,-50%) translate(-10px,-38px)} 75%{transform:translate(-50%,-50%) translate(-28px,-14px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift1 { 0%{transform:translate(-50%,-50%) translate(0,0)} 30%{transform:translate(-50%,-50%) translate(-22px,16px)} 60%{transform:translate(-50%,-50%) translate(14px,30px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift2 { 0%{transform:translate(-50%,-50%) translate(0,0)} 20%{transform:translate(-50%,-50%) translate(28px,12px)} 55%{transform:translate(-50%,-50%) translate(8px,-24px)} 80%{transform:translate(-50%,-50%) translate(-18px,-8px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift3 { 0%{transform:translate(-50%,-50%) translate(0,0)} 35%{transform:translate(-50%,-50%) translate(20px,-18px)} 70%{transform:translate(-50%,-50%) translate(-12px,-30px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift4 { 0%{transform:translate(-50%,-50%) translate(0,0)} 25%{transform:translate(-50%,-50%) translate(-24px,-20px)} 50%{transform:translate(-50%,-50%) translate(-36px,10px)} 75%{transform:translate(-50%,-50%) translate(-16px,26px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift5 { 0%{transform:translate(-50%,-50%) translate(0,0)} 40%{transform:translate(-50%,-50%) translate(22px,20px)} 70%{transform:translate(-50%,-50%) translate(10px,-16px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift6 { 0%{transform:translate(-50%,-50%) translate(0,0)} 30%{transform:translate(-50%,-50%) translate(-18px,24px)} 65%{transform:translate(-50%,-50%) translate(16px,32px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift7 { 0%{transform:translate(-50%,-50%) translate(0,0)} 20%{transform:translate(-50%,-50%) translate(26px,-14px)} 50%{transform:translate(-50%,-50%) translate(38px,8px)} 80%{transform:translate(-50%,-50%) translate(12px,22px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift8 { 0%{transform:translate(-50%,-50%) translate(0,0)} 45%{transform:translate(-50%,-50%) translate(-20px,-28px)} 75%{transform:translate(-50%,-50%) translate(10px,-18px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  ::-webkit-scrollbar { display: none; }\n  input, textarea, button { font-family: 'DM Sans', sans-serif; }`;
