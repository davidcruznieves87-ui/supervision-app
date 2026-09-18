// src/services/nomina/festivosNomina.js

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase";


// =====================================================
// COLECCIÓN
// =====================================================

const COLECCION_CONFIG =
  "nomina_config";


// =====================================================
// ID DEL DOCUMENTO POR AÑO
// =====================================================

const obtenerIdDocumento = (anio) => {
  return `festivos_${anio}`;
};


// =====================================================
// VALIDAR AÑO
// =====================================================

const validarAnio = (anio) => {
  const numero = Number(anio);

  if (
    !Number.isInteger(numero) ||
    numero < 2000 ||
    numero > 2200
  ) {
    throw new Error(
      "El año indicado no es válido."
    );
  }

  return numero;
};


// =====================================================
// ORDENAR FESTIVOS
// =====================================================

const ordenarFestivos = (fechas = []) => {
  return [...fechas].sort(
    (a, b) =>
      String(a.fecha).localeCompare(
        String(b.fecha)
      )
  );
};


// =====================================================
// LIMPIAR / NORMALIZAR FESTIVOS
// =====================================================

const normalizarFestivos = (
  fechas = []
) => {
  const mapa = new Map();

  fechas.forEach((item) => {
    const fecha =
      String(
        item?.fecha || ""
      ).trim();

    const nombre =
      String(
        item?.nombre || ""
      ).trim();

    if (!fecha) {
      return;
    }

    mapa.set(
      fecha,
      {
        fecha,
        nombre:
          nombre ||
          "Día festivo",
      }
    );
  });

  return ordenarFestivos(
    Array.from(
      mapa.values()
    )
  );
};


// =====================================================
// OBTENER CONFIGURACIÓN DE UN AÑO
// =====================================================

export const obtenerFestivosAnio =
  async (anio) => {

    const anioValido =
      validarAnio(anio);

    const ref =
      doc(
        db,
        COLECCION_CONFIG,
        obtenerIdDocumento(
          anioValido
        )
      );

    const snap =
      await getDoc(ref);

    if (!snap.exists()) {
      return {
        anio:
          anioValido,

        configurado:
          false,

        fechas: [],

        existe:
          false,
      };
    }

    const datos =
      snap.data();

    return {
      anio:
        anioValido,

      configurado:
        datos.configurado ===
        true,

      fechas:
        normalizarFestivos(
          datos.fechas || []
        ),

      existe:
        true,

      ...datos,
    };
  };


// =====================================================
// GUARDAR CONFIGURACIÓN ANUAL
// =====================================================

export const guardarFestivosAnio =
  async ({
    anio,
    fechas = [],
    configurado = true,
  }) => {

    const anioValido =
      validarAnio(anio);

    const fechasLimpias =
      normalizarFestivos(
        fechas
      );

    // ===============================================
    // VALIDAR QUE TODAS LAS FECHAS
    // CORRESPONDAN AL AÑO
    // ===============================================

    fechasLimpias.forEach(
      (festivo) => {

        const anioFecha =
          Number(
            festivo.fecha
              .substring(0, 4)
          );

        if (
          anioFecha !==
          anioValido
        ) {
          throw new Error(
            `La fecha ${festivo.fecha} no corresponde al año ${anioValido}.`
          );
        }
      }
    );

    const ref =
      doc(
        db,
        COLECCION_CONFIG,
        obtenerIdDocumento(
          anioValido
        )
      );

    const snap =
      await getDoc(ref);

    const datos = {
      anio:
        anioValido,

      configurado:
        Boolean(
          configurado
        ),

      fechas:
        fechasLimpias,

      actualizadoEn:
        serverTimestamp(),
    };

    if (!snap.exists()) {
      datos.fechaConfiguracion =
        serverTimestamp();
    }

    await setDoc(
      ref,
      datos,
      {
        merge: true,
      }
    );

    return obtenerFestivosAnio(
      anioValido
    );
  };


// =====================================================
// SABER SI UNA FECHA ES FESTIVO
// =====================================================

export const buscarFestivo = (
  fecha,
  configuraciones = []
) => {
  if (!fecha) {
    return null;
  }

  for (
    const configuracion
    of configuraciones
  ) {
    const encontrado =
      (
        configuracion
          ?.fechas || []
      ).find(
        (festivo) =>
          festivo.fecha ===
          fecha
      );

    if (encontrado) {
      return encontrado;
    }
  }

  return null;
};


// =====================================================
// OBTENER AÑOS QUE TOCA UN PERIODO
// =====================================================

export const obtenerAniosPeriodo = (
  periodoInicio,
  periodoFin
) => {
  if (
    !periodoInicio ||
    !periodoFin
  ) {
    return [];
  }

  const anioInicio =
    Number(
      String(
        periodoInicio
      ).substring(0, 4)
    );

  const anioFin =
    Number(
      String(
        periodoFin
      ).substring(0, 4)
    );

  if (
    !anioInicio ||
    !anioFin
  ) {
    return [];
  }

  const anios = [];

  for (
    let anio = anioInicio;
    anio <= anioFin;
    anio++
  ) {
    anios.push(anio);
  }

  return anios;
};


// =====================================================
// CARGAR FESTIVOS PARA UN PERIODO
// =====================================================

export const obtenerFestivosPeriodo =
  async (
    periodoInicio,
    periodoFin
  ) => {

    const anios =
      obtenerAniosPeriodo(
        periodoInicio,
        periodoFin
      );

    if (!anios.length) {
      return {
        configuraciones: [],
        aniosSinConfigurar: [],
        todoConfigurado: false,
      };
    }

    const configuraciones =
      await Promise.all(
        anios.map(
          (anio) =>
            obtenerFestivosAnio(
              anio
            )
        )
      );

    const aniosSinConfigurar =
      configuraciones
        .filter(
          (config) =>
            config.configurado !==
            true
        )
        .map(
          (config) =>
            config.anio
        );

    return {
      configuraciones,

      aniosSinConfigurar,

      todoConfigurado:
        aniosSinConfigurar
          .length === 0,
    };
  };