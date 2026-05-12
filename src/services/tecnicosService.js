import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export const obtenerTecnicos =
  async (supervisor) => {

    try {

      const q = query(
        collection(db, "tecnicos"),
        where(
          "supervisor",
          "==",
          supervisor
        )
      );

      const querySnapshot =
        await getDocs(q);

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