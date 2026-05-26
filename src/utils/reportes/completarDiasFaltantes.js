export const completarDiasFaltantes =
  (reportes) => {

    if (
      reportes.length === 0
    ) {

      return [];

    }

    // =====================
    // AGRUPAR POR SALA
    // =====================

    const salas = {};

    reportes.forEach(
      (item) => {

        if (
          !salas[item.sala]
        ) {

          salas[item.sala] = [];

        }

        salas[item.sala].push(
          item
        );

      }
    );

    const resultadoFinal = [];

    // =====================
    // PROCESAR SALAS
    // =====================

    Object.keys(salas).forEach(
      (sala) => {

        const reportesSala =
          salas[sala];

        // =====================
        // AGRUPAR POR MES
        // =====================

        const meses = {};

        reportesSala.forEach(
          (item) => {

            // YYYY-MM

            const mes =
              item.fecha.substring(
                0,
                7
              );

            if (!meses[mes]) {

              meses[mes] = [];

            }

            meses[mes].push(
              item
            );

          }
        );

        // =====================
        // PROCESAR MESES
        // =====================

        Object.keys(meses).forEach(
          (mesKey) => {

            const items =
              meses[mesKey];

            // YYYY-MM

            const [
              año,
              mes,
            ] = mesKey
              .split("-");

            const totalDias =
              new Date(
                Number(año),
                Number(mes),
                0
              ).getDate();

            const mapa = {};

            // =====================
            // EXISTENTES
            // =====================

            items.forEach(
              (item) => {

                mapa[item.fecha] =
                  item;

              }
            );

            // =====================
            // GENERAR DÍAS
            // =====================

            for (
              let dia = 1;
              dia <= totalDias;
              dia++
            ) {

              const fecha =
                `${año}-${mes}-${String(
                  dia
                ).padStart(2, "0")}`;

              // EXISTE

              if (
                mapa[fecha]
              ) {

                resultadoFinal.push(
                  mapa[fecha]
                );

              }

              // FALTANTE

              else {

                resultadoFinal.push({

                  fecha,

                  sala,

                  csv: false,

                  json: false,

                  estado:
                    "❌ Faltante",

                });

              }

            }

          }
        );

      }
    );

    // =====================
    // ORDENAR
    // =====================

    return resultadoFinal.sort(
      (a, b) =>

        a.sala.localeCompare(
          b.sala
        ) ||

        a.fecha.localeCompare(
          b.fecha
        )
    );

};