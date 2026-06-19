import { useState, useMemo } from "react";
import Modal from "./Modal.jsx";
import MH from "./ModalHeader.jsx";
import { PRESET_DAYS, PRESET_TIMES } from "../utils/constants.js";
import { makeCell, uid } from "../utils/grid.js";

export default function TimeSlotEngine({groups,onGenerate,onClose,T}){
  const [start,setStart]=useState("9:15");
  const [dur,setDur]=useState(90);
  const [count,setCount]=useState(5);
  const [rAfter,setRAfter]=useState(2);
  const [rDur,setRDur]=useState(60);
  const [selDays,setSelDays]=useState(["MON","TUE","WED","THU","FRI"]);
  const is={width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6,color:T.textPrimary,padding:"7px 9px",fontSize:12,boxSizing:"border-box",display:"block"};
  const ls={color:T.textSecondary,fontSize:10,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5};

  function toMins(t){const m=t.match(/^(\d{1,2}):(\d{2})/);return m?parseInt(m[1])*60+parseInt(m[2]):0;}
  function toTime(m){return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;}

  const preview=useMemo(()=>{
    const slots=[];let cur=toMins(start);
    for(let i=0;i<count;i++){slots.push(`${toTime(cur)}-${toTime(cur+parseInt(dur))}`);cur+=parseInt(dur);if(i+1===parseInt(rAfter)){slots.push(`${toTime(cur)}-${toTime(cur+parseInt(rDur))}|R`);cur+=parseInt(rDur);}}
    return slots;
  },[start,dur,count,rAfter,rDur]);

  return(
    <Modal onClose={onClose} width={480} T={T}>
      <MH title="⏱ Time Slot Engine" subtitle="Generate a full grid skeleton from a base interval" onClose={onClose} T={T}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 14px",marginBottom:16}}>
        <div><label style={ls}>START TIME</label><input value={start} onChange={e=>setStart(e.target.value)} placeholder="9:15" style={is}/></div>
        <div><label style={ls}>SLOT DURATION (MIN)</label><input type="number" min="1" max="300" value={dur} onChange={e=>setDur(e.target.value)} placeholder="e.g. 60" style={is}/></div>
        <div><label style={ls}>SLOTS PER DAY</label><input type="number" min="1" max="12" value={count} onChange={e=>setCount(e.target.value)} style={is}/></div>
        <div><label style={ls}>RECESS AFTER SLOT #</label><input type="number" min="1" max="10" value={rAfter} onChange={e=>setRAfter(e.target.value)} style={is}/></div>
        <div style={{gridColumn:"1/-1"}}><label style={ls}>RECESS DURATION (MIN)</label><input type="number" min="1" max="300" value={rDur} onChange={e=>setRDur(e.target.value)} placeholder="e.g. 45" style={is}/></div>
      </div>
      <label style={ls}>APPLY TO DAYS</label>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
        {PRESET_DAYS.map(d=>{const dc=T.days[d];return<button key={d} onClick={()=>setSelDays(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d])} style={{padding:"4px 8px",borderRadius:5,border:`1px solid ${selDays.includes(d)?dc:T.border}`,background:selDays.includes(d)?dc:"transparent",color:selDays.includes(d)?"#fff":T.textSecondary,fontSize:11,fontWeight:600,cursor:"pointer"}}>{d}</button>;})}
      </div>
      <div style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,padding:10,marginBottom:14}}>
        <div style={{color:T.textMuted,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:8}}>PREVIEW ({preview.length} slots × {selDays.length} days = {preview.length*selDays.length} rows)</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {preview.map((s,i)=>{const isR=s.includes("|R");const label=s.replace("|R", "");return<span key={i} style={{background:isR?T.recess:`${T.accent}15`,border:`1px solid ${isR?T.border:T.accent+"40"}`,color:isR?T.recessText:T.accentLight,fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"monospace"}}>{label}{isR?" ☕":""}</span>;})}
        </div>
      </div>
      <div style={{background:`${T.warning}12`,border:`1px solid ${T.warning}30`,borderRadius:7,padding:"7px 10px",marginBottom:14,fontSize:11,color:T.warning}}>⚠ This replaces the current grid. Save first if needed.</div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:12,cursor:"pointer"}}>Cancel</button>
        <button onClick={() => {
          const newRows = [];
          selDays.forEach(day => {
            preview.forEach(slot => {
              const isR = slot.includes("|R");
              const time = slot.replace("|R", "");
              newRows.push({id:uid(),day,time,isRecess:isR,cells:groups.map(()=>isR?makeCell({subject:"R"}):makeCell())});
            });
          });
          onGenerate(newRows);
          onClose();
        }} style={{padding:"6px 14px",borderRadius:6,border:"none",background:T.teal,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Generate Grid</button>
      </div>
    </Modal>
  );
}
