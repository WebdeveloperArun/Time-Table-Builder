import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";

// ─── THEME (dark + light) ──────────────────────────────────────────────────────
const DARK = {
  bg:"#0f1117",surface:"#171b26",surfaceAlt:"#1e2436",surfaceHover:"#232b40",
  border:"#2a3050",borderLight:"#1e2840",
  accent:"#3b82f6",accentLight:"#60a5fa",accentGlow:"rgba(59,130,246,0.15)",
  teal:"#14b8a6",tealGlow:"rgba(20,184,166,0.15)",
  purple:"#8b5cf6",purpleGlow:"rgba(139,92,246,0.15)",
  warning:"#f59e0b",danger:"#ef4444",success:"#22c55e",
  textPrimary:"#f0f4ff",textSecondary:"#8892b0",textMuted:"#4a5568",
  recess:"#151c2e",recessText:"#4a5568",recessBorder:"#1e2840",
  mergedBg:"rgba(20,184,166,0.12)",mergedBorder:"rgba(20,184,166,0.4)",
  freeBg:"transparent",freeBorder:"transparent",freeText:"#2a3050",
  days:{MON:"#3b82f6",TUE:"#8b5cf6",WED:"#14b8a6",THU:"#f59e0b",FRI:"#ef4444",SAT:"#ec4899",SUN:"#f97316",CUSTOM:"#6b7280"},
  thBg:"#141929",modalBg:"rgba(0,0,0,0.65)",shadowColor:"rgba(0,0,0,0.6)",
  dayStripeAlt:"#1c2130", 
};
const LIGHT = {
  bg:"#e5e7eb",surface:"#ffffff",surfaceAlt:"#f8fafc",surfaceHover:"#f1f5f9",
  border:"#cbd5e1",borderLight:"#e2e8f0",
  accent:"#2563eb",accentLight:"#1d4ed8",accentGlow:"rgba(37,99,235,0.1)",
  teal:"#0d9488",tealGlow:"rgba(13,148,136,0.1)",
  purple:"#7c3aed",purpleGlow:"rgba(124,58,237,0.1)",
  warning:"#d97706",danger:"#dc2626",success:"#16a34a",
  textPrimary:"#0f172a",textSecondary:"#475569",textMuted:"#94a3b8",
  recess:"#f1f5f9",recessText:"#64748b",recessBorder:"#cbd5e1",
  mergedBg:"rgba(13,148,136,0.08)",mergedBorder:"rgba(13,148,136,0.35)",
  freeBg:"transparent",freeBorder:"transparent",freeText:"#cbd5e1",
  days:{MON:"#2563eb",TUE:"#7c3aed",WED:"#0d9488",THU:"#d97706",FRI:"#dc2626",SAT:"#db2777",SUN:"#ea580c",CUSTOM:"#6b7280"},
  thBg:"#f8fafc",modalBg:"rgba(0,0,0,0.4)",shadowColor:"rgba(0,0,0,0.15)",
  dayStripeAlt:"#f4f7fb", 
};

let _theme = DARK;
const getT = () => _theme;

const SUBJ_PALETTE = {
  "C++":"#3b82f6","WEB":"#8b5cf6","OFFICE AUTOMATION":"#14b8a6","PYTHON":"#f59e0b",
  "DBMS":"#ef4444","OS":"#ec4899","AI/ML":"#06b6d4","MATH":"#22c55e","CHEM":"#a78bfa",
  "ENG":"#fb923c","PHYSICS":"#34d399","PPS":"#818cf8","PDP":"#f472b6","MP":"#4ade80",
};
function subjBg(s,T){ const c=SUBJ_PALETTE[s?.toUpperCase?.()?.trim?.()]; return c?c+"22":"transparent"; }
function subjBd(s,T){ const c=SUBJ_PALETTE[s?.toUpperCase?.()?.trim?.()]; return c?c+"55":T.border; }

const PRESET_DAYS  = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const DAY_FULL     = {MON:"MONDAY",TUE:"TUESDAY",WED:"WEDNESDAY",THU:"THURSDAY",FRI:"FRIDAY",SAT:"SATURDAY",SUN:"SUNDAY"};
const PRESET_TIMES = ["8:00-9:00","9:00-10:00","9:15-10:45","10:00-11:00","10:45-12:15","11:00-12:00","12:00-1:00","12:15-1:15","1:00-2:00","1:15-2:45","2:00-3:00","2:45-4:15","3:00-4:00","4:00-5:00"];
const ALL_SUBJECTS = ["C++","WEB","OFFICE AUTOMATION","PYTHON","DBMS","OS","MATH","PHYSICS","ENGLISH","LAB","LECTURE","RECESS","BREAK","DSA","NETWORKS","CLOUD","AI/ML","PDP","ENG","CHEM","PPS","MP"];

