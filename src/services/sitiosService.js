import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export const obtenerSitios =
  async (
    supervisor,
    rol
  ) => {

    try {

      let q;

      // 🔥 ADMIN Y SUPERADMIN
      if (

        rol === "admin" ||

        rol === "superadmin"

      ) {

        q = query(
          collection(
            db,
            "sitios"
          )
        );
      }

      // 🔥 SUPERVISOR
      else {

        q = query(

          collection(
            db,
            "sitios"
          ),

          where(
            "supervisor",
            "==",
            supervisor
          )
        );
      }

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