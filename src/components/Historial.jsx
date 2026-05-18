import theme
from "../styles/theme";

function Historial({

  supervisiones,

  recuperarSupervision,

  eliminarSupervision,

}) {

  return (

    <div>

      <h2 style={{
        ...theme.title,
        marginBottom: "25px",
      }}>

        📂 Historial de Supervisiones

      </h2>

      {supervisiones.length === 0 && (

        <div style={{
          ...theme.card,
          textAlign: "center",
          color: theme.colors.textLight,
          fontWeight: "bold",
        }}>

          No hay supervisiones registradas

        </div>

      )}

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}>

        {supervisiones.map((s, index) => (

          <div
            key={s.id || index}
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

              {/* INFO */}
              <div>

                <p style={{
                  color:
                    theme.colors.primary,
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}>

                  📄 {s.folio || "Sin folio"}

                </p>

                <p style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color:
                    theme.colors.text,
                  marginBottom: "8px",
                }}>

                  📍 {s.sitio}

                </p>

                <p style={{
                  color:
                    theme.colors.textLight,
                  marginBottom: "5px",
                }}>

                  👨‍🔧 {s.tecnico}

                </p>

                <p style={{
                  color:
                    theme.colors.textLight,
                  marginBottom: "5px",
                }}>

                  🕒{
  s?.fechaHora?.seconds

    ? new Date(
        s.fechaHora.seconds * 1000
      ).toLocaleString()

    : typeof s?.fechaHora ===
      "string"

    ? s.fechaHora

    : "Sin fecha"
}

                </p>

                <p style={{
                  color:
                    theme.colors.textLight,
                }}>

                  ⚠️ {s.fallas?.length || 0} fallas registradas

                </p>

              </div>

              {/* BOTONES */}
              <div style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}>

                <button
                  onClick={() =>
                    recuperarSupervision(s)
                  }
                  style={
                    theme.button.primary
                  }
                >

                  ♻️ Recuperar

                </button>

                <button
                  onClick={() =>
                    eliminarSupervision(s.id)
                  }
                  style={
                    theme.button.danger
                  }
                >

                  🗑️ Eliminar

                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}

export default Historial;