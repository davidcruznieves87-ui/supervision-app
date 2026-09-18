// src/services/nomina/tecnicosNomina.js

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase";

import {
  normalizarNombre,
} from "./parserNomina";


// =====================================================
// COLECCIÓN
// =====================================================

const COLECCION =
  "nomina_tecnicos";


// =====================================================
// NORMALIZAR PARA COMPARACIONES
// =====================================================

export const nombreNormalizado = (
  nombre
) => {
  return normalizarNombre(nombre)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};


// =====================================================
// GENERAR ID SEGURO PARA FIRESTORE
// =====================================================

export const generarIdTecnico = (
  nombre
) => {
  const base =
    nombreNormalizado(nombre)
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );

  return (
    base ||
    `tecnico_${Date.now()}`
  );
};


// =====================================================
// OBTENER CATÁLOGO COMPLETO
// =====================================================

export const obtenerTecnicosNomina =
  async () => {

    const snap =
      await getDocs(
        collection(
          db,
          COLECCION
        )
      );

    const tecnicos =
      snap.docs.map(
        (documento) => ({
          id: documento.id,
          ...documento.data(),
        })
      );

    tecnicos.sort(
      (a, b) =>
        (a.nombre || "")
          .localeCompare(
            b.nombre || "",
            "es"
          )
      );

    return tecnicos;
  };


// =====================================================
// BUSCAR PRIMER DÍA DE ACTIVIDAD DEL TÉCNICO
// =====================================================

const obtenerPrimeraFechaActividad = (
  tecnicoHoras,
  periodoInicio
) => {
  const fechas =
    Object.keys(
      tecnicoHoras?.dias || {}
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

  return (
    fechas[0] ||
    periodoInicio ||
    null
  );
};


// =====================================================
// REGISTRAR TÉCNICOS NUEVOS DEL XLS
// =====================================================

export const sincronizarTecnicosDesdeXLS =
  async (
    resultadoHoras
  ) => {

    if (
      !resultadoHoras
        ?.tecnicos?.length
    ) {
      return obtenerTecnicosNomina();
    }


    // Primero cargamos el catálogo actual.
    const catalogoActual =
      await obtenerTecnicosNomina();


    const mapaExistentes =
      new Map();


    catalogoActual.forEach(
      (tecnico) => {

        const clave =
          tecnico
            .nombreNormalizado ||
          nombreNormalizado(
            tecnico.nombre
          );

        mapaExistentes.set(
          clave,
          tecnico
        );
      }
    );


    // ===============================================
    // REVISAR TÉCNICOS DETECTADOS EN XLS
    // ===============================================

    for (
      const tecnicoHoras
      of resultadoHoras.tecnicos
    ) {

      const nombre =
        normalizarNombre(
          tecnicoHoras.nombre
        );


      if (!nombre) {
        continue;
      }


      const clave =
        nombreNormalizado(
          nombre
        );


      // =============================================
      // YA EXISTE
      //
      // IMPORTANTE:
      // NO MODIFICAMOS activo.
      // NO REACTIVAMOS.
      // NO CAMBIAMOS fechaAlta.
      // =============================================

      if (
        mapaExistentes.has(
          clave
        )
      ) {
        continue;
      }


      // =============================================
      // TÉCNICO NUEVO
      // =============================================

      const id =
        generarIdTecnico(
          nombre
        );


      const ref =
        doc(
          db,
          COLECCION,
          id
        );


      // Seguridad adicional por si existe un documento
      // con el mismo ID pero el catálogo anterior no
      // logró relacionarlo.

      const snap =
        await getDoc(ref);


      if (
        snap.exists()
      ) {

        mapaExistentes.set(
          clave,
          {
            id:
              snap.id,

            ...snap.data(),
          }
        );

        continue;
      }


      const fechaAlta =
        obtenerPrimeraFechaActividad(
          tecnicoHoras,
          resultadoHoras
            .periodoInicio
        );


      const nuevoTecnico = {
        nombre,

        nombreNormalizado:
          clave,

        activo:
          true,

        fechaAlta:
          fechaAlta,

        fechaBaja:
          null,

        origenAlta:
          "XLS",

        creadoEn:
          serverTimestamp(),

        actualizadoEn:
          serverTimestamp(),
      };


      await setDoc(
        ref,
        nuevoTecnico
      );


      mapaExistentes.set(
        clave,
        {
          id,
          ...nuevoTecnico,
        }
      );
    }


    // ===============================================
    // DEVOLVER CATÁLOGO YA ACTUALIZADO
    // ===============================================

    return obtenerTecnicosNomina();
  };


// =====================================================
// ACTUALIZAR TÉCNICO
// =====================================================

export const actualizarTecnicoNomina =
  async (
    id,
    cambios
  ) => {

    if (!id) {
      throw new Error(
        "No se recibió el ID del técnico."
      );
    }


    const ref =
      doc(
        db,
        COLECCION,
        id
      );


    await updateDoc(
      ref,
      {
        ...cambios,

        actualizadoEn:
          serverTimestamp(),
      }
    );
  };


// =====================================================
// CAMBIAR ESTADO ACTIVO / INACTIVO
// =====================================================

export const cambiarEstadoTecnico =
  async (
    id,
    activo,
    fechaBaja = null
  ) => {

    if (!id) {
      throw new Error(
        "No se recibió el ID del técnico."
      );
    }


    const cambios = {
      activo:
        Boolean(activo),

      actualizadoEn:
        serverTimestamp(),
    };


    // Si lo damos de baja podemos guardar
    // la fecha indicada.
    if (
      activo === false &&
      fechaBaja
    ) {
      cambios.fechaBaja =
        fechaBaja;
    }


    // Si se reactiva manualmente,
    // eliminamos la fecha de baja lógica
    // dejándola en null.
    if (
      activo === true
    ) {
      cambios.fechaBaja =
        null;
    }


    const ref =
      doc(
        db,
        COLECCION,
        id
      );


    await updateDoc(
      ref,
      cambios
    );
  };


// =====================================================
// GUARDAR FECHAS ALTA / BAJA
// =====================================================

export const guardarFechasTecnico =
  async ({
    id,
    fechaAlta,
    fechaBaja,
  }) => {

    if (!id) {
      throw new Error(
        "No se recibió el ID del técnico."
      );
    }


    if (!fechaAlta) {
      throw new Error(
        "La fecha de alta es obligatoria."
      );
    }


    if (
      fechaBaja &&
      fechaBaja < fechaAlta
    ) {
      throw new Error(
        "La fecha de baja no puede ser anterior a la fecha de alta."
      );
    }


    await actualizarTecnicoNomina(
      id,
      {
        fechaAlta,

        fechaBaja:
          fechaBaja || null,
      }
    );
  };