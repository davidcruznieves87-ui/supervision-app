import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

// 🔥 LIMPIAR OBJETO PARA FIRESTORE
const limpiarMantenimiento =
  (mantenimiento) => {

    return {

      ...mantenimiento,

      maquinas:

        (
          mantenimiento
            ?.maquinas || []
        ).map(
          (maquina) => ({

            ...maquina,

            // 🔥 SOLO URL PARA FIRESTORE
            antes:

              typeof maquina.antes ===
              "object"

                ? maquina
                    ?.antes
                    ?.url || ""

                : maquina.antes || "",

            despues:

              typeof maquina.despues ===
              "object"

                ? maquina
                    ?.despues
                    ?.url || ""

                : maquina.despues || "",
          })
        ),
    };
  };

// 🔥 GUARDAR
export const guardarMantenimiento =
  async (mantenimiento) => {

    try {

      // 🔥 LIMPIAR PARA FIRESTORE
      const mantenimientoFirestore =
        limpiarMantenimiento(
          mantenimiento
        );

      console.log(
        "MANTENIMIENTO LIMPIO:",
        mantenimientoFirestore
      );

      await addDoc(

        collection(
          db,
          "mantenimientos"
        ),

        mantenimientoFirestore
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