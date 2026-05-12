import { useEffect, useRef, useState } from "react";
import {  obtenerSupervisiones,  guardarSupervisionDB,  eliminarSupervisionDB,} from "./services/supervisionesService";import {  collection,  getDocs,  query,  where,} from "firebase/firestore";
import {  obtenerTecnicos,} from "./services/tecnicosService";
import {  obtenerSitios,} from "./services/sitiosService";
import useAutoguardado from "./hooks/useAutoguardado";
import useOfflineSync from "./hooks/useOfflineSync";
import useAuth from "./hooks/useAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {  signOut,} from "firebase/auth"; 
import { db, auth } from "./firebase";
import {  useSupervision, } from "./context/SupervisionContext";
import {  generarPDFSupervision,} from "./utils/pdfGenerator";
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import GestionTecnicos from "./components/GestionTecnicos";
import GestionSitios from "./components/GestionSitios";
import Dashboard from "./components/Dashboard";
import SupervisionForm from "./components/SupervisionForm";
import DashboardSection from "./components/DashboardSection";
import Header from "./components/Header";
import Historial from "./components/Historial";
import logo from "./logo.png";

function App() {
  const {  sitio,  setSitio,  tecnico,  setTecnico,  fallas,  setFallas,  mensaje,  setMensaje,} = useSupervision();
 const {    supervisor,    esAdmin,    esSuperSupervisor,  } = useAuth();
  const [tecnicos, setTecnicos] =   useState([]);
  const [sitios, setSitios] = useState([]);
  const [   sitiosFiltrados,  setSitiosFiltrados ] = useState([]);
  const fecha = new Date();
  const fechaHora = fecha.toLocaleString();
  const año = fecha.getFullYear();
  const consecutivo = Date.now().toString().slice(-6);
  const folio = `SUP-${año}-${consecutivo}`;
  const [falla, setFalla] = useState("");
  const [vlt, setVlt] = useState("");
  const [urgencia, setUrgencia] = useState("Baja");
  const [imagen, setImagen] = useState(null);
  const [mostrarAdmin,  setMostrarAdmin] =  useState(false);
  // 🔥 FILTRAR SITIOS
useEffect(() => {

  if (!tecnico) {

    setSitiosFiltrados([]);

    setSitio("");

    return;
  }

  const filtrados =
    sitios.filter(
      (s) =>
        s.tecnico === tecnico
    );

  setSitiosFiltrados(
    filtrados
  );

}, [tecnico, sitios]);
  const [supervisiones, setSupervisiones] = useState([]);

  // 🔥 ONLINE / OFFLINE
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

  // 🔥 CARGAR DATOS
useEffect(() => {

  if (!supervisor) return;

  cargarSupervisiones();

  cargarTecnicos();

  cargarSitios();

}, [supervisor]);

// 🔥 RECUPERAR BORRADOR
useAutoguardado({

  sitio,
  tecnico,
  fallas,

  setSitio,
  setTecnico,
  setFallas,

  setMensaje,

});

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


// 🔥 OBTENER SUPERVISOR LOGUEADO
// 🔥 SUPERVISOR LOGUEADO
// 🔥 SUPERVISOR LOGUEADO
 const cargarSupervisiones =
  async () => {

    const datos =
      await obtenerSupervisiones();

    setSupervisiones(datos);
  };

    // 🔥 DETECTAR INTERNET + SINCRONIZAR
 const {
  online,
} = useOfflineSync({

  cargarSupervisiones,
  setMensaje,

});
const cargarTecnicos =
  async () => {

    const datos =
      await obtenerTecnicos(
        supervisor
      );

    setTecnicos(datos);
  };

const cargarSitios =
  async () => {

    const datos =
      await obtenerSitios(
        supervisor
      );

    setSitios(datos);
  };

  // 🔥 ELIMINAR SUPERVISIÓN
const eliminarSupervision = async (id) => {

  const confirmar = window.confirm(
    "¿Deseas eliminar esta supervisión?"
  );

  if (!confirmar) return;

  try {

    await eliminarSupervisionDB(
  id
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

        const ok =
  await guardarSupervisionDB(
    supervision
  );

if (!ok) {

  setMensaje(
    "❌ Error al guardar"
  );

  return;
}

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

  generarPDFSupervision({

    logo,

    folio,

    sitio,

    tecnico,

    fallas,

  });
};

 return (

  <div className="min-h-screen bg-gray-100 p-3">

    <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-6 max-w-6xl mx-auto border border-gray-200">

      {/* 🔥 ESTADO INTERNET */}
      <Header

  online={online}

  esSuperSupervisor={
    esSuperSupervisor
  }

  mostrarAdmin={
    mostrarAdmin
  }

  setMostrarAdmin={
    setMostrarAdmin
  }

  supervisor={supervisor}

/>

{/* MENSAJE */}

      {/* MENSAJE */}
      {mensaje && !esSuperSupervisor && (

        <div className="bg-cyan-100 border border-cyan-400 text-cyan-800 p-4 rounded-2xl text-center mb-6 font-bold text-lg">
          {mensaje}
        </div>

      )}

      {/* ⚙️ ADMINISTRACIÓN */}
      {mostrarAdmin ? (

        <>

          <GestionTecnicos
            supervisor={supervisor}
            tecnicos={tecnicos}
            cargarTecnicos={cargarTecnicos}
          />

          <GestionSitios

  supervisor={supervisor}

  tecnicos={tecnicos}

  sitios={sitios}

  cargarSitios={cargarSitios}

/>

        </>

      ) : (

        <>

{/* FORMULARIO */}
<SupervisionForm

  tecnicos={tecnicos}

  sitiosFiltrados={sitiosFiltrados}

  falla={falla}
  setFalla={setFalla}

  vlt={vlt}
  setVlt={setVlt}

  urgencia={urgencia}
  setUrgencia={setUrgencia}

  imagen={imagen}
  setImagen={setImagen}

  agregarFalla={agregarFalla}

  guardarSupervision={guardarSupervision}

  descargarPDF={descargarPDF}

  limpiarFormulario={() => {

  localStorage.removeItem(
    "supervision_borrador"
  );

  setSitio("");

  setTecnico("");

  setFallas([]);

  setMensaje(
    "🗑️ Borrador eliminado"
  );

  setTimeout(() => {
    setMensaje("");
  }, 3000);

}}

  />
          {/* DASHBOARD */}
          <DashboardSection

  esSuperSupervisor={
    esSuperSupervisor
  }

  supervisiones={
    supervisiones
  }

  supervisionesMesActual={
    supervisionesMesActual
  }

  recuperarSupervision={
    recuperarSupervision
  }

  eliminarSupervision={
    eliminarSupervision
  }

/>  

        </>

      )}

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