import { C, DM } from '../constants.js';

export default function ReedCharacter({ mood="idle", size=52, flipped=false }) {
  const anim =
    mood==="idle"        ? "none" :
    mood==="sitting"     ? "none" :
    mood==="excited"     ? "reedBounce 0.45s ease-in-out infinite" :
    mood==="running"     ? "reedRun 0.35s ease-in-out infinite alternate" :
    mood==="celebrating" ? "reedBounce 0.6s ease-in-out infinite" : "none";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", transform:flipped?"scaleX(-1)":"none", userSelect:"none" }}>
      <div style={{ fontSize:size, lineHeight:1, animation:anim, filter:"drop-shadow(0 4px 12px rgba(75,193,160,0.35))" }}>🧍</div>
      <div style={{ fontSize:9, color:C.accent, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:DM, marginTop:3, transform:flipped?"scaleX(-1)":"none" }}>Reed</div>
    </div>
  );
}
