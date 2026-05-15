import { useState } from "react";

import theme from "../styles/theme";

import GestionSitios from "../components/GestionSitios";

import GestionUsuarios from "../components/GestionUsuarios";

function AdminPage({

  usuario,

  supervisor,

  rol,

  tecnicos,

  sitios,

  cargarSitios,

  cargarTecnicos,

}) {

  const [
    seccion,
    setSeccion,
  ] = useState("sitios");

  // 🔥 NORMALIZAR ROL
  const rolNormalizado =
    (
      rol ||
      usuario?.rol ||
      ""
    )
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  return (

    <div style={theme.layout.page}>

      <div style={theme.layout.content}>

        {/* HEADER */}
        <div
          style={{
            ...theme.card,
            marginBottom: 25,
          }}
        >

          <h1 style={theme.title}>

            ⚙️ Panel Administrativo

          </h1>

          <p
            style={{
              color:
                theme.colors.textLight,
            }}
          >

            Gestión operativa del sistema

          </p>

        </div>

        {/* MENU */}
        <div
          className="flex gap-4 mb-8"
        >

          {/* SITIOS */}
          <button

            onClick={() =>
              setSeccion(
                "sitios"
              )
            }

            style={
              theme.button.primary
            }

          >

            📍 Sitios

          </button>

          {/* 🔥 SOLO ADMIN/SUPERADMIN */}
          {
            (
              rolNormalizado ===
                "admin"

              ||

              rolNormalizado ===
                "superadmin"
            )

            && (

              <button

                onClick={() =>
                  setSeccion(
                    "usuarios"
                  )
                }

                style={
                  theme.button.primary
                }

              >

                👨‍💼 Usuarios

              </button>
            )
          }

        </div>

        {/* 🔥 CONTENIDO SITIOS */}
        {

          seccion ===
            "sitios"

          && (

            <GestionSitios

              supervisor={
                supervisor
              }

              rol={
                rolNormalizado
              }

              tecnicos={
                tecnicos || []
              }

              sitios={
                sitios || []
              }

              cargarSitios={
                cargarSitios
              }

              cargarTecnicos={
                cargarTecnicos
              }

            />
          )
        }

        {/* 🔥 CONTENIDO USUARIOS */}
        {

          seccion ===
            "usuarios"

          &&

          (
            rolNormalizado ===
              "admin"

            ||

            rolNormalizado ===
              "superadmin"
          )

          && (

            <GestionUsuarios />

          )
        }

      </div>

    </div>
  );
}

export default AdminPage;