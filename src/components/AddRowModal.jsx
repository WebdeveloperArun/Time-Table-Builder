import { useState } from "react";
import Modal from "./Modal.jsx";
import MH from "./ModalHeader.jsx";
import { PRESET_DAYS, PRESET_TIMES } from "../utils/constants.js";

export default function AddRowModal({groups,onAdd,onClose,T}){
  const [day,setDay]=useState("MON");
  const [customDay,setCustomDay]=useState("");
  const [time,setTime]=useState("9:15-10:45");
  const [customTime,setCustomTime]=useState("");
  const [isRecess,setIsRecess]=useState(false);
  const [pos,setPos]=useState("end");
  const is={width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6,color:T.textPrimary,padding:"7px 9px",fontSize:12,boxSizing:"border-box",display:"block"};
  const ls={color:T.textSecondary,fontSize:10,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5};
  const fd=day==="CUSTOM"?(customDay||"CUSTOM"):day;
  const ft=time==="CUSTOM"?(customTime||"Custom"):time;
  return(
    <Modal onClose={onClose} width={400} T={T}>
      <MH title="Add Row" subtitle="Insert a new time slot" onClose={onClose} T={T}/>
      <label style={ls}>DAY</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:day==="CUSTOM"?8:14}}>
        {[...PRESET_DAYS,"CUSTOM"].map(d=>{const dc=T.days[d]||T.accent;return <button key={d} onClick={()=>setDay(d)} style={{padding:"4px 8px",borderRadius:5,border:`1px solid ${day===d?dc:T.border}`,background:day===d?dc:"transparent",color:day===d?"#fff":T.textSecondary,fontSize:11,fontWeight:600,cursor:"pointer"}}>{d}</button>;})}
      </div>
      {day==="CUSTOM"&&<input value={customDay} onChange={e=>setCustomDay(e.target.value)} placeholder="Custom…" style={{...is,marginBottom:14}}/>}
      <label style={ls}>TIME SLOT</label>
      <select value={time} onChange={e=>setTime(e.target.value)} style={{...is,marginBottom:8}}>{PRESET_TIMES.map(t=><option key={t} value={t}>{t}</option>)}<option value="CUSTOM">Custom…</option></select>
      {time==="CUSTOM"&&<input value={customTime} onChange={e=>setCustomTime(e.target.value)} placeholder="e.g. 9:00-10:30" style={{...is,marginBottom:8}}/>}
      <label style={{...ls,display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginTop:4}}><input type="checkbox" checked={isRecess} onChange={e=>setIsRecess(e.target.checked)} style={{accentColor:T.teal,width:14,height:14}}/><span>Mark as Recess / Break</span></label>
      <label style={{...ls,marginTop:12}}>POSITION</label>
      <select value={pos} onChange={e=>setPos(e.target.value)} style={{...is,marginBottom:18}}><option value="end">At end</option><option value="start">At start</option></select>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:12,cursor:"pointer"}}>Cancel</button>
        <button onClick={()=>{onAdd({day:fd,time:ft,isRecess,pos},groups);onClose();}} style={{padding:"6px 14px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Add</button>
      </div>
    </Modal>
  );
}
