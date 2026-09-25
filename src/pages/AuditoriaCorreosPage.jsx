import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import {
  useEffect,
  useState,
} from "react";

import {
  db,
} from "../firebase";

import theme from "../styles/theme";


function AuditoriaCorreosPage() {

  // =====================================================
  // ESTADOS
  // =====================================================

  const [estadoSistema, setEstadoSistema] =
    useState(null);

  const [envios, setEnvios] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [cargandoEnvios, setCargandoEnvios] =
    useState(true);

  const [error, setError] =
    useState("");

  const [errorEnvios, setErrorEnvios] =
    useState("");

  const [loteSeleccionado, setLoteSeleccionado] =
    useState(null);

    const [eventosLote, setEventosLote] =
  useState([]);

const [cargandoEventos, setCargandoEventos] =
  useState(false);

const [errorEventos, setErrorEventos] =
  useState("");

  // =====================================================
  // HEARTBEAT
  // =====================================================

  useEffect(() => {

    const referencia = doc(
      db,
      "estado_envio_correos",
      "principal"
    );

    const unsubscribe = onSnapshot(

      referencia,

      (snapshot) => {

        if (snapshot.exists()) {

          setEstadoSistema({
            id: snapshot.id,
            ...snapshot.data(),
          });

          setError("");

        } else {

          setEstadoSistema(null);

          setError(
            "No existe información de estado del sistema."
          );

        }

        setCargando(false);

      },

      (err) => {

        console.error(
          "Error al consultar estado:",
          err
        );

        setEstadoSistema(null);

        setError(
          "No fue posible consultar el estado remoto."
        );

        setCargando(false);

      }

    );

    return () => {
      unsubscribe();
    };

  }, []);


  // =====================================================
  // HISTORIAL DE ENVIOS
  // =====================================================

  useEffect(() => {

    const referencia = query(
      collection(
        db,
        "auditoria_envios"
      ),
      orderBy(
        "fechaActualizacion",
        "desc"
      )
    );

    const unsubscribe = onSnapshot(

      referencia,

      (snapshot) => {

        const registros =
          snapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            })
          );

        setEnvios(registros);

        setErrorEnvios("");

        setCargandoEnvios(false);

      },

      (err) => {

        console.error(
          "Error al consultar auditoría de envíos:",
          err
        );

        setEnvios([]);

        setErrorEnvios(
          "No fue posible consultar el historial de envíos."
        );

        setCargandoEnvios(false);

      }

    );

    return () => {
      unsubscribe();
    };

  }, []);

  // =====================================================
// EVENTOS DEL LOTE SELECCIONADO
// =====================================================

