import theme from "../../styles/theme";

function ClienteCard({

  datos,
  setDatos,

  confirmarCliente,
  desbloquearCliente,

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
            🤝
          </div>

          <h3 style={{ margin: 0 }}>
            Cliente
          </h3>

        </div>

        {datos.clienteConfirmado && (

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
        }}
      >

        {/* COLUMNA 1 */}

        <div>

          <h4>
            Comunicación Cliente
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
                datos.clienteInformado ||
                false
              }

              disabled={
                datos.clienteConfirmado
              }

              onChange={(e) =>
                setDatos({

                  ...datos,

                  clienteInformado:
                    e.target.checked,

                })
              }
            />

            {" "}
            Cliente Informado

          </label>

          <label
            style={{
              display: "block",
            }}
          >

            <input
              type="checkbox"

              checked={
                datos.accesoConfirmado ||
                false
              }

              disabled={
                datos.clienteConfirmado
              }

              onChange={(e) =>
                setDatos({

                  ...datos,

                  accesoConfirmado:
                    e.target.checked,

                })
              }
            />

            {" "}
            Acceso Confirmado

          </label>

        </div>

        {/* COLUMNA 2 */}

        <div>

          <h4>
            Estado
          </h4>

          <div
            style={{
              color:
                datos.clienteInformado
                  ? "#16A34A"
                  : "#DC2626",
              marginBottom: 10,
            }}
          >
            {datos.clienteInformado

              ? "✅ Cliente Informado"

              : "❌ Cliente No Informado"}
          </div>

          <div
            style={{
              color:
                datos.accesoConfirmado
                  ? "#16A34A"
                  : "#DC2626",
            }}
          >
            {datos.accesoConfirmado

              ? "✅ Acceso Confirmado"

              : "❌ Acceso No Confirmado"}
          </div>

        </div>

        {/* COLUMNA 3 */}

        <div>

          {datos.clienteConfirmado ? (

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
                    datos.clienteConfirmadoPor
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
                    datos.clienteConfirmadoFecha
                  }
                </div>

              </div>

              <button
                onClick={
                  desbloquearCliente
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
                confirmarCliente
              }
              style={{
                ...theme.button.primary,
                width: "100%",
              }}
            >
              🔒 Confirmar Cliente
            </button>

          )}

        </div>

      </div>

    </div>

  );
}

export default ClienteCard;