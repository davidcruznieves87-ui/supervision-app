import { useEffect, useMemo, useState } from "react";







import {







  collection,







  doc,











  onSnapshot,







  setDoc,







  serverTimestamp,







} from "firebase/firestore";







import { db, auth } from "../firebase";







import theme from "../styles/theme";



import { extraerDatosCorreoAF } from "../utils/parserCorreoAF";



import { crearIndiceAFProyectoSF, resolverAFProyectoSF } from "../utils/relacionesAFProyectoSF";



import { Link } from "react-router-dom";

import { ZONAS_SALAS, normalizarNombreSala } from "../utils/zonasSalas";















// Datos oficiales: orion_actividades (solo lectura).







// Datos editables de seguimiento: orion_actividades_seguimiento (documento con el mismo ID).







// Los permisos de lectura/escritura deben configurarse también en Firestore Rules.















const COLOR = {







  ink: theme.colors.text,







  muted: theme.colors.textLight,







  line: theme.colors.border,







  cyan: theme.colors.primaryHover,







  green: theme.colors.success,







  red: theme.colors.error,







  amber: theme.colors.warning,







  bg: theme.colors.background,







};







const card = { ...theme.card, marginBottom: 0 };







const field = { ...theme.input, marginTop: 0, marginBottom: 0 };







const button = { ...theme.button.primary, padding: "10px 16px", borderRadius: 12, fontSize: 13 };







const empty = (v) => v === undefined || v === null || v === "";







const txt = (v, fallback = "—") => {







  if (empty(v)) return fallback;







  if (typeof v === "string" || typeof v === "number") return String(v);







  if (typeof v === "boolean") return v ? "Sí" : "No";







  return fallback;







};







const pick = (obj, ...names) => {







  for (const n of names) if (!empty(obj?.[n])) return obj[n];







  return null;







};







const asDate = (value) => {







  if (!value) return null;







  if (typeof value.toDate === "function") return value.toDate();







  if (value instanceof Date) return value;







  if (typeof value === "object" && typeof value.seconds === "number") return new Date(value.seconds * 1000);







  const d = new Date(value);







  return Number.isNaN(d.getTime()) ? null : d;







};







const dateLabel = (value) => {







  const d = asDate(value);







  return d ? d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : txt(value);







};







const normalize = (v) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();







const arrayOf = (value) => Array.isArray(value) ? value : (empty(value) ? [] : [value]);







const folios = (value) => arrayOf(value).map((v) => {







  if (typeof v === "string" || typeof v === "number") return String(v);







  if (v && typeof v === "object") return txt(pick(v, "folio", "numero", "id"), "");







  return "";







}).filter(Boolean);







const status = (a) => {







  const s = normalize(pick(a, "estadoOrion", "estado", "estatus", "status"));







  if (a.afCancelada === true || /cancelad|cancelled|canceled/.test(s)) return "CANCELADA";







  if (/ejecutad|completad|finalizad|closed|cerrad/.test(s)) return "FINALIZADA (ORION)";







  if (/aprobad|approved/.test(s)) return "APROBADA";







  if (/pendient/.test(s)) return "PENDIENTE";







  return txt(pick(a, "estadoOrion", "estado", "estatus", "status"), "SIN ESTADO").toUpperCase();







};







const stateColor = (s) => s.includes("CANCEL") ? COLOR.red : s.includes("FINAL") ? COLOR.green : s.includes("APROB") ? COLOR.cyan : COLOR.amber;







const followDefaults = { fechaProgramada: "", horaProgramada: "", tecnicoResponsable: "", materialSolicitado: false, materialRecibido: false, clienteInformado: false, accesoConfirmado: false, tecnicosConfirmados: false, observaciones: "" };







const formDate = (v) => { const d = asDate(v); return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : (typeof v === "string" ? v.slice(0,10) : ""); };







const fromFollow = (f) => ({ ...followDefaults, ...f, fechaProgramada: formDate(f?.fechaProgramada) });







const displayPJ = (a) => folios(pick(a, "proyectos", "pjs", "pjRelacionados", "proyectosRelacionados", "pj", "proyecto"));







const displaySF = (a) => folios(pick(a, "hojasServicio", "hojasDeServicio", "sfRelacionadas", "sfRelacionados", "sf", "hojaServicio"));







// Relaciones documentales calculadas desde correos PJ/SF, sin modificar Firestore.



const mailBody = (x) => txt(pick(x, "contenidoOriginal", "cuerpo", "body", "descripcion", "detalle"), "");



const mailSubject = (x) => txt(pick(x, "asunto", "subject"), "");



const idNumber = (v) => String(v ?? "").match(/\d{2,}/)?.[0] || "";



