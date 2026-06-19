import { useState } from "react";
import Modal from "./Modal.jsx";
import MH from "./ModalHeader.jsx";
import { PRESET_DAYS, DAY_FULL, ALL_SUBJECTS } from "../utils/constants.js";
import { uid, makeCell } from "../utils/grid.js";

export default function DayBuilderModal({rows,groups,onApply,onClose,T}){
  const allDays=[...new Set(rows.filter(r=>!r.isRecess).map(r=>r.day))];
  const [groupSubs,setGroupSubs]=useState(()=>{
    return groups.map(()=> {
      const dMap = {};
      allDays.forEach(d => dMap[d] = [{id:uid(), subject:"", slots:1, teacher:""}]);
      return dMap;
    });
  });
  const [tab,setTab]=useState(0);
  const [dayTab, setDayTab]=useState(allDays[0] || "");
  const is={width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6,color:T.textPrimary,padding:"6px 8px",fontSize:12,boxSizing:"border-box",display:"block"};
  const ls={color:T.textSecondary,fontSize:10,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5};

  if(!allDays.length) return <Modal onClose={onClose} T={T}><div style={{color:T.textPrimary,padding:20}}>Please add rows/days to the grid first.</div></Modal>;

  const getCur = () => groupSubs[tab]?.[dayTab] || [];
  const deepClone = obj => JSON.parse(JSON.stringify(obj));
  const upd = (id,f,v)=>setGroupSubs(p=>{const n=deepClone(p);n[tab][dayTab]=n[tab][dayTab].map(e=>e.id===id?{...e,[f]:v}:e);return n;});
  const addEntry = ()=>setGroupSubs(p=>{const n=deepClone(p);n[tab][dayTab].push({id:uid(),subject:"",slots:1,teacher:""});return n;});
  const remEntry = id=>setGroupSubs(p=>{const n=deepClone(p);n[tab][dayTab]=n[tab][dayTab].filter(e=>e.id!==id);return n;});
  const moveEntry = (idx,dir)=>setGroupSubs(p=>{const n=deepClone(p);const arr=n[tab][dayTab];const target=dir==="up"?idx-1:idx+1;if(target>=0&&target<arr.length){[arr[idx],arr[target]]=[arr[target],arr[idx]];}return n;});
  const copyToAllDays = ()=>setGroupSubs(p=>{const n=deepClone(p);const src=n[tab][dayTab];allDays.forEach(d=>{if(d!==dayTab) n[tab][d]=src.map(e=>({...e,id:uid()}));});return n;});

  const dayRowsCount = rows.filter(r=>r.day===dayTab && !r.isRecess).length;
  const assignedCount = getCur().reduce((s,x)=>s+(parseInt(x.slots)||1),0);
  const remaining = dayRowsCount - assignedCount;

  function handleApply(){
    const newRows = rows.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
    groups.forEach((g, gi) => {
      let hasAnySubject=false;
      allDays.forEach(d=>{if((groupSubs[gi][d]||[]).some(s=>s.subject?.trim())) hasAnySubject=true;});
      if(!hasAnySubject) return;
      allDays.forEach(d=>{
        const subs=(groupSubs[gi][d]||[]).filter(s=>s.subject?.trim());
        const flat=[];
        subs.forEach(sub=>{for(let i=0;i<(parseInt(sub.slots)||1);i++) flat.push(sub);});
        let flatIndex=0;
        newRows.forEach(r=>{
          if(r.day===d && !r.isRecess){
            if(flatIndex<flat.length){r.cells[gi]=makeCell({subject:flat[flatIndex].subject,teacher:flat[flatIndex].teacher});flatIndex++;}
            else{r.cells[gi]=makeCell({mode:"free"});}
          }
        });
      });
    });
    onApply(newRows);
    onClose();
  }

  return(
    <Modal onClose={onClose} width={640} T={T}>
      <MH title="+ Day-by-Day Schedule Builder" subtitle="Define the exact sequence of classes. Unfilled slots automatically become FREE." onClose={onClose} T={T}/>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["GRID SLOTS ON " + dayTab, dayRowsCount, T.textPrimary],["ASSIGNED SLOTS",assignedCount,assignedCount>dayRowsCount?T.danger:T.success],["FREE SLOTS",Math.max(0,remaining),remaining>0?T.teal:T.textMuted]].map(([label,val,col])=>(
          <div key={label} style={{flex:1,background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px"}}>
            <div style={{color:T.textMuted,fontSize:9,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
            <div style={{color:col,fontWeight:700,fontSize:18}}>{val}</div>
          </div>
        ))}
      </div>
      {groups.length>1&&(
        <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
          {groups.map((g,gi)=>(
            <button key={gi} onClick={()=>setTab(gi)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${tab===gi?T.purple:T.border}`,background:tab===gi?T.purpleGlow:"transparent",color:tab===gi?T.purple:T.textSecondary,fontSize:12,fontWeight:tab===gi?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>{g.group}</button>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap",borderBottom:`1px solid ${T.border}`,paddingBottom:10}}>
        {allDays.map(d=><button key={d} onClick={()=>setDayTab(d)} style={{padding:"4px 12px",borderRadius:6,border:`1px solid ${dayTab===d?T.accent:T.border}`,background:dayTab===d?T.accentGlow:"transparent",color:dayTab===d?T.accentLight:T.textSecondary,fontSize:11,fontWeight:dayTab===d?600:400,cursor:"pointer"}}>{d}</button>)}
      </div>
      <div style={{background:`${T.teal}10`,border:`1px solid ${T.teal}30`,borderRadius:6,padding:"8px 10px",marginBottom:12,fontSize:11,color:T.teal}}><strong>Tip for separated classes:</strong> Need Math, then Physics, then Math again? Just add them as separate rows and keep the Slots counter at 1.</div>
      <div style={{display:"flex",gap:4,marginBottom:5,paddingRight:80}}>
        <div style={{flex:2,color:T.textMuted,fontSize:9,textTransform:"uppercase"}}>Chronological Sequence (Subject)</div>
        <div style={{flex:"0 0 60px",color:T.textMuted,fontSize:9,textTransform:"uppercase",textAlign:"center"}}>Slots</div>
        <div style={{flex:1.5,color:T.textMuted,fontSize:9,textTransform:"uppercase"}}>Teacher</div>
      </div>
      {getCur().map((entry, idx)=>(
        <div key={entry.id} style={{display:"flex",gap:5,marginBottom:6,alignItems:"center"}}>
          <input value={entry.subject} onChange={e=>upd(entry.id,"subject",e.target.value)} list="sdl2" placeholder="e.g. MATH(L) or CHEM(P)" style={{...is,flex:2}}/>
          <datalist id="sdl2">{ALL_SUBJECTS.map(x=><option key={x} value={x}/>)}</datalist>
          <input type="number" min="1" max="10" value={entry.slots} onChange={e=>upd(entry.id,"slots",Math.max(1,parseInt(e.target.value)||1))} style={{...is,flex:"0 0 60px",textAlign:"center"}} title="How many consecutive periods?"/>
          <input value={entry.teacher} onChange={e=>upd(entry.id,"teacher",e.target.value)} placeholder="TCHR" style={{...is,flex:1.5}}/>
          <div style={{display:"flex",gap:2,marginLeft:4}}>
            <button onClick={()=>moveEntry(idx,"up")} disabled={idx===0} style={{background:"transparent",border:"none",color:idx===0?T.border:T.textSecondary,cursor:idx===0?"default":"pointer",padding:3}}>&uarr;</button>
            <button onClick={()=>moveEntry(idx,"down")} disabled={idx===getCur().length-1} style={{background:"transparent",border:"none",color:idx===getCur().length-1?T.border:T.textSecondary,cursor:idx===getCur().length-1?"default":"pointer",padding:3}}>&darr;</button>
            <button onClick={()=>remEntry(entry.id)} style={{background:"transparent",border:`1px solid ${T.danger}35`,color:T.danger,borderRadius:5,padding:"5px 6px",cursor:"pointer"}}>x</button>
          </div>
        </div>
      ))}
      {assignedCount > dayRowsCount && <div style={{color:T.danger,fontSize:11,marginBottom:8,marginTop:8}}>⚠ You have assigned more slots ({assignedCount}) than there are physical rows on the grid ({dayRowsCount}). The extra subjects will be cut off.</div>}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:10,marginBottom:16}}>
        <button onClick={addEntry} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:6,border:`1px solid ${T.teal}40`,background:T.tealGlow,color:T.teal,fontSize:12,cursor:"pointer"}}>+ Add Subject</button>
        <button onClick={copyToAllDays} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:11,cursor:"pointer"}}>+ Copy this day to all days</button>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:12,cursor:"pointer"}}>Cancel</button>
        <button onClick={handleApply} style={{padding:"6px 14px",borderRadius:6,border:"none",background:T.purple,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>✨ Build Day Sequence</button>
      </div>
    </Modal>
  );
}
