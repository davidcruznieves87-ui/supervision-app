import { useState } from "react";

import theme from "../../styles/theme";

import {
  leerPDFAF,
  extraerAF,
} from "../../utils/af/parserAF";

function ImportarAFModal({

  onCerrar,
  onImportar,

}) {

  const [archivo, setArchivo] =
    useState(null);

  const [preview, setPreview] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const procesarPDF =
    async (file) => {

      try {

        setLoading(true);

        const texto =
          await leerPDFAF(file);
console.log(
  JSON.stringify(
    texto
  )
);
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

    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,0.75)",
        display: "flex",
        justifyContent:
          "center",
        alignItems:
          "center",
        zIndex: 9999,
      }}
    >

      <div
        style={{
          ...theme.card,
          width: 700,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >

        <h2>
          📄 Importar AF Orion
        </h2>

        <input
          type="file"
          accept=".pdf"
          onChange={async (e) => {

            const file =
              e.target.files?.[0];

            if (!file) return;

            setArchivo(file);

            await procesarPDF(
              file
            );

          }}
        />

        {loading && (

          <p>
            Procesando PDF...
          </p>

        )}

        {preview && (

          <div
            style={{
              marginTop: 20,
              padding: 20,
              border:
                "1px solid #E2E8F0",
              borderRadius: 12,
            }}
          >

            <h3>
              Vista Previa AF
            </h3>

            <p>
              <strong>
                AF:
              </strong>
              {" "}
              {preview.af}
            </p>

            <p>
              <strong>
                Sala:
              </strong>
              {" "}
              {preview.sala}
            </p>

            <p>
              <strong>
                Cliente:
              </strong>
              {" "}
              {preview.cliente}
            </p>

            <p>
              <strong>
                Actividad:
              </strong>
              {" "}
              {
                preview.tipoActividad
              }
            </p>

            <p>
              <strong>
                Contacto:
              </strong>
              {" "}
              {preview.contacto}
            </p>

            <p>
              <strong>
                Correo:
              </strong>
              {" "}
              {preview.correo}
            </p>

            <p>
              <strong>
                Fecha Límite:
              </strong>
              {" "}
              {
                preview.fechaLimite
              }
            </p>

            <hr />

<h4>
  🎰 Terminales
</h4>

{preview.terminales?.map(
  (terminal) => (

    <div
      key={terminal.sn}
      style={{
        padding: 8,
        borderBottom:
          "1px solid #E2E8F0",
      }}
    >

      <div>
        <strong>
          SN:
        </strong>
        {" "}
        {terminal.sn}
      </div>

      <div>
        <strong>
          VLT:
        </strong>
        {" "}
        {terminal.vlt}
      </div>

      <div>
        <strong>
          LOC:
        </strong>
        {" "}
        {terminal.loc}
      </div>

    </div>

  )
)}

<hr />

<h4>
  📋 Indicaciones Especiales
</h4>

<div
  style={{
    whiteSpace:
      "pre-wrap",
    fontSize: 13,
  }}
>
  {
    preview.indicacionesEspeciales
  }
</div>

          </div>

        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 25,
          }}
        >

          <button
            style={
              theme.button.success
            }
            disabled={!preview}
            onClick={() =>
              onImportar(
                preview
              )

              
            }
            
          >
            ✅ Crear Actividad
          </button>



          <button
            style={
              theme.button.danger
            }
            onClick={onCerrar}
          >
            Cancelar
          </button>

        </div>

      </div>

    </div>

  );
}

export default ImportarAFModal;