import Modal from "./Modal.jsx";
import MH from "./ModalHeader.jsx";
import { TEMPLATES } from "../utils/constants.js";

export default function TemplateSelector({onSelect,onClose,T}){
  return(
    <Modal onClose={onClose} width={560} T={T}>
      <MH title="Choose a Template" subtitle="Pre-built structures to start quickly" onClose={onClose} T={T}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {Object.entries(TEMPLATES).map(([k,t])=>(
          <button key={k} onClick={()=>{onSelect(k);onClose();}} style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:11,padding:14,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.background=T.accentGlow;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.surfaceAlt;}}>
            <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
            <div style={{color:T.textPrimary,fontWeight:600,fontSize:12,marginBottom:3}}>{t.name}</div>
            <div style={{color:T.textSecondary,fontSize:11}}>{t.desc}</div>
          </button>
        ))}
        <button onClick={()=>{onSelect("blank");onClose();}} style={{background:T.surfaceAlt,border:`2px dashed ${T.border}`,borderRadius:11,padding:14,cursor:"pointer",textAlign:"left"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.teal;e.currentTarget.style.background=T.tealGlow;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.surfaceAlt;}}>
          <div style={{fontSize:24,marginBottom:6}}>➕</div>
          <div style={{color:T.textPrimary,fontWeight:600,fontSize:12,marginBottom:3}}>Blank</div>
          <div style={{color:T.textSecondary,fontSize:11}}>Start fresh</div>
        </button>
      </div>
    </Modal>
  );
}
