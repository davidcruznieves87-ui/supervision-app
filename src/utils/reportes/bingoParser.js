
export const bingoParser =
  (nombre) => {

    try {

      // =====================
      // NORMALIZAR NOMBRE
      // =====================

      const archivo =
        nombre
          .split("/")
          .pop()
          .toLowerCase();

      // =====================
      // JSON
      // =====================

      if (
        archivo.endsWith(".json")
      ) {

        // =====================
        // EXTRAER FECHA
        // =====================

        let fecha =
          "SIN_FECHA";

        const match =
          archivo.match(
            /(\d{14})/
          );

        if (match) {

          const fechaRaw =
            match[1];

          // DDMMYYYYHHMMSS

          const day =
            fechaRaw.slice(0, 2);

          const month =
            fechaRaw.slice(2, 4);

          const year =
            fechaRaw.slice(4, 8);

          fecha =
            `${year}-${month}-${day}`;

        }

        // =====================
        // EXTRAER SALA
        // =====================

        let sala =
          archivo;

        // =====================
        // LIMPIAR EXTENSION
        // =====================

        sala =
          sala.replace(
            /\.json$/,
            ""
          );

        // =====================
        // EXTRAER SALA REAL
        // =====================

        const matchSala =
          sala.match(
            /mx\d{4}[-_]\d{4}[_-](.+)[_-]\d{14}/i
          );

        if (matchSala) {

          sala =
            matchSala[1];

        } else {

          // fallback simple

          sala =
            sala
              .split("_")
              .slice(3, -1)
              .join(" ");

        }

        // =====================
        // NORMALIZAR
        // =====================

        sala =
          sala
            .replaceAll(
              "_",
              " "
            )
            .replaceAll(
              "-",
              " "
            )
            .replace(/\s+/g, " ")
            .toUpperCase()
            .trim();

        console.log(
          "📄 JSON Bingo detectado:",
          sala,
          fecha
        );

        return {

          sala,

          fecha,

          bingoCSV: false,

          bingoJSON: true,

          spinCSV: false,

          spinJSON: false,

        };

      }

      // =====================
      // CSV
      // =====================

      if (
        archivo.endsWith(".csv") ||
        archivo.endsWith(".csv.zip")
      ) {

        // =====================
        // EXTRAER FECHA
        // =====================

        const fechaMatch =
          archivo.match(
            /(\d{8})/
          );

        let fecha =
          "SIN_FECHA";

        if (fechaMatch) {

          const fechaRaw =
            fechaMatch[1];

          fecha =
            `${fechaRaw.slice(0, 4)}-${
              fechaRaw.slice(4, 6)
            }-${
              fechaRaw.slice(6, 8)
            }`;

        }

        // =====================
        // EXTRAER SALA
        // =====================

        let sala =
          archivo;

        // =====================
        // LIMPIAR EXTENSIONES
        // =====================

        sala =
          sala
            .replace(
              /\.csv\.zip$/,
              ""
            )
            .replace(
              /\.csv$/,
              ""
            );

        // =====================
        // REMOVER PREFIJO
        // =====================

sala =
  sala.replace(
    /^gamereport[a-z]?_/i,
    ""
  );


        // =====================
        // REMOVER FECHAS
        // =====================

        sala =
          sala.replace(
            /[-_]\d{8}[-_]\d{6}/,
            ""
          );

        sala =
          sala.replace(
            /[-_]\d{8}/,
            ""
          );

        // =====================
        // REMOVER MEX
        // =====================

        sala =
          sala.replace(
            /_mex/gi,
            ""
          );

        // =====================
        // NORMALIZAR
        // =====================

        sala =
          sala
            .replaceAll(
              "_",
              " "
            )
            .replaceAll(
              "-",
              " "
            )
            .replace(/\s+/g, " ")
            .toUpperCase()
            .trim();

        console.log(
          "📄 CSV Bingo detectado:",
          sala,
          fecha
        );

        return {

          sala,

          fecha,

          bingoCSV: true,

          bingoJSON: false,

          spinCSV: false,

          spinJSON: false,

        };

      }

      return null;

    } catch (error) {

      console.error(
        "❌ Error bingoParser:",
        error
      );

      return null;

    }

};
