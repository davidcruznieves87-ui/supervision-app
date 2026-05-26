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
      // RECORRER
      // =====================

      for (
        const entry
        of entries
      ) {

        if (
          entry.directory
        ) {
          continue;
        }

        const nombre =
          entry.filename;

        const parsed =
          bingoParser(
            nombre
          );

        if (parsed) {

          resultados.push(
            parsed
          );

        }

      }

      // =====================
      // CERRAR
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
      // COMPLETAR
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