export default function HeaderBanner({header,T}){
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
