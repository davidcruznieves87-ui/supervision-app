import {
  useState,
  useEffect,
} from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  subirImagenOptimizada,
} from "../services/imagenesService";

import {
  guardarSupervisionDB,
} from "../services/supervisionesService";

import theme
from "../styles/theme";

import {
  generarPDFSupervision,
} from "../utils/pdf/pdfSupervision";

import SupervisionForm
from "../components/SupervisionForm";

import useAuth
from "../hooks/useAuth";

import {
  useSupervision,
} from "../context/SupervisionContext";
import {
  db,
} from "../firebase";
export default function SupervisionesPage() {

  // 🔥 AUTH
 const {
  usuario,
} = useAuth();

const supervisor =
  usuario?.nombre || "";
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

    const [
  imagenPreview,
  setImagenPreview,
] = useState("");

const [
  restaurandoBorrador,
  setRestaurandoBorrador,
] = useState(true);

  const [mensaje, setMensaje] =
    useState("");

  const [folio] =
    useState(
      Date.now()
    );

  const [
  online,
  setOnline,
] = useState(
  navigator.onLine
);

useEffect(() => {

  const updateOnlineStatus =
    () => {

      setOnline(
        navigator.onLine
      );
    };

  window.addEventListener(
    "online",
    updateOnlineStatus
  );

  window.addEventListener(
    "offline",
    updateOnlineStatus
  );

  return () => {

    window.removeEventListener(
      "online",
      updateOnlineStatus
    );

    window.removeEventListener(
      "offline",
      updateOnlineStatus
    );

  };

}, []);

  const [
    tecnicos,
    setTecnicos,
  ] = useState([]);

  const [
    sitiosFiltrados,
    setSitiosFiltrados,
  ] = useState([]);

 
// 🔥 CARGAR TÉCNICOS
const cargarTecnicos =
  async () => {

    try {

      const snapshot =
        await getDocs(

          collection(
            db,
            "usuarios"
          )
        );

      // 🔥 NORMALIZAR ROLES
      const lista =
        snapshot.docs

          .map((d) => ({

            id: d.id,

            ...d.data(),

            // 🔥 ASEGURAR ARRAY
            sitiosAsignados:
              d.data()
                ?.sitiosAsignados || [],

          }))

          .filter((u) => {

            const rol = (
              u?.rol || ""
            )

              .toLowerCase()

              .trim()

              .normalize("NFD")

              .replace(
                /[\u0300-\u036f]/g,
                ""
              );

            return (
              rol === "tecnico"
            );
          });

      // 🔥 DEBUG
      console.log(
        "TECNICOS CARGADOS:",
        lista
      );

      setTecnicos(
        lista
      );

    } catch (error) {

      console.log(
        "ERROR CARGANDO TECNICOS:",
        error
      );
    }
  };

  // 🔥 INIT
  useEffect(() => {

    if (!supervisor) return;

    cargarTecnicos();

  }, [supervisor]);

 
// 🔥 RESTAURAR BORRADOR
useEffect(() => {

  const borrador =
    localStorage.getItem(
      "supervision_borrador"
    );

  if (!borrador) {

    setRestaurandoBorrador(false);

    return;
  }

  try {

    const data =
      JSON.parse(borrador);

      console.log(
  "📦 BORRADOR RESTAURADO",
  data
);

    setSitio(
      data.sitio || ""
    );

    setTecnico(
      data.tecnico || ""
    );

    setFallas(
      data.fallas || []
    );

    setFalla(
      data.falla || ""
    );

    setVlt(
      data.vlt || ""
    );

    setUrgencia(
      data.urgencia || "Baja"
    );

    setImagenPreview(
  data.imagenPreview || ""
);

  } catch (error) {

    console.log(
      "Error restaurando borrador:",
      error
    );

  } finally {

    setTimeout(() => {

      setRestaurandoBorrador(
        false
      );

    }, 100);
  }

}, []);

// 🔥 AUTOGUARDADO ENTERPRISE
// 🔥 AUTOGUARDADO ENTERPRISE
useEffect(() => {

  // 🔥 NO GUARDAR
  // MIENTRAS RESTAURA
  if (
    restaurandoBorrador
  ) return;

  try {

    const borrador = {

      sitio,
      tecnico,
      fallas,

      falla,
      vlt,
      urgencia,
      imagenPreview,

    };

    localStorage.setItem(

      "supervision_borrador",

      JSON.stringify(
        borrador
      )

    );

    console.log(
      "💾 BORRADOR GUARDADO"
    );

  } catch (error) {

    console.log(
      "Error guardando borrador:",
      error
    );
  }

}, [

  restaurandoBorrador,

  sitio,
  tecnico,
  fallas,

  falla,
  vlt,
  urgencia,

  imagenPreview,

]);

console.log(
  "ESTADO ACTUAL:",
  {
    sitio,
    tecnico,
    fallas,
  }
);


  // 🔥 FILTRAR SITIOS
  useEffect(() => {

    if (
  !tecnico &&
  !restaurandoBorrador
) {

      setSitiosFiltrados([]);

      setSitio("");

      return;
    }

    // 🔥 BUSCAR TECNICO
    const tecnicoSeleccionado =
      tecnicos.find(
        (t) =>
          t.nombre === tecnico
      );

    // 🔥 SITIOS DESDE TECNICO
    const sitiosAsignados =
      tecnicoSeleccionado
        ?.sitiosAsignados || [];

    // 🔥 FORMATEAR
    const sitiosFormateados =
      sitiosAsignados.map(
        (sitio) => ({
          nombre: sitio,
        })
      );

    setSitiosFiltrados(
      sitiosFormateados
    );

  }, [tecnico, tecnicos]);

  // 🔥 AGREGAR FALLA
  const agregarFalla =
    async () => {

      if (!falla) return;

      let imagenProcesada =
        null;

      try {

        if (imagen) {

          // 🔥 PREVIEW LOCAL
          const preview =
            await new Promise(
              (resolve) => {

                const reader =
                  new FileReader();

                reader.onload =
                  (e) => {

                    resolve(
                      e.target.result
                    );
                  };

                reader.readAsDataURL(
                  imagen
                );
              }
            );

          // 🔥 STORAGE
          const resultado =
            await subirImagenOptimizada(
              imagen,
              "supervisiones"
            );

          const url =
            typeof resultado ===
            "string"

              ? resultado

              : resultado?.url || "";

          imagenProcesada = {

            url,

            preview,

          };
        }

        const nuevaFalla = {

          vlt,

          descripcion:
            falla,

          urgencia,

          imagen:
            imagenProcesada,

        };

        const nuevasFallas = [
          ...fallas,
          nuevaFalla,
        ];

        setFallas(
          nuevasFallas
        );


        setFalla("");

        setVlt("");

        setUrgencia("Baja");

        setImagen(null);

        setImagenPreview("");

      } catch (error) {

        console.log(
          "Error agregando falla:",
          error
        );
      }
    };

  // 🔥 GUARDAR
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
  new Date(),

        fallas: fallas.map(
          (falla) => ({

            vlt:
              falla.vlt || "",

            descripcion:
              falla.descripcion || "",

            urgencia:
              falla.urgencia || "Baja",

            imagen:
              falla.imagen?.url ||

              falla.imagen ||

              "",

          })
        ),

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

  // 🔥 PDF
  const descargarPDF =
    async () => {

      try {

        const borrador =
          JSON.parse(

            localStorage.getItem(
              "supervision_borrador"
            ) || "{}"

          );

        await generarPDFSupervision({

          folio,

          sitio:
            borrador.sitio ||
            sitio,

          tecnico:
            borrador.tecnico ||
            tecnico,

          supervisor,

          fallas:
            borrador.fallas ||
            fallas,

        });

      } catch (error) {

        console.log(
          "Error PDF:",
          error
        );
      }
    };

  // 🔥 LIMPIAR
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

      setImagenPreview("");

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

imagenPreview={
  imagenPreview
}

setImagenPreview={
  setImagenPreview
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