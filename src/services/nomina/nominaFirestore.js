// src/services/nomina/nominaFirestore.js

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../firebase";


// =====================================================
// CONSTANTES
// =====================================================

const COLECCION_ABIERTAS =
  "nominas_abiertas";

const COLECCION_HISTORIAL =
  "nominas_historial";

const NOMINA_ABIERTA_ID =
  "nomina_actual";


// =====================================================
// OBTENER NÓMINA ABIERTA
// =====================================================

export const obtenerNominaAbierta =
  async () => {

    const ref = doc(
      db,
      COLECCION_ABIERTAS,
      NOMINA_ABIERTA_ID
    );

    const snap =
      await getDoc(ref);

    if (!snap.exists()) {
      return null;
    }

    return {
      id: snap.id,
      ...snap.data(),
    };
  };


// =====================================================
// GUARDAR / ACTUALIZAR NÓMINA ABIERTA
//
// IMPORTANTE:
// Cada XLS reemplaza la captura anterior.
// No suma registros.
// =====================================================

export const guardarNominaAbiertaDB =
  async ({
    registros,
    nombreArchivo,
    resultado,
  }) => {

    if (!resultado) {
      throw new Error(
        "No existe un resultado de Nómina válido."
      );
    }

    if (
      !resultado.periodoInicio ||
      !resultado.periodoFin
    ) {
      throw new Error(
        "No se pudo determinar el periodo de Nómina."
      );
    }

    const ref = doc(
      db,
      COLECCION_ABIERTAS,
      NOMINA_ABIERTA_ID
    );

    const snapAnterior =
      await getDoc(ref);

    const datos = {
      estado: "ABIERTA",

      nombreArchivo:
        nombreArchivo || "",

      periodoInicio:
        resultado.periodoInicio,

      periodoFin:
        resultado.periodoFin,

      registros:
        Array.isArray(registros)
          ? registros
          : [],

      cantidadRegistros:
        Array.isArray(registros)
          ? registros.length
          : 0,

      cantidadTecnicos:
        resultado.tecnicos?.length ||
        0,

      registrosValidos:
        resultado.registrosValidos ||
        0,

      registrosIncompletos:
        resultado.registrosIncompletos ||
        0,

      fechaUltimaCarga:
        serverTimestamp(),

      actualizadoEn:
        serverTimestamp(),
    };

    if (!snapAnterior.exists()) {
      datos.fechaCreacion =
        serverTimestamp();
    }

    await setDoc(
      ref,
      datos,
      {
        merge: true,
      }
    );

    return obtenerNominaAbierta();
  };


// =====================================================
// CERRAR NÓMINA
//
// Guarda una fotografía completa.
// Después elimina la nómina abierta.
// =====================================================

export const cerrarNominaDB =
  async ({
    resultado,
    asistencia,
    registros,
    nombreArchivo,
    configuracionesFestivos = [],
    resumenSemanal = null,
    nominaAbierta = null,
  }) => {

    if (!resultado) {
      throw new Error(
        "No existe una Nómina para cerrar."
      );
    }

    if (!asistencia) {
      throw new Error(
        "No existe información de asistencia."
      );
    }

    const timestamp =
      Date.now();

    const idHistorial =
      `${resultado.periodoInicio}_${resultado.periodoFin}_${timestamp}`;

    const refHistorial =
      doc(
        db,
        COLECCION_HISTORIAL,
        idHistorial
      );

    const snapshotFinal = {
      estado: "CERRADA",

      periodoInicio:
        resultado.periodoInicio,

      periodoFin:
        resultado.periodoFin,

      nombreArchivo:
        nombreArchivo || "",

      cantidadRegistros:
        Array.isArray(registros)
          ? registros.length
          : 0,

      cantidadTecnicos:
        asistencia.tecnicos?.length ||
        0,

      registrosValidos:
        resultado.registrosValidos ||
        0,

      registrosIncompletos:
        resultado.registrosIncompletos ||
        0,

      // -----------------------------------------------
      // FOTO FINAL DE LOS CÁLCULOS
      // -----------------------------------------------

      resumenTecnicos:
        asistencia.tecnicos || [],

      totalesAsistencia:
        asistencia.totales || {},

      resumenSemanal:
        resumenSemanal || null,

      festivosAplicados:
        configuracionesFestivos || [],

      // -----------------------------------------------
      // FUENTE ORIGINAL
      // -----------------------------------------------

      registros:
        Array.isArray(registros)
          ? registros
          : [],

      // -----------------------------------------------
      // AUDITORÍA
      // -----------------------------------------------

      fechaCierre:
        serverTimestamp(),

      fechaUltimaCarga:
        nominaAbierta?.fechaUltimaCarga ||
        null,

      creadoEn:
        serverTimestamp(),
    };

    await setDoc(
      refHistorial,
      snapshotFinal
    );

    await deleteDoc(
      doc(
        db,
        COLECCION_ABIERTAS,
        NOMINA_ABIERTA_ID
      )
    );

    return {
      id: idHistorial,
      ...snapshotFinal,
    };
  };


// =====================================================
// OBTENER HISTORIAL
// =====================================================

export const obtenerHistorialNominas =
  async () => {

    const ref =
      collection(
        db,
        COLECCION_HISTORIAL
      );

    const consulta =
      query(
        ref,
        orderBy(
          "fechaCierre",
          "desc"
        )
      );

    const snap =
      await getDocs(consulta);

    return snap.docs.map(
      (documento) => ({
        id: documento.id,
        ...documento.data(),
      })
    );
  };


// =====================================================
// OBTENER UNA NÓMINA HISTÓRICA
// =====================================================

export const obtenerNominaHistorial =
  async (id) => {

    if (!id) {
      throw new Error(
        "No se indicó la Nómina."
      );
    }

    const ref =
      doc(
        db,
        COLECCION_HISTORIAL,
        id
      );

    const snap =
      await getDoc(ref);

    if (!snap.exists()) {
      throw new Error(
        "La Nómina solicitada no existe."
      );
    }

    return {
      id: snap.id,
      ...snap.data(),
    };
  };


// =====================================================
// FORMATEAR TIMESTAMP FIRESTORE
// =====================================================

export const timestampAFecha =
  (valor) => {

    if (!valor) {
      return null;
    }

    try {

      if (
        typeof valor.toDate ===
        "function"
      ) {
        return valor.toDate();
      }

      const fecha =
        new Date(valor);

      if (
        Number.isNaN(
          fecha.getTime()
        )
      ) {
        return null;
      }

      return fecha;

    } catch {

      return null;
    }
  };


// =====================================================
// FECHA/HORA VISUAL
// =====================================================

export const timestampATexto =
  (valor) => {

    const fecha =
      timestampAFecha(valor);

    if (!fecha) {
      return "-";
    }

    return fecha.toLocaleString(
      "es-MX"
    );
  };