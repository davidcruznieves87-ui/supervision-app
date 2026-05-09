import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
deleteDoc,
doc,
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  signOut,
} from "firebase/auth"; 
import { db, auth } from "./firebase";
import ExecutiveDashboard from "./ExecutiveDashboard";
import Dashboard from "./Dashboard";
import Historial from "./Historial";
import logo from "./logo.png";
import {
  onAuthStateChanged,
} from "firebase/auth";
function App() {

  const [sitio, setSitio] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [esSuperSupervisor, setEsSuperSupervisor] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);  
  const fecha = new Date();

  const fechaHora = fecha.toLocaleString();

  const año = fecha.getFullYear();

  const consecutivo = Date.now().toString().slice(-6);

  const folio = `SUP-${año}-${consecutivo}`;

  const [falla, setFalla] = useState("");
  const [vlt, setVlt] = useState("");
  const [urgencia, setUrgencia] = useState("Baja");

  const [imagen, setImagen] = useState(null);

  const [fallas, setFallas] = useState([]);

  const [mensaje, setMensaje] = useState("");

  const [supervisiones, setSupervisiones] = useState([]);

  // 🔥 ONLINE / OFFLINE
  const [online, setOnline] = useState(navigator.onLine);

  const datosRestaurados = useRef(false);

  // 🔥 SOLO MES ACTUAL
  const supervisionesMesActual = supervisiones.filter((s) => {

  if (!s.fechaHora) return false;

  const hoy = new Date();

  const texto = s.fechaHora.toLowerCase();

  const mesActual = hoy.getMonth() + 1;
  const añoActual = hoy.getFullYear();

  // 🔥 ADMIN VE TODO
  if (esAdmin) {

    return (
      texto.includes(`/${mesActual}/`) &&
      texto.includes(añoActual.toString())
    );
  }

  // 🔥 SUPERVISOR SOLO VE LO SUYO
  const mismoSupervisor =
    s.supervisor === supervisor;

  return (
    texto.includes(`/${mesActual}/`) &&
    texto.includes(añoActual.toString()) &&
    mismoSupervisor
  );
});

  // 🔥 CARGAR + RECUPERAR BORRADOR
  useEffect(() => {

    cargarSupervisiones();

    const borrador = localStorage.getItem("supervision_borrador");

    if (borrador) {

      try {

        const datos = JSON.parse(borrador);

        setSitio(datos.sitio || "");
        setTecnico(datos.tecnico || "");
        setFallas(datos.fallas || []);

        datosRestaurados.current = true;

        setMensaje("♻️ Se recuperó un borrador automáticamente");

        setTimeout(() => {
          setMensaje("");
        }, 4000);

      } catch (error) {
        console.log(error);
      }
    }

  }, []);

  // 🔥 AUTOGUARDADO
  useEffect(() => {

    if (
      !sitio &&
      !tecnico &&
      fallas.length === 0
    ) {
      return;
    }

    const borrador = {
      sitio,
      tecnico,
      fallas,
    };

    localStorage.setItem(
      "supervision_borrador",
      JSON.stringify(borrador)
    );

  }, [sitio, tecnico, fallas]);

  // 🔥 DETECTAR INTERNET + SINCRONIZAR
  useEffect(() => {

    const actualizarEstado = async () => {

      setOnline(navigator.onLine);

      // 🔥 SI VOLVIÓ INTERNET
      if (navigator.onLine) {

        const pendientes = JSON.parse(
          localStorage.getItem("supervisiones_pendientes") || "[]"
        );

        if (pendientes.length > 0) {

          try {

            for (const supervision of pendientes) {

              await addDoc(
                collection(db, "supervisiones"),
                supervision
              );
            }

            localStorage.removeItem("supervisiones_pendientes");

            cargarSupervisiones();

            setMensaje(
              `☁️ ${pendientes.length} supervisión(es) sincronizada(s)`
            );

            setTimeout(() => {
              setMensaje("");
            }, 4000);

          } catch (error) {
            console.log(error);
          }
        }
      }
    };

    window.addEventListener("online", actualizarEstado);
    window.addEventListener("offline", actualizarEstado);

    return () => {
      window.removeEventListener("online", actualizarEstado);
      window.removeEventListener("offline", actualizarEstado);
    };

  }, []);
