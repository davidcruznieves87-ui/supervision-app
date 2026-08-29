
// src/pages/ResumenJsonPage.jsx

import React, {
  useMemo,
  useRef,
  useState,
} from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import theme from "../styles/theme";

import {
  procesarArchivosJson,
  detectarCambiosHistoricos,
  contarTerminales,
} from "../utils/jsonComparadorParser";


function ResumenJsonPage() {

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [resultado, setResultado] =
    useState(null);

  const [procesando, setProcesando] =
    useState(false);

  const [progreso, setProgreso] =
    useState({
      procesados: 0,
      total: 0,
      porcentaje: 0,
    });

  const [vista, setVista] =
    useState("cambios");

  const [busqueda, setBusqueda] =
    useState("");

  const [
    serieSeleccionada,
    setSerieSeleccionada,
  ] = useState("");


  // =====================================================
  // DATOS
  // =====================================================

  const filas =
    resultado?.filas || [];


  const cambios = useMemo(
    () =>
      detectarCambiosHistoricos(
        filas
      ),
    [filas]
  );


  const totalTerminales =
    useMemo(
      () =>
        contarTerminales(
          filas
        ),
      [filas]
    );


  const cambiosPerfil =
    useMemo(
      () =>
        cambios.filter(
          (item) =>
            item.cambioPerfil
        ),
      [cambios]
    );


  // =====================================================
  // FILTROS
  // =====================================================

  const filasFiltradas =
    useMemo(() => {

      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return filas;
      }

      return filas.filter(
        (fila) => {

          return (

            String(
              fila.serie
            )
              .toLowerCase()
              .includes(texto)

            ||

            String(
              fila.vlt
            )
              .toLowerCase()
              .includes(texto)

            ||

            String(
              fila.juego
            )
              .toLowerCase()
              .includes(texto)

            ||

            String(
              fila.sala
            )
              .toLowerCase()
              .includes(texto)

          );
        }
      );

    }, [
      filas,
      busqueda,
    ]);


  const cambiosFiltrados =
    useMemo(() => {

      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return cambios;
      }

      return cambios.filter(
        (item) => {

          return (

            String(
              item.serie
            )
              .toLowerCase()
              .includes(texto)

            ||

            String(
              item.vlt
            )
              .toLowerCase()
              .includes(texto)

            ||

            String(
              item.juegoNuevo
            )
              .toLowerCase()
              .includes(texto)

            ||

            String(
              item.sala
            )
              .toLowerCase()
              .includes(texto)

            ||

            String(
              item.tipoCambio
            )
              .toLowerCase()
              .includes(texto)

          );
        }
      );

    }, [
      cambios,
      busqueda,
    ]);


  // =====================================================
  // HISTORIAL TERMINAL
  // =====================================================

  const historialSeleccionado =
    useMemo(() => {

      if (
        !serieSeleccionada
      ) {
        return [];
      }

      return filas
        .filter(
          (fila) =>
            String(
              fila.serie
            ) ===
            String(
              serieSeleccionada
            )
        )
        .sort(
          (a, b) =>
            a.fechaTimestamp -
            b.fechaTimestamp
        );

    }, [
      filas,
      serieSeleccionada,
    ]);


  // =====================================================
  // PROCESAR JSON
  // =====================================================

  const manejarArchivos =
    async (fileList) => {

      if (
        !fileList?.length
      ) {
        return;
      }

      setProcesando(true);

      setResultado(null);

      setSerieSeleccionada("");

      setBusqueda("");

      setProgreso({
        procesados: 0,
        total: fileList.length,
        porcentaje: 0,
      });

      try {

        const data =
          await procesarArchivosJson(

            fileList,

            (nuevoProgreso) => {

              setProgreso(
                nuevoProgreso
              );

            }

          );

        setResultado(
          data
        );

      } catch (error) {

        console.error(
          "ERROR PROCESANDO JSON:",
          error
        );

        alert(
          "Ocurrió un error al analizar los archivos JSON."
        );

      } finally {

        setProcesando(false);

      }
    };


  // =====================================================
  // LIMPIAR
  // =====================================================

  const limpiar = () => {

    setResultado(null);

    setBusqueda("");

    setSerieSeleccionada("");

    setVista("cambios");

    setProgreso({
      procesados: 0,
      total: 0,
      porcentaje: 0,
    });

    if (
      fileInputRef.current
    ) {

      fileInputRef.current.value =
        "";

    }

    if (
      folderInputRef.current
    ) {

      folderInputRef.current.value =
        "";

    }
  };


  // =====================================================
  // PDF COMPLETO
  // =====================================================

  const generarPdfCompleto =
    () => {

      if (
        !filas.length
      ) {

        alert(
          "No hay información para generar el PDF."
        );

        return;
      }

      const doc =
        new jsPDF({
          orientation:
            "landscape",
          unit:
            "mm",
          format:
            "a4",
        });


      doc.setFontSize(17);

      doc.text(
        "Resumen de Configuración de Terminales",
        14,
        15
      );


      doc.setFontSize(9);

      doc.text(
        `Reportes únicos analizados: ${
          resultado?.reportes?.length ||
          0
        }`,
        14,
        23
      );

      doc.text(
        `Terminales encontradas: ${totalTerminales}`,
        14,
        28
      );

      doc.text(
        `Cambios detectados: ${cambios.length}`,
        14,
        33
      );

      doc.text(
        `Cambios de perfil: ${cambiosPerfil.length}`,
        14,
        38
      );


      autoTable(
        doc,
        {

          startY: 44,

          head: [
            [
              "Sala",
              "Fecha",
              "VLT",
              "Serie",
              "Juego",
              "Versión",
              "Perfil",
            ],
          ],

          body:
            filas.map(
              (fila) => [

                fila.sala,

                fila.fechaReporte,

                fila.vlt,

                fila.serie,

                fila.juego,

                fila.version,

                fila.perfil,

              ]
            ),

          styles: {
            fontSize: 7,
            cellPadding: 2,
          },

          headStyles: {
            fillColor: [
              6,
              182,
              212,
            ],
            textColor: 255,
            fontStyle: "bold",
          },

          alternateRowStyles: {
            fillColor: [
              248,
              250,
              252,
            ],
          },

          columnStyles: {

            0: {
              cellWidth: 34,
            },

            1: {
              cellWidth: 23,
            },

            2: {
              cellWidth: 15,
            },

            3: {
              cellWidth: 27,
            },

            4: {
              cellWidth: 60,
            },

            5: {
              cellWidth: 24,
            },

            6: {
              cellWidth: 20,
            },

          },

        }
      );


      doc.save(
        "Resumen_Configuracion_Terminales.pdf"
      );
    };


  // =====================================================
  // PDF CAMBIOS
  // =====================================================

  const generarPdfCambios =
    () => {

      if (
        !cambios.length
      ) {

        alert(
          "No hay cambios detectados para generar el PDF."
        );

        return;
      }


      const doc =
        new jsPDF({
          orientation:
            "landscape",
          unit:
            "mm",
          format:
            "a4",
        });


      doc.setFontSize(17);

      doc.text(
        "Cambios Detectados en Terminales",
        14,
        15
      );


      doc.setFontSize(9);

      doc.text(
        `Cambios totales: ${cambios.length}`,
        14,
        23
      );

      doc.text(
        `Cambios de perfil: ${cambiosPerfil.length}`,
        14,
        28
      );


      autoTable(
        doc,
        {

          startY: 35,

          head: [
            [
              "Sala",
              "VLT",
              "Serie",
              "Juego",
              "Fecha anterior",
              "Perfil anterior",
              "Fecha cambio",
              "Perfil nuevo",
              "Cambio",
            ],
          ],

          body:
            cambios.map(
              (item) => [

                item.sala,

                item.vlt,

                item.serie,

                item.juegoNuevo,

                item.fechaAnterior,

                item.perfilAnterior,

                item.fechaCambio,

                item.perfilNuevo,

                item.tipoCambio,

              ]
            ),

          styles: {
            fontSize: 7,
            cellPadding: 2,
          },

          headStyles: {
            fillColor: [
              6,
              182,
              212,
            ],
            textColor: 255,
            fontStyle: "bold",
          },

          alternateRowStyles: {
            fillColor: [
              248,
              250,
              252,
            ],
          },

          didParseCell: (
            data
          ) => {

            if (
              data.section ===
                "body" &&
              cambios[
                data.row.index
              ]?.cambioPerfil
            ) {

              if (
                data.column.index ===
                  5 ||
                data.column.index ===
                  7 ||
                data.column.index ===
                  8
              ) {

                data.cell.styles.textColor =
                  [
                    220,
                    38,
                    38,
                  ];

                data.cell.styles.fontStyle =
                  "bold";

              }
            }
          },

        }
      );


      doc.save(
        "Cambios_Configuracion_Terminales.pdf"
      );
    };


  // =====================================================
  // TIPO DE CAMBIO
  // =====================================================

  const renderEstadoCambio =
    (item) => {

      if (
        item.cambioPerfil &&
        item.cambioJuego &&
        item.cambioVersion
      ) {

        return "🟣 Múltiples cambios";

      }

      if (
        item.cambioPerfil
      ) {

        return "🔴 Perfil";

      }

      if (
        item.cambioJuego
      ) {

        return "🔵 Juego";

      }

      if (
        item.cambioVersion
      ) {

        return "🟠 Versión";

      }

      return "—";
    };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      style={{
        ...theme.layout.page,
        minHeight: "auto",
      }}
    >

      {/* ==========================================
          TITULO
      ========================================== */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >

        <h1
          style={{
            ...theme.title,
            marginBottom: "8px",
          }}
        >
          🔍 Comparador de Configuración JSON
        </h1>

        <p
          style={{
            color:
              theme.colors.textLight,
            fontSize: "15px",
            margin: 0,
          }}
        >
          Analiza reportes históricos y detecta
          cambios de perfil, juego y versión
          entre terminales.
        </p>

      </div>


      {/* ==========================================
          CARGA
      ========================================== */}

      <div
        style={
          theme.card
        }
      >

        <h2
          style={{
            color:
              theme.colors.text,
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          📂 Cargar reportes JSON
        </h2>

        <p
          style={{
            color:
              theme.colors.textLight,
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          Puedes seleccionar múltiples archivos
          o una carpeta completa de reportes.
        </p>


        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >

          <button
            style={
              theme.button.primary
            }
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              procesando
            }
          >
            📄 Seleccionar JSON
          </button>


          <button
            style={
              theme.button.success
            }
            onClick={() =>
              folderInputRef.current?.click()
            }
            disabled={
              procesando
            }
          >
            📁 Seleccionar carpeta
          </button>


          {
            resultado && (

              <button
                style={
                  theme.button.danger
                }
                onClick={
                  limpiar
                }
              >
                🗑 Limpiar
              </button>

            )
          }

        </div>


        <input
          ref={
            fileInputRef
          }
          type="file"
          accept=".json,application/json"
          multiple
          hidden
          onChange={
            (e) =>
              manejarArchivos(
                e.target.files
              )
          }
        />


        <input
          ref={
            folderInputRef
          }
          type="file"
          accept=".json,application/json"
          multiple
          hidden
          webkitdirectory=""
          directory=""
          onChange={
            (e) =>
              manejarArchivos(
                e.target.files
              )
          }
        />


        {/* PROGRESO */}

        {
          procesando && (

            <div
              style={{
                marginTop:
                  "24px",
              }}
            >

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  marginBottom:
                    "8px",

                  color:
                    theme.colors.text,
                }}
              >

                <strong>
                  Analizando reportes...
                </strong>

                <span>
                  {
                    progreso.procesados
                  }
                  {" / "}
                  {
                    progreso.total
                  }
                </span>

              </div>


              <div
                style={{
                  width: "100%",

                  height:
                    "14px",

                  borderRadius:
                    "20px",

                  overflow:
                    "hidden",

                  background:
                    theme.colors.border,
                }}
              >

                <div
                  style={{
                    height:
                      "100%",

                    width:
                      `${progreso.porcentaje}%`,

                    background:
                      "linear-gradient(135deg,#06B6D4,#2563EB)",

                    transition:
                      "width .15s ease",
                  }}
                />

              </div>


              <div
                style={{
                  marginTop:
                    "7px",

                  textAlign:
                    "right",

                  color:
                    theme.colors.textLight,

                  fontSize:
                    "13px",
                }}
              >
                {
                  progreso.porcentaje
                }%
              </div>

            </div>

          )
        }

      </div>


      {/* ==========================================
          RESULTADOS
      ========================================== */}

      {
        resultado && (

          <>

            {/* KPI */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(170px, 1fr))",

                gap:
                  "16px",

                marginBottom:
                  "24px",
              }}
            >

              <KpiCard
                titulo="JSON seleccionados"
                valor={
                  resultado.archivosSeleccionados
                }
                icono="📄"
              />

              <KpiCard
                titulo="Reportes únicos"
                valor={
                  resultado.reportes.length
                }
                icono="📚"
              />

              <KpiCard
                titulo="Terminales"
                valor={
                  totalTerminales
                }
                icono="🎰"
              />

              <KpiCard
                titulo="Cambios"
                valor={
                  cambios.length
                }
                icono="🔄"
              />

              <KpiCard
                titulo="Cambios de perfil"
                valor={
                  cambiosPerfil.length
                }
                icono="🔴"
                destacado
              />

              <KpiCard
                titulo="Duplicados ignorados"
                valor={
                  resultado.duplicados
                }
                icono="♻️"
              />

            </div>


            {/* ERRORES */}

            {
              resultado.errores.length >
                0 && (

                <div
                  style={
                    theme.message.warning
                  }
                >

                  ⚠ Se encontraron{" "}
                  {
                    resultado.errores.length
                  }{" "}
                  archivo(s) que no
                  pudieron procesarse.

                  <div
                    style={{
                      marginTop:
                        "12px",
                    }}
                  >

                    {
                      resultado.errores
                        .slice(
                          0,
                          10
                        )
                        .map(
                          (
                            item,
                            index
                          ) => (

                            <div
                              key={
                                `${item.archivo}-${index}`
                              }
                              style={{
                                marginTop:
                                  "5px",

                                fontSize:
                                  "13px",
                              }}
                            >
                              •{" "}
                              {
                                item.archivo
                              }
                              :{" "}
                              {
                                item.error
                              }
                            </div>

                          )
                        )
                    }

                  </div>

                </div>

              )
            }


            {/* =====================================
                CONTROLES
            ===================================== */}

            <div
              style={
                theme.card
              }
            >

              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "10px",

                  flexWrap:
                    "wrap",

                  alignItems:
                    "center",
                }}
              >

                <BotonVista
                  activo={
                    vista ===
                    "cambios"
                  }
                  onClick={() =>
                    setVista(
                      "cambios"
                    )
                  }
                >
                  🔎 Cambios detectados
                </BotonVista>


                <BotonVista
                  activo={
                    vista ===
                    "general"
                  }
                  onClick={() =>
                    setVista(
                      "general"
                    )
                  }
                >
                  📋 Resumen general
                </BotonVista>


                <BotonVista
                  activo={
                    vista ===
                    "historial"
                  }
                  onClick={() =>
                    setVista(
                      "historial"
                    )
                  }
                >
                  🕒 Historial
                </BotonVista>


                <div
                  style={{
                    flex: 1,
                  }}
                />


                <button
                  style={
                    theme.button.success
                  }
                  onClick={
                    generarPdfCompleto
                  }
                >
                  📄 PDF completo
                </button>


                <button
                  style={
                    theme.button.primary
                  }
                  onClick={
                    generarPdfCambios
                  }
                >
                  📄 PDF cambios
                </button>

              </div>


              <div
                style={{
                  marginTop:
                    "20px",
                }}
              >

                <label
                  style={{
                    display:
                      "block",

                    fontWeight:
                      "800",

                    color:
                      theme.colors.text,

                    marginBottom:
                      "4px",
                  }}
                >
                  Buscar terminal
                </label>


                <input
                  value={
                    busqueda
                  }
                  onChange={
                    (e) =>
                      setBusqueda(
                        e.target.value
                      )
                  }
                  placeholder="Número de serie, VLT, juego o sala..."
                  style={{
                    ...theme.input,
                    marginBottom: 0,
                  }}
                />

              </div>

            </div>


            {/* =====================================
                VISTA CAMBIOS
            ===================================== */}

            {
              vista ===
                "cambios" && (

                <TablaCambios
                  cambios={
                    cambiosFiltrados
                  }
                  onSerie={
                    setSerieSeleccionada
                  }
                  cambiarVista={() =>
                    setVista(
                      "historial"
                    )
                  }
                  renderEstadoCambio={
                    renderEstadoCambio
                  }
                />

              )
            }


            {/* =====================================
                VISTA GENERAL
            ===================================== */}

            {
              vista ===
                "general" && (

                <TablaGeneral
                  filas={
                    filasFiltradas
                  }
                  onSerie={
                    (serie) => {

                      setSerieSeleccionada(
                        serie
                      );

                      setVista(
                        "historial"
                      );

                    }
                  }
                />

              )
            }


            {/* =====================================
                HISTORIAL
            ===================================== */}

            {
              vista ===
                "historial" && (

                <HistorialTerminal
                  filas={
                    filas
                  }
                  serieSeleccionada={
                    serieSeleccionada
                  }
                  setSerieSeleccionada={
                    setSerieSeleccionada
                  }
                  historial={
                    historialSeleccionado
                  }
                />

              )
            }

          </>

        )
      }

    </div>
  );
}


