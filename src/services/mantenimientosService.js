import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

// 🔥 GUARDAR
export const guardarMantenimiento =
  async (mantenimiento) => {

    try {

      await addDoc(
        collection(
          db,
          "mantenimientos"
        ),
        mantenimiento
      );

      return true;

    } catch (error) {

      console.log(
        "ERROR FIRESTORE:",
        error
      );

      return false;
    }
  };

// 🔥 OBTENER
export const obtenerMantenimientos =
  async () => {

    try {

      const snapshot =
        await getDocs(
          collection(
            db,
            "mantenimientos"
          )
        );

      return snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

    } catch (error) {

      console.log(
        "ERROR OBTENER:",
        error
      );

      return [];
    }
  };