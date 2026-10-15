import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import theme from "../styles/theme";
import { ZONAS_SALAS, normalizarNombreSala } from "../utils/zonasSalas";

// Vista de consulta Orion. No escribe ni elimina documentos de Firestore.
const COLECCION = "orion_correos";

// Solo correos clasificados SUP. Si no existe tipo, se acepta un prefijo SUP en el asunto.
const esSUP = (data) => {
  const tipo = primero(data.tipo, data.tipoCorreo).trim().toUpperCase();
  if (tipo) return tipo === "SUP" || tipo === "SUPERVISION" || tipo === "SUPERVISIÓN";
  return /^\s*(?:\[?SUP\]?|SUPERVISI[ÓO]N)\b[\s:#-]*/i.test(primero(data.asunto, data.subject, data.titulo));
};

const folioSUP = (data) => {
  const directo = primero(data.folioSUP, data.supId, data.sup, data.folio, data.folioOrion, data.codigo, data.numeroReporte);
  if (directo) return directo;
  const asunto = primero(data.asunto, data.subject, data.titulo);
  return asunto.match(/\bSUP\s*[#:-]?\s*(\d{3,})\b/i)?.[1] || "";
};

const texto = (valor) => {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "string" || typeof valor === "number") return String(valor);
  return "";
};

const primero = (...valores) => valores.map(texto).find((v) => v.trim()) || "";

const fechaValida = (valor) => {
  if (!valor) return null;
  try {
    const d = typeof valor?.toDate === "function" ? valor.toDate() :
      typeof valor?.seconds === "number" ? new Date(valor.seconds * 1000) :
      valor instanceof Date ? valor : new Date(valor);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const formatearFecha = (fecha) => fecha
  ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(fecha)
  : "Sin fecha";

const mesClave = (fecha) => fecha
  ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
  : "";

const normalizar = (id, data) => {
  const fecha = fechaValida(data.fechaEvento) || fechaValida(data.fechaCorreo) || fechaValida(data.fechaRecepcion) ||
    fechaValida(data.fechaHora) || fechaValida(data.fecha) || fechaValida(data.fechaCreacion) || fechaValida(data.receivedTime) || fechaValida(data.createdAt);
  return {
    id,
    raw: data,
    folio: folioSUP(data),
    sala: primero(data.sala, data.sitio, data.nombreSala, data.hall),
    estado: primero(data.estado, data.estatus, data.status, "RECIBIDO"),
    asunto: primero(data.asunto, data.subject, data.titulo),
    contenido: primero(data.contenidoOriginal, data.cuerpo, data.body, data.descripcion, data.detalle),
    remitente: primero(data.remitente, data.sender),
    fecha,
    fechaRecepcion: fechaValida(data.fechaRecepcion),
    fechaImportacion: fechaValida(data.fechaImportacion),
  };
};

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 14, marginBottom: 20 },
  kpi: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18, boxShadow: "0 3px 12px rgba(15,23,42,.04)" },
  card: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 20, marginBottom: 18 },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 },
  control: { width: "100%", boxSizing: "border-box", border: "1px solid #CBD5E1", borderRadius: 9, padding: "10px 12px", fontSize: 14, background: "#fff", color: "#0F172A" },
  th: { textAlign: "left", padding: "13px 12px", fontSize: 12, color: "#64748B", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" },
  td: { padding: "13px 12px", fontSize: 13, color: "#334155", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" },
};

export default function SupervisionesPage() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [salaFiltro, setSalaFiltro] = useState("");
  const [mesFiltro, setMesFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [zonaFiltro, setZonaFiltro] = useState("GLOBAL");
  const [asignacionesZona, setAsignacionesZona] = useState({});
  const [errorZonas, setErrorZonas] = useState("");
  const [guardandoZona, setGuardandoZona] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLECCION),
      (snapshot) => {
        const lista = snapshot.docs
          .filter((doc) => esSUP(doc.data()))
          .map((doc) => normalizar(doc.id, doc.data()));
        lista.sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0));
        // Una supervisión por folio; sin folio conservamos el documento individual.
        const vistos = new Set();
        const unicos = lista.filter((r) => {
          const clave = r.folio ? `sup:${r.folio.trim().toUpperCase()}` : `doc:${r.id}`;
          if (vistos.has(clave)) return false;
          vistos.add(clave);
          return true;
        });
        setRegistros(unicos);
        setCargando(false);
        setError("");
      },
      (err) => {
        console.error("Error consultando supervisiones Orion:", err);
        setError(err?.code === "permission-denied"
          ? "Tu cuenta no tiene permiso para consultar las supervisiones de Orion."
          : "No fue posible consultar las supervisiones de Orion. Revisa la conexión y la configuración de Firestore.");
        setCargando(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Misma colección y normalización utilizadas por AF y SF.
  useEffect(() => {
    const off = onSnapshot(collection(db, "orion_salas_zonas"), snap => {
      const mapa = {};
      snap.forEach(d => {
        const zona = d.data()?.zona;
        if (["TIJUANA", "MEXICALI", "PACIFICO"].includes(zona)) mapa[d.id] = zona;
      });
      setAsignacionesZona(mapa);
      setErrorZonas("");
    }, e => setErrorZonas(`No se pudieron consultar las zonas: ${e.message}`));
    return () => off();
  }, []);

  const catalogo = useMemo(() => {
    const mapa = new Map();
    Object.entries(ZONAS_SALAS).forEach(([zona, nombres]) =>
      nombres.forEach(nombre => mapa.set(normalizarNombreSala(nombre), zona)));
    return mapa;
  }, []);
  const zonaDe = nombre => {
    const clave = normalizarNombreSala(nombre);
    return asignacionesZona[clave] || catalogo.get(clave) || "";
  };
  const guardarZona = async (nombre, zona) => {
    const clave = normalizarNombreSala(nombre);
    if (!clave || clave === "SIN SALA" || !["TIJUANA", "MEXICALI", "PACIFICO"].includes(zona)) return;
    setGuardandoZona(clave);
    setErrorZonas("");
    try {
      await setDoc(doc(db, "orion_salas_zonas", clave), {
        nombreOrion: nombre, zona, actualizadoEn: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      setErrorZonas(`No se pudo guardar la clasificación: ${e.message}`);
    } finally { setGuardandoZona(""); }
  };
  const coincideZona = r => zonaFiltro === "GLOBAL" ||
    (zonaFiltro === "TODAS" ? Boolean(zonaDe(r.sala)) :
      zonaFiltro === "SIN_CLASIFICAR" ? !zonaDe(r.sala) : zonaDe(r.sala) === zonaFiltro);
  const salas = useMemo(() => [...new Set(registros.filter(coincideZona).map(r => r.sala).filter(Boolean))].sort(), [registros, zonaFiltro, asignacionesZona, catalogo]);
  useEffect(() => { if (salaFiltro && !salas.includes(salaFiltro)) setSalaFiltro(""); }, [salas, salaFiltro]);
  const salasSinClasificar = useMemo(() => new Set(registros.filter(r => !zonaDe(r.sala)).map(r => normalizarNombreSala(r.sala)).filter(Boolean)).size, [registros, asignacionesZona, catalogo]);
  const estados = useMemo(() => [...new Set(registros.map((r) => r.estado).filter(Boolean))].sort(), [registros]);
  const meses = useMemo(() => [...new Set(registros.map((r) => mesClave(r.fecha)).filter(Boolean))].sort().reverse(), [registros]);

  const filtrados = useMemo(() => registros.filter((r) => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    const coincide = !q || [r.folio, r.sala, r.asunto, r.estado].some((v) => v.toLocaleLowerCase("es").includes(q));
    return coincide && coincideZona(r) && (!salaFiltro || r.sala === salaFiltro) &&
      (!mesFiltro || mesClave(r.fecha) === mesFiltro) &&
      (!estadoFiltro || r.estado === estadoFiltro);
  }), [registros, busqueda, salaFiltro, mesFiltro, estadoFiltro, zonaFiltro, asignacionesZona, catalogo]);

  const totalMesActual = registros.filter((r) => mesClave(r.fecha) === mesClave(new Date())).length;
  const limpiar = () => { setZonaFiltro("GLOBAL"); setBusqueda(""); setSalaFiltro(""); setMesFiltro(""); setEstadoFiltro(""); };

  return (
    <div style={{ ...theme.layout.page, minHeight: "100%" }}>
      <div style={theme.layout.content}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ ...theme.title, marginBottom: 6 }}>📋 Supervisiones Orion</h1>
          <p style={{ margin: 0, color: "#64748B", fontSize: 14 }}>
            Seguimiento de reportes SUP recibidos desde Orion · Consulta de solo lectura
          </p>
        </div>

        <div style={styles.grid}>
          {[
            ["Reportes registrados", registros.length, "Total disponible en Orion"],
            ["Reportes del mes", totalMesActual, "Según fecha del reporte"],
            ["Salas identificadas", salas.length, "Salas distintas"],
            ["Resultados filtrados", filtrados.length, "Según los filtros activos"],
            ["Salas sin clasificar", salasSinClasificar, "Pendientes de asignación"],
          ].map(([titulo, valor, subtitulo]) => (
            <div key={titulo} style={styles.kpi}>
              <div style={{ color: "#64748B", fontSize: 13, fontWeight: 700 }}>{titulo}</div>
              <div style={{ color: "#0F172A", fontSize: 31, fontWeight: 800, margin: "9px 0 4px" }}>{valor}</div>
              <div style={{ color: "#94A3B8", fontSize: 12 }}>{subtitulo}</div>
            </div>
          ))}
        </div>

        <section style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, color: "#0F172A", margin: 0 }}>Buscar supervisiones</h2>
            <button type="button" onClick={limpiar} style={{ border: "1px solid #CBD5E1", background: "#F8FAFC", borderRadius: 9, padding: "9px 13px", cursor: "pointer" }}>Limpiar filtros</button>
          </div>
          {errorZonas && <p role="alert" style={{color:"#B91C1C",fontSize:13}}>{errorZonas}</p>}
          <p style={{fontSize:12,color:"#64748B",margin:"0 0 12px"}}>GLOBAL incluye todas las salas, incluso las no clasificadas. La clasificación es compartida con AF y SF.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <label><span style={styles.label}>Zona</span><select style={styles.control} value={zonaFiltro} onChange={e => setZonaFiltro(e.target.value)}>
              <option value="GLOBAL">GLOBAL — Todas las salas</option>
              <option value="TODAS">Todas mis zonas</option>
              <option value="TIJUANA">TIJUANA</option>
              <option value="MEXICALI">MEXICALI</option>
              <option value="PACIFICO">PACÍFICO</option>
              <option value="SIN_CLASIFICAR">Sin clasificar</option>
            </select></label>
            <label><span style={styles.label}>Buscar folio, sala o asunto</span><input style={styles.control} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." /></label>
            <label><span style={styles.label}>Sala</span><select style={styles.control} value={salaFiltro} onChange={(e) => setSalaFiltro(e.target.value)}><option value="">Todas las salas</option>{salas.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label><span style={styles.label}>Mes</span><select style={styles.control} value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}><option value="">Todos los meses</option>{meses.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
            <label><span style={styles.label}>Estado</span><select style={styles.control} value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}><option value="">Todos los estados</option>{estados.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
          </div>
        </section>

        <section style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "17px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <strong style={{ color: "#0F172A" }}>Reportes SUP</strong>
            <span style={{ color: "#64748B", fontSize: 13 }}>{filtrados.length} resultado(s)</span>
          </div>
          {cargando ? <p style={{ padding: 22, color: "#64748B" }}>Consultando registros de Orion...</p> :
            error ? <p role="alert" style={{ padding: 22, color: "#B91C1C" }}>{error}</p> :
            !filtrados.length ? (
              <div style={{ padding: "42px 20px", textAlign: "center", color: "#64748B" }}>
                <div style={{ fontSize: 35, marginBottom: 9 }}>📭</div>
                <strong style={{ color: "#334155" }}>{registros.length ? "No hay resultados para estos filtros" : "Aún no hay supervisiones importadas"}</strong>
                <p style={{ fontSize: 13 }}>La información aparecerá cuando existan correos clasificados como SUP en orion_correos.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#F8FAFC" }}><tr>
                    {["Fecha", "Folio", "Sala", "Zona / Clasificar", "Estado", "Asunto", "Detalle"].map((c) => <th key={c} style={styles.th}>{c}</th>)}
                  </tr></thead>
                  <tbody>{filtrados.map((r) => <tr key={r.id}>
                    <td style={{ ...styles.td, whiteSpace: "nowrap" }}>{formatearFecha(r.fecha)}</td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{r.folio || "Sin folio"}</td>
                    <td style={styles.td}>{r.sala || "Sin sala"}</td>
                    <td style={styles.td}>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:5}}>{zonaDe(r.sala) || "Sin clasificar"}</div>
                      {zonaFiltro === "GLOBAL" && normalizarNombreSala(r.sala) &&
                        <select aria-label={`Clasificar sala ${r.sala}`} style={{...styles.control,fontSize:12,padding:6}}
                          value={zonaDe(r.sala)} disabled={guardandoZona === normalizarNombreSala(r.sala)}
                          onChange={e => guardarZona(r.sala,e.target.value)}>
                          <option value="">Asignar zona...</option>
                          <option value="TIJUANA">TIJUANA</option>
                          <option value="MEXICALI">MEXICALI</option>
                          <option value="PACIFICO">PACÍFICO</option>
                        </select>}
                    </td>
                    <td style={styles.td}><span style={{ display: "inline-block", borderRadius: 20, background: "#E0F2FE", color: "#075985", fontSize: 11, fontWeight: 700, padding: "5px 10px" }}>{r.estado}</span></td>
                    <td style={{ ...styles.td, maxWidth: 320, overflowWrap: "anywhere" }}>{r.asunto || "Sin asunto"}</td>
                    <td style={styles.td}><button type="button" onClick={() => setSeleccionado(r)} style={{ background: "#0891B2", color: "#fff", border: 0, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 700 }}>Ver detalle</button></td>
                  </tr>)}</tbody>
                </table>
              </div>
            )}
        </section>

        {seleccionado && (
          <div role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSeleccionado(null); }} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,.65)", display: "flex", justifyContent: "center", alignItems: "center", padding: 18 }}>
            <div role="dialog" aria-modal="true" aria-label="Detalle de supervisión Orion" style={{ background: "#fff", borderRadius: 18, width: "min(760px, 100%)", maxHeight: "88vh", overflowY: "auto", padding: 24, boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 18 }}>
                <div><h2 style={{ margin: 0, color: "#0F172A" }}>Detalle de supervisión</h2><p style={{ color: "#64748B", margin: "6px 0 0" }}>Folio: {seleccionado.folio || "No identificado"}</p></div>
                <button type="button" onClick={() => setSeleccionado(null)} aria-label="Cerrar detalle" style={{ border: 0, background: "#F1F5F9", borderRadius: 9, padding: "8px 12px", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
                {[["Sala", seleccionado.sala], ["Fecha del reporte", formatearFecha(seleccionado.fecha)], ["Estado", seleccionado.estado], ["Remitente", seleccionado.remitente], ["Fecha de recepción", formatearFecha(seleccionado.fechaRecepcion)], ["Fecha de importación", formatearFecha(seleccionado.fechaImportacion)]].map(([k, v]) => (
                  <div key={k}><div style={styles.label}>{k}</div><div style={{ color: "#0F172A", overflowWrap: "anywhere" }}>{v || "No disponible"}</div></div>
                ))}
              </div>
              <div style={{ marginBottom: 18 }}><div style={styles.label}>Asunto original</div><div style={{ overflowWrap: "anywhere" }}>{seleccionado.asunto || "No disponible"}</div></div>
              <div style={{ marginBottom: 18 }}><div style={styles.label}>Contenido del reporte</div><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit", fontSize: 13, lineHeight: 1.6, background: "#F8FAFC", border: "1px solid #E2E8F0", padding: 15, borderRadius: 10, maxHeight: 300, overflowY: "auto" }}>{seleccionado.contenido || "El documento todavía no contiene el texto original del correo."}</pre></div>
              <details><summary style={{ cursor: "pointer", fontWeight: 700, color: "#334155" }}>Ver campos disponibles del registro (diagnóstico)</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12, background: "#F8FAFC", padding: 14, borderRadius: 10 }}>{JSON.stringify(seleccionado.raw, (_k, v) => typeof v?.toDate === "function" ? v.toDate().toISOString() : v, 2)}</pre></details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