// =====================================================
// KPI
// =====================================================

function KpiCard({
  titulo,
  valor,
  icono,
  destacado = false,
}) {

  return (

    <div
      style={{
        ...theme.card,

        marginBottom: 0,

        padding:
          "20px",

        border:
          destacado
            ? `2px solid ${theme.colors.error}`
            : theme.card.border,

        background:
          destacado
            ? "#FEF2F2"
            : theme.colors.card,
      }}
    >

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          marginBottom:
            "10px",
        }}
      >

        <span
          style={{
            color:
              theme.colors.textLight,

            fontWeight:
              "700",

            fontSize:
              "13px",
          }}
        >
          {titulo}
        </span>

        <span
          style={{
            fontSize:
              "23px",
          }}
        >
          {icono}
        </span>

      </div>


      <div
        style={{
          fontSize:
            "30px",

          fontWeight:
            "900",

          color:
            destacado
              ? theme.colors.error
              : theme.colors.text,
        }}
      >
        {valor}
      </div>

    </div>
  );
}


// =====================================================
// BOTON VISTA
// =====================================================

function BotonVista({
  activo,
  onClick,
  children,
}) {

  return (

    <button
      onClick={
        onClick
      }
      style={{
        padding:
          "12px 18px",

        borderRadius:
          "16px",

        cursor:
          "pointer",

        fontWeight:
          "800",

        border:
          activo
            ? "none"
            : `1px solid ${theme.colors.border}`,

        background:
          activo
            ? "linear-gradient(135deg,#06B6D4,#2563EB)"
            : "#F8FAFC",

        color:
          activo
            ? "white"
            : theme.colors.text,

        transition:
          "0.2s",
      }}
    >
      {children}
    </button>
  );
}


