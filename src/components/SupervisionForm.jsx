import {
  useSupervision,
} from "../context/SupervisionContext";
import {
  useRef,
} from "react";
import theme
from "../styles/theme";

function SupervisionForm({

  tecnicos,

  sitiosFiltrados,

  falla,
  setFalla,

  vlt,
  setVlt,

  urgencia,
  setUrgencia,

  imagen,
  setImagen,

  agregarFalla,

  guardarSupervision,

  descargarPDF,

  limpiarFormulario,

}) {

  const {

    sitio,
    setSitio,

    tecnico,
    setTecnico,

    fallas,
    setFallas,

  } = useSupervision();

  const fileInputRef =
  useRef(null);

  return (

    <div style={theme.card}>

      {/* SUPERIOR */}
      <div style={{
        display: "grid",
        gridTemplateColumns:
          "1fr 1fr 1fr",
        gap: "12px",
        marginBottom: "20px",
      }}>

        <select
          value={tecnico}
          onChange={(e) =>
            setTecnico(e.target.value)
          }
          style={theme.input}
        >

          <option value="">
            👨‍🔧 Seleccionar técnico
          </option>

          {(tecnicos || []).map((t) => (

            <option
              key={t.id}
              value={t.nombre}
            >
              {t.nombre}
            </option>

          ))}

        </select>

        <select
          value={sitio}
          onChange={(e) =>
            setSitio(e.target.value)
          }
          style={theme.input}
        >

          <option value="">
            📍 Seleccionar sitio
          </option>

          {(sitiosFiltrados || []).map((s) => (

            <option
              key={s.id}
              value={s.nombre}
            >
              {s.nombre}
            </option>

          ))}

        </select>

        <input
          type="text"
          value={new Date().toLocaleString()}
          disabled
          style={{
            ...theme.input,
            background: "#f3f4f6",
          }}
        />

      </div>

      {/* FALLAS */}
      <div style={{
        display: "grid",
        gridTemplateColumns:
          "1fr 2fr 1fr",
        gap: "12px",
        marginBottom: "15px",
      }}>

        <input
          type="text"
          placeholder="🎰 VLT"
          value={vlt}
          onChange={(e) =>
            setVlt(e.target.value)
          }
          style={theme.input}
        />

        <input
          type="text"
          placeholder="⚠️ Descripción de falla"
          value={falla}
          onChange={(e) =>
            setFalla(e.target.value)
          }
          style={theme.input}
        />

        <select
          value={urgencia}
          onChange={(e) =>
            setUrgencia(e.target.value)
          }
          style={theme.input}
        >

          <option>Baja</option>
          <option>Media</option>
          <option>Alta</option>
          <option>Crítica</option>

        </select>

      </div>

      {/* IMAGEN */}
      <div style={{
        marginBottom: "20px",
      }}>

        <input
        ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) =>
            setImagen(e.target.files[0])
          }
          style={theme.input}
        />

      </div>

      {/* BOTÓN AGREGAR */}
      <div style={{
        marginBottom: "25px",
      }}>

        <button
          onClick={agregarFalla}
          style={theme.button.primary}
        >

          ➕ Agregar Falla

        </button>

      </div>

      {/* LISTA FALLAS */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        marginBottom: "30px",
      }}>

        {(fallas || []).map((f, index) => (

          <div
            key={index}
            style={{
              ...theme.card,
              border:
                `1px solid ${theme.colors.border}`,
            }}
          >

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}>

              <div>

                <p style={{
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}>

                  🎰 VLT: {f.vlt || "N/A"}

                </p>

                <p style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                }}>

                  {f.descripcion}

                </p>

                <p style={{
                  marginTop: "8px",
                  color:
                    theme.colors.textLight,
                }}>

                  Urgencia: {f.urgencia}

                </p>

              </div>

              <button
                onClick={() => {

                  const nuevas = [...fallas];

                  nuevas.splice(index, 1);

                  setFallas(nuevas);

                }}
                style={theme.button.danger}
              >

                Eliminar

              </button>

            </div>

            {f.imagen && (

              <img
                src={f.imagen}
                alt="falla"
                style={{
                  width: "220px",
                  borderRadius: "12px",
                  marginTop: "20px",
                }}
              />

            )}

          </div>

        ))}

      </div>

      {/* BOTONES FINALES */}
      <div style={{
        display: "flex",
        gap: "15px",
        flexWrap: "wrap",
      }}>

        <button
          onClick={guardarSupervision}
          style={theme.button.success}
        >

          💾 Guardar Supervisión

        </button>

        <button
          onClick={descargarPDF}
          style={theme.button.primary}
        >

          📄 Descargar PDF

        </button>

        <button
          onClick={() => {

  limpiarFormulario();

  if (fileInputRef.current) {

    fileInputRef.current.value =
      "";
  }
}}
          style={theme.button.danger}
        >

          🗑️ Limpiar

        </button>

      </div>

    </div>

  );
}

export default SupervisionForm;