import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import logo from "./logo.png";

function App() {
  const [sitio, setSitio] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [fechaHora] = useState(new Date().toLocaleString());

  const [fallas, setFallas] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const [nuevaFalla, setNuevaFalla] = useState({
    vlt: "",
    falla: "",
    urgencia: "Baja",
    foto: null,
  });

  // 🔥 COMPRESIÓN DE IMAGEN
  const comprimirImagen = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressed = canvas.toDataURL("image/jpeg", 0.7);

        resolve(compressed);
      };
    });
  };

  // ➕ AGREGAR FALLA
  const agregarFalla = () => {
    if (!nuevaFalla.vlt || !nuevaFalla.falla) return;

    setFallas([...fallas, nuevaFalla]);

    setNuevaFalla({
      vlt: "",
      falla: "",
      urgencia: "Baja",
      foto: null,
    });
  };

  // ❌ ELIMINAR FALLA
  const eliminarFalla = (index) => {
    const nuevasFallas = fallas.filter((_, i) => i !== index);
    setFallas(nuevasFallas);
  };

  // 📄 PDF PROFESIONAL
  const generarPDF = () => {
    const doc = new jsPDF();

    let y = 10;

    // 🔥 LOGO
    doc.addImage(logo, "PNG", 10, y, 30, 30);

    // 🔥 TITULO
    doc.setFontSize(16);
    doc.text("REPORTE DE SUPERVISIÓN", 50, 20);

    y += 40;

    doc.setFontSize(11);

    doc.text(`Sitio: ${sitio}`, 10, y);
    y += 8;

    doc.text(`Técnico: ${tecnico}`, 10, y);
    y += 8;

    doc.text(`Fecha: ${fechaHora}`, 10, y);
    y += 12;

    fallas.forEach((f, i) => {
      doc.setFont(undefined, "bold");
      doc.text(`Falla ${i + 1}`, 10, y);

      y += 8;

      doc.setFont(undefined, "normal");

      doc.text(`VLT: ${f.vlt}`, 12, y);
      y += 6;

      doc.text(`Detalle: ${f.falla}`, 12, y);
      y += 6;

      doc.text(`Urgencia: ${f.urgencia}`, 12, y);
      y += 10;

      // 📸 FOTO
      if (f.foto) {
        try {
          doc.addImage(f.foto, "JPEG", 12, y, 60, 45);
          y += 50;
        } catch (error) {
          console.log(error);
        }
      }

      y += 8;

      // 📄 NUEVA PAGINA
      if (y > 250) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save("reporte_supervision.pdf");
  };

  // 💾 GUARDAR
  const guardarSupervision = async () => {
    if (!sitio || !tecnico || fallas.length === 0) {
      setMensaje("⚠️ Completa todos los datos");

      setTimeout(() => {
        setMensaje("");
      }, 3000);

      return;
    }

    try {
      await addDoc(collection(db, "supervisiones"), {
        sitio,
        tecnico,
        fechaHora,
        fallas: fallas || [],
      });

      setMensaje("✅ Supervisión guardada correctamente");

      setSitio("");
      setTecnico("");
      setFallas([]);

      setTimeout(() => {
        setMensaje("");
      }, 3000);

    } catch (error) {
      console.error(error);

      setMensaje("❌ Error al guardar");

      setTimeout(() => {
        setMensaje("");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-3 max-w-md mx-auto">

      {/* HEADER */}
      <div className="bg-blue-900 text-white p-4 rounded-xl shadow mb-4">

        <div className="flex items-center justify-center gap-3">

          <img
            src={logo}
            alt="logo"
            className="w-14 h-14 rounded-full object-cover border-2 border-white"
          />

          <div className="text-left">
            <h1 className="font-bold text-lg">
              Sistema de Supervisión
            </h1>

            <p className="text-xs opacity-80">
              Equipo Técnico Tijuana
            </p>
          </div>

        </div>

      </div>

      {/* MENSAJE */}
      {mensaje && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 text-green-800 p-3 rounded-lg mb-3 text-center font-semibold"
        >
          {mensaje}
        </motion.div>
      )}

      {/* DATOS GENERALES */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-200">

        <input
          className="w-full border border-gray-300 p-3 rounded-lg mb-3"
          placeholder="Sitio"
          value={sitio}
          onChange={(e) => setSitio(e.target.value)}
        />

        <input
          className="w-full border border-gray-300 p-3 rounded-lg mb-3"
          placeholder="Técnico"
          value={tecnico}
          onChange={(e) => setTecnico(e.target.value)}
        />

        <input
          className="w-full border border-gray-300 p-3 rounded-lg"
          value={fechaHora}
          readOnly
        />

      </div>

      {/* REGISTRO DE FALLAS */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-200">

        <input
          className="w-full border border-gray-300 p-3 rounded-lg mb-3"
          placeholder="VLT"
          value={nuevaFalla.vlt}
          onChange={(e) =>
            setNuevaFalla({
              ...nuevaFalla,
              vlt: e.target.value,
            })
          }
        />

        <input
          className="w-full border border-gray-300 p-3 rounded-lg mb-3"
          placeholder="Falla"
          value={nuevaFalla.falla}
          onChange={(e) =>
            setNuevaFalla({
              ...nuevaFalla,
              falla: e.target.value,
            })
          }
        />

        <select
          className="w-full border border-gray-300 p-3 rounded-lg mb-3"
          value={nuevaFalla.urgencia}
          onChange={(e) =>
            setNuevaFalla({
              ...nuevaFalla,
              urgencia: e.target.value,
            })
          }
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
          className="mb-3"
          onChange={async (e) => {
            const file = e.target.files[0];

            if (file) {
              const imagenComprimida = await comprimirImagen(file);

              setNuevaFalla({
                ...nuevaFalla,
                foto: imagenComprimida,
              });
            }
          }}
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={agregarFalla}
          className="w-full bg-blue-900 text-white p-3 rounded-xl text-lg font-semibold shadow"
        >
          ➕ Agregar Falla
        </motion.button>

      </div>

      {/* LISTA DE FALLAS */}
      {fallas.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`bg-white p-4 rounded-xl shadow mb-3 border-l-4 hover:shadow-xl transition-all duration-300 ${
            f.urgencia === "Crítica"
              ? "border-red-700"
              : f.urgencia === "Alta"
              ? "border-orange-500"
              : f.urgencia === "Media"
              ? "border-yellow-400"
              : "border-green-500"
          }`}
        >
          <div className="flex justify-end">
            <button
              onClick={() => eliminarFalla(i)}
              className="text-red-600 font-bold text-lg"
            >
              ❌
            </button>
          </div>

          <p><b>🎰 VLT:</b> {f.vlt}</p>

          <p><b>❌ Falla:</b> {f.falla}</p>

          <p>
            <b>🚨 Urgencia:</b> {f.urgencia}
          </p>

          {f.foto && (
            <img
              src={f.foto}
              alt="falla"
              className="mt-3 rounded-lg w-full max-h-52 object-cover"
            />
          )}
        </motion.div>
      ))}

      {/* BOTÓN GUARDAR */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={guardarSupervision}
        className="w-full bg-green-700 text-white p-4 rounded-xl mt-4 font-semibold shadow-lg"
      >
        💾 Guardar Supervisión
      </motion.button>

      {/* BOTÓN PDF */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={generarPDF}
        className="w-full bg-gray-800 text-white p-4 rounded-xl mt-2 font-semibold shadow-lg"
      >
        📄 Descargar PDF
      </motion.button>

    </div>
  );
}

export default App;