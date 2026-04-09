import { useState, useRef, useEffect } from 'react';
import { C } from '../constants.js';

export default function VoiceNotePlayer({ duration, isMe }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const bars = [3,5,8,6,10,7,9,5,8,4,7,9,6,8,5,10,7,6,8,4,9,6,8,5,7];
  const timerRef = useRef(null);
  const toggle = () => {
    if(playing){ clearInterval(timerRef.current); setPlaying(false); return; }
    setPlaying(true);
    const total=duration*1000, start=Date.now()-(progress/100)*total;
    timerRef.current=setInterval(()=>{ const p=Math.min(100,((Date.now()-start)/total)*100); setProgress(p); if(p>=100){clearInterval(timerRef.current);setPlaying(false);setProgress(0);} },50);
  };
  useEffect(()=>()=>clearInterval(timerRef.current),[]);
  const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
  const activeBg=isMe?"rgba(255,255,255,0.9)":C.accent, inactiveBg=isMe?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.2)";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:20, background:isMe?"rgba(255,255,255,0.15)":C.surface, minWidth:180, maxWidth:240, border:isMe?"none":"1px solid "+(C.border) }}>
      <button onClick={toggle} style={{ width:32, height:32, borderRadius:"50%", background:isMe?"rgba(255,255,255,0.2)":C.accentDim, border:"1px solid "+(isMe?"rgba(255,255,255,0.3)":C.accentGlow), cursor:"pointer", color:isMe?"#fff":C.accent, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{playing?"⏸":"▶"}</button>
      <div style={{ flex:1, display:"flex", alignItems:"center", gap:1.5, height:22 }}>{bars.map((h,i)=><div key={i} style={{ width:2.5, height:h, borderRadius:2, background:i/bars.length<progress/100?activeBg:inactiveBg }}/>)}</div>
      <div style={{ fontSize:10, color:isMe?"rgba(255,255,255,0.7)":C.textDim, flexShrink:0 }}>{playing?fmt(Math.round((progress/100)*duration)):fmt(duration)}</div>
    </div>
  );
}