// =====================================================
// TABLA CAMBIOS
// =====================================================

function TablaCambios({

  cambios,

  onSerie,

  cambiarVista,

  renderEstadoCambio,

}) {

  return (

    <div
      style={{
        ...theme.card,
        overflowX:
          "auto",
      }}
    >

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          marginBottom:
            "18px",
        }}
      >

        <div>

          <h2
            style={{
              margin: 0,
              color:
                theme.colors.text,
            }}
          >
            🔎 Cambios detectados
          </h2>

          <p
            style={{
              color:
                theme.colors.textLight,

              marginBottom:
                0,
            }}
          >
            Comparación contra el último
            reporte anterior disponible.
          </p>

        </div>


        <div
          style={{
            background:
              cambios.length > 0
                ? "#FEE2E2"
                : "#DCFCE7",

            color:
              cambios.length > 0
                ? "#991B1B"
                : "#166534",

            padding:
              "10px 16px",

            borderRadius:
              "16px",

            fontWeight:
              "900",
          }}
        >
          {cambios.length} cambio(s)
        </div>

      </div>


      {
        cambios.length ===
        0 ? (

          <div
            style={
              theme.message.success
            }
          >
            ✅ No se encontraron cambios
            con los filtros actuales.
          </div>

        ) : (

          <table
            style={{
              width:
                "100%",

              borderCollapse:
                "collapse",

              minWidth:
                "1150px",
            }}
          >

            <thead>

              <tr>

                <Th>
                  Sala
                </Th>

                <Th>
                  VLT
                </Th>

                <Th>
                  Serie
                </Th>

                <Th>
                  Juego
                </Th>

                <Th>
                  Fecha anterior
                </Th>

                <Th>
                  Perfil anterior
                </Th>

                <Th>
                  Fecha cambio
                </Th>

                <Th>
                  Perfil nuevo
                </Th>

                <Th>
                  Resultado
                </Th>

              </tr>

            </thead>


            <tbody>

              {
                cambios.map(
                  (item) => (

                    <tr
                      key={
                        item.id
                      }
                      style={{
                        background:
                          item.cambioPerfil
                            ? "#FFF7F7"
                            : "white",
                      }}
                    >

                      <Td>
                        {item.sala}
                      </Td>

                      <Td>
                        <strong>
                          {item.vlt}
                        </strong>
                      </Td>

                      <Td>

                        <button
                          onClick={() => {

                            onSerie(
                              item.serie
                            );

                            cambiarVista();

                          }}
                          style={{
                            border:
                              "none",

                            background:
                              "transparent",

                            cursor:
                              "pointer",

                            fontWeight:
                              "900",

                            color:
                              theme.colors.primary,

                            textDecoration:
                              "underline",
                          }}
                        >
                          {item.serie}
                        </button>

                      </Td>

                      <Td>
                        {item.juegoNuevo}
                      </Td>

                      <Td>
                        {
                          item.fechaAnterior
                        }
                      </Td>

                      <Td>

                        <span
                          style={{
                            display:
                              "inline-block",

                            background:
                              "#FEF3C7",

                            color:
                              "#92400E",

                            padding:
                              "6px 10px",

                            borderRadius:
                              "12px",

                            fontWeight:
                              "900",
                          }}
                        >
                          {
                            item.perfilAnterior
                          }
                        </span>

                      </Td>

                      <Td>

                        <strong
                          style={{
                            color:
                              item.cambioPerfil
                                ? theme.colors.error
                                : theme.colors.text,
                          }}
                        >
                          {
                            item.fechaCambio
                          }
                        </strong>

                      </Td>

                      <Td>

                        <span
                          style={{
                            display:
                              "inline-block",

                            background:
                              item.cambioPerfil
                                ? "#FEE2E2"
                                : "#DCFCE7",

                            color:
                              item.cambioPerfil
                                ? "#991B1B"
                                : "#166534",

                            padding:
                              "6px 10px",

                            borderRadius:
                              "12px",

                            fontWeight:
                              "900",
                          }}
                        >
                          {
                            item.perfilNuevo
                          }
                        </span>

                      </Td>

                      <Td>

                        <strong>
                          {
                            renderEstadoCambio(
                              item
                            )
                          }
                        </strong>

                      </Td>

                    </tr>

                  )
                )
              }

            </tbody>

          </table>

        )
      }

    </div>
  );
}


