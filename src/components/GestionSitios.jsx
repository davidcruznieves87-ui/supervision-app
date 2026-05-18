import {
  useState,
  useEffect,
} from "react";

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

import theme from "../styles/theme";

function GestionSitios({
  supervisor,
}) {

  const [
    nuevoSitio,
    setNuevoSitio,
  ] = useState("");

  const [
    tecnicoSeleccionado,
    setTecnicoSeleccionado,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    tipoMensaje,
    setTipoMensaje,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    tecnicosDB,
    setTecnicosDB,
  ] = useState([]);

  // 🔥 CARGAR TECNICOS
  const cargarTecnicos =
    async () => {

      try {

        const q = query(

          collection(
            db,
            "usuarios"
          ),

          where(
            "rol",
            "==",
            "tecnico"
          )
        );

        const snapshot =
          await getDocs(q);

        const tecnicos =
          snapshot.docs.map(
            (d) => ({

              id: d.id,

              ...d.data(),

            })
          );

        setTecnicosDB(
          tecnicos || []
        );

      } catch (error) {

        console.log(error);

        setTecnicosDB([]);
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

        // 🔥 LEGACY SITIOS
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
            "usuarios"
          ),

          where(
            "nombre",
            "==",
            tecnicoSeleccionado
          ),

          where(
            "rol",
            "==",
            "tecnico"
          )
        );

        const snapshot =
          await getDocs(q);

        // 🔥 ACTUALIZAR SITIOS
        for (const d of snapshot.docs) {

          const tecnicoData =
            d.data();

          const sitiosActuales =

            tecnicoData
              ?.sitiosAsignados || [];

          // 🔥 EVITAR DUPLICADOS
          if (
            sitiosActuales.includes(
              nuevoSitio.trim()
            )
          ) {

            mostrarMensaje(
              "⚠️ El sitio ya está asignado",
              "warning"
            );

            setLoading(false);

            return;
          }

          // 🔥 ACTUALIZAR
          await updateDoc(

            doc(
              db,
              "usuarios",
              d.id
            ),

            {

              sitiosAsignados: [

                ...sitiosActuales,

                nuevoSitio.trim(),
              ],
            }
          );

          // 🔥 HISTORIAL ROTACION
          await addDoc(

            collection(
              db,
              "rotaciones"
            ),

            {

              tecnicoId:
                d.id,

              tecnicoNombre:
                tecnicoData.nombre,

              sitio:
                nuevoSitio.trim(),

              accion:
                "asignado",

              supervisor,

              usuarioMovimiento:
                supervisor,

              fecha:
                new Date(),

              motivo:
                "Asignación de sitio",

            }
          );
        }

        // 🔥 REFRESH
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

        const q = query(

          collection(
            db,
            "usuarios"
          ),

          where(
            "nombre",
            "==",
            tecnicoNombre
          ),

          where(
            "rol",
            "==",
            "tecnico"
          )
        );

        const snapshot =
          await getDocs(q);

        for (const d of snapshot.docs) {

          const tecnicoData =
            d.data();

          // 🔥 ACTUALIZAR
          await updateDoc(

            doc(
              db,
              "usuarios",
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

          // 🔥 HISTORIAL ROTACION
          await addDoc(

            collection(
              db,
              "rotaciones"
            ),

            {

              tecnicoId:
                d.id,

              tecnicoNombre:
                tecnicoData.nombre,

              sitio:
                sitioEliminar,

              accion:
                "removido",

              supervisor,

              usuarioMovimiento:
                supervisor,

              fecha:
                new Date(),

              motivo:
                "Eliminación de sitio",

            }
          );
        }

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
      className="
        border
        border-slate-200
        shadow-xl
        rounded-[32px]
        overflow-hidden
      "
    >

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 p-2">

        <div>

          <h2
            style={theme.title}
            className="
              flex
              items-center
              gap-3
              text-slate-800
            "
          >

            📍 Gestión de Sitios

          </h2>

          <p className="text-slate-500 font-semibold text-lg mt-2">

            Sitios asignados por técnico

          </p>

        </div>

        <div
          className="
            bg-gradient-to-br
            from-cyan-50
            to-cyan-100
            border
            border-cyan-200
            rounded-3xl
            px-8
            py-5
            shadow-sm
          "
        >

          <p className="text-cyan-700 font-black text-sm tracking-widest">

            TÉCNICOS

          </p>

          <p className="text-5xl font-black text-cyan-800 mt-1">

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
      <div
        className="
          bg-gradient-to-br
          from-cyan-50
          to-white
          border
          border-cyan-100
          rounded-[32px]
          p-8
          mb-10
          shadow-sm
        "
      >

        <h3
          className="
            text-3xl
            font-black
            text-slate-800
            mb-8
            flex
            items-center
            gap-3
          "
        >

          ➕ Agregar Sitio

        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* TECNICO */}
          <div>

            <label className="font-black text-slate-700 mb-2 block">

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

              className="
                bg-white
                rounded-2xl
                border
                border-slate-200
                shadow-sm
                focus:ring-4
                focus:ring-cyan-100
              "
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

            <label className="font-black text-slate-700 mb-2 block">

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

              className="
                rounded-2xl
                border
                border-slate-200
                shadow-sm
                focus:ring-4
                focus:ring-cyan-100
              "
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

              className="
                w-full
                text-lg
                font-black
                rounded-2xl
                hover:scale-[1.02]
                transition-all
                duration-300
                shadow-xl
                disabled:opacity-50
                bg-gradient-to-r
                from-cyan-600
                to-blue-600
              "
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
      <div className="space-y-6">

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

                    className="
                      bg-white
                      border
                      border-slate-200
                      rounded-3xl
                      p-6
                      shadow-sm
                      hover:shadow-xl
                      transition-all
                      duration-300
                    "
                  >

                    {/* TECNICO */}
                    <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      {/* INFO */}
                      <div className="flex items-center gap-4">

                        <div
                          className="
                            w-16
                            h-16
                            rounded-2xl
                            bg-cyan-100
                            flex
                            items-center
                            justify-center
                            text-3xl
                            shadow-inner
                          "
                        >

                          👨‍🔧

                        </div>

                        <div>

                          <h3 className="text-3xl font-black text-cyan-700">

                            {tecnico.nombre}

                          </h3>

                          <p className="text-gray-500 font-bold mt-2">

                            Supervisor:
                            {" "}
                            {tecnico.supervisor}

                          </p>

                        </div>

                      </div>

                      {/* CONTADOR */}
                      <div
                        className="
                          bg-cyan-50
                          border
                          border-cyan-200
                          px-5
                          py-3
                          rounded-2xl
                          w-fit
                        "
                      >

                        <p
                          className="
                            text-sm
                            font-bold
                            text-cyan-600
                          "
                        >

                          SITIOS

                        </p>

                        <p
                          className="
                            text-3xl
                            font-black
                            text-cyan-700
                          "
                        >

                          {
                            tecnico
                              ?.sitiosAsignados
                              ?.length || 0
                          }

                        </p>

                      </div>

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

                                    className="
                                      flex
                                      items-center
                                      gap-2
                                      bg-cyan-50
                                      border
                                      border-cyan-200
                                      text-cyan-700
                                      px-4
                                      py-3
                                      rounded-2xl
                                      font-bold
                                      shadow-sm
                                      hover:scale-105
                                      transition-all
                                      duration-200
                                    "
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

                                      className="
                                        text-red-500
                                        hover:text-red-700
                                        font-black
                                        text-lg
                                      "
                                    >

                                      ✕

                                    </button>

                                  </div>
                                )
                              )
                          )

                          : (

                            <span
                              className="
                                bg-slate-100
                                text-slate-500
                                px-5
                                py-4
                                rounded-2xl
                                font-bold
                              "
                            >

                              📭 Sin sitios asignados

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