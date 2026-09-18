// src/services/nomina/calculoHoras.js

import {
  normalizarNombre,
  obtenerCampo,
  limpiarTexto,
} from "./parserNomina";


export const MAX_SEGUNDOS_DIA =
  8 * 60 * 60;


// =====================================================
// FECHAS
// =====================================================

export const crearFechaLocal = (
  fecha,
  hora = "00:00:00"
) => {
  if (!fecha) return null;

  const texto = limpiarTexto(fecha);

  let anio;
  let mes;
  let dia;

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(texto)) {
    [anio, mes, dia] = texto
      .split("-")
      .map(Number);
  }

  // DD/MM/YYYY
  else if (
    /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(texto)
  ) {
    [dia, mes, anio] = texto
      .split("/")
      .map(Number);
  } else {
    return null;
  }

  const partesHora = limpiarTexto(
    hora || "00:00:00"
  )
    .split(":")
    .map(Number);

  const horas = partesHora[0] || 0;
  const minutos = partesHora[1] || 0;
  const segundos = partesHora[2] || 0;

  const resultado = new Date(
    anio,
    mes - 1,
    dia,
    horas,
    minutos,
    segundos,
    0
  );

  if (Number.isNaN(resultado.getTime())) {
    return null;
  }

  return resultado;
};


export const fechaISO = (fecha) => {
  const anio = fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};


export const fechaVisual = (fecha) => {
  if (!fecha) return "-";

  const d = crearFechaLocal(fecha);

  if (!d) return fecha;

  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};


export const nombreDia = (fecha) => {
  const d = crearFechaLocal(fecha);

  if (!d) return "";

  const nombre = d
    .toLocaleDateString("es-MX", {
      weekday: "short",
    })
    .replace(".", "");

  return (
    nombre.charAt(0).toUpperCase() +
    nombre.slice(1)
  );
};


export const segundosAHoras = (segundos) => {
  const total = Math.max(
    0,
    Math.round(Number(segundos) || 0)
  );

  const horas = Math.floor(total / 3600);

  const minutos = Math.floor(
    (total % 3600) / 60
  );

  const segundosRestantes =
    total % 60;

  return (
    `${String(horas).padStart(2, "0")}:` +
    `${String(minutos).padStart(2, "0")}:` +
    `${String(segundosRestantes).padStart(2, "0")}`
  );
};


// =====================================================
// DIVIDIR REGISTRO AL CRUZAR MEDIANOCHE
// =====================================================

export const dividirRegistroPorDia = (
  registro
) => {
  const fechaInicio = obtenerCampo(
    registro,
    ["Fecha inicial", "fecha inicial"]
  );

  const fechaFin = obtenerCampo(
    registro,
    ["Fecha fin", "fecha fin"]
  );

  const horaInicio = obtenerCampo(
    registro,
    ["Hora inicial", "hora inicial"]
  );

  const horaFin = obtenerCampo(
    registro,
    ["Hora final", "hora final"]
  );

  if (
    !fechaInicio ||
    !fechaFin ||
    !horaInicio ||
    !horaFin
  ) {
    return [];
  }

  const inicio = crearFechaLocal(
    fechaInicio,
    horaInicio
  );

  let fin = crearFechaLocal(
    fechaFin,
    horaFin
  );

  if (!inicio || !fin) {
    return [];
  }

  // Solo agregamos 24 horas cuando FIN es
  // realmente anterior a INICIO.
  if (fin < inicio) {
    fin = new Date(
      fin.getTime() +
        24 * 60 * 60 * 1000
    );
  }

  if (fin.getTime() === inicio.getTime()) {
    return [];
  }

  const segmentos = [];

  let cursor = new Date(inicio);

  while (cursor < fin) {
    const siguienteDia = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() + 1,
      0,
      0,
      0,
      0
    );

    const limite =
      fin < siguienteDia
        ? fin
        : siguienteDia;

    const segundos = Math.max(
      0,
      (limite.getTime() -
        cursor.getTime()) /
        1000
    );

    if (segundos > 0) {
      segmentos.push({
        fecha: fechaISO(cursor),
        segundos,
      });
    }

    cursor = new Date(limite);
  }

  return segmentos;
};


