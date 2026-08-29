// src/utils/jsonComparadorParser.js

/**
 * Convierte fecha DD/MM/YYYY HH:mm:ss a Date.
 */
export const parseFechaReporte = (fecha) => {
  if (!fecha || typeof fecha !== "string") return null;

  const [parteFecha, parteHora = "00:00:00"] = fecha.trim().split(" ");
  const [dia, mes, anio] = parteFecha.split("/").map(Number);
  const [hora = 0, minuto = 0, segundo = 0] = parteHora.split(":").map(Number);

  if (!dia || !mes || !anio) return null;

  return new Date(anio, mes - 1, dia, hora, minuto, segundo);
};

export const formatearFecha = (fecha) => {
  const date = fecha instanceof Date ? fecha : parseFechaReporte(fecha);

  if (!date || Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const textoSeguro = (valor, fallback = "—") => {
  if (valor === undefined || valor === null || valor === "") return fallback;
  return String(valor);
};

/**
 * Genera identificador único para detectar el mismo reporte cargado dos veces.
 */
const generarClaveReporte = (json) => {
  const hallCode = json?.serverData?.hallCode || "";
  const sala = json?.serverData?.hall || "";
  const sessionId = json?.sessionData?.id ?? "";
  const startDate = json?.sessionData?.startDate || "";

  return `${hallCode}|${sala}|${sessionId}|${startDate}`;
};

/**
 * Extrae una fila por máquina.
 *
 * Actualmente tomamos el primer juego como juego principal,
 * que corresponde al formato de tus reportes actuales.
 */
const extraerMaquinasReporte = (json, nombreArchivo = "") => {
  const sala = textoSeguro(json?.serverData?.hall);
  const hallCode = textoSeguro(json?.serverData?.hallCode);
  const fechaTexto = json?.sessionData?.startDate || "";
  const fechaDate = parseFechaReporte(fechaTexto);
  const sessionId = json?.sessionData?.id ?? null;

  const machines = Array.isArray(json?.machines) ? json.machines : [];

  return machines.map((machine, index) => {
    const machineInfo = machine?.machineInfo || {};

    const juegos = Array.isArray(machine?.games) ? machine.games : [];
    const juegoPrincipal = juegos[0]?.gameInfo || {};

    return {
      id: `${nombreArchivo}-${machineInfo.serialNumber || index}`,

      archivo: nombreArchivo,

      sala,
      hallCode,

      sessionId,

      fechaReporteOriginal: fechaTexto,
      fechaReporte: formatearFecha(fechaTexto),
      fechaTimestamp: fechaDate?.getTime() || 0,

      vlt: textoSeguro(machineInfo.vlt),
      serie: textoSeguro(machineInfo.serialNumber),

      localizacion: textoSeguro(machineInfo.localization),

      juegoId: textoSeguro(juegoPrincipal.gameId),
      juego: textoSeguro(juegoPrincipal.gameName),
      version: textoSeguro(juegoPrincipal.gameVersion),
      perfil: textoSeguro(juegoPrincipal.activeProfile),

      cabinet: textoSeguro(machineInfo.cabinet),
      plataforma: textoSeguro(machineInfo.platform),
    };
  });
};

/**
 * Procesa archivos JSON masivamente.
 * No establece límite artificial.
 *
 * Procesa secuencialmente para evitar picos muy grandes
 * de memoria con cientos/miles de archivos.
 */
export const procesarArchivosJson = async (
  archivos,
  onProgress = () => {}
) => {
  const files = Array.from(archivos || []).filter((file) =>
    file.name.toLowerCase().endsWith(".json")
  );

  const reportes = [];
  const filas = [];
  const errores = [];
  const clavesReportes = new Set();

  let duplicados = 0;

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];

    try {
      const contenido = await file.text();
      const json = JSON.parse(contenido);

      if (!json?.serverData || !json?.sessionData || !Array.isArray(json?.machines)) {
        throw new Error("El archivo no tiene la estructura esperada.");
      }

      const claveReporte = generarClaveReporte(json);

      if (clavesReportes.has(claveReporte)) {
        duplicados += 1;
      } else {
        clavesReportes.add(claveReporte);

        const fecha = parseFechaReporte(json?.sessionData?.startDate);

        const reporte = {
          clave: claveReporte,
          archivo: file.name,
          sala: textoSeguro(json?.serverData?.hall),
          hallCode: textoSeguro(json?.serverData?.hallCode),
          sessionId: json?.sessionData?.id ?? null,
          fechaOriginal: json?.sessionData?.startDate || "",
          fecha: formatearFecha(json?.sessionData?.startDate),
          fechaTimestamp: fecha?.getTime() || 0,
        };

        reportes.push(reporte);

        const maquinas = extraerMaquinasReporte(json, file.name);
        filas.push(...maquinas);
      }
    } catch (error) {
      errores.push({
        archivo: file.name,
        error: error?.message || "No fue posible procesar el archivo.",
      });
    }

    onProgress({
      procesados: i + 1,
      total: files.length,
      porcentaje:
        files.length > 0
          ? Math.round(((i + 1) / files.length) * 100)
          : 100,
    });

    // Permite que React/navegador respire cada cierto número de archivos.
    if ((i + 1) % 25 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  reportes.sort((a, b) => a.fechaTimestamp - b.fechaTimestamp);

  filas.sort((a, b) => {
    if (a.serie !== b.serie) {
      return String(a.serie).localeCompare(String(b.serie), undefined, {
        numeric: true,
      });
    }

    return a.fechaTimestamp - b.fechaTimestamp;
  });

  return {
    archivosSeleccionados: files.length,
    reportes,
    filas,
    duplicados,
    errores,
  };
};

/**
 * Detecta cambio entre dos estados consecutivos.
 */
const obtenerCambiosEntreRegistros = (anterior, actual) => {
  const cambios = [];

  if (anterior.perfil !== actual.perfil) {
    cambios.push({
      campo: "Perfil",
      anterior: anterior.perfil,
      nuevo: actual.perfil,
      prioridad: 1,
    });
  }

  if (anterior.juego !== actual.juego) {
    cambios.push({
      campo: "Juego",
      anterior: anterior.juego,
      nuevo: actual.juego,
      prioridad: 2,
    });
  }

  if (anterior.version !== actual.version) {
    cambios.push({
      campo: "Versión",
      anterior: anterior.version,
      nuevo: actual.version,
      prioridad: 3,
    });
  }

  return cambios;
};

/**
 * Construye la comparación histórica agrupando por número de serie.
 *
 * IMPORTANTE:
 * No exige días consecutivos.
 * Compara contra el último reporte disponible anterior.
 */
export const detectarCambiosHistoricos = (filas = []) => {
  const porSerie = new Map();

  filas.forEach((fila) => {
    if (!fila?.serie || fila.serie === "—") return;

    if (!porSerie.has(fila.serie)) {
      porSerie.set(fila.serie, []);
    }

    porSerie.get(fila.serie).push(fila);
  });

  const cambios = [];

  porSerie.forEach((historial, serie) => {
    historial.sort((a, b) => a.fechaTimestamp - b.fechaTimestamp);

    for (let i = 1; i < historial.length; i += 1) {
      const anterior = historial[i - 1];
      const actual = historial[i];

      const diferencias = obtenerCambiosEntreRegistros(anterior, actual);

      if (diferencias.length === 0) continue;

      const tipos = diferencias
        .sort((a, b) => a.prioridad - b.prioridad)
        .map((item) => item.campo);

      cambios.push({
        id: `${serie}-${actual.fechaTimestamp}`,

        sala: actual.sala,

        serie,
        vltAnterior: anterior.vlt,
        vlt: actual.vlt,

        fechaAnterior: anterior.fechaReporte,
        fechaAnteriorTimestamp: anterior.fechaTimestamp,

        fechaCambio: actual.fechaReporte,
        fechaCambioTimestamp: actual.fechaTimestamp,

        juegoAnterior: anterior.juego,
        juegoNuevo: actual.juego,

        versionAnterior: anterior.version,
        versionNueva: actual.version,

        perfilAnterior: anterior.perfil,
        perfilNuevo: actual.perfil,

        cambios: diferencias,
        tipoCambio: tipos.join(" + "),

        cambioPerfil: anterior.perfil !== actual.perfil,
        cambioJuego: anterior.juego !== actual.juego,
        cambioVersion: anterior.version !== actual.version,

        archivoAnterior: anterior.archivo,
        archivoNuevo: actual.archivo,
      });
    }
  });

  return cambios.sort(
    (a, b) => b.fechaCambioTimestamp - a.fechaCambioTimestamp
  );
};

/**
 * Construye historial completo de una terminal.
 */
export const obtenerHistorialSerie = (filas = [], serie = "") => {
  return filas
    .filter((fila) => String(fila.serie) === String(serie))
    .sort((a, b) => a.fechaTimestamp - b.fechaTimestamp);
};

/**
 * Obtiene cantidad de terminales únicas.
 */
export const contarTerminales = (filas = []) => {
  return new Set(
    filas
      .map((fila) => fila.serie)
      .filter((serie) => serie && serie !== "—")
  ).size;
};