import {
  useState,
  useEffect,
} from "react";

import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

import {
  obtenerTecnicos,
} from "../services/tecnicosService";

import theme from "../styles/theme";

function GestionSitios({
  supervisor,
}) {

  const [nuevoSitio, setNuevoSitio] =
    useState("");

  const [
    tecnicoSeleccionado,
    setTecnicoSeleccionado,
  ] = useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [tipoMensaje, setTipoMensaje] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    tecnicosDB,
    setTecnicosDB,
  ] = useState([]);

  // 🔥 CARGAR TECNICOS
  const cargarTecnicos =
    async () => {

      try {

        const data =
         await obtenerTecnicos(
  supervisor
          );

        setTecnicosDB(
          data || []
        );

      } catch (error) {

        console.log(error);

        setTecnicosDB([]);
console.log(
  "TECNICOS DB:",
  data
);

      }
    };

  // 🔥 INIT
  useEffect(() => {

    cargarTecnicos();

  }, []);

  // 🔥 MENSAJES
  const mostrarMensaje = (
    texto,
    tipo = "success"
  ) => {

    setMensaje(texto);

    setTipoMensaje(tipo);

    setTimeout(() => {

      setMensaje("");

      setTipoMensaje("");

    }, 3000);
  };

  // 🔥 AGREGAR SITIO
  const agregarSitio =
    async () => {

      if (
        !nuevoSitio.trim() ||
        !tecnicoSeleccionado
      ) {

        mostrarMensaje(
          "⚠️ Completa todos los campos",
          "warning"
        );

        return;
      }

      try {

        setLoading(true);

        // 🔥 GUARDAR SITIO
        await addDoc(

          collection(
            db,
            "sitios"
          ),

          {

            nombre:
              nuevoSitio.trim(),

            tecnico:
              tecnicoSeleccionado,

            supervisor,

            createdAt:
              new Date(),
          }
        );

        // 🔥 BUSCAR TECNICO
        const q = query(

          collection(
            db,
            "tecnicos"
          ),

          where(
            "nombre",
            "==",
            tecnicoSeleccionado
          )
        );

        const snapshot =
          await getDocs(q);

        // 🔥 ACTUALIZAR SITIOS ASIGNADOS
        for (const d of snapshot.docs) {

          const tecnicoData =
            d.data();

          await updateDoc(

            doc(
              db,
              "tecnicos",
              d.id
            ),

            {

              sitiosAsignados: [

                ...(tecnicoData
                  ?.sitiosAsignados || []),

                nuevoSitio.trim(),
              ],
            }
          );
        }

        // 🔥 RECARGAR TECNICOS
        await cargarTecnicos();

        setNuevoSitio("");

        setTecnicoSeleccionado("");

        mostrarMensaje(
          "✅ Sitio agregado correctamente"
        );

      } catch (error) {

        console.log(error);

        mostrarMensaje(
          "❌ Error al agregar sitio",
          "error"
        );

      } finally {

        setLoading(false);
      }
    };

  // 🔥 ELIMINAR SITIO
  const eliminarSitio =
    async (
      tecnicoNombre,
      sitioEliminar
    ) => {

      const confirmar =
        window.confirm(
          "¿Eliminar sitio?"
        );

      if (!confirmar) return;

      try {

        // 🔥 BUSCAR TECNICO
        const q = query(

          collection(
            db,
            "tecnicos"
          ),

          where(
            "nombre",
            "==",
            tecnicoNombre
          )
        );

        const snapshot =
          await getDocs(q);

        // 🔥 ACTUALIZAR
        for (const d of snapshot.docs) {

          const tecnicoData =
            d.data();

          await updateDoc(

            doc(
              db,
              "tecnicos",
              d.id
            ),

            {

              sitiosAsignados:

                (
                  tecnicoData
                    ?.sitiosAsignados || []
                ).filter(
                  (s) =>
                    s !==
                    sitioEliminar
                ),
            }
          );
        }

        // 🔥 REFRESH
        await cargarTecnicos();

        mostrarMensaje(
          "🗑️ Sitio eliminado"
        );

      } catch (error) {

        console.log(error);

        mostrarMensaje(
          "❌ Error al eliminar",
          "error"
        );
      }
    };

  return (

    <div
      style={theme.card}
      className="border border-gray-200"
    >

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

        <div>

          <h2
            style={theme.title}
            className="flex items-center gap-3"
          >

            📍 Gestión de Sitios

          </h2>

          <p className="text-gray-500 font-semibold text-lg">

            Sitios asignados por técnico

          </p>

        </div>

        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl px-6 py-4 shadow-sm">

          <p className="text-gray-500 font-bold text-sm">

            TÉCNICOS

          </p>

          <p className="text-4xl font-black text-cyan-700">

            {tecnicosDB.length}

          </p>

        </div>

      </div>

      {/* MENSAJES */}
      {
        mensaje && (

          <div
            style={
              tipoMensaje ===
                "success"

                ? theme.message.success

                : tipoMensaje ===
                  "warning"

                ? theme.message.warning

                : theme.message.error
            }
          >

            {mensaje}

          </div>
        )
      }

      {/* FORM */}
      <div className="bg-slate-50 border border-gray-200 rounded-3xl p-6 mb-8">

        <h3 className="text-2xl font-black text-slate-700 mb-6">

          ➕ Agregar Sitio

        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* TECNICO */}
          <div>

            <label className="font-bold text-gray-600">

              Técnico

            </label>

            <select
              value={
                tecnicoSeleccionado
              }

              onChange={(e) =>
                setTecnicoSeleccionado(
                  e.target.value
                )
              }

              style={theme.input}

              className="bg-white"
            >

              <option value="">
                Seleccionar técnico
              </option>

              {
                tecnicosDB.map(
                  (t) => (

                    <option
                      key={t.id}
                      value={t.nombre}
                    >

                      {t.nombre}

                    </option>
                  )
                )
              }

            </select>

          </div>

          {/* SITIO */}
          <div>

            <label className="font-bold text-gray-600">

              Nombre del sitio

            </label>

            <input
              type="text"

              placeholder="Ej. Casino Caliente"

              value={nuevoSitio}

              onChange={(e) =>
                setNuevoSitio(
                  e.target.value
                )
              }

              style={theme.input}
            />

          </div>

          {/* BTN */}
          <div className="flex items-end">

            <button
              onClick={
                agregarSitio
              }

              disabled={loading}

              style={
                theme.button.primary
              }

              className="w-full text-lg hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50"
            >

              {
                loading

                  ? "Guardando..."

                  : "➕ Agregar Sitio"
              }

            </button>

          </div>

        </div>

      </div>

      {/* LISTA */}
      <div className="space-y-5">

        {
          tecnicosDB.length === 0

            ? (

              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-3xl p-10 text-center">

                <p className="text-2xl font-black text-gray-400">

                  📭 No hay técnicos registrados

                </p>

              </div>
            )

            : (

              tecnicosDB.map(
                (tecnico) => (

                  <div
                    key={tecnico.id}

                    className="bg-white border border-gray-200 rounded-3xl p-6 shadow-md"
                  >

                    {/* TECNICO */}
                    <div className="mb-5">

                      <h3 className="text-3xl font-black text-cyan-700">

                        👨‍🔧 {tecnico.nombre}

                      </h3>

                      <p className="text-gray-500 font-bold mt-2">

                        Supervisor:
                        {" "}
                        {tecnico.supervisor}

                      </p>

                    </div>

                    {/* SITIOS */}
                    <div className="flex flex-wrap gap-3">

                      {
                        tecnico
                          ?.sitiosAsignados
                          ?.length > 0

                          ? (

                            tecnico
                              .sitiosAsignados
                              .map(
                                (
                                  sitio,
                                  index
                                ) => (

                                  <div
                                    key={index}

                                    className="flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-xl font-bold"
                                  >

                                    <span>

                                      📍 {sitio}

                                    </span>

                                    <button
                                      onClick={() =>
                                        eliminarSitio(
                                          tecnico.nombre,
                                          sitio
                                        )
                                      }

                                      className="text-red-600 font-black"
                                    >

                                      ✕

                                    </button>

                                  </div>
                                )
                              )
                          )

                          : (

                            <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl font-bold">

                              Sin sitios asignados

                            </span>
                          )
                      }

                    </div>

                  </div>
                )
              )
            )
        }

      </div>

    </div>
  );
}

export default GestionSitios;