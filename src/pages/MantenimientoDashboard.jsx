
import {
  useEffect,
  useState,
} from "react";

import theme from "../styles/theme";

import {
  obtenerMantenimientos,
} from "../services/mantenimientosService";

export default function MantenimientoDashboard() {

  const hoy =
    new Date()
      .toISOString()
      .split("T")[0];

  const [mantenimientos, setMantenimientos] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [busqueda, setBusqueda] =
    useState("");

  const [fechaFiltro, setFechaFiltro] =
    useState(hoy);

  // 🔥 CARGAR
  useEffect(() => {

    cargarMantenimientos();

  }, []);

  const cargarMantenimientos =
    async () => {

      setLoading(true);

      const data =
        await obtenerMantenimientos();

      setMantenimientos(data);

      setLoading(false);
    };

  // 🔥 FORMATO FECHA
  const convertirFecha =
    (fechaTexto) => {

      if (!fechaTexto)
        return "";

      const partes =
        fechaTexto.split("/");

      if (partes.length !== 3)
        return "";

      const dia =
        partes[0].padStart(2, "0");

      const mes =
        partes[1].padStart(2, "0");

      const anio =
        partes[2];

      return `${anio}-${mes}-${dia}`;
    };

  // 🔥 FILTRAR
  const filtrados =
    mantenimientos.filter(
      (mantenimiento) => {

        const texto =
          busqueda.toLowerCase();

        const coincideTexto =
          mantenimiento.sitio
            ?.toLowerCase()
            .includes(texto) ||

          mantenimiento.tecnico
            ?.toLowerCase()
            .includes(texto) ||

          mantenimiento.maquinas?.some(
            (m) =>

              m.vlt
                ?.toLowerCase()
                .includes(texto)
          );

        const fechaMantenimiento =
          convertirFecha(
            mantenimiento.fecha
          );

        const coincideFecha =
          fechaMantenimiento ===
          fechaFiltro;

        return (
          coincideTexto &&
          coincideFecha
        );
      }
    );

  // 🔥 PDF
  const generarPDF =
    (mantenimiento) => {

      const ventana =
        window.open(
          "",
          "_blank"
        );

      ventana.document.write(`

        <html>

          <head>

            <title>
              Mantenimiento
            </title>

            <style>

              body {
                font-family: Arial;
                padding: 30px;
              }

              h1 {
                color: #0891b2;
              }

              .card {
                border: 1px solid #ccc;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 30px;
              }

              img {
                width: 100%;
                max-width: 350px;
                border-radius: 15px;
                margin-top: 10px;
              }

            </style>

          </head>

          <body>

            <h1>
              🔧 Reporte de Mantenimiento
            </h1>

            <h2>
              📍 ${mantenimiento.sitio}
            </h2>

            <p>
              👨‍🔧 ${mantenimiento.tecnico}
            </p>

            <p>
              📅 ${mantenimiento.fecha}
            </p>

            <p>
              🕒 ${mantenimiento.hora}
            </p>

            ${mantenimiento.maquinas
              ?.map(
                (maquina) => `

                <div class="card">

                  <h2>
                    🎰 ${maquina.vlt}
                  </h2>

                  <p>
                    ${maquina.comentario || "Sin comentario"}
                  </p>

                  <h3>
                    📸 Antes
                  </h3>

                  ${maquina.antes
                    ? `<img src="${maquina.antes}" />`
                    : "Sin imagen"}

                  <h3>
                    📸 Después
                  </h3>

                  ${maquina.despues
                    ? `<img src="${maquina.despues}" />`
                    : "Sin imagen"}

                </div>

              `
              )
              .join("")}

          </body>

        </html>

      `);

      ventana.document.close();

      ventana.print();
    };

  return (

    <div style={theme.layout.page}>

      <div style={theme.layout.content}>

        {/* HEADER */}
        <div
          style={theme.card}
          className="border border-gray-200 mb-8"
        >

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <h1 className="text-5xl font-black text-cyan-700">

                🔧 Dashboard Mantenimiento

              </h1>

              <p className="text-gray-500 text-xl font-bold mt-4">

                Monitoreo técnico enterprise

              </p>

            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-3xl px-8 py-6">

              <p className="text-gray-500 font-bold">

                MANTENIMIENTOS

              </p>

              <p className="text-5xl font-black text-cyan-700">

                {filtrados.length}

              </p>

            </div>

          </div>

        </div>

        {/* FILTROS */}
        <div
          style={theme.card}
          className="mb-8"
        >

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* BUSQUEDA */}
            <input
              type="text"
              placeholder="Buscar sitio, técnico o VLT..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              style={{
                ...theme.input,
                marginBottom: 0,
              }}
            />

            {/* FECHA */}
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) =>
                setFechaFiltro(
                  e.target.value
                )
              }
              style={{
                ...theme.input,
                marginBottom: 0,
              }}
            />

          </div>

        </div>

        {/* LOADING */}
        {loading && (

          <div
            style={theme.card}
            className="text-center text-3xl font-black text-cyan-700"
          >

            Cargando...

          </div>

        )}

        {/* LISTA */}
        <div className="space-y-8">

          {filtrados.map(
            (
              mantenimiento,
              index
            ) => (

              <div
                key={index}
                style={theme.card}
                className="border border-gray-200"
              >

                {/* HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

                  <div>

                    <h2 className="text-4xl font-black text-slate-700">

                      📍 {
                        mantenimiento.sitio
                      }

                    </h2>

                    <p className="text-gray-500 font-bold mt-3 text-lg">

                      👨‍🔧 {
                        mantenimiento.tecnico
                      }

                    </p>

                  </div>

                  <div className="flex flex-wrap gap-4">

                    <div className="bg-slate-100 rounded-3xl px-6 py-5">

                      <p className="text-gray-500 font-bold">

                        MÁQUINAS

                      </p>

                      <p className="text-4xl font-black text-slate-700">

                        {
                          mantenimiento.totalMaquinas
                        }

                      </p>

                    </div>

                    {/* PDF */}
                    <button
                      onClick={() =>
                        generarPDF(
                          mantenimiento
                        )
                      }
                      style={theme.button.danger}
                    >

                      📄 PDF

                    </button>

                  </div>

                </div>

                {/* FECHA */}
                <div className="flex flex-wrap gap-5 mb-8">

                  <div className="bg-cyan-50 border border-cyan-200 rounded-2xl px-5 py-3 font-bold text-cyan-700">

                    📅 {
                      mantenimiento.fecha
                    }

                  </div>

                  <div className="bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700">

                    🕒 {
                      mantenimiento.hora
                    }

                  </div>

                </div>

                {/* MAQUINAS */}
                <div className="space-y-8">

                  {mantenimiento.maquinas?.map(
                    (
                      maquina,
                      i
                    ) => (

                      <div
                        key={i}
                        className="bg-slate-50 border border-gray-200 rounded-3xl p-6"
                      >

                        <h3 className="text-3xl font-black text-slate-700 mb-3">

                          🎰 {
                            maquina.vlt
                          }

                        </h3>

                        <p className="text-gray-500 font-bold mb-6">

                          {
                            maquina.comentario
                          }

                        </p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                          {/* ANTES */}
                          <div>

                            <h4 className="text-xl font-black text-red-500 mb-4">

                              📸 Antes

                            </h4>

                            {maquina.antes ? (

                              <img
                                src={
                                  maquina.antes
                                }
                                alt="Antes"
                                className="rounded-3xl border border-gray-200 w-full max-h-[350px] object-cover"
                              />

                            ) : (

                              <div className="bg-slate-100 rounded-3xl h-[250px] flex items-center justify-center font-black text-gray-400">

                                Sin imagen

                              </div>

                            )}

                          </div>

                          {/* DESPUES */}
                          <div>

                            <h4 className="text-xl font-black text-green-500 mb-4">

                              📸 Después

                            </h4>

                            {maquina.despues ? (

                              <img
                                src={
                                  maquina.despues
                                }
                                alt="Después"
                                className="rounded-3xl border border-gray-200 w-full max-h-[350px] object-cover"
                              />

                            ) : (

                              <div className="bg-slate-100 rounded-3xl h-[250px] flex items-center justify-center font-black text-gray-400">

                                Sin imagen

                              </div>

                            )}

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </div>
  );
}
