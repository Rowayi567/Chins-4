import ReportBlockMenu from './ReportBlockMenu.jsx';

export default function ReportModal({ onClose, targetName, targetId, isAnon=false }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)" }}/>
      <div style={{ position:"relative", width:"100%", maxWidth:480, background:"#1a2e2a", borderRadius:"24px 24px 0 0", paddingBottom:32, zIndex:1 }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, borderRadius:2, background:"rgba(255,255,255,0.2)", margin:"12px auto 4px" }}/>
        <ReportBlockMenu onClose={onClose} targetName={targetName} targetId={targetId} isAnon={isAnon}/>
      </div>
    </div>
  );
}
