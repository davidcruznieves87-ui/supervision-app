
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
}
from "firebase/firestore";

import {
  db,
}
from "../firebase";

// -------------------
// GUARDAR
// -------------------

export const guardarControlReportes =
async (reportes) => {

  try {

    for (const item of reportes) {

      // =====================
      // VALIDAR
      // =====================

      if (
        !item?.sala ||
        !item?.fecha
      ) {

        console.warn(
          "⚠️ Registro inválido:",
          item
        );

        continue;

      }

      const id =
        `${item.sala}_${item.fecha}`;

      const ref =
        doc(
          db,
          "control_reportes",
          id
        );

      // =====================
      // EXISTENTE
      // =====================

      const existente =
        await getDoc(ref);

      let dataFinal = {

        ...item,

        bingoCSV:
          Boolean(
            item.bingoCSV
          ),

        bingoJSON:
          Boolean(
            item.bingoJSON
          ),

        spinCSV:
          Boolean(
            item.spinCSV
          ),

        spinJSON:
          Boolean(
            item.spinJSON
          ),

      };

      // =====================
      // MERGE INTELIGENTE
      // =====================

      if (
        existente.exists()
      ) {

        const actual =
          existente.data();

        dataFinal = {

          ...actual,

          // conservar datos existentes
          sala:
            actual.sala ||
            item.sala,

          fecha:
            actual.fecha ||
            item.fecha,

          // merge incremental

          bingoCSV:
            Boolean(
              actual.bingoCSV ||
              item.bingoCSV
            ),

          bingoJSON:
            Boolean(
              actual.bingoJSON ||
              item.bingoJSON
            ),

          spinCSV:
            Boolean(
              actual.spinCSV ||
              item.spinCSV
            ),

          spinJSON:
            Boolean(
              actual.spinJSON ||
              item.spinJSON
            ),

        };

      }

      // =====================
      // CALCULAR
      // =====================

      let entregados = 0;

      let total = 0;

      // =====================
      // BINGO
      // =====================

      if (

        dataFinal.bingoCSV ||
        dataFinal.bingoJSON

      ) {

        total = 2;

        if (
          dataFinal.bingoCSV
        ) {

          entregados++;

        }

        if (
          dataFinal.bingoJSON
        ) {

          entregados++;

        }

      }

      // =====================
      // SPIN
      // =====================

      else if (

        dataFinal.spinCSV ||
        dataFinal.spinJSON

      ) {

        total = 2;

        if (
          dataFinal.spinCSV
        ) {

          entregados++;

        }

        if (
          dataFinal.spinJSON
        ) {

          entregados++;

        }

      }

      // =====================
      // PORCENTAJE
      // =====================

      const porcentaje =
        total > 0

          ? Math.round(
              (
                entregados /
                total
              ) * 100
            )

          : 0;

      // =====================
      // ESTADO
      // =====================

      let estado =
        "❌ Faltante";

      // =====================
      // COMPLETO
      // =====================

      if (
        entregados === total &&
        total > 0
      ) {

        estado =
          "✅ Completo";

      }

      // =====================
      // PARCIAL
      // =====================

      else if (
        entregados > 0
      ) {

        const faltantes = [];

        // BINGO

        if (
          total === 2 &&
          (
            dataFinal.bingoCSV ||
            dataFinal.bingoJSON
          )
        ) {

          if (
            !dataFinal.bingoCSV
          ) {

            faltantes.push(
              "Bingo CSV"
            );

          }

          if (
            !dataFinal.bingoJSON
          ) {

            faltantes.push(
              "Bingo JSON"
            );

          }

        }

        // SPIN

        if (
          total === 2 &&
          (
            dataFinal.spinCSV ||
            dataFinal.spinJSON
          )
        ) {

          if (
            !dataFinal.spinCSV
          ) {

            faltantes.push(
              "Spin CSV"
            );

          }

          if (
            !dataFinal.spinJSON
          ) {

            faltantes.push(
              "Spin JSON"
            );

          }

        }

        estado =
          `⚠️ Parcial (${faltantes.join(", ")})`;

      }

      // =====================
      // GUARDAR
      // =====================

      await setDoc(

        ref,

        {

          ...dataFinal,

          porcentaje,

          estado,

          // YYYYMM

          mes:
            item.fecha
              ? item.fecha
                  .substring(0, 7)
                  .replace("-", "")
              : "",

          // YYYY

          año:
            item.fecha
              ? Number(
                  item.fecha.substring(
                    0,
                    4
                  )
                )
              : 0,

          // DD

          dia:
            item.fecha
              ? Number(
                  item.fecha.substring(
                    8,
                    10
                  )
                )
              : 0,

          fechaCarga:
            new Date(),

        }

      );

    }

    console.log(
      "✅ Reportes guardados"
    );

  } catch (error) {

    console.error(
      "❌ Error guardando:",
      error
    );

  }

};

// -------------------
// OBTENER
// -------------------

export const obtenerControlReportes =
async () => {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "control_reportes"
        )
      );

    return snapshot.docs.map(
      (doc) => ({

        id:
          doc.id,

        ...doc.data(),

      })
    );

  } catch (error) {

    console.error(error);

    return [];

  }

};