// 🔥 OBTENER SUPERVISOR LOGUEADO
// 🔥 SUPERVISOR LOGUEADO
// 🔥 SUPERVISOR LOGUEADO
useEffect(() => {

  const unsubscribe =
    onAuthStateChanged(auth, (user) => {

      if (user) {

        setSupervisor(user.email);

        // 🔥 ADMIN
        if (
          user.email === "admin@casino.com"
        ) {

          setEsAdmin(true);

        } else {

          setEsAdmin(false);
        }

        // 🔥 SUPER SUPERVISORES
        const superUsuarios = [

          "gerencia@casino.com",

          "acruz@fbmgaming.com.mx",

          "vgarciapina@fbmgaming.com.mx",
        ];

        if (
          superUsuarios.includes(user.email)
        ) {

          setEsSuperSupervisor(true);

        } else {

          setEsSuperSupervisor(false);
        }

      }
    });

  return () => unsubscribe();

}, []);

  const cargarSupervisiones = async () => {

  try {

    const querySnapshot = await getDocs(
      collection(db, "supervisiones")
    );

    const datos = [];

    querySnapshot.forEach((d) => {

      datos.push({
        id: d.id,
        ...d.data(),
      });

    });

    setSupervisiones(datos);

  } catch (error) {

    console.log(error);

  }
};

  // 🔥 ELIMINAR SUPERVISIÓN
