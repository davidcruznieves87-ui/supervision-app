import {
  useState,
  useEffect,
} from "react";

import theme from "../styles/theme";

import {
  guardarMantenimiento as guardarMantenimientoDB,
} from "../services/mantenimientosService";

import useAuth from "../hooks/useAuth";

export default function MantenimientoPage() {

  const { supervisor } =
    useAuth();

  const fecha =
    new Date();

  const fechaActual =
    fecha.toLocaleDateString();

  const horaActual =
    fecha.toLocaleTimeString();

  // 🔥 LOCAL
  const datosGuardados =
    JSON.parse(
      localStorage.getItem(
        "mantenimiento_temp"
      )
    );

  // 🔥 STATES
  const [sitio, setSitio] =
    useState(
      datosGuardados?.sitio ||
        ""
    );

  const [
    maquinas,
    setMaquinas,
  ] = useState(

    datosGuardados?.maquinas || [

      {
        vlt: "",
        comentario: "",
        antes: null,
        despues: null,
      },

    ]
  );

  const [
    maquinaActiva,
    setMaquinaActiva,
  ] = useState(0);

  const [mensaje, setMensaje] =
    useState("");

  // 🔥 GUARDAR LOCAL
  useEffect(() => {

    localStorage.setItem(
      "mantenimiento_temp",

      JSON.stringify({
        sitio,
        maquinas,
      })
    );

  }, [sitio, maquinas]);

  // 🔥 MAQUINA ACTUAL
  const maquina =
    maquinas[
      maquinaActiva
    ];

  // 🔥 ACTUALIZAR
  const actualizarMaquina =
    (
      campo,
      valor
    ) => {

      const nuevas =
        [...maquinas];

      nuevas[
        maquinaActiva
      ][campo] = valor;

      setMaquinas(nuevas);
    };

  // 🔥 AGREGAR
 const agregarMaquina =
  () => {

    const actual =
      maquinas[
        maquinaActiva
      ];

    // 🔥 VALIDAR VLT
    if (
      !actual.vlt.trim()
    ) {

      setMensaje(
        "⚠️ Ingresa VLT antes de agregar otra máquina"
      );

      setTimeout(() => {

        setMensaje("");

      }, 3000);

      return;
    }

    // 🔥 VALIDAR DUPLICADOS
    const existe =
      maquinas.some(
        (
          item,
          index
        ) => {

          return (
            index !==
              maquinaActiva &&
            item.vlt
              .trim()
              .toLowerCase() ===
              actual.vlt
                .trim()
                .toLowerCase()
          );
        }
      );

    if (existe) {

      setMensaje(
        "⚠️ Esa VLT ya existe"
      );

      setTimeout(() => {

        setMensaje("");

      }, 3000);

      return;
    }

    const nuevas = [

      ...maquinas,

      {
        vlt: "",
        comentario: "",
        antes: null,
        despues: null,
      },

    ];

    setMaquinas(nuevas);

    setMaquinaActiva(
      nuevas.length - 1
    );
  };

  // 🔥 ELIMINAR
  const eliminarMaquina =
    (index) => {

      if (
        maquinas.length === 1
      ) {

        setMensaje(
          "⚠️ Debe existir al menos una máquina"
        );

        return;
      }

      const nuevas =
        maquinas.filter(
          (_, i) =>
            i !== index
        );

      setMaquinas(nuevas);

      setMaquinaActiva(0);
    };

  // 🔥 LIMPIAR
  const limpiarFormulario =
    () => {

      localStorage.removeItem(
        "mantenimiento_temp"
      );

      setSitio("");

      setMaquinas([
        {
          vlt: "",
          comentario: "",
          antes: null,
          despues: null,
        },
      ]);

      setMaquinaActiva(0);

      setMensaje(
        "🧹 Formulario limpiado"
      );

      setTimeout(() => {

        setMensaje("");

      }, 3000);
    };

  // 🔥 BASE64
  const convertirBase64 =
    (file) => {

      return new Promise(
        (resolve) => {

          const reader =
            new FileReader();

          reader.readAsDataURL(
            file
          );

          reader.onload = (
            event
          ) => {

            const img =
              new Image();

            img.src =
              event.target.result;

            img.onload =
              () => {

                const canvas =
                  document.createElement(
                    "canvas"
                  );

                const MAX_WIDTH =
                  150;

                const scale =
                  MAX_WIDTH /
                  img.width;

                canvas.width =
                  MAX_WIDTH;

                canvas.height =
                  img.height *
                  scale;

                const ctx =
                  canvas.getContext(
                    "2d"
                  );

                ctx.drawImage(
                  img,
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );

                const compressed =
                  canvas.toDataURL(
                    "image/jpeg",
                    0.4
                  );

                resolve(
                  compressed
                );
              };
          };
        }
      );
    };

  // 🔥 GUARDAR
  const guardarFormulario =
    async () => {

      if (!sitio) {

        setMensaje(
          "⚠️ Ingresa sitio"
        );

        return;
      }

      try {

        const mantenimiento = {

          sitio,

          tecnico:
            supervisor,

          fecha:
            fechaActual,

          hora:
            horaActual,

          maquinas,

          totalMaquinas:
            maquinas.length,

          timestamp:
            new Date(),
        };

        const guardado =
          await guardarMantenimientoDB(
            mantenimiento
          );

        if (guardado) {

          setMensaje(
            "✅ Mantenimiento guardado"
          );

          limpiarFormulario();

        } else {

          setMensaje(
            "❌ Error al guardar"
          );
        }

      } catch (error) {

        console.log(error);

        setMensaje(
          "❌ Error del sistema"
        );
      }
    };

  return (

    <div style={theme.layout.page}>

      <div style={theme.layout.content}>

        <div
          style={theme.card}
          className="border border-gray-200"
        >

          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

            <div>

              <h1 className="text-5xl font-black text-cyan-700">

                🔧 Mantenimiento

              </h1>

              <p className="text-gray-500 text-xl font-bold mt-4">

                Registro técnico de mantenimientos

              </p>

            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-3xl p-6">

              <p className="font-bold text-gray-500">

                Técnico

              </p>

              <p className="text-2xl font-black text-cyan-700">

                {supervisor}

              </p>

            </div>

          </div>

          {/* MENSAJE */}
          {mensaje && (

            <div
              style={
                mensaje.includes("✅")
                  ? theme.message.success
                  : theme.message.warning
              }
            >

              {mensaje}

            </div>

          )}

          {/* DATOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">

            <div>

              <label className="font-bold text-gray-600">

                Sitio

              </label>

              <input
                type="text"
                value={sitio}
                onChange={(e) =>
                  setSitio(
                    e.target.value
                  )
                }
                style={theme.input}
              />

            </div>

            <div>

              <label className="font-bold text-gray-600">

                Fecha

              </label>

              <input
                type="text"
                value={
                  fechaActual
                }
                readOnly
                style={theme.input}
              />

            </div>

            <div>

              <label className="font-bold text-gray-600">

                Hora

              </label>

              <input
                type="text"
                value={
                  horaActual
                }
                readOnly
                style={theme.input}
              />

            </div>

          </div>

          {/* FORMULARIO */}
          <div className="bg-slate-50 border border-gray-200 rounded-3xl p-6">

            <h2 className="text-3xl font-black text-slate-700 mb-6">

              🎰 Máquina #{maquinaActiva + 1}

            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div>

                <label className="font-bold text-gray-600">

                  VLT

                </label>

                <input
                  type="text"
                  value={
                    maquina.vlt
                  }
                  onChange={(e) =>
                    actualizarMaquina(
                      "vlt",
                      e.target.value
                    )
                  }
                  style={
                    theme.input
                  }
                />

              </div>

              <div>

                <label className="font-bold text-gray-600">

                  Comentario

                </label>

                <input
                  type="text"
                  value={
                    maquina.comentario
                  }
                  onChange={(e) =>
                    actualizarMaquina(
                      "comentario",
                      e.target.value
                    )
                  }
                  style={
                    theme.input
                  }
                />

              </div>

            </div>

            {/* IMAGENES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

              <div>

                <label className="font-bold text-gray-600">

                  📸 Foto Antes

                </label>

                <input
                  type="file"
                  accept="image/*"
                  style={theme.input}
                  onChange={(e) => {

                    const file =
                      e.target.files[0];

                    if (!file)
                      return;

                    convertirBase64(file)
                      .then(
                        (
                          base64
                        ) => {

                          actualizarMaquina(
                            "antes",
                            base64
                          );
                        }
                      );
                  }}
                />

                {maquina.antes && (

                  <img
                    src={
                      maquina.antes
                    }
                    alt="Antes"
                    className="mt-4 rounded-2xl border border-gray-200 max-h-[250px] w-full object-cover"
                  />

                )}

              </div>

              <div>

                <label className="font-bold text-gray-600">

                  📸 Foto Después

                </label>

                <input
                  type="file"
                  accept="image/*"
                  style={theme.input}
                  onChange={(e) => {

                    const file =
                      e.target.files[0];

                    if (!file)
                      return;

                    convertirBase64(file)
                      .then(
                        (
                          base64
                        ) => {

                          actualizarMaquina(
                            "despues",
                            base64
                          );
                        }
                      );
                  }}
                />

                {maquina.despues && (

                  <img
                    src={
                      maquina.despues
                    }
                    alt="Después"
                    className="mt-4 rounded-2xl border border-gray-200 max-h-[250px] w-full object-cover"
                  />

                )}

              </div>

            </div>

          </div>

          {/* SELECTOR HORIZONTAL */}
          <div className="overflow-x-auto mt-10 mb-10">

            <div className="flex gap-4 pb-4 min-w-max">

              {maquinas.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={index}
                    className="relative"
                  >

                    <button
                      onClick={() =>
                        setMaquinaActiva(
                          index
                        )
                      }
                      className={`px-6 py-4 rounded-2xl font-black border transition-all duration-300 shadow-lg min-w-[180px] ${
                        maquinaActiva ===
                        index
                          ? "bg-cyan-600 text-white border-cyan-600 scale-105"
                          : "bg-white text-slate-700 border-gray-200"
                      }`}
                    >

                      🎰

                      <div className="mt-2">

                        {item.vlt ||
                          `Máquina ${index + 1}`}

                      </div>

                    </button>

                    {/* ELIMINAR */}
                    <button
                      onClick={() =>
                        eliminarMaquina(
                          index
                        )
                      }
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 font-black shadow-lg"
                    >

                      ✕

                    </button>

                  </div>

                )
              )}

            </div>

          </div>

          {/* BOTONES */}
          <div className="flex flex-wrap gap-5">

            <button
              onClick={
                agregarMaquina
              }
              style={
                theme.button.primary
              }
            >

              ➕ Agregar Máquina

            </button>

            <button
              onClick={
                guardarFormulario
              }
              style={
                theme.button.success
              }
            >

              💾 Guardar

            </button>

            <button
              style={
                theme.button.danger
              }
            >

              📄 PDF

            </button>

            <button
              onClick={
                limpiarFormulario
              }
              style={
                theme.button.danger
              }
            >

              🧹 Limpiar

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}