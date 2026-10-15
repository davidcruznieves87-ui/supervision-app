import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import theme from "../styles/theme";

const MINUTOS_HEARTBEAT = 3;
const fecha = (v) => {
  if (!v) return null;
  const d = typeof v.toDate === "function" ? v.toDate() : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fechaTexto = (v) => fecha(v)?.toLocaleString("es-MX") || "Sin información";
const fechaMs = (v) => fecha(v)?.getTime() || 0;
const mb = (bytes) => (Number(bytes || 0) / 1048576).toFixed(2);
const texto = (v) => String(v || "").trim();
const normal = (v) => texto(v).toUpperCase();
const borde = theme.colors.border || "#E2E8F0";
const tenue = theme.colors.textLight || "#64748B";
const verde = theme.colors.success || "#22C55E";
const rojo = theme.colors.error || "#EF4444";
const ambar = theme.colors.warning || "#F59E0B";
const td = { padding: "11px 12px", borderBottom: `1px solid ${borde}`, verticalAlign: "top" };
const th = { ...td, textAlign: "left", color: tenue, fontSize: 12, whiteSpace: "nowrap" };
const boton = { ...theme.button.primary, padding: "8px 12px", cursor: "pointer" };
const bloque = { ...theme.card, marginBottom: 20 };

function estadoColor(estado) {
  return ["ENVIADO", "ENVIO_EXITOSO"].includes(normal(estado)) ? verde :
    ["ERROR", "REQUIERE_ATENCION"].includes(normal(estado)) ? rojo : ambar;
}

function obtenerIdentidad(registro) {
  // Los documentos de archivos_envio guardan EquipoId permanente.
  // Los de auditoría antiguos guardan principalmente el nombre Windows.
  const id = texto(registro.equipoOrigenId || registro.equipoId);
  const nombre = texto(registro.equipoOrigenWindows || registro.equipoOrigenNombre || registro.equipo);
  if (id) return { clave: `id:${id}`, id, nombre: nombre || id };
  if (nombre) return { clave: `nombre:${normal(nombre)}`, id: "", nombre };
  return null;
}

function construirEquipos({ reservas, envios, eventos, estadoSistema }) {
  const equipos = new Map();
  const registrar = (origen, registro, fechaActividad, tipo) => {
    const identidad = obtenerIdentidad(registro);
    if (!identidad) return;
    let actual = equipos.get(identidad.clave);
    if (!actual) {
      actual = { ...identidad, ultimaActividad: null, tipoActividad: "", lotes: 0, archivos: 0, eventos: 0, ultimaReserva: null };
      equipos.set(identidad.clave, actual);
    }
    if (fechaMs(fechaActividad) > fechaMs(actual.ultimaActividad)) {
      actual.ultimaActividad = fechaActividad;
      actual.tipoActividad = tipo;
    }
    if (origen === "lote") actual.lotes++;
    if (origen === "archivo") { actual.archivos++; actual.ultimaReserva = registro.estado || ""; }
    if (origen === "evento") actual.eventos++;
  };
  reservas.forEach((r) => registrar("archivo", r, r.fechaEnvio || r.fechaReserva, "Reserva global"));
  envios.forEach((r) => registrar("lote", r, r.fechaActualizacion || r.fechaCreacion, "Auditoría de lote"));
  eventos.forEach((r) => registrar("evento", r, r.fechaUtc, r.tipoEvento || "Evento"));
  if (estadoSistema) registrar("heartbeat", estadoSistema, estadoSistema.ultimoContacto, "Heartbeat compartido");

  // Si un EquipoId tiene el mismo nombre Windows que un registro antiguo,
  // asociamos ambos sin asumir que dos nombres diferentes sean el mismo PC.
  const conIdPorNombre = new Map();
  for (const e of equipos.values()) if (e.id) {
    const k = normal(e.nombre);
    if (!conIdPorNombre.has(k)) conIdPorNombre.set(k, []);
    conIdPorNombre.get(k).push(e);
  }
  for (const [clave, e] of [...equipos.entries()]) {
    if (e.id) continue;
    const candidatos = conIdPorNombre.get(normal(e.nombre)) || [];
    if (candidatos.length !== 1) continue;
    const destino = candidatos[0];
    destino.lotes += e.lotes;
    destino.archivos += e.archivos;
    destino.eventos += e.eventos;
    if (fechaMs(e.ultimaActividad) > fechaMs(destino.ultimaActividad)) {
      destino.ultimaActividad = e.ultimaActividad;
      destino.tipoActividad = e.tipoActividad;
    }
    equipos.delete(clave);
  }
  // Ocultar únicamente identidades de simulación de la vista de equipos.
  // No se borran documentos de Firestore ni se modifica el historial de envíos.
  return [...equipos.values()]
    .filter((e) => !normal(e.nombre).startsWith("SIMULACION_BETA3") &&
      !normal(e.id).startsWith("SIM-BETA3-"))
    .sort((a, b) => fechaMs(b.ultimaActividad) - fechaMs(a.ultimaActividad));
}

function Tarjeta({ titulo, valor, detalle }) {
  return <div style={{ ...theme.card, flex: "1 1 180px", minWidth: 170 }}>
    <div style={{ fontSize: 12, color: tenue, fontWeight: 700 }}>{titulo}</div>
    <div style={{ fontSize: 27, fontWeight: 800, marginTop: 6 }}>{valor}</div>
    <div style={{ fontSize: 12, color: tenue, marginTop: 5 }}>{detalle}</div>
  </div>;
}

export default function AuditoriaCorreosPage() {
  const [estadoSistema, setEstadoSistema] = useState(null);
  const [envios, setEnvios] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState({ estado: true, envios: true, eventos: true, reservas: true });
  const [equipoSeleccionado, setEquipoSeleccionado] = useState("");
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState("");
  const [eventosLote, setEventosLote] = useState([]);
  const [errorEventosLote, setErrorEventosLote] = useState("");
  const [filtro, setFiltro] = useState("");
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 15000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const subs = [];
    const escuchar = (clave, referencia, recibir) => {
      subs.push(onSnapshot(referencia, (snap) => {
        recibir(snap);
        setErrores((prev) => ({ ...prev, [clave]: "" }));
        setCargando((prev) => ({ ...prev, [clave]: false }));
      }, (err) => {
        console.error(`Error Firestore (${clave}):`, err);
        setErrores((prev) => ({ ...prev, [clave]: `No fue posible consultar ${clave}. Revisa permisos de Firestore.` }));
        setCargando((prev) => ({ ...prev, [clave]: false }));
      }));
    };
    escuchar("estado", doc(db, "estado_envio_correos", "principal"),
      (snap) => setEstadoSistema(snap.exists() ? { id: snap.id, ...snap.data() } : null));
    escuchar("envios", query(collection(db, "auditoria_envios"), orderBy("fechaActualizacion", "desc")),
      (snap) => setEnvios(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    escuchar("eventos", collection(db, "auditoria_operador"),
      (snap) => setEventos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    escuchar("reservas", collection(db, "archivos_envio"),
      (snap) => setReservas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => subs.forEach((fn) => fn());
  }, []);

  const loteIdParaEventos = envios.find((e) => e.id === loteSeleccionadoId)?.loteId || loteSeleccionadoId;
  useEffect(() => {
    if (!loteSeleccionadoId) { setEventosLote([]); setErrorEventosLote(""); return; }
    const q = query(collection(db, "auditoria_operador"), where("loteId", "==", loteIdParaEventos));
    return onSnapshot(q, (snap) => {
      setEventosLote(snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => fechaMs(a.fechaUtc) - fechaMs(b.fechaUtc)));
      setErrorEventosLote("");
    }, (err) => { console.error(err); setErrorEventosLote("No se pudo consultar la bitácora del lote."); });
  }, [loteSeleccionadoId, loteIdParaEventos]);

  const equipos = useMemo(() => construirEquipos({ reservas, envios, eventos, estadoSistema }),
    [reservas, envios, eventos, estadoSistema]);
  const seleccionado = equipos.find((e) => e.clave === equipoSeleccionado) || null;
  const heartbeatReciente = !!estadoSistema?.equipo &&
    fechaMs(estadoSistema.ultimoContacto) > 0 &&
    ahora - fechaMs(estadoSistema.ultimoContacto) >= 0 &&
    ahora - fechaMs(estadoSistema.ultimoContacto) <= MINUTOS_HEARTBEAT * 60000;
  const esHeartbeat = (e) => normal(e.nombre) === normal(estadoSistema?.equipo) && !!estadoSistema?.equipo;
  const estadoEquipo = (e) => esHeartbeat(e) && heartbeatReciente
    ? "HEARTBEAT RECIENTE" : "NO VERIFICABLE";
  const filtrados = equipos.filter((e) => `${e.nombre} ${e.id}`.toLowerCase().includes(filtro.toLowerCase()));
  const lotesVisibles = seleccionado
    ? envios.filter((r) => {
        const id = obtenerIdentidad(r);
        return id && (seleccionado.id && id.id === seleccionado.id || normal(id.nombre) === normal(seleccionado.nombre));
      })
    : envios;
  const loteSeleccionado = envios.find((e) => e.id === loteSeleccionadoId || e.loteId === loteSeleccionadoId);

  return <div style={theme.layout.page}><div style={theme.layout.content}>
    <div style={bloque}>
      <h1 style={{ margin: 0, fontSize: 28, color: theme.colors.text }}>📧 Auditoría de Correos</h1>
      <p style={{ marginBottom: 0, color: tenue }}>Monitoreo de equipos y envíos de SistemaEnvioCorreos — Beta 3 / 1.0.8</p>
    </div>

    <h2 style={{ fontSize: 20 }}>🖥️ Equipos identificados</h2>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
      <Tarjeta titulo="EQUIPOS IDENTIFICADOS" valor={equipos.length} detalle="Identificados por auditoría, reserva o heartbeat" />
      <Tarjeta titulo="HEARTBEAT RECIENTE" valor={equipos.filter((e) => estadoEquipo(e) === "HEARTBEAT RECIENTE").length} detalle="Solo confirma el último equipo que reportó" />
      <Tarjeta titulo="SIN CONFIRMACIÓN" valor={equipos.filter((e) => estadoEquipo(e) !== "HEARTBEAT RECIENTE").length} detalle="No significa necesariamente desconectados" />
      <Tarjeta titulo="LOTES REGISTRADOS" valor={envios.length} detalle="Auditoría de envíos disponible" />
    </div>
    <div style={bloque}>
      <p style={{ fontSize: 13, color: tenue, marginTop: 0 }}>
        La versión 1.0.8 escribe el heartbeat en un documento compartido. Solo el último equipo que lo actualizó puede mostrar conexión reciente; los demás no se clasifican como Offline.
      </p>
      <input aria-label="Buscar equipo" placeholder="Buscar por nombre o EquipoId..." value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        style={{ width: "100%", maxWidth: 360, padding: 10, border: `1px solid ${borde}`, borderRadius: 8, marginBottom: 12 }} />
      {(cargando.reservas || cargando.eventos || cargando.envios) && <p>Consultando equipos...</p>}
      {Object.entries(errores).filter(([k, v]) => k !== "estado" && v).map(([k, v]) =>
        <p key={k} style={{ color: rojo }}>{v}</p>)}
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
        <thead><tr>{["Equipo", "EquipoId", "Conexión", "Última actividad", "Lotes", "Archivos", "Acción"].map((t) => <th key={t} style={th}>{t}</th>)}</tr></thead>
        <tbody>{filtrados.map((e) => <tr key={e.clave} style={{ background: seleccionado?.clave === e.clave ? "#E0F2FE" : "transparent" }}>
          <td style={td}><strong>{e.nombre}</strong></td>
          <td style={{ ...td, fontSize: 11, overflowWrap: "anywhere", maxWidth: 200 }}>{e.id || "No registrado en fuente"}</td>
          <td style={{ ...td, color: estadoEquipo(e) === "HEARTBEAT RECIENTE" ? verde : tenue, fontWeight: 700 }}>{estadoEquipo(e)}</td>
          <td style={td}>{fechaTexto(e.ultimaActividad)}</td>
          <td style={td}>{e.lotes}</td><td style={td}>{e.archivos}</td>
          <td style={td}><button style={boton} onClick={() => { setEquipoSeleccionado(e.clave === equipoSeleccionado ? "" : e.clave); setLoteSeleccionadoId(""); }}>{e.clave === equipoSeleccionado ? "Cerrar" : "Ver equipo"}</button></td>
        </tr>)}</tbody>
      </table></div>
      {!filtrados.length && !cargando.reservas && !cargando.eventos && !cargando.envios && <p style={{ color: tenue }}>No hay equipos identificados con los datos consultados.</p>}
    </div>

    {seleccionado && <div style={bloque}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ marginTop: 0 }}>💻 {seleccionado.nombre}</h2>
        <button style={theme.button.danger} onClick={() => { setEquipoSeleccionado(""); setLoteSeleccionadoId(""); }}>Cerrar detalle</button>
      </div>
      <p><strong>EquipoId:</strong> {seleccionado.id || "No disponible en auditorías antiguas"}</p>
      <p><strong>Conexión:</strong> {estadoEquipo(seleccionado)}</p>
      <p><strong>Última actividad:</strong> {fechaTexto(seleccionado.ultimaActividad)} ({seleccionado.tipoActividad || "—"})</p>
      <p><strong>Auditorías:</strong> {seleccionado.lotes} lotes · {seleccionado.archivos} archivos con reserva · {seleccionado.eventos} eventos</p>
      {esHeartbeat(seleccionado) && <>
        <h3>Estado del heartbeat compartido</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Tarjeta titulo="PENDIENTES" valor={estadoSistema?.pendientes ?? 0} detalle="Archivos en carpeta Pendientes" />
          <Tarjeta titulo="VÁLIDOS" valor={estadoSistema?.archivosValidos ?? 0} detalle="Archivos listos" />
          <Tarjeta titulo="NO PERMITIDOS" valor={estadoSistema?.noPermitidos ?? 0} detalle="Archivos no válidos" />
          <Tarjeta titulo="REQUIEREN ATENCIÓN" valor={estadoSistema?.lotesRequierenAtencion ?? 0} detalle="Lotes pendientes de revisión" />
        </div>
        <p style={{ color: tenue }}>Estado reportado: {estadoSistema?.estado || "—"} · Último contacto: {fechaTexto(estadoSistema?.ultimoContacto)}</p>
        <p style={{ color: tenue }}>Último lote: {estadoSistema?.ultimoLote || "—"} · Último envío: {fechaTexto(estadoSistema?.ultimoEnvio)}</p>
      </>}
    </div>}

    <div style={bloque}>
      <h2 style={{ marginTop: 0 }}>🌐 Estado compartido de la aplicación</h2>
      {cargando.estado ? <p>Consultando estado...</p> : errores.estado ? <p style={{ color: rojo }}>{errores.estado}</p> : !estadoSistema ?
        <p>No existe información en estado_envio_correos/principal.</p> : <>
          <p style={{ color: heartbeatReciente ? verde : rojo, fontWeight: 800 }}>
            ● {heartbeatReciente ? "ÚLTIMO HEARTBEAT RECIENTE" : "SIN HEARTBEAT RECIENTE"}
          </p>
          <p>Equipo que reportó: <strong>{estadoSistema.equipo || "—"}</strong> · Último contacto: {fechaTexto(estadoSistema.ultimoContacto)}</p>
          <p>Estado reportado: <strong>{estadoSistema.estado || "—"}</strong> · Usuario Windows: {estadoSistema.usuarioWindows || "—"}</p>
        </>}
    </div>

    <div style={bloque}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div><h2 style={{ margin: 0 }}>📋 Historial de envíos</h2>
          <p style={{ color: tenue, fontSize: 13 }}>Auditoría de los lotes procesados {seleccionado ? `· Filtro: ${seleccionado.nombre}` : "· Todos los equipos"}</p></div>
        <div><span style={{ color: tenue, marginRight: 12 }}>{lotesVisibles.length} registro(s)</span>
          {seleccionado && <button style={boton} onClick={() => setEquipoSeleccionado("")}>Mostrar todos</button>}</div>
      </div>
      {cargando.envios && <p>Cargando historial...</p>}
      {errores.envios && <p style={{ color: rojo }}>{errores.envios}</p>}
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
        <thead><tr>{["Folio", "Actualización", "Equipo", "Estado", "Archivos", "Tamaño", "Intentos", "Tipo", "Acción"].map((t) => <th style={th} key={t}>{t}</th>)}</tr></thead>
        <tbody>{lotesVisibles.map((r) => <tr key={r.id}>
          <td style={td}><strong>{r.loteId || r.id}</strong></td><td style={td}>{fechaTexto(r.fechaActualizacion)}</td>
          <td style={td}>{r.equipo || "—"}</td><td style={{ ...td, color: estadoColor(r.estado), fontWeight: 700 }}>{r.estado || "SIN ESTADO"}</td>
          <td style={td}>{r.cantidadArchivos ?? 0}</td><td style={td}>{mb(r.tamanoTotalBytes)} MB</td>
          <td style={td}>{r.intento ?? 0}</td><td style={td}>{r.tipoUltimoIntento || "—"}</td>
          <td style={td}><button style={boton} onClick={() => setLoteSeleccionadoId(r.id === loteSeleccionadoId ? "" : r.id)}>Ver detalle</button></td>
        </tr>)}</tbody>
      </table></div>
      {!cargando.envios && !errores.envios && !lotesVisibles.length && <p style={{ color: tenue }}>No hay envíos para esta selección.</p>}
    </div>

    {loteSeleccionado && <div style={bloque}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ marginTop: 0 }}>📦 {loteSeleccionado.loteId || loteSeleccionado.id}</h2>
        <button style={theme.button.danger} onClick={() => setLoteSeleccionadoId("")}>Cerrar</button>
      </div>
      <p><strong>Estado:</strong> {loteSeleccionado.estado || "—"} · <strong>Intento:</strong> {loteSeleccionado.intento ?? 0} · <strong>Tipo:</strong> {loteSeleccionado.tipoUltimoIntento || "—"}</p>
      <p><strong>Equipo:</strong> {loteSeleccionado.equipo || "—"} · <strong>Fecha de envío:</strong> {fechaTexto(loteSeleccionado.fechaEnvio)}</p>
      <p><strong>Asunto:</strong> {loteSeleccionado.asunto || "—"}</p>
      <h3>Destinatarios</h3><p style={{ overflowWrap: "anywhere" }}>{loteSeleccionado.destinatarios?.join(", ") || "Sin destinatarios registrados"}</p>
      {loteSeleccionado.error && <p style={{ color: rojo }}><strong>Error registrado:</strong> {loteSeleccionado.error}</p>}
      <h3>Archivos incluidos</h3>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
        <thead><tr><th style={th}>Archivo</th><th style={th}>Tamaño</th><th style={th}>SHA-256</th></tr></thead>
        <tbody>{(loteSeleccionado.archivos || []).map((a, i) => <tr key={`${a.sha256 || a.nombre}-${i}`}>
          <td style={td}>{a.nombre || "Sin nombre"}</td><td style={td}>{(Number(a.tamanoBytes || 0) / 1024).toFixed(2)} KB</td>
          <td style={{ ...td, fontSize: 11, overflowWrap: "anywhere", fontFamily: "monospace" }}>{a.sha256 || "—"}</td>
        </tr>)}</tbody>
      </table></div>
      {!(loteSeleccionado.archivos || []).length && <p style={{ color: tenue }}>Este registro no contiene archivos.</p>}
      <h3>🕒 Bitácora del lote</h3>
      {errorEventosLote && <p style={{ color: rojo }}>{errorEventosLote}</p>}
      {!eventosLote.length && !errorEventosLote && <p style={{ color: tenue }}>No existen eventos registrados para este lote.</p>}
      {eventosLote.map((ev) => <div key={ev.id} style={{ borderLeft: `3px solid ${estadoColor(ev.tipoEvento)}`, padding: "4px 0 14px 14px", marginBottom: 8 }}>
        <strong>{ev.tipoEvento || "EVENTO"}</strong> <small style={{ color: tenue }}>{fechaTexto(ev.fechaUtc)}</small>
        <div style={{ color: tenue, fontSize: 13 }}>{ev.detalle || "Sin detalle"}</div>
        <small style={{ color: tenue }}>{ev.tipoIntento ? `Tipo: ${ev.tipoIntento} · ` : ""}{ev.intento ? `Intento: ${ev.intento} · ` : ""}{ev.usuarioWindows ? `Usuario: ${ev.usuarioWindows}` : ""}</small>
      </div>)}
    </div>}
  </div></div>;
}