useEffect(() => {

  if (!loteSeleccionado?.loteId) {

    setEventosLote([]);
    setCargandoEventos(false);
    setErrorEventos("");

    return;

  }

  setCargandoEventos(true);
  setErrorEventos("");

  const referencia = query(

    collection(
      db,
      "auditoria_operador"
    ),

    where(
      "loteId",
      "==",
      loteSeleccionado.loteId
    )

  );

  const unsubscribe = onSnapshot(

    referencia,

    (snapshot) => {

      const registros =
        snapshot.docs
          .map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            })
          )
          .sort((a, b) => {

            const fechaA =
              obtenerFecha(a.fechaUtc);

            const fechaB =
              obtenerFecha(b.fechaUtc);

            return (
              (fechaA?.getTime() || 0) -
              (fechaB?.getTime() || 0)
            );

          });

      setEventosLote(registros);

      setErrorEventos("");

      setCargandoEventos(false);

    },

    (err) => {

      console.error(
        "Error al consultar eventos del lote:",
        err
      );

      setEventosLote([]);

      setErrorEventos(
        "No fue posible consultar la bitácora del lote."
      );

      setCargandoEventos(false);

    }

  );

  return () => {
    unsubscribe();
  };

}, [loteSeleccionado]);

  // =====================================================
  // FECHAS
  // =====================================================

  const obtenerFecha = (valor) => {

    if (!valor) {
      return null;
    }

    if (
      typeof valor.toDate ===
      "function"
    ) {
      return valor.toDate();
    }

    const fecha =
      new Date(valor);

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return null;
    }

    return fecha;

  };


  const formatearFecha = (valor) => {

    const fecha =
      obtenerFecha(valor);

    if (!fecha) {
      return "Sin información";
    }

    return fecha.toLocaleString(
      "es-MX"
    );

  };


  // =====================================================
  // ESTADO DE CONEXION
  // =====================================================

  const ultimoContacto =
    obtenerFecha(
      estadoSistema?.ultimoContacto
    );

  const ahora =
    new Date();

  const diferenciaMs =
    ultimoContacto
      ? ahora.getTime() -
        ultimoContacto.getTime()
      : null;

  const enLinea =
    diferenciaMs !== null &&
    diferenciaMs >= 0 &&
    diferenciaMs <=
      3 * 60 * 1000;


  // =====================================================
  // FORMATO
  // =====================================================

  const formatearMB = (
    bytes
  ) => {

    const numero =
      Number(bytes || 0);

    return (
      numero /
      1024 /
      1024
    ).toFixed(2);

  };


  const obtenerColorEstado = (
    estado
  ) => {

    switch (
      String(
        estado || ""
      ).toUpperCase()
    ) {

      case "ENVIADO":
        return theme.colors.success;

      case "REQUIERE_ATENCION":
        return theme.colors.error;

      case "ERROR":
        return theme.colors.error;

      default:
        return theme.colors.warning;

    }

  };


  // =====================================================
  // KPI
  // =====================================================

  const tarjetaKpi = (
    titulo,
    valor,
    descripcion
  ) => (

    <div
      style={{
        ...theme.card,
        flex: "1 1 210px",
        minWidth: "190px",
      }}
    >

      <div
        style={{
          color:
            theme.colors.textLight,
          fontSize: "13px",
          fontWeight: "600",
          marginBottom: "8px",
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          color:
            theme.colors.text,
          fontSize: "26px",
          fontWeight: "800",
        }}
      >
        {valor}
      </div>

      <div
        style={{
          color:
            theme.colors.textLight,
          fontSize: "12px",
          marginTop: "6px",
        }}
      >
        {descripcion}
      </div>

    </div>

  );


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div style={theme.layout.page}>

      <div style={theme.layout.content}>


        {/* =================================================
            ENCABEZADO
        ================================================= */}

        <div
          style={{
            ...theme.card,
            marginBottom: "20px",
          }}
        >

          <h1
            style={{
              margin: 0,
              color:
                theme.colors.text,
              fontSize: "28px",
              fontWeight: "700",
            }}
          >
            📧 Auditoría de Correos
          </h1>

          <p
            style={{
              margin:
                "8px 0 0 0",
              color:
                theme.colors.textLight,
              fontSize: "14px",
            }}
          >
            Monitoreo remoto del Sistema de Envío de Reportes
          </p>

        </div>


        {/* =================================================
            ESTADO
        ================================================= */}

        {
          cargando && (

            <div style={theme.card}>
              Consultando estado remoto...
            </div>

          )
        }


        {
          !cargando &&
          error && (

            <div
              style={{
                ...theme.card,
                marginBottom: "20px",
                border:
                  `1px solid ${theme.colors.error}`,
              }}
            >
              {error}
            </div>

          )
        }


        {
          !cargando &&
          estadoSistema && (

            <>

              <div
                style={{
                  ...theme.card,
                  marginBottom: "20px",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >

                  <div>

                    <div
                      style={{
                        color:
                          theme.colors.textLight,
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      ESTADO DEL SISTEMA
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "25px",
                        fontWeight: "800",
                        color: enLinea
                          ? theme.colors.success
                          : theme.colors.error,
                      }}
                    >
                      {
                        enLinea
                          ? "● EN LÍNEA"
                          : "● SIN CONEXIÓN"
                      }
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        color:
                          theme.colors.textLight,
                        fontSize: "13px",
                      }}
                    >
                      Estado reportado:{" "}
                      <strong>
                        {
                          estadoSistema.estado ||
                          "Sin información"
                        }
                      </strong>
                    </div>

                  </div>


                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >

                    <div
                      style={{
                        color:
                          theme.colors.textLight,
                        fontSize: "12px",
                      }}
                    >
                      Último contacto
                    </div>

                    <div
                      style={{
                        color:
                          theme.colors.text,
                        fontWeight: "700",
                        marginTop: "5px",
                      }}
                    >
                      {
                        formatearFecha(
                          estadoSistema.ultimoContacto
                        )
                      }
                    </div>

                    <div
                      style={{
                        color:
                          theme.colors.textLight,
                        fontSize: "12px",
                        marginTop: "5px",
                      }}
                    >
                      Equipo:{" "}
                      {
                        estadoSistema.equipo ||
                        "Sin información"
                      }
                    </div>

                  </div>

                </div>

              </div>


              {/* KPIs */}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >

                {
                  tarjetaKpi(
                    "ARCHIVOS PENDIENTES",
                    estadoSistema.pendientes ?? 0,
                    "Archivos actualmente en Pendientes"
                  )
                }

                {
                  tarjetaKpi(
                    "ARCHIVOS VÁLIDOS",
                    estadoSistema.archivosValidos ?? 0,
                    "Archivos listos para procesamiento"
                  )
                }

                {
                  tarjetaKpi(
                    "NO PERMITIDOS",
                    estadoSistema.noPermitidos ?? 0,
                    "Archivos detectados como no válidos"
                  )
                }

                {
                  tarjetaKpi(
                    "REQUIEREN ATENCIÓN",
                    estadoSistema.lotesRequierenAtencion ?? 0,
                    "Lotes detenidos para revisión manual"
                  )
                }

              </div>


              {/* ULTIMA ACTIVIDAD */}

              <div
                style={{
                  ...theme.card,
                  marginBottom: "20px",
                }}
              >

                <h2
                  style={{
                    margin: 0,
                    color:
                      theme.colors.text,
                    fontSize: "18px",
                    fontWeight: "700",
                  }}
                >
                  Última actividad
                </h2>

                <div
                  style={{
                    marginTop: "16px",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "15px",
                  }}
                >

                  <div>
                    <small
                      style={{
                        color:
                          theme.colors.textLight,
                      }}
                    >
                      Último lote
                    </small>

                    <div>
                      <strong>
                        {
                          estadoSistema.ultimoLote ||
                          "Sin información"
                        }
                      </strong>
                    </div>
                  </div>


                  <div>
                    <small
                      style={{
                        color:
                          theme.colors.textLight,
                      }}
                    >
                      Último envío exitoso
                    </small>

                    <div>
                      <strong>
                        {
                          formatearFecha(
                            estadoSistema.ultimoEnvio
                          )
                        }
                      </strong>
                    </div>
                  </div>


                  <div>
                    <small
                      style={{
                        color:
                          theme.colors.textLight,
                      }}
                    >
                      Usuario Windows
                    </small>

                    <div>
                      <strong>
                        {
                          estadoSistema.usuarioWindows ||
                          "Sin información"
                        }
                      </strong>
                    </div>
                  </div>

                </div>

              </div>

            </>

          )
        }


        {/* =================================================
            HISTORIAL DE ENVIOS
        ================================================= */}

        <div
          style={{
            ...theme.card,
            marginBottom: "20px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "18px",
            }}
          >

            <div>

              <h2
                style={{
                  margin: 0,
                  color:
                    theme.colors.text,
                  fontSize: "20px",
                  fontWeight: "700",
                }}
              >
                📋 Historial de envíos
              </h2>

              <div
                style={{
                  marginTop: "5px",
                  color:
                    theme.colors.textLight,
                  fontSize: "13px",
                }}
              >
                Auditoría de los lotes procesados por el sistema
              </div>

            </div>


            <div
              style={{
                color:
                  theme.colors.textLight,
                fontSize: "13px",
              }}
            >
              {envios.length} registro(s)
            </div>

          </div>


          {
            cargandoEnvios && (
              <div>
                Cargando historial...
              </div>
            )
          }


          {
            !cargandoEnvios &&
            errorEnvios && (

              <div
                style={{
                  color:
                    theme.colors.error,
                }}
              >
                {errorEnvios}
              </div>

            )
          }


          {
            !cargandoEnvios &&
            !errorEnvios &&
            envios.length === 0 && (

              <div
                style={{
                  color:
                    theme.colors.textLight,
                }}
              >
                No existen envíos registrados.
              </div>

            )
          }


          {
            !cargandoEnvios &&
            !errorEnvios &&
            envios.length > 0 && (

              <div
                style={{
                  overflowX: "auto",
                }}
              >

                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    minWidth: "900px",
                  }}
                >

                  <thead>

                    <tr>

                      {
                        [
                          "Folio",
                          "Actualización",
                          "Estado",
                          "Archivos",
                          "Tamaño",
                          "Intentos",
                          "Tipo",
                          "Acción",
                        ].map(
                          (titulo) => (

                            <th
                              key={titulo}
                              style={{
                                padding:
                                  "12px 10px",
                                textAlign:
                                  "left",
                                color:
                                  theme.colors.textLight,
                                fontSize:
                                  "12px",
                                borderBottom:
                                  `1px solid ${theme.colors.border}`,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {titulo}
                            </th>

                          )
                        )
                      }

                    </tr>

                  </thead>


                  <tbody>

                    {
                      envios.map(
                        (registro) => (

                          <tr
                            key={
                              registro.id
                            }
                          >

                            <td
                              style={{
                                padding:
                                  "14px 10px",
                                borderBottom:
                                  `1px solid ${theme.colors.border}`,
                                fontWeight:
                                  "700",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {
                                registro.loteId ||
                                registro.id
                              }
                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 10px",
                                borderBottom:
                                  `1px solid ${theme.colors.border}`,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {
                                formatearFecha(
                                  registro.fechaActualizacion
                                )
                              }
                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 10px",
                                borderBottom:
                                  `1px solid ${theme.colors.border}`,
                              }}
                            >

                              <strong
                                style={{
                                  color:
                                    obtenerColorEstado(
                                      registro.estado
                                    ),
                                }}
                              >
                                {
                                  registro.estado ||
                                  "SIN ESTADO"
                                }
                              </strong>

                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 10px",
                                borderBottom:
                                  `1px solid ${theme.colors.border}`,
                                textAlign:
                                  "center",
                              }}
                            >
                              {
                                registro.cantidadArchivos ??
                                0
                              }
                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 10px",
                                borderBottom:
                                  `1px solid ${theme.colors.border}`,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {
                                formatearMB(
                                  registro.tamanoTotalBytes
                                )
                              }{" "}
                              MB
                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 10px",
                                borderBottom:
                                  `1px solid ${theme.colors.border}`,
                                textAlign:
                                  "center",
                              }}
                            >
                              {
                                registro.intento ??
                                0
                              }
                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 10px",
                                borderBottom:
                                  `1px solid ${theme.colors.border}`,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {
                                registro.tipoUltimoIntento ||
                                "—"
                              }
                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 10px",
                                borderBottom:
                                  `1px solid ${theme.colors.border}`,
                              }}
                            >

                              <button
                                onClick={() =>
                                  setLoteSeleccionado(
                                    registro
                                  )
                                }
                                style={{
                                  ...theme.button.primary,
                                  padding:
                                    "8px 12px",
                                }}
                              >
                                Ver detalle
                              </button>

                            </td>

                          </tr>

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            )
          }

        </div>


        {/* =================================================
            DETALLE DEL LOTE
        ================================================= */}

        {
          loteSeleccionado && (

            <div
              style={{
                ...theme.card,
                marginBottom: "20px",
              }}
            >

                {/* =================================================
    BITACORA DEL LOTE
================================================= */}

<div
  style={{
    marginTop: "30px",
  }}
>

  <h3
    style={{
      color: theme.colors.text,
      marginBottom: "5px",
    }}
  >
    🕒 Bitácora del lote
  </h3>

  <div
    style={{
      color: theme.colors.textLight,
      fontSize: "13px",
      marginBottom: "18px",
    }}
  >
    Historial de acciones y eventos registrados
  </div>


  {
    cargandoEventos && (

      <div
        style={{
          color: theme.colors.textLight,
        }}
      >
        Consultando bitácora...
      </div>

    )
  }


  {
    !cargandoEventos &&
    errorEventos && (

      <div
        style={{
          color: theme.colors.error,
        }}
      >
        {errorEventos}
      </div>

    )
  }


  {
    !cargandoEventos &&
    !errorEventos &&
    eventosLote.length === 0 && (

      <div
        style={{
          color: theme.colors.textLight,
        }}
      >
        No existen eventos registrados para este lote.
      </div>

    )
  }


  {
    !cargandoEventos &&
    !errorEventos &&
    eventosLote.length > 0 && (

      <div>

        {
          eventosLote.map(
            (evento, index) => (

              <div
                key={evento.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "22px minmax(0, 1fr)",
                  gap: "12px",
                }}
              >

                {/* LINEA */}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >

                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background:
                        evento.tipoEvento ===
                        "ENVIO_EXITOSO"
                          ? theme.colors.success
                          : evento.tipoEvento
                              ?.includes("ERROR")
                          ? theme.colors.error
                          : theme.colors.primary,
                      flexShrink: 0,
                    }}
                  />

                  {
                    index <
                    eventosLote.length - 1 && (

                      <div
                        style={{
                          width: "2px",
                          flex: 1,
                          minHeight: "50px",
                          background:
                            theme.colors.border,
                        }}
                      />

                    )
                  }

                </div>


                {/* EVENTO */}

                <div
                  style={{
                    paddingBottom: "20px",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >

                    <strong
                      style={{
                        color:
                          theme.colors.text,
                      }}
                    >
                      {
                        evento.tipoEvento ||
                        "EVENTO"
                      }
                    </strong>

                    <span
                      style={{
                        color:
                          theme.colors.textLight,
                        fontSize: "12px",
                      }}
                    >
                      {
                        formatearFecha(
                          evento.fechaUtc
                        )
                      }
                    </span>

                  </div>


                  <div
                    style={{
                      marginTop: "5px",
                      color:
                        theme.colors.textLight,
                      fontSize: "13px",
                    }}
                  >
                    {
                      evento.detalle ||
                      "Sin detalle"
                    }
                  </div>


                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "12px",
                      color:
                        theme.colors.textLight,
                    }}
                  >
                    {
                      evento.tipoIntento
                        ? `Tipo: ${evento.tipoIntento}`
                        : ""
                    }

                    {
                      evento.intento
                        ? ` • Intento: ${evento.intento}`
                        : ""
                    }

                    {
                      evento.usuarioWindows
                        ? ` • Usuario: ${evento.usuarioWindows}`
                        : ""
                    }
                  </div>

                </div>

              </div>

            )
          )
        }

      </div>

    )
  }

