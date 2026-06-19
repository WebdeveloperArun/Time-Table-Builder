import { useEffect } from "react";

export default function Modal({onClose,children,width=420,T}){
  useEffect(()=>{
    const onKey = e => { if(e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:T.modalBg,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:24,width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",boxShadow:`0 24px 64px ${T.shadowColor}`}}>
        {children}
      </div>
    </div>
  );
}
