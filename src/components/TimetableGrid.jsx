import { useState } from "react";
import { DAY_FULL, subjBg, subjBd } from "../utils/constants.js";
import { Ic } from "./Icons.jsx";
import CellEditor from "./CellEditor.jsx";
import RowEditor from "./RowEditor.jsx";
import ContextMenu from "./ContextMenu.jsx";

export default function TimetableGrid({rows,groups,conflicts,onCellEdit,onRowEdit,onRowDelete,onRowMove,onRowDuplicate,onToggleRecess,onMergeCells,onUnmergeCells,onMarkFree,onUnmarkFree,onCopyToAll,onInsertRowBelow,onToggleIgnoreConflict,T}){
  const [editCell,setEditCell]=useState(null);
  const [editRow,setEditRow]=useState(null);
  const [menu,setMenu]=useState(null);
  const [hoverRow,setHoverRow]=useState(null);
  const daySpans={},dayFirst={};
  rows.forEach((r,i)=>{if(!daySpans[r.day])daySpans[r.day]=[];daySpans[r.day].push(i);if(dayFirst[r.day]===undefined)dayFirst[r.day]=i;});
  const uniqueDays=[...new Set(rows.map(r=>r.day))];
  const getConflictMsg=(rowId,ci)=>{if(!conflicts.has(`${rowId}|${ci}`)) return null;const row=rows.find(r=>r.id===rowId);if(!row) return null;const teacher=row.cells[ci]?.teacher;const others=rows.filter(r=>r.id!==rowId&&r.time===row.time&&!r.isRecess).flatMap(r=>r.cells.map((c,i)=>({c,i}))).filter(({c,i})=>c.teacher?.trim().toUpperCase()===teacher?.trim().toUpperCase()&&!c.ignoreConflict).map(({i})=>groups[i]?.group||`G${i+1}`);return `${teacher} also in: ${[...new Set(others)].join(", ")}`;};

  const thS=w=>({background:T.thBg,border:`1px solid ${T.border}`,padding:"8px 6px",color:T.textSecondary,fontWeight:600,fontSize:10,letterSpacing:0.5,textTransform:"uppercase",width:w,minWidth:w,textAlign:"center"});
  const tdS={border:`1px solid ${T.border}`,padding:"6px 5px",verticalAlign:"middle"};

  const openCellMenu=(e,ri,ci)=>{
    e.preventDefault();
    const row=rows[ri];
    if(!row) return;
    const cell=row.cells[ci];
    if(!cell) return;
    const isFree=cell.mode==="free";
    const isMerged=cell.mergedWith?.length>0;
    const allGroups=groups.map((_,i)=>i).filter(i=>i!==ci);
    const canMergeNext=!isMerged&&ci<groups.length-1;
    const canMergePrev=!isMerged&&ci>0;
    setMenu({x:e.clientX,y:e.clientY,items:[
      {icon:<Ic.Pencil/>,label:"Edit cell content",action:()=>setEditCell({ri,ci}),disabled:row.isRecess||isFree},
      {icon:<Ic.Trash/>,label:"Clear cell content",action:()=>onCellEdit(ri,ci,{subject:"",teacher:""}),disabled:row.isRecess||isFree},
      {icon:<Ic.Copy/>,label:"Copy content → all groups",action:()=>onCopyToAll(ri,ci),disabled:row.isRecess||isFree||groups.length<2},
      "sep",
      {icon:<Ic.Merge/>,label:"Merge with next group →",action:()=>onMergeCells(ri,ci,[ci+1]),disabled:!canMergeNext,accent:true,badge:"shared class"},
      {icon:<Ic.Merge/>,label:"Merge with prev group ←",action:()=>onMergeCells(ri,ci,[ci-1]),disabled:!canMergePrev,accent:true},
      {icon:<Ic.Merge/>,label:"Combined class (all groups)",action:()=>onMergeCells(ri,ci,allGroups),disabled:isMerged||groups.length<2,accent:true,badge:"lecture hall"},
      {icon:<Ic.X/>,label:"Un-merge (split groups)",action:()=>onUnmergeCells(ri,ci),disabled:!isMerged},
      "sep",
      {icon:<Ic.Warn/>,label:cell.ignoreConflict?"Disable conflict override":"Allow teacher in 2 places",action:()=>onToggleIgnoreConflict(ri,ci),warning:!cell.ignoreConflict,disabled:row.isRecess||isFree,badge:"ignore conflict"},
      {icon:<Ic.Free/>,label:isFree?"✓ Restore class":"✗ No class this slot (free)",action:()=>isFree?onUnmarkFree(ri,ci):onMarkFree(ri,ci)},
      {icon:null,label:row.isRecess?"Remove recess marker":"Mark row as Recess ☕",action:()=>onToggleRecess(ri)},
      "sep",
      {icon:<Ic.Pencil/>,label:"Edit row day / time",action:()=>setEditRow(ri)},
      {icon:<Ic.Copy/>,label:"Duplicate this row",action:()=>onRowDuplicate(ri)},
      {icon:<Ic.Rows/>,label:"Insert blank row below",action:()=>onInsertRowBelow(ri)},
      {icon:<Ic.Up/>,label:"Move row up",action:()=>onRowMove(ri,"up")},
      {icon:<Ic.Dn/>,label:"Move row down",action:()=>onRowMove(ri,"down")},
      "sep",
      {icon:<Ic.Trash/>,label:"Delete this row",action:()=>onRowDelete(ri),danger:true},
    ]});
  };

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
              {groups.map((g,i)=>(<><th key={`lh${i}`} style={{...thS(130),color:T.teal,borderBottom:`2px solid ${T.teal}60`}}>{g.lab}<br/><span style={{fontWeight:400,color:T.textSecondary,fontSize:9}}>({g.group})</span></th><th key={`th${i}`} style={{...thS(56),color:T.accent,borderBottom:`2px solid ${T.accent}60`}}>TCHR</th></>))}
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
                <tr key={row.id||ri} onMouseEnter={()=>setHoverRow(ri)} onMouseLeave={()=>setHoverRow(null)} style={{background:row.isRecess?T.recess:dayBg,borderBottom:isLastOfDay?`4px solid ${T.border}`:`1px solid ${T.borderLight}`,boxShadow:isLastOfDay?`0 2px 0 0 ${dc}10`:undefined}}>
                  {isFirst&&<td rowSpan={spans.length} onClick={()=>setEditRow(ri)} title="Click to change day" style={{border:`1px solid ${T.border}`,textAlign:"center",verticalAlign:"middle",background:`${dc}12`,borderLeft:`4px solid ${dc}`,padding:"2px 1px",cursor:"pointer",position:"relative",boxShadow:`inset 0 1px 0 0 ${dc}40`}}><div style={{writingMode:"vertical-lr",transform:"rotate(180deg)",color:dc,fontWeight:800,fontSize:10,letterSpacing:2}}>{DAY_FULL[row.day]||row.day}</div><div style={{position:"absolute",bottom:2,right:2,opacity:0.35}}>✎</div></td>}
                  <td onClick={()=>setEditRow(ri)} title="Click to edit time" style={{...tdS,color:row.isRecess?T.recessText:T.textSecondary,fontFamily:"monospace",fontSize:10,whiteSpace:"nowrap",cursor:"pointer",position:"relative",background:"transparent"}}>{row.time}<span style={{position:"absolute",top:"50%",right:3,transform:"translateY(-50%)",opacity:isHov?0.5:0,transition:"opacity 0.12s",color:T.accent}}>✎</span></td>
                  {row.cells.map((cell,ci)=>{
                    const isFree=cell.mode==="free";
                    const isMerged=cell.mergedWith?.length>0;
                    const hasConflict=conflicts.has(`${row.id}|${ci}`)&&!row.isRecess&&!isMerged;
                    const bg=row.isRecess?T.recess:isFree?T.freeBg:isMerged?T.mergedBg:hasConflict?`${T.danger}20`:subjBg(cell.subject);
                    const bd=row.isRecess?T.recessBorder:isMerged?T.mergedBorder:hasConflict?`${T.danger}55`:subjBd(cell.subject,T);
                    return(
                      <>
                        <td key={`s${ci}`} onContextMenu={e=>openCellMenu(e,ri,ci)} onDoubleClick={()=>!row.isRecess&&!isFree&&setEditCell({ri,ci})} title={isFree?"No class this slot — right-click to restore":isMerged?"Shared class (merged) — right-click for options":"Double-click to edit · Right-click for more"} style={{...tdS,background:bg,outline:`1px solid ${bd}`,outlineOffset:-1,color:row.isRecess?T.recessText:isFree?T.freeText:T.textPrimary,fontWeight:row.isRecess||isFree?400:600,cursor:"context-menu",textAlign:"center",position:"relative",fontSize:row.isRecess?10:12,opacity:isFree?0.4:1}}>{row.isRecess?"R":isFree?<span style={{fontSize:9,color:T.textMuted}}>free</span>:isMerged?<span style={{color:T.teal,fontSize:10}}>↔ {cell.subject}</span>:cell.subject||<span style={{color:T.textMuted,fontSize:10}}>—</span>}{hasConflict&&!isFree&&<span style={{position:"absolute",top:2,right:2,color:T.danger}}>!</span>}</td>
                        <td key={`t${ci}`} onContextMenu={e=>openCellMenu(e,ri,ci)} style={{...tdS,color:row.isRecess||isFree?"transparent":hasConflict?T.danger:isMerged?T.teal:T.accent,fontWeight:500,textAlign:"center",fontSize:10,cursor:"context-menu",background:bg,outline:`1px solid ${bd}`,outlineOffset:-1,opacity:isFree?0.4:1}}>{isMerged?"shared":cell.teacher}{cell.ignoreConflict&&!isFree&&!row.isRecess&&<span style={{position:"absolute",bottom:0,right:2,color:T.warning,fontSize:8,opacity:0.8}} title="Conflict Override Enabled">⚠</span>}</td>
                      </>
                    );
                  })}
                  <td style={{...tdS,padding:"3px 4px",background:"transparent"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"center",opacity:isHov?1:0,transition:"opacity 0.12s"}}>
                      <button onClick={()=>onRowMove(ri,"up")} title="Up" style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",padding:"2px",display:"flex"}}>↑</button>
                      <button onClick={()=>onRowMove(ri,"down")} title="Down" style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",padding:"2px",display:"flex"}}>↓</button>
                      <button onClick={()=>onRowDelete(ri)} title="Delete" style={{background:"transparent",border:"none",color:T.danger,cursor:"pointer",padding:"2px",display:"flex"}}>x</button>
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
