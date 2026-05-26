export const agruparReportes =
  (reportes) => {

    const mapa = {};

    reportes.forEach(
      (item) => {

        const key =
          `${item.sala}_${item.fecha}`;

        // =====================
        // CREAR
        // =====================

        if (!mapa[key]) {

          mapa[key] = {

            sala:
              item.sala,

            fecha:
              item.fecha,

            bingoCSV:
              false,

            bingoJSON:
              false,

            spinCSV:
              false,

            spinJSON:
              false,

          };

        }

        // =====================
        // MERGE
        // =====================

        mapa[key] = {

          ...mapa[key],

          bingoCSV:

            mapa[key]
              .bingoCSV ||

            item.bingoCSV ||

            false,

          bingoJSON:

            mapa[key]
              .bingoJSON ||

            item.bingoJSON ||

            false,

          spinCSV:

            mapa[key]
              .spinCSV ||

            item.spinCSV ||

            false,

          spinJSON:

            mapa[key]
              .spinJSON ||

            item.spinJSON ||

            false,

        };

      }
    );

    // =====================
    // CALCULAR
    // =====================

    return Object.values(
      mapa
    ).map((item) => {

      let entregados = 0;

      let total = 0;

      // =====================
      // BINGO
      // =====================

      if (

        item.bingoCSV ||
        item.bingoJSON

      ) {

        total = 2;

        if (
          item.bingoCSV
        ) {

          entregados++;

        }

        if (
          item.bingoJSON
        ) {

          entregados++;

        }

      }

      // =====================
      // SPIN
      // =====================

      else if (

        item.spinCSV ||
        item.spinJSON

      ) {

        total = 2;

        if (
          item.spinCSV
        ) {

          entregados++;

        }

        if (
          item.spinJSON
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

      // COMPLETO

      if (
        entregados === total &&
        total > 0
      ) {

        estado =
          "✅ Completo";

      }

      // PARCIAL

      else if (
        entregados > 0
      ) {

        const faltantes = [];

        // BINGO

        if (
          total === 2 &&
          (
            item.bingoCSV ||
            item.bingoJSON
          )
        ) {

          if (
            !item.bingoCSV
          ) {

            faltantes.push(
              "Bingo CSV"
            );

          }

          if (
            !item.bingoJSON
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
            item.spinCSV ||
            item.spinJSON
          )
        ) {

          if (
            !item.spinCSV
          ) {

            faltantes.push(
              "Spin CSV"
            );

          }

          if (
            !item.spinJSON
          ) {

            faltantes.push(
              "Spin JSON"
            );

          }

        }

        estado =
          `⚠️ Parcial (${faltantes.join(", ")})`;

      }

      return {

        ...item,

        porcentaje,

        estado,

      };

    });

};