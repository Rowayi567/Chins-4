import { useState, useRef } from 'react';
import { C, DM } from '../constants.js';

export default function ChatInputBar({ placeholder, value, onChange, onSend, onKeyDown, onVoiceSend, onPhotoSend }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const fileRef = useRef(null);
  const startRec = () => { setRecording(true); setSeconds(0); timerRef.current=setInterval(()=>setSeconds(s=>{ if(s+1>=60){stopRec(s+1);return s+1;}return s+1; }),1000); };
  const stopRec = (s) => { clearInterval(timerRef.current); setRecording(false); const dur=typeof s==="number"?s:seconds; if(dur>0)onVoiceSend(dur); setSeconds(0); };
  const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
  if(recording) return (
    <div style={{ padding:"10px 16px", borderTop:"1px solid "+(C.border), display:"flex", gap:8, alignItems:"center" }}>
      <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(208,86,87,0.1)", borderRadius:24, border:"1px solid rgba(208,86,87,0.3)" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#D05657", animation:"pulse 1s ease-in-out infinite" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:2, flex:1, height:20 }}>{Array.from({length:18},(_,i)=><div key={i} style={{ width:2.5, height:4+Math.sin(i*0.8)*6, borderRadius:2, background:"#D05657", opacity:0.7 }}/>)}</div>
        <div style={{ fontSize:12, color:"#D05657", fontWeight:600 }}>{fmt(seconds)}</div>
      </div>
      <button onClick={()=>stopRec(seconds)} style={{ width:44, height:44, borderRadius:"50%", background:C.accent, border:"none", cursor:"pointer", color:"#fff", fontSize:18 }}>✓</button>
      <button onClick={()=>{clearInterval(timerRef.current);setRecording(false);setSeconds(0);}} style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"1px solid "+(C.border), cursor:"pointer", color:C.textDim, fontSize:16 }}>✕</button>
    </div>
  );
  return (
    <div style={{ padding:"10px 16px", borderTop:"1px solid "+(C.border), display:"flex", gap:8, alignItems:"flex-end" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(f){onPhotoSend(URL.createObjectURL(f));} e.target.value=""; }}/>
      <button onClick={()=>fileRef.current?.click()} style={{ width:40, height:40, borderRadius:"50%", background:"none", border:"1px solid "+(C.border), cursor:"pointer", color:C.textDim, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4"/><circle cx="8" cy="8" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4"/></svg>
      </button>
      <div style={{ flex:1, padding:"10px 14px", background:C.surface, borderRadius:24, border:"1px solid "+(C.border) }}>
        <textarea value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} rows={1} style={{ width:"100%", background:"none", border:"none", color:C.text, fontFamily:DM, fontSize:14, outline:"none", resize:"none", lineHeight:1.4 }}/>
      </div>
      {value.trim()
        ? <button onClick={onSend} style={{ width:40, height:40, borderRadius:"50%", background:C.accent, border:"none", cursor:"pointer", color:"#fff", fontSize:18, flexShrink:0 }}>↑</button>
        : <button onMouseDown={startRec} onTouchStart={startRec} style={{ width:40, height:40, borderRadius:"50%", background:"none", border:"1px solid "+(C.border), cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none"/>
              <path d="M5 10 C5 14.4 8.1 18 12 18 C15.9 18 19 14.4 19 10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="22" x2="16" y2="22" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
      }
    </div>
  );
}
