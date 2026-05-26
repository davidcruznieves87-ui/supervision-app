import { useEffect, useRef }
from "react";

import {
  procesar7zSpin,
} from "../../utils/reportes/procesar7zSpin";

import {
  procesarZIPSpin,
} from "../../utils/reportes/procesarZIPSpin";

import {
  procesarZIP as procesarZIPBingo,
} from "../../utils/reportes/procesarZIP";

import theme
from "../../styles/theme";

function SubidaReportes({

  setResultados,

  resetUpload,

}) {

  // =====================
  // REF
  // =====================

  const inputRef =
    useRef(null);

  // =====================
  // RESET
  // =====================

  useEffect(() => {

    if (
      inputRef.current
    ) {

      inputRef.current.value =
        "";

    }

  }, [resetUpload]);

  // =====================
  // SUBIR
  // =====================

  const manejarArchivo =
    async (event) => {

      try {

        const archivo =
          event.target.files[0];

        if (!archivo) {
          return;
        }

        const nombre =
          archivo.name.toLowerCase();

        // =====================
        // BINGO
        // =====================

       if (
  nombre.endsWith(
    ".zip"
  )
) {

  // =====================
  // SPIN SIMPLE
  // =====================

  if (

    nombre.includes(
      "spin"
    )

  ) {

    const resultado =
      await procesarZIPSpin(
        archivo
      );

    setResultados(
      resultado
    );

    return;

  }

  // =====================
  // BINGO
  // =====================

  const resultado =
    await procesarZIPBingo(
      archivo
    );

  setResultados(
    resultado
  );

  return;

}
        // =====================
        // SPIN
        // =====================

        if (
          nombre.endsWith(
            ".7z"
          )
        ) {

          const resultado =
            await procesar7zSpin(
              archivo
            );

          setResultados(
            resultado
          );

          return;
        }

        alert(
          "Formato no soportado"
        );

      } catch (error) {

        console.error(
          "❌ Error upload:",
          error
        );

        alert(
          "Error procesando archivo"
        );
      }
    };

  // =====================
  // LIMPIAR
  // =====================

  const limpiarInput =
    () => {

      if (
        inputRef.current
      ) {

        inputRef.current.value =
          "";

      }

      setResultados([]);

    };

  return (

    <div
      style={{
        marginBottom: "25px",
      }}
    >

      {/* SUBIR */}

      <label
        htmlFor="zip-upload"
        style={{
          ...theme.button.primary,

          display:
            "inline-flex",

          alignItems:
            "center",

          gap: "10px",
        }}
      >

        📂 Seleccionar Archivo

      </label>

      {/* INPUT */}

      <input
        ref={inputRef}
        id="zip-upload"
        type="file"
        accept=".zip,.7z"
        onChange={manejarArchivo}
        style={{
          display: "none",
        }}
      />

      {/* CANCELAR */}

      <button
        onClick={limpiarInput}
        style={{
          ...theme.button.danger,

          marginLeft:
            "10px",
        }}
      >

        ❌ Cancelar

      </button>

    </div>

  );

}

export default
SubidaReportes;