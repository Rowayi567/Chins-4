import { useState } from 'react';

export default function ReportBlockMenu({ onClose, targetName, targetId, isAnon=false }) {
  const [done, setDone] = useState(null);
  const [showReasons, setShowReasons] = useState(false);
  const reasons = ["Harassment or bullying","Inappropriate content","Spam","Hate speech","Underage user","Something else"];

  const report = (reason) => {
    const subject = encodeURIComponent("Report: " + (isAnon ? "Anonymous post" : targetName));
    const body = encodeURIComponent("I want to report " + (isAnon ? "an anonymous post" : targetName + " (ID: " + targetId + ")") + ".\n\nReason: " + reason + "\n\nPlease investigate.");
    window.open("mailto:support@chins.app?subject=" + subject + "&body=" + body);
    setDone("report");
  };

  const block = () => {
    setDone("block");
  };

  if(done === "report") return (
    <div style={{ padding:"24px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
      <div style={{ fontFamily:"DM Sans", fontSize:16, fontWeight:700, color:"#fff", marginBottom:8 }}>Report sent</div>
      <div style={{ fontFamily:"DM Sans", fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:20, lineHeight:1.6 }}>Thanks for letting us know. We'll look into it within 24 hours.</div>
      <button onClick={onClose} style={{ padding:"12px 24px", borderRadius:14, background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", fontFamily:"DM Sans", cursor:"pointer" }}>Done</button>
    </div>
  );

  if(done === "block") return (
    <div style={{ padding:"24px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🚫</div>
      <div style={{ fontFamily:"DM Sans", fontSize:16, fontWeight:700, color:"#fff", marginBottom:8 }}>Blocked</div>
      <div style={{ fontFamily:"DM Sans", fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:20, lineHeight:1.6 }}>{isAnon ? "This post" : targetName} has been blocked. You won't see them again.</div>
      <button onClick={onClose} style={{ padding:"12px 24px", borderRadius:14, background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", fontFamily:"DM Sans", cursor:"pointer" }}>Done</button>
    </div>
  );

  if(showReasons) return (
    <div style={{ padding:"20px" }}>
      <div style={{ fontFamily:"DM Sans", fontSize:16, fontWeight:700, color:"#fff", marginBottom:16 }}>Why are you reporting this?</div>
      {reasons.map(r => (
        <button key={r} onClick={()=>report(r)} style={{ width:"100%", padding:"14px 16px", marginBottom:8, borderRadius:14, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", color:"#fff", fontFamily:"DM Sans", fontSize:14, cursor:"pointer", textAlign:"left" }}>{r}</button>
      ))}
      <button onClick={()=>setShowReasons(false)} style={{ width:"100%", padding:"12px", borderRadius:14, background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontFamily:"DM Sans", cursor:"pointer", marginTop:4 }}>Cancel</button>
    </div>
  );

  return (
    <div style={{ padding:"20px" }}>
      <div style={{ fontFamily:"DM Sans", fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>{isAnon ? "Anonymous post" : targetName}</div>
      <div style={{ fontFamily:"DM Sans", fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:20 }}>What would you like to do?</div>
      <button onClick={()=>setShowReasons(true)} style={{ width:"100%", padding:"14px 16px", marginBottom:10, borderRadius:14, background:"rgba(224,82,82,0.1)", border:"1px solid rgba(224,82,82,0.2)", color:"#E05252", fontFamily:"DM Sans", fontSize:14, fontWeight:600, cursor:"pointer", textAlign:"left" }}>🚩 Report {isAnon ? "this post" : targetName}</button>
      {!isAnon && <button onClick={block} style={{ width:"100%", padding:"14px 16px", marginBottom:10, borderRadius:14, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", fontFamily:"DM Sans", fontSize:14, cursor:"pointer", textAlign:"left" }}>🚫 Block {targetName}</button>}
      <button onClick={onClose} style={{ width:"100%", padding:"12px", borderRadius:14, background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontFamily:"DM Sans", cursor:"pointer", marginTop:4 }}>Cancel</button>
    </div>
  );
}