const STORAGE_KEY = "ttbl_v5";
const loadSaved   = () => { try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); }catch{ return []; }};
const saveTables  = t  => { try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); }catch{} };
function uid(){ return `r-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }
function makeCell(o={}){ return {subject:"",teacher:"",mode:"normal",mergedWith:[],ignoreConflict:false,...o}; }

// ─── CONFLICT DETECTION ───────────────────────────────────────────────────────
function getConflicts(rows){
  const c=new Set();
  rows.forEach(row=>{
    if(row.isRecess) return;
    const tm={};
    row.cells.forEach((cell,ci)=>{
      if(cell.mode==="free"||cell.mode==="merged"||!cell.teacher?.trim()) return;
      if(cell.mergedWith?.length>0) return; 
      const t=cell.teacher.trim().toUpperCase();
      if(!tm[t]) tm[t]=[];
      tm[t].push({ci,mw:cell.mergedWith||[], cell});
    });
    Object.values(tm).forEach(entries=>{
      if(entries.length<2) return;
      for(let i=0;i<entries.length;i++) for(let j=i+1;j<entries.length;j++){
        const a=entries[i],b=entries[j];
        if(!a.mw.includes(b.ci) && !b.mw.includes(a.ci) && !a.cell.ignoreConflict && !b.cell.ignoreConflict){
          c.add(`${row.id}|${a.ci}`); c.add(`${row.id}|${b.ci}`);
        }
      }
    });
  });
  return c;
}

// ─── DEFAULT GRIDS ────────────────────────────────────────────────────────────
function buildDefaultGrid(groups){
  const times=["9:15-10:45","10:45-12:15","12:15-1:15","1:15-2:45","2:45-4:15"];
  const rows=[];
  PRESET_DAYS.slice(0,5).forEach(day=>{
    times.forEach(time=>{
      const isRecess=time==="12:15-1:15";
      rows.push({id:uid(),day,time,isRecess,cells:groups.map(()=>isRecess?makeCell({subject:"R"}):makeCell())});
    });
  });
  return rows;
}
function buildBBSBECGrid(groups){
  const sc=["C++","WEB","OFFICE AUTOMATION"];
  const tc={"C++":["JLK","SK","GPK"],WEB:["APK","MJK","KJK"],"OFFICE AUTOMATION":["JLK","SK","GPK"]};
  const times=["9:15-10:45","10:45-12:15","12:15-1:15","1:15-2:45","2:45-4:15"];
  const rows=[];
  PRESET_DAYS.slice(0,5).forEach(day=>{
    times.forEach((time,ti)=>{
      const isRecess=time==="12:15-1:15";
      rows.push({id:uid(),day,time,isRecess,cells:groups.map((g,gi)=>
        isRecess?makeCell({subject:"R"}):makeCell({subject:sc[(PRESET_DAYS.slice(0,5).indexOf(day)*2+(ti>2?ti-1:ti)+gi)%3],teacher:(tc[sc[(PRESET_DAYS.slice(0,5).indexOf(day)*2+(ti>2?ti-1:ti)+gi)%3]]||[])[gi]||""})
      )});
    });
  });
  return rows;
}

const TEMPLATES={
  bbsbec:{name:"Departmental Training (BBSBEC)",desc:"5-day · 3 labs · C++/WEB/Office Automation",icon:"🏛️",
    header:{title:"SUMMER INSTITUTIONAL TRAINING TIME TABLE",college:"B.B.S.B.ENGG. COLLEGE FATEHGARH SAHIB",dept:"DEPTT. OF CSE",duration:"DURATION: 3 WEEKS",week:"WEEK-1st"},
    groups:[{lab:"Lab (N 238)",group:"GROUP 4"},{lab:"Lab (N 231)",group:"GROUP 5"},{lab:"Lab (N 228)",group:"GROUP 6"}]},
  standard:{name:"Standard Academic",desc:"Two sections · Period layout",icon:"📚",
    header:{title:"CLASS TIMETABLE",college:"UNIVERSITY NAME",dept:"DEPARTMENT",duration:"SEMESTER: JAN–MAY 2026",week:"WEEK 1"},
    groups:[{lab:"Room A",group:"SECTION A"},{lab:"Room B",group:"SECTION B"}]},
  exam:{name:"Exam Schedule",desc:"Halls · Invigilator layout",icon:"📝",
    header:{title:"EXAMINATION SCHEDULE",college:"UNIVERSITY NAME",dept:"EXAMINATION BRANCH",duration:"MAY 2026",week:"BATCH 2022-26"},
    groups:[{lab:"Hall 1",group:"INVIGILATOR"},{lab:"Hall 2",group:"INVIGILATOR"}]},
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ic={
  Plus:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Save:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Down:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Trash:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  File:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Print:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  X:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Tpl:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Cols:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  Rows:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="9" y1="20" x2="15" y2="20"/></svg>,
  Pencil:()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Up:()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  Dn:()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  Copy:()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Teacher:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Magic:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 4V2m0 14v-2M8 9H2m14 0h-2M4 4l1 1m10 10 1 1M4 20l1-1M19 5l-1 1"/><circle cx="15" cy="9" r="3"/></svg>,
  Clock:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Merge:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 3h-3a2 2 0 0 1-2 2v3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>,
  Free:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  Warn:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Sun:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Undo:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
  Redo:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>,
};

// ─── MODALS ────────────────────────────────────────────────────────────────────
function Modal({onClose,children,width=420,T}){
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:T.modalBg,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:24,width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",boxShadow:`0 24px 64px ${T.shadowColor}`}}>
        {children}
      </div>
    </div>
  );
}
function MH({title,subtitle,onClose,T}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
      <div>
        <div style={{color:T.textPrimary,fontWeight:700,fontSize:15}}>{title}</div>
        {subtitle&&<div style={{color:T.textSecondary,fontSize:11,marginTop:2}}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",padding:2}}><Ic.X/></button>
    </div>
  );
}

// ─── CONTEXT MENU ─────────────────────────────────────────────────────────────
function ContextMenu({x,y,items,onClose,T}){
  const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};
    setTimeout(()=>document.addEventListener("mousedown",h),0);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  return(
    <div ref={ref} style={{position:"fixed",top:Math.min(y,window.innerHeight-280),left:Math.min(x,window.innerWidth-210),background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"4px 0",zIndex:3000,boxShadow:`0 12px 40px ${T.shadowColor}`,minWidth:200}}>
      {items.map((item,i)=>
        item==="sep"
          ?<div key={i} style={{height:1,background:T.border,margin:"3px 0"}}/>
          :<button key={i} onClick={()=>{item.action();onClose();}} disabled={item.disabled}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 14px",background:"transparent",border:"none",color:item.danger?T.danger:item.disabled?T.textMuted:item.warning?T.warning:T.textPrimary,fontSize:12,cursor:item.disabled?"default":"pointer",textAlign:"left"}}
            onMouseEnter={e=>{if(!item.disabled)e.currentTarget.style.background=T.surfaceAlt;}}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{color:item.danger?T.danger:item.accent?T.teal:item.warning?T.warning:item.disabled?T.textMuted:T.textSecondary,display:"flex"}}>{item.icon}</span>
            <span style={{flex:1}}>{item.label}</span>
            {item.badge&&<span style={{fontSize:9,background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:3,padding:"1px 5px",color:T.textMuted}}>{item.badge}</span>}
          </button>
      )}
    </div>
  );
}

// ─── CELL EDITOR ─────────────────────────────────────────────────────────────
function CellEditor({value,onChange,onClose,isRecess,conflictMsg,T}){
  const [subj,setSubj]=useState(value?.subject||"");
  const [teacher,setTeacher]=useState(value?.teacher||"");
  const ref=useRef();
  useEffect(()=>{ref.current?.focus();},[]);
  const is={width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6,color:T.textPrimary,padding:"7px 9px",fontSize:12,boxSizing:"border-box",display:"block"};
  const ls={color:T.textSecondary,fontSize:10,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5};
  return(
    <Modal onClose={onClose} width={320} T={T}>
      <MH title="Edit Cell" onClose={onClose} T={T}/>
      {conflictMsg&&<div style={{background:`${T.danger}18`,border:`1px solid ${T.danger}45`,borderRadius:7,padding:"7px 10px",marginBottom:12,fontSize:11,color:T.danger,display:"flex",gap:6}}><Ic.Warn/>{conflictMsg}</div>}
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

// ─── ROW EDITOR ─────────────────────────────────────────────────────────────
function RowEditor({row,onSave,onClose,T}){
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
      <MH title="Edit Row" subtitle="Change day and time slot" onClose={onClose} T={T}/>
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

// ─── TEMPLATE SELECTOR ───────────────────────────────────────────────────────
function TemplateSelector({onSelect,onClose,T}){
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

// ─── GROUP EDITOR ─────────────────────────────────────────────────────────────
function GroupEditor({groups,onChange,onClose,T}){
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

// ─── ADD ROW MODAL ─────────────────────────────────────────────────────────────
function AddRowModal({groups,onAdd,onClose,T}){
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

// ─── TIME SLOT ENGINE ─────────────────────────────────────────────────────────
function TimeSlotEngine({groups,onGenerate,onClose,T}){
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
          {preview.map((s,i)=>{const isR=s.includes("|R");const label=s.replace("|R","");return<span key={i} style={{background:isR?T.recess:`${T.accent}15`,border:`1px solid ${isR?T.border:T.accent+"40"}`,color:isR?T.recessText:T.accentLight,fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"monospace"}}>{label}{isR?" ☕":""}</span>;})}
        </div>
      </div>
      <div style={{background:`${T.warning}12`,border:`1px solid ${T.warning}30`,borderRadius:7,padding:"7px 10px",marginBottom:14,fontSize:11,color:T.warning}}>⚠ This replaces the current grid. Save first if needed.</div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:12,cursor:"pointer"}}>Cancel</button>
        <button onClick={()=>{
          const newRows=[];
          selDays.forEach(day=>{
            preview.forEach(slot=>{const isR=slot.includes("|R");const time=slot.replace("|R","");newRows.push({id:uid(),day,time,isRecess:isR,cells:groups.map(()=>isR?makeCell({subject:"R"}):makeCell())});});
          });
          onGenerate(newRows);onClose();
        }} style={{padding:"6px 14px",borderRadius:6,border:"none",background:T.teal,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Generate Grid</button>
      </div>
    </Modal>
  );
}

// ─── DAY-BY-DAY BUILDER MODAL ──────────────────────────────────────────────────
function DayBuilderModal({rows,groups,onApply,onClose,T}){
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

  if(!allDays.length) return <Modal onClose={onClose} T={T}><div style={{color:T.textPrimary, padding: 20}}>Please add rows/days to the grid first.</div></Modal>;

  const getCur = () => groupSubs[tab]?.[dayTab] || [];
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  const upd = (id, f, v) => setGroupSubs(p => { 
    const n = deepClone(p); 
    n[tab][dayTab] = n[tab][dayTab].map(e=>e.id===id?{...e,[f]:v}:e); 
    return n;
  });
  const addEntry = () => setGroupSubs(p => { 
    const n = deepClone(p); 
    n[tab][dayTab].push({id:uid(), subject:"", slots:1, teacher:""}); 
    return n;
  });
  const remEntry = (id) => setGroupSubs(p => { 
    const n = deepClone(p); 
    n[tab][dayTab] = n[tab][dayTab].filter(e=>e.id!==id); 
    return n;
  });
  const moveEntry = (idx, dir) => setGroupSubs(p => {
    const n = deepClone(p); 
    const arr = n[tab][dayTab];
    const target = dir==="up" ? idx-1 : idx+1;
    if(target>=0 && target<arr.length){ 
      [arr[idx], arr[target]] = [arr[target], arr[idx]]; 
    }
    return n;
  });
  const copyToAllDays = () => setGroupSubs(p => {
    const n = deepClone(p);
    const src = n[tab][dayTab];
    allDays.forEach(d => { 
      if(d!==dayTab) n[tab][d] = src.map(e=>({...e, id:uid()})); 
    });
    return n;
  });

  const dayRowsCount = rows.filter(r=>r.day===dayTab && !r.isRecess).length;
  const assignedCount = getCur().reduce((s,x)=>s+(parseInt(x.slots)||1), 0);
  const remaining = dayRowsCount - assignedCount;

  function handleApply() {
    const newRows = rows.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
    
    groups.forEach((g, gi) => {
      // Check if user has entered ANY subjects for this specific group across all days
      let hasAnySubject = false;
      allDays.forEach(d => {
         if ((groupSubs[gi][d] || []).some(s => s.subject?.trim())) hasAnySubject = true;
      });
      
      // FIX: If the user didn't configure this group at all, DO NOT overwrite it.
      if (!hasAnySubject) return; 

      allDays.forEach(d => {
        const subs = groupSubs[gi][d] || [];
        const flat = [];
        subs.filter(s=>s.subject?.trim()).forEach(sub => {
          for(let i=0; i<(parseInt(sub.slots)||1); i++) flat.push(sub);
        });
        
        let flatIndex = 0;
        newRows.forEach(r => {
          if(r.day === d && !r.isRecess) {
            if(flatIndex < flat.length) {
              r.cells[gi] = makeCell({ subject: flat[flatIndex].subject, teacher: flat[flatIndex].teacher });
              flatIndex++;
            } else {
              r.cells[gi] = makeCell({ mode: "free" });
            }
          }
        });
      });
    });
    onApply(newRows);
    onClose();
  }

  return(
    <Modal onClose={onClose} width={640} T={T}>
      <MH title="🎯 Day-by-Day Schedule Builder" subtitle="Define the exact sequence of classes. Unfilled slots automatically become FREE." onClose={onClose} T={T}/>
      
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[
          ["GRID SLOTS ON " + dayTab, dayRowsCount, T.textPrimary],
          ["ASSIGNED SLOTS", assignedCount, assignedCount>dayRowsCount?T.danger:T.success],
          ["FREE SLOTS", Math.max(0, remaining), remaining>0?T.teal:T.textMuted]
        ].map(([label,val,col])=>(
          <div key={label} style={{flex:1,background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px"}}>
            <div style={{color:T.textMuted,fontSize:9,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
            <div style={{color:col,fontWeight:700,fontSize:18}}>{val}</div>
          </div>
        ))}
      </div>

      {groups.length>1&&(
        <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
          {groups.map((g,gi)=>(
            <button key={gi} onClick={()=>setTab(gi)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${tab===gi?T.purple:T.border}`,background:tab===gi?T.purpleGlow:"transparent",color:tab===gi?T.purple:T.textSecondary,fontSize:12,fontWeight:tab===gi?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              {g.group}
            </button>
          ))}
        </div>
      )}

      <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap",borderBottom:`1px solid ${T.border}`,paddingBottom:10}}>
        {allDays.map(d=>(
          <button key={d} onClick={()=>setDayTab(d)} style={{padding:"4px 12px",borderRadius:6,border:`1px solid ${dayTab===d?T.accent:T.border}`,background:dayTab===d?T.accentGlow:"transparent",color:dayTab===d?T.accentLight:T.textSecondary,fontSize:11,fontWeight:dayTab===d?600:400,cursor:"pointer"}}>{d}</button>
        ))}
      </div>

      <div style={{background:`${T.teal}10`, border:`1px solid ${T.teal}30`, borderRadius:6, padding:"8px 10px", marginBottom:12, fontSize:11, color:T.teal}}>
         <strong>Tip for separated classes:</strong> Need Math, then Physics, then Math again? Just add them as separate rows and keep the Slots counter at 1.
      </div>

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

          <div style={{display:"flex", gap:2, marginLeft:4}}>
            <button onClick={()=>moveEntry(idx,"up")} disabled={idx===0} style={{background:"transparent",border:"none",color:idx===0?T.border:T.textSecondary,cursor:idx===0?"default":"pointer",padding:3}}><Ic.Up/></button>
            <button onClick={()=>moveEntry(idx,"down")} disabled={idx===getCur().length-1} style={{background:"transparent",border:"none",color:idx===getCur().length-1?T.border:T.textSecondary,cursor:idx===getCur().length-1?"default":"pointer",padding:3}}><Ic.Dn/></button>
            <button onClick={()=>remEntry(entry.id)} style={{background:"transparent",border:`1px solid ${T.danger}35`,color:T.danger,borderRadius:5,padding:"5px 6px",cursor:"pointer"}}><Ic.Trash/></button>
          </div>
        </div>
      ))}

      {assignedCount > dayRowsCount && <div style={{color:T.danger,fontSize:11,marginBottom:8, marginTop:8}}>⚠ You have assigned more slots ({assignedCount}) than there are physical rows on the grid ({dayRowsCount}). The extra subjects will be cut off.</div>}
      
      <div style={{display:"flex",justifyContent:"space-between",marginTop:10, marginBottom:16}}>
         <button onClick={addEntry} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:6,border:`1px solid ${T.teal}40`,background:T.tealGlow,color:T.teal,fontSize:12,cursor:"pointer"}}><Ic.Plus/> Add Subject</button>
         <button onClick={copyToAllDays} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:11,cursor:"pointer"}}><Ic.Copy/> Copy this day to all days</button>
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textSecondary,fontSize:12,cursor:"pointer"}}>Cancel</button>
        <button onClick={handleApply} style={{padding:"6px 14px",borderRadius:6,border:"none",background:T.purple,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>✨ Build Day Sequence</button>
      </div>
    </Modal>
  );
}

