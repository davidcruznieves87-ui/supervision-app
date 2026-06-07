import {
  useEffect,
  useState,
} from "react";

import theme from "../styles/theme";

import useAuth from "../hooks/useAuth";

import {
  obtenerSitios,
} from "../services/sitiosService";

import {
  obtenerConectividad,
  guardarConectividad,
} from "../services/conectividadService";

export default function ConectividadPage() {

  const { usuario } =
    useAuth();

  const [salas, setSalas] =
    useState([]);

  const [conectividad,
    setConectividad] =
    useState([]);

 useEffect(() => {

  if (!usuario) return;

  cargarDatos();

}, [usuario]);

 const cargarDatos =
  async () => {

    if (!usuario) return;

    const sitios =
      await obtenerSitios(
        usuario.nombre,
        usuario.rol
      );

    console.log(
      "SITIOS:",
      sitios
    );

    const conexiones =
      await obtenerConectividad();

    setSalas(sitios);

    setConectividad(
      conexiones
    );
  };

  const guardar =
    async (
      sala,
      tieneInternet,
      tipoConexion
    ) => {

      await guardarConectividad(
        sala,

        {
          tieneInternet,

          tipoConexion,

          actualizadoPor:
            usuario?.nombre,
        }
      );

      cargarDatos();
    };

  const obtenerEstado =
    (sala) => {

      return (
        conectividad.find(
          (c) =>
            c.sala === sala
        ) || {}
      );
    };

  const totalInternet =
    conectividad.filter(
      (c) =>
        c.tieneInternet
    ).length;

  const totalTelcel =
    conectividad.filter(
      (c) =>
        c.tipoConexion ===
        "Router Telcel"
    ).length;

  const totalCliente =
    conectividad.filter(
      (c) =>
        c.tipoConexion ===
        "Cliente"
    ).length;

  const totalSinInternet =
    salas.length -
    totalInternet;

  return (

    <div>

      <h1 style={theme.title}>
        🌐 Control de Conectividad
      </h1>

      {/* KPI */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px",
          marginBottom: "25px",
        }}
      >

        <div style={theme.card}>
          <h3>
            🌐 Con Internet
          </h3>
          <h1>
            {totalInternet}
          </h1>
        </div>

        <div style={theme.card}>
          <h3>
            📡 Router Telcel
          </h3>
          <h1>
            {totalTelcel}
          </h1>
        </div>

        <div style={theme.card}>
          <h3>
            🏢 Cliente
          </h3>
          <h1>
            {totalCliente}
          </h1>
        </div>

        <div style={theme.card}>
          <h3>
            ❌ Sin Internet
          </h3>
          <h1>
            {totalSinInternet}
          </h1>
        </div>

      </div>

      {/* TABLA */}

      <div style={theme.card}>

        <table
          style={{
            width: "100%",
          }}
        >

          <thead>

            <tr>

              <th>Sala</th>

              <th>Internet</th>

              <th>Tipo</th>

              <th>Guardar</th>

            </tr>

          </thead>

          <tbody>

            {salas.map(
              (sala) => {

                const estado =
                  obtenerEstado(
                    sala.nombre ||
                    sala.sala
                  );

                return (

                  <FilaConectividad
                    key={
                      sala.nombre ||
                      sala.sala
                    }

                    sala={
                      sala.nombre ||
                      sala.sala
                    }

                    estado={
                      estado
                    }

                    guardar={
                      guardar
                    }
                  />

                );
              }
            )}

          </tbody>

        </table>

      </div>

    </div>

  );
}

function FilaConectividad({

  sala,

  estado,

  guardar,

}) {

  const [
    internet,
    setInternet
  ] = useState(

    estado.tieneInternet ||
    false
  );

  const [
    tipo,
    setTipo
  ] = useState(

    estado.tipoConexion ||
    ""
  );

  return (

    <tr>

      <td>{sala}</td>

      <td>

        <select

          value={
            internet
              ? "SI"
              : "NO"
          }

          onChange={(e) =>
            setInternet(
              e.target.value ===
                "SI"
            )
          }
        >

          <option value="SI">
            Sí
          </option>

          <option value="NO">
            No
          </option>

        </select>

      </td>

      <td>

        <select

          disabled={
            !internet
          }

          value={tipo}

          onChange={(e) =>
            setTipo(
              e.target.value
            )
          }
        >

          <option value="">
            Seleccionar
          </option>

          <option value="Cliente">
            Cliente
          </option>

          <option value="Router Telcel">
            Router Telcel
          </option>

        </select>

      </td>

      <td>

        <button

          style={
            theme.button.primary
          }

          onClick={() =>
            guardar(
              sala,
              internet,
              tipo
            )
          }
        >

          Guardar

        </button>

      </td>

    </tr>
  );
}