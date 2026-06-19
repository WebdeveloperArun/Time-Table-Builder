import { useState } from "react";
import Modal from "./Modal.jsx";
import MH from "./ModalHeader.jsx";
import { Ic } from "./Icons.jsx";

export default function GroupEditor({groups,onChange,onClose,T}){
  const [local,setLocal]=useState(groups.map(g=>({...g})));
  const is={width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6,color:T.textPrimary,padding:"7px 9px",fontSize:12,boxSizing:"border-box",display:"block"};
  return(
    <Modal onClose={onClose} width={420} T={T}>
      <MH title="Manage Groups" subtitle="Each group = Lab + Teacher column pair" onClose={onClose} T={T}/>
      {local.map((g,i)=>(
        <div key={i} style={{display:"flex",gap:7,marginBottom:9,alignItems:"center"}}>
          <input value={g.lab} onChange={e=>{const n=[...local];n[i]={...n[i],lab:e.target.value};setLocal(n);}} placeholder="Lab / Room" style={{...is,flex:"1.4"}}/>
          <input value={g.group} onChange={e=>{const n=[...local];n[i]={...n[i],group:e.target.value};setLocal(n);}} placeholder="Group" style={{...is,flex:1}}/>
          <button onClick={()=>local.length>1&&setLocal(local.filter((_,j)=>j!==i))} style={{background:"transparent",border:`1px solid ${T.danger}40`,color:T.danger,borderRadius:6,padding:"6px 7px",cursor:"pointer"}}><Ic.Trash/></button>
        </div>
      ))}
      <button onClick={()=>setLocal([...local,{lab:"Lab",group:`GROUP ${local.length+1}`}])} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:7,fontSize:12,cursor:"pointer",background:T.tealGlow,border:`1px solid ${T.teal}40`,color:T.teal,marginBottom:18}}><Ic.Plus/>Add Group</button>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:12,cursor:"pointer"}}>Cancel</button>
        <button onClick={()=>{onChange(local);onClose();}} style={{padding:"6px 14px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Apply</button>
      </div>
    </Modal>
  );
}