const afNumber = (x) => idNumber(pick(x, "afId", "af", "folioAF", "folio")) ||



  (mailSubject(x).match(/\bAF\s*#?\s*(\d{2,})\b/i)?.[1] || "");



// Un correo de cancelación es una ALERTA, nunca una autorización de cancelación.
const esAvisoCancelacion = (x) => {
  const asunto = mailSubject(x);
  const estado = String(pick(x, "estadoOrion", "estado", "estatus", "status") || "");
  return x.afCancelada === true || /\b(cancelled|canceled|cancellation|cancelada|cancelado|cancelacion|cancelación)\b/i.test(`${asunto} ${estado}`);
};
const evidenciaCancelacion = (a) => {
  const avisos = (a._avisos || []).filter(x => String(x._origen) === "orion_correos" && afNumber(x) === afNumber(a));
  const cancelaciones = avisos.filter(esAvisoCancelacion);
  const aperturas = avisos.filter(x => !esAvisoCancelacion(x));
  // Sin ambos documentos no se propone una relación para aceptar.
  return { cancelaciones, aperturas, relacionada: Boolean(afNumber(a) && cancelaciones.length && aperturas.length), sinApertura: Boolean(afNumber(a) && cancelaciones.length && !aperturas.length) };
};
const estadoOperativo = (a, seg = {}) => {
  if (seg.cancelacionConfirmada === true) return "CANCELADA";
  if (seg.actividadCompletada === true) return "COMPLETADA";
  if (evidenciaCancelacion(a).cancelaciones.length && seg.cancelacionRechazada !== true) return "CANCELACIÓN POR REVISAR";
  return "EN SEGUIMIENTO";
};

const monthKey = (x) => { const d = asDate(pick(x, "fechaCorreo", "fechaRecepcion", "fecha", "fechaCreacion", "receivedTime")); return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` : "SIN_FECHA"; };



const monthLabel = (k) => k === "SIN_FECHA" ? "Sin fecha" : new Date(Number(k.slice(0,4)),Number(k.slice(5,7))-1,1).toLocaleDateString("es-MX",{month:"long",year:"numeric"});



function crearIndiceRelaciones(correos, proyectos) {



  const indice = crearIndiceAFProyectoSF(correos, proyectos);



  return (af) => {



    const numero = afNumber(af);



    const propios = folios(pick(af, "proyectos", "pjs", "pjRelacionados", "proyectosRelacionados", "pj", "proyecto"));



    const documentos = [...(af._avisos || []), af];



    const encontrados = resolverAFProyectoSF(indice, numero, documentos, propios);



    return {



      ...encontrados,



      // Compatibilidad con el diseño existente.



      pj: encontrados.proyectos.map(x => x.folio),



      sf: encontrados.hojas.map(x => ({...x, folio:x.folio})),



    };



  };



}







// Requisitos verificables. La SF debe citar un PJ relacionado con la AF.
const requisitosCierre = (a, rel, seguimiento = {}) => {
  const proyectos = (rel?.pj || []).map(String);
  const hojasVinculadas = (rel?.sf || []).filter(sf =>
    (sf.porPJ || []).some(pj => proyectos.includes(String(pj)))
  );
  const sfElegida = hojasVinculadas.find(sf => String(sf.folio) === String(seguimiento.sfCierreValidada || ""));
  const criterios = [
    { etiqueta: "AF registrada", ok: Boolean(afNumber(a)) },
    { etiqueta: "Proyecto PJ relacionado", ok: proyectos.length > 0 },
    { etiqueta: "SF vinculada explícitamente al PJ", ok: hojasVinculadas.length > 0 },
    { etiqueta: "Cierre de proyecto verificado en la SF", ok: Boolean(sfElegida && seguimiento.cierreDocumentalVerificado === true) },
  ];
  return {
    criterios, hojasVinculadas,
    avance: Math.round(criterios.filter(c => c.ok).length / criterios.length * 100),
    listo: criterios.every(c => c.ok) && seguimiento.cancelacionConfirmada !== true && !evidenciaCancelacion(a).cancelaciones.length,
  };
};

const pill = (text, color) => <span style={{ display: "inline-block", borderRadius: 99, background: `${color}15`, color, padding: "5px 10px", fontSize: 12, fontWeight: 800 }}>{text}</span>;















export default function ActividadesPage() {







  const [actividadesHistoricas, setActividadesHistoricas] = useState([]);







  const [seguimientos, setSeguimientos] = useState({});







  const [loading, setLoading] = useState(true);







  const [error, setError] = useState("");







  const [errorSeguimiento, setErrorSeguimiento] = useState("");







  const [busqueda, setBusqueda] = useState("");



  const [mes, setMes] = useState("");



  const [correosOrion, setCorreosOrion] = useState([]);



  const [proyectosOrion, setProyectosOrion] = useState([]);

  const [asignacionesZona, setAsignacionesZona] = useState({});

  const [errorZonas, setErrorZonas] = useState("");

  const [guardandoZona, setGuardandoZona] = useState("");



  const [errorRelaciones, setErrorRelaciones] = useState("");







  const [filtroEstado, setFiltroEstado] = useState("TODAS");
  const [filtroEjecucion, setFiltroEjecucion] = useState("PENDIENTES");







  const [filtroSala, setFiltroSala] = useState("TODAS");

  const [filtroZona, setFiltroZona] = useState("TODAS");







  const [seleccionado, setSeleccionado] = useState(null);







  const [edicion, setEdicion] = useState(false);







  const [form, setForm] = useState(followDefaults);







  const [guardando, setGuardando] = useState(false);
  const [sfCierre, setSfCierre] = useState("");
  const [cierreVerificado, setCierreVerificado] = useState(false);







  const [mensaje, setMensaje] = useState("");















  useEffect(() => {







    const off = onSnapshot(collection(db, "orion_actividades"), (snap) => {







      const data = snap.docs.map((d) => ({ ...d.data(), id: d.id }));







      data.sort((a, b) => (asDate(pick(b, "fechaCorreo", "fechaRecepcion", "fecha", "fechaCreacion"))?.getTime() || 0) - (asDate(pick(a, "fechaCorreo", "fechaRecepcion", "fecha", "fechaCreacion"))?.getTime() || 0));







      setActividadesHistoricas(data); setError(""); setLoading(false);







    }, (e) => { setError(`No se pudieron consultar las actividades Orion: ${e.message}`); setLoading(false); });







    return () => off();







  }, []);















  useEffect(() => {







    const off = onSnapshot(collection(db, "orion_actividades_seguimiento"), (snap) => {







      const data = {}; snap.forEach((d) => { data[d.id] = d.data(); });







      setSeguimientos(data); setErrorSeguimiento("");







    }, (e) => setErrorSeguimiento(`Seguimiento no disponible: ${e.message}`));







    return () => off();







  }, []);















  useEffect(() => {



    const off1 = onSnapshot(collection(db,"orion_correos"), snap => {



      setCorreosOrion(snap.docs.map(d=>({...d.data(),id:d.id})));



      setErrorRelaciones("");



    }, e => setErrorRelaciones(`No se pudo leer orion_correos: ${e.message}`));



    const off2 = onSnapshot(collection(db,"orion_proyectos"), snap => {



      setProyectosOrion(snap.docs.map(d=>({...d.data(),id:d.id})));



    }, e => setErrorRelaciones(prev => [prev,`No se pudo leer orion_proyectos: ${e.message}`].filter(Boolean).join(" | ")));



    return () => {off1();off2();};



  }, []);



  // Asignaciones administrativas para filtros, independientes de los documentos Orion.

  useEffect(() => {

    const off = onSnapshot(collection(db, "orion_salas_zonas"), snap => {

      const data = {};

      snap.forEach(d => { const v = d.data(); if (["TIJUANA", "MEXICALI", "PACIFICO"].includes(v.zona)) data[d.id] = v.zona; });

      setAsignacionesZona(data);

      setErrorZonas("");

    }, e => setErrorZonas(`No se pudieron leer las asignaciones: ${e.message}`));

    return () => off();

  }, []);





  const guardarAsignacion = async (nombreSala, zona) => {

    const clave = normalizarNombreSala(nombreSala);

    if (!clave || clave === "SIN SALA" || !["TIJUANA", "MEXICALI", "PACIFICO"].includes(zona)) return;

    setGuardandoZona(clave);

    setErrorZonas("");

    try {

      await setDoc(doc(db, "orion_salas_zonas", clave), {

        nombreOrion: nombreSala,

        zona,

        actualizadoEn: serverTimestamp(),

      }, { merge: true });

    } catch (e) {

      setErrorZonas(`No se pudo asignar la sala: ${e.message}`);

    } finally {

      setGuardandoZona("");

    }

  };



  // AF importadas por Windows: orion_correos es el origen operativo.



  // Se conserva la colección histórica y se agrupa por folio sin borrar avisos.



  const items = useMemo(() => {



    const groups = new Map();



    const fuentes = [



      ...actividadesHistoricas.map(x => ({...x, _origen: "orion_actividades"})),



      ...correosOrion.filter(x => String(x.tipo || "").trim().toUpperCase() === "AF")



        .map(x => ({...x, _origen: "orion_correos"}))



    ];



    for (const x of fuentes) {



      const n = afNumber(x);



      const key = n ? `AF-${n}` : `${x._origen}:${x.id}`;



      if (!groups.has(key)) groups.set(key, []);



      groups.get(key).push(x);



    }



    return [...groups.values()].map(group => {



      group.sort((a,b) => (asDate(pick(b,"fechaCorreo","fechaRecepcion","fecha","fechaCreacion","receivedTime"))?.getTime() || 0) - (asDate(pick(a,"fechaCorreo","fechaRecepcion","fecha","fechaCreacion","receivedTime"))?.getTime() || 0));



      const principal = group[0];



      const historica = group.find(x => x._origen === "orion_actividades");



      const numero = afNumber(principal) || afNumber(historica);



      const salaConocida = group.map(x=>pick(x,"sala","sitio","nombreSala")).find(v=>v && String(v).trim());



      const asunto = group.map(x=>pick(x,"asunto","subject")).find(Boolean);



      const parsed = group.map(x => extraerDatosCorreoAF(mailBody(x)));



      const detail = {};



      for (const part of parsed) for (const [key,value] of Object.entries(part)) {



        if (Array.isArray(value)) { if (value.length > (detail[key]?.length || 0)) detail[key] = value; }



        else if (value && !detail[key]) detail[key] = value;



      }



      const merged = { ...principal, ...(historica || {}) };



      for (const [key,value] of Object.entries(detail)) if (!merged[key] || (Array.isArray(merged[key]) && !merged[key].length)) merged[key] = value;



      const subjectRoom = String(asunto || "").match(/AF\s+(?:Approved|Created|New|Cancelled|Canceled)\s*-\s*(.+?)\s*-\s*\d+\s*$/i)?.[1];



      return {



        ...merged,



        id: historica?.id || `correo_AF_${numero || principal.id}`,



        af: numero || pick(principal,"af","folio"),



        sala: salaConocida || detail.sala || subjectRoom || "",



        asunto: asunto || "",



        fechaCorreo: pick(principal,"fechaCorreo","fechaRecepcion","fecha","fechaCreacion","receivedTime"),



        _avisos: group,



      };



    }).sort((a,b)=>(asDate(a.fechaCorreo)?.getTime()||0)-(asDate(b.fechaCorreo)?.getTime()||0)).reverse();



  }, [correosOrion, actividadesHistoricas]);



  const relacionar = useMemo(() => crearIndiceRelaciones(correosOrion, [...proyectosOrion,...correosOrion.filter(x=>String(x.tipo||"").toUpperCase()==="PJ")]),[correosOrion,proyectosOrion]);



  const relaciones = useMemo(() => new Map(items.map(a=>[a.id,relacionar(a)])),[items,relacionar]);



  const meses = useMemo(() => [...new Set(items.map(monthKey))].sort((a,b)=>b.localeCompare(a)),[items]);



  useEffect(() => {if(meses.length && (!mes || (mes!=="TODOS" && !meses.includes(mes)))) setMes(meses[0]);},[meses,mes]);



  // La sala de Orion nunca se altera: solo se consulta su zona para filtrar.

  const salaOriginal = (a) => txt(pick(a, "sala", "sitio", "nombreSala"), "SIN SALA");

  const catalogoZona = useMemo(() => {

    const indice = new Map();

    for (const [zona, nombres] of Object.entries(ZONAS_SALAS)) {

      for (const nombre of nombres) indice.set(normalizarNombreSala(nombre), zona);

    }

    return indice;

  }, []);

  // La asignación manual tiene prioridad y puede corregir una zona de catálogo.

  const zonaDeSala = (nombre) => {

    const clave = normalizarNombreSala(nombre);

    return asignacionesZona[clave] || catalogoZona.get(clave) || null;

  };

  const perteneceAZona = (a) => {

    if (filtroZona === "GLOBAL") return true;

    const zona = zonaDeSala(salaOriginal(a));

    return filtroZona === "TODAS" ? Boolean(zona) : zona === filtroZona;

  };

  const fueraDelCatalogo = (a) => !zonaDeSala(salaOriginal(a));

  const salasPermitidas = useMemo(() => Object.keys(asignacionesZona), [asignacionesZona]);



  const mesItems = useMemo(() => items.filter(a =>

    (mes === "TODOS" || monthKey(a) === mes) && perteneceAZona(a)

  ), [items, mes, salasPermitidas, filtroZona, catalogoZona]);



  const salas = useMemo(() => [...new Set(items

    .filter(perteneceAZona)

    .map(salaOriginal))].sort((a,b)=>a.localeCompare(b,"es")), [items, salasPermitidas, filtroZona, catalogoZona]);



  useEffect(() => {

    if (filtroSala !== "TODAS" && !salas.includes(filtroSala)) setFiltroSala("TODAS");

  }, [salas, filtroSala]);







  const estados = useMemo(() => [...new Set(items.map(status))].sort(), [items]);







  const filtradas = useMemo(() => mesItems.filter((a) => {







    if (filtroEstado !== "TODAS" && status(a) !== filtroEstado) return false;
    const completada = seguimientos[a.id]?.actividadCompletada === true;
    if (filtroEjecucion === "PENDIENTES" && (completada || seguimientos[a.id]?.cancelacionConfirmada === true)) return false;
    if (filtroEjecucion === "CANCELADAS" && seguimientos[a.id]?.cancelacionConfirmada !== true) return false;
    if (filtroEjecucion === "POR_CANCELAR" && !(evidenciaCancelacion(a).cancelaciones.length && !completada && seguimientos[a.id]?.cancelacionConfirmada !== true && seguimientos[a.id]?.cancelacionRechazada !== true)) return false;
    if (filtroEjecucion === "COMPLETADAS" && !completada) return false;







    if (filtroSala !== "TODAS" && txt(pick(a, "sala", "sitio", "nombreSala"), "SIN SALA") !== filtroSala) return false;







    const rel = relaciones.get(a.id) || {pj:[],sf:[]};



    const texto = [a.af, a.folio, a.sala, a.sitio, a.asunto, a.tipoActividad, a.motivo, ...rel.pj, ...rel.sf.map(x=>x.folio)].join(" ");







    return normalize(texto).includes(normalize(busqueda));







  }), [mesItems, relaciones, busqueda, filtroEstado, filtroSala, filtroEjecucion, seguimientos]);







  const completadasZona = useMemo(() => mesItems.filter(a => seguimientos[a.id]?.actividadCompletada === true), [mesItems, seguimientos]);

  const exportarCompletadas = () => {
    const registros = completadasZona.filter(a => filtroSala === "TODAS" || salaOriginal(a) === filtroSala);
    const cabeceras = ["AF", "Sala", "Zona", "Proyecto PJ", "Hoja SF", "SF cierre", "Completada por", "Fecha completada", "Observaciones"];
    const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const filas = registros.map(a => {
      const seg = seguimientos[a.id] || {};
      const rel = relaciones.get(a.id) || {pj:[],sf:[]};
      return [ `AF-${afNumber(a)}`, salaOriginal(a), zonaDeSala(salaOriginal(a)) || "SIN ASIGNAR", rel.pj.join("; "), rel.sf.map(x=>x.folio).join("; "), seg.sfAlCompletar || seg.sfCierreValidada || "", seg.completadaPorCorreo || "", dateLabel(seg.completadaEn), seg.observaciones || "" ];
    });
    const contenido = "\uFEFF" + [cabeceras, ...filas].map(row=>row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([contenido], {type:"text/csv;charset=utf-8;"}));
    const enlace = document.createElement("a"); enlace.href = url;
    enlace.download = `AF_Completadas_${filtroZona}_${mes || "TODOS"}.csv`;
    document.body.appendChild(enlace); enlace.click(); enlace.remove();
    URL.revokeObjectURL(url);
  };

  const abrir = (a) => {
    const seg = seguimientos[a.id] || {};
    setSeleccionado(a); setForm(fromFollow(seg)); setEdicion(false); setMensaje("");
    setSfCierre(seg.sfCierreValidada || "");
    setCierreVerificado(seg.cierreDocumentalVerificado === true);
  };







  const cerrar = () => { if (!guardando) { setSeleccionado(null); setEdicion(false); setMensaje(""); } };







  const guardar = async () => {







    if (!seleccionado || guardando) return;







    setGuardando(true); setMensaje("");







    try {







      await setDoc(doc(db, "orion_actividades_seguimiento", seleccionado.id), {







        ...form,







        fechaActualizacion: serverTimestamp(),







        actividadOrionId: seleccionado.id,







      }, { merge: true });







      setMensaje("Seguimiento interno guardado."); setEdicion(false);







    } catch (e) { setMensaje(`No se pudo guardar: ${e.message}`); }







    finally { setGuardando(false); }







  };







  const guardarCierreDocumental = async () => {
    if (!seleccionado || guardando) return;
    const rel = relaciones.get(seleccionado.id);
    const disponibles = requisitosCierre(seleccionado, rel).hojasVinculadas;
    if (!sfCierre || !disponibles.some(x => String(x.folio) === String(sfCierre)) || !cierreVerificado) {
      setMensaje("Selecciona una SF vinculada al PJ y confirma que su contenido acredita el cierre."); return;
    }
    if (seguimientos[seleccionado.id]?.cancelacionConfirmada || evidenciaCancelacion(seleccionado).cancelaciones.length) { setMensaje("Hay una cancelación confirmada o pendiente de revisión."); return; }
    setGuardando(true); setMensaje("");
    try {
      await setDoc(doc(db, "orion_actividades_seguimiento", seleccionado.id), {
        actividadOrionId: seleccionado.id,
        sfCierreValidada: String(sfCierre), cierreDocumentalVerificado: true,
        cierreValidadoPorUid: auth.currentUser?.uid || "",
        cierreValidadoPorCorreo: auth.currentUser?.email || "",
        cierreValidadoEn: serverTimestamp(), fechaActualizacion: serverTimestamp(),
      }, { merge: true });
      setMensaje("Cierre documental registrado. Ya puedes completar la actividad.");
    } catch (e) { setMensaje(`No se pudo verificar el cierre: ${e.message}`); }
    finally { setGuardando(false); }
  };

  const decidirCancelacion = async (aceptar) => {
    if (!seleccionado || guardando) return;
    const evidencia = evidenciaCancelacion(seleccionado);
    const seg = seguimientos[seleccionado.id] || {};
    if (!evidencia.cancelaciones.length || !afNumber(seleccionado) || seg.actividadCompletada === true || seg.cancelacionConfirmada === true) return;
    if (!auth.currentUser?.uid) { setMensaje("Inicia sesión para validar la cancelación."); return; }
    const verbo = aceptar ? "ACEPTAR la cancelación" : "RECHAZAR la relación";
    if (!window.confirm(`¿Confirmas ${verbo} de AF-${afNumber(seleccionado)}?`)) return;
    setGuardando(true); setMensaje("");
    try {
      await setDoc(doc(db, "orion_actividades_seguimiento", seleccionado.id), {
        actividadOrionId: seleccionado.id,
        cancelacionConfirmada: aceptar,
        cancelacionRechazada: !aceptar,
        cancelacionFolioAF: afNumber(seleccionado),
        cancelacionCorreos: evidencia.cancelaciones.map(x => x.id),
        cancelacionSinApertura: evidencia.sinApertura,
        cancelacionTipoValidacion: evidencia.sinApertura ? "MANUAL_SIN_APERTURA" : "RELACION_APERTURA_CANCELACION",
        aperturaCorreos: evidencia.aperturas.map(x => x.id),
        cancelacionValidadaPorUid: auth.currentUser.uid,
        cancelacionValidadaPorCorreo: auth.currentUser.email || "",
        cancelacionValidadaEn: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
      }, { merge: true });
      setMensaje(aceptar ? "Cancelación confirmada; AF trasladada al historial de canceladas." : "Relación rechazada; la AF permanece en seguimiento.");
    } catch (e) { setMensaje(`No se pudo registrar la decisión: ${e.message}`); }
    finally { setGuardando(false); }
  };

  const completarActividad = async () => {
    if (!seleccionado || guardando) return;
    const seg = seguimientos[seleccionado.id] || {};
    const req = requisitosCierre(seleccionado, relaciones.get(seleccionado.id), seg);
    if (!req.listo || seg.actividadCompletada === true || seg.cancelacionConfirmada === true) return;
    if (!auth.currentUser?.uid) { setMensaje("Debes iniciar sesión para confirmar la ejecución."); return; }
    if (!window.confirm(`¿Confirmas que la AF-${afNumber(seleccionado)} fue ejecutada y completada?`)) return;
    setGuardando(true); setMensaje("");
    try {
      await setDoc(doc(db, "orion_actividades_seguimiento", seleccionado.id), {
        actividadOrionId: seleccionado.id, actividadCompletada: true,
        completadaPorUid: auth.currentUser.uid,
        completadaPorCorreo: auth.currentUser.email || "",
        completadaEn: serverTimestamp(), fechaActualizacion: serverTimestamp(),
        pjAlCompletar: (relaciones.get(seleccionado.id)?.pj || []).map(String),
        sfAlCompletar: seg.sfCierreValidada,
      }, { merge: true });
      setMensaje("Actividad marcada como completada correctamente.");
    } catch (e) { setMensaje(`No se pudo completar la actividad: ${e.message}`); }
    finally { setGuardando(false); }
  };

  const toggle = (name) => setForm((p) => ({ ...p, [name]: !p[name] }));







  const update = (name, value) => setForm((p) => ({ ...p, [name]: value }));















  return <div style={{ ...theme.layout.page, minHeight: "100%", color: COLOR.ink }}>







    <div style={{ ...card, background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "white", marginBottom: 20 }}>







      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>📋 Actividades Orion</h1>







      <p style={{ marginBottom: 0, color: "#CBD5E1" }}>AF recibidas exclusivamente por correo. Proyectos y hojas de servicio vinculados cuando Orion aporta la relación.</p>







    </div>







    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12, marginBottom: 20 }}>







      {[["AF del mes", mesItems.length], ["Con proyecto PJ", mesItems.filter((a) => (relaciones.get(a.id)?.pj.length||0)>0).length], ["Sin zona", mesItems.filter(a => fueraDelCatalogo(a)).length], ["Con hoja SF", mesItems.filter((a) => (relaciones.get(a.id)?.sf.length||0)>0).length], ["Canceladas", mesItems.filter((a) => seguimientos[a.id]?.cancelacionConfirmada === true).length], ["Completadas", completadasZona.length], ["Pendientes de cierre", mesItems.filter(a => seguimientos[a.id]?.actividadCompletada !== true && seguimientos[a.id]?.cancelacionConfirmada !== true).length], ["Resultados", filtradas.length]].map(([k, v]) => <div key={k} style={card}><div style={{ fontSize: 12, color: COLOR.muted }}>{k}</div><strong style={{ fontSize: 26 }}>{v}</strong></div>)}







    </div>







    <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 18 }}>



      <select aria-label="Mes y año" style={field} value={mes} onChange={e=>setMes(e.target.value)}>



        <option value="TODOS">Todos los meses</option>



        {meses.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}



      </select>







      <input aria-label="Buscar actividad" placeholder="Buscar AF, PJ, SF, sala o asunto" style={field} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />







        <select aria-label="Filtrar zona" style={field} value={filtroZona} onChange={(e) => { setFiltroZona(e.target.value); setFiltroSala("TODAS"); setSeleccionado(null); }}>

          <option value="GLOBAL">GLOBAL — Todas las AF nacionales</option>

            <option value="TODAS">Todas mis zonas (69 salas)</option>

          <option value="TIJUANA">Tijuana</option>

          <option value="MEXICALI">Mexicali</option>

          <option value="PACIFICO">Pacífico</option>

        </select>

        <select aria-label="Filtrar sala" style={field} value={filtroSala} onChange={(e) => setFiltroSala(e.target.value)}><option value="TODAS">{filtroZona === "GLOBAL" ? "Todas las salas (global)" : "Todas las salas de la zona"}</option>{salas.map((s) => <option key={s} value={s}>{s}</option>)}</select>







      <select aria-label="Filtrar ejecución" style={field} value={filtroEjecucion} onChange={e => { setFiltroEjecucion(e.target.value); if (["COMPLETADAS", "CANCELADAS", "POR_CANCELAR"].includes(e.target.value)) setMes("TODOS"); }}>
        <option value="PENDIENTES">Pendientes / En seguimiento (predeterminado)</option>
        <option value="COMPLETADAS">Historial de completadas</option>
        <option value="POR_CANCELAR">Cancelaciones por revisar</option>
        <option value="CANCELADAS">Historial de canceladas</option>
        <option value="TODAS">Todas las actividades</option>
      </select>
      <button type="button" style={{...button, background:COLOR.ink}} onClick={exportarCompletadas} disabled={!completadasZona.length}>
        Descargar completadas CSV ({completadasZona.length})
      </button>

      <select aria-label="Filtrar estado" style={field} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}><option value="TODAS">Todos los estados</option>{estados.map((s) => <option key={s}>{s}</option>)}</select>







    </div>







    {error && <p role="alert" style={{ color: COLOR.red }}>{error}</p>}







    {errorZonas && <p role="alert" style={{ color: COLOR.red }}>{errorZonas}</p>}

    {errorRelaciones && <p role="alert" style={{ color: COLOR.amber }}>{errorRelaciones}</p>}

    {errorSeguimiento && <p role="alert" style={{ color: COLOR.amber }}>{errorSeguimiento} (La consulta de AF sigue disponible.)</p>}







    <div style={{ ...card, overflowX: "auto" }}>







      {loading ? <p>Cargando actividades...</p> : filtradas.length === 0 ? <p style={{ color: COLOR.muted, textAlign: "center" }}>{items.length ? "No hay actividades que coincidan con los filtros." : "No se encontraron AF en orion_correos ni en orion_actividades."}</p> : <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}>







        <thead><tr>{["Fecha", "AF", "Sala", "Zona asignada", "Proyecto PJ", "Hoja SF", "Ejecución", "Estado Orion", "Detalle"].map((h) => <th key={h} style={{ textAlign: "left", padding: 11, borderBottom: `1px solid ${COLOR.line}`, fontSize: 12, color: COLOR.muted }}>{h}</th>)}</tr></thead>







        <tbody>{filtradas.map((a) => <tr key={a.id}>







          <td style={{ padding: 11, borderBottom: `1px solid ${COLOR.line}`, whiteSpace: "nowrap" }}>{dateLabel(pick(a, "fechaCorreo", "fechaRecepcion", "fecha", "fechaCreacion"))}</td>







          <td style={{ padding: 11, borderBottom: `1px solid ${COLOR.line}`, fontWeight: 800 }}>AF-{txt(pick(a, "af", "folio"))}</td>







          <td style={{ padding: 11, borderBottom: `1px solid ${COLOR.line}` }}>{txt(pick(a, "sala", "sitio", "nombreSala"))}{filtroZona === "GLOBAL" && fueraDelCatalogo(a) && <div style={{fontSize:11,color:COLOR.amber,fontWeight:700,marginTop:4}}>Fuera del catálogo</div>}</td>







          <td style={{ padding: 11, borderBottom: `1px solid ${COLOR.line}` }}>

            <div style={{fontSize:12,fontWeight:700}}>{zonaDeSala(salaOriginal(a)) || "SIN ASIGNAR"}</div>

            {filtroZona === "GLOBAL" && normalizarNombreSala(salaOriginal(a)) !== "SIN SALA" &&

              <select aria-label={`Asignar zona a ${salaOriginal(a)}`} style={{...field,marginTop:5,padding:6,fontSize:12,maxWidth:155}}

                value={zonaDeSala(salaOriginal(a)) || ""}

                disabled={Boolean(guardandoZona)}

                onChange={e => guardarAsignacion(salaOriginal(a), e.target.value)}>

                <option value="">Asignar zona...</option>

                <option value="TIJUANA">Tijuana</option>

                <option value="MEXICALI">Mexicali</option>

                <option value="PACIFICO">Pacífico</option>

              </select>}

          </td>

          <td style={{ padding: 11, borderBottom: `1px solid ${COLOR.line}` }}>{relaciones.get(a.id)?.pj.join(", ") || "—"}</td>







          <td style={{ padding: 11, borderBottom: `1px solid ${COLOR.line}` }}>{relaciones.get(a.id)?.sf.map(x=>x.folio).join(", ") || "—"}</td>







          <td style={{ padding: 11, borderBottom: `1px solid ${COLOR.line}` }}>
            {seguimientos[a.id]?.actividadCompletada === true
              ? <><span style={{fontWeight:800,color:COLOR.green}}>✓ COMPLETADA</span><div style={{fontSize:11,color:COLOR.muted}}>{dateLabel(seguimientos[a.id]?.completadaEn)}</div></>
              : seguimientos[a.id]?.cancelacionConfirmada === true ? pill("CANCELADA · VALIDADA", COLOR.red)
              : evidenciaCancelacion(a).cancelaciones.length && seguimientos[a.id]?.cancelacionRechazada !== true ? pill(evidenciaCancelacion(a).sinApertura ? "⚠ CANCELACIÓN SIN APERTURA" : "⚠ CANCELACIÓN POR REVISAR", COLOR.amber)
              : pill(requisitosCierre(a, relaciones.get(a.id), seguimientos[a.id] || {}).listo ? "LISTA PARA COMPLETAR" : "EN SEGUIMIENTO", COLOR.amber)}
          </td>
          <td style={{ padding: 11, borderBottom: `1px solid ${COLOR.line}` }}>{pill(status(a), stateColor(status(a)))}</td>







          <td style={{ padding: 11, borderBottom: `1px solid ${COLOR.line}` }}><button style={button} onClick={() => abrir(a)}>Ver actividad</button></td>







        </tr>)}</tbody>







      </table>}







    </div>







    <p style={{ fontSize: 12, color: COLOR.muted, marginTop: 12 }}>Las AF se consultan desde orion_correos y orion_actividades. Las relaciones son documentales y no confirman ejecución ni cierre. El seguimiento interno se guarda por separado.</p>















    {seleccionado && <div role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,.72)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>







      <div role="dialog" aria-modal="true" aria-label="Detalle de actividad Orion" style={{ ...theme.card, background: theme.colors.card, width: "min(860px,100%)", maxHeight: "92vh", overflowY: "auto", marginBottom: 0, boxSizing: "border-box" }}>







        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><h2 style={{ margin: 0 }}>AF-{txt(pick(seleccionado, "af", "folio"))}</h2><button onClick={cerrar} style={{ ...button, background: COLOR.ink }}>Cerrar</button></div>







        <p>{pill(status(seleccionado), stateColor(status(seleccionado)))}</p>







        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 16 }}>







          {[["Sala", pick(seleccionado, "sala", "sitio", "nombreSala")], ["Actividad", pick(seleccionado, "tipoActividad", "actividad")], ["Proyecto PJ", relaciones.get(seleccionado.id)?.pj.join(", ")], ["Hojas SF", relaciones.get(seleccionado.id)?.sf.map(x=>x.folio).join(", ")], ["Fecha correo", dateLabel(pick(seleccionado, "fechaCorreo", "fechaRecepcion", "fecha"))], ["Fecha límite", dateLabel(seleccionado.fechaLimite)], ["Cliente", seleccionado.cliente], ["Razón", pick(seleccionado, "razon", "motivo")], ["Protocolo", seleccionado.protocolo], ["Solicitante", seleccionado.solicitante], ["Contacto", seleccionado.contacto], ["Correo", seleccionado.correo], ["Teléfono", seleccionado.telefono], ["Operador", seleccionado.operador]].map(([k,v]) => <div key={k} style={{ ...card, padding: 12 }}><div style={{ fontSize: 12, color: COLOR.muted }}>{k}</div><div style={{ overflowWrap: "anywhere" }}>{txt(v)}</div></div>)}







        </div>







          {(() => {
            const seg = seguimientos[seleccionado.id] || {};
            const evidencia = evidenciaCancelacion(seleccionado);
            if (!evidencia.cancelaciones.length) return null;
            return <section style={{...card,marginBottom:16,border:`1px solid ${COLOR.amber}`}}>
              <h3 style={{marginTop:0}}>Aviso de cancelación Orion</h3>
              <p>AF-{afNumber(seleccionado)} · Aperturas: {evidencia.aperturas.length} · Correos de cancelación: {evidencia.cancelaciones.length}</p>
              <p style={{fontSize:13,color:COLOR.muted}}>{evidencia.sinApertura ? "Se recibió un aviso de cancelación con folio AF, pero no se localizó el correo de apertura. Puedes confirmar manualmente la cancelación tras revisar la evidencia." : "El correo se relacionó por el mismo folio. La cancelación NO se aplica sin confirmación del operador."}</p>
              {evidencia.cancelaciones.map(x=><div key={x.id} style={{padding:8,borderBottom:`1px solid ${COLOR.line}`}}>
                <strong>{mailSubject(x) || "Correo de cancelación"}</strong>
                <div style={{fontSize:12,color:COLOR.muted}}>{dateLabel(pick(x,"fechaCorreo","fechaRecepcion","fecha","receivedTime"))} · ID: {x.id}</div>
              </div>)}
              {seg.cancelacionConfirmada ? <p style={{color:COLOR.red,fontWeight:800}}>CANCELACIÓN CONFIRMADA por {txt(seg.cancelacionValidadaPorCorreo)} · {dateLabel(seg.cancelacionValidadaEn)}</p>
                : seg.cancelacionRechazada ? <p style={{color:COLOR.muted}}>Relación rechazada por {txt(seg.cancelacionValidadaPorCorreo)}. La actividad continúa en seguimiento.</p>
                : evidencia.cancelaciones.length > 0 && seg.actividadCompletada !== true ? <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:12}}>
                    <button type="button" style={{...button,background:COLOR.red}} disabled={guardando} onClick={()=>decidirCancelacion(true)}>{evidencia.sinApertura ? "Confirmar cancelación manual (sin apertura)" : "Confirmar cancelación"}</button>
                    <button type="button" style={{...button,background:COLOR.muted}} disabled={guardando} onClick={()=>decidirCancelacion(false)}>Rechazar relación</button>
                  </div> : <p style={{color:COLOR.amber}}>La AF ya está completada o no cuenta con un folio verificable; no se permite cancelar.</p>}
            </section>;
          })()}

          {(() => {
            const seg = seguimientos[seleccionado.id] || {};
            const req = requisitosCierre(seleccionado, relaciones.get(seleccionado.id), seg);
            const completada = seg.actividadCompletada === true;
            return <section style={{ ...card, marginBottom: 16, border: `1px solid ${COLOR.line}` }}>
              <h3 style={{ marginTop: 0 }}>Control de ejecución y cierre AF</h3>
              <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}>
                <strong>{completada ? "COMPLETADA" : req.listo ? "LISTA PARA COMPLETAR" : "EN SEGUIMIENTO"}</strong>
                <strong>{req.avance}%</strong>
              </div>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={req.avance}
                style={{height:12,background:"#E2E8F0",borderRadius:99,overflow:"hidden",margin:"12px 0"}}>
                <div style={{width:`${req.avance}%`,height:"100%",background:completada?COLOR.green:COLOR.cyan,transition:"width .2s"}} />
              </div>
              {req.criterios.map(c => <div key={c.etiqueta} style={{padding:"7px 0",display:"flex",gap:10,alignItems:"center"}}>
                <span style={{color:c.ok?COLOR.green:COLOR.amber}}>{c.ok?"✓":"○"}</span>{c.etiqueta}
              </div>)}
              {completada ? <p style={{color:COLOR.green,fontWeight:800}}>
                Confirmada por {txt(seg.completadaPorCorreo)} · {dateLabel(seg.completadaEn)}
              </p> : <>
                <p style={{fontSize:12,color:COLOR.muted}}>Selecciona la SF cuyo contenido confirme expresamente el cierre del proyecto. La vinculación por folio no confirma por sí sola la ejecución.</p>
                <label style={{display:"block",marginBottom:10}}>SF de cierre vinculada al proyecto
                  <select style={{...field,display:"block",width:"100%"}} value={sfCierre} disabled={guardando || Boolean(seg.cierreDocumentalVerificado)}
                    onChange={e=>{setSfCierre(e.target.value);setCierreVerificado(false);}}>
                    <option value="">Selecciona la SF que acredita el cierre</option>
                    {req.hojasVinculadas.map(sf=><option key={sf.folio} value={sf.folio}>SF {sf.folio} · PJ {sf.porPJ.join(", ")}</option>)}
                  </select>
                </label>
                <label style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:12}}>
                  <input type="checkbox" checked={Boolean(seg.cierreDocumentalVerificado) || cierreVerificado}
                    disabled={guardando || Boolean(seg.cierreDocumentalVerificado) || !sfCierre}
                    onChange={e=>setCierreVerificado(e.target.checked)}/>
                  He revisado la SF y confirmo que documenta el cierre del proyecto correspondiente.
                </label>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button type="button" style={{...button,opacity:guardando || seg.cierreDocumentalVerificado?0.5:1}}
                    disabled={guardando || Boolean(seg.cierreDocumentalVerificado) || !sfCierre || !cierreVerificado}
                    onClick={guardarCierreDocumental}>Verificar cierre documental</button>
                  <button type="button" style={{...button,background:req.listo?COLOR.green:COLOR.muted,opacity:req.listo?1:0.55}}
                    disabled={guardando || !req.listo} onClick={completarActividad}>
                    {req.listo?"Marcar como completada":"🔒 Completar (requisitos pendientes)"}
                  </button>
                </div>
              </>}
              {(seg.cancelacionConfirmada || evidenciaCancelacion(seleccionado).cancelaciones.length > 0) && <p style={{color:COLOR.red}}>Aviso de cancelación detectado o cancelación confirmada: no se permite completar.</p>}
            </section>;
          })()}

        <div style={{ ...card, marginBottom: 16 }}>



          <h3 style={{ marginTop: 0 }}>Trazabilidad AF → PJ → SF</h3>



          {(() => {



            const rel = relaciones.get(seleccionado.id) || { proyectos: [], hojas: [] };



            return <>



              <p style={{ fontSize: 13, color: COLOR.muted }}>Las relaciones se basan en folios explícitos en correos de Orion. Una SF relacionada no confirma por sí sola la ejecución del proyecto.</p>



              <strong>Proyectos relacionados ({rel.proyectos.length})</strong>



              {rel.proyectos.length ? rel.proyectos.map(p => <div key={p.folio} style={{padding:"9px 0",borderBottom:`1px solid ${COLOR.line}`}}>



                <strong>PJ {p.folio}</strong> · {p.fuentes.map(f=>f.motivo).filter((x,i,a)=>a.indexOf(x)===i).join("; ")}



                <div style={{fontSize:12,color:COLOR.muted}}>Documentos de respaldo: {p.fuentes.map(f=>f.documento).join(", ")}</div>



              </div>) : <p style={{color:COLOR.muted}}>Sin proyecto identificado en los correos disponibles.</p>}



              <strong>Hojas de servicio relacionadas ({rel.hojas.length})</strong>



              {rel.hojas.length ? rel.hojas.map(sf => <div key={sf.folio} style={{padding:"9px 0",borderBottom:`1px solid ${COLOR.line}`}}>



                <Link to={`/hojas-servicio?sf=${encodeURIComponent(sf.folio)}`} style={{color:COLOR.cyan,fontWeight:800}}>Abrir SF {sf.folio} ↗</Link>



                <span style={{marginLeft:10,fontSize:12,color:COLOR.muted}}>{sf.porPJ.length ? `Por PJ ${sf.porPJ.join(", ")}` : "Por AF explícita"}</span>



                <div style={{fontSize:12,color:COLOR.muted}}>Origen: {sf.fuentes.join(", ")} · Ejecución: PENDIENTE DE VERIFICACIÓN</div>



              </div>) : <p style={{color:COLOR.muted}}>Sin SF vinculada mediante referencia documental.</p>}



            </>;



          })()}



        </div>







        <div style={{ ...card, marginBottom: 16 }}><strong>Asunto original</strong><p style={{ overflowWrap: "anywhere" }}>{txt(seleccionado.asunto)}</p><strong>Descripción / indicaciones</strong><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{txt(pick(seleccionado, "descripcion", "indicacionesEspeciales", "detalle"))}</p></div>







        <div style={{ ...card, marginBottom: 16 }}>



          <h3 style={{ marginTop: 0 }}>Terminales de la actividad ({seleccionado.terminales?.length || 0})</h3>



          {seleccionado.terminales?.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>



            <thead><tr>{["SN", "VLT", "LOC", "Juego actual", "Juego nuevo"].map(h=><th key={h} style={{ textAlign:"left", padding:9, borderBottom:`1px solid ${COLOR.line}` }}>{h}</th>)}</tr></thead>



            <tbody>{seleccionado.terminales.map((t,i)=><tr key={`${t.sn}-${i}`}>{[t.sn,t.vlt,t.loc,t.juegoActual,t.juegoNuevo].map((v,j)=><td key={j} style={{padding:9,borderBottom:`1px solid ${COLOR.line}`}}>{txt(v)}</td>)}</tr>)}</tbody>



          </table></div> : <p style={{ color: COLOR.muted }}>No se detectaron terminales en los correos disponibles.</p>}



          <strong>Indicaciones especiales</strong>



          <p style={{ whiteSpace:"pre-wrap" }}>{txt(seleccionado.indicacionesEspeciales)}</p>



        </div>



        <div style={{ ...card, background: COLOR.bg }}>







          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><h3 style={{ margin: 0 }}>Seguimiento interno</h3>{!edicion && <button style={button} onClick={() => { setForm(fromFollow(seguimientos[seleccionado.id])); setEdicion(true); setMensaje(""); }}>Editar seguimiento</button>}</div>







          {edicion ? <>







            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginTop: 15 }}>







              <label>Fecha programada<input type="date" style={field} value={form.fechaProgramada} onChange={(e) => update("fechaProgramada", e.target.value)} /></label>







              <label>Hora programada<input type="time" style={field} value={form.horaProgramada} onChange={(e) => update("horaProgramada", e.target.value)} /></label>







              <label>Responsable / técnico<input style={field} value={form.tecnicoResponsable} onChange={(e) => update("tecnicoResponsable", e.target.value)} placeholder="Nombre de referencia" /></label>







            </div>







            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 8, marginTop: 15 }}>







              {[["materialSolicitado", "Material solicitado"], ["materialRecibido", "Material recibido"], ["clienteInformado", "Cliente informado"], ["accesoConfirmado", "Acceso confirmado"], ["tecnicosConfirmados", "Técnicos confirmados"]].map(([key,label]) => <label key={key}><input type="checkbox" checked={Boolean(form[key])} onChange={() => toggle(key)} /> {label}</label>)}







            </div>







            <label style={{ display: "block", marginTop: 14 }}>Observaciones internas<textarea style={{ ...field, minHeight: 85, resize: "vertical" }} value={form.observaciones} onChange={(e) => update("observaciones", e.target.value)} /></label>







            <div style={{ display: "flex", gap: 10, marginTop: 14 }}><button disabled={guardando} style={{ ...button, opacity: guardando ? .5 : 1 }} onClick={guardar}>{guardando ? "Guardando..." : "Guardar seguimiento"}</button><button disabled={guardando} style={{ ...button, background: COLOR.muted }} onClick={() => setEdicion(false)}>Cancelar</button></div>







          </> : <div style={{ marginTop: 12, fontSize: 14 }}>







            <p><strong>Programación:</strong> {txt(seguimientos[seleccionado.id]?.fechaProgramada)} {txt(seguimientos[seleccionado.id]?.horaProgramada, "")}</p>







            <p><strong>Responsable:</strong> {txt(seguimientos[seleccionado.id]?.tecnicoResponsable)}</p>







            <p><strong>Material solicitado:</strong> {txt(seguimientos[seleccionado.id]?.materialSolicitado)} · <strong>Recibido:</strong> {txt(seguimientos[seleccionado.id]?.materialRecibido)}</p>







            <p><strong>Cliente informado:</strong> {txt(seguimientos[seleccionado.id]?.clienteInformado)} · <strong>Acceso:</strong> {txt(seguimientos[seleccionado.id]?.accesoConfirmado)} · <strong>Técnicos confirmados:</strong> {txt(seguimientos[seleccionado.id]?.tecnicosConfirmados)}</p>







            <p style={{ whiteSpace: "pre-wrap" }}><strong>Observaciones:</strong> {txt(seguimientos[seleccionado.id]?.observaciones)}</p>







          </div>}







          {mensaje && <p role="status" style={{ color: mensaje.startsWith("No se") ? COLOR.red : COLOR.green }}>{mensaje}</p>}







        </div>







      </div>







    </div>}







  </div>;







}
