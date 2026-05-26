import JSZip
from "jszip";

import {
  agruparReportes,
} from "./agruparReportes";

import {
  completarDiasFaltantes,
} from "./completarDiasFaltantes";

// =========================
// PARSE JSON SPIN
// =========================

const parseJSONSpin =
  (nombre) => {

    try {

      // =================================================
      // EJEMPLO
      // =================================================
      //
      // 13510_117_MX0014-0015_HIPODROMO-DE-AGUA-CALIENTE_24052026071502.json
      //
      // =================================================

      const match =
        nombre.match(
          /(\d+)_\d+_.+_(.+)_(\d{14})\.json$/i
        );

      if (!match) {

        return null;

      }

      // IDENTIFICADOR

      const identificador =
        match[1];

      // SALA

      let nombreSala =
        match[2]
          .replaceAll(
            "-",
            " "
          )
          .trim();

      // NORMALIZAR

      if (

        nombreSala.includes(
          "HIPODROMO"
        )

      ) {

        nombreSala =
          "HIPOAGUACALIENTE 9";

      }

      // SALA FINAL

      const sala =
        `${identificador} ${nombreSala}`;

      // FECHA

      const fechaRaw =
        match[3];

      const day =
        fechaRaw.slice(0, 2);

      const month =
        fechaRaw.slice(2, 4);

      const year =
        fechaRaw.slice(4, 8);

      const fecha =
        `${year}-${month}-${day}`;

      return {

        sala,

        fecha,

        bingoCSV: false,
        bingoJSON: false,

        // JSON maestro

        spinCSV: true,
        spinJSON: true,

      };

    } catch (error) {

      console.error(
        "❌ Error JSON Spin ZIP:",
        error
      );

      return null;

    }

};

// =========================
// PROCESAR ZIP SPIN
// =========================

export const procesarZIPSpin =
  async (archivo) => {

    try {

      const resultados = [];

      // =====================
      // ABRIR ZIP
      // =====================

      const zip =
        await JSZip.loadAsync(
          archivo
        );

      const archivos =
        Object.keys(
          zip.files
        );

      // =====================
      // RECORRER
      // =====================

      for (
        const nombre
        of archivos
      ) {

        if (
          nombre
            .toLowerCase()
            .endsWith(
              ".json"
            )
        ) {

          const parsed =
            parseJSONSpin(
              nombre
            );

          if (parsed) {

            resultados.push(
              parsed
            );

          }

        }

      }

      // =====================
      // AGRUPAR
      // =====================

      const agrupados =
        agruparReportes(
          resultados
        );

      // =====================
      // COMPLETAR
      // =====================

      return completarDiasFaltantes(
        agrupados
      );

    } catch (error) {

      console.error(
        "❌ Error ZIP Spin:",
        error
      );

      return [];

    }

};