import { useState } from "react";
import { Ic } from "./Icons.jsx";

export default function Sidebar({saved,currentId,onOpen,onNew,onDelete,collapsed,T}){
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
              <button onClick={e=>{e.stopPropagation();onDelete(s.id);}} style={{background:"transparent",border:"none",color:T.danger,cursor:"pointer",opacity:hov===s.id?1:0,padding:2,transition:"opacity 0.12s"}}>x</button>
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
