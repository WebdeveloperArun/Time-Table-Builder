import { useState, useEffect, useRef } from "react";
import Modal from "./Modal.jsx";
import { ALL_SUBJECTS } from "../utils/constants.js";
import { Ic } from "./Icons.jsx";

export default function CellEditor({value,onChange,onClose,isRecess,conflictMsg,T}){
  const [subj,setSubj]=useState(value?.subject||"");
  const [teacher,setTeacher]=useState(value?.teacher||"");
  const ref=useRef();
  useEffect(()=>{ref.current?.focus();}, []);
  const is={width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6,color:T.textPrimary,padding:"7px 9px",fontSize:12,boxSizing:"border-box",display:"block"};
  const ls={color:T.textSecondary,fontSize:10,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5};
  return(
    <Modal onClose={onClose} width={320} T={T}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{color:T.textPrimary,fontWeight:700,fontSize:15}}>Edit Cell</div>
          {conflictMsg&&<div style={{color:T.textSecondary,fontSize:11,marginTop:2}}>{conflictMsg}</div>}
        </div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",padding:2,display:"flex"}}><Ic.X/></button>
      </div>
      {conflictMsg&&<div style={{background:`${T.danger}18`,border:`1px solid ${T.danger}45`,borderRadius:7,padding:"7px 10px",marginBottom:12,fontSize:11,color:T.danger,display:"flex",gap:6}}>⚠ {conflictMsg}</div>}
      <label style={ls}>SUBJECT</label>
      <input ref={ref} value={subj} onChange={e=>setSubj(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(onChange({subject:subj,teacher}),onClose())} list="sdl" style={{...is,marginBottom:12}}/>
      <datalist id="sdl">{ALL_SUBJECTS.map(s=><option key={s} value={s}/>)}</datalist>
      {!isRecess&&<><label style={ls}>TEACHER CODE</label><input value={teacher} onChange={e=>setTeacher(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(onChange({subject:subj,teacher}),onClose())} placeholder="e.g. BJS" style={{...is,marginBottom:16}}/></>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:12,cursor:"pointer"}}>Cancel</button>
        <button onClick={()=>{onChange({subject:subj,teacher});onClose();}} style={{padding:"6px 14px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Save</button>
      </div>
    </Modal>
  );
}
