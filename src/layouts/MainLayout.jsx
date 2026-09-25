import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  signOut,
} from "firebase/auth";

import {
  auth,
} from "../firebase";

import theme from "../styles/theme";


function MainLayout({
  children,
  usuario,
}) {

  const location = useLocation();
  const navigate = useNavigate();


  // =====================================================
  // NORMALIZAR ROL
  // =====================================================

  const rol = (
    usuario?.rol || ""
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );


  console.log(
    "ROL ACTUAL:",
    rol
  );


  // =====================================================
  // MENU
  // =====================================================

  let menu = [];


  // =====================================================
  // SUPERADMIN
  // =====================================================

  if (rol === "superadmin") {

    menu = [

      {
        nombre: "📊 Dashboard",
        ruta: "/",
      },

      {
        nombre: "📝 Supervisiones",
        ruta: "/supervisiones",
      },

      {
        nombre: "📁 Historial",
        ruta: "/historial",
      },

      {
        nombre: "🔨 Mantenimientos",
        ruta: "/mantenimiento",
      },

      {
        nombre: "📈 Dashboard MTTO",
        ruta: "/dashboard-mantenimiento",
      },

      {
        nombre: "👨‍💼 Administración",
        ruta: "/admin",
      },

      {
        nombre: "📊 Dashboard Ejecutivo",
        ruta: "/dashboard-ejecutivo",
      },

      {
        nombre: "🔍 Comparador JSON",
        ruta: "/comparador-json",
      },

      {
        nombre: "🌐 Conectividad",
        ruta: "/conectividad",
      },

      {
        nombre: "📋 Actividades",
        ruta: "/actividades",
      },

      {
        nombre: "💰 Nómina",
        ruta: "/nomina",
      },

      {
  nombre: "📧 Auditoría Correos",
  ruta: "/auditoria-correos",
},


    ];
  }


  // =====================================================
  // SUPERVISOR
  // =====================================================

  else if (rol === "supervisor") {

    menu = [

      {
        nombre: "📊 Dashboard",
        ruta: "/",
      },

      {
        nombre: "📝 Supervisiones",
        ruta: "/supervisiones",
      },

      {
        nombre: "📁 Historial",
        ruta: "/historial",
      },

      {
        nombre: "🔄 Rotaciones",
        ruta: "/historial-rotaciones",
      },

      {
        nombre: "👨‍💼 Administración",
        ruta: "/admin",
      },

      {
        nombre: "📈 Mantenimientos Realizados",
        ruta: "/dashboard-mantenimiento",
      },

      {
        nombre: "📊 Dashboard Ejecutivo",
        ruta: "/dashboard-ejecutivo",
      },

      {
        nombre: "🔍 Comparador JSON",
        ruta: "/comparador-json",
      },

      {
        nombre: "🌐 Conectividad",
        ruta: "/conectividad",
      },

      {
        nombre: "📋 Actividades",
        ruta: "/actividades",
      },

      {
        nombre: "💰 Nómina",
        ruta: "/nomina",
      },

      {
  nombre: "📧 Auditoría Correos",
  ruta: "/auditoria-correos",
},


    ];
  }


  // =====================================================
  // ADMIN
  // =====================================================

  else if (rol === "admin") {

    menu = [

      {
        nombre: "📊 Dashboard",
        ruta: "/",
      },

      {
        nombre: "👨‍💼 Administración",
        ruta: "/admin",
      },

      {
        nombre: "📁 Historial",
        ruta: "/historial",
      },

      {
        nombre: "📈 Dashboard General",
        ruta: "/dashboard-mantenimiento",
      },

      {
        nombre: "📊 Dashboard Ejecutivo",
        ruta: "/dashboard-ejecutivo",
      },

      {
        nombre: "🔍 Comparador JSON",
        ruta: "/comparador-json",
      },

      {
        nombre: "🌐 Conectividad",
        ruta: "/conectividad",
      },

      {
        nombre: "📋 Actividades",
        ruta: "/actividades",
      },

{
  nombre: "📧 Auditoría Correos",
  ruta: "/auditoria-correos",
},

    ];
  }


  // =====================================================
  // TECNICO
  // =====================================================

  else if (rol === "tecnico") {

    menu = [

      {
        nombre: "🔨 Mantenimiento",
        ruta: "/mantenimiento",
      },

      {
        nombre: "📈 Dashboard MTTO",
        ruta: "/dashboard-mantenimiento",
      },

    ];
  }


  // =====================================================
  // CERRAR SESION
  // =====================================================

  const cerrarSesion = async () => {

    try {

      await signOut(auth);

      navigate("/login");

    } catch (error) {

      console.error(
        "Error al cerrar sesión:",
        error
      );

    }

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      style={{

        display: "flex",

        minHeight: "100vh",

        background:
          theme.colors.sidebar,

      }}
    >

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        style={{

          width: "260px",

          background:
            theme.sidebar.container.background,

          padding: "20px",

          color: "white",

          borderRight:
            theme.sidebar.container.borderRight,

          boxShadow:
            theme.sidebar.container.boxShadow,

          boxSizing: "border-box",

          flexShrink: 0,

        }}
      >

        {/* TITULO */}

        <h1
          style={{

            marginBottom: "40px",

            fontSize: "28px",

            fontWeight: "900",

          }}
        >

          🎰 Sistema

        </h1>


        {/* MENU */}

        <nav
          style={{

            display: "flex",

            flexDirection: "column",

            gap: "15px",

          }}
        >

          {
            menu.map(
              (item) => {

                const activo =
                  location.pathname ===
                  item.ruta;

                return (

                  <Link
                    key={item.ruta}

                    to={item.ruta}

                    style={{

                      ...theme.sidebar.link,

                      display: "block",

                      background: activo

                        ? "linear-gradient(135deg,#06B6D4,#2563EB)"

                        : theme.sidebar.link.background,

                      color: "white",

                      padding: "18px",

                      borderRadius: "15px",

                      boxShadow: activo
                        ? "0 8px 20px rgba(37,99,235,0.20)"
                        : "none",

                    }}
                  >

                    {item.nombre}

                  </Link>

                );

              }
            )
          }

        </nav>


        {/* =================================================
            USUARIO
        ================================================= */}

        <div
          style={{

            marginTop: "40px",

            padding: "15px",

            background:
              "rgba(255,255,255,0.05)",

            borderRadius: "15px",

            border:
              "1px solid rgba(255,255,255,0.05)",

          }}
        >

          <div
            style={{

              fontWeight: "800",

            }}
          >

            {
              usuario?.nombre ||
              "Usuario"
            }

          </div>


          <div
            style={{

              marginTop: "5px",

              color: "#94A3B8",

              fontSize: "14px",

            }}
          >

            Rol: {rol || "sin rol"}

          </div>

        </div>


        {/* =================================================
            CERRAR SESION
        ================================================= */}

        <button
          onClick={
            cerrarSesion
          }

          style={{

            ...theme.button.danger,

            marginTop: "20px",

            width: "100%",

          }}
        >

          Cerrar sesión

        </button>

      </aside>


      {/* =================================================
          CONTENIDO
      ================================================= */}

      <main
        style={{

          flex: 1,

          minWidth: 0,

          padding: "20px",

          background:
            theme.colors.background,

        }}
      >

        {children}

      </main>

    </div>

  );

}


export default MainLayout;