</div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >

                <div>

                  <h2
                    style={{
                      margin: 0,
                      color:
                        theme.colors.text,
                      fontSize: "20px",
                    }}
                  >
                    📦 {
                      loteSeleccionado.loteId ||
                      loteSeleccionado.id
                    }
                  </h2>

                  <div
                    style={{
                      marginTop: "5px",
                      color:
                        theme.colors.textLight,
                      fontSize: "13px",
                    }}
                  >
                    Detalle de auditoría del lote
                  </div>

                </div>


                <button
                  onClick={() =>
                    setLoteSeleccionado(
                      null
                    )
                  }
                  style={{
                    ...theme.button.danger,
                    padding:
                      "8px 14px",
                  }}
                >
                  Cerrar
                </button>

              </div>


              <div
                style={{
                  marginTop: "20px",
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "15px",
                }}
              >

                <div>
                  <small>
                    Estado
                  </small>
                  <div>
                    <strong>
                      {
                        loteSeleccionado.estado ||
                        "—"
                      }
                    </strong>
                  </div>
                </div>

                <div>
                  <small>
                    Intento
                  </small>
                  <div>
                    <strong>
                      {
                        loteSeleccionado.intento ??
                        0
                      }
                    </strong>
                  </div>
                </div>

                <div>
                  <small>
                    Tipo de último intento
                  </small>
                  <div>
                    <strong>
                      {
                        loteSeleccionado.tipoUltimoIntento ||
                        "—"
                      }
                    </strong>
                  </div>
                </div>

                <div>
                  <small>
                    Fecha de envío
                  </small>
                  <div>
                    <strong>
                      {
                        formatearFecha(
                          loteSeleccionado.fechaEnvio
                        )
                      }
                    </strong>
                  </div>
                </div>

                <div>
                  <small>
                    Asunto
                  </small>
                  <div>
                    <strong>
                      {
                        loteSeleccionado.asunto ||
                        "—"
                      }
                    </strong>
                  </div>
                </div>

                <div>
                  <small>
                    Equipo
                  </small>
                  <div>
                    <strong>
                      {
                        loteSeleccionado.equipo ||
                        "—"
                      }
                    </strong>
                  </div>
                </div>

              </div>


              {/* DESTINATARIOS */}

              <div
                style={{
                  marginTop: "25px",
                }}
              >

                <h3
                  style={{
                    color:
                      theme.colors.text,
                    marginBottom: "10px",
                  }}
                >
                  Destinatarios
                </h3>

                {
                  Array.isArray(
                    loteSeleccionado.destinatarios
                  ) &&
                  loteSeleccionado.destinatarios.length > 0
                    ? loteSeleccionado.destinatarios.map(
                        (correo) => (

                          <div
                            key={correo}
                            style={{
                              color:
                                theme.colors.textLight,
                              marginBottom:
                                "5px",
                            }}
                          >
                            {correo}
                          </div>

                        )
                      )
                    : (
                      <div
                        style={{
                          color:
                            theme.colors.textLight,
                        }}
                      >
                        Sin destinatarios registrados
                      </div>
                    )
                }

              </div>


              {/* ERROR */}

              {
                loteSeleccionado.error && (

                  <div
                    style={{
                      marginTop: "25px",
                      padding: "15px",
                      border:
                        `1px solid ${theme.colors.error}`,
                      borderRadius: "10px",
                    }}
                  >

                    <strong
                      style={{
                        color:
                          theme.colors.error,
                      }}
                    >
                      Error registrado
                    </strong>

                    <div
                      style={{
                        marginTop: "7px",
                      }}
                    >
                      {
                        loteSeleccionado.error
                      }
                    </div>

                  </div>

                )
              }


              {/* ARCHIVOS */}

              <div
                style={{
                  marginTop: "25px",
                }}
              >

                <h3
                  style={{
                    color:
                      theme.colors.text,
                    marginBottom: "10px",
                  }}
                >
                  Archivos incluidos
                </h3>


                {
                  Array.isArray(
                    loteSeleccionado.archivos
                  ) &&
                  loteSeleccionado.archivos.length > 0
                    ? (

                      <div
                        style={{
                          overflowX:
                            "auto",
                        }}
                      >

                        <table
                          style={{
                            width: "100%",
                            borderCollapse:
                              "collapse",
                            minWidth:
                              "700px",
                          }}
                        >

                          <thead>

                            <tr>

                              <th
                                style={{
                                  textAlign:
                                    "left",
                                  padding:
                                    "10px",
                                  borderBottom:
                                    `1px solid ${theme.colors.border}`,
                                }}
                              >
                                Archivo
                              </th>

                              <th
                                style={{
                                  textAlign:
                                    "right",
                                  padding:
                                    "10px",
                                  borderBottom:
                                    `1px solid ${theme.colors.border}`,
                                }}
                              >
                                Tamaño
                              </th>

                              <th
                                style={{
                                  textAlign:
                                    "left",
                                  padding:
                                    "10px",
                                  borderBottom:
                                    `1px solid ${theme.colors.border}`,
                                }}
                              >
                                SHA-256
                              </th>

                            </tr>

                          </thead>


                          <tbody>

                            {
                              loteSeleccionado.archivos.map(
                                (
                                  archivo,
                                  index
                                ) => (

                                  <tr
                                    key={
                                      `${archivo.nombre}-${index}`
                                    }
                                  >

                                    <td
                                      style={{
                                        padding:
                                          "10px",
                                        borderBottom:
                                          `1px solid ${theme.colors.border}`,
                                      }}
                                    >
                                      {
                                        archivo.nombre ||
                                        "Sin nombre"
                                      }
                                    </td>

                                    <td
                                      style={{
                                        padding:
                                          "10px",
                                        textAlign:
                                          "right",
                                        borderBottom:
                                          `1px solid ${theme.colors.border}`,
                                        whiteSpace:
                                          "nowrap",
                                      }}
                                    >
                                      {
                                        (
                                          Number(
                                            archivo.tamanoBytes ||
                                            0
                                          ) /
                                          1024
                                        ).toFixed(
                                          2
                                        )
                                      }{" "}
                                      KB
                                    </td>

                                    <td
                                      style={{
                                        padding:
                                          "10px",
                                        borderBottom:
                                          `1px solid ${theme.colors.border}`,
                                        fontFamily:
                                          "monospace",
                                        fontSize:
                                          "11px",
                                        wordBreak:
                                          "break-all",
                                      }}
                                    >
                                      {
                                        archivo.sha256 ||
                                        "Sin SHA-256"
                                      }
                                    </td>

                                  </tr>

                                )
                              )
                            }

                          </tbody>

                        </table>

                      </div>

                    )
                    : (

                      <div
                        style={{
                          color:
                            theme.colors.textLight,
                        }}
                      >
                        Este registro no contiene detalle de archivos.
                      </div>

                    )
                }

              </div>

            </div>

          )
        }


      </div>

    </div>

  );

}


export default AuditoriaCorreosPage;