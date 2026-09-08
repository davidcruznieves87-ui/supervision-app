import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

import theme from "../styles/theme";

import {
  obtenerActividades,
  crearActividad,
  actualizarActividad,
} from "../services/actividadesService";

import ImportarAFModal
  from "../components/actividades/ImportarAFModal";

import ActividadDetalle
  from "../components/actividades/ActividadDetalle";


function ActividadesPage() {

  const [actividades, setActividades] =
    useState([]);

  const [tecnicos, setTecnicos] =
    useState([]);

  const [
    actividadSeleccionada,
    setActividadSeleccionada,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    mostrarImportador,
    setMostrarImportador,
  ] = useState(false);

  const [
    procesandoId,
    setProcesandoId,
  ] = useState(null);

  /*
  PENDIENTES
  EJECUTADAS
  CANCELADAS
  */
  const [
    vistaActual,
    setVistaActual,
  ] = useState("PENDIENTES");


  /*
  =====================================================
  IMPORTAR AF
  =====================================================
  */

  const importarAF =
    async (datosAF) => {

      try {

        await crearActividad({

          ...datosAF,

          estado:
            "PENDIENTE",

          tecnicosAsignados:
            [],

          materialSolicitado:
            false,

          materialRecibido:
            false,

          clienteInformado:
            false,

          accesoConfirmado:
            false,

          actividadCompletada:
            false,

          afCancelada:
            false,

        });

        await cargarActividades();

        setMostrarImportador(
          false
        );

        setVistaActual(
          "PENDIENTES"
        );

        alert(
          "AF importada correctamente"
        );

      } catch (error) {

        console.error(error);

        alert(
          "Error importando AF"
        );

      }
    };


  /*
  =====================================================
  CARGAR ACTIVIDADES
  =====================================================
  */

  const cargarActividades =
    async () => {

      try {

        const data =
          await obtenerActividades();

        setActividades(
          data
        );

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(
          false
        );

      }
    };


  /*
  =====================================================
  CARGAR TÉCNICOS
  =====================================================
  */

  const cargarTecnicos =
    async () => {

      try {

        const snapshot =
          await getDocs(
            collection(
              db,
              "usuarios"
            )
          );

        const lista =
          snapshot.docs

            .map((d) => ({
              id: d.id,
              ...d.data(),
            }))

            .filter((u) => {

              const rol =
                (u?.rol || "")
                  .toLowerCase()
                  .trim()
                  .normalize("NFD")
                  .replace(
                    /[\u0300-\u036f]/g,
                    ""
                  );

              return (
                rol === "tecnico"
              );

            });

        setTecnicos(
          lista
        );

      } catch (error) {

        console.error(error);

      }
    };


  useEffect(() => {

    cargarActividades();

    cargarTecnicos();

  }, []);


  /*
  =====================================================
  GUARDAR SEGUIMIENTO
  =====================================================
  */

  const guardarSeguimiento =
    async (datos) => {

      try {

        await actualizarActividad(
          datos.id,
          datos
        );

        await cargarActividades();

        setActividadSeleccionada(
          null
        );

        alert(
          "Seguimiento actualizado"
        );

      } catch (error) {

        console.error(error);

        alert(
          "Error actualizando actividad"
        );

      }
    };


  /*
  =====================================================
  MARCAR EJECUTADA
  =====================================================
  */

  const marcarEjecutada =
    async (actividad) => {

      const confirmar =
        window.confirm(
          `¿Confirmas que la AF-${actividad.af} fue ejecutada correctamente?`
        );

      if (!confirmar) {
        return;
      }

      try {

        setProcesandoId(
          actividad.id
        );

        const fechaActual =
          new Date();

        await actualizarActividad(
          actividad.id,
          {

            ...actividad,

            estado:
              "EJECUTADO",

            actividadCompletada:
              true,

            afCancelada:
              false,

            ejecucionConfirmada:
              true,

            completadoFecha:
              fechaActual,

          }
        );


        setActividades(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                actividad.id
                  ? {

                      ...item,

                      estado:
                        "EJECUTADO",

                      actividadCompletada:
                        true,

                      afCancelada:
                        false,

                      ejecucionConfirmada:
                        true,

                      completadoFecha:
                        fechaActual,

                    }
                  : item
            )
        );


        if (
          actividadSeleccionada
            ?.id ===
          actividad.id
        ) {

          setActividadSeleccionada(
            null
          );

        }

      } catch (error) {

        console.error(error);

        alert(
          "Error al marcar la actividad como ejecutada."
        );

      } finally {

        setProcesandoId(
          null
        );

      }
    };


  /*
  =====================================================
  MARCAR CANCELADA
  =====================================================
  */

  const marcarCancelada =
    async (actividad) => {

      const confirmar =
        window.confirm(
          `¿Confirmas que Corporativo canceló la AF-${actividad.af}?`
        );

      if (!confirmar) {
        return;
      }

      try {

        setProcesandoId(
          actividad.id
        );

        const fechaActual =
          new Date();

        await actualizarActividad(
          actividad.id,
          {

            ...actividad,

            estado:
              "CANCELADA",

            actividadCompletada:
              false,

            afCancelada:
              true,

            fechaCancelacion:
              fechaActual,

          }
        );


        setActividades(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                actividad.id
                  ? {

                      ...item,

                      estado:
                        "CANCELADA",

                      actividadCompletada:
                        false,

                      afCancelada:
                        true,

                      fechaCancelacion:
                        fechaActual,

                    }
                  : item
            )
        );


        if (
          actividadSeleccionada
            ?.id ===
          actividad.id
        ) {

          setActividadSeleccionada(
            null
          );

        }

      } catch (error) {

        console.error(error);

        alert(
          "Error al cancelar la AF."
        );

      } finally {

        setProcesandoId(
          null
        );

      }
    };


  /*
  =====================================================
  CLASIFICACIÓN
  =====================================================
  */

  const actividadesPendientes =
    actividades.filter(
      (actividad) =>
        actividad.estado !==
          "EJECUTADO" &&
        actividad.estado !==
          "CANCELADA" &&
        actividad.actividadCompletada !==
          true &&
        actividad.afCancelada !==
          true
    );


  const actividadesEjecutadas =
    actividades.filter(
      (actividad) =>
        actividad.estado ===
          "EJECUTADO" ||
        (
          actividad.actividadCompletada ===
            true &&
          actividad.afCancelada !==
            true
        )
    );


  const actividadesCanceladas =
    actividades.filter(
      (actividad) =>
        actividad.estado ===
          "CANCELADA" ||
        actividad.afCancelada ===
          true
    );


  /*
  =====================================================
  ACTIVIDADES A MOSTRAR
  =====================================================
  */

  const obtenerActividadesVista =
    () => {

      if (
        vistaActual ===
        "EJECUTADAS"
      ) {

        return actividadesEjecutadas;

      }

      if (
        vistaActual ===
        "CANCELADAS"
      ) {

        return actividadesCanceladas;

      }

      return actividadesPendientes;
    };


  const actividadesVista =
    obtenerActividadesVista();


  /*
  =====================================================
  PROGRESO
  =====================================================
  */

  const calcularProgreso =
    (actividad) => {

      const pasos = [

        actividad.clienteConfirmado,

        actividad.materialConfirmado,

        actividad.tecnicosConfirmados,

        actividad.programacionConfirmada,

        actividad.ejecucionConfirmada,

      ];

      const completados =
        pasos.filter(
          Boolean
        ).length;

      return {

        porcentaje:
          Math.round(
            (
              completados /
              pasos.length
            ) * 100
          ),

      };
    };


  /*
  =====================================================
  PENDIENTES INTERNOS
  =====================================================
  */

  const obtenerPendientes =
    (actividad) => {

      const lista = [];

      if (
        !actividad.clienteConfirmado
      ) {

        lista.push(
          "Cliente"
        );

      }

      if (
        !actividad.materialConfirmado
      ) {

        lista.push(
          "Material"
        );

      }

      if (
        !actividad.tecnicosConfirmados
      ) {

        lista.push(
          "Técnicos"
        );

      }

      if (
        !actividad.programacionConfirmada
      ) {

        lista.push(
          "Programación"
        );

      }

      if (
        !actividad.ejecucionConfirmada
      ) {

        lista.push(
          "Ejecución"
        );

      }

      return lista;
    };


  /*
  =====================================================
  ESTADO VISUAL
  =====================================================
  */

  const obtenerEstado =
    (actividad) => {

      if (
        actividad.estado ===
          "CANCELADA" ||
        actividad.afCancelada ===
          true
      ) {

        return {
          texto:
            "CANCELADA",
          color:
            "#EF4444",
        };

      }


      if (
        actividad.estado ===
          "EJECUTADO" ||
        actividad.actividadCompletada ===
          true
      ) {

        return {
          texto:
            "EJECUTADA",
          color:
            "#10B981",
        };

      }


      const pendientes =
        obtenerPendientes(
          actividad
        ).length;


      if (
        pendientes === 0
      ) {

        return {
          texto:
            "LISTA",
          color:
            "#10B981",
        };

      }


      if (
        pendientes <= 2
      ) {

        return {
          texto:
            "EN PROCESO",
          color:
            "#F59E0B",
        };

      }


      return {
        texto:
          "CRÍTICA",
        color:
          "#EF4444",
      };
    };


  /*
  =====================================================
  RENDER
  =====================================================
  */

  return (

    <div
      style={{
        padding:
          theme.spacing?.lg ||
          24,
      }}
    >


      {/* ENCABEZADO */}

      <div
        style={{

          ...theme.card,

          background:
            "linear-gradient(135deg,#0F172A,#1E293B)",

          color:
            "#fff",

          marginBottom:
            24,

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

            flexWrap:
              "wrap",

            gap:
              20,

          }}
        >

          <div>

            <h1
              style={{

                margin:
                  0,

                fontSize:
                  34,

                fontWeight:
                  900,

                color:
                  "#fff",

              }}
            >
              📋 Control de Actividades
            </h1>


            <p
              style={{

                marginTop:
                  8,

                color:
                  "#CBD5E1",

                fontSize:
                  16,

              }}
            >
              Gestión y seguimiento de actividades corporativas provenientes de AF Orion.
            </p>

          </div>


          <button
            onClick={() =>
              setMostrarImportador(
                true
              )
            }
            style={{
              ...theme.button.success,
            }}
          >
            📄 Importar AF
          </button>

        </div>


        {/* RESUMEN */}

        <div
          style={{

            display:
              "flex",

            gap:
              12,

            marginTop:
              20,

            flexWrap:
              "wrap",

          }}
        >

          <div
            style={{

              background:
                "rgba(255,255,255,0.08)",

              padding:
                "10px 16px",

              borderRadius:
                12,

            }}
          >
            📊 Total:{" "}
            {actividades.length}
          </div>


          <div
            style={{

              background:
                "rgba(245,158,11,0.15)",

              padding:
                "10px 16px",

              borderRadius:
                12,

            }}
          >
            ⏳ Pendientes:{" "}
            {
              actividadesPendientes.length
            }
          </div>


          <div
            style={{

              background:
                "rgba(34,197,94,0.15)",

              padding:
                "10px 16px",

              borderRadius:
                12,

            }}
          >
            ✅ Ejecutadas:{" "}
            {
              actividadesEjecutadas.length
            }
          </div>


          <div
            style={{

              background:
                "rgba(239,68,68,0.15)",

              padding:
                "10px 16px",

              borderRadius:
                12,

            }}
          >
            🚫 Canceladas:{" "}
            {
              actividadesCanceladas.length
            }
          </div>

        </div>

      </div>


      {/* IMPORTADOR */}

      {
        mostrarImportador && (

          <ImportarAFModal

            onCerrar={() =>
              setMostrarImportador(
                false
              )
            }

            onImportar={
              importarAF
            }

          />

        )
      }


      {/* DETALLE */}

      <ActividadDetalle
        actividad={
          actividadSeleccionada
        }
        tecnicos={
          tecnicos
        }
        onGuardar={
          guardarSeguimiento
        }
      />


      {/* =================================================
          SELECTOR DE VISTA
      ================================================= */}

      <div
        style={{

          ...theme.card,

          display:
            "flex",

          gap:
            10,

          flexWrap:
            "wrap",

          marginBottom:
            20,

          padding:
            12,

        }}
      >

        <button
          onClick={() =>
            setVistaActual(
              "PENDIENTES"
            )
          }
          style={{

            ...(vistaActual ===
            "PENDIENTES"
              ? theme.button.primary
              : {}),

            border:
              vistaActual ===
              "PENDIENTES"
                ? "none"
                : "1px solid #E2E8F0",

            background:
              vistaActual ===
              "PENDIENTES"
                ? theme.colors?.primary
                : "#FFFFFF",

            color:
              vistaActual ===
              "PENDIENTES"
                ? "#FFFFFF"
                : theme.colors?.text,

            padding:
              "10px 18px",

            borderRadius:
              8,

            cursor:
              "pointer",

            fontWeight:
              700,

          }}
        >
          ⏳ Pendientes (
          {
            actividadesPendientes.length
          })
        </button>


        <button
          onClick={() =>
            setVistaActual(
              "EJECUTADAS"
            )
          }
          style={{

            border:
              vistaActual ===
              "EJECUTADAS"
                ? "none"
                : "1px solid #E2E8F0",

            background:
              vistaActual ===
              "EJECUTADAS"
                ? "#10B981"
                : "#FFFFFF",

            color:
              vistaActual ===
              "EJECUTADAS"
                ? "#FFFFFF"
                : theme.colors?.text,

            padding:
              "10px 18px",

            borderRadius:
              8,

            cursor:
              "pointer",

            fontWeight:
              700,

          }}
        >
          ✅ Ejecutadas (
          {
            actividadesEjecutadas.length
          })
        </button>


        <button
          onClick={() =>
            setVistaActual(
              "CANCELADAS"
            )
          }
          style={{

            border:
              vistaActual ===
              "CANCELADAS"
                ? "none"
                : "1px solid #E2E8F0",

            background:
              vistaActual ===
              "CANCELADAS"
                ? "#EF4444"
                : "#FFFFFF",

            color:
              vistaActual ===
              "CANCELADAS"
                ? "#FFFFFF"
                : theme.colors?.text,

            padding:
              "10px 18px",

            borderRadius:
              8,

            cursor:
              "pointer",

            fontWeight:
              700,

          }}
        >
          🚫 Canceladas (
          {
            actividadesCanceladas.length
          })
        </button>

      </div>


      {/* =================================================
          TARJETAS
      ================================================= */}

      {
        loading ? (

          <p>
            Cargando...
          </p>

        ) : actividadesVista.length ===
          0 ? (

          <div
            style={{

              ...theme.card,

              textAlign:
                "center",

              padding:
                35,

            }}
          >

            <div
              style={{
                fontSize:
                  36,
              }}
            >
              {
                vistaActual ===
                "PENDIENTES"
                  ? "✅"
                  : vistaActual ===
                    "EJECUTADAS"
                    ? "📁"
                    : "🚫"
              }
            </div>

            <h3
              style={{
                color:
                  theme.colors?.text,
              }}
            >

              {
                vistaActual ===
                "PENDIENTES"
                  ? "No hay actividades pendientes"
                  : vistaActual ===
                    "EJECUTADAS"
                    ? "No hay actividades ejecutadas"
                    : "No hay AF canceladas"
              }

            </h3>

          </div>

        ) : (

          <div
            style={{

              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fill,minmax(320px,1fr))",

              gap:
                18,

            }}
          >

            {
              actividadesVista.map(
                (actividad) => {

                  const progreso =
                    calcularProgreso(
                      actividad
                    );

                  const estado =
                    obtenerEstado(
                      actividad
                    );

                  const esPendiente =
                    vistaActual ===
                    "PENDIENTES";


                  return (

                    <div
                      key={
                        actividad.id
                      }
                      style={{

                        ...theme.card,

                        display:
                          "flex",

                        flexDirection:
                          "column",

                        justifyContent:
                          "space-between",

                        marginBottom:
                          0,

                        padding:
                          18,

                        minHeight:
                          230,

                      }}
                    >

                      <div>


                        {/* CABECERA */}

                        <div
                          style={{

                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "center",

                            gap:
                              10,

                            marginBottom:
                              12,

                          }}
                        >

                          <h3
                            style={{

                              margin:
                                0,

                              color:
                                theme.colors?.text,

                            }}
                          >
                            AF-{actividad.af}
                          </h3>


                          <span
                            style={{

                              background:
                                estado.color,

                              color:
                                "#FFFFFF",

                              padding:
                                "5px 10px",

                              borderRadius:
                                20,

                              fontSize:
                                11,

                              fontWeight:
                                800,

                            }}
                          >
                            {
                              estado.texto
                            }
                          </span>

                        </div>


                        {/* SALA */}

                        <div
                          style={{
                            marginBottom:
                              8,
                          }}
                        >

                          <strong>
                            Sala:
                          </strong>{" "}

                          {
                            actividad.sala ||
                            "Sin sala"
                          }

                        </div>


                        {/* ACTIVIDAD */}

                        <div
                          style={{
                            marginBottom:
                              8,
                          }}
                        >

                          <strong>
                            Actividad:
                          </strong>{" "}

                          {
                            actividad.tipoActividad ||
                            "Sin actividad"
                          }

                        </div>


                        {/* RAZÓN */}

                        <div
                          style={{

                            marginTop:
                              10,

                            padding:
                              10,

                            background:
                              "#F8FAFC",

                            borderRadius:
                              8,

                            border:
                              "1px solid #E2E8F0",

                          }}
                        >

                          <strong>
                            📝 Razón
                          </strong>


                          <div
                            style={{

                              marginTop:
                                4,

                              color:
                                theme.colors?.textLight ||
                                "#64748B",

                              fontSize:
                                13,

                              lineHeight:
                                1.4,

                            }}
                          >

                            {
                              actividad.razon ||
                              actividad.motivo ||
                              "Sin razón especificada"
                            }

                          </div>

                        </div>


                        {/* FECHA */}

                        <div
                          style={{

                            marginTop:
                              10,

                            fontSize:
                              13,

                          }}
                        >

                          <strong>
                            Fecha límite:
                          </strong>{" "}

                          {
                            actividad.fechaLimite ||
                            "Sin fecha"
                          }

                        </div>


                        {/* AVANCE SOLO PENDIENTES */}

                        {
                          esPendiente && (

                            <div
                              style={{
                                marginTop:
                                  12,
                              }}
                            >

                              <div
                                style={{

                                  display:
                                    "flex",

                                  justifyContent:
                                    "space-between",

                                  fontSize:
                                    12,

                                  marginBottom:
                                    5,

                                }}
                              >

                                <strong>
                                  Avance
                                </strong>

                                <strong>
                                  {
                                    progreso.porcentaje
                                  }%
                                </strong>

                              </div>


                              <div
                                style={{

                                  height:
                                    7,

                                  background:
                                    "#E2E8F0",

                                  borderRadius:
                                    999,

                                  overflow:
                                    "hidden",

                                }}
                              >

                                <div
                                  style={{

                                    width:
                                      `${progreso.porcentaje}%`,

                                    height:
                                      "100%",

                                    background:
                                      estado.color,

                                  }}
                                />

                              </div>

                            </div>

                          )
                        }

                      </div>


                      {/* =================================================
                          BOTONES
                      ================================================= */}

                      <div
                        style={{

                          display:
                            "grid",

                          gridTemplateColumns:
                            esPendiente
                              ? "1fr 1fr"
                              : "1fr",

                          gap:
                            8,

                          marginTop:
                            16,

                        }}
                      >

                        <button
                          onClick={() =>
                            setActividadSeleccionada(
                              actividad
                            )
                          }
                          style={{

                            ...theme.button.primary,

                            width:
                              "100%",

                          }}
                        >
                          👁 Ver Actividad
                        </button>


                        {
                          esPendiente && (

                            <button
                              onClick={() =>
                                marcarEjecutada(
                                  actividad
                                )
                              }
                              disabled={
                                procesandoId ===
                                actividad.id
                              }
                              style={{

                                ...theme.button.success,

                                width:
                                  "100%",

                                opacity:
                                  procesandoId ===
                                  actividad.id
                                    ? 0.6
                                    : 1,

                              }}
                            >

                              {
                                procesandoId ===
                                actividad.id
                                  ? "Guardando..."
                                  : "✅ Ejecutado"
                              }

                            </button>

                          )
                        }


                        {
                          esPendiente && (

                            <button
                              onClick={() =>
                                marcarCancelada(
                                  actividad
                                )
                              }
                              disabled={
                                procesandoId ===
                                actividad.id
                              }
                              style={{

                                gridColumn:
                                  "1 / -1",

                                border:
                                  "none",

                                borderRadius:
                                  8,

                                padding:
                                  "9px 14px",

                                fontWeight:
                                  700,

                                background:
                                  theme.colors?.error ||
                                  "#EF4444",

                                color:
                                  "#FFFFFF",

                                cursor:
                                  "pointer",

                                opacity:
                                  procesandoId ===
                                  actividad.id
                                    ? 0.6
                                    : 1,

                              }}
                            >
                              🚫 AF Cancelada
                            </button>

                          )
                        }

                      </div>

                    </div>

                  );

                }
              )
            }

          </div>

        )
      }

    </div>
  );
}


export default ActividadesPage;