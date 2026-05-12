import { useMemo, useState } from "react";

import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase";

import theme from "../styles/theme";

function GestionSitios({
  supervisor,
  tecnicos,
  sitios,
  cargarSitios,
}) {
  const [nuevoSitio, setNuevoSitio] =
    useState("");

  const [
    tecnicoSeleccionado,
    setTecnicoSeleccionado,
  ] = useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [tipoMensaje, setTipoMensaje] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // 🔥 FILTRAR SITIOS
  const sitiosFiltrados = useMemo(() => {
    return sitios.filter((s) =>
      s.nombre
        .toLowerCase()
        .includes(
          busqueda.toLowerCase()
        )
    );
  }, [sitios, busqueda]);

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
  const agregarSitio = async () => {
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

    const existe = sitios.some(
      (s) =>
        s.nombre.toLowerCase() ===
        nuevoSitio
          .trim()
          .toLowerCase()
    );

    if (existe) {
      mostrarMensaje(
        "❌ Ese sitio ya existe",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      await addDoc(
        collection(db, "sitios"),
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

      setNuevoSitio("");
      setTecnicoSeleccionado("");

      await cargarSitios();

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

  // 🔥 REASIGNAR
  const reasignarSitio = async (
    id,
    nuevoTecnico
  ) => {
    try {
      await updateDoc(
        doc(db, "sitios", id),
        {
          tecnico: nuevoTecnico,
        }
      );

      await cargarSitios();

      mostrarMensaje(
        "✅ Sitio reasignado"
      );
    } catch (error) {
      console.log(error);

      mostrarMensaje(
        "❌ Error al reasignar",
        "error"
      );
    }
  };

  // 🔥 ELIMINAR
  const eliminarSitio = async (id) => {
    const confirmar =
      window.confirm(
        "¿Eliminar sitio?"
      );

    if (!confirmar) return;

    try {
      await deleteDoc(
        doc(db, "sitios", id)
      );

      await cargarSitios();

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
            Administra los
            sitios y técnicos
            asignados
          </p>
        </div>

        {/* TOTAL */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-gray-500 font-bold text-sm">
            SITIOS REGISTRADOS
          </p>

          <p className="text-4xl font-black text-cyan-700">
            {sitios.length}
          </p>
        </div>
      </div>

      {/* MENSAJES */}
      {mensaje && (
        <div
          style={
            tipoMensaje === "success"
              ? theme.message.success
              : tipoMensaje ===
                "warning"
              ? theme.message.warning
              : theme.message.error
          }
        >
          {mensaje}
        </div>
      )}

      {/* FORMULARIO */}
      <div className="bg-slate-50 border border-gray-200 rounded-3xl p-6 mb-8">
        <h3 className="text-2xl font-black text-slate-700 mb-6">
          ➕ Agregar nuevo
          sitio
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

              {tecnicos.map((t) => (
                <option
                  key={t.id}
                  value={t.nombre}
                >
                  {t.nombre}
                </option>
              ))}
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

          {/* BOTON */}
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
              {loading
                ? "Guardando..."
                : "➕ Agregar Sitio"}
            </button>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="🔍 Buscar sitio..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(
              e.target.value
            )
          }
          style={theme.input}
          className="text-lg"
        />
      </div>

      {/* LISTA */}
      <div className="space-y-5">
        {sitiosFiltrados.length ===
        0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-3xl p-10 text-center">
            <p className="text-2xl font-black text-gray-400">
              📭 No se
              encontraron sitios
            </p>
          </div>
        ) : (
          sitiosFiltrados.map(
            (s) => (
              <div
                key={s.id}
                className="bg-white border border-gray-200 rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                  {/* INFO */}
                  <div>
                    <h3 className="text-3xl font-black text-cyan-700">
                      📍 {s.nombre}
                    </h3>

                    <div className="flex flex-wrap gap-3 mt-4">
                      <span className="bg-cyan-100 text-cyan-700 px-4 py-2 rounded-xl font-bold">
                        👨‍🔧{" "}
                        {s.tecnico}
                      </span>

                      <span className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">
                        👤{" "}
                        {supervisor}
                      </span>
                    </div>
                  </div>

                  {/* ACCIONES */}
                  <div className="flex flex-col lg:flex-row gap-4 w-full xl:w-auto">
                    {/* REASIGNAR */}
                    <select
                      value={
                        s.tecnico
                      }
                      onChange={(e) =>
                        reasignarSitio(
                          s.id,
                          e.target
                            .value
                        )
                      }
                      style={
                        theme.input
                      }
                      className="min-w-[250px] bg-white"
                    >
                      {tecnicos.map(
                        (t) => (
                          <option
                            key={t.id}
                            value={
                              t.nombre
                            }
                          >
                            {t.nombre}
                          </option>
                        )
                      )}
                    </select>

                    {/* ELIMINAR */}
                    <button
                      onClick={() =>
                        eliminarSitio(
                          s.id
                        )
                      }
                      style={
                        theme.button
                          .danger
                      }
                      className="hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

export default GestionSitios;