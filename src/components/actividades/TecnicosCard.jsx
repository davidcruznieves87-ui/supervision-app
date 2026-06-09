import theme from "../../styles/theme";

function TecnicosCard({

  datos,
  setDatos,

  tecnicos,

  toggleTecnico,

  confirmarEquipo,
  desbloquearEquipo,

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
            👷
          </div>

          <h3
            style={{
              margin: 0,
            }}
          >
            Técnicos
          </h3>

        </div>

        {datos.tecnicosConfirmados && (

          <div
            style={{
              background: "#DCFCE7",
              color: "#15803D",
              padding: "8px 14px",
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            ✅ CONFIRMADO
          </div>

        )}

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr 1fr",
          gap: 24,
          marginTop: 20,
        }}
      >

        {/* COLUMNA 1 */}

        <div>

          <h4>
            Técnicos Asignados
          </h4>

          {(tecnicos || []).map(
            (tecnico) => (

              <div
                key={tecnico.id}
                style={{
                  marginBottom: 10,
                }}
              >

                <label>

                  <input
                    type="checkbox"

                    checked={
                      datos
                        .tecnicosAsignados
                        ?.includes(
                          tecnico.nombre
                        ) || false
                    }

                    disabled={
                      datos.tecnicosConfirmados
                    }

                    onChange={() =>
                      toggleTecnico(
                        tecnico.nombre
                      )
                    }
                  />

                  {" "}

                  {tecnico.nombre}

                </label>

              </div>

            )
          )}

        </div>

        {/* COLUMNA 2 */}

        <div>

          <h4>
            Estado Equipo
          </h4>

          {(datos.tecnicosAsignados || [])
            .map((nombre) => (

              <div
                key={nombre}
                style={{
                  color: "#16A34A",
                  marginBottom: 8,
                }}
              >
                ✅ {nombre}
              </div>

            ))}

        </div>

        {/* COLUMNA 3 */}

        <div>

          {datos.tecnicosConfirmados ? (

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
                    marginBottom: 10,
                  }}
                >
                  👤 Confirmado por
                </div>

                <div>
                  {
                    datos.tecnicosConfirmadoPor
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
                    datos.tecnicosConfirmadoFecha
                  }
                </div>

              </div>

              <button
                onClick={
                  desbloquearEquipo
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
                confirmarEquipo
              }
              style={{
                ...theme.button.primary,
                width: "100%",
              }}
            >
              🔒 Confirmar Equipo
            </button>

          )}

        </div>

      </div>

    </div>

  );
}

export default TecnicosCard;