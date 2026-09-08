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
        setPreview(null);

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

      <h2
        style={{
          marginTop: 0,
          color:
            theme.colors?.text ||
            "#0F172A",
        }}
      >
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

        <p
          style={{
            marginTop: 16,
            color:
              theme.colors?.textLight ||
              "#64748B",
          }}
        >
          Procesando AF...
        </p>

      )}


      {preview && (

        <div
          style={{
            marginTop: 20,
            padding: 20,
            background:
              "#F8FAFC",
            borderRadius: 12,
            border:
              "1px solid #E2E8F0",
          }}
        >

          <h3
            style={{
              marginTop: 0,
              color:
                theme.colors?.text ||
                "#0F172A",
            }}
          >
            Vista Previa
          </h3>


          {/* INFORMACIÓN GENERAL */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: 12,
            }}
          >

            <div>

              <strong>
                AF:
              </strong>

              <div>
                {preview.af || "—"}
              </div>

            </div>


            <div>

              <strong>
                Sala:
              </strong>

              <div>
                {preview.sala || "—"}
              </div>

            </div>


            <div>

              <strong>
                Cliente:
              </strong>

              <div>
                {preview.cliente || "—"}
              </div>

            </div>


            <div>

              <strong>
                Actividad:
              </strong>

              <div>
                {
                  preview.tipoActividad ||
                  "—"
                }
              </div>

            </div>


            <div>

              <strong>
                Contacto:
              </strong>

              <div>
                {
                  preview.contacto ||
                  "—"
                }
              </div>

            </div>


            <div>

              <strong>
                Correo:
              </strong>

              <div>
                {
                  preview.correo ||
                  "—"
                }
              </div>

            </div>


            <div>

              <strong>
                Fecha Límite:
              </strong>

              <div>
                {
                  preview.fechaLimite ||
                  "—"
                }
              </div>

            </div>

          </div>


          {/* RAZÓN */}

          <div
            style={{
              marginTop: 20,
              padding: 16,
              background:
                "#FFFFFF",
              borderRadius: 10,
              border:
                "1px solid #E2E8F0",
            }}
          >

            <strong
              style={{
                color:
                  theme.colors?.text ||
                  "#0F172A",
              }}
            >
              📝 Razón de la actividad
            </strong>

            <div
              style={{
                marginTop: 8,
                color:
                  theme.colors?.textLight ||
                  "#64748B",
                lineHeight: 1.5,
              }}
            >
              {
                preview.razon ||
                preview.motivo ||
                "Sin razón especificada"
              }
            </div>

          </div>


          {/* TERMINALES */}

          <div
            style={{
              marginTop: 20,
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: 10,
              }}
            >

              <strong
                style={{
                  color:
                    theme.colors?.text ||
                    "#0F172A",
                }}
              >
                🎰 Terminales / Cambios
              </strong>

              <span
                style={{
                  fontSize: 13,
                  color:
                    theme.colors?.textLight ||
                    "#64748B",
                }}
              >
                {
                  preview.terminales
                    ?.length || 0
                } terminales
              </span>

            </div>


            {
              preview.terminales &&
              preview.terminales.length >
                0
                ? (

                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap: 10,
                    }}
                  >

                    {
                      preview.terminales.map(
                        (
                          terminal,
                          index
                        ) => (

                          <div
                            key={
                              `${terminal.sn}-${index}`
                            }
                            style={{
                              background:
                                "#FFFFFF",
                              border:
                                "1px solid #E2E8F0",
                              borderRadius:
                                10,
                              padding: 14,
                            }}
                          >

                            <div
                              style={{
                                display:
                                  "flex",
                                flexWrap:
                                  "wrap",
                                gap: 12,
                                fontSize:
                                  13,
                                marginBottom:
                                  8,
                                color:
                                  theme.colors
                                    ?.text ||
                                  "#0F172A",
                              }}
                            >

                              <span>
                                <strong>
                                  VLT:
                                </strong>{" "}
                                {
                                  terminal.vlt ||
                                  "—"
                                }
                              </span>


                              <span>
                                <strong>
                                  Loc:
                                </strong>{" "}
                                {
                                  terminal.loc ||
                                  "—"
                                }
                              </span>


                              <span>
                                <strong>
                                  SN:
                                </strong>{" "}
                                {
                                  terminal.sn ||
                                  "—"
                                }
                              </span>

                            </div>


                            <div
                              style={{
                                padding:
                                  "10px 12px",
                                background:
                                  "#F8FAFC",
                                borderRadius:
                                  8,
                                fontWeight:
                                  700,
                                color:
                                  theme.colors
                                    ?.text ||
                                  "#0F172A",
                              }}
                            >

                              {
                                terminal.juegoActual ||
                                "Sin juego actual"
                              }

                              <span
                                style={{
                                  margin:
                                    "0 10px",
                                  color:
                                    theme.colors
                                      ?.primary ||
                                    "#06B6D4",
                                }}
                              >
                                →
                              </span>

                              {
                                terminal.juegoNuevo ||
                                "Sin juego nuevo"
                              }

                            </div>

                          </div>

                        )
                      )
                    }

                  </div>

                )
                : (

                  <div
                    style={{
                      padding: 14,
                      background:
                        "#FFFFFF",
                      borderRadius: 10,
                      border:
                        "1px solid #E2E8F0",
                      color:
                        theme.colors
                          ?.textLight ||
                        "#64748B",
                    }}
                  >
                    No se detectaron
                    terminales en la AF.
                  </div>

                )
            }

          </div>


          {/* CREAR ACTIVIDAD */}

          <button
            style={{
              ...theme.button.success,
              marginTop: 22,
              width: "100%",
            }}
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