export default function ReedAvatar({ size=32, animal=null }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#4BC1A0,#2d8f70)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.5, flexShrink:0 }}>
      {animal?.emoji||"😊"}
    </div>
  );
}
