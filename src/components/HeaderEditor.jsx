import { useState } from "react";

export default function HeaderEditor({header,onChange,T}){
  const [exp,setExp]=useState(false);
  const is={width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6,color:T.textPrimary,padding:"6px 9px",fontSize:12,boxSizing:"border-box",display:"block"};
  const ls={color:T.textSecondary,fontSize:10,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5};
  const opts=[{k:"college",l:"College"},{k:"dept",l:"Department"},{k:"duration",l:"Duration"},{k:"week",l:"Week / Period"}];
  const filled=opts.filter(f=>header[f.k]?.trim()).length;
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:12,marginBottom:10}}>
      <label style={ls}>TITLE <span style={{color:T.danger}}>*</span></label>
      <input value={header.title||""} onChange={e=>onChange({...header,title:e.target.value})} placeholder="e.g. SUMMER INSTITUTIONAL TRAINING TIME TABLE" style={{...is,fontSize:13,fontWeight:600,marginBottom:7}}/>
      <button onClick={()=>setExp(!exp)} style={{background:"transparent",border:"none",color:T.textSecondary,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0}}>{exp?"Hide optional fields":`Optional fields${filled>0?` (${filled} filled)`:""}`}</button>
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
