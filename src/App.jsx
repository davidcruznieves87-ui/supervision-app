import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { useState } from "react";
import jsPDF from "jspdf";

function App() {
  const [sitio, setSitio] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [fechaHora] = useState(new Date().toLocaleString());

  const [fallas, setFallas] = useState([]);

  const [nuevaFalla, setNuevaFalla] = useState({
  vlt: "",
  falla: "",
  urgencia: "Baja",
  foto: null
});
const guardarSupervision = async () => {
  if (!sitio || !tecnico || fallas.length === 0) {
    alert("Completa todos los datos");
    return;
  }

  try {
    await addDoc(collection(db, "supervisiones"), {
      sitio,
      tecnico,
      fechaHora,
      fallas
    });

    alert("Supervisión guardada correctamente");

    setSitio("");
    setTecnico("");
    setFallas([]);

  } catch (error) {
    console.error(error);
    alert("Error al guardar");
  }
};

const convertirImagenBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const dataURL = canvas.toDataURL("image/jpeg");
      resolve(dataURL);
    };
  });
};  
const generarPDF = async () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte de Supervisión", 10, 10);

  doc.setFontSize(12);
  doc.text(`Sitio: ${sitio}`, 10, 20);
  doc.text(`Técnico: ${tecnico}`, 10, 30);
  doc.text(`Fecha: ${fechaHora}`, 10, 40);

  let y = 50;

  for (let i = 0; i < fallas.length; i++) {
    const f = fallas[i];

    doc.text(`Falla ${i + 1}`, 10, y);
    y += 10;

    doc.text(`VLT: ${f.vlt}`, 10, y);
    y += 10;

    doc.text(`Falla: ${f.falla}`, 10, y);
    y += 10;

    doc.text(`Urgencia: ${f.urgencia}`, 10, y);
    y += 10;

    // 👇 AGREGAR IMAGEN
    if (f.foto) {
      const imgBase64 = await convertirImagenBase64(f.foto);

      doc.addImage(imgBase64, "JPEG", 10, y, 50, 40);
      y += 50;
    }

    y += 10;
  }

  doc.save("reporte_supervision.pdf");
};
const agregarFalla = () => {
    if (!nuevaFalla.vlt || !nuevaFalla.falla) {
      alert("Completa los campos de la falla");
      return;
    }

    setFallas([...fallas, nuevaFalla]);

    setNuevaFalla({
      vlt: "",
      falla: "",
      urgencia: "Baja",
      foto: null
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Registro de Supervisión</h1>

      <div>
        <label>Sitio:</label><br />
        <input value={sitio} onChange={(e) => setSitio(e.target.value)} />
      </div>

      <br />

      <div>
        <label>Técnico:</label><br />
        <input value={tecnico} onChange={(e) => setTecnico(e.target.value)} />
      </div>

      <br />

      <div>
        <label>Fecha y Hora:</label><br />
        <input value={fechaHora} readOnly />
      </div>

      <hr />

      <h2>Agregar Falla</h2>

      <div>
        <label>VLT:</label><br />
        <input 
          value={nuevaFalla.vlt}
          onChange={(e) => setNuevaFalla({ ...nuevaFalla, vlt: e.target.value })}
        />
      </div>

      <br />

      <div>
        <label>Falla:</label><br />
        <input 
          value={nuevaFalla.falla}
          onChange={(e) => setNuevaFalla({ ...nuevaFalla, falla: e.target.value })}
        />
      </div>

      <br />

      <div>
        <label>Urgencia:</label><br />
        <select
          value={nuevaFalla.urgencia}
          onChange={(e) => setNuevaFalla({ ...nuevaFalla, urgencia: e.target.value })}
        >
          <option>Baja</option>
          <option>Media</option>
          <option>Alta</option>
          <option>Crítica</option>
        </select>
      </div>
<div>
  <label>Foto:</label><br />
  <input 
    type="file" 
    accept="image/*"
    capture="environment"
    onChange={(e) =>
      setNuevaFalla({
        ...nuevaFalla,
        foto: URL.createObjectURL(e.target.files[0])
      })
    }
  />
</div>

      <br />

      <button onClick={agregarFalla}>Agregar Falla</button>

<button onClick={guardarSupervision}>
  Guardar Supervisión
</button>

<button onClick={generarPDF}>
  Descargar PDF
</button>
      <hr />

      <h2>Fallas Registradas</h2>

      {fallas.map((f, index) => (
        <div key={index} style={{ border: "1px solid gray", padding: "10px", marginBottom: "10px" }}>
          <p><strong>VLT:</strong> {f.vlt}</p>
          <p><strong>Falla:</strong> {f.falla}</p>
          <p><strong>Urgencia:</strong> {f.urgencia}</p>
          {f.foto && (  <img src={f.foto} 
    alt="falla" 
    style={{ width: "150px", marginTop: "10px" }}
  />
)}
        </div>
        
      ))}

    </div>
  );
}

export default App;