// src/services/nomina/resumenSemanalNomina.js

import {
  crearFechaLocal,
  fechaISO,
} from "./calculoHoras";


// =====================================================
// OBTENER LUNES DE LA SEMANA
// =====================================================

const obtenerLunesSemana = (fechaISOTexto) => {
  const fecha =
    crearFechaLocal(fechaISOTexto);

  if (!fecha) {
    return null;
  }

  const diaSemana =
    fecha.getDay();

  // JS:
  // 0 domingo
  // 1 lunes
  // ...
  // 6 sábado

  const diasRetroceder =
    diaSemana === 0
      ? 6
      : diaSemana - 1;

  fecha.setDate(
    fecha.getDate() -
    diasRetroceder
  );

  return fechaISO(fecha);
};


// =====================================================
// OBTENER DOMINGO DE LA SEMANA
// =====================================================

const obtenerDomingoSemana = (
  lunesISO
) => {
  const lunes =
    crearFechaLocal(lunesISO);

  if (!lunes) {
    return null;
  }

  const domingo =
    new Date(lunes);

  domingo.setDate(
    domingo.getDate() + 6
  );

  return fechaISO(domingo);
};


// =====================================================
// GENERAR SEMANAS NATURALES
//
// IMPORTANTE:
// La semana es lunes-domingo,
// pero inicioEvaluado / finEvaluado
// quedan limitados al rango real del XLS.
// =====================================================

export const generarSemanasNomina = (
  periodoInicio,
  periodoFin
) => {

  if (
    !periodoInicio ||
    !periodoFin
  ) {
    return [];
  }


  const inicioPeriodo =
    crearFechaLocal(periodoInicio);

  const finPeriodo =
    crearFechaLocal(periodoFin);


  if (
    !inicioPeriodo ||
    !finPeriodo
  ) {
    return [];
  }


  const primerLunes =
    obtenerLunesSemana(
      periodoInicio
    );


  if (!primerLunes) {
    return [];
  }


  const semanas = [];

  let lunes =
    crearFechaLocal(
      primerLunes
    );


  let numeroSemana = 1;


  while (
    lunes <= finPeriodo
  ) {

    const lunesISO =
      fechaISO(lunes);


    const domingoISO =
      obtenerDomingoSemana(
        lunesISO
      );


    const domingo =
      crearFechaLocal(
        domingoISO
      );


    // ===============================================
    // RECORTAR A LO QUE REALMENTE CONTIENE EL XLS
    // ===============================================

    const inicioEvaluado =
      lunes < inicioPeriodo
        ? periodoInicio
        : lunesISO;


    const finEvaluado =
      domingo > finPeriodo
        ? periodoFin
        : domingoISO;


    semanas.push({
      numero:
        numeroSemana,

      lunes:
        lunesISO,

      domingo:
        domingoISO,

      inicioEvaluado,

      finEvaluado,

      parcialInicio:
        inicioEvaluado !==
        lunesISO,

      parcialFin:
        finEvaluado !==
        domingoISO,
    });


    lunes =
      new Date(lunes);

    lunes.setDate(
      lunes.getDate() + 7
    );


    numeroSemana++;
  }


  return semanas;
};


// =====================================================
// GENERAR FECHAS ENTRE DOS FECHAS
// =====================================================

const generarFechas = (
  inicio,
  fin
) => {

  const fechaInicio =
    crearFechaLocal(inicio);

  const fechaFin =
    crearFechaLocal(fin);


  if (
    !fechaInicio ||
    !fechaFin
  ) {
    return [];
  }


  const fechas = [];

  const cursor =
    new Date(fechaInicio);


  while (
    cursor <= fechaFin
  ) {

    fechas.push(
      fechaISO(cursor)
    );

    cursor.setDate(
      cursor.getDate() + 1
    );
  }


  return fechas;
};


// =====================================================
// CALCULAR UNA SEMANA DE UN TÉCNICO
// =====================================================

const calcularSemanaTecnico = (
  tecnico,
  semana
) => {

  const fechas =
    generarFechas(
      semana.inicioEvaluado,
      semana.finEvaluado
    );


  let segundosReportados = 0;

  let segundosContabilizados = 0;

  let faltas = 0;

  let diasTrabajados = 0;

  let sabadosTrabajados = 0;

  let domingosTrabajados = 0;

  let segundosDomingo = 0;

  let festivosTrabajados = 0;

  let segundosFestivo = 0;

  let descansosFestivos = 0;

  let diasPeriodoAlto = 0;


  fechas.forEach((fecha) => {

    const dia =
      tecnico?.dias?.[fecha];


    if (!dia) {
      return;
    }


    segundosReportados +=
      Number(
        dia.segundosReportados
      ) || 0;


    segundosContabilizados +=
      Number(
        dia.segundosContabilizados
      ) || 0;


    if (dia.trabajado) {
      diasTrabajados++;
    }


    if (dia.esFalta) {
      faltas++;
    }


    if (
      dia.esSabado &&
      dia.trabajado
    ) {
      sabadosTrabajados++;
    }


    if (
      dia.esDomingo &&
      dia.trabajado
    ) {

      domingosTrabajados++;

      segundosDomingo +=
        Number(
          dia.segundosReportados
        ) || 0;
    }


    if (
      dia.festivoTrabajado
    ) {

      festivosTrabajados++;

      segundosFestivo +=
        Number(
          dia.segundosReportados
        ) || 0;
    }


    if (
      dia.descansoFestivo
    ) {
      descansosFestivos++;
    }


    if (
      dia.periodoAlto
    ) {
      diasPeriodoAlto++;
    }
  });


  return {
    numeroSemana:
      semana.numero,

    lunes:
      semana.lunes,

    domingo:
      semana.domingo,

    inicioEvaluado:
      semana.inicioEvaluado,

    finEvaluado:
      semana.finEvaluado,

    parcialInicio:
      semana.parcialInicio,

    parcialFin:
      semana.parcialFin,

    segundosReportados,

    segundosContabilizados,

    faltas,

    diasTrabajados,

    sabadosTrabajados,

    domingosTrabajados,

    segundosDomingo,

    festivosTrabajados,

    segundosFestivo,

    descansosFestivos,

    diasPeriodoAlto,
  };
};


// =====================================================
// RESUMEN SEMANAL GENERAL
// =====================================================

export const calcularResumenSemanalNomina = (
  asistencia
) => {

  if (
    !asistencia?.periodoInicio ||
    !asistencia?.periodoFin
  ) {
    return {
      semanas: [],
      tecnicos: [],
    };
  }


  const semanas =
    generarSemanasNomina(
      asistencia.periodoInicio,
      asistencia.periodoFin
    );


  const tecnicos =
    (
      asistencia.tecnicos ||
      []
    ).map((tecnico) => {

      const resumenSemanas =
        semanas.map(
          (semana) =>
            calcularSemanaTecnico(
              tecnico,
              semana
            )
        );


      return {
        nombre:
          tecnico.nombre,

        activo:
          tecnico.activo,

        fechaAlta:
          tecnico.fechaAlta,

        fechaBaja:
          tecnico.fechaBaja,

        semanas:
          resumenSemanas,
      };
    });


  return {
    periodoInicio:
      asistencia.periodoInicio,

    periodoFin:
      asistencia.periodoFin,

    semanas,

    tecnicos,
  };
};