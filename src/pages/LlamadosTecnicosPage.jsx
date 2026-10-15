import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import theme from "../styles/theme";
import { Link, useSearchParams } from "react-router-dom";
import { construirRelacionesTC, relacionesDeTC, orionFecha, orionFechaDe, orionFolio, orionSala, orionAsunto, orionCuerpo, orionFirst } from "../utils/orionRelaciones";

const C = { ink: theme.colors.text, muted: theme.colors.textLight, line: theme.colors.border, cyan: theme.colors.primaryHover, green: theme.colors.success, red: theme.colors.error, amber: theme.colors.warning };
const card = { ...theme.card, marginBottom: 0 };
const field = { ...theme.input, width: "auto", maxWidth: "100%", marginTop: 0, marginBottom: 0, padding: "12px 14px" };
const actionButton = { ...theme.button.primary, padding: "10px 16px", borderRadius: 12, fontSize: 13 };
const str = v => v == null || v === "" ? "—" : typeof v === "object" ? "—" : String(v);
const monthKey = x => { const d = orionFecha(orionFechaDe(x)); return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` : "SIN_FECHA"; };
const monthLabel = key => key === "SIN_FECHA" ? "Sin fecha" : new Date(Number(key.slice(0,4)),Number(key.slice(5,7))-1,1).toLocaleDateString("es-MX",{month:"long",year:"numeric"});
const dateText = v => orionFecha(v)?.toLocaleString("es-MX", {dateStyle:"medium",timeStyle:"short"}) || str(v);
const norm = v => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const badgeState = x => str(orionFirst(x,"estadoOrion","estado","estatus","status") || "SIN ESTADO");
const safeJson = x => JSON.stringify(x, (_k,v) => typeof v?.toDate === "function" ? v.toDate().toISOString() : v, 2);
const Row = ({name,value}) => <div style={{display:"grid",gridTemplateColumns:"150px minmax(0,1fr)",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.line}`,overflowWrap:"anywhere"}}><strong>{name}</strong><span>{str(value)}</span></div>;
function useOrion(coleccion) {
  const [items,setItems] = useState([]), [loading,setLoading] = useState(true), [error,setError] = useState("");
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db,coleccion), s => {
      setItems(s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(orionFecha(orionFechaDe(b))?.getTime()||0)-(orionFecha(orionFechaDe(a))?.getTime()||0)));
      setLoading(false); setError("");
    }, e => {setError(e.message);setLoading(false);});
    return unsubscribe;
  },[coleccion]);
  return {items,loading,error};
}
const isTC = x => String(x.tipo || "").toUpperCase() === "TC" || /\bTC\s*\d{3,}/i.test(orionAsunto(x));
const isSF = x => String(x.tipo || "").toUpperCase() === "SF" || /\bSF\s*\d{3,}/i.test(orionAsunto(x));
const getTC = x => orionFolio(x,"TC");
const getSala = x => orionSala(x);
// Atención = existe evidencia en una SF. Cierre = FIXED individual.
// La ausencia de SF en el historial importado no demuestra que nunca se atendió.
const estadoAtencion = rs => {
  if (!rs.length) return "PENDIENTE DE ATENCIÓN";
  const subfolios = [...new Set(rs.map(r => r.subfolio))];
  const cerrados = subfolios.filter(sub => rs.some(r => r.subfolio === sub && r.estado === "CERRADO"));
  if (cerrados.length === subfolios.length) return "CERRADA";
  if (cerrados.length) return "ATENCIÓN PARCIAL";
  return "ATENDIDA";
};
const estadoCierre = rs => !rs.length ? "SIN EVIDENCIA" : rs.every(r=>r.estado === "CERRADO") ? "FIXED EN SUBFOLIOS DOCUMENTADOS" : rs.some(r=>r.estado === "CERRADO") ? "CIERRE PARCIAL" : "SIN CIERRE CONFIRMADO";
const sfAtencion = rs => [...new Set(rs.map(r=>r.sf).filter(Boolean))];
function Detail({item, relaciones, close}) {
  if (!item) return null;
  const confirmadas = relaciones.filter(r => r.estado === "CERRADO");
  return <div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,background:"#0F172AB8",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={close}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:22,maxWidth:900,width:"100%",maxHeight:"90vh",overflow:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><h2 style={{margin:0}}>Detalle TC {getTC(item)}</h2><button onClick={close} style={actionButton}>Cerrar ✕</button></div>
      <Row name="Sala" value={getSala(item)}/><Row name="Fecha" value={dateText(orionFechaDe(item))}/><Row name="Estado Orion" value={badgeState(item)}/><Row name="Asunto" value={orionAsunto(item)}/>
      <Row name="Estado de atención" value={estadoAtencion(relaciones)}/><Row name="Estado de cierre" value={estadoCierre(relaciones)}/><Row name="SF de atención" value={sfAtencion(relaciones).map(n=>`SF ${n}`).join(", ") || "Sin SF detectada en historial importado"}/><Row name="SF con FIXED" value={[...new Set(confirmadas.map(r=>r.sf))].join(", ") || "Sin cierre confirmado"}/>
      <h3>Fallas individuales y hojas de servicio</h3>
      {relaciones.length ? <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:610,textAlign:"left"}}><thead><tr style={{background:"#F1F5F9"}}>{["Subfolio","Estado en SF","SF evidencia","Fecha SF","Avisos"].map(h=><th key={h} style={{padding:10}}>{h}</th>)}</tr></thead><tbody>{relaciones.map(r=><tr key={`${r.subfolio}-${r.sf}`} style={{borderTop:`1px solid ${C.line}`}}><td style={{padding:10,fontWeight:700}}>{r.subfolio}</td><td style={{padding:10,color:r.estado==="CERRADO"?C.green:C.amber,fontWeight:700}}>{r.estado === "CERRADO" ? "CERRADO (FIXED)" : r.estadoOrion}</td><td style={{padding:10}}><Link to={`/hojas-servicio?sf=${encodeURIComponent(r.sf)}`} style={{color:C.cyan,fontWeight:700}}>SF {r.sf} →</Link></td><td style={{padding:10}}>{dateText(r.fecha)}</td><td style={{padding:10}}>{r.fuentes.length}</td></tr>)}</tbody></table></div> : <p style={{color:C.muted}}>Aún no se detectaron subfolios de este TC en las tablas de las SF importadas. Esto no demuestra que el TC esté cerrado.</p>}
      <p style={{fontSize:12,color:C.muted}}>La relación se obtuvo del contenido de la sección «Technical calls Attended» de cada SF. Solo FIXED respalda un cierre individual. La vista no modifica Firestore.</p>
      <h3>Contenido original del TC</h3><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",background:"#F8FAFC",padding:14,borderRadius:10}}>{str(orionCuerpo(item))}</pre>
      <details><summary>Datos técnicos del documento (diagnóstico)</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{safeJson(item)}</pre></details>
    </div>
  </div>;
}
export default function LlamadosTecnicosPage() {
  const {items:correos,loading,error} = useOrion("orion_correos");
  const {items:legacy,loading:loadingLegacy,error:errorLegacy} = useOrion("orion_llamados");
  const [params] = useSearchParams();
  const tcSolicitado = params.get("tc");
  const [search,setSearch] = useState(""), [room,setRoom] = useState("TODAS"), [state,setState] = useState("TODOS"), [attention,setAttention] = useState("TODAS"), [month,setMonth] = useState(""), [selected,setSelected] = useState(null);
  const relaciones = useMemo(()=>construirRelacionesTC(correos.filter(isSF)),[correos]);
  const items = useMemo(()=>{
    const merged = [...correos.filter(isTC), ...legacy];
    const seen = new Set();
    return merged.filter(x=>{const key = x.entryId ? `outlook:${x.entryId}` : `${getTC(x)}:${orionAsunto(x)}:${orionFecha(orionFechaDe(x))?.getTime()||""}`;if(seen.has(key))return false;seen.add(key);return true;});
  },[correos,legacy]);
  useEffect(() => {
    if (!tcSolicitado || loading || loadingLegacy) return;
    setMonth("TODOS"); setRoom("TODAS"); setState("TODOS"); setAttention("TODAS"); setSearch(tcSolicitado);
    const encontrada = items.find(x=>getTC(x)===tcSolicitado);
    if (encontrada) setSelected(encontrada);
  }, [tcSolicitado, items, loading, loadingLegacy]);
  const months = useMemo(()=>[...new Set(items.map(monthKey))].sort((a,b)=>b.localeCompare(a)),[items]);
  useEffect(()=>{ if(months.length && (!month || (month !== "TODOS" && !months.includes(month)))) setMonth(months[0]); },[months,month]);
  const monthlyItems = useMemo(()=>items.filter(x=>month === "TODOS" || monthKey(x) === month),[items,month]);
  const monthlyCount = status => monthlyItems.filter(x=>estadoAtencion(relacionesDeTC(relaciones,getTC(x)))===status).length;
  const salas = useMemo(()=>[...new Set(items.map(getSala))].sort(),[items]);
  const states = useMemo(()=>[...new Set(items.map(badgeState))].sort(),[items]);
  const filtered = useMemo(()=>monthlyItems.filter(x=>{
    const rs = relacionesDeTC(relaciones,getTC(x));
    return (room==="TODAS"||getSala(x)===room) && (state==="TODOS"||badgeState(x)===state) && (attention==="TODAS"||estadoAtencion(rs)===attention) && norm([getTC(x),getSala(x),badgeState(x),orionAsunto(x),...rs.map(r=>`${r.subfolio} ${r.sf} ${r.estadoOrion}`)].join(" ")).includes(norm(search));
  }),[monthlyItems,relaciones,room,state,attention,search]);
  const loadingAll = loading || loadingLegacy;
  const selectedRelations = selected ? relacionesDeTC(relaciones,getTC(selected)) : [];
  return <div style={{...theme.layout.page,minHeight:"100%",color:C.ink}}>
    <div style={{...card,background:"linear-gradient(135deg,#0F172A,#1E293B)",color:"white",marginBottom:18}}><h1 style={{margin:"0 0 8px"}}>📞 Llamados técnicos — Orion</h1><p style={{color:"#CBD5E1",margin:0}}>Consulta de solo lectura. Cruce bidireccional TC ↔ SF basado en evidencia de Orion.</p></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:18}}>{[["Notificaciones TC",monthlyItems.length],["Salas",salas.length],["Cerradas",monthlyCount("CERRADA")],["Atendidas",monthlyCount("ATENDIDA")],["Parciales",monthlyCount("ATENCIÓN PARCIAL")],["Pendientes",monthlyCount("PENDIENTE DE ATENCIÓN")],["Resultados",filtered.length],["Subfolios con FIXED",[...relaciones.keys()].filter(k=>relaciones.get(k).some(r=>r.estado==="CERRADO")).length]].map(([k,v])=><div key={k} style={card}><div style={{color:C.muted,fontSize:13}}>{k}</div><strong style={{fontSize:28}}>{v}</strong></div>)}</div>
    <div style={{...card,display:"flex",gap:12,flexWrap:"wrap",marginBottom:18}}><select aria-label="Mes y año" style={field} value={month} onChange={e=>setMonth(e.target.value)}><option value="TODOS">Todos los meses</option>{months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}</select><input aria-label="Buscar" style={{...field,flex:"1 1 260px"}} placeholder="Buscar TC, subfolio, sala o SF" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Sala" style={field} value={room} onChange={e=>setRoom(e.target.value)}><option value="TODAS">Todas las salas</option>{salas.map(s=><option key={s} value={s}>{s}</option>)}</select><select aria-label="Estado" style={field} value={state} onChange={e=>setState(e.target.value)}><option value="TODOS">Todos los estados</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select><select aria-label="Atención" style={field} value={attention} onChange={e=>setAttention(e.target.value)}><option value="TODAS">Todas las atenciones</option><option value="CERRADA">Cerradas con FIXED</option><option value="ATENDIDA">Atendidas sin FIXED</option><option value="ATENCIÓN PARCIAL">Cierre parcial</option><option value="PENDIENTE DE ATENCIÓN">Pendientes sin SF detectada</option></select></div>
    <div style={{fontWeight:700,marginBottom:12,color:C.ink}}>Período: {month === "TODOS" ? "Todos los meses" : month ? monthLabel(month) : "Cargando períodos"} · {filtered.length} resultados</div>
    {(error||errorLegacy)&&<p role="alert" style={{color:C.red}}>Error consultando Firestore: {[error,errorLegacy].filter(Boolean).join(" · ")}</p>}
    {loadingAll?<div style={card}>Cargando registros...</div>:filtered.length===0?<div style={card}>{items.length===0?"Aún no hay llamados técnicos importados desde Orion.":"No hay coincidencias en el mes y filtros seleccionados."}</div>:<div style={{...card,overflowX:"auto",padding:0}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:1100,textAlign:"left"}}><thead><tr style={{background:"#F1F5F9"}}>{["Fecha","Folio TC","Sala","Atención","Estado Orion","SF de atención","SF con FIXED","Detalle"].map(h=><th key={h} style={{padding:14}}>{h}</th>)}</tr></thead><tbody>{filtered.map(x=>{const rs=relacionesDeTC(relaciones,getTC(x));const f=[...new Set(rs.filter(r=>r.estado==="CERRADO").map(r=>r.sf))];return <tr key={`${x.id}-${getTC(x)}`} style={{borderTop:`1px solid ${C.line}`}}><td style={{padding:14}}>{dateText(orionFechaDe(x))}</td><td style={{padding:14,fontWeight:800}}>{getTC(x)||"—"}</td><td style={{padding:14}}>{getSala(x)}</td><td style={{padding:14,fontWeight:700,color:estadoAtencion(rs)==="CERRADA"?C.green:estadoAtencion(rs)==="PENDIENTE DE ATENCIÓN"?C.amber:C.cyan}}>{estadoAtencion(rs)}</td><td style={{padding:14}}>{badgeState(x)}</td><td style={{padding:14}}>{sfAtencion(rs).map(n=>`SF ${n}`).join(", ")||"—"}</td><td style={{padding:14}}>{f.length?f.map(n=>`SF ${n}`).join(", "):"—"}</td><td style={{padding:14}}><button style={actionButton} onClick={()=>setSelected(x)}>Ver detalle</button></td></tr>;})}</tbody></table></div>}
    <p style={{fontSize:12,color:C.muted,marginTop:14}}>CERRADA = todos los subfolios documentados tienen FIXED. ATENDIDA = existe SF, pero sin FIXED. ATENCIÓN PARCIAL = mezcla de subfolios con y sin FIXED. PENDIENTE = no se detectó SF. Si faltan subfolios o correos importados, el estado puede ser provisional.</p>
    <Detail item={selected} relaciones={selectedRelations} close={()=>setSelected(null)}/>
  </div>;
}
