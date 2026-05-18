import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase";

import theme from "../styles/theme";

function HistorialRotacionesPage() {

  const [rotaciones, setRotaciones] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [busqueda, setBusqueda] =
    useState("");

  // 🔥 CARGAR
  const cargarRotaciones =
    async () => {

      try {

        const q = query(

          collection(
            db,
            "rotaciones"
          ),

          orderBy(
            "fecha",
            "desc"
          )
        );

        const snapshot =
          await getDocs(q);

        const data =
          snapshot.docs.map(
            (d) => ({

              id: d.id,

              ...d.data(),

            })
          );

        setRotaciones(data);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);
      }
    };

  useEffect(() => {

    cargarRotaciones();

  }, []);

  // 🔥 FILTRO
  const rotacionesFiltradas =
    rotaciones.filter(
      (r) => {

        const texto =
          `${r.tecnicoNombre} ${r.sitio} ${r.supervisor}`
            .toLowerCase();

        return texto.includes(
          busqueda.toLowerCase()
        );
      }
    );

  // 🔥 FORMATO FECHA
  const formatearFecha =
    (fecha) => {

      try {

        if (!fecha) return "-";

        const date =
          fecha?.toDate
            ? fecha.toDate()
            : new Date(fecha);

        return date.toLocaleString();

      } catch {

        return "-";
      }
    };

  return (

    <div className="space-y-8">

      {/* HEADER */}
      <div
        style={theme.card}
        className="rounded-[32px] shadow-xl border border-slate-200 p-8"
      >

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <h1
              style={theme.title}
              className="text-slate-800 flex items-center gap-3"
            >

              🔄 Historial de Rotaciones

            </h1>

            <p className="text-slate-500 text-lg font-semibold mt-3">

              Historial operativo de asignaciones y movimientos

            </p>

          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-3xl px-8 py-5 shadow-sm">

            <p className="text-cyan-700 text-sm font-black tracking-widest">

              MOVIMIENTOS

            </p>

            <p className="text-5xl font-black text-cyan-700 mt-1">

              {rotacionesFiltradas.length}

            </p>

          </div>

        </div>

      </div>

      {/* BUSQUEDA */}
      <div
        style={theme.card}
        className="rounded-[32px] shadow-xl border border-slate-200 p-8"
      >

        <input
          type="text"

          placeholder="Buscar técnico, sitio o supervisor..."

          value={busqueda}

          onChange={(e) =>
            setBusqueda(
              e.target.value
            )
          }

          style={theme.input}

          className="rounded-2xl border border-slate-200 shadow-sm"
        />

      </div>

      {/* TABLA */}
      <div
        style={theme.card}
        className="rounded-[32px] shadow-xl border border-slate-200 overflow-hidden"
      >

        {
          loading

            ? (

              <div className="p-16 text-center text-3xl font-black text-cyan-700">

                🔄 Cargando historial...

              </div>
            )

            : rotacionesFiltradas.length === 0

            ? (

              <div className="p-16 text-center text-3xl font-black text-slate-400">

                📭 Sin movimientos registrados

              </div>
            )

            : (

              <div className="overflow-auto">

                <table className="w-full">

                  <thead className="bg-slate-100 border-b border-slate-200">

                    <tr>

                      <th className="p-5 text-left text-slate-700 font-black">

                        Técnico

                      </th>

                      <th className="p-5 text-left text-slate-700 font-black">

                        Sitio

                      </th>

                      <th className="p-5 text-left text-slate-700 font-black">

                        Acción

                      </th>

                      <th className="p-5 text-left text-slate-700 font-black">

                        Supervisor

                      </th>

                      <th className="p-5 text-left text-slate-700 font-black">

                        Fecha

                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {
                      rotacionesFiltradas.map(
                        (item) => (

                          <tr
                            key={item.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-all"
                          >

                            <td className="p-5 font-bold text-slate-700">

                              👨‍🔧 {item.tecnicoNombre}

                            </td>

                            <td className="p-5 font-bold text-cyan-700">

                              📍 {item.sitio}

                            </td>

                            <td className="p-5">

                              <span
                                className={`
                                  px-4
                                  py-2
                                  rounded-2xl
                                  text-sm
                                  font-black
                                  ${
                                    item.accion === "asignado"

                                      ? "bg-green-100 text-green-700"

                                      : "bg-red-100 text-red-700"
                                  }
                                `}
                              >

                                {
                                  item.accion === "asignado"

                                    ? "✅ ASIGNADO"

                                    : "🗑️ REMOVIDO"
                                }

                              </span>

                            </td>

                            <td className="p-5 font-bold text-slate-600">

                              👨‍💼 {item.supervisor}

                            </td>

                            <td className="p-5 text-slate-500 font-semibold">

                              {formatearFecha(item.fecha)}

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

    </div>
  );
}

export default HistorialRotacionesPage;
