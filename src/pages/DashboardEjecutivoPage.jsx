import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import theme from "../styles/theme";
import { ZONAS_SALAS, normalizarNombreSala } from "../utils/zonasSalas";
import { crearIndiceAFProyectoSF, resolverAFProyectoSF } from "../utils/relacionesAFProyectoSF";
import { construirRelacionesTC, relacionesDeTC, orionFolio, orionSala, orionFecha, orionFechaDe, orionAsunto } from "../utils/orionRelaciones";

const txt = v => v == null ? "" : typeof v === "string" || typeof v === "number" ? String(v) : "";
const first = (x, ...keys) => keys.map(k => txt(x?.[k])).find(Boolean) || "";
const tipo = x => first(x,"tipo","tipoCorreo").toUpperCase().trim();
const asunto = x => first(x,"asunto","subject","titulo");
const es = (x,t) => tipo(x) === t || (!tipo(x) && new RegExp(`\\b${t}\\s*[#:-]?\\s*\\d{2,}`,"i").test(asunto(x)));
const fecha = x => orionFecha(orionFechaDe(x) || x.fechaEvento || x.fechaHora || x.createdAt);
const mes = x => { const d=fecha(x); return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` : "SIN_FECHA"; };
const folioAF = x => (first(x,"afId","af","folioAF","folio").match(/\d{2,}/)?.[0] || asunto(x).match(/\bAF\s*#?\s*(\d{2,})\b/i)?.[1] || "");
const folioSUP = x => first(x,"folioSUP","supId","sup","folio","folioOrion","codigo","numeroReporte") || asunto(x).match(/\bSUP\s*[#:-]?\s*(\d{3,})\b/i)?.[1] || "";
const sala = x => first(x,"sala","sitio","nombreSala","hall") || orionSala(x) || "Sin sala";
const dia = x => fecha(x)?.toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"}) || "Sin fecha";
const unico = (items, getKey) => { const m=new Map(); for(const x of [...items].sort((a,b)=>(fecha(b)?.getTime()||0)-(fecha(a)?.getTime()||0))) { const k=getKey(x) || `id:${x._coleccion||""}:${x.id}`; if(!m.has(k)) m.set(k,x); } return [...m.values()]; };
const panel = {background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:18,boxShadow:"0 3px 12px rgba(15,23,42,.04)"};
const control = {padding:"10px 12px",border:"1px solid #CBD5E1",borderRadius:10,background:"white",minWidth:155,maxWidth:"100%"};

function useColeccion(nombre) {
  const [data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  useEffect(()=>onSnapshot(collection(db,nombre),s=>{setData(s.docs.map(d=>({...d.data(),id:d.id,_coleccion:nombre})));setLoading(false);setError("");},e=>{setError(`${nombre}: ${e.message}`);setLoading(false);}),[nombre]);
  return {data,loading,error};
}

// Solo se acepta evidencia explícita, positiva y referida al proyecto.
// El simple vínculo PJ/SF y la palabra FIXED (que corresponde a TC) NO cierran un proyecto.
function cierrePJConfirmado(documento, pj) {
  const campos = ["cierreProyectoConfirmado","proyectoCerrado","projectClosed","cierrePJConfirmado"];
  const referencias = ["proyectoId","pjId","folioPJ","pj","proyecto"];
  const ref = referencias.map(k=>first(documento,k)).find(Boolean);
  if (!ref || !ref.match(/\d{2,}/)?.[0] || ref.match(/\d{2,}/)?.[0] !== pj) return false;
  return campos.some(k=>documento[k] === true);
}

export default function DashboardEjecutivoPage() {
  const correos=useColeccion("orion_correos");
  const actividades=useColeccion("orion_actividades");
  const proyectos=useColeccion("orion_proyectos");
  const hojas=useColeccion("orion_hojas_servicio");
  const llamados=useColeccion("orion_llamados");
  const zonas=useColeccion("orion_salas_zonas");
  const seguimientos=useColeccion("orion_actividades_seguimiento");
  const [zona,setZona]=useState("TODAS"),[room,setRoom]=useState("TODAS"),[periodo,setPeriodo]=useState("TODOS"),[seleccion,setSeleccion]=useState("AF_PENDIENTES"),[buscar,setBuscar]=useState("");
  const loading=[correos,actividades,proyectos,hojas,llamados,zonas,seguimientos].some(x=>x.loading);
  const errors=[correos,actividades,proyectos,hojas,llamados,zonas,seguimientos].map(x=>x.error).filter(Boolean);
  const asignaciones=useMemo(()=>Object.fromEntries(zonas.data.filter(x=>["TIJUANA","MEXICALI","PACIFICO"].includes(x.zona)).map(x=>[x.id,x.zona])),[zonas.data]);
  const catalogo=useMemo(()=>new Map(Object.entries(ZONAS_SALAS).flatMap(([z,nombres])=>nombres.map(n=>[normalizarNombreSala(n),z]))),[]);
  const zonaDe=nombre=>asignaciones[normalizarNombreSala(nombre)]||catalogo.get(normalizarNombreSala(nombre))||"";
  const seguimientoPorId=useMemo(()=>Object.fromEntries(seguimientos.data.map(x=>[x.id,x])),[seguimientos.data]);
  const zonaVisible=(nombre,z)=>z==="GLOBAL" || (z==="TODAS" ? Boolean(zonaDe(nombre)) : z==="SIN_CLASIFICAR" ? !zonaDe(nombre) : zonaDe(nombre)===z);
  const esSUP=x=>["SUP","SUPERVISION","SUPERVISIÓN"].includes(tipo(x)) || (!tipo(x)&&/^\s*(?:\[?SUP\]?|SUPERVISI[ÓO]N)\b/i.test(asunto(x)));
  // Agrupar notificaciones de una AF, pero conservar el ID histórico de seguimiento.
  // Debe coincidir con el ID utilizado por ActividadesPage.jsx.
  const afs=useMemo(()=>{
    const grupos=new Map();
    const fuentes=[...actividades.data.map(x=>({...x,_origen:"orion_actividades"})),...correos.data.filter(x=>es(x,"AF")).map(x=>({...x,_origen:"orion_correos"}))];
    for(const x of fuentes){const n=folioAF(x);const clave=n?`AF-${n}`:`${x._origen}:${x.id}`;if(!grupos.has(clave))grupos.set(clave,[]);grupos.get(clave).push(x);}
    return [...grupos.values()].map(group=>{
      group.sort((a,b)=>(fecha(b)?.getTime()||0)-(fecha(a)?.getTime()||0));
      const principal=group[0],historica=group.find(x=>x._origen==="orion_actividades"),n=folioAF(principal)||folioAF(historica||{});
      const conocida=group.map(x=>first(x,"sala","sitio","nombreSala")).find(Boolean);
      const asuntoPrincipal=group.map(asunto).find(Boolean)||"";
      const salaAsunto=asuntoPrincipal.match(/AF\s+(?:Approved|Created|New|Cancelled|Canceled)\s*-\s*(.+?)\s*-\s*\d+\s*$/i)?.[1]||"";
      return {...principal,...(historica||{}),id:historica?.id||`correo_AF_${n||principal.id}`,af:n||first(principal,"af","folio"),sala:conocida||salaAsunto||"",_avisos:group,fechaCorreo: principal.fechaCorreo||principal.fechaRecepcion||principal.fecha||principal.fechaCreacion};
    });
  },[correos.data,actividades.data]);
  const cancelacionDetectada=x=>{
    const avisos=(x._avisos||[]).filter(v=>v._origen==="orion_correos"&&folioAF(v)===folioAF(x));
    const cancel=v=>v.afCancelada===true||/\b(cancelled|canceled|cancellation|cancelada|cancelado|cancelacion|cancelación)\b/i.test(`${asunto(v)} ${first(v,"estadoOrion","estado","estatus","status")}`);
    return Boolean(folioAF(x)&&avisos.some(cancel)&&avisos.some(v=>!cancel(v)));
  };
  const tcs=useMemo(()=>unico([...correos.data.filter(x=>es(x,"TC")),...llamados.data],x=>orionFolio(x,"TC")?`TC:${orionFolio(x,"TC")}`:null),[correos.data,llamados.data]);
  const sups=useMemo(()=>unico(correos.data.filter(esSUP),x=>folioSUP(x)?`SUP:${folioSUP(x)}`:null),[correos.data]);
  const indice=useMemo(()=>crearIndiceAFProyectoSF([...correos.data,...hojas.data.map(x=>({...x,tipo:"SF"}))],proyectos.data),[correos.data,hojas.data,proyectos.data]);
  const sfDocs=useMemo(()=>[...correos.data.filter(x=>es(x,"SF")),...hojas.data],[correos.data,hojas.data]);
  const relaciones=useMemo(()=>construirRelacionesTC(correos.data.filter(x=>es(x,"SF"))),[correos.data]);
  const afFilas=useMemo(()=>afs.map(x=>{
    const n=folioAF(x),seg=seguimientoPorId[x.id]||{};
    const rel=resolverAFProyectoSF(indice,n,[...(x._avisos||[]),x]);
    const pjs=rel.proyectos.map(p=>p.folio);
    const sfs=rel.hojas.map(h=>h.folio);
    const alerta=cancelacionDetectada(x)&&seg.cancelacionRechazada!==true;
    // La decisión del operador es la única fuente de cierre/cancelación operativa.
    const grupo=seg.cancelacionConfirmada===true?"AF_CANCELADAS":seg.actividadCompletada===true?"AF_COMPLETADAS":alerta?"AF_POR_CANCELAR":"AF_PENDIENTES";
    const estado=grupo==="AF_CANCELADAS"?"CANCELADA · VALIDADA":grupo==="AF_COMPLETADAS"?"COMPLETADA · VALIDADA":grupo==="AF_POR_CANCELAR"?"CANCELACIÓN POR REVISAR":"EN SEGUIMIENTO";
    const detalle=`PJ: ${pjs.join(", ")||"—"} · SF: ${sfs.join(", ")||"—"}${seg.completadaPorCorreo?` · Completada por ${seg.completadaPorCorreo}`:""}${seg.cancelacionValidadaPorCorreo?` · Cancelación revisada por ${seg.cancelacionValidadaPorCorreo}`:""}`;
    return {id:`af:${n||x.id}`,tipo:"AF",folio:n||"Sin folio",sala:sala(x),fecha:fecha(x),fechaTexto:dia(x),estado,detalle,link:`/actividades?af=${encodeURIComponent(n)}`,grupo};
  }),[afs,indice,seguimientoPorId]);
  const tcFilas=useMemo(()=>tcs.map(x=>{
    const n=orionFolio(x,"TC"); const rs=relacionesDeTC(relaciones,n);const subs=[...new Set(rs.map(r=>r.subfolio))];
    const cerrado=subs.length>0&&subs.every(sub=>rs.some(r=>r.subfolio===sub&&r.estado==="CERRADO"));
    const estado=cerrado?"CERRADO (FIXED)":subs.some(sub=>rs.some(r=>r.subfolio===sub&&r.estado==="CERRADO"))?"CIERRE PARCIAL":rs.length?"ATENDIDO SIN FIXED":"SIN EVIDENCIA DE SF";
    return {id:`tc:${n||x.id}`,tipo:"TC",folio:n||"Sin folio",sala:sala(x),fecha:fecha(x),fechaTexto:dia(x),estado,detalle:`${subs.length} subfolio(s) documentados · SF: ${[...new Set(rs.map(r=>r.sf))].join(", ")||"—"}`,link:`/llamados-tecnicos?tc=${encodeURIComponent(n)}`,grupo:cerrado?"TC_CERRADOS":"TC_ABIERTOS"};
  }),[tcs,relaciones]);
  const supFilas=useMemo(()=>sups.map(x=>({id:`sup:${folioSUP(x)||x.id}`,tipo:"SUP",folio:folioSUP(x)||"Sin folio",sala:sala(x),fecha:fecha(x),fechaTexto:dia(x),estado:first(x,"estadoOrion","estado","estatus","status")||"RECIBIDO",detalle:asunto(x),link:"/supervisiones",grupo:"SUP"})),[sups]);
  const filas=useMemo(()=>[...afFilas,...tcFilas,...supFilas],[afFilas,tcFilas,supFilas]);
  const salas=useMemo(()=>[...new Set(filas.filter(x=>zonaVisible(x.sala,zona)).map(x=>x.sala))].sort((a,b)=>a.localeCompare(b,"es")),[filas,zona,asignaciones,catalogo]);
  useEffect(()=>{if(room!=="TODAS"&&!salas.includes(room))setRoom("TODAS");},[salas,room]);
  const meses=useMemo(()=>[...new Set(filas.map(x=>x.fecha?`${x.fecha.getFullYear()}-${String(x.fecha.getMonth()+1).padStart(2,"0")}`:"SIN_FECHA"))].sort().reverse(),[filas]);
  const base=filas.filter(x=>(zonaVisible(x.sala,zona))&&(room==="TODAS"||x.sala===room)&&(periodo==="TODOS"||(x.fecha?`${x.fecha.getFullYear()}-${String(x.fecha.getMonth()+1).padStart(2,"0")}`:"SIN_FECHA")===periodo));
  const cards=[{id:"AF_COMPLETADAS",label:"AF completadas",sub:"Confirmadas por operador",color:"#15803D"},{id:"AF_PENDIENTES",label:"AF pendientes",sub:"En seguimiento",color:"#B45309"},{id:"AF_POR_CANCELAR",label:"Cancelaciones por revisar",sub:"Avisos ligados, falta aprobación",color:"#D97706"},{id:"AF_CANCELADAS",label:"AF canceladas",sub:"Cancelación confirmada",color:"#64748B"},{id:"TC_ABIERTOS",label:"TC abiertos",sub:"Sin FIXED en todos los subfolios",color:"#DC2626"},{id:"TC_CERRADOS",label:"TC cerrados",sub:"FIXED en subfolios documentados",color:"#15803D"},{id:"SUP",label:"Supervisiones",sub:"Reportes SUP únicos",color:"#0891B2"}];
  const visibles=base.filter(x=>x.grupo===seleccion&&[x.folio,x.sala,x.estado,x.detalle].join(" ").toLowerCase().includes(buscar.toLowerCase())).sort((a,b)=>(b.fecha?.getTime()||0)-(a.fecha?.getTime()||0));
  return <div style={{...theme.layout.page,minHeight:"100%",color:"#0F172A"}}>
    <div style={{...panel,background:"linear-gradient(120deg,#0F172A,#1E3A5F)",color:"white",marginBottom:18}}><h1 style={{margin:"0 0 6px",fontSize:26}}>Dashboard Operativo Orion</h1><p style={{margin:0,color:"#CBD5E1"}}>Seguimiento documental AF → PJ → SF, llamados técnicos y supervisiones SUP</p></div>
    <div style={{...panel,display:"flex",gap:12,flexWrap:"wrap",marginBottom:18,alignItems:"center"}}>
      <label>Zona <select aria-label="Zona" style={control} value={zona} onChange={e=>setZona(e.target.value)}><option value="TODAS">Todas mis zonas</option><option value="GLOBAL">GLOBAL · Todas</option><option value="TIJUANA">TIJUANA</option><option value="MEXICALI">MEXICALI</option><option value="PACIFICO">PACÍFICO</option><option value="SIN_CLASIFICAR">SIN CLASIFICAR</option></select></label>
      <label>Sala <select aria-label="Sala" style={control} value={room} onChange={e=>setRoom(e.target.value)}><option value="TODAS">Todas las salas</option>{salas.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
      <label>Período <select aria-label="Período" style={control} value={periodo} onChange={e=>setPeriodo(e.target.value)}><option value="TODOS">Todo el historial</option>{meses.map(m=><option key={m} value={m}>{m}</option>)}</select></label>
      <button type="button" onClick={()=>{setZona("TODAS");setRoom("TODAS");setPeriodo("TODOS");setBuscar("");}} style={{...control,cursor:"pointer"}}>Limpiar filtros</button>
    </div>
    {errors.length>0&&<div role="alert" style={{...panel,color:"#B91C1C",marginBottom:18}}>Error al consultar Firebase: {errors.join(" · ")}. Los conteos pueden estar incompletos.</div>}
    {loading&&<p>Consultando información de Orion...</p>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:12,marginBottom:18}}>{cards.map(c=><button key={c.id} type="button" onClick={()=>{setSeleccion(c.id);setBuscar("");}} style={{...panel,textAlign:"left",cursor:"pointer",border:seleccion===c.id?`2px solid ${c.color}`:"1px solid #E2E8F0"}}><div style={{fontSize:13,color:"#64748B",fontWeight:700}}>{c.label}</div><div style={{fontSize:35,fontWeight:800,color:c.color,margin:"8px 0"}}>{loading?"—":base.filter(x=>x.grupo===c.id).length}</div><div style={{fontSize:11,color:"#64748B"}}>{c.sub}</div></button>)}</div>
    <section style={panel}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12}}><h2 style={{margin:0,fontSize:19}}>{cards.find(c=>c.id===seleccion)?.label} · {visibles.length}</h2><input aria-label="Buscar registros" placeholder="Buscar folio, sala, estado..." style={control} value={buscar} onChange={e=>setBuscar(e.target.value)}/></div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:760,textAlign:"left"}}><thead><tr style={{background:"#F8FAFC"}}>{["Fecha","Folio","Sala","Estado","Evidencia / detalle","Consultar"].map(h=><th key={h} style={{padding:12,borderBottom:"1px solid #E2E8F0"}}>{h}</th>)}</tr></thead><tbody>{visibles.map(x=><tr key={x.id} style={{borderBottom:"1px solid #E2E8F0"}}><td style={{padding:12,whiteSpace:"nowrap"}}>{x.fechaTexto}</td><td style={{padding:12,fontWeight:700}}>{x.tipo} {x.folio}</td><td style={{padding:12}}>{x.sala}</td><td style={{padding:12}}>{x.estado}</td><td style={{padding:12,fontSize:12}}>{x.detalle}</td><td style={{padding:12}}><Link to={x.link} style={{color:"#0891B2",fontWeight:700}}>Abrir →</Link></td></tr>)}</tbody></table>{!loading&&!visibles.length&&<p style={{padding:14,color:"#64748B"}}>No hay registros que coincidan con los filtros.</p>}</div>
    </section>
    <p style={{fontSize:12,color:"#64748B",lineHeight:1.6}}>Las AF completadas y canceladas se cuentan exclusivamente mediante confirmaciones del operador en orion_actividades_seguimiento; los avisos de cancelación sin validar permanecen por revisar. TC cerrado significa FIXED en todos los subfolios documentados; si faltan SF o subfolios importados, el resultado puede ser provisional. Consulta de solo lectura.</p>
  </div>;
}
