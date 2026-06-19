import { useEffect, useRef } from "react";

export default function ContextMenu({x,y,items,onClose,T}){
  const ref=useRef();
  useEffect(()=>{
    const handle = e=>{if(ref.current && !ref.current.contains(e.target)) onClose();};
    setTimeout(()=>document.addEventListener("mousedown", handle), 0);
    return ()=>document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return(
    <div ref={ref} style={{position:"fixed",top:Math.min(y,window.innerHeight-280),left:Math.min(x,window.innerWidth-210),background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"4px 0",zIndex:3000,boxShadow:`0 12px 40px ${T.shadowColor}`,minWidth:200}}>
      {items.map((item,i)=>
        item === "sep"
          ? <div key={i} style={{height:1,background:T.border,margin:"3px 0"}}/>
          : <button key={i} onClick={()=>{item.action();onClose();}} disabled={item.disabled}
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