// ─── TEACHER VIEW ─────────────────────────────────────────────────────────────
function TeacherView({rows,groups,conflicts,onAutoResolve,onClose,T}){
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
            <button onClick={onClose} style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer"}}><Ic.X/></button>
          </div>
        </div>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:5,flexWrap:"wrap"}}>
          {teachers.map(t=>{const hc=teacherMap[t].some(s=>s.conflict);return<button key={t} onClick={()=>setSel(t)} style={{padding:"3px 9px",borderRadius:5,border:`1px solid ${sel===t?T.accent:T.border}`,background:sel===t?T.accentGlow:"transparent",color:sel===t?T.accentLight:T.textSecondary,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>{t}{hc&&<span style={{color:T.danger,fontSize:9}}>⚠</span>}</button>;})}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {[["Assigned",sched.filter(s=>!s.isRecess).length,T.textPrimary],["Conflicts",sched.filter(s=>s.conflict).length,hasC?T.danger:T.success]].map(([l,v,c])=>(
              <div key={l} style={{flex:1,background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px"}}>
                <div style={{color:T.textMuted,fontSize:10}}>{l}</div>
                <div style={{color:c,fontWeight:700,fontSize:16}}>{v}</div>
              </div>
            ))}
          </div>
          {allDays.map(day=>{const slots=byDay[day]||[];const dc=T.days[day]||T.accent;return(
            <div key={day} style={{marginBottom:12}}>
              <div style={{color:dc,fontWeight:700,fontSize:11,letterSpacing:1,marginBottom:6,display:"flex",alignItems:"center",gap:5}}><div style={{width:3,height:12,background:dc,borderRadius:2}}/>{DAY_FULL[day]||day}{!slots.length&&<span style={{color:T.textMuted,fontWeight:400}}>— free</span>}</div>
              {slots.map((s,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 9px",background:s.conflict?`${T.danger}12`:T.surfaceAlt,border:`1px solid ${s.conflict?T.danger+"40":T.border}`,borderRadius:6,marginBottom:4}}>
                  <span style={{color:T.textMuted,fontSize:10,fontFamily:"monospace",minWidth:75}}>{s.time}</span>
                  <span style={{flex:1,color:T.textPrimary,fontWeight:600,fontSize:11}}>{s.subject}</span>
                  <span style={{color:T.teal,fontSize:10,background:T.tealGlow,border:`1px solid ${T.teal}25`,borderRadius:4,padding:"1px 5px"}}>{s.group}</span>
                  {s.conflict&&<span style={{color:T.danger,fontSize:10,display:"flex",gap:2,alignItems:"center"}}><Ic.Warn/>conflict</span>}
                </div>
              ))}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ─── TIMETABLE GRID ──────────────────────────────────────────────────────────
function TimetableGrid({rows,groups,conflicts,onCellEdit,onRowEdit,onRowDelete,onRowMove,onRowDuplicate,onToggleRecess,onMergeCells,onUnmergeCells,onMarkFree,onUnmarkFree,onCopyToAll,onInsertRowBelow,onToggleIgnoreConflict,T}){
  const [editCell,setEditCell]=useState(null);
  const [editRow,setEditRow]=useState(null);
  const [menu,setMenu]=useState(null);
  const [hoverRow,setHoverRow]=useState(null);

  const daySpans={},dayFirst={};
  rows.forEach((r,i)=>{
    if(!daySpans[r.day])daySpans[r.day]=[];
    daySpans[r.day].push(i);
    if(dayFirst[r.day]===undefined)dayFirst[r.day]=i;
  });

  const uniqueDays=[...new Set(rows.map(r=>r.day))];

  function openCellMenu(e,ri,ci){
    e.preventDefault();
    const row=rows[ri]; if(!row) return;
    const cell=row.cells[ci]; if(!cell) return;
    const isFree=cell.mode==="free";
    const isMerged=cell.mergedWith?.length>0;
    const allGroups=groups.map((_,i)=>i).filter(i=>i!==ci);
    const canMergeNext=!isMerged&&ci<groups.length-1;
    const canMergePrev=!isMerged&&ci>0;

    setMenu({x:e.clientX,y:e.clientY,items:[
      {icon:<Ic.Pencil/>, label:"Edit cell content",          action:()=>setEditCell({ri,ci}),         disabled:row.isRecess||isFree},
      {icon:<Ic.Trash/>,  label:"Clear cell content",         action:()=>onCellEdit(ri, ci, {subject:"", teacher:""}), disabled:row.isRecess||isFree},
      {icon:<Ic.Copy/>,   label:"Copy content → all groups",  action:()=>onCopyToAll(ri,ci),           disabled:row.isRecess||isFree||groups.length<2},
      "sep",
      {icon:<Ic.Merge/>,  label:"Merge with next group →",    action:()=>onMergeCells(ri,ci,[ci+1]),   disabled:!canMergeNext,  accent:true, badge:"shared class"},
      {icon:<Ic.Merge/>,  label:"Merge with prev group ←",    action:()=>onMergeCells(ri,ci,[ci-1]),   disabled:!canMergePrev,  accent:true},
      {icon:<Ic.Merge/>,  label:"Combined class (all groups)",action:()=>onMergeCells(ri,ci,allGroups),disabled:isMerged||groups.length<2,accent:true,badge:"lecture hall"},
      {icon:<Ic.X/>,      label:"Un-merge (split groups)",    action:()=>onUnmergeCells(ri,ci),        disabled:!isMerged},
      "sep",
      {icon:<Ic.Warn/>,   label:cell.ignoreConflict?"Disable conflict override":"Allow teacher in 2 places", action:()=>onToggleIgnoreConflict(ri, ci), warning:!cell.ignoreConflict, disabled:row.isRecess||isFree, badge:"ignore conflict"},
      {icon:<Ic.Free/>,   label:isFree?"✓ Restore class":"✗ No class this slot (free)", action:()=>isFree?onUnmarkFree(ri,ci):onMarkFree(ri,ci)},
      {icon:null,         label:row.isRecess?"Remove recess marker":"Mark row as Recess ☕",            action:()=>onToggleRecess(ri)},
      "sep",
      {icon:<Ic.Pencil/>, label:"Edit row day / time",         action:()=>setEditRow(ri)},
      {icon:<Ic.Copy/>,   label:"Duplicate this row",          action:()=>onRowDuplicate(ri)},
      {icon:<Ic.Rows/>,   label:"Insert blank row below",      action:()=>onInsertRowBelow(ri)},
      {icon:<Ic.Up/>,     label:"Move row up",                 action:()=>onRowMove(ri,"up")},
      {icon:<Ic.Dn/>,     label:"Move row down",               action:()=>onRowMove(ri,"down")},
      "sep",
      {icon:<Ic.Trash/>,  label:"Delete this row",             action:()=>onRowDelete(ri), danger:true},
    ].filter(Boolean)});
  }

  function getConflictMsg(rowId,ci){
    if(!conflicts.has(`${rowId}|${ci}`)) return null;
    const row=rows.find(r=>r.id===rowId);
    if(!row) return null;
    const teacher=row.cells[ci]?.teacher;
    const others=rows.filter(r=>r.id!==rowId&&r.time===row.time&&!r.isRecess)
      .flatMap(r=>r.cells.map((c,i)=>({c,i})))
      .filter(({c,i})=>c.teacher?.trim().toUpperCase()===teacher?.trim().toUpperCase() && !c.ignoreConflict)
      .map(({i})=>groups[i]?.group||`G${i+1}`);
    return `${teacher} also in: ${[...new Set(others)].join(", ")}`;
  }

  const thS=w=>({background:T.thBg,border:`1px solid ${T.border}`,padding:"8px 6px",color:T.textSecondary,fontWeight:600,fontSize:10,letterSpacing:0.5,textTransform:"uppercase",width:w,minWidth:w,textAlign:"center"});
  const tdS={border:`1px solid ${T.border}`,padding:"6px 5px",verticalAlign:"middle"};

  return(
    <>
      {editCell&&<CellEditor value={rows[editCell.ri]?.cells[editCell.ci]} isRecess={rows[editCell.ri]?.isRecess} conflictMsg={getConflictMsg(rows[editCell.ri]?.id,editCell.ci)} onChange={v=>onCellEdit(editCell.ri,editCell.ci,v)} onClose={()=>setEditCell(null)} T={T}/>}
      {editRow!==null&&<RowEditor row={rows[editRow]} onSave={v=>onRowEdit(editRow,v)} onClose={()=>setEditRow(null)} T={T}/>}
      {menu&&<ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={()=>setMenu(null)} T={T}/>}

      <div style={{overflowX:"auto",borderRadius:10,border:`1px solid ${T.border}`,boxShadow:`0 1px 3px ${T.shadowColor}`}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:12,minWidth:600}}>
          <thead>
            <tr>
              <th style={thS(52)}>Day</th>
              <th style={thS(90)}>Time</th>
              {groups.map((g,i)=>(
                <>
                  <th key={`lh${i}`} style={{...thS(130),color:T.teal,borderBottom:`2px solid ${T.teal}60`}}>{g.lab}<br/><span style={{fontWeight:400,color:T.textSecondary,fontSize:9}}>({g.group})</span></th>
                  <th key={`th${i}`} style={{...thS(56),color:T.accent,borderBottom:`2px solid ${T.accent}60`}}>TCHR</th>
                </>
              ))}
              <th style={{...thS(44),color:T.textMuted,fontSize:9}}>···</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row,ri)=>{
              const spans=daySpans[row.day]||[];
              const isFirst=dayFirst[row.day]===ri;
              const isLastOfDay=spans[spans.length-1]===ri;
              const dc=T.days[row.day]||T.accent;
              const isHov=hoverRow===ri;
              
              const dayIndex = uniqueDays.indexOf(row.day);
              const dayBg = dayIndex % 2 === 0 ? "transparent" : T.dayStripeAlt;

              return(
                <tr key={row.id||ri}
                  onMouseEnter={()=>setHoverRow(ri)}
                  onMouseLeave={()=>setHoverRow(null)}
                  style={{background:row.isRecess?T.recess:dayBg,
                    borderBottom:isLastOfDay?`4px solid ${T.border}`:`1px solid ${T.borderLight}`,
                    boxShadow:isLastOfDay?`0 2px 0 0 ${dc}10`:undefined}}>

                  {/* DAY LABEL */}
                  {isFirst&&(
                    <td rowSpan={spans.length}
                      onClick={()=>setEditRow(ri)}
                      title="Click to change day"
                      style={{border:`1px solid ${T.border}`,textAlign:"center",verticalAlign:"middle",
                        background:`${dc}12`,borderLeft:`4px solid ${dc}`,
                        padding:"2px 1px",cursor:"pointer",position:"relative",
                        boxShadow:`inset 0 1px 0 0 ${dc}40`}}>
                      <div style={{writingMode:"vertical-lr",transform:"rotate(180deg)",color:dc,fontWeight:800,fontSize:10,letterSpacing:2}}>
                        {DAY_FULL[row.day]||row.day}
                      </div>
                      <div style={{position:"absolute",bottom:2,right:2,opacity:0.35}}><Ic.Pencil/></div>
                    </td>
                  )}

                  {/* TIME */}
                  <td onClick={()=>setEditRow(ri)} title="Click to edit time"
                    style={{...tdS,color:row.isRecess?T.recessText:T.textSecondary,fontFamily:"monospace",fontSize:10,whiteSpace:"nowrap",cursor:"pointer",position:"relative",background:"transparent"}}>
                    {row.time}
                    <span style={{position:"absolute",top:"50%",right:3,transform:"translateY(-50%)",opacity:isHov?0.5:0,transition:"opacity 0.12s",color:T.accent}}><Ic.Pencil/></span>
                  </td>

                  {/* CELLS */}
                  {row.cells.map((cell,ci)=>{
                    const isFree=cell.mode==="free";
                    const isMerged=cell.mergedWith?.length>0;
                    const hasConflict=conflicts.has(`${row.id}|${ci}`)&&!row.isRecess&&!isMerged;
                    const bg=row.isRecess?T.recess:isFree?T.freeBg:isMerged?T.mergedBg:hasConflict?`${T.danger}20`:subjBg(cell.subject,T);
                    const bd=row.isRecess?T.recessBorder:isMerged?T.mergedBorder:hasConflict?`${T.danger}55`:subjBd(cell.subject,T);
                    return(
                      <>
                        <td key={`s${ci}`}
                          onContextMenu={e=>openCellMenu(e,ri,ci)}
                          onDoubleClick={()=>!row.isRecess&&!isFree&&setEditCell({ri,ci})}
                          onClick={e=>{if(e.detail===1) setTimeout(()=>{if(e.detail===1){}},200);}}
                          title={isFree?"No class this slot — right-click to restore":isMerged?"Shared class (merged) — right-click for options":"Double-click to edit · Right-click for more"}
                          style={{...tdS,background:bg,outline:`1px solid ${bd}`,outlineOffset:-1,
                            color:row.isRecess?T.recessText:isFree?T.freeText:T.textPrimary,
                            fontWeight:row.isRecess||isFree?400:600,cursor:"context-menu",
                            textAlign:"center",position:"relative",fontSize:row.isRecess?10:12,
                            opacity:isFree?0.4:1}}
                          onMouseEnter={e=>{if(!row.isRecess&&!isFree)e.currentTarget.style.filter="brightness(1.08)";}}
                          onMouseLeave={e=>e.currentTarget.style.filter=""}>
                          {row.isRecess?"R":isFree?<span style={{fontSize:9,color:T.textMuted}}>free</span>:
                            isMerged?<span style={{color:T.teal,fontSize:10}}>↔ {cell.subject}</span>:
                            cell.subject||<span style={{color:T.textMuted,fontSize:10}}>—</span>}
                          {hasConflict&&!isFree&&<span style={{position:"absolute",top:2,right:2,color:T.danger}}><Ic.Warn/></span>}
                        </td>
                        <td key={`t${ci}`}
                          onContextMenu={e=>openCellMenu(e,ri,ci)}
                          style={{...tdS,color:row.isRecess||isFree?"transparent":hasConflict?T.danger:isMerged?T.teal:T.accent,fontWeight:500,textAlign:"center",fontSize:10,cursor:"context-menu",background:bg,outline:`1px solid ${bd}`,outlineOffset:-1,opacity:isFree?0.4:1}}>
                          {isMerged?"shared":cell.teacher}
                          {cell.ignoreConflict&&!isFree&&!row.isRecess&&<span style={{position:"absolute",bottom:0,right:2,color:T.warning,fontSize:8,opacity:0.8}} title="Conflict Override Enabled">⚠</span>}
                        </td>
                      </>
                    );
                  })}

                  {/* ROW ACTIONS */}
                  <td style={{...tdS,padding:"3px 4px",background:"transparent"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"center",opacity:isHov?1:0,transition:"opacity 0.12s"}}>
                      <button onClick={()=>onRowMove(ri,"up")} title="Up" style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",padding:"2px",display:"flex"}}><Ic.Up/></button>
                      <button onClick={()=>onRowMove(ri,"down")} title="Down" style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",padding:"2px",display:"flex"}}><Ic.Dn/></button>
                      <button onClick={()=>onRowDelete(ri)} title="Delete" style={{background:"transparent",border:"none",color:T.danger,cursor:"pointer",padding:"2px",display:"flex"}}><Ic.Trash/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({saved,currentId,onOpen,onNew,onDelete,collapsed,T}){
  const [hov,setHov]=useState(null);
  return(
    <aside style={{width:collapsed?0:228,minWidth:collapsed?0:228,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden",transition:"width 0.22s,min-width 0.22s",flexShrink:0}}>
      <div style={{padding:"14px 12px 10px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{width:26,height:26,background:`linear-gradient(135deg,${T.accent},${T.teal})`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>🗓</div>
          <div style={{color:T.textPrimary,fontWeight:700,fontSize:12}}>TimetableOS</div>
        </div>
        <button onClick={onNew} style={{width:"100%",padding:"7px",background:`linear-gradient(135deg,${T.accent},${T.accent}cc)`,border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Ic.Plus/> New Timetable</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 0"}}>
        <div style={{color:T.textMuted,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"4px 10px 5px"}}>Saved</div>
        {saved.length===0&&<div style={{color:T.textMuted,fontSize:11,padding:"6px 10px"}}>No saved timetables</div>}
        {saved.map(s=>(
          <div key={s.id} style={{position:"relative"}} onMouseEnter={()=>setHov(s.id)} onMouseLeave={()=>setHov(null)}>
            <div onClick={()=>onOpen(s.id)} style={{padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,background:currentId===s.id?T.accentGlow:"transparent",borderLeft:currentId===s.id?`2px solid ${T.accent}`:"2px solid transparent"}}
              onMouseEnter={e=>{if(currentId!==s.id)e.currentTarget.style.background=T.surfaceHover;}}
              onMouseLeave={e=>{if(currentId!==s.id)e.currentTarget.style.background="transparent";}}>
              <Ic.File/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:currentId===s.id?T.accentLight:T.textPrimary,fontSize:12,fontWeight:currentId===s.id?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.header?.title||"Untitled"}</div>
                <div style={{color:T.textMuted,fontSize:10}}>{s.header?.week||""}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();onDelete(s.id);}} style={{background:"transparent",border:"none",color:T.danger,cursor:"pointer",opacity:hov===s.id?1:0,padding:2,transition:"opacity 0.12s"}}><Ic.Trash/></button>
            </div>
            {hov===s.id&&(
              <div style={{position:"absolute",left:"calc(100% + 6px)",top:0,width:240,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:10,zIndex:200,boxShadow:`0 8px 32px ${T.shadowColor}`,pointerEvents:"none"}}>
                <div style={{color:T.accentLight,fontWeight:700,fontSize:11,marginBottom:2}}>{s.header?.title}</div>
                {s.header?.dept&&<div style={{color:T.textSecondary,fontSize:10,marginBottom:1}}>{s.header.dept}</div>}
                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:6,marginTop:6}}>
                  {(s.rows||[]).slice(0,5).map((r,i)=>(
                    <div key={i} style={{display:"flex",gap:4,marginBottom:2,fontSize:10}}>
                      <span style={{color:T.days[r.day]||T.accent,fontWeight:600,width:26}}>{r.day}</span>
                      <span style={{color:T.textMuted,width:54}}>{r.time}</span>
                      <span style={{color:T.textSecondary}}>{r.cells?.[0]?.subject||"—"}</span>
                    </div>
                  ))}
                </div>
                <div style={{color:T.textMuted,fontSize:9,marginTop:4}}>{new Date(s.savedAt).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{padding:"8px 10px",borderTop:`1px solid ${T.border}`,fontSize:10,color:T.textMuted,textAlign:"center"}}>Auto-saved locally</div>
    </aside>
  );
}

// ─── HEADER EDITOR ─────────────────────────────────────────────────────────────
function HeaderEditor({header,onChange,T}){
  const [exp,setExp]=useState(false);
  const is={width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6,color:T.textPrimary,padding:"6px 9px",fontSize:12,boxSizing:"border-box",display:"block"};
  const ls={color:T.textSecondary,fontSize:10,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5};
  const opts=[{k:"college",l:"College"},{k:"dept",l:"Department"},{k:"duration",l:"Duration"},{k:"week",l:"Week / Period"}];
  const filled=opts.filter(f=>header[f.k]?.trim()).length;
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:12,marginBottom:10}}>
      <label style={ls}>TITLE <span style={{color:T.danger}}>*</span></label>
      <input value={header.title||""} onChange={e=>onChange({...header,title:e.target.value})} placeholder="e.g. SUMMER INSTITUTIONAL TRAINING TIME TABLE" style={{...is,fontSize:13,fontWeight:600,marginBottom:7}}/>
      <button onClick={()=>setExp(!exp)} style={{background:"transparent",border:"none",color:T.textSecondary,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0}}>
        {exp?<Ic.Up/>:<Ic.Dn/>} {exp?"Hide optional fields":`Optional fields${filled>0?` (${filled} filled)`:""}`}
      </button>
      {exp&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px 10px",marginTop:8}}>
          {opts.map(f=>(
            <div key={f.k}>
              <label style={ls}>{f.l.toUpperCase()}</label>
              <input value={header[f.k]||""} onChange={e=>onChange({...header,[f.k]:e.target.value})} style={is}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderBanner({header,T}){
  return(
    <div style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:9,padding:"11px 16px",marginBottom:10,textAlign:"center"}}>
      <div style={{color:T.textPrimary,fontWeight:800,fontSize:14,letterSpacing:0.3,marginBottom:header.college?3:0}}>{header.title||"Untitled Timetable"}</div>
      {header.college&&<div style={{color:T.accentLight,fontWeight:600,fontSize:12,marginBottom:1}}>{header.college}</div>}
      {header.dept&&<div style={{color:T.textSecondary,fontSize:11,marginBottom:1}}>{header.dept}</div>}
      {(header.duration||header.week)&&(
        <div style={{display:"flex",justifyContent:"center",gap:7,marginTop:5,flexWrap:"wrap"}}>
          {header.duration&&<span style={{background:T.accentGlow,border:`1px solid ${T.accent}35`,borderRadius:5,padding:"2px 8px",fontSize:10,color:T.accentLight}}>{header.duration}</span>}
          {header.week&&<span style={{background:T.tealGlow,border:`1px solid ${T.teal}35`,borderRadius:5,padding:"2px 8px",fontSize:10,color:T.teal}}>{header.week}</span>}
        </div>
      )}
    </div>
  );
}

// ─── PRINT VIEW ─────────────────────────────────────────────────────────────
function PrintView({header,rows,groups,onClose}){
  const dayFirst={},daySpans={};
  rows.forEach((r,i)=>{if(!daySpans[r.day])daySpans[r.day]=[];daySpans[r.day].push(i);if(dayFirst[r.day]===undefined)dayFirst[r.day]=i;});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:2000,overflow:"auto",padding:16}}>
      <div style={{maxWidth:900,margin:"0 auto",background:"#fff",padding:20,borderRadius:8,fontFamily:"Arial,sans-serif"}} id="print-area">
        <div style={{textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,color:"#111",marginBottom:2}}>{header.title}</div>
          {header.college&&<div style={{fontSize:12,fontWeight:600,color:"#333",marginBottom:1}}>{header.college}</div>}
          {header.dept&&<div style={{fontSize:11,color:"#444",marginBottom:1}}>{header.dept}</div>}
          {header.duration&&<div style={{fontSize:10,color:"#555",marginBottom:1}}>{header.duration}</div>}
          {header.week&&<div style={{fontSize:10,fontWeight:600,color:"#222"}}>{header.week}</div>}
        </div>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:10}}>
          <thead>
            <tr style={{background:"#e8ecf3"}}>
              <th style={{border:"1px solid #ccc",padding:"4px 5px",fontWeight:600}}>Day</th>
              <th style={{border:"1px solid #ccc",padding:"4px 5px",fontWeight:600}}>Time</th>
              {groups.map((g,i)=><><th key={`a${i}`} style={{border:"1px solid #ccc",padding:"4px 5px",fontWeight:600}}>{g.lab} ({g.group})</th><th key={`b${i}`} style={{border:"1px solid #ccc",padding:"4px 5px",fontWeight:600}}>Teacher</th></>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row,ri)=>{
              const isFirst=dayFirst[row.day]===ri;
              const spans=daySpans[row.day]||[];
              return(
                <tr key={ri} style={{background:row.isRecess?"#f8f8f8":"#fff"}}>
                  {isFirst&&<td rowSpan={spans.length} style={{border:"1px solid #ddd",textAlign:"center",fontWeight:700,fontSize:8,letterSpacing:1,background:"#e8ecf3",writingMode:"vertical-lr",transform:"rotate(180deg)",width:16}}>{DAY_FULL[row.day]||row.day}</td>}
                  <td style={{border:"1px solid #ddd",padding:"3px 5px",fontSize:9,fontFamily:"monospace"}}>{row.time}</td>
                  {row.cells.map((c,ci)=>(
                    <>
                      <td key={`s${ci}`} style={{border:"1px solid #ddd",padding:"3px 4px",textAlign:"center",fontWeight:c.mode==="free"?400:600,color:c.mode==="free"?"#ccc":"#111"}}>{c.mode==="free"?"—":c.subject}</td>
                      <td key={`t${ci}`} style={{border:"1px solid #ddd",padding:"3px 4px",textAlign:"center",color:"#555"}}>{row.isRecess||c.mode==="free"?"":c.teacher}</td>
                    </>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{maxWidth:900,margin:"10px auto 0",display:"flex",justifyContent:"center",gap:10}}>
        <button onClick={()=>window.print()} style={{padding:"7px 18px",background:"#2563eb",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>Print / Save PDF</button>
        <button onClick={onClose} style={{padding:"7px 18px",background:"rgba(255,255,255,0.15)",color:"#fff",border:"none",borderRadius:7,fontSize:12,cursor:"pointer"}}>Close</button>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [isDark,setIsDark]=useState(true);
  const T=isDark?DARK:LIGHT;
  _theme=T;

  const [saved,setSaved]=useState(()=>loadSaved());
  const [currentId,setCurrentId]=useState(null);
  const [header,setHeader]=useState({title:"MY TIMETABLE"});
  const [groups,setGroups]=useState([{lab:"Room A",group:"GROUP 1"}]);
  const [rows,setRows]=useState(()=>buildDefaultGrid([{lab:"Room A",group:"GROUP 1"}]));

  // --- UNDO / REDO STATE ---
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const saveState = () => {
    setPast(p => [...p, { rows, groups }].slice(-30));
    setFuture([]);
  };

  const handleUndo = () => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setFuture(f => [{ rows, groups }, ...f]);
    setPast(p => p.slice(0, -1));
    setRows(prev.rows);
    setGroups(prev.groups);
  };

  const handleRedo = () => {
    if (!future.length) return;
    const next = future[0];
    setPast(p => [...p, { rows, groups }]);
    setFuture(f => f.slice(1));
    setRows(next.rows);
    setGroups(next.groups);
  };

  const [showTemplate,setShowTemplate]=useState(false);
  const [showGroups,setShowGroups]=useState(false);
  const [showAddRow,setShowAddRow]=useState(false);
  const [showPrint,setShowPrint]=useState(false);
  const [showTimeEngine,setShowTimeEngine]=useState(false);
  const [showDayBuilder,setShowDayBuilder]=useState(false);
  const [showTeachers,setShowTeachers]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const [toast,setToast]=useState(null);

  const conflicts=useMemo(()=>getConflicts(rows),[rows]);

  useEffect(()=>{saveTables(saved);},[saved]);
  function msg(text,type="success"){setToast({text,type});setTimeout(()=>setToast(null),2600);}

  function handleSave(){
    const snap={id:currentId||`tt-${Date.now()}`,header,groups,rows,savedAt:Date.now()};
    setSaved(p=>[snap,...p.filter(s=>s.id!==snap.id)]);
    setCurrentId(snap.id);msg("Saved!");
  }
  function handleOpen(id){
    const s=saved.find(x=>x.id===id);if(!s)return;
    saveState();
    setCurrentId(s.id);setHeader(s.header);setGroups(s.groups);setRows(s.rows);
  }
  function handleDelete(id){setSaved(p=>p.filter(s=>s.id!==id));if(currentId===id)setCurrentId(null);}

  function handleTemplate(key){
    saveState();
    if(key==="blank"){const g=[{lab:"Room A",group:"GROUP 1"}];setHeader({title:"NEW TIMETABLE"});setGroups(g);setRows(buildDefaultGrid(g));}
    else if(key==="bbsbec"){const t=TEMPLATES[key];setHeader(t.header);setGroups(t.groups);setRows(buildBBSBECGrid(t.groups));}
    else{const t=TEMPLATES[key];setHeader(t.header);setGroups(t.groups);setRows(buildDefaultGrid(t.groups));}
    setCurrentId(null);msg("Template loaded!");
  }
  function handleGroupChange(ng){
    saveState();
    setGroups(ng);
    setRows(p=>p.map(r=>({...r,cells:ng.map((_,gi)=>r.cells[gi]||makeCell())})));
    msg("Groups updated!");
  }
  function handleCellEdit(ri,ci,val){
    saveState();
    setRows(p=>{const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));n[ri].cells[ci]={...n[ri].cells[ci],...val};return n;});
  }
  function handleRowEdit(ri,{day,time,isRecess}){
    saveState();
    setRows(p=>{const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));n[ri]={...n[ri],day,time,isRecess};return n;});
  }
  function handleRowDelete(ri){saveState(); setRows(p=>p.filter((_,i)=>i!==ri));msg("Row deleted");}
  function handleRowMove(ri,dir){
    saveState();
    setRows(p=>{const n=[...p];const t=dir==="up"?ri-1:ri+1;if(t<0||t>=n.length)return n;[n[ri],n[t]]=[n[t],n[ri]];return n;});
  }
  function handleRowDuplicate(ri){
    saveState();
    setRows(p=>{const n=[...p];const c={...n[ri],id:uid(),cells:n[ri].cells.map(x=>({...x}))};n.splice(ri+1,0,c);return n;});
    msg("Row duplicated");
  }
  function handleInsertRowBelow(ri){
    saveState();
    setRows(p=>{const n=[...p];const ref=n[ri];n.splice(ri+1,0,{id:uid(),day:ref.day,time:"",isRecess:false,cells:ref.cells.map(()=>makeCell())});return n;});
    msg("Blank row inserted");
  }
  function handleToggleRecess(ri){saveState(); setRows(p=>{const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));n[ri]={...n[ri],isRecess:!n[ri].isRecess};return n;});}
  function handleAutoResolve(){
    saveState();
    setRows(p=>{
      const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));
      const map={};
      n.forEach(row=>{if(row.isRecess)return;row.cells.forEach((cell,ci)=>{if(!cell.teacher?.trim()||cell.mode==="free"||cell.mergedWith?.length)return;const k=`${cell.teacher.trim().toUpperCase()}|${row.time}`;if(!map[k])map[k]=[];map[k].push({rowId:row.id,ci});});});
      Object.values(map).forEach(entries=>{if(entries.length<2)return;entries.slice(1).forEach(e=>{const row=n.find(r=>r.id===e.rowId);if(row)row.cells[e.ci]={...row.cells[e.ci],teacher:""};});});
      return n;
    });
    msg("Conflicts resolved — duplicate teachers cleared");
  }
  function handleAddRow({day,time,isRecess,position}){
    saveState();
    const nr={id:uid(),day,time,isRecess,cells:groups.map(()=>isRecess?makeCell({subject:"R"}):makeCell())};
    setRows(p=>position==="start"?[nr,...p]:[...p,nr]);msg("Row added!");
  }
  function handleMergeCells(ri,ci,targets){
    saveState();
    setRows(p=>{
      const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));
      const src=n[ri].cells[ci];
      n[ri].cells[ci]={...src,mergedWith:[...new Set([...(src.mergedWith||[]),...targets])]};
      targets.forEach(ti=>{if(ti>=0&&ti<n[ri].cells.length)n[ri].cells[ti]={...n[ri].cells[ti],mode:"merged",subject:src.subject,teacher:src.teacher,mergedWith:[ci]};});
      return n;
    });msg("Classes merged — same teacher for selected groups");
  }
  function handleUnmergeCells(ri,ci){
    saveState();
    setRows(p=>{
      const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));
      const src=n[ri].cells[ci];
      const targets=src.mergedWith||[];
      n[ri].cells[ci]={...src,mergedWith:[]};
      targets.forEach(ti=>{if(ti>=0&&ti<n[ri].cells.length)n[ri].cells[ti]={...n[ri].cells[ti],mode:"normal",mergedWith:[]};});
      return n;
    });msg("Un-merged");
  }
  function handleMarkFree(ri,ci){
    saveState();
    setRows(p=>{const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));n[ri].cells[ci]=makeCell({mode:"free"});return n;});
  }
  function handleUnmarkFree(ri,ci){
    saveState();
    setRows(p=>{const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));n[ri].cells[ci]=makeCell();return n;});
  }
  function handleCopyToAll(ri,ci){
    saveState();
    setRows(p=>{const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));const src={...n[ri].cells[ci]};n[ri].cells=n[ri].cells.map(()=>({...src}));return n;});
    msg("Copied to all groups");
  }
  function handleToggleIgnoreConflict(ri, ci){
    saveState();
    setRows(p=>{
      const n=p.map(r=>({...r,cells:r.cells.map(c=>({...c}))}));
      n[ri].cells[ci].ignoreConflict = !n[ri].cells[ci].ignoreConflict;
      return n;
    });
    msg("Conflict override updated");
  }

  function exportExcel(){
    const d=[];
    
    d.push([header.title]);
    if(header.college) d.push([header.college]);
    if(header.dept) d.push([header.dept]);
    if(header.duration) d.push([header.duration]);
    if(header.week) d.push([header.week]);
    d.push([]); 

    const headerRowIdx = d.length;
    const h=["Day","Time"];
    groups.forEach(g=>{h.push(`${g.lab} (${g.group})`);h.push("Teacher");});
    d.push(h);

    const merges = [];
    let currentRowIdx = headerRowIdx + 1;

    merges.push({s: {r:0, c:0}, e: {r:0, c: h.length-1}});

    const dayStart = {}; 
    const daySpans = {}; 

    rows.forEach((r, ri) => {
      const rowData = [r.day, r.time];
      
      if (dayStart[r.day] === undefined) {
         dayStart[r.day] = currentRowIdx;
         daySpans[r.day] = 1;
      } else {
         daySpans[r.day]++;
      }

      if(r.isRecess) {
         rowData.push("RECESS / BREAK");
         for(let i=0; i<groups.length*2 - 1; i++) rowData.push(""); 
         merges.push({s: {r: currentRowIdx, c: 2}, e: {r: currentRowIdx, c: 2 + groups.length*2 - 1}});
      } else {
         const skipCols = new Set();
         r.cells.forEach((c, ci) => {
            if (skipCols.has(ci)) {
               rowData.push(""); 
               rowData.push("");
               return;
            }

            if(c.mode==="free"){
               rowData.push("FREE"); 
               rowData.push("");
            } else {
               rowData.push(c.subject || "");
               rowData.push(c.teacher || "");
            }

            if (c.mergedWith && c.mergedWith.length > 0) {
               const allMergedIndices = [ci, ...c.mergedWith].sort((a,b)=>a-b);
               const minC = allMergedIndices[0];
               const maxC = allMergedIndices[allMergedIndices.length-1];

               if (minC === ci) {
                  merges.push({
                     s: {r: currentRowIdx, c: 2 + minC*2},
                     e: {r: currentRowIdx, c: 2 + maxC*2 + 1}
                  });
                  c.mergedWith.forEach(mi => skipCols.add(mi));
               }
            }
         });
      }
      d.push(rowData);
      currentRowIdx++;
    });

    Object.keys(dayStart).forEach(day => {
       if (daySpans[day] > 1) {
          merges.push({
             s: {r: dayStart[day], c: 0},
             e: {r: dayStart[day] + daySpans[day] - 1, c: 0}
          });
       }
    });

    const ws=XLSX.utils.aoa_to_sheet(d);
    ws["!merges"] = merges;
    ws["!cols"] = [{wch: 12}, {wch: 15}, ...groups.flatMap(() => [{wch: 22}, {wch: 12}])];

    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Timetable");
    XLSX.writeFile(wb,`${(header.title||"timetable").replace(/\s+/g,"_")}.xlsx`);
    msg("Excel downloaded with formatting!");
  }

  const bSec={display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap",background:"transparent",border:`1px solid ${T.border}`,color:T.textSecondary};
  const bPri={...bSec,background:T.accent,border:"none",color:"#fff",fontWeight:600};

  return(
    <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',color:T.textPrimary,overflow:"hidden"}}>
      {showTemplate&&<TemplateSelector onSelect={handleTemplate} onClose={()=>setShowTemplate(false)} T={T}/>}
      {showGroups&&<GroupEditor groups={groups} onChange={handleGroupChange} onClose={()=>setShowGroups(false)} T={T}/>}
      {showAddRow&&<AddRowModal groups={groups} onAdd={handleAddRow} onClose={()=>setShowAddRow(false)} T={T}/>}
      {showPrint&&<PrintView header={header} rows={rows} groups={groups} onClose={()=>setShowPrint(false)}/>}
      {showTimeEngine&&<TimeSlotEngine groups={groups} onGenerate={r=>{saveState(); setRows(r); setCurrentId(null);}} onClose={()=>setShowTimeEngine(false)} T={T}/>}
      {showDayBuilder&&<DayBuilderModal rows={rows} groups={groups} onApply={r=>{saveState(); setRows(r); msg("Day built successfully!");}} onClose={()=>setShowDayBuilder(false)} T={T}/>}
      {showTeachers&&<TeacherView rows={rows} groups={groups} conflicts={conflicts} onAutoResolve={handleAutoResolve} onClose={()=>setShowTeachers(false)} T={T}/>}

      {toast&&<div style={{position:"fixed",bottom:20,right:20,background:toast.type==="success"?T.success:toast.type==="error"?T.danger:T.accent,color:"#fff",padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:500,zIndex:9999,boxShadow:`0 6px 20px ${T.shadowColor}`}}>{toast.text}</div>}

      <Sidebar saved={saved} currentId={currentId} onOpen={handleOpen} onNew={()=>setShowTemplate(true)} onDelete={handleDelete} collapsed={collapsed} T={T}/>

      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* TOPBAR */}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderBottom:`1px solid ${T.border}`,background:T.surface,flexShrink:0,flexWrap:"wrap"}}>
          <button onClick={()=>setCollapsed(!collapsed)} style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",padding:"3px 4px",borderRadius:5}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
          <div style={{flex:1,minWidth:80}}>
            <div style={{color:T.textPrimary,fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{header.title||"Untitled"}{header.week&&<span style={{color:T.textSecondary,fontWeight:400}}> — {header.week}</span>}</div>
          </div>

          <span style={{color:T.textMuted,fontSize:10}}>HISTORY</span>
          <button onClick={handleUndo} disabled={!past.length} style={{...bSec, opacity: !past.length?0.4:1}}><Ic.Undo/> Undo</button>
          <button onClick={handleRedo} disabled={!future.length} style={{...bSec, opacity: !future.length?0.4:1}}><Ic.Redo/> Redo</button>
          <div style={{width:1,height:18,background:T.border}}/>

          <span style={{color:T.textMuted,fontSize:10}}>GRID</span>
          <button onClick={()=>setShowTemplate(true)} style={bSec}><Ic.Tpl/> Templates</button>
          <button onClick={()=>setShowGroups(true)} style={bSec}><Ic.Cols/> Groups</button>
          <button onClick={()=>setShowAddRow(true)} style={bSec}><Ic.Rows/> Add Row</button>
          <div style={{width:1,height:18,background:T.border}}/>
          
          <span style={{color:T.textMuted,fontSize:10}}>SMART</span>
          <button onClick={()=>setShowTimeEngine(true)} style={{...bSec,color:T.teal,borderColor:`${T.teal}40`}}><Ic.Clock/> Time Engine</button>
          <button onClick={()=>setShowDayBuilder(true)} style={{...bSec,color:T.purple,borderColor:`${T.purple}40`}}><Ic.Magic/> Day Builder</button>
          <button onClick={()=>setShowTeachers(true)} style={bSec}><Ic.Teacher/> Teachers{conflicts.size>0&&<span style={{background:T.danger,color:"#fff",borderRadius:3,fontSize:9,padding:"0 3px",marginLeft:2}}>{Math.ceil(conflicts.size/2)}</span>}</button>
          <div style={{width:1,height:18,background:T.border}}/>
          
          <button onClick={handleSave} style={bPri}><Ic.Save/> Save</button>
          <button onClick={exportExcel} style={{...bSec,color:T.success}}><Ic.Down/> Excel</button>
          <button onClick={()=>setShowPrint(true)} style={{...bSec,color:T.warning}}><Ic.Print/> PDF</button>
          <button onClick={()=>setIsDark(!isDark)} title={isDark?"Light mode":"Dark mode"} style={{...bSec,padding:"5px 7px"}}>{isDark?<Ic.Sun/>:<Ic.Moon/>}</button>
        </div>

        {/* WORKSPACE */}
        <div style={{flex:1,overflowY:"auto",padding:12}}>
          <HeaderEditor header={header} onChange={setHeader} T={T}/>
          <HeaderBanner header={header} T={T}/>
          <TimetableGrid
            rows={rows} groups={groups} conflicts={conflicts}
            onCellEdit={handleCellEdit} onRowEdit={handleRowEdit}
            onRowDelete={handleRowDelete} onRowMove={handleRowMove}
            onRowDuplicate={handleRowDuplicate} onToggleRecess={handleToggleRecess}
            onMergeCells={handleMergeCells} onUnmergeCells={handleUnmergeCells}
            onMarkFree={handleMarkFree} onUnmarkFree={handleUnmarkFree}
            onCopyToAll={handleCopyToAll} onInsertRowBelow={handleInsertRowBelow}
            onToggleIgnoreConflict={handleToggleIgnoreConflict} 
            T={T}/>
            
          {/* VISIBLE MERGE HINT ADDED HERE */}
          <div style={{marginTop:16, display:"flex",gap:8, alignItems:"center", background:`${T.accent}15`, border:`1px solid ${T.accent}40`, padding:"10px 14px", borderRadius:8}}>
             <div style={{color:T.accent, fontSize:18}}>💡</div>
             <div style={{color:T.textPrimary, fontSize:12, lineHeight:1.5}}>
                <strong>Pro Tip:</strong> To <strong style={{color:T.accentLight}}>Merge Classes</strong> across multiple groups, mark slots as free, or manually force class overrides, simply <strong>Right-Click any cell</strong> on the grid.
             </div>
          </div>
        </div>
      </main>

      <style>{`
        @media print{body *{visibility:hidden!important}#print-area,#print-area *{visibility:visible!important}#print-area{position:fixed;top:0;left:0;width:100%}}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
        input:focus,select:focus{border-color:${T.accent}!important;outline:none}*{box-sizing:border-box}
      `}</style>
    </div>
  );
}