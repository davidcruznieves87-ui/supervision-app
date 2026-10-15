import { useEffect, useMemo, useState } from "react";

import { collection, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../firebase";

import theme from "../styles/theme";

import { Link, useSearchParams } from "react-router-dom";

import { extraerSubfoliosSF, orionFolio } from "../utils/orionRelaciones";
import { ZONAS_SALAS, normalizarNombreSala } from "../utils/zonasSalas";



const C = {

  ink: theme.colors.text,

  muted: theme.colors.textLight,

  line: theme.colors.border,

  cyan: theme.colors.primaryHover,

};

const card = { ...theme.card, marginBottom: 0 };

const field = { ...theme.input, marginTop: 0, marginBottom: 0, width: "auto", maxWidth: "100%", padding: "12px 14px" };

const actionButton = { ...theme.button.primary, padding: "10px 16px", borderRadius: 12, fontSize: 13 };

const first = (obj, ...keys) => {

  for (const key of keys) {

    if (obj?.[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];

  }

  return null;

};

const str = (v) => v == null || v === "" ? "—" : typeof v === "object" ? "—" : String(v);

const date = (v) => {

  if (!v) return null;

  if (typeof v?.toDate === "function") return v.toDate();

  if (typeof v?.seconds === "number") return new Date(v.seconds * 1000);

  const d = new Date(v);

  return Number.isNaN(d.getTime()) ? null : d;

};

const dateText = (v) => date(v)?.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) || str(v);

const norm = (v) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const refs = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v])

  .map((x) => typeof x === "object" ? first(x, "folio", "numero", "id") : x)

  .filter(Boolean).map(String);

const unique = (values) => [...new Set(values.map(String).filter(Boolean))];

const dateOf = (x) => first(x, "fechaCorreo", "fechaRecepcion", "fecha", "fechaCreacion", "receivedTime");

const bodyOf = (x) => first(x, "contenidoOriginal", "cuerpo", "body", "descripcion", "detalle");

const badgeState = (x) => str(first(x, "estadoOrion", "estado", "estatus", "status") || "SIN ESTADO");

const safeJson = (x) => JSON.stringify(x, (_k, v) => typeof v?.toDate === "function" ? v.toDate().toISOString() : v, 2);

const folio = (x) => orionFolio(x, "SF") || str(first(x, "sf", "folioSF", "folio", "numero"));

