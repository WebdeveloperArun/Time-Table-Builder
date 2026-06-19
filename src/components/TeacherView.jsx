import { useState } from "react";
import { DAY_FULL } from "../utils/constants.js";
import { Ic } from "./Icons.jsx";

export default function TeacherView({rows,groups,conflicts,onAutoResolve,onClose,T}){
  const teacherMap={};
  rows.forEach(row=>{row.cells.forEach((cell,ci)=>{if(!cell.teacher?.trim()||cell.mode==="free") return;const t=cell.teacher.trim().toUpperCase();if(!teacherMap[t])teacherMap[t]=[];teacherMap[t].push({day:row.day,time:row.time,subject:cell.subject,group:groups[ci]?.group||`G${ci+1}`,conflict:conflicts.has(`${row.id}|${ci}`)});});});
  const teachers=Object.keys(teacherMap).sort();
  const allDays=[...new Set(rows.map(r=>r.day))];
  const [sel,setSel]=useState(teachers[0]||"");
  const sched=teacherMap[sel]||[];
  const hasC=sched.some(s=>s.conflict);
  const byDay={};allDays.forEach(d=>{byDay[d]=sched.filter(s=>s.day===d);});
  return(
    <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:1000,display:"flex",alignItems:"stretch",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:460,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:T.textPrimary,fontWeight:700,fontSize:14}}>👩‍🏫 Teacher View</div><div style={{color:T.textSecondary,fontSize:11,marginTop:1}}>{teachers.length} teachers · {Math.ceil(conflicts.size/2)} conflicts</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {conflicts.size>0&&<button onClick={()=>{onAutoResolve();onClose();}} style={{padding:"4px 10px",borderRadius:6,border:"none",background:T.danger,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>✨ Auto-Resolve</button>}
            <button onClick={onClose} style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",display:"flex"}}><Ic.X/></button>
          </div>
        </div>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:5,flexWrap:"wrap"}}>
          {teachers.map(t=>{const hc=teacherMap[t].some(s=>s.conflict);return<button key={t} onClick={()=>setSel(t)} style={{padding:"3px 9px",borderRadius:5,border:`1px solid ${sel===t?T.accent:T.border}`,background:sel===t?T.accentGlow:"transparent",color:sel===t?T.accentLight:T.textSecondary,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>{t}{hc&&<span style={{color:T.danger,fontSize:9}}>⚠</span>}</button>;})}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {[["Assigned",sched.filter(s=>!s.isRecess).length,T.textPrimary],["Conflicts",sched.filter(s=>s.conflict).length,hasC?T.danger:T.success]].map(([l,v,c])=>(<div key={l} style={{flex:1,background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px"}}><div style={{color:T.textMuted,fontSize:10}}>{l}</div><div style={{color:c,fontWeight:700,fontSize:16}}>{v}</div></div>))}
          </div>
          {allDays.map(day=>{const slots=byDay[day]||[];const dc=T.days[day]||T.accent;return(
            <div key={day} style={{marginBottom:12}}>
              <div style={{color:dc,fontWeight:700,fontSize:11,letterSpacing:1,marginBottom:6,display:"flex",alignItems:"center",gap:5}}><div style={{width:3,height:12,background:dc,borderRadius:2}}/>{DAY_FULL[day]||day}{!slots.length&&<span style={{color:T.textMuted,fontWeight:400}}>— free</span>}</div>
              {slots.map((s,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 9px",background:s.conflict?`${T.danger}12`:T.surfaceAlt,border:`1px solid ${s.conflict?T.danger+"40":T.border}`,borderRadius:6,marginBottom:4}}>
                  <span style={{color:T.textMuted,fontSize:10,fontFamily:"monospace",minWidth:75}}>{s.time}</span>
                  <span style={{flex:1,color:T.textPrimary,fontWeight:600,fontSize:11}}>{s.subject}</span>
                  <span style={{color:T.teal,fontSize:10,background:T.tealGlow,border:`1px solid ${T.teal}25`,borderRadius:4,padding:"1px 5px"}}>{s.group}</span>
                  {s.conflict&&<span style={{color:T.danger,fontSize:10,display:"flex",gap:2,alignItems:"center"}}>⚠ conflict</span>}
                </div>
              ))}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