const eliminarSupervision = async (id) => {

  const confirmar = window.confirm(
    "¿Deseas eliminar esta supervisión?"
  );

  if (!confirmar) return;

  try {

    await deleteDoc(
      doc(db, "supervisiones", id)
    );

    setMensaje("🗑️ Supervisión eliminada");

    cargarSupervisiones();

    setTimeout(() => {
      setMensaje("");
    }, 3000);

  } catch (error) {

    console.log(error);

    setMensaje("❌ Error al eliminar");
  }
};
  // 🔥 RECUPERAR SUPERVISION
  const recuperarSupervision = (supervision) => {

    const fallasRecuperadas = (supervision.fallas || []).map((f) => ({

      vlt:
        f.vlt ||
        "",

      descripcion:
        f.descripcion ||
        f.falla ||
        f.nombre ||
        "",

      urgencia:
        f.urgencia ||
        "Baja",

      imagen:
        f.imagen ||
        f.image ||
        f.foto ||
        null,
    }));

    setSitio(supervision.sitio || "");
    setTecnico(supervision.tecnico || "");

    setFallas(fallasRecuperadas);

    setFalla("");
    setVlt("");
    setUrgencia("Baja");
    setImagen(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setMensaje("♻️ Supervisión recuperada correctamente");

    setTimeout(() => {
      setMensaje("");
    }, 3000);
  };

  // 🔥 COMPRESIÓN DE IMAGEN
  const comprimirImagen = (file) => {

    return new Promise((resolve) => {

      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = (event) => {

        const img = new Image();

        img.src = event.target.result;

        img.onload = () => {

          const canvas = document.createElement("canvas");

          const MAX_WIDTH = 150;

          const scaleSize = MAX_WIDTH / img.width;

          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");

          ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const compressedBase64 = canvas.toDataURL(
            "image/jpeg",
            0.6
          );

          resolve(compressedBase64);
        };
      };
    });
  };

  // 🔥 AGREGAR FALLA
  const agregarFalla = async () => {

    if (!falla) return;

    let imagenComprimida = null;

    if (imagen) {
      imagenComprimida = await comprimirImagen(imagen);
    }

    const nuevaFalla = {
      vlt,
      descripcion: falla,
      urgencia,
      imagen: imagenComprimida,
    };

    setFallas([...fallas, nuevaFalla]);

    setFalla("");
    setVlt("");
    setUrgencia("Baja");
    setImagen(null);
  };

  // 🔥 GUARDAR
  const guardarSupervision = async () => {

    if (!sitio || !tecnico || fallas.length === 0) {

      setMensaje("⚠️ Completa todos los campos");

      return;
    }

   const supervision = {
  folio,
  supervisor,
  sitio,
  tecnico,
  fechaHora: new Date().toLocaleString(),
  fallas,
};

    try {

      // 🔥 SI HAY INTERNET
      if (online) {

        await addDoc(
          collection(db, "supervisiones"),
          supervision
        );

        setMensaje("✅ Supervisión guardada correctamente");

        cargarSupervisiones();

      } else {

        // 🔥 GUARDAR LOCALMENTE
        const pendientes = JSON.parse(
          localStorage.getItem("supervisiones_pendientes") || "[]"
        );

        pendientes.push(supervision);

        localStorage.setItem(
          "supervisiones_pendientes",
          JSON.stringify(pendientes)
        );

        setMensaje(
          "📴 Supervisión guardada offline • Se sincronizará automáticamente"
        );
      }

      setSitio("");
      setTecnico("");
      setFallas([]);

      // 🔥 BORRAR BORRADOR
      localStorage.removeItem("supervision_borrador");

      setTimeout(() => {
        setMensaje("");
      }, 4000);

    } catch (error) {

      console.log(error);

      setMensaje("❌ Error al guardar");
    }
  };

  // 🔥 PDF
  const descargarPDF = () => {

    const doc = new jsPDF();

    // 🔥 HEADER
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 0, 220, 40, "F");

    doc.addImage(logo, "PNG", 15, 5, 28, 28);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");

    doc.text(
      "Supervision de Salas Tijuana",
      105,
      18,
      null,
      null,
      "center"
    );

    doc.setFontSize(12);

    doc.text(
      "Supervisor David Cruz Nieves",
      105,
      28,
      null,
      null,
      "center"
    );

    // 🔥 INFORMACIÓN GENERAL
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    doc.text("Información", 14, 55);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text(`Folio: ${folio}`, 14, 65);

    doc.text(`Sitio: ${sitio}`, 14, 73);

    doc.text(`Técnico: ${tecnico}`, 14, 81);

    doc.text(
      `Fecha: ${new Date().toLocaleString()}`,
      14,
      89
    );

    // 🔥 RESUMEN
    const totalFallas = fallas.length;

    const criticas = fallas.filter(
      (f) => f.urgencia === "Crítica"
    ).length;

    const altas = fallas.filter(
      (f) => f.urgencia === "Alta"
    ).length;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    doc.text("Resumen de Fallas", 14, 105);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text(
      `Total de fallas detectadas: ${totalFallas}`,
      14,
      115
    );

    doc.text(
      `Fallas críticas: ${criticas}`,
      14,
      123
    );

    doc.text(
      `Fallas altas: ${altas}`,
      14,
      131
    );

    let conclusion = "Operación estable.";

    if (criticas >= 1) {
      conclusion =
        "Se detectaron fallas críticas que requieren atención inmediata.";
    } else if (altas >= 2) {
      conclusion =
        "Se detectaron incidencias de prioridad alta.";
    }

    doc.setFont("helvetica", "bold");

    doc.text("Conclusión:", 14, 145);

    doc.setFont("helvetica", "normal");

    doc.text(conclusion, 14, 153);

    // 🔥 TABLA
    const body = fallas.map((f, index) => [
      index + 1,
      `VLT: ${f.vlt || "N/A"} - ${f.descripcion}`,
      f.urgencia,
    ]);

    autoTable(doc, {
      startY: 165,

      head: [["#", "Falla Detectada", "Urgencia"]],

      body,

      styles: {
        fontSize: 11,
        cellPadding: 4,
      },

      headStyles: {
        fillColor: [6, 182, 212],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    });

    // 🔥 IMÁGENES
    let y = doc.lastAutoTable.finalY + 15;

    fallas.forEach((f, index) => {

      if (f.imagen) {

        if (y > 220) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");

        doc.text(
          `Evidencia Fotográfica ${index + 1}`,
          14,
          y
        );

        doc.addImage(
          f.imagen,
          "JPEG",
          14,
          y + 5,
          90,
          70
        );

        y += 85;
      }
    });

    // 🔥 FIRMA
    if (y > 240) {
      doc.addPage();
      y = 40;
    }

    doc.line(20, y + 25, 90, y + 25);

    doc.text("Supervisor Responsable", 30, y + 35);

    // 🔥 FOOTER
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {

      doc.setPage(i);

      doc.setFontSize(10);

      doc.text(
        `Página ${i} de ${totalPages}`,
        170,
        290
      );
    }

    doc.save(`${folio}.pdf`);
  };

  return (

    <div className="min-h-screen bg-gray-100 p-3">

      <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-6 max-w-6xl mx-auto border border-gray-200">

        {/* 🔥 ESTADO INTERNET */}
        <div
          className={`mb-6 p-4 rounded-2xl text-center font-black text-lg shadow-lg ${
            online
              ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {online
            ? "🟢 Conectado a internet"
            : "🔴 Sin conexión • Trabajando en modo offline"}
        </div>

        {/* LOGO */}
        <div className="flex justify-center mb-5">

          <img
            src={logo}
            alt="logo"
            className="w-32 md:w-40 rounded-full shadow-xl"
          />

        </div>
<div className="flex justify-end mb-4">

 <button
  onClick={() => signOut(auth)}
  className="bg-red-500 hover:bg-red-400 text-white px-5 py-3 rounded-2xl font-black shadow-lg"
>
  🚪 Cerrar sesión
</button>

</div>
        {/* TITULO */}
        <h1 className="text-4xl md:text-6xl font-black text-center mb-3 text-slate-800 leading-tight">
          Sistema de Supervisión
        </h1>

        {/* SUBTITULO */}
     <p className="text-center text-gray-600 text-lg md:text-2xl mb-8 tracking-wide">

         Equipo Técnico de

        <span className="font-black text-cyan-700 ml-2">
         {supervisor.split("@")[0]}
          </span>

</p>

        {/* MENSAJE */}
{mensaje && !esSuperSupervisor && (

  <div className="bg-cyan-100 border border-cyan-400 text-cyan-800 p-4 rounded-2xl text-center mb-6 font-bold text-lg">
    {mensaje}
  </div>

)}
{!esSuperSupervisor && (
  <>
        {/* FORMULARIO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          <input
            type="text"
            placeholder="📍 Sitio"
            value={sitio}
            onChange={(e) => setSitio(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 placeholder-gray-400 rounded-2xl p-5 text-xl outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
          />

          <input
            type="text"
            placeholder="👨‍🔧 Técnico"
            value={tecnico}
            onChange={(e) => setTecnico(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 placeholder-gray-400 rounded-2xl p-5 text-xl outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
          />

          <input
            type="text"
            value={new Date().toLocaleString()}
            disabled
            className="bg-gray-100 border border-gray-300 text-gray-700 rounded-2xl p-5 text-xl"
          />

        </div>

        {/* FALLAS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-6">

          <input
            type="text"
            placeholder="🎰 VLT"
            value={vlt}
            onChange={(e) => setVlt(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 placeholder-gray-400 rounded-2xl p-5 text-xl outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
          />

          <input
            type="text"
            placeholder="⚠️ Descripción de falla"
            value={falla}
            onChange={(e) => setFalla(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 placeholder-gray-400 rounded-2xl p-5 text-xl outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
          />

          <select
            value={urgencia}
            onChange={(e) => setUrgencia(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 rounded-2xl p-5 text-xl"
          >

            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
            <option>Crítica</option>

          </select>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setImagen(e.target.files[0])}
            className="bg-white border border-gray-300 text-gray-700 rounded-2xl p-5 text-lg"
          />

          <button
            onClick={agregarFalla}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xl px-6 py-5 rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            ➕ Agregar Falla
          </button>

        </div>

        {/* LISTA FALLAS */}
        <div className="space-y-5 mb-8">

          {fallas.map((f, index) => (

            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow"
            >

              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5">

                <div>

                  <p className="font-black text-cyan-700 text-xl mb-2">
                    🎰 VLT: {f.vlt || "N/A"}
                  </p>

                  <p className="font-black text-slate-800 text-2xl">
                    {f.descripcion}
                  </p>

                  <p className="text-lg text-gray-600 mt-2">
                    Urgencia: {f.urgencia}
                  </p>

                </div>

                <button
                  onClick={() => {

                    const nuevas = [...fallas];

                    nuevas.splice(index, 1);

                    setFallas(nuevas);
                  }}
                  className="bg-red-500 hover:bg-red-400 text-white px-6 py-4 rounded-2xl font-black text-lg"
                >
                  Eliminar
                </button>

              </div>

              {f.imagen && (

                <img
                  src={f.imagen}
                  alt="falla"
                  className="mt-5 rounded-2xl w-full max-w-sm border border-gray-300"
                />
              )}

            </div>
          ))}

        </div>

        {/* BOTONES */}
        <div className="flex flex-col md:flex-row justify-center gap-5 mb-8">

          <button
            onClick={guardarSupervision}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xl px-8 py-5 rounded-2xl shadow-xl active:scale-95 transition-all w-full md:w-auto"
          >
            💾 Guardar Supervisión
          </button>

          <button
            onClick={descargarPDF}
            className="bg-slate-800 hover:bg-slate-700 text-white font-black text-xl px-8 py-5 rounded-2xl shadow-xl active:scale-95 transition-all w-full md:w-auto"
          >
            📄 Descargar PDF
          </button>

          <button
            onClick={() => {

              localStorage.removeItem("supervision_borrador");

              setSitio("");
              setTecnico("");
              setFallas([]);

              setMensaje("🗑️ Borrador eliminado");

              setTimeout(() => {
                setMensaje("");
              }, 3000);
            }}
            className="bg-red-500 hover:bg-red-400 text-white font-black text-xl px-8 py-5 rounded-2xl shadow-xl active:scale-95 transition-all w-full md:w-auto"
          >
            🗑️ Limpiar
          </button>

        </div>

        {/* DASHBOARD */}
        </>
        )}
        {/* 👑 SUPER SUPERVISOR */}

{esSuperSupervisor ? (

  <ExecutiveDashboard
    supervisiones={supervisiones}
  />

) : (

  <>

    {/* DASHBOARD */}
    <Dashboard
      supervisiones={supervisionesMesActual}
    />

    {/* HISTORIAL */}
    <Historial
      supervisiones={supervisionesMesActual}
      recuperarSupervision={recuperarSupervision}
      eliminarSupervision={eliminarSupervision}
    />

  </>

)}

        {/* HISTORIAL */}
      <Historial
  supervisiones={supervisionesMesActual}
  recuperarSupervision={recuperarSupervision}
  eliminarSupervision={eliminarSupervision}
/>

      </div>

      {/* BOTÓN FLOTANTE */}
      <button
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          })
        }
        className="fixed bottom-6 right-6 bg-cyan-500 text-black w-16 h-16 rounded-full shadow-2xl text-3xl font-black z-50"
      >
        ⬆
      </button>

    </div>
  );
}

export default App;