// src/services/nomina/asistenciaNomina.js

import {
  crearFechaLocal,
  fechaISO,
} from "./calculoHoras";

import {
  buscarFestivo,
} from "./festivosNomina";


// =====================================================
// GENERAR FECHAS DEL PERIODO
// =====================================================

export const generarFechasPeriodo = (
  periodoInicio,
  periodoFin
) => {
  if (
    !periodoInicio ||
    !periodoFin
  ) {
    return [];
  }

  const inicio =
    crearFechaLocal(
      periodoInicio
    );

  const fin =
    crearFechaLocal(
      periodoFin
    );

  if (!inicio || !fin) {
    return [];
  }

  const fechas = [];

  const cursor =
    new Date(inicio);

  while (cursor <= fin) {
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
// DÍA SEMANA
// =====================================================

export const obtenerDiaSemana = (
  fecha
) => {
  const d =
    crearFechaLocal(fecha);

  if (!d) {
    return null;
  }

  return d.getDay();
};


// =====================================================
// TÉCNICO PERTENECE AL EQUIPO
// =====================================================

export const tecnicoAplicaEnFecha = (
  tecnico,
  fecha
) => {
  if (
    !tecnico ||
    !fecha
  ) {
    return false;
  }

  const fechaEvaluar =
    crearFechaLocal(fecha);

  if (!fechaEvaluar) {
    return false;
  }

  if (tecnico.fechaAlta) {
    const alta =
      crearFechaLocal(
        tecnico.fechaAlta
      );

    if (
      alta &&
      fechaEvaluar < alta
    ) {
      return false;
    }
  }

  if (tecnico.fechaBaja) {
    const baja =
      crearFechaLocal(
        tecnico.fechaBaja
      );

    if (
      baja &&
      fechaEvaluar > baja
    ) {
      return false;
    }
  }

  return true;
};


// =====================================================
// DATOS DEL DÍA
// =====================================================

const obtenerDatosDia = (
  tecnicoHoras,
  fecha
) => {
  const datos =
    tecnicoHoras
      ?.dias?.[fecha];

  if (!datos) {
    return {
      segundosReportados: 0,
      segundosContabilizados: 0,
      periodoAlto: false,
    };
  }

  return {
    segundosReportados:
      Number(
        datos.segundosReportados
      ) || 0,

    segundosContabilizados:
      Number(
        datos.segundosContabilizados
      ) || 0,

    periodoAlto:
      Boolean(
        datos.periodoAlto
      ),
  };
};


// =====================================================
// ASISTENCIA POR TÉCNICO
// =====================================================

export const calcularAsistenciaTecnico = ({
  tecnicoCatalogo,
  tecnicoHoras,
  periodoInicio,
  periodoFin,
  festivos = [],
}) => {

  const fechas =
    generarFechasPeriodo(
      periodoInicio,
      periodoFin
    );


  const dias = {};

  let faltas = 0;

  let diasTrabajados = 0;

  let guardiasSabado = 0;

  let domingosTrabajados = 0;

  let segundosDomingo = 0;

  let festivosTrabajados = 0;

  let segundosFestivo = 0;

  let descansosFestivos = 0;


  fechas.forEach(
    (fecha) => {

      const diaSemana =
        obtenerDiaSemana(
          fecha
        );

      const aplica =
        tecnicoAplicaEnFecha(
          tecnicoCatalogo,
          fecha
        );

      const datosHoras =
        obtenerDatosDia(
          tecnicoHoras,
          fecha
        );

      const trabajado =
        datosHoras
          .segundosReportados > 0;


      const festivo =
        buscarFestivo(
          fecha,
          festivos
        );


      const esFestivo =
        Boolean(festivo);


      // ===============================================
      // FUERA DE PLANTILLA
      // ===============================================

      if (!aplica) {

        dias[fecha] = {
          fecha,

          aplica: false,

          trabajado: false,

          esFalta: false,

          esSabado:
            diaSemana === 6,

          esDomingo:
            diaSemana === 0,

          primaDominical:
            false,

          esFestivo,

          festivoNombre:
            festivo?.nombre ||
            null,

          festivoTrabajado:
            false,

          descansoFestivo:
            false,

          estado:
            "FUERA_PERIODO_LABORAL",

          ...datosHoras,
        };

        return;
      }


      // ===============================================
      // FESTIVO
      //
      // La regla de festivo se evalúa
      // independientemente del domingo.
      // ===============================================

      let festivoTrabajado =
        false;

      let descansoFestivo =
        false;


      if (esFestivo) {

        if (trabajado) {

          festivoTrabajado =
            true;

          festivosTrabajados++;

          segundosFestivo +=
            datosHoras
              .segundosReportados;

        } else {

          descansoFestivo =
            true;

          descansosFestivos++;
        }
      }


      // ===============================================
      // DOMINGO
      //
      // Puede ser simultáneamente festivo.
      // ===============================================

      if (diaSemana === 0) {

        if (trabajado) {

          domingosTrabajados++;

          diasTrabajados++;

          segundosDomingo +=
            datosHoras
              .segundosReportados;


          dias[fecha] = {
            fecha,

            aplica: true,

            trabajado: true,

            esFalta: false,

            esSabado: false,

            esDomingo: true,

            primaDominical:
              true,

            esFestivo,

            festivoNombre:
              festivo?.nombre ||
              null,

            festivoTrabajado,

            descansoFestivo,

            estado:
              esFestivo
                ? "DOMINGO_FESTIVO_TRABAJADO"
                : "DOMINGO_TRABAJADO",

            ...datosHoras,
          };

        } else {

          dias[fecha] = {
            fecha,

            aplica: true,

            trabajado: false,

            esFalta: false,

            esSabado: false,

            esDomingo: true,

            primaDominical:
              false,

            esFestivo,

            festivoNombre:
              festivo?.nombre ||
              null,

            festivoTrabajado:
              false,

            descansoFestivo,

            estado:
              esFestivo
                ? "DOMINGO_FESTIVO_DESCANSO"
                : "DOMINGO_SIN_GUARDIA",

            ...datosHoras,
          };
        }

        return;
      }


      // ===============================================
      // SÁBADO
      // ===============================================

      if (diaSemana === 6) {

        if (trabajado) {

          guardiasSabado++;

          diasTrabajados++;


          dias[fecha] = {
            fecha,

            aplica: true,

            trabajado: true,

            esFalta: false,

            esSabado: true,

            esDomingo: false,

            primaDominical:
              false,

            esFestivo,

            festivoNombre:
              festivo?.nombre ||
              null,

            festivoTrabajado,

            descansoFestivo,

            estado:
              esFestivo
                ? "SABADO_FESTIVO_TRABAJADO"
                : "SABADO_TRABAJADO",

            ...datosHoras,
          };

        } else {

          dias[fecha] = {
            fecha,

            aplica: true,

            trabajado: false,

            esFalta: false,

            esSabado: true,

            esDomingo: false,

            primaDominical:
              false,

            esFestivo,

            festivoNombre:
              festivo?.nombre ||
              null,

            festivoTrabajado:
              false,

            descansoFestivo,

            estado:
              esFestivo
                ? "SABADO_FESTIVO_DESCANSO"
                : "SABADO_SIN_GUARDIA",

            ...datosHoras,
          };
        }

        return;
      }


      // ===============================================
      // FESTIVO LUNES - VIERNES
      // ===============================================

      if (esFestivo) {

        if (trabajado) {

          diasTrabajados++;

          dias[fecha] = {
            fecha,

            aplica: true,

            trabajado: true,

            esFalta: false,

            esSabado: false,

            esDomingo: false,

            primaDominical:
              false,

            esFestivo: true,

            festivoNombre:
              festivo.nombre,

            festivoTrabajado:
              true,

            descansoFestivo:
              false,

            estado:
              "FESTIVO_TRABAJADO",

            ...datosHoras,
          };

        } else {

          dias[fecha] = {
            fecha,

            aplica: true,

            trabajado: false,

            esFalta: false,

            esSabado: false,

            esDomingo: false,

            primaDominical:
              false,

            esFestivo: true,

            festivoNombre:
              festivo.nombre,

            festivoTrabajado:
              false,

            descansoFestivo:
              true,

            estado:
              "DESCANSO_FESTIVO",

            ...datosHoras,
          };
        }

        return;
      }


      // ===============================================
      // LUNES - VIERNES NORMAL
      // ===============================================

      if (trabajado) {

        diasTrabajados++;

        dias[fecha] = {
          fecha,

          aplica: true,

          trabajado: true,

          esFalta: false,

          esSabado: false,

          esDomingo: false,

          primaDominical:
            false,

          esFestivo: false,

          festivoNombre:
            null,

          festivoTrabajado:
            false,

          descansoFestivo:
            false,

          estado:
            "TRABAJADO",

          ...datosHoras,
        };

      } else {

        faltas++;

        dias[fecha] = {
          fecha,

          aplica: true,

          trabajado: false,

          esFalta: true,

          esSabado: false,

          esDomingo: false,

          primaDominical:
            false,

          esFestivo: false,

          festivoNombre:
            null,

          festivoTrabajado:
            false,

          descansoFestivo:
            false,

          estado:
            "FALTA",

          ...datosHoras,
        };
      }
    }
  );


  return {
    nombre:
      tecnicoCatalogo?.nombre ||
      tecnicoHoras?.nombre ||
      "",

    activo:
      tecnicoCatalogo
        ?.activo !== false,

    fechaAlta:
      tecnicoCatalogo
        ?.fechaAlta ||
      null,

    fechaBaja:
      tecnicoCatalogo
        ?.fechaBaja ||
      null,

    faltas,

    diasTrabajados,

    guardiasSabado,

    domingosTrabajados,

    segundosDomingo,

    festivosTrabajados,

    segundosFestivo,

    descansosFestivos,

    dias,
  };
};


// =====================================================
// ASISTENCIA GENERAL
// =====================================================

export const calcularAsistenciaNomina = ({
  tecnicosCatalogo = [],
  resultadoHoras,
  festivos = [],
}) => {

  if (
    !resultadoHoras
      ?.periodoInicio ||
    !resultadoHoras
      ?.periodoFin
  ) {
    return {
      tecnicos: [],

      totales: {
        faltas: 0,
        domingosTrabajados: 0,
        guardiasSabado: 0,
        festivosTrabajados: 0,
        descansosFestivos: 0,
      },
    };
  }


  const mapaHoras =
    new Map();


  (
    resultadoHoras.tecnicos ||
    []
  ).forEach(
    (tecnico) => {

      mapaHoras.set(
        tecnico.nombre,
        tecnico
      );
    }
  );


  const tecnicosResultado = [];


  // ===================================================
  // TÉCNICOS DEL CATÁLOGO
  // ===================================================

  tecnicosCatalogo.forEach(
    (tecnicoCatalogo) => {

      const tecnicoHoras =
        mapaHoras.get(
          tecnicoCatalogo.nombre
        ) || {
          nombre:
            tecnicoCatalogo.nombre,

          dias: {},

          segundosReportadosTotal:
            0,

          segundosContabilizadosTotal:
            0,

          diasPeriodoAlto:
            0,

          registros:
            0,
        };


      const asistencia =
        calcularAsistenciaTecnico({
          tecnicoCatalogo,

          tecnicoHoras,

          periodoInicio:
            resultadoHoras
              .periodoInicio,

          periodoFin:
            resultadoHoras
              .periodoFin,

          festivos,
        });


      tecnicosResultado.push({
        ...asistencia,

        segundosReportadosTotal:
          tecnicoHoras
            .segundosReportadosTotal ||
          0,

        segundosContabilizadosTotal:
          tecnicoHoras
            .segundosContabilizadosTotal ||
          0,

        diasPeriodoAlto:
          tecnicoHoras
            .diasPeriodoAlto ||
          0,

        registros:
          tecnicoHoras
            .registros ||
          0,
      });


      mapaHoras.delete(
        tecnicoCatalogo.nombre
      );
    }
  );


  // ===================================================
  // TÉCNICOS DEL XLS QUE AÚN NO ESTÉN EN CATÁLOGO
  // ===================================================

  mapaHoras.forEach(
    (tecnicoHoras) => {

      const fechasActividad =
        Object.keys(
          tecnicoHoras.dias ||
          {}
        )
          .filter(
            (fecha) =>
              (
                tecnicoHoras
                  .dias[fecha]
                  ?.segundosReportados ||
                0
              ) > 0
          )
          .sort();


      const tecnicoTemporal = {
        nombre:
          tecnicoHoras.nombre,

        activo:
          true,

        fechaAlta:
          fechasActividad[0] ||
          resultadoHoras
            .periodoInicio,

        fechaBaja:
          null,
      };


      const asistencia =
        calcularAsistenciaTecnico({
          tecnicoCatalogo:
            tecnicoTemporal,

          tecnicoHoras,

          periodoInicio:
            resultadoHoras
              .periodoInicio,

          periodoFin:
            resultadoHoras
              .periodoFin,

          festivos,
        });


      tecnicosResultado.push({
        ...asistencia,

        segundosReportadosTotal:
          tecnicoHoras
            .segundosReportadosTotal ||
          0,

        segundosContabilizadosTotal:
          tecnicoHoras
            .segundosContabilizadosTotal ||
          0,

        diasPeriodoAlto:
          tecnicoHoras
            .diasPeriodoAlto ||
          0,

        registros:
          tecnicoHoras
            .registros ||
          0,
      });
    }
  );


  tecnicosResultado.sort(
    (a, b) =>
      a.nombre.localeCompare(
        b.nombre,
        "es"
      )
  );


  // ===================================================
  // TOTALES
  // ===================================================

  const totales =
    tecnicosResultado.reduce(
      (
        acumulado,
        tecnico
      ) => {

        acumulado.faltas +=
          tecnico.faltas;

        acumulado
          .domingosTrabajados +=
          tecnico
            .domingosTrabajados;

        acumulado
          .guardiasSabado +=
          tecnico
            .guardiasSabado;

        acumulado
          .festivosTrabajados +=
          tecnico
            .festivosTrabajados;

        acumulado
          .descansosFestivos +=
          tecnico
            .descansosFestivos;

        return acumulado;
      },
      {
        faltas: 0,

        domingosTrabajados: 0,

        guardiasSabado: 0,

        festivosTrabajados: 0,

        descansosFestivos: 0,
      }
    );


  return {
    periodoInicio:
      resultadoHoras
        .periodoInicio,

    periodoFin:
      resultadoHoras
        .periodoFin,

    tecnicos:
      tecnicosResultado,

    totales,
  };
};