// =====================================================
// TABLA GENERAL
// =====================================================

function TablaGeneral({
  filas,
  onSerie,
}) {

  return (

    <div
      style={{
        ...theme.card,

        overflowX:
          "auto",
      }}
    >

      <h2
        style={{
          marginTop: 0,
          color:
            theme.colors.text,
        }}
      >
        📋 Resumen general
      </h2>


      <p
        style={{
          color:
            theme.colors.textLight,
        }}
      >
        {filas.length} registro(s)
        encontrados.
      </p>


      <table
        style={{
          width:
            "100%",

          borderCollapse:
            "collapse",

          minWidth:
            "950px",
        }}
      >

        <thead>

          <tr>

            <Th>
              Sala
            </Th>

            <Th>
              Fecha
            </Th>

            <Th>
              VLT
            </Th>

            <Th>
              Serie
            </Th>

            <Th>
              Juego
            </Th>

            <Th>
              Versión
            </Th>

            <Th>
              Perfil
            </Th>

          </tr>

        </thead>


        <tbody>

          {
            filas.map(
              (
                fila,
                index
              ) => (

                <tr
                  key={
                    `${fila.id}-${index}`
                  }
                >

                  <Td>
                    {fila.sala}
                  </Td>

                  <Td>
                    {
                      fila.fechaReporte
                    }
                  </Td>

                  <Td>
                    <strong>
                      {fila.vlt}
                    </strong>
                  </Td>

                  <Td>

                    <button
                      onClick={() =>
                        onSerie(
                          fila.serie
                        )
                      }
                      style={{
                        border:
                          "none",

                        background:
                          "transparent",

                        cursor:
                          "pointer",

                        color:
                          theme.colors.primary,

                        fontWeight:
                          "900",

                        textDecoration:
                          "underline",
                      }}
                    >
                      {fila.serie}
                    </button>

                  </Td>

                  <Td>
                    {fila.juego}
                  </Td>

                  <Td>
                    {fila.version}
                  </Td>

                  <Td>

                    <span
                      style={{
                        background:
                          "#E0F2FE",

                        color:
                          "#075985",

                        padding:
                          "6px 10px",

                        borderRadius:
                          "12px",

                        fontWeight:
                          "900",
                      }}
                    >
                      {fila.perfil}
                    </span>

                  </Td>

                </tr>

              )
            )
          }

        </tbody>

      </table>

    </div>
  );
}


