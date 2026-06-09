import theme from "../../styles/theme";

function ProgramacionCard({

  datos,
  setDatos,

  confirmarProgramacion,
  desbloquearProgramacion,

}) {

  return (

    <div
      style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 18,
        padding: 20,
        marginTop: 20,
        background: "#F8FAFC",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >

          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            📅
          </div>

          <h3 style={{ margin: 0 }}>
            Programación
          </h3>

        </div>

        {datos.programacionConfirmada && (

          <div
            style={{
              background: "#DCFCE7",
              color: "#15803D",
              padding: "8px 14px",
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            ✅ CONFIRMADA
          </div>

        )}

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr 1fr",
          gap: 24,
        }}
      >

        {/* COLUMNA 1 */}

        <div>

          <h4>
            Fecha y Hora
          </h4>

          <input
            type="date"
            style={theme.input}
            value={
              datos.fechaProgramada || ""
            }
            disabled={
              datos.programacionConfirmada
            }
            onChange={(e) =>
              setDatos({
                ...datos,
                fechaProgramada:
                  e.target.value,
              })
            }
          />

          <input
            type="time"
            style={theme.input}
            value={
              datos.horaProgramada || ""
            }
            disabled={
              datos.programacionConfirmada
            }
            onChange={(e) =>
              setDatos({
                ...datos,
                horaProgramada:
                  e.target.value,
              })
            }
          />

        </div>

        {/* COLUMNA 2 */}

        <div>

          <h4>
            Estado
          </h4>

          <div
            style={{
              color:
                datos.fechaProgramada
                  ? "#16A34A"
                  : "#DC2626",
            }}
          >
            {datos.fechaProgramada
              ? "✅ Fecha Definida"
              : "❌ Sin Fecha"}
          </div>

          <div
            style={{
              marginTop: 10,
              color:
                datos.horaProgramada
                  ? "#16A34A"
                  : "#DC2626",
            }}
          >
            {datos.horaProgramada
              ? "✅ Hora Definida"
              : "❌ Sin Hora"}
          </div>

        </div>

        {/* COLUMNA 3 */}

        <div>

          {datos.programacionConfirmada ? (

            <>

              <div
                style={{
                  padding: 15,
                  borderRadius: 16,
                  background: "#F0FDF4",
                  border:
                    "1px solid #BBF7D0",
                }}
              >

                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  👤 Programado por
                </div>

                <div>
                  {
                    datos.programacionConfirmadoPor
                  }
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color:
                      theme.colors.textLight,
                  }}
                >
                  🕒
                  {" "}
                  {
                    datos.programacionConfirmadoFecha
                  }
                </div>

              </div>

              <button
                onClick={
                  desbloquearProgramacion
                }
                style={{
                  ...theme.button.danger,
                  width: "100%",
                  marginTop: 15,
                }}
              >
                🔓 Desbloquear
              </button>

            </>

          ) : (

            <button
              onClick={
                confirmarProgramacion
              }
              style={{
                ...theme.button.primary,
                width: "100%",
              }}
            >
              🔒 Confirmar Programación
            </button>

          )}

        </div>

      </div>

    </div>

  );
}

export default ProgramacionCard;