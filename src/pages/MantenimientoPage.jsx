
import {
  useState,
  useEffect,
  useRef,
} from "react";

import jsPDF from "jspdf";

import theme from "../styles/theme";

import {
  subirImagenOptimizada,
} from "../services/imagenesService";

import {
  guardarMantenimiento as guardarMantenimientoDB,
} from "../services/mantenimientosService";

import useAuth from "../hooks/useAuth";

const convertirPreview =
  (file) =>
    new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader();

        reader.onload = () => {

          resolve(
            reader.result
          );

        };

        reader.onerror =
          reject;

        reader.readAsDataURL(
          file
        );

      }
    );

export default function MantenimientoPage() {

  const { usuario } =
  useAuth();

const supervisor =
  usuario?.nombre || "";

  const pdfRef =
    useRef();

  const fecha =
    new Date();

  const fechaActual =
    fecha.toLocaleDateString();

  const horaActual =
    fecha.toLocaleTimeString();

      const [
  restaurandoDraft,
  setRestaurandoDraft,
] = useState(true);

useEffect(() => {

  setTimeout(() => {

    setRestaurandoDraft(
      false
    );

  }, 100);

}, []);

  // 🔥 LOCAL STORAGE
 const cargarDraft = () => {

  try {

    const data =
      localStorage.getItem(
        "mantenimiento_temp"
      );

    return data
      ? JSON.parse(data)
      : null;

  } catch (error) {

    console.log(
      "Error cargando draft:",
      error
    );

    return null;
  }

};

const datosGuardados =
  cargarDraft();

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

    antes: {
      file: null,
      preview: "",
    },

    despues: {
      file: null,
      preview: "",
    },
  },
]
  );

  const [
    maquinaActiva,
    setMaquinaActiva,
  ] = useState(0);

  const [mensaje, setMensaje] =
    useState("");
  

  // 🔥 LOCAL STORAGE
  useEffect(() => {

  if (
    restaurandoDraft
  ) return;

  try {

    localStorage.setItem(

      "mantenimiento_temp",

      JSON.stringify({
        sitio,
        maquinas,
      })

    );

    console.log(
      "💾 MTTO GUARDADO"
    );

  } catch (error) {

    console.log(
      "Error guardando MTTO:",
      error
    );
  }

}, [
  restaurandoDraft,
  sitio,
  maquinas,
]);

  // 🔥 MAQUINA ACTIVA
  const maquina =
    maquinas[
      maquinaActiva
    ];

  // 🔥 ACTUALIZAR
  const actualizarMaquina = (
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
  const agregarMaquina = () => {

    const actual =
      maquinas[
        maquinaActiva
      ];

    if (
      !actual.vlt.trim()
    ) {

      setMensaje(
        "⚠️ Ingresa VLT"
      );

      return;
    }

    const nuevas = [
      ...maquinas,
      {
  vlt: "",
  comentario: "",

  antes: {
    file: null,
    preview: "",
    url: "",
  },

  despues: {
    file: null,
    preview: "",
    url: "",
  },
}
    ];

    setMaquinas(nuevas);

    setMaquinaActiva(
      nuevas.length - 1
    );
  };

  // 🔥 ELIMINAR
  const eliminarMaquina = (
    index
  ) => {

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
  const limpiarFormulario = () => {

    localStorage.removeItem(
      "mantenimiento_temp"
    );

    setSitio("");

    setMaquinas([
  {
    vlt: "",
    comentario: "",

    antes: {
      file: null,
      preview: "",
      url: "",
    },

    despues: {
      file: null,
      preview: "",
      url: "",
    },
  },
]);

    setMaquinaActiva(0);

    setMensaje(
      "🧹 Formulario limpiado"
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

          maquinas: maquinas.map(
  (maquina) => ({

    vlt:
      maquina.vlt || "",

    comentario:
      maquina.comentario || "",

    antes:
      maquina.antes?.url || "",

    despues:
      maquina.despues?.url || "",

  })
),

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

  // 🔥 PDF
  const generarPDF =
    async () => {

      const pdf =
        new jsPDF(
          "p",
          "mm",
          "a4"
        );

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      let y = 20;

      // 🔥 HEADER
      pdf.setFillColor(
        8,
        145,
        178
      );

      pdf.rect(
        0,
        0,
        pageWidth,
        28,
        "F"
      );

      pdf.setTextColor(
        255,
        255,
        255
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(22);

      pdf.text(
        "REPORTE DE MANTENIMIENTO",
        14,
        18
      );

      y = 40;

      // 🔥 INFO
      pdf.setTextColor(
        0,
        0,
        0
      );

      pdf.setFontSize(12);

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.text(
        `Sitio: ${sitio}`,
        15,
        y
      );

      y += 8;

      pdf.text(
        `Tecnico: ${supervisor}`,
        15,
        y
      );

      y += 8;

      pdf.text(
        `Fecha: ${fechaActual}`,
        15,
        y
      );

      y += 8;

      pdf.text(
        `Hora: ${horaActual}`,
        15,
        y
      );

      y += 15;

      // 🔥 MAQUINAS
      for (
        let i = 0;
        i < maquinas.length;
        i++
      ) {

        const maquina =
          maquinas[i];

        if (y > 180) {

          pdf.addPage();

          y = 20;
        }

        // 🔥 CARD
        pdf.setFillColor(
          245,
          245,
          245
        );

        pdf.roundedRect(
          10,
          y,
          190,
          95,
          4,
          4,
          "F"
        );

        // 🔥 TITULO
        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(16);

        pdf.text(
          `MAQUINA #${i + 1}`,
          15,
          y + 10
        );

        // 🔥 DATOS
        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(11);

        pdf.text(
          `VLT: ${maquina.vlt}`,
          15,
          y + 22
        );

        pdf.text(
          `Comentario: ${maquina.comentario}`,
          15,
          y + 32
        );

        // 🔥 IMAGENES
        if (
          maquina.antes?.preview
        ) {

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.text(
            "ANTES",
            15,
            y + 45
          );

          const imagenAntes =

  maquina.antes?.preview ||

  maquina.antes?.url;

if (imagenAntes) {

  pdf.addImage(
    imagenAntes,
    "JPEG",
    15,
    y + 50,
    75,
    40
  );

}
        }

        if (
          maquina.despues?.preview
        ) {

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.text(
            "DESPUES",
            110,
            y + 45
          );

          const imagenDespues =

  maquina.despues?.preview ||

  maquina.despues?.url;

if (imagenDespues) {

  pdf.addImage(
    imagenDespues,
    "JPEG",
    110,
    y + 50,
    75,
    40
  );

}
        }

        y += 110;
      }

      // 🔥 FOOTER
      pdf.setFontSize(10);

      pdf.setTextColor(120);

      pdf.text(
        "Sistema Enterprise de Supervisión y Mantenimiento",
        14,
        290
      );

      pdf.save(
        `Mantenimiento_${sitio}.pdf`
      );
    };

  return (

    <div style={theme.layout.page}>

      <div style={theme.layout.content}>

        <div
          ref={pdfRef}
          style={theme.card}
        >

          {/* HEADER */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-10">

            <div>

              <h1 className="text-5xl font-black text-cyan-700">

                🔧 Mantenimiento

              </h1>

              <p className="text-gray-500 text-xl font-bold mt-3">

                Registro técnico de mantenimientos

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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">

            <div>

              <label className="font-bold text-gray-600">

                📍 Sitio

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

          </div>

          {/* CARD MAQUINA */}
          <div className="bg-slate-50 border border-gray-200 rounded-3xl p-8">

            <div className="flex items-center justify-between mb-8">

              <h2 className="text-3xl font-black text-slate-700">

                🎰 Máquina #{maquinaActiva + 1}

              </h2>

            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

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
                  style={theme.input}
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
                  style={theme.input}
                />

              </div>

            </div>

            {/* FOTOS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">

              {/* ANTES */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6">

                <h3 className="text-2xl font-black text-slate-700 mb-5">

                  📸 Foto Antes

                </h3>

                <input
                  type="file"
                  accept="image/*"
                  style={theme.input}
                  onChange={async (e) => {

                    const file =
                      e.target.files[0];
if (!file) return;

const preview =
  await convertirPreview(
    file
  );
                    if (!file)
                      return;

                    try {

                      const url =
                        await subirImagenOptimizada(
                          file,
                          "mantenimientos"
                        );

                      const readerAntes =
                        new FileReader();

                      readerAntes.onloadend =
                        () => {

                          setMaquinas(
                            (prev) => {

                              const nuevas =
                                [...prev];

                              nuevas[
                                maquinaActiva
                              ].antes = {

                                url,

                                preview:
                                  readerAntes.result,
                              };

                              return nuevas;
                            }
                          );
                        };

                      readerAntes.readAsDataURL(
                        file,preview
                      );

                    } catch (error) {

                      console.log(error);

                    }

                  }}
                />

                {maquina.antes && (

                  <img
                    src={
                      maquina.antes?.url
                    }
                    alt="Antes"
                    className="mt-5 rounded-3xl border border-gray-200 w-full max-h-[350px] object-cover"
                  />

                )}

              </div>

              {/* DESPUES */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6">

                <h3 className="text-2xl font-black text-slate-700 mb-5">

                  📸 Foto Después

                </h3>

                <input
                  type="file"
                  accept="image/*"
                  style={theme.input}
                  onChange={async (e) => {

                    const file =
                      e.target.files[0];

                      if (!file) return;

const preview =
  await convertirPreview(
    file
  );
                    if (!file)
                      return;

                    try {

                      const url =
                        await subirImagenOptimizada(
                          file,
                          "mantenimientos"
                        );

                      const readerDespues =
                        new FileReader();

                      readerDespues.onloadend =
                        () => {

                          setMaquinas(
                            (prev) => {

                              const nuevas =
                                [...prev];

                              nuevas[
                                maquinaActiva
                              ].despues = {

                                url,

                                preview:
                                  readerDespues.result,
                              };

                              return nuevas;
                            }
                          );
                        };

                      readerDespues.readAsDataURL(
                        file, preview,
                      );

                    } catch (error) {

                      console.log(error);

                    }

                  }}
                />

                {maquina.despues && (

                  <img
                    src={
                      maquina.despues?.url
                    }
                    alt="Después"
                    className="mt-5 rounded-3xl border border-gray-200 w-full max-h-[350px] object-cover"
                  />

                )}

              </div>

            </div>

          </div>

          {/* TABS */}
          <div className="overflow-x-auto mt-10">

            <div className="flex gap-5 pb-5 min-w-max">

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
                      className={`px-8 py-5 rounded-3xl font-black border transition-all duration-300 shadow-lg min-w-[220px] ${
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

                    <button
                      onClick={() =>
                        eliminarMaquina(
                          index
                        )
                      }
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-10 h-10 font-black shadow-lg"
                    >

                      ✕

                    </button>

                  </div>

                )
              )}

            </div>

          </div>

          {/* BOTONES */}
          <div className="flex flex-wrap gap-5 mt-10">

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
              onClick={
                generarPDF
              }
              style={
                theme.button.primary
              }
            >

              📄 Descargar PDF

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