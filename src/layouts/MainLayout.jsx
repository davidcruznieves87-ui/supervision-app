
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


function MainLayout({

  children,

  usuario,
}) {

  const location =
    useLocation();

  const navigate =
    useNavigate();


  // 🔥 NORMALIZAR ROL
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


  // 🔥 MENU
  let menu = [];


  // =====================================================
  // SUPERADMIN
  // =====================================================

  if (
    rol === "superadmin"
  ) {

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
        nombre: "📦 Control Reportes",
        ruta: "/control-reportes",
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
        nombre: "📐 Layouts",
        ruta: "/layouts",
      },

    ];
  }


  // =====================================================
  // SUPERVISOR
  // =====================================================

  else if (
    rol === "supervisor"
  ) {

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
        nombre: "📦 Control Reportes",
        ruta: "/control-reportes",
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
        nombre: "📐 Layouts",
        ruta: "/layouts",
      },

    ];
  }


  // =====================================================
  // ADMIN
  // =====================================================

  else if (
    rol === "admin"
  ) {

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
        nombre: "📦 Control Reportes",
        ruta: "/control-reportes",
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
        nombre: "📐 Layouts",
        ruta: "/layouts",
      },

    ];
  }


  // =====================================================
  // TECNICO
  // =====================================================

  else if (
    rol === "tecnico"
  ) {

    menu = [

      {
        nombre:
          "🔨 Mantenimiento",

        ruta:
          "/mantenimiento",
      },

      {
        nombre:
          "📈 Dashboard MTTO",

        ruta:
          "/dashboard-mantenimiento",
      },

    ];
  }


  // =====================================================
  // LOGOUT
  // =====================================================

  const cerrarSesion =
    async () => {

      try {

        await signOut(
          auth
        );

        navigate(
          "/login"
        );

      } catch (
        error
      ) {

        console.log(
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

        display:
          "flex",

        minHeight:
          "100vh",

        background:
          "#0F172A",

      }}
    >

      {/* 🔥 SIDEBAR */}

      <aside
        style={{

          width:
            "260px",

          background:
            "#020617",

          padding:
            "20px",

          color:
            "white",

          borderRight:
            "1px solid #1E293B",

          boxSizing:
            "border-box",

          flexShrink:
            0,

        }}
      >

        {/* 🔥 TITULO */}

        <h1
          style={{

            marginBottom:
              "40px",

            fontSize:
              "28px",

            fontWeight:
              "bold",

          }}
        >

          🎰 Sistema

        </h1>


        {/* 🔥 MENU */}

        <nav
          style={{

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "15px",

          }}
        >

          {
            menu.map(
              (item) => (

                <Link
                  key={
                    item.ruta
                  }

                  to={
                    item.ruta
                  }

                  style={{

                    textDecoration:
                      "none",

                    background:

                      location.pathname ===
                      item.ruta

                        ? "#2563EB"

                        : "#132238",

                    color:
                      "white",

                    padding:
                      "18px",

                    borderRadius:
                      "15px",

                    fontWeight:
                      "bold",

                  }}
                >

                  {
                    item.nombre
                  }

                </Link>

              )
            )
          }

        </nav>


        {/* 🔥 USUARIO */}

        <div
          style={{

            marginTop:
              "40px",

            padding:
              "15px",

            background:
              "#111827",

            borderRadius:
              "15px",

          }}
        >

          <div
            style={{
              fontWeight:
                "bold",
            }}
          >

            {
              usuario?.nombre ||
              "Usuario"
            }

          </div>


          <div
            style={{

              marginTop:
                "5px",

              color:
                "#94A3B8",

              fontSize:
                "14px",

            }}
          >

            Rol:
            {" "}
            {
              rol ||
              "sin rol"
            }

          </div>

        </div>


        {/* 🔥 LOGOUT */}

        <button

          onClick={
            cerrarSesion
          }

          style={{

            marginTop:
              "20px",

            width:
              "100%",

            background:
              "#EF4444",

            border:
              "none",

            color:
              "white",

            padding:
              "16px",

            borderRadius:
              "15px",

            fontWeight:
              "bold",

            cursor:
              "pointer",

          }}
        >

          Cerrar sesión

        </button>

      </aside>


      {/* 🔥 CONTENIDO */}

      <main
        style={{

          flex:
            1,

          minWidth:
            0,

          padding:
            "20px",

          background:
            "#F1F5F9",

        }}
      >

        {children}

      </main>

    </div>
  );
}


export default MainLayout;

