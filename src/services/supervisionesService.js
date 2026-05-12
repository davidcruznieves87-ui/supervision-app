
import {

  collection,

  addDoc,

  getDocs,

  deleteDoc,

  doc,

} from "firebase/firestore";

import { db } from "../firebase";

// 🔥 OBTENER
export const obtenerSupervisiones =
  async () => {

    try {

      const querySnapshot =
        await getDocs(
          collection(
            db,
            "supervisiones"
          )
        );

      const datos = [];

      querySnapshot.forEach((d) => {

        datos.push({
          id: d.id,
          ...d.data(),
        });

      });

      return datos;

    } catch (error) {

      console.log(error);

      return [];
    }
  };

// 🔥 GUARDAR
export const guardarSupervisionDB =
  async (supervision) => {

    try {

      await addDoc(
        collection(
          db,
          "supervisiones"
        ),
        supervision
      );

      return true;

    } catch (error) {

      console.log(error);

      return false;
    }
  };

// 🔥 ELIMINAR
export const eliminarSupervisionDB =
  async (id) => {

    try {

      await deleteDoc(
        doc(
          db,
          "supervisiones",
          id
        )
      );

      return true;

    } catch (error) {

      console.log(error);

      return false;
    }
  };