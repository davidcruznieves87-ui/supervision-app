import { useState } from "react";

import theme from "../../styles/theme";

import {
  leerPDFAF,
  extraerAF,
} from "../../utils/af/parserAF";

function ImportarAF({

  onImportar,

}) {

  const [loading, setLoading] =
    useState(false);

  const [preview, setPreview] =
    useState(null);

  const procesarPDF =
    async (e) => {

      const file =
        e.target.files?.[0];

      if (!file) return;

      try {

        setLoading(true);

        const texto =
          await leerPDFAF(file);

        console.log(
          "TEXTO PDF:",
          texto
        );

        const datos =
          extraerAF(texto);

        console.log(
          "AF EXTRAIDA:",
          datos
        );

        setPreview(datos);

      } catch (error) {

        console.error(error);

        alert(
          "Error leyendo PDF"
        );

      } finally {

        setLoading(false);
      }
    };

  return (

    <div style={theme.card}>

      <h2>
        📄 Importar AF
      </h2>

      <input
        type="file"
        accept=".pdf"
        onChange={
          procesarPDF
        }
      />

      {loading && (

        <p>
          Procesando AF...
        </p>

      )}

      {preview && (

        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: "#F8FAFC",
            borderRadius: 12,
            border:
              "1px solid #E2E8F0",
          }}
        >

          <h3>
            Vista Previa
          </h3>

          <p>
            AF:
            {" "}
            {preview.af}
          </p>

          <p>
            Sala:
            {" "}
            {preview.sala}
          </p>

          <p>
            Cliente:
            {" "}
            {preview.cliente}
          </p>

          <p>
            Actividad:
            {" "}
            {preview.actividad}
          </p>

          <p>
            Contacto:
            {" "}
            {preview.contacto}
          </p>

          <p>
            Correo:
            {" "}
            {preview.correo}
          </p>

          <p>
            Fecha Límite:
            {" "}
            {preview.fechaLimite}
          </p>

          <button
            style={
              theme.button.success
            }
            onClick={() =>
              onImportar(
                preview
              )
            }
          >
            ✅ Crear Actividad
          </button>

        </div>

      )}

    </div>
  );
}

export default ImportarAF;