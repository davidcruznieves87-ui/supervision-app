
import {
  ZipReader,
  BlobReader,
} from "@zip.js/zip.js";

import {
  bingoParser,
} from "./bingoParser";

import {
  agruparReportes,
} from "./agruparReportes";

import {
  completarDiasFaltantes,
} from "./completarDiasFaltantes";

// =====================
// PROCESAR ZIP BINGO
// =====================

export const procesarZIP =
  async (file) => {

    try {

      const resultados = [];

      // =====================
      // LEER ZIP
      // =====================

      const reader =
        new ZipReader(
          new BlobReader(file)
        );

      const entries =
        await reader.getEntries();

      // =====================
      // RECORRER ARCHIVOS
      // =====================

      for (const entry of entries) {

        // Ignorar carpetas
        if (entry.directory) {
          continue;
        }

        const nombre =
          entry.filename.toLowerCase();

        // =====================
        // SOLO JSON / CSV
        // =====================

        const esJSON =
          nombre.endsWith(".json");

        const esCSV =
          nombre.endsWith(".csv") ||
          nombre.endsWith(".csv.zip");

        if (!esJSON && !esCSV) {
          continue;
        }

        try {

          console.log(
            "📄 Archivo detectado:",
            nombre
          );

          // =====================
          // PARSEAR SOLO NOMBRE
          // =====================

          const parsed =
            bingoParser(nombre);

          if (parsed) {

            resultados.push(
              parsed
            );

          }

        } catch (error) {

          console.error(
            "❌ Error leyendo archivo:",
            nombre,
            error
          );

        }

      }

      // =====================
      // CERRAR ZIP
      // =====================

      await reader.close();

      // =====================
      // AGRUPAR
      // =====================

      const agrupados =
        agruparReportes(
          resultados
        );

      // =====================
      // COMPLETAR DÍAS
      // =====================

      return completarDiasFaltantes(
        agrupados
      );

    } catch (error) {

      console.error(
        "❌ Error procesando ZIP:",
        error
      );

      return [];

    }

};