// =====================================================
// HISTORIAL
// =====================================================

function HistorialTerminal({

  filas,

  serieSeleccionada,

  setSerieSeleccionada,

  historial,

}) {

  const terminales =
    useMemo(() => {

      const mapa =
        new Map();

      filas.forEach(
        (fila) => {

          if (
            !mapa.has(
              fila.serie
            )
          ) {

            mapa.set(
              fila.serie,
              {
                serie:
                  fila.serie,

                vlt:
                  fila.vlt,
              }
            );

          }
        }
      );


      return Array
        .from(
          mapa.values()
        )
        .sort(
          (a, b) =>
            String(
              a.serie
            ).localeCompare(
              String(
                b.serie
              ),
              undefined,
              {
                numeric: true,
              }
            )
        );

    }, [
      filas,
    ]);


  return (

    <div
      style={
        theme.card
      }
    >

      <h2
        style={{
          marginTop: 0,

          color:
            theme.colors.text,
        }}
      >
        🕒 Historial de terminal
      </h2>


      <p
        style={{
          color:
            theme.colors.textLight,
        }}
      >
        Selecciona una terminal para
        reconstruir su configuración
        histórica.
      </p>


      <select
        value={
          serieSeleccionada
        }
        onChange={
          (e) =>
            setSerieSeleccionada(
              e.target.value
            )
        }
        style={{
          ...theme.input,

          maxWidth:
            "500px",
        }}
      >

        <option
          value=""
        >
          Selecciona una terminal...
        </option>


        {
          terminales.map(
            (item) => (

              <option
                key={
                  item.serie
                }
                value={
                  item.serie
                }
              >
                VLT{" "}
                {item.vlt}
                {" — "}
                {item.serie}
              </option>

            )
          )
        }

      </select>


      {
        serieSeleccionada &&
        historial.length >
          0 && (

          <>

            {/* LINEA HISTORICA */}

            <div
              style={{
                marginTop:
                  "12px",

                marginBottom:
                  "24px",

                padding:
                  "20px",

                borderRadius:
                  "20px",

                background:
                  "#F8FAFC",

                border:
                  `1px solid ${theme.colors.border}`,
              }}
            >

              <strong
                style={{
                  color:
                    theme.colors.text,
                }}
              >
                Línea histórica de perfil
              </strong>


              <div
                style={{
                  display:
                    "flex",

                  flexWrap:
                    "wrap",

                  gap:
                    "8px",

                  marginTop:
                    "14px",

                  alignItems:
                    "center",
                }}
              >

                {
                  historial.map(
                    (
                      fila,
                      index
                    ) => {

                      const anterior =
                        index > 0
                          ? historial[
                              index - 1
                            ]
                          : null;

                      const cambio =
                        anterior &&
                        anterior.perfil !==
                          fila.perfil;

                      return (

                        <React.Fragment
                          key={
                            `${fila.id}-timeline-${index}`
                          }
                        >

                          {
                            index >
                              0 && (

                              <span
                                style={{
                                  color:
                                    cambio
                                      ? theme.colors.error
                                      : theme.colors.textLight,

                                  fontWeight:
                                    "900",
                                }}
                              >
                                →
                              </span>

                            )
                          }


                          <div
                            style={{
                              padding:
                                "9px 12px",

                              borderRadius:
                                "14px",

                              background:
                                cambio
                                  ? "#FEE2E2"
                                  : "#FFFFFF",

                              border:
                                cambio
                                  ? `2px solid ${theme.colors.error}`
                                  : `1px solid ${theme.colors.border}`,

                              fontSize:
                                "12px",
                            }}
                          >

                            <div
                              style={{
                                color:
                                  theme.colors.textLight,
                              }}
                            >
                              {
                                fila.fechaReporte
                              }
                            </div>

                            <strong
                              style={{
                                color:
                                  cambio
                                    ? theme.colors.error
                                    : theme.colors.text,
                              }}
                            >
                              Perfil{" "}
                              {
                                fila.perfil
                              }
                            </strong>

                          </div>

                        </React.Fragment>

                      );

                    }
                  )
                }

              </div>

            </div>


            {/* TABLA HISTORIAL */}

            <div
              style={{
                overflowX:
                  "auto",
              }}
            >

              <table
                style={{
                  width:
                    "100%",

                  borderCollapse:
                    "collapse",

                  minWidth:
                    "850px",
                }}
              >

                <thead>

                  <tr>

                    <Th>
                      Fecha
                    </Th>

                    <Th>
                      VLT
                    </Th>

                    <Th>
                      Serie
                    </Th>

                    <Th>
                      Juego
                    </Th>

                    <Th>
                      Versión
                    </Th>

                    <Th>
                      Perfil
                    </Th>

                    <Th>
                      Estado
                    </Th>

                  </tr>

                </thead>


                <tbody>

                  {
                    historial.map(
                      (
                        fila,
                        index
                      ) => {

                        const anterior =
                          index > 0
                            ? historial[
                                index - 1
                              ]
                            : null;


                        const cambioPerfil =
                          anterior &&
                          anterior.perfil !==
                            fila.perfil;


                        const cambioJuego =
                          anterior &&
                          anterior.juego !==
                            fila.juego;


                        const cambioVersion =
                          anterior &&
                          anterior.version !==
                            fila.version;


                        const existeCambio =
                          cambioPerfil ||
                          cambioJuego ||
                          cambioVersion;


                        return (

                          <tr
                            key={
                              `${fila.id}-${index}`
                            }
                            style={{
                              background:
                                cambioPerfil
                                  ? "#FFF7F7"
                                  : "white",
                            }}
                          >

                            <Td>

                              {
                                cambioPerfil &&
                                "🔴 "
                              }

                              {
                                fila.fechaReporte
                              }

                            </Td>


                            <Td>
                              <strong>
                                {fila.vlt}
                              </strong>
                            </Td>


                            <Td>
                              {fila.serie}
                            </Td>


                            <Td>
                              {fila.juego}
                            </Td>


                            <Td>
                              {fila.version}
                            </Td>


                            <Td>

                              <span
                                style={{
                                  display:
                                    "inline-block",

                                  padding:
                                    "6px 10px",

                                  borderRadius:
                                    "12px",

                                  fontWeight:
                                    "900",

                                  background:
                                    cambioPerfil
                                      ? "#FEE2E2"
                                      : "#E0F2FE",

                                  color:
                                    cambioPerfil
                                      ? "#991B1B"
                                      : "#075985",
                                }}
                              >
                                {
                                  fila.perfil
                                }
                              </span>


                              {
                                cambioPerfil && (

                                  <span
                                    style={{
                                      marginLeft:
                                        "8px",

                                      color:
                                        theme.colors.error,

                                      fontWeight:
                                        "800",
                                    }}
                                  >
                                    {
                                      anterior.perfil
                                    }
                                    {" → "}
                                    {
                                      fila.perfil
                                    }
                                  </span>

                                )
                              }

                            </Td>


                            <Td>

                              {
                                !anterior
                                  ? (
                                    <span
                                      style={{
                                        color:
                                          theme.colors.textLight,
                                      }}
                                    >
                                      Estado inicial
                                    </span>
                                  )

                                  : existeCambio
                                    ? (
                                      <strong
                                        style={{
                                          color:
                                            theme.colors.error,
                                        }}
                                      >
                                        ⚠ Cambio detectado
                                      </strong>
                                    )

                                    : (
                                      <span
                                        style={{
                                          color:
                                            theme.colors.success,

                                          fontWeight:
                                            "800",
                                        }}
                                      >
                                        ✓ Sin cambio
                                      </span>
                                    )
                              }

                            </Td>

                          </tr>

                        );

                      }
                    )
                  }

                </tbody>

              </table>

            </div>

          </>

        )
      }

    </div>
  );
}


// =====================================================
// TH
// =====================================================

function Th({
  children,
}) {

  return (

    <th
      style={{
        textAlign:
          "left",

        padding:
          "12px",

        borderBottom:
          `2px solid ${theme.colors.border}`,

        background:
          "#F8FAFC",

        whiteSpace:
          "nowrap",

        color:
          theme.colors.text,

        fontSize:
          "13px",

        fontWeight:
          "900",
      }}
    >
      {children}
    </th>
  );
}


// =====================================================
// TD
// =====================================================

function Td({
  children,
}) {

  return (

    <td
      style={{
        padding:
          "12px",

        borderBottom:
          `1px solid ${theme.colors.border}`,

        color:
          theme.colors.text,

        fontSize:
          "13px",

        verticalAlign:
          "middle",
      }}
    >
      {children}
    </td>
  );
}


export default ResumenJsonPage;

