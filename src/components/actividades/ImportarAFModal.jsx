import { useState } from "react";

import theme from "../../styles/theme";

import {
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


  /*
  =====================================================
  PROCESAR PDF
  =====================================================
  */

 const procesarPDF =
  async (file) => {

    try {

      setLoading(true);

      setPreview(null);


      console.log(
        "===== ARCHIVO PDF =====",
        file
      );


      const datos =
        await extraerAF(
          file
        );


      console.log(
        "===== AF EXTRAIDA ====="
      );

      console.log(
        datos
      );


      console.log(
        "===== TERMINALES ====="
      );

      console.table(
        datos?.terminales || []
      );


      setPreview(
        datos
      );


    } catch (error) {

      console.error(
        "Error leyendo AF:",
        error
      );

      alert(
        "Error leyendo PDF"
      );

    } finally {

      setLoading(false);

    }
  };


  /*
  =====================================================
  CREAR ACTIVIDAD
  =====================================================
  */

  const crearActividad =
    () => {

      if (!preview) {

        alert(
          "Primero debes cargar una AF."
        );

        return;
      }


      onImportar(
        preview
      );

    };


  /*
  =====================================================
  RENDER
  =====================================================
  */

  return (

    <div
      style={{
        position:
          "fixed",

        inset:
          0,

        background:
          "rgba(0,0,0,0.75)",

        display:
          "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        zIndex:
          9999,

        padding:
          20,
      }}
    >

      <div
        style={{
          ...theme.card,

          width:
            700,

          maxWidth:
            "95vw",

          maxHeight:
            "90vh",

          overflowY:
            "auto",

          padding:
            24,
        }}
      >


        {/* =================================================
            TITULO
        ================================================= */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap:
              12,

            marginBottom:
              20,
          }}
        >

          <div>

            <h2
              style={{
                margin:
                  0,

                color:
                  theme.colors?.text ||
                  "#0F172A",
              }}
            >
              📄 Importar AF Orion
            </h2>


            <div
              style={{
                marginTop:
                  5,

                color:
                  theme.colors?.textLight ||
                  "#64748B",

                fontSize:
                  13,
              }}
            >
              Selecciona el PDF enviado por Orion.
            </div>

          </div>


          <button
            onClick={
              onCerrar
            }
            style={{
              border:
                "none",

              background:
                "transparent",

              cursor:
                "pointer",

              fontSize:
                24,

              color:
                "#64748B",
            }}
          >
            ✕
          </button>

        </div>


        {/* =================================================
            ARCHIVO
        ================================================= */}

        <div
          style={{
            padding:
              15,

            border:
              "1px dashed #CBD5E1",

            borderRadius:
              10,

            background:
              "#F8FAFC",
          }}
        >

          <input
            type="file"
            accept=".pdf,application/pdf"

            onChange={
              async (e) => {

                const file =
                  e.target
                    .files?.[0];


                if (!file) {

                  return;

                }


                setArchivo(
                  file
                );


                await procesarPDF(
                  file
                );

              }
            }
          />


          {
            archivo && (

              <div
                style={{
                  marginTop:
                    8,

                  fontSize:
                    12,

                  color:
                    "#64748B",
                }}
              >
                Archivo:{" "}
                <strong>
                  {archivo.name}
                </strong>
              </div>

            )
          }

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {
          loading && (

            <div
              style={{
                marginTop:
                  20,

                padding:
                  20,

                textAlign:
                  "center",

                background:
                  "#F8FAFC",

                borderRadius:
                  10,
              }}
            >
              ⏳ Procesando PDF...
            </div>

          )
        }


        {/* =================================================
            PREVIEW
        ================================================= */}

        {
          preview &&
          !loading && (

            <div
              style={{
                marginTop:
                  20,

                padding:
                  20,

                border:
                  "1px solid #E2E8F0",

                borderRadius:
                  12,

                background:
                  "#FFFFFF",
              }}
            >


              <h3
                style={{
                  marginTop:
                    0,

                  marginBottom:
                    18,

                  color:
                    theme.colors?.text ||
                    "#0F172A",
                }}
              >
                Vista Previa AF
              </h3>


              {/* AF */}

              <p>
                <strong>
                  AF:
                </strong>{" "}

                {
                  preview.af ||
                  "—"
                }
              </p>


              {/* SALA */}

              <p>
                <strong>
                  Sala:
                </strong>{" "}

                {
                  preview.sala ||
                  "—"
                }
              </p>


              {/* CLIENTE */}

              <p>
                <strong>
                  Cliente:
                </strong>{" "}

                {
                  preview.cliente ||
                  "—"
                }
              </p>


              {/* ACTIVIDAD */}

              <p>
                <strong>
                  Actividad:
                </strong>{" "}

                {
                  preview.tipoActividad ||
                  "—"
                }
              </p>


              {/* CONTACTO */}

              <p>
                <strong>
                  Contacto:
                </strong>{" "}

                {
                  preview.contacto ||
                  "—"
                }
              </p>


              {/* CORREO */}

              <p>
                <strong>
                  Correo:
                </strong>{" "}

                {
                  preview.correo ||
                  "—"
                }
              </p>


              {/* FECHA */}

              <p>
                <strong>
                  Fecha Límite:
                </strong>{" "}

                {
                  preview.fechaLimite ||
                  "—"
                }
              </p>


              {/* =================================================
                  RAZÓN
              ================================================= */}

              <div
                style={{
                  marginTop:
                    16,

                  padding:
                    12,

                  background:
                    "#F8FAFC",

                  border:
                    "1px solid #E2E8F0",

                  borderRadius:
                    10,
                }}
              >

                <strong>
                  📝 Razón de la actividad
                </strong>


                <div
                  style={{
                    marginTop:
                      7,

                    lineHeight:
                      1.5,

                    fontSize:
                      13,

                    color:
                      theme.colors?.textLight ||
                      "#64748B",
                  }}
                >
                  {
                    preview.razon ||
                    preview.motivo ||
                    "Sin razón especificada"
                  }
                </div>

              </div>


              <hr
                style={{
                  margin:
                    "20px 0",

                  border:
                    "none",

                  borderTop:
                    "1px solid #E2E8F0",
                }}
              />


              {/* =================================================
                  TERMINALES
              ================================================= */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  marginBottom:
                    12,
                }}
              >

                <h4
                  style={{
                    margin:
                      0,
                  }}
                >
                  🎰 Terminales
                </h4>


                <span
                  style={{
                    background:
                      "#E2E8F0",

                    borderRadius:
                      20,

                    padding:
                      "4px 10px",

                    fontSize:
                      12,

                    fontWeight:
                      700,
                  }}
                >
                  {
                    preview.terminales
                      ?.length ||
                    0
                  }
                </span>

              </div>


              {
                preview.terminales
                  ?.length > 0 ? (

                  <div
                    style={{
                      display:
                        "flex",

                      flexDirection:
                        "column",

                      gap:
                        8,
                    }}
                  >

                    {
                      preview
                        .terminales
                        .map(
                          (
                            terminal,
                            index
                          ) => (

                            <div
                              key={
                                `${terminal.sn}-${index}`
                              }
                              style={{
                                padding:
                                  12,

                                border:
                                  "1px solid #E2E8F0",

                                borderRadius:
                                  8,

                                background:
                                  "#F8FAFC",
                              }}
                            >


                              {/* DATOS */}

                              <div
                                style={{
                                  display:
                                    "flex",

                                  flexWrap:
                                    "wrap",

                                  gap:
                                    12,

                                  fontSize:
                                    12,
                                }}
                              >

                                <div>
                                  <strong>
                                    SN:
                                  </strong>{" "}
                                  {
                                    terminal.sn ||
                                    "—"
                                  }
                                </div>


                                <div>
                                  <strong>
                                    VLT:
                                  </strong>{" "}
                                  {
                                    terminal.vlt ||
                                    "—"
                                  }
                                </div>


                                <div>
                                  <strong>
                                    LOC:
                                  </strong>{" "}
                                  {
                                    terminal.loc ||
                                    "—"
                                  }
                                </div>

                              </div>


                              {/* CAMBIO DE JUEGO */}

                              {
                                (
                                  terminal.juegoActual ||
                                  terminal.juegoNuevo
                                ) && (

                                  <div
                                    style={{
                                      marginTop:
                                        8,

                                      paddingTop:
                                        8,

                                      borderTop:
                                        "1px solid #E2E8F0",

                                      fontSize:
                                        13,

                                      fontWeight:
                                        700,

                                      color:
                                        theme.colors?.text ||
                                        "#0F172A",
                                    }}
                                  >

                                    {
                                      terminal.juegoActual ||
                                      "Sin juego"
                                    }


                                    {
                                      terminal.juegoNuevo ? (

                                        <>

                                          <span
                                            style={{
                                              margin:
                                                "0 8px",

                                              color:
                                                theme.colors?.primary ||
                                                "#06B6D4",

                                              fontSize:
                                                16,
                                            }}
                                          >
                                            →
                                          </span>


                                          <span>
                                            {
                                              terminal.juegoNuevo
                                            }
                                          </span>

                                        </>

                                      ) : (

                                        <span
                                          style={{
                                            marginLeft:
                                              8,

                                            color:
                                              "#64748B",

                                            fontWeight:
                                              500,

                                            fontSize:
                                              12,
                                          }}
                                        >
                                          (sin cambio de juego)
                                        </span>

                                      )
                                    }

                                  </div>

                                )
                              }

                            </div>

                          )
                        )
                    }

                  </div>

                ) : (

                  <div
                    style={{
                      padding:
                        15,

                      textAlign:
                        "center",

                      background:
                        "#F8FAFC",

                      borderRadius:
                        8,

                      color:
                        "#64748B",

                      fontSize:
                        13,
                    }}
                  >
                    No se detectaron terminales.
                  </div>

                )
              }


              <hr
                style={{
                  margin:
                    "20px 0",

                  border:
                    "none",

                  borderTop:
                    "1px solid #E2E8F0",
                }}
              />


              {/* =================================================
                  INDICACIONES ESPECIALES
              ================================================= */}

              <h4>
                📋 Indicaciones Especiales
              </h4>


              <div
                style={{
                  whiteSpace:
                    "pre-wrap",

                  fontSize:
                    13,

                  lineHeight:
                    1.5,

                  padding:
                    12,

                  background:
                    "#F8FAFC",

                  borderRadius:
                    8,

                  border:
                    "1px solid #E2E8F0",
                }}
              >

                {
                  preview
                    .indicacionesEspeciales ||
                  "Sin indicaciones especiales."
                }

              </div>

            </div>

          )
        }


        {/* =================================================
            BOTONES
        ================================================= */}

        <div
          style={{
            display:
              "flex",

            gap:
              10,

            marginTop:
              25,

            justifyContent:
              "flex-end",

            flexWrap:
              "wrap",
          }}
        >

          <button
            style={{
              ...theme.button.success,

              opacity:
                !preview ||
                loading
                  ? 0.5
                  : 1,

              cursor:
                !preview ||
                loading
                  ? "not-allowed"
                  : "pointer",
            }}

            disabled={
              !preview ||
              loading
            }

            onClick={
              crearActividad
            }
          >
            ✅ Crear Actividad
          </button>


          <button
            style={
              theme.button.danger
            }
            onClick={
              onCerrar
            }
          >
            Cancelar
          </button>

        </div>

      </div>

    </div>

  );
}


export default ImportarAFModal;