// =====================================================
// PROCESAMIENTO GENERAL
// =====================================================

export const procesarRegistros = (
  registros
) => {
  const porTecnico = {};

  const fechasArchivo = [];

  let registrosValidos = 0;
  let registrosIncompletos = 0;

  registros.forEach((registro) => {
    const nombre = normalizarNombre(
      obtenerCampo(registro, [
        "Nombre",
        "nombre",
      ])
    );

    const fechaInicial = obtenerCampo(
      registro,
      [
        "Fecha inicial",
        "fecha inicial",
      ]
    );

    const fechaFinal = obtenerCampo(
      registro,
      ["Fecha fin", "fecha fin"]
    );

    if (fechaInicial) {
      const d =
        crearFechaLocal(fechaInicial);

      if (d) {
        fechasArchivo.push(
          fechaISO(d)
        );
      }
    }

    if (fechaFinal) {
      const d =
        crearFechaLocal(fechaFinal);

      if (d) {
        fechasArchivo.push(
          fechaISO(d)
        );
      }
    }

    if (!nombre) return;

    if (!porTecnico[nombre]) {
      porTecnico[nombre] = {
        nombre,
        dias: {},
        segundosReportadosTotal: 0,
        segundosContabilizadosTotal: 0,
        diasPeriodoAlto: 0,
        registros: 0,
      };
    }

    const segmentos =
      dividirRegistroPorDia(registro);

    if (segmentos.length === 0) {
      registrosIncompletos++;
      return;
    }

    registrosValidos++;

    porTecnico[nombre].registros++;

    segmentos.forEach((segmento) => {
      if (
        !porTecnico[nombre].dias[
          segmento.fecha
        ]
      ) {
        porTecnico[nombre].dias[
          segmento.fecha
        ] = 0;
      }

      porTecnico[nombre].dias[
        segmento.fecha
      ] += segmento.segundos;

      porTecnico[
        nombre
      ].segundosReportadosTotal +=
        segmento.segundos;
    });
  });


  // ===================================================
  // APLICAR MÁXIMO 8 HORAS POR DÍA
  // ===================================================

  Object.values(porTecnico).forEach(
    (tecnico) => {
      tecnico.segundosContabilizadosTotal =
        0;

      tecnico.diasPeriodoAlto = 0;

      Object.entries(
        tecnico.dias
      ).forEach(
        ([
          fecha,
          segundosReportados,
        ]) => {
          const periodoAlto =
            segundosReportados >
            MAX_SEGUNDOS_DIA;

          const segundosContabilizados =
            Math.min(
              segundosReportados,
              MAX_SEGUNDOS_DIA
            );

          tecnico.dias[fecha] = {
            segundosReportados,
            segundosContabilizados,
            periodoAlto,
          };

          tecnico
            .segundosContabilizadosTotal +=
            segundosContabilizados;

          if (periodoAlto) {
            tecnico.diasPeriodoAlto++;
          }
        }
      );
    }
  );


  // ===================================================
  // PERIODO DETECTADO
  // ===================================================

  const fechasOrdenadas = [
    ...new Set(fechasArchivo),
  ].sort();

  const periodoInicio =
    fechasOrdenadas[0] || null;

  const periodoFin =
    fechasOrdenadas[
      fechasOrdenadas.length - 1
    ] || null;


  const tecnicos = Object.values(
    porTecnico
  ).sort((a, b) =>
    a.nombre.localeCompare(
      b.nombre,
      "es"
    )
  );


  return {
    tecnicos,
    periodoInicio,
    periodoFin,
    registrosValidos,
    registrosIncompletos,
  };
};