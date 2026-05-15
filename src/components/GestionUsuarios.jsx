import {
  useState,
  useEffect,
} from "react";

import {
  crearUsuario,
  obtenerUsuarios,
} from "../services/usuariosService";

import {
  obtenerSitios,
} from "../services/sitiosService";

function GestionUsuarios() {

  const [usuarios, setUsuarios] =
    useState([]);

  const [nombre, setNombre] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [rol, setRol] =
    useState("supervisor");

  const [
    supervisor,
    setSupervisor,
  ] = useState("");

  const [
    sitiosDisponibles,
    setSitiosDisponibles,
  ] = useState([]);

  const [
    sitiosAsignados,
    setSitiosAsignados,
  ] = useState([]);
const [
  supervisores,
  setSupervisores,
] = useState([]);

  // 🔥 NORMALIZAR ROLES
  const normalizarRol = (
    rol
  ) => {

    if (!rol)
      return "Sin rol";

    const r =
      rol.toLowerCase();

    if (
      r ===
      "administrador"
    ) {
      return "admin";
    }

    if (
      r === "técnico"
    ) {
      return "tecnico";
    }

    return r;
  };

  // 🔥 CARGAR USUARIOS
const cargarUsuarios =
  async () => {

    try {

      const data =
        await obtenerUsuarios();

      const usuariosData =
        data || [];

      setUsuarios(
        usuariosData
      );

      // 🔥 FILTRAR SUPERVISORES
      const supervisoresFiltrados =

        usuariosData.filter(
          (u) =>

            (
              u.rol || ""
            )
              .toLowerCase()
              .trim() ===
            "supervisor"
        );

      setSupervisores(
        supervisoresFiltrados
      );

    } catch (error) {

      console.log(
        "ERROR USUARIOS:",
        error
      );

      setUsuarios([]);

      setSupervisores([]);
    }
  };

  // 🔥 CARGAR SITIOS
  const cargarSitios =
    async () => {

      try {

        const data =
          await obtenerSitios(
            "",
            "superadmin"
          );

        setSitiosDisponibles(
          data || []
        );

      } catch (error) {

        console.log(
          "ERROR SITIOS:",
          error
        );

        setSitiosDisponibles(
          []
        );
      }
    };

  // 🔥 CARGAR DATOS
  useEffect(() => {

    cargarUsuarios();

    cargarSitios();

  }, []);

  // 🔥 CREAR USUARIO
  const handleCrearUsuario =
    async (e) => {

      e.preventDefault();

      if (
        !nombre ||
        !email ||
        !password
      ) {

        alert(
          "Completa todos los campos"
        );

        return;
      }

      const resp =
        await crearUsuario({

          nombre,

          email,

          password,

          rol,

          supervisor,

          sitiosAsignados,

        });

      if (resp.ok) {

        alert(
          "Usuario creado correctamente"
        );

        setNombre("");

        setEmail("");

        setPassword("");

        setRol(
          "supervisor"
        );

        // 🔥 LIMPIAR
        setSupervisor("");

        setSitiosAsignados([]);

        cargarUsuarios();

      } else {

        alert(
          resp.error
        );
      }
    };

  return (

    <div
      style={{

        background:
          "#111827",

        borderRadius:
          "20px",

        padding:
          "25px",

        color:
          "white",

        marginTop:
          "20px",

      }}
    >

      <h2
        style={{

          fontSize:
            "28px",

          marginBottom:
            "20px",

        }}
      >

        👨‍💼 Gestión de Usuarios

      </h2>

      {/* 🔥 FORMULARIO */}
      <form
        onSubmit={
          handleCrearUsuario
        }
      >

        <div
          style={{

            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",

            gap: "15px",

          }}
        >

          <input
            type="text"

            placeholder="Nombre"

            value={nombre}

            onChange={(e) =>
              setNombre(
                e.target.value
              )
            }

            style={inputStyle}
          />

          <input
            type="email"

            placeholder="Correo"

            value={email}

            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }

            style={inputStyle}
          />

          <input
            type="password"

            placeholder="Contraseña"

            value={password}

            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }

            style={inputStyle}
          />

          <select
            value={rol}

            onChange={(e) =>
              setRol(
                e.target.value
              )
            }

            style={inputStyle}
          >

            <option value="supervisor">
              Supervisor
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="superadmin">
              Superadmin
            </option>

            <option value="tecnico">
              Técnico
            </option>

          </select>

          {/* 🔥 TECNICO */}
          {
            rol ===
              "tecnico"

            && (

              <>

                <select

  value={supervisor}

  onChange={(e) =>
    setSupervisor(
      e.target.value
    )
  }

  style={inputStyle}
>

  <option value="">
    Seleccionar supervisor
  </option>

  {
    supervisores.map(
      (sup) => (

       <option
  key={sup.id}
  value={sup.nombre.trim()}
>

  {sup.nombre}

</option>
      )
    )
  }

</select>

                <select

                  multiple

                  value={
                    sitiosAsignados
                  }

                  onChange={(e) => {

                    const values =
                      Array.from(

                        e.target
                          .selectedOptions,

                        (option) =>
                          option.value
                      );

                    setSitiosAsignados(
                      values
                    );
                  }}

                  style={{
                    ...inputStyle,
                    minHeight:
                      "120px",
                  }}
                >

                  {
                    sitiosDisponibles.map(
                      (sitio) => (

                        <option
                          key={
                            sitio.id
                          }

                          value={
                            sitio.nombre
                          }
                        >

                          {
                            sitio.nombre
                          }

                        </option>
                      )
                    )
                  }

                </select>

              </>
            )
          }

        </div>

        <button
          type="submit"

          style={buttonStyle}
        >

          Crear Usuario

        </button>

      </form>

      {/* 🔥 LISTADO */}
      <div
        style={{
          marginTop: "30px",
        }}
      >

        <h3
          style={{
            marginBottom:
              "15px",
          }}
        >

          Usuarios Registrados

        </h3>

        <div
          style={{

            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit,minmax(280px,1fr))",

            gap: "15px",

          }}
        >

          {
            usuarios.map(
              (usuario) => (

                <div
                  key={usuario.id}

                  style={cardStyle}
                >

                  <h4
                    style={{
                      marginBottom:
                        "10px",
                    }}
                  >

                    {
                      usuario.nombre
                    }

                  </h4>

                  <p
                    style={{
                      color:
                        "#9CA3AF",
                    }}
                  >

                    {
                      usuario.email
                    }

                  </p>

                  <div
                    style={{

                      marginTop:
                        "10px",

                      display:
                        "inline-block",

                      background:
                        "#2563EB",

                      padding:
                        "5px 12px",

                      borderRadius:
                        "20px",

                      fontSize:
                        "14px",

                    }}
                  >

                    {
                      normalizarRol(
                        usuario.rol
                      )
                    }

                  </div>

                </div>
              )
            )
          }

        </div>

      </div>

    </div>
  );
}

// 🔥 ESTILOS
const inputStyle = {

  padding: "12px",

  borderRadius:
    "10px",

  border:
    "1px solid #374151",

  background:
    "#1F2937",

  color:
    "white",

  outline:
    "none",

  fontSize:
    "14px",
};

const buttonStyle = {

  marginTop:
    "20px",

  background:
    "#2563EB",

  color:
    "white",

  border:
    "none",

  padding:
    "12px 20px",

  borderRadius:
    "12px",

  cursor:
    "pointer",

  fontWeight:
    "bold",

  fontSize:
    "15px",
};

const cardStyle = {

  background:
    "#1F2937",

  padding:
    "18px",

  borderRadius:
    "15px",

  border:
    "1px solid #374151",
};

export default GestionUsuarios;