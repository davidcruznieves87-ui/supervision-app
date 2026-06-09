import theme from "../../styles/theme";

function MaterialCard({

  datos,
  setDatos,

  confirmarMaterial,
  desbloquearMaterial,

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
            📦
          </div>

          <h3
            style={{
              margin: 0,
            }}
          >
            Material
          </h3>

        </div>

        {datos.materialConfirmado && (

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
          alignItems: "start",
        }}
      >

        {/* COLUMNA 1 */}

        <div>

          <h4>
            Material requerido
          </h4>

          <textarea
            placeholder="Material requerido"
            value={
              datos.materialRequerido || ""
            }
            disabled={
              datos.materialConfirmado
            }
            onChange={(e) =>
              setDatos({

                ...datos,

                materialRequerido:
                  e.target.value,

              })
            }
            style={{
              ...theme.input,
              minHeight: 160,
              resize: "vertical",
            }}
          />

        </div>

        {/* COLUMNA 2 */}

        <div>

          <h4>
            Estado Material
          </h4>

          <label
            style={{
              display: "block",
              marginBottom: 12,
            }}
          >

            <input
              type="checkbox"
              checked={
                datos.materialSolicitado ||
                false
              }
              disabled={
                datos.materialConfirmado
              }
              onChange={(e) =>
                setDatos({

                  ...datos,

                  materialSolicitado:
                    e.target.checked,

                })
              }
            />

            {" "}
            Solicitado

          </label>

          <label
            style={{
              display: "block",
              marginBottom: 12,
            }}
          >

            <input
              type="checkbox"
              checked={
                datos.materialRecibido ||
                false
              }
              disabled={
                datos.materialConfirmado
              }
              onChange={(e) =>
                setDatos({

                  ...datos,

                  materialRecibido:
                    e.target.checked,

                })
              }
            />

            {" "}
            Recibido

          </label>

          <div
            style={{
              color:
                datos.materialSolicitado
                  ? "#16A34A"
                  : "#DC2626",
              marginTop: 10,
            }}
          >
            {datos.materialSolicitado

              ? "✅ Material Solicitado"

              : "❌ Material No Solicitado"}
          </div>

          <div
            style={{
              color:
                datos.materialRecibido
                  ? "#16A34A"
                  : "#DC2626",
              marginTop: 8,
            }}
          >
            {datos.materialRecibido

              ? "✅ Material Recibido"

              : "❌ Material No Recibido"}
          </div>

        </div>

        {/* COLUMNA 3 */}

        <div>

          {datos.materialConfirmado ? (

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
                    datos.materialConfirmadoPor
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
                    datos.materialConfirmadoFecha
                  }
                </div>

              </div>

              <button
                onClick={
                  desbloquearMaterial
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
                confirmarMaterial
              }
              style={{
                ...theme.button.primary,
                width: "100%",
              }}
            >
              🔒 Confirmar Material
            </button>

          )}

        </div>

      </div>

    </div>

  );
}

export default MaterialCard;