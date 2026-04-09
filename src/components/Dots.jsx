export default function Dots() {
  return (
    <div style={{ display:"flex", gap:4, padding:"2px 0" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:6, height:6, borderRadius:"50%",
          background:"rgba(255,255,255,0.4)",
          animation:"bounce 1.2s ease-in-out "+(i*0.2)+"s infinite",
        }}/>
      ))}
    </div>
  );
}
