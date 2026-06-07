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

      const snapshot =
        await getDocs(

          collection(
            db,
            "supervisiones"
          )
              
        );
        console.log(
  "DOCUMENTOS:",
  snapshot.docs.length
);

snapshot.docs.forEach(
  (doc) => {

    console.log(
      "DOC:",
      doc.id,
      doc.data()
    );

  }
);

      const supervisiones =
        snapshot.docs.map(
          (doc) => {

            const data =
              doc.data();

            return {

              id: doc.id,

              folio:
                data?.folio || "",

              supervisor:
                data?.supervisor || "",

              sitio:
                data?.sitio || "",

              tecnico:
                data?.tecnico || "",

              fechaHora:
                data?.fechaHora || null,

              fallas:
                Array.isArray(
                  data?.fallas
                )

                  ? data.fallas

                  : [],

            };
          }
        );

      // 🔥 ORDENAR NUEVAS PRIMERO
      supervisiones.sort(
        (a, b) => {

          const fechaA =

            a?.fechaHora?.seconds || 0;

          const fechaB =

            b?.fechaHora?.seconds || 0;

          return fechaB - fechaA;
        }
      );

      return supervisiones;

    } catch (error) {

      console.log(
        "ERROR SUPERVISIONES:",
        error
      );

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

      if (!id) {

        console.log(
          "ID inválido"
        );

        return false;
      }

      await deleteDoc(

        doc(
          db,
          "supervisiones",
          id
        )
      );

      return true;

    } catch (error) {

      console.log(
        "ERROR ELIMINANDO:",
        error
      );

      return false;
    }
  };