import { DAY_FULL } from "../utils/constants.js";

export default function PrintView({header,rows,groups,onClose}){
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
              {groups.map((g,i)=><><th key={`a${i}`} style={{border:"1px solid #ccc",padding:"4px 5px",fontWeight:600}}>{g.lab} ({g.group})</th><th key={`b${i}`} style={{border:"1px solid #ccc",padding:"4px 5px",fontWeight:600}}>Teacher</th></>)}</tr>
          </thead>
          <tbody>
            {rows.map((row,ri)=>{
              const isFirst=dayFirst[row.day]===ri;
              const spans=daySpans[row.day]||[];
              return(
                <tr key={ri} style={{background:row.isRecess?"#f8f8f8":"#fff"}}>
                  {isFirst&&<td rowSpan={spans.length} style={{border:"1px solid #ddd",textAlign:"center",fontWeight:700,fontSize:8,letterSpacing:1,background:"#e8ecf3",writingMode:"vertical-lr",transform:"rotate(180deg)",width:16}}>{DAY_FULL[row.day]||row.day}</td>}
                  <td style={{border:"1px solid #ddd",padding:"3px 5px",fontSize:9,fontFamily:"monospace"}}>{row.time}</td>
                  {row.cells.map((c,ci)=>(<><td key={`s${ci}`} style={{border:"1px solid #ddd",padding:"3px 4px",textAlign:"center",fontWeight:c.mode==="free"?400:600,color:c.mode==="free"?"#ccc":"#111"}}>{c.mode==="free"?"—":c.subject}</td><td key={`t${ci}`} style={{border:"1px solid #ddd",padding:"3px 4px",textAlign:"center",color:"#555"}}>{row.isRecess||c.mode==="free"?"":c.teacher}</td></>))}
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
