
import { useEffect, useRef, useState } from "react";
import {  obtenerSupervisiones,  guardarSupervisionDB,  eliminarSupervisionDB,} from "../services/supervisionesService";import {  collection,  getDocs,  query,  where,} from "firebase/firestore";
import {  obtenerTecnicos,} from "../services/tecnicosService";
import {  obtenerSitios,} from "../services/sitiosService";
import useAutoguardado from "../hooks/useAutoguardado";
import useOfflineSync from "../hooks/useOfflineSync";
import theme from "../styles/theme";
import useAuth from "../hooks/useAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {  signOut,} from "firebase/auth"; 
import { db, auth } from "../firebase";
import {  useSupervision, } from "../context/SupervisionContext";
import {  generarPDFSupervision,} from "../utils/pdfGenerator";
import Dashboard from "../components/Dashboard";
import Header from "../components/Header";
import logo from "../logo.png";
export default function DashboardPage() {

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

 

return (

  <div style={theme.layout.page}>

    <Header
      online={online}
      supervisor={supervisor}
    />

    <div style={theme.layout.content}>

      <div style={theme.card}>

        <Dashboard
          supervisiones={
            supervisionesMesActual
          }
        />

      </div>

    </div>

  </div>
);
}