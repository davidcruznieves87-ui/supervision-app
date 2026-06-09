import theme from "../../styles/theme";

function ActividadForm({

  formulario,
  setFormulario,

  guardarActividad,

}) {

  return (

    <div style={theme.card}>

      <h2
        style={{
          color: theme.colors.text,
          marginBottom: 24,
          fontWeight: 800,
        }}
      >
        ➕ Nueva Actividad
      </h2>

      <div
        style={{

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit,minmax(280px,1fr))",

          gap: 20,

        }}
      >

        <div>

          <label>
            AF
          </label>

          <input
            style={theme.input}
            value={formulario.af}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                af: e.target.value,
              })
            }
          />

        </div>

        <div>

          <label>
            Proyecto
          </label>

          <input
            style={theme.input}
            value={formulario.proyecto}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                proyecto:
                  e.target.value,
              })
            }
          />

        </div>

        <div>

          <label>
            Sala
          </label>

          <input
            style={theme.input}
            value={formulario.sala}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                sala:
                  e.target.value,
              })
            }
          />

        </div>

        <div>

          <label>
            Tipo Actividad
          </label>

          <input
            style={theme.input}
            value={
              formulario.tipoActividad
            }
            onChange={(e) =>
              setFormulario({
                ...formulario,
                tipoActividad:
                  e.target.value,
              })
            }
          />

        </div>

        <div>

          <label>
            Cliente
          </label>

          <input
            style={theme.input}
            value={
              formulario.cliente
            }
            onChange={(e) =>
              setFormulario({
                ...formulario,
                cliente:
                  e.target.value,
              })
            }
          />

        </div>

        <div>

          <label>
            Fecha Límite
          </label>

          <input
            type="date"
            style={theme.input}
            value={
              formulario.fechaLimite
            }
            onChange={(e) =>
              setFormulario({
                ...formulario,
                fechaLimite:
                  e.target.value,
              })
            }
          />

        </div>

      </div>

      <div
        style={{
          marginTop: 10,
        }}
      >

        <label>
          Observaciones
        </label>

        <textarea

          style={{
            ...theme.input,
            minHeight: 120,
            resize: "vertical",
          }}

          value={
            formulario.observaciones || ""
          }

          onChange={(e) =>
            setFormulario({
              ...formulario,
              observaciones:
                e.target.value,
            })
          }

        />

      </div>

      <div
        style={{
          marginTop: 24,
        }}
      >

        <button
          onClick={
            guardarActividad
          }
          style={
            theme.button.primary
          }
        >
          💾 Guardar Actividad
        </button>

      </div>

    </div>
  );
}

export default ActividadForm;