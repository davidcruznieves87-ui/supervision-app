import { useState } from "react";

import theme from "../styles/theme";

import GestionTecnicos from "../components/GestionTecnicos";

import GestionSitios from "../components/GestionSitios";

export default function AdminPage({
  supervisor,
  tecnicos,
  sitios,
  cargarTecnicos,
  cargarSitios,
}) {
  const [seccion, setSeccion] =
    useState("tecnicos");

  return (
    <div style={theme.layout.page}>
      <div style={theme.layout.content}>
        {/* HEADER */}
        <div
          style={{
            ...theme.card,
            marginBottom: "25px",
          }}
          className="border border-gray-200"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h1
                style={{
                  ...theme.title,
                  marginBottom: "10px",
                }}
              >
                ⚙️ Panel Administrativo
              </h1>

              <p
                style={{
                  color:
                    theme.colors
                      .textLight,
                }}
                className="text-lg"
              >
                Gestión operativa del
                sistema de supervisión
              </p>
            </div>

            {/* STATS */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-cyan-50 border border-cyan-200 rounded-2xl px-6 py-4 min-w-[140px]">
                <p className="text-sm font-bold text-gray-500">
                  TÉCNICOS
                </p>

                <p className="text-3xl font-black text-cyan-700">
                  {tecnicos?.length ||
                    0}
                </p>
              </div>

              <div className="bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 min-w-[140px]">
                <p className="text-sm font-bold text-gray-500">
                  SITIOS
                </p>

                <p className="text-3xl font-black text-slate-700">
                  {sitios?.length ||
                    0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MENU */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* TECNICOS */}
          <button
            onClick={() =>
              setSeccion(
                "tecnicos"
              )
            }
            style={
              seccion ===
              "tecnicos"
                ? theme.button
                    .primary
                : {
                    ...theme.button
                      .primary,
                    background:
                      "#e5e7eb",
                    color:
                      "#111827",
                  }
            }
            className="hover:scale-105 transition-all duration-300 shadow-lg"
          >
            👨‍🔧 Técnicos
          </button>

          {/* SITIOS */}
          <button
            onClick={() =>
              setSeccion(
                "sitios"
              )
            }
            style={
              seccion ===
              "sitios"
                ? theme.button
                    .primary
                : {
                    ...theme.button
                      .primary,
                    background:
                      "#e5e7eb",
                    color:
                      "#111827",
                  }
            }
            className="hover:scale-105 transition-all duration-300 shadow-lg"
          >
            📍 Sitios
          </button>
        </div>

        {/* CONTENIDO */}
        <div>
          {/* TECNICOS */}
          {seccion ===
            "tecnicos" && (
            <GestionTecnicos
              supervisor={
                supervisor
              }
              tecnicos={
                tecnicos || []
              }
              cargarTecnicos={
                cargarTecnicos
              }
            />
          )}

          {/* SITIOS */}
          {seccion ===
            "sitios" && (
            <GestionSitios
              supervisor={
                supervisor
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
            />
          )}
        </div>
      </div>
    </div>
  );
}