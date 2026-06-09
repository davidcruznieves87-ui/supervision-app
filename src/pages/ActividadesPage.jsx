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

import ImportarAF
from "../components/actividades/ImportarAF";

import ActividadForm
from "../components/actividades/ActividadForm";

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

  const [formulario, setFormulario] =
    useState({

      af: "",
      proyecto: "",
      sala: "",
      tipoActividad: "",
      cliente: "",
      fechaLimite: "",
      observaciones: "",

    });

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

      });

      await cargarActividades();

      setMostrarImportador(
        false
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

  const cargarActividades =
    async () => {

      try {

        const data =
          await obtenerActividades();

        setActividades(data);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };

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

        setTecnicos(lista);

      } catch (error) {

        console.error(error);
      }
    };

  useEffect(() => {

    cargarActividades();

    cargarTecnicos();

  }, []);

  const guardarActividad =
    async () => {

      try {

        if (
          !formulario.af ||
          !formulario.sala ||
          !formulario.tipoActividad
        ) {

          alert(
            "AF, Sala y Tipo Actividad son obligatorios."
          );

          return;
        }

        await crearActividad({

          ...formulario,

          estado:
            "PENDIENTE",

          tecnicosAsignados:
            [],

          materialSolicitado:
  false,

materialRecibido:
  false,

materialRequerido:
  "",

        clienteConfirmado:
  false,

clienteConfirmadoPor:
  null,

clienteConfirmadoFecha:
  null,

          accesoConfirmado:
            false,

          actividadCompletada:
            false,
            actividadCompletada:
  false,

tecnicosConfirmados:
  false,

tecnicosConfirmadoPor:
  null,

tecnicosConfirmadoFecha:
  null,

        });

        setFormulario({

          af: "",
          proyecto: "",
          sala: "",
          tipoActividad: "",
          cliente: "",
          fechaLimite: "",
          observaciones: "",

        });

        await cargarActividades();

      } catch (error) {

        console.error(error);

        alert(
          "Error al guardar actividad"
        );
      }
    };

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

  const pendientes =
    actividades.filter(
      a =>
        a.estado === "PENDIENTE"
    ).length;

  const completadas =
    actividades.filter(
      a =>
        a.actividadCompletada
    ).length;

  return (

    <div
      style={{
        padding:
          theme.spacing?.lg || 24,
      }}
    >

    <div
  style={{
    ...theme.card,
    background:
      "linear-gradient(135deg,#0F172A,#1E293B)",
    color: "#fff",
    marginBottom: 24,
  }}
>

  <div
    style={{
      display: "flex",
      justifyContent:
        "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 20,
    }}
  >

    <div>

      <h1
        style={{
          margin: 0,
          fontSize: 34,
          fontWeight: 900,
          color: "#fff",
        }}
      >
        📋 Control de Actividades
      </h1>

      <p
        style={{
          marginTop: 8,
          color: "#CBD5E1",
          fontSize: 16,
        }}
      >
        Gestión y seguimiento de
        actividades corporativas
        provenientes de AF Orion.
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

  <div
    style={{
      display: "flex",
      gap: 12,
      marginTop: 20,
      flexWrap: "wrap",
    }}
  >

    <div
      style={{
        background:
          "rgba(255,255,255,0.08)",
        padding: "10px 16px",
        borderRadius: 12,
      }}
    >
      📊 Total:
      {" "}
      {actividades.length}
    </div>

    <div
      style={{
        background:
          "rgba(245,158,11,0.15)",
        padding: "10px 16px",
        borderRadius: 12,
      }}
    >
      ⏳ Pendientes:
      {" "}
      {pendientes}
    </div>

    <div
      style={{
        background:
          "rgba(34,197,94,0.15)",
        padding: "10px 16px",
        borderRadius: 12,
      }}
    >
      ✅ Completadas:
      {" "}
      {completadas}
    </div>

  </div>

</div>



{/*
      <ActividadForm
        formulario={formulario}
        setFormulario={setFormulario}
        guardarActividad={guardarActividad}
      />
*/}
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

      <ActividadDetalle
        actividad={
          actividadSeleccionada
        }
        tecnicos={tecnicos}
        onGuardar={
          guardarSeguimiento
        }
      />


     {loading ? (

  <p>
    Cargando...
  </p>

) : (

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fill,minmax(340px,1fr))",
      gap: 20,
      marginTop: 20,
    }}
  >

    {actividades.map(
      (actividad) => (

        <div
          key={actividad.id}
          style={{

            ...theme.card,

            marginBottom: 0,

            display: "flex",

            flexDirection: "column",

            justifyContent:
              "space-between",

            minHeight: 260,

          }}
        >

          <div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: 12,
              }}
            >

              <h3
                style={{
                  margin: 0,
                  color:
                    theme.colors.text,
                }}
              >
                AF-{actividad.af}
              </h3>

              <span
                style={{
                  background:
                    actividad.actividadCompletada
                      ? theme.colors.success
                      : theme.colors.warning,

                  color: "#fff",

                  padding:
                    "6px 12px",

                  borderRadius: 20,

                  fontSize: 12,

                  fontWeight:
                    "bold",
                }}
              >
                {
                  actividad.actividadCompletada
                    ? "COMPLETADA"
                    : "ACTIVA"
                }
              </span>

            </div>

            <div
              style={{
                marginBottom: 10,
              }}
            >

              <strong>
                Sala:
              </strong>

              <br />

              {actividad.sala}

            </div>

            <div
              style={{
                marginBottom: 10,
              }}
            >

              <strong>
                Actividad:
              </strong>

              <br />

              {
                actividad.tipoActividad
              }

            </div>

            <div
              style={{
                marginBottom: 10,
              }}
            >

              <strong>
                Cliente:
              </strong>

              <br />

              {actividad.cliente}

            </div>

            <div
              style={{
                marginBottom: 10,
              }}
            >

              <strong>
                Fecha Límite:
              </strong>

              <br />

              {
                actividad.fechaLimite ||
                "Sin fecha"
              }

            </div>

          </div>

          <button
            onClick={() =>
              setActividadSeleccionada(
                actividad
              )
            }
            style={{
              ...theme.button.primary,
              width: "100%",
            }}
          >
            👁 Ver Seguimiento
          </button>

        </div>

      )
    )}

  </div>

)}

    </div>
  );
}

export default ActividadesPage;