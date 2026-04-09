import { BLOBS } from '../constants.js';

export default function BlobBackground({ overlayStrength = "0.72" }) {
  return (
    <>
      {BLOBS.map((b, i) => (
        <div key={i} style={{
          position:"absolute", left:(b.x)+"%", top:(b.y)+"%",
          width:b.r*2, height:b.r*2, borderRadius:"50%",
          background:b.c, opacity:0.58, filter:"blur(38px)",
          animation:"drift"+(i)+" "+(b.dur)+"s ease-in-out "+(b.d)+"s infinite",
          willChange:"transform", pointerEvents:"none",
        }}/>
      ))}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:"linear-gradient(to bottom, rgba(2,26,22,0.05) 0%, rgba(2,26,22,0.2) 28%, rgba(2,26,22,"+(overlayStrength)+") 52%, rgba(2,26,22,0.97) 70%)",
      }}/>
    </>
  );
}
