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


    const calcularProgreso = (actividad) => {

  const pasos = [

    actividad.clienteConfirmado,

    actividad.materialConfirmado,

    actividad.tecnicosConfirmados,

    actividad.programacionConfirmada,

    actividad.ejecucionConfirmada,

  ];

  const completados =
    pasos.filter(Boolean).length;

  return {
    completados,
    total: pasos.length,
    porcentaje: Math.round(
      (completados / pasos.length) * 100
    ),
  };
};

const obtenerPendientes = (
  actividad
) => {

  const pendientes = [];

  if (!actividad.clienteConfirmado)
    pendientes.push("Cliente");

  if (!actividad.materialConfirmado)
    pendientes.push("Material");

  if (!actividad.tecnicosConfirmados)
    pendientes.push("Técnicos");

  if (!actividad.programacionConfirmada)
    pendientes.push("Programación");

  if (!actividad.ejecucionConfirmada)
    pendientes.push("Ejecución");

  return pendientes;
};

const obtenerEstado = (
  actividad
) => {

  const pendientes =
    obtenerPendientes(
      actividad
    ).length;

  if (pendientes === 0) {

    return {
      texto: "LISTA",
      color: "#10B981",
    };

  }

  if (pendientes <= 2) {

    return {
      texto: "EN PROCESO",
      color: "#F59E0B",
    };

  }

  return {
    texto: "CRÍTICA",
    color: "#EF4444",
  };
};

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
  (actividad) => {

 const progreso =
  calcularProgreso(
    actividad
  );

const pendientesActividad =
  obtenerPendientes(
    actividad
  );

const estado =
  obtenerEstado(
    actividad
  );

    return (

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
    background: estado.color,
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  }}
>
  {estado.texto}
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

<div
  style={{
    marginTop: 15,
  }}
>

  <div
    style={{
      display: "flex",
      justifyContent:
        "space-between",
      marginBottom: 6,
    }}
  >

    <strong>
      Avance
    </strong>

    <strong>
      {progreso.porcentaje}%
    </strong>

  </div>

  <div
    style={{
      width: "100%",
      height: 8,
      background: "#E2E8F0",
      borderRadius: 999,
      overflow: "hidden",
    }}
  >

    <div
      style={{
        width:
          `${progreso.porcentaje}%`,
        height: "100%",
        background:
          estado.color,
      }}
    />

  </div>

</div>

<div
  style={{
    marginTop: 12,
  }}
>

  <strong>
    Pendientes:
  </strong>

  {
    pendientesActividad.length === 0
      ? (
        <div
          style={{
            color:
              "#10B981",
            marginTop: 6,
            fontWeight: 700,
          }}
        >
          ✅ Lista para ejecutar
        </div>
      )
      : (
        pendientesActividad
  .slice(0, 3)
          .map(item => (

            <div
              key={item}
              style={{
                marginTop: 4,
                fontSize: 13,
              }}
            >
              ⏳ {item}
            </div>

          ))
      )
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

   );
})
}

  </div>

)}

    </div>
  );
}

export default ActividadesPage;