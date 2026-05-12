import {
  useState,
} from "react";

import theme
from "../styles/theme";

import {

  collection,

  addDoc,

  deleteDoc,

  doc,

} from "firebase/firestore";

import {
  db,
} from "../firebase";

function GestionTecnicos({

  supervisor,

  tecnicos,

  cargarTecnicos,

}) {

  const [

    nuevoTecnico,

    setNuevoTecnico,

  ] = useState("");

  // 🔥 AGREGAR
  const agregarTecnico =
    async () => {

      if (!nuevoTecnico)
        return;

      try {

        await addDoc(

          collection(
            db,
            "tecnicos"
          ),

          {

            nombre:
              nuevoTecnico,

            supervisor,

          }

        );

        setNuevoTecnico("");

        cargarTecnicos();

      } catch (error) {

        console.log(error);
      }
    };

  // 🔥 ELIMINAR
  const eliminarTecnico =
    async (id) => {

      const confirmar =
        window.confirm(
          "¿Eliminar técnico?"
        );

      if (!confirmar)
        return;

      try {

        await deleteDoc(

          doc(
            db,
            "tecnicos",
            id
          )

        );

        cargarTecnicos();

      } catch (error) {

        console.log(error);
      }
    };

  return (

    <div>

      {/* HEADER */}
      <div style={{
        marginBottom: "25px",
      }}>

        <h2 style={{
          ...theme.title,
          marginBottom: "10px",
        }}>

          👨‍🔧 Gestión de Técnicos

        </h2>

        <p style={{
          color:
            theme.colors.textLight,
        }}>

          Técnicos registrados:

          <span style={{
            color:
              theme.colors.primary,
            marginLeft: "8px",
            fontWeight: "bold",
          }}>

            {tecnicos.length}

          </span>

        </p>

      </div>

      {/* FORM */}
      <div style={{
        display: "flex",
        gap: "15px",
        flexWrap: "wrap",
        marginBottom: "30px",
      }}>

        <input

          type="text"

          placeholder="Nombre técnico"

          value={nuevoTecnico}

          onChange={(e) =>

            setNuevoTecnico(
              e.target.value
            )

          }

          style={{
            ...theme.input,
            flex: 1,
          }}

        />

        <button

          onClick={
            agregarTecnico
          }

          style={
            theme.button.primary
          }

        >

          ➕ Agregar

        </button>

      </div>

      {/* LISTA */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}>

        {tecnicos.map((t) => (

          <div

            key={t.id}

            style={{
              ...theme.card,

              border:
                `1px solid ${theme.colors.border}`,

              display: "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap: "20px",

              flexWrap: "wrap",
            }}

          >

            <p style={{
              margin: 0,

              fontSize: "20px",

              fontWeight: "bold",

              color:
                theme.colors.primary,
            }}>

              👨‍🔧 {t.nombre}

            </p>

            <button

              onClick={() =>

                eliminarTecnico(
                  t.id
                )

              }

              style={
                theme.button.danger
              }

            >

              🗑️ Eliminar

            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default GestionTecnicos;