const sala = (x) => {

  const directa = first(x, "sala", "sitio", "nombreSala");

  if (directa && String(directa).trim()) return String(directa).trim();

  const asunto = String(first(x, "asunto", "subject") || "");

  const match = asunto.match(/\bNew\s+SF\s*#?\s*\d+\s*-\s*(.+)$/i);

  return match?.[1]?.trim() || "—";

};

const extract = (body, expression) => {

  const found = [];

  for (const match of String(body ?? "").matchAll(expression)) found.push(match[1]);

  return unique(found);

};

// Referencias documentales: NO implican cierre.

const detected = (x) => {

  const body = bodyOf(x) || "";

  return {

    af: unique([...refs(first(x, "afRelacionadas", "af", "folioAF")), ...extract(body, /\bAF\s*#?\s*[:.-]?\s*(\d+)\b/gi)]),

    pj: unique([...refs(first(x, "proyectosRelacionados", "pjRelacionados", "proyectoId", "pj", "folioPJ")), ...extract(body, /\b(?:PJ|PROJECT|PROYECTO)\s*#?\s*[:.-]?\s*(\d+)\b/gi), ...extract(body, /\bProject\s*:?\s*_{3,}\s*(\d{2,})\b/gi)]),

    tc: unique([...refs(first(x, "tcRelacionados", "tc", "folioTC")), ...extract(body, /\b(?:TC|LLT)\s*#?\s*[:.-]?\s*(\d+(?:-\d+)?)\b/gi)]),

  };

};

// Extractor de secciones del cuerpo Orion; lectura solamente.
const seccionSF = (texto, encabezado) => {
  const lineas = String(texto || "").split(/\r?\n/);
  const pos = lineas.findIndex(l => norm(l.trim()) === norm(encabezado));
  if (pos < 0) return "";
  const salida = [];
  for (let i = pos + 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (/^_{4,}$/.test(linea) || !linea) { if (!salida.length) continue; else if (!linea) continue; }
    if (/^(Project|Activities|Personnel|Technical calls Attended|Transferencia de Maquinas|Remarks)$/i.test(linea)) break;
    if (/^_{4,}$/.test(linea)) continue;
    salida.push(linea);
  }
  return salida.join("\n").trim();
};
const datosSF = (x) => {
  const texto = String(bodyOf(x) || "");
  const buscar = (re) => texto.match(re)?.[1]?.trim() || "";
  const fecha = buscar(/\bDate\s*:\s*(\d{4}-\d{2}-\d{2})/i);
  const entrada = buscar(/\bTime\s+In\s*:\s*(\d{1,2}:\d{2})/i);
  const salida = buscar(/\bTime\s+Out\s*:\s*(\d{1,2}:\d{2})/i);
  const minutos = (hora) => { const m = hora.match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1])*60+Number(m[2]) : null; };
  const a = minutos(entrada), b = minutos(salida);
  const duracion = a === null || b === null ? "—" : `${Math.floor(((b-a+1440)%1440)/60)} h ${String(((b-a+1440)%1440)%60).padStart(2,"0")} min`;
  const actividades = seccionSF(texto, "Activities").split(/\t+|\n/).map(v=>v.trim()).filter(Boolean);
  const personal = seccionSF(texto, "Personnel").replace(/,+$/g, "").trim();
  const observaciones = seccionSF(texto, "Remarks").split(/\n_{4,}/)[0];
  const proyecto = seccionSF(texto, "Project").match(/^\s*(\d{2,})\b/)?.[1] || "";
  const transferencia = seccionSF(texto, "Transferencia de Maquinas").split("\n").filter(l=>/^\d+\s/.test(l)).map(linea=>{
    const c=linea.split(/\t+/).map(v=>v.trim()).filter(Boolean);
    return c.length >= 6 ? {categoria:c[1],loc:c[2],serie:c[3],modelo:c[4],juego:c.slice(5).join(" ")} : {texto:linea};
  });
  return {fecha,entrada,salida,duracion,actividades,personal,observaciones,proyecto,transferencia};
};
const smallLabel = {fontSize:11,fontWeight:800,letterSpacing:0.6,textTransform:"uppercase",color:C.muted};
const panel = {border:`1px solid ${C.line}`,borderRadius:14,padding:16,background:"#FFFFFF"};

// Indice documental PJ -> AF. No infiere relaciones por sala ni por fecha.
const numeroFolio = (v) => String(v ?? "").match(/\d{2,}/)?.[0] || "";
const afDeProyecto = (p) => {
  const texto = `${String(first(p, "asunto", "subject") || "")}\n${String(bodyOf(p) || "")}`;
  return unique([
    ...refs(first(p, "afRelacionadas", "afId", "folioAF", "af")).map(numeroFolio),
    ...extract(texto, /\bAF\s*(?:Num\.?\s*#?\s*:|#|:|-|\s)\s*(\d{2,})\b/gi),
    ...extract(texto, /Hoja\s+de\s+Actividad\s*(?:#|:|-)?\s*(\d{2,})\b/gi),
  ].filter(Boolean));
};
const pjDeProyecto = (p) => numeroFolio(first(p, "proyectoId", "pjId", "folioPJ", "pj", "folio", "numero")) ||
  (String(first(p, "asunto", "subject") || "").match(/\b(?:PJ|PROJECT|PROYECTO)\s*#?\s*(\d{2,})\b/i)?.[1] || "");
const esProyecto = (p) => {
  const tipo = String(first(p, "tipo", "tipoCorreo") || "").toUpperCase().trim();
  const asunto = String(first(p, "asunto", "subject") || "");
  return ["PJ", "PROYECTO", "PROJECT"].includes(tipo) ||
    (!tipo && /\b(?:PJ|PROJECT|PROYECTO)\s*#?\s*\d{2,}\b/i.test(asunto));
};
const timestamp = (x) => date(dateOf(x))?.getTime() || 0;

const monthKey = (x) => {

  const d = date(dateOf(x));

  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "SIN_FECHA";

};

const monthLabel = (key) => key === "SIN_FECHA" ? "Sin fecha" : new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });



function useOrion(coleccion) {

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {

    setLoading(true);

    const unsubscribe = onSnapshot(collection(db, coleccion), (snapshot) => {

      setItems(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, _coleccion: coleccion })));

      setLoading(false);

      setError("");

    }, (err) => {

      setError(err.message);

      setLoading(false);

    });

    return () => unsubscribe();

  }, [coleccion]);

  return { items, loading, error };

}



function Summary({ items, filtered, salas }) {

  const avisos = items.reduce((n, x) => n + x.notificaciones.length, 0);

  return (

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>

      {[["Hojas únicas", items.length], ["Notificaciones", avisos], ["Salas", salas.length], ["Resultados", filtered.length]].map(([label, value]) => (

        <div key={label} style={card}>

          <div style={{ color: C.muted, fontSize: 13 }}>{label}</div>

          <strong style={{ fontSize: 28 }}>{value}</strong>

        </div>

      ))}

    </div>

  );

}



function Detail({ item, close }) {
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState("resumen");
  useEffect(() => { setActive(0); setTab("resumen"); }, [item?.key]);
  if (!item) return null;
  const correo = item.notificaciones[Math.min(active, item.notificaciones.length - 1)];
  const d = datosSF(correo);
  const rel = item.rel;
  const tabs = [["resumen","Resumen"],["proyectos","Proyectos y AF"],["maquinas","Máquinas"],["tc","Llamados TC"],["historial","Historial y original"]];
  return <div role="dialog" aria-modal="true" aria-label={`Detalle SF ${item.folio}`} style={{position:"fixed",inset:0,background:"#0F172AC7",zIndex:2000,display:"flex",justifyContent:"center",alignItems:"center",padding:16}} onClick={close}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:1050,maxHeight:"92vh",overflowY:"auto",background:"#F8FAFC",borderRadius:18,padding:22,boxShadow:"0 20px 60px #0F172A40"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div><div style={smallLabel}>HOJA DE SERVICIO · ORION</div><h2 style={{margin:"4px 0"}}>SF-{item.folio}</h2><div style={{color:C.muted}}>{item.sala} · {dateText(dateOf(item.principal))}</div></div>
        <button style={actionButton} onClick={close}>Cerrar ✕</button>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"20px 0"}}>{tabs.map(([id,nombre])=><button key={id} onClick={()=>setTab(id)} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${C.line}`,fontWeight:700,cursor:"pointer",background:tab===id?"#0891B2":"white",color:tab===id?"white":C.ink}}>{nombre}</button>)}</div>
      {tab==="resumen" && <div style={{display:"grid",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>{[["Fecha de servicio",d.fecha||"—"],["Entrada",d.entrada||"—"],["Salida",d.salida||"—"],["Duración",d.duracion]].map(([l,v])=><div key={l} style={panel}><div style={smallLabel}>{l}</div><strong style={{fontSize:20}}>{v}</strong></div>)}</div>
        <div style={panel}><div style={smallLabel}>Personal registrado</div><strong>{d.personal||"No identificado en esta notificación"}</strong></div>
        <div style={panel}><h3 style={{marginTop:0}}>Trazabilidad documental</h3><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><span>AF: <strong>{rel.af.join(", ")||"Sin referencia"}</strong></span><span>PJ: <strong>{rel.pj.join(", ")||"Sin referencia"}</strong></span><span>TC: <strong>{rel.tc.join(", ")||"Sin referencia"}</strong></span></div><p style={{fontSize:12,color:C.muted}}>Las referencias documentales no confirman por sí mismas el cierre de una actividad.</p></div>
        <div style={panel}><h3 style={{marginTop:0}}>Actividades registradas</h3><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{d.actividades.length?d.actividades.map((v,i)=><span key={i} style={{background:"#E0F2FE",borderRadius:8,padding:"7px 10px",fontSize:13}}>{v}</span>):<span style={{color:C.muted}}>Sin actividades identificadas</span>}</div></div>
        <div style={panel}><h3 style={{marginTop:0}}>Observaciones</h3><p style={{whiteSpace:"pre-wrap",marginBottom:0}}>{d.observaciones||"Sin observaciones identificadas"}</p></div>
      </div>}
              {tab==="proyectos" && <div style={{display:"grid",gap:14}}>
          <div style={panel}>
            <h3 style={{marginTop:0}}>Proyectos asociados ({rel.pj.length})</h3>
            {rel.pj.length ? rel.pj.map(pj => <div key={pj} style={{padding:"9px 0",borderBottom:`1px solid ${C.line}`}}><strong>PJ-{pj}</strong><div style={{fontSize:12,color:C.muted}}>Referencia documental detectada en la SF o su notificación.</div></div>) : <p style={{color:C.muted}}>Sin proyecto identificado en las notificaciones disponibles.</p>}
          </div>
          <div style={panel}>
            <h3 style={{marginTop:0}}>Actividades AF relacionadas ({rel.af.length})</h3>
            {rel.af.length ? rel.af.map(af => <div key={af} style={{padding:"9px 0",borderBottom:`1px solid ${C.line}`}}><strong>AF-{af}</strong><div style={{fontSize:12,color:C.muted}}>Referencia directa o a través de un PJ documentado.</div></div>) : <p style={{color:C.muted}}>No se identificó una AF asociada a esta SF.</p>}
          </div>
          <div style={panel}>
            <h3 style={{marginTop:0}}>Cierre de proyecto</h3>
            <p style={{color:C.muted,marginBottom:0}}>Esta SF contiene {rel.pj.length ? "referencias a proyecto" : "ninguna referencia de proyecto verificable"}. La vinculación documental no confirma por sí sola el cierre de un PJ. Consulta el contenido original y las observaciones de Orion para verificarlo.</p>
          </div>
        </div>}
{tab==="maquinas" && <div style={panel}><h3 style={{marginTop:0}}>Transferencia de máquinas ({d.transferencia.length})</h3>{d.transferencia.length?<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}><thead><tr>{["Categoría","Ubicación","Número de serie","Modelo","Juego"].map(t=><th key={t} style={{padding:10,textAlign:"left",background:"#E2E8F0"}}>{t}</th>)}</tr></thead><tbody>{d.transferencia.map((m,i)=><tr key={i} style={{borderTop:`1px solid ${C.line}`}}>{[m.categoria||m.texto,m.loc,m.serie,m.modelo,m.juego].map((v,j)=><td key={j} style={{padding:10}}>{v||"—"}</td>)}</tr>)}</tbody></table></div>:<p>No se identificaron movimientos estructurados en esta notificación. Puedes consultar el contenido original en Historial.</p>}</div>}
      {tab==="tc" && <div style={panel}><h3 style={{marginTop:0}}>Llamados técnicos atendidos ({item.subfolios.length})</h3>{item.subfolios.length?<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:650}}><thead><tr>{["Subfolio","Estado Orion","Atención","Documento","Consulta"].map(v=><th key={v} style={{textAlign:"left",padding:10,background:"#E2E8F0"}}>{v}</th>)}</tr></thead><tbody>{item.subfolios.map(r=><tr key={`${r.subfolio}-${r.sf}`} style={{borderTop:`1px solid ${C.line}`}}><td style={{padding:10}}>{r.subfolio}</td><td style={{padding:10}}>{r.estadoOrion}</td><td style={{padding:10}}>{r.estado==="CERRADO"?"CERRADO (FIXED)":"ATENDIDO, sin cierre FIXED"}</td><td style={{padding:10}}>SF {r.sf}</td><td style={{padding:10}}><Link to={`/llamados-tecnicos?tc=${encodeURIComponent(r.tc)}`}>Ver TC {r.tc} →</Link></td></tr>)}</tbody></table></div>:<p>No se identificaron subfolios en Technical calls Attended.</p>}<p style={{color:C.muted,fontSize:12}}>Solo FIXED confirma el cierre del subfolio.</p></div>}
      {tab==="historial" && <div style={{display:"grid",gap:12}}><div style={panel}><h3 style={{marginTop:0}}>Notificaciones ({item.notificaciones.length})</h3><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{item.notificaciones.map((n,i)=><button key={`${n._coleccion}-${n.id}`} onClick={()=>setActive(i)} style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${C.line}`,cursor:"pointer",background:active===i?"#0891B2":"#F1F5F9",color:active===i?"white":C.ink}}>{dateText(dateOf(n))} · {i+1}</button>)}</div></div><div style={panel}><strong>Asunto:</strong> {str(first(correo,"asunto","subject"))}<div style={{fontSize:12,color:C.muted,marginTop:8}}>Origen: {correo._coleccion} · Estado: {badgeState(correo)}</div><h3>Contenido original</h3><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontFamily:"inherit",fontSize:13}}>{str(bodyOf(correo))}</pre><details><summary>Datos técnicos originales</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{safeJson(correo)}</pre></details></div></div>}
    </div>
  </div>;
}

export default function HojasServicioPage() {

  const correos = useOrion("orion_correos");

  const anteriores = useOrion("orion_hojas_servicio");
  const proyectos = useOrion("orion_proyectos");
  const asignaciones = useOrion("orion_salas_zonas");

  const [search, setSearch] = useState("");

  const [room, setRoom] = useState("TODAS");
  const [zone, setZone] = useState("GLOBAL");
  const [savingZone, setSavingZone] = useState("");
  const [zoneError, setZoneError] = useState("");

  const [state, setState] = useState("TODOS");

  const [month, setMonth] = useState("");

  const [selected, setSelected] = useState(null);

  const [params] = useSearchParams();

  const sfSolicitada = params.get("sf");



  const afPorPJ = useMemo(() => {
    const indice = new Map();
    const documentos = [...proyectos.items, ...correos.items.filter(esProyecto)];
    for (const doc of documentos) {
      if (!esProyecto(doc)) continue;
      const pj = pjDeProyecto(doc);
      if (!pj) continue;
      if (!indice.has(pj)) indice.set(pj, new Set());
      for (const af of afDeProyecto(doc)) indice.get(pj).add(af);
    }
    return indice;
  }, [proyectos.items, correos.items]);

  const items = useMemo(() => {

    const importadas = correos.items.filter((x) => String(x.tipo || "").toUpperCase() === "SF");

    const all = [...importadas, ...anteriores.items];

    const groups = new Map();

    for (const x of all) {

      const f = folio(x);

      // Sin folio verificable, no agrupar registros distintos arbitrariamente.

      const key = f === "—" ? `${x._coleccion}:${x.id}` : f.replace(/^SF\s*#?\s*/i, "").trim();

      if (!groups.has(key)) groups.set(key, []);

      groups.get(key).push(x);

    }

    return [...groups.entries()].map(([key, notificaciones]) => {

      notificaciones.sort((a, b) => timestamp(b) - timestamp(a));

      const principal = notificaciones[0];

      const salas = notificaciones.map(sala).filter((s) => s !== "—");

      const subfoliosMap = new Map();

      for (const aviso of notificaciones) {

        for (const r of extraerSubfoliosSF(aviso)) {

          const previo = subfoliosMap.get(r.subfolio);

          if (!previo || (r.estado === "CERRADO" && previo.estado !== "CERRADO")) subfoliosMap.set(r.subfolio, r);

        }

      }

      const subfolios = [...subfoliosMap.values()].sort((a,b)=>a.subfolio.localeCompare(b.subfolio,"es",{numeric:true}));

      const pjRelacionados = unique(notificaciones.flatMap((n) => [...detected(n).pj, datosSF(n).proyecto].filter(Boolean)));
      const afDirectas = notificaciones.flatMap((n) => detected(n).af);
      const afRelacionadas = pjRelacionados.flatMap((pj) => [...(afPorPJ.get(numeroFolio(pj)) || [])]);
      return {

        key,

        subfolios,

        folio: folio(principal),

        principal,

        sala: salas[0] || "—",

        notificaciones,

        rel: {

          af: unique([...afDirectas, ...afRelacionadas]),

          pj: pjRelacionados,

          tc: unique([...notificaciones.flatMap((n) => detected(n).tc), ...subfolios.map(r=>r.subfolio)]),

        },

      };

    }).sort((a, b) => timestamp(b.principal) - timestamp(a.principal));

  }, [correos.items, anteriores.items, afPorPJ]);



  useEffect(() => {

    if (!sfSolicitada || correos.loading || anteriores.loading) return;

    const encontrada = items.find(x => String(x.folio) === sfSolicitada);

    if (encontrada) { setMonth("TODOS"); setRoom("TODAS"); setState("TODOS"); setSearch(""); setSelected(encontrada); }

  }, [sfSolicitada, items, correos.loading, anteriores.loading]);

  const loading = correos.loading || anteriores.loading || proyectos.loading || asignaciones.loading;

  const errors = [correos.error && `orion_correos: ${correos.error}`, anteriores.error && `orion_hojas_servicio: ${anteriores.error}`, proyectos.error && `orion_proyectos: ${proyectos.error}`, asignaciones.error && `orion_salas_zonas: ${asignaciones.error}`].filter(Boolean);

  // Clasificación visual compartida con AF: no cambia sala, asunto ni documentos Orion.
  const catalogo = useMemo(() => new Map(Object.entries(ZONAS_SALAS).flatMap(([z, nombres]) => nombres.map(n => [normalizarNombreSala(n), z]))), []);
  const asignadas = useMemo(() => {
    const mapa = new Map();
    for (const x of asignaciones.items) if (["TIJUANA","MEXICALI","PACIFICO"].includes(x.zona)) mapa.set(x.id, x.zona);
    return mapa;
  }, [asignaciones.items]);
  const zonaDe = (nombre) => {
    const clave = normalizarNombreSala(nombre);
    return asignadas.get(clave) || catalogo.get(clave) || null;
  };
  const guardarZona = async (nombre, zona) => {
    const clave = normalizarNombreSala(nombre);
    if (!clave || clave === "SIN SALA" || clave === "—" || !["TIJUANA","MEXICALI","PACIFICO"].includes(zona)) return;
    setSavingZone(clave);
    setZoneError("");
    try {
      await setDoc(doc(db, "orion_salas_zonas", clave), { nombreOrion: nombre, zona, actualizadoEn: serverTimestamp() }, { merge: true });
    } catch (e) { setZoneError(`No se pudo guardar la clasificación: ${e.message}`); }
    finally { setSavingZone(""); }
  };
  const enZona = (x) => zone === "GLOBAL" || (zone === "TODAS" ? Boolean(zonaDe(x.sala)) : zonaDe(x.sala) === zone);
  const pendientes = useMemo(() => new Set(items.filter(x => !zonaDe(x.sala)).map(x => normalizarNombreSala(x.sala))).size, [items, asignadas, catalogo]);
  const salas = useMemo(() => [...new Set(items.filter(enZona).map((x) => x.sala).filter((s) => s !== "—"))].sort(), [items, zone, asignadas, catalogo]);
  useEffect(() => { if (room !== "TODAS" && !salas.includes(room)) setRoom("TODAS"); }, [room, salas]);

  const states = useMemo(() => [...new Set(items.map((x) => badgeState(x.principal)))].sort(), [items]);

  const months = useMemo(() => [...new Set(items.map((x) => monthKey(x.principal)))].sort((a, b) => b.localeCompare(a)), [items]);

  useEffect(() => {

    if (months.length && (!month || (month !== "TODOS" && !months.includes(month)))) setMonth(months[0]);

  }, [months, month]);

  const monthlyItems = useMemo(() => items.filter((x) => (month === "TODOS" || monthKey(x.principal) === month) && enZona(x)), [items, month, zone, asignadas, catalogo]);

  const monthlySalas = useMemo(() => [...new Set(monthlyItems.map((x) => x.sala).filter((s) => s !== "—"))], [monthlyItems]);

  const filtered = useMemo(() => monthlyItems.filter((x) =>

    (room === "TODAS" || x.sala === room) &&

    (state === "TODOS" || badgeState(x.principal) === state) &&

    norm([x.folio, x.sala, badgeState(x.principal), ...x.notificaciones.map((n) => first(n, "asunto", "subject")), ...x.rel.af, ...x.rel.pj, ...x.rel.tc].join(" ")).includes(norm(search))

  ), [monthlyItems, room, state, search]);



  return (

    <div style={{ ...theme.layout.page, minHeight: "auto", color: C.ink }}>

      <div style={{ ...card, background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "white", marginBottom: 18 }}>

        <h1 style={{ margin: "0 0 8px" }}>📄 Hojas de Servicio — Orion</h1>

        <p style={{ color: "#CBD5E1", margin: 0 }}>Una ficha por SF, con todas sus notificaciones conservadas para auditoría. Consulta de solo lectura.</p>

      </div>

              <Summary items={monthlyItems} filtered={filtered} salas={monthlySalas} />
        <p style={{fontSize:13,color:C.muted,margin:"0 0 12px"}}>Salas sin clasificación en GLOBAL: <strong>{pendientes}</strong>. Puedes asignarlas directamente desde la tabla; se compartirán con Actividades AF.</p>

      <div style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>

        <select aria-label="Mes y año" style={field} value={month} onChange={(e) => setMonth(e.target.value)}>

          <option value="TODOS">Todos los meses</option>

          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}

        </select>

        <input aria-label="Buscar" style={{ ...field, flex: "1 1 260px" }} placeholder="Buscar SF, sala, AF, PJ o TC" value={search} onChange={(e) => setSearch(e.target.value)} />

                  <select aria-label="Zona" style={field} value={zone} onChange={(e) => {setZone(e.target.value);setRoom("TODAS");setSelected(null);}}>
            <option value="GLOBAL">GLOBAL — Todas las salas</option>
            <option value="TODAS">Todas mis zonas</option>
            <option value="TIJUANA">Tijuana</option>
            <option value="MEXICALI">Mexicali</option>
            <option value="PACIFICO">Pacífico</option>
          </select>
          <select aria-label="Sala" style={field} value={room} onChange={(e) => setRoom(e.target.value)}>

          <option value="TODAS">Todas las salas</option>

          {salas.map((s) => <option key={s} value={s}>{s}</option>)}

        </select>

        <select aria-label="Estado" style={field} value={state} onChange={(e) => setState(e.target.value)}>

          <option value="TODOS">Todos los estados</option>

          {states.map((s) => <option key={s} value={s}>{s}</option>)}

        </select>

      </div>

      <div style={{ fontWeight: 700, marginBottom: 12, color: C.ink }}>Período: {month === "TODOS" ? "Todos los meses" : month ? monthLabel(month) : "Cargando períodos"} · {filtered.length} resultados</div>

              {zoneError && <p role="alert" style={theme.message.error}>{zoneError}</p>}
        {errors.length > 0 && <p role="alert" style={theme.message.error}>Error de lectura: {errors.join(" | ")}</p>}

      {loading ? (

        <div style={card}>Cargando registros...</div>

      ) : filtered.length === 0 ? (

        <div style={card}>{items.length === 0 ? "Aún no hay hojas de servicio disponibles." : "No hay coincidencias en el mes y filtros seleccionados."}</div>

      ) : (

        <div style={{ ...card, overflowX: "auto", padding: 0 }}>

          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900, textAlign: "left" }}>

            <thead><tr style={{ background: "#F1F5F9" }}>

              {["Folio / avisos", "Sala / fecha", "Zona asignada", "Técnico", "Relaciones", "Estado", "Detalle"].map((h) => <th key={h} style={{ padding: 14 }}>{h}</th>)}

            </tr></thead>

            <tbody>{filtered.map((x) => (

              <tr key={x.key} style={{ borderTop: `1px solid ${C.line}` }}>

                <td style={{padding:14}}><strong>SF-{x.folio}</strong><div style={{fontSize:12,color:C.muted}}>{x.notificaciones.length} aviso(s)</div></td>
                  <td style={{padding:14}}><strong>{x.sala}</strong><div style={{fontSize:12,color:C.muted}}>{dateText(dateOf(x.principal))}</div></td>
                  <td style={{padding:14}}>
                    <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>{zonaDe(x.sala) || "Sin asignar"}</div>
                    {zone === "GLOBAL" && normalizarNombreSala(x.sala) && x.sala !== "—" && <select aria-label={`Clasificar sala ${x.sala}`} style={{...field,fontSize:12,padding:7}} value={zonaDe(x.sala)||""} disabled={savingZone === normalizarNombreSala(x.sala)} onChange={e => guardarZona(x.sala,e.target.value)}>
                      <option value="">Sin asignar</option><option value="TIJUANA">Tijuana</option><option value="MEXICALI">Mexicali</option><option value="PACIFICO">Pacífico</option>
                    </select>}
                  </td>
                  <td style={{padding:14,fontSize:13}}>{datosSF(x.principal).personal||"—"}</td>
                  <td style={{padding:14,fontSize:12}}><div>AF: {x.rel.af.join(", ")||"—"}</div><div>PJ: {x.rel.pj.join(", ")||"—"}</div><div>TC: {x.rel.tc.join(", ")||"—"}</div></td>
                  <td style={{padding:14}}><span style={{borderRadius:99,padding:"5px 9px",background:"#E0F2FE",color:C.cyan,fontSize:11,fontWeight:700}}>{badgeState(x.principal)}</span></td>
                  <td style={{padding:14}}><button style={actionButton} onClick={()=>setSelected(x)}>Ver detalle</button></td>
                </tr>

            ))}</tbody>

          </table>

        </div>

      )}

      <p style={{ fontSize: 12, color: C.muted, marginTop: 14 }}>Agrupación por SF sin eliminar correos. Solo FIXED en Technical calls Attended confirma cierre individual; otras referencias siguen siendo preliminares.</p>

      <Detail item={selected} close={() => setSelected(null)} />

    </div>

  );

}
