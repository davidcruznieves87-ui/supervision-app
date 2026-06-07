import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

const COLLECTION =
  "conectividad_salas";

// 🔥 OBTENER
export const obtenerConectividad =
  async () => {

    try {

      const snapshot =
        await getDocs(
          collection(
            db,
            COLLECTION
          )
        );

      return snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

    } catch (error) {

      console.log(error);

      return [];
    }
  };

// 🔥 GUARDAR / ACTUALIZAR
export const guardarConectividad =
  async (
    sala,
    datos
  ) => {

    try {

      await setDoc(

        doc(
          db,
          COLLECTION,
          sala
        ),

        {
          sala,

          ...datos,

          fechaActualizacion:
            serverTimestamp(),
        },

        {
          merge: true,
        }
      );

      return true;

    } catch (error) {

      console.log(error);

      return false;
    }
  };