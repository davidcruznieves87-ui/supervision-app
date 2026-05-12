import {
  useState,
  useEffect,
} from "react";
import {
  guardarSupervisionDB,
} from "../services/supervisionesService";
import theme
from "../styles/theme";
import {
  generarPDFSupervision,
} from "../utils/pdfGenerator";

import logo
from "../logo.png";
import SupervisionForm
from "../components/SupervisionForm";

import {
  obtenerTecnicos,
} from "../services/tecnicosService";

import {
  obtenerSitios,
} from "../services/sitiosService";

import useAuth
from "../hooks/useAuth";

import {
  useSupervision,
} from "../context/SupervisionContext";

export default function SupervisionesPage() {

  // 🔥 AUTH
  const {
    supervisor,
  } = useAuth();

  // 🔥 CONTEXT
  const {

    sitio,
    setSitio,

    tecnico,
    setTecnico,

    fallas,
    setFallas,

  } = useSupervision();

  // 🔥 STATES
  const [falla, setFalla] =
    useState("");

  const [vlt, setVlt] =
    useState("");

  const [urgencia, setUrgencia] =
    useState("Baja");

  const [imagen, setImagen] =
    useState(null);
const [mensaje, setMensaje] =
  useState("");

const [folio] =
  useState(
    Date.now()
  );

const [online] =
  useState(
    navigator.onLine
  );
  const [
    tecnicos,
    setTecnicos,
  ] = useState([]);

  const [
    sitios,
    setSitios,
  ] = useState([]);

  const [
    sitiosFiltrados,
    setSitiosFiltrados,
  ] = useState([]);

  // 🔥 CARGAR TÉCNICOS
  const cargarTecnicos =
    async () => {

      const datos =
        await obtenerTecnicos(
          supervisor
        );

      setTecnicos(datos);
    };

  // 🔥 CARGAR SITIOS
  const cargarSitios =
    async () => {

      const datos =
        await obtenerSitios(
          supervisor
        );

      setSitios(datos);
    };

  // 🔥 CARGAR DATOS
  useEffect(() => {

    if (!supervisor) return;

    cargarTecnicos();

    cargarSitios();

  }, [supervisor]);

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

  // 🔥 COMPRESIÓN IMAGEN
  const comprimirImagen =
    (file) => {

      return new Promise(
        (resolve) => {

          const reader =
            new FileReader();

          reader.readAsDataURL(file);

          reader.onload =
            (event) => {

              const img =
                new Image();

              img.src =
                event.target.result;

              img.onload = () => {

                const canvas =
                  document.createElement(
                    "canvas"
                  );

                const MAX_WIDTH =
                  150;

                const scaleSize =
                  MAX_WIDTH /
                  img.width;

                canvas.width =
                  MAX_WIDTH;

                canvas.height =
                  img.height *
                  scaleSize;

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

                const compressedBase64 =
                  canvas.toDataURL(
                    "image/jpeg",
                    0.6
                  );

                resolve(
                  compressedBase64
                );
              };
            };
        }
      );
    };

  // 🔥 AGREGAR FALLA
  const agregarFalla =
    async () => {

      if (!falla) return;

      let imagenComprimida =
        null;

      if (imagen) {

        imagenComprimida =
          await comprimirImagen(
            imagen
          );
      }

      const nuevaFalla = {

        vlt,

        descripcion:
          falla,

        urgencia,

        imagen:
          imagenComprimida,

      };

      setFallas([
        ...fallas,
        nuevaFalla,
      ]);

      setFalla("");

      setVlt("");

      setUrgencia("Baja");

      setImagen(null);
    };

    const guardarSupervision =
  async () => {

    if (
      !sitio ||
      !tecnico ||
      fallas.length === 0
    ) {

      setMensaje(
        "⚠️ Completa todos los campos"
      );

      return;
    }

    const supervision = {

      folio,

      supervisor,

      sitio,

      tecnico,

      fechaHora:
        new Date()
          .toLocaleString(),

      fallas,

    };

    try {

      // 🔥 ONLINE
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

        setMensaje(
          "✅ Supervisión guardada correctamente"
        );

      } else {

        // 🔥 OFFLINE
        const pendientes =
          JSON.parse(

            localStorage.getItem(
              "supervisiones_pendientes"
            ) || "[]"

          );

        pendientes.push(
          supervision
        );

        localStorage.setItem(

          "supervisiones_pendientes",

          JSON.stringify(
            pendientes
          )

        );

        setMensaje(

          "📴 Supervisión guardada offline"

        );
      }

      // 🔥 LIMPIAR
      setSitio("");

      setTecnico("");

      setFallas([]);

      setFalla("");

      setVlt("");

      setUrgencia("Baja");

      setImagen(null);

      localStorage.removeItem(
        "supervision_borrador"
      );

      setTimeout(() => {

        setMensaje("");

      }, 4000);

    } catch (error) {

      console.log(error);

      setMensaje(
        "❌ Error al guardar"
      );
    }
  };

const descargarPDF =
  () => {

    generarPDFSupervision({

      logo,

      folio,

      sitio,

      tecnico,

      fallas,

    });
  };

const limpiarFormulario =
  () => {

    localStorage.removeItem(
      "supervision_borrador"
    );

    setSitio("");

    setTecnico("");

    setFallas([]);

    setFalla("");

    setVlt("");

    setUrgencia("Baja");

    setImagen(null);

    setMensaje(
      "🗑️ Formulario limpiado"
    );

    setTimeout(() => {

      setMensaje("");

    }, 3000);
  };

  return (

    <div style={theme.layout.page}>

      <div style={theme.layout.content}>

        <div style={theme.card}>

          <h1 style={theme.title}>

            📋 Supervisiones

          </h1>

          <SupervisionForm

            tecnicos={
              tecnicos
            }

            sitiosFiltrados={
              sitiosFiltrados
            }

            falla={falla}
            setFalla={setFalla}

            vlt={vlt}
            setVlt={setVlt}

            urgencia={urgencia}
            setUrgencia={
              setUrgencia
            }

            imagen={imagen}
            setImagen={
              setImagen
            }

            agregarFalla={
              agregarFalla
            }

            guardarSupervision={
  guardarSupervision
}

            descargarPDF={
  descargarPDF
}

            limpiarFormulario={
  limpiarFormulario
}

          />

        </div>

      </div>

    </div>
  );
}