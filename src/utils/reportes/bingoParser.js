export const bingoParser =
  (rutaCompleta) => {

    try {

      const nombre =
        rutaCompleta
          .split("/")
          .pop();

      // =====================
      // CSV.ZIP
      // =====================

      const csvRegex =
        /GameReportF_(.+)_MEX-(\d{8})-(\d{6})\.csv\.zip$/i;

      const csvMatch =
        nombre.match(
          csvRegex
        );

      if (csvMatch) {

        const fechaRaw =
          csvMatch[2];

        // YYYYMMDD

        const fecha =
          `${fechaRaw.slice(0, 4)}-${
            fechaRaw.slice(4, 6)
          }-${
            fechaRaw.slice(6, 8)
          }`;

        return {

          sala:
            csvMatch[1]
              .trim(),

          fecha,

          bingoCSV: true,

          bingoJSON: false,

          spinCSV: false,

          spinJSON: false,

        };

      }

      // =====================
      // JSON
      // =====================

      const jsonRegex =
        /(\d+)_\d+_.+_(.+)_(\d{14})\.json$/i;

      const jsonMatch =
        nombre.match(
          jsonRegex
        );

      if (jsonMatch) {

        const fechaRaw =
          jsonMatch[3];

        // DDMMYYYYHHMMSS

        const day =
          fechaRaw.slice(0, 2);

        const month =
          fechaRaw.slice(2, 4);

        const year =
          fechaRaw.slice(4, 8);

        const fecha =
          `${year}-${month}-${day}`;

        return {

          sala:
            jsonMatch[2]
              .trim(),

          fecha,

          bingoCSV: false,

          bingoJSON: true,

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