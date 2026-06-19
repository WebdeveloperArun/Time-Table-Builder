import { Ic } from "./Icons.jsx";

export default function MH({title,subtitle,onClose,T}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
      <div>
        <div style={{color:T.textPrimary,fontWeight:700,fontSize:15}}>{title}</div>
        {subtitle&&<div style={{color:T.textSecondary,fontSize:11,marginTop:2}}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{background:"transparent",border:"none",color:T.textSecondary,cursor:"pointer",padding:2,display:"flex"}}><Ic.X/></button>
    </div>
  );
}
