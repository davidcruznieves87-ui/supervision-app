import theme from "../../styles/theme";

function EjecucionCard({

  datos,
  setDatos,

  confirmarEjecucion,
  desbloquearEjecucion,

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
            ⚙️
          </div>

          <h3 style={{ margin: 0 }}>
            Ejecución
          </h3>

        </div>

        {datos.ejecucionConfirmada && (

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
            Ejecución
          </h4>

          <input
            type="time"
            style={theme.input}
            value={
              datos.horaInicio || ""
            }
            disabled={
              datos.ejecucionConfirmada
            }
            onChange={(e) =>
              setDatos({
                ...datos,
                horaInicio:
                  e.target.value,
              })
            }
          />

          <input
            type="time"
            style={theme.input}
            value={
              datos.horaFin || ""
            }
            disabled={
              datos.ejecucionConfirmada
            }
            onChange={(e) =>
              setDatos({
                ...datos,
                horaFin:
                  e.target.value,
              })
            }
          />

          <textarea
            placeholder="Observaciones de ejecución"
            value={
              datos.observacionesEjecucion || ""
            }
            disabled={
              datos.ejecucionConfirmada
            }
            onChange={(e) =>
              setDatos({
                ...datos,
                observacionesEjecucion:
                  e.target.value,
              })
            }
            style={{
              ...theme.input,
              minHeight: 120,
            }}
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
                datos.horaInicio
                  ? "#16A34A"
                  : "#DC2626",
              marginBottom: 10,
            }}
          >
            {datos.horaInicio
              ? "✅ Inicio Registrado"
              : "❌ Sin Inicio"}
          </div>

          <div
            style={{
              color:
                datos.horaFin
                  ? "#16A34A"
                  : "#DC2626",
              marginBottom: 10,
            }}
          >
            {datos.horaFin
              ? "✅ Fin Registrado"
              : "❌ Sin Fin"}
          </div>

          <label>

            <input
              type="checkbox"

              checked={
                datos.actividadCompletada ||
                false
              }

              disabled={
                datos.ejecucionConfirmada
              }

              onChange={(e) =>
                setDatos({
                  ...datos,
                  actividadCompletada:
                    e.target.checked,
                })
              }
            />

            {" "}
            Actividad Completada

          </label>

        </div>

        {/* COLUMNA 3 */}

        <div>

          {datos.ejecucionConfirmada ? (

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
                  👤 Confirmado por
                </div>

                <div>
                  {
                    datos.ejecucionConfirmadoPor
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
                    datos.ejecucionConfirmadoFecha
                  }
                </div>

              </div>

              <button
                onClick={
                  desbloquearEjecucion
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
                confirmarEjecucion
              }
              style={{
                ...theme.button.primary,
                width: "100%",
              }}
            >
              🔒 Confirmar Ejecución
            </button>

          )}

        </div>

      </div>

    </div>

  );
}

export default EjecucionCard;