import { useState } from "react";
import Modal from "./Modal.jsx";
import { PRESET_DAYS, PRESET_TIMES } from "../utils/constants.js";
import { Ic } from "./Icons.jsx";

export default function RowEditor({row,onSave,onClose,T}){
  const [day,setDay]=useState(row.day);
  const [customDay,setCustomDay]=useState(PRESET_DAYS.includes(row.day)?"":(row.day||""));
  const [time,setTime]=useState(PRESET_TIMES.includes(row.time)?row.time:"CUSTOM");
  const [customTime,setCustomTime]=useState(PRESET_TIMES.includes(row.time)?"":(row.time||""));
  const [isRecess,setIsRecess]=useState(row.isRecess||false);
  const is={width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6,color:T.textPrimary,padding:"7px 9px",fontSize:12,boxSizing:"border-box",display:"block"};
  const ls={color:T.textSecondary,fontSize:10,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5};
  const fd=day==="CUSTOM"?(customDay||"CUSTOM"):day;
  const ft=time==="CUSTOM"?(customTime||"Custom"):time;
  return(
    <Modal onClose={onClose} width={390} T={T}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{color:T.textPrimary,fontWeight:700,fontSize:15}}>Edit Row</div>
          <div style={{color:T.textSecondary,fontSize:11,marginTop:2}}>Change day and time slot</div>
        </div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",padding:2,display:"flex"}}><Ic.X/></button>
      </div>
      <label style={ls}>DAY</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:day==="CUSTOM"?8:14}}>
        {[...PRESET_DAYS,"CUSTOM"].map(d=>{
          const dc=T.days[d]||T.accent;
          return <button key={d} onClick={()=>setDay(d)} style={{padding:"4px 8px",borderRadius:5,border:`1px solid ${day===d?dc:T.border}`,background:day===d?dc:"transparent",color:day===d?"#fff":T.textSecondary,fontSize:11,fontWeight:600,cursor:"pointer"}}>{d}</button>;
        })}
      </div>
      {day==="CUSTOM"&&<input value={customDay} onChange={e=>setCustomDay(e.target.value)} placeholder="Custom label…" style={{...is,marginBottom:14}}/>}
      <label style={ls}>TIME SLOT</label>
      <select value={time} onChange={e=>setTime(e.target.value)} style={{...is,marginBottom:8}}>{PRESET_TIMES.map(t=><option key={t} value={t}>{t}</option>)}<option value="CUSTOM">Custom…</option></select>
      {time==="CUSTOM"&&<input value={customTime} onChange={e=>setCustomTime(e.target.value)} placeholder="e.g. 9:00-10:30" style={{...is,marginBottom:8}}/>}
      <label style={{...ls,marginTop:6,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
        <input type="checkbox" checked={isRecess} onChange={e=>setIsRecess(e.target.checked)} style={{accentColor:T.teal,width:14,height:14}}/><span>Recess / Break row</span>
      </label>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:12,cursor:"pointer"}}>Cancel</button>
        <button onClick={()=>{onSave({day:fd,time:ft,isRecess});onClose();}} style={{padding:"6px 14px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Apply</button>
      </div>
    </Modal>
  );
}
