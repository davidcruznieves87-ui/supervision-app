import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase";

const ACTIVIDADES_COLLECTION = "actividades";

// 🔥 CREAR
export const crearActividad = async (actividad) => {
  try {
    const docRef = await addDoc(
      collection(db, ACTIVIDADES_COLLECTION),
      {
        ...actividad,
        estado: actividad.estado || "PENDIENTE",
        fechaCreacion: serverTimestamp(),
      }
    );

    return docRef.id;
  } catch (error) {
    console.error(
      "Error creando actividad:",
      error
    );
    throw error;
  }
};

// 🔥 OBTENER
export const obtenerActividades = async () => {
  try {
    const q = query(
      collection(db, ACTIVIDADES_COLLECTION),
      orderBy("fechaCreacion", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(
      "Error obteniendo actividades:",
      error
    );
    return [];
  }
};

// 🔥 ACTUALIZAR
export const actualizarActividad = async (
  id,
  datos
) => {
  try {
    const ref = doc(
      db,
      ACTIVIDADES_COLLECTION,
      id
    );

    await updateDoc(ref, datos);

    return true;
  } catch (error) {
    console.error(
      "Error actualizando actividad:",
      error
    );
    throw error;
  }
};

// 🔥 ELIMINAR
export const eliminarActividad = async (id) => {
  try {
    await deleteDoc(
      doc(
        db,
        ACTIVIDADES_COLLECTION,
        id
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Error eliminando actividad:",
      error
    );
    throw error;
  }
};