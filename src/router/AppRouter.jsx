import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// 🔥 LAYOUT
import MainLayout from "../layouts/MainLayout";

// 🔥 PAGINAS
import DashboardPage from "../pages/DashboardPage";

import SupervisionesPage from "../pages/SupervisionesPage";

import HistorialPage from "../pages/HistorialPage";

import AdminPage from "../pages/AdminPage";

import MantenimientoPage from "../pages/MantenimientoPage";

import MantenimientoDashboard from "../pages/MantenimientoDashboard";

function AppRouter({
  usuario,
}) {

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
    "USUARIO APP ROUTER:",
    usuario
  );

  console.log(
    "ROL APP ROUTER:",
    rol
  );

  return (

    <BrowserRouter>

      <MainLayout
        usuario={usuario}
      >

        <Routes>

          {/* 🔥 SUPERADMIN */}
          {
            rol === "superadmin"

            && (

              <>

                <Route
                  path="/"
                  element={
                    <DashboardPage />
                  }
                />

                <Route
                  path="/supervisiones"
                  element={
                    <SupervisionesPage />
                  }
                />

                <Route
                  path="/historial"
                  element={
                    <HistorialPage
                      usuario={usuario}
                    />
                  }
                />

                <Route
                  path="/mantenimiento"
                  element={
                    <MantenimientoPage />
                  }
                />

                <Route
                  path="/dashboard-mantenimiento"
                  element={
                    <MantenimientoDashboard />
                  }
                />

                <Route
                  path="/admin"
                  element={

                    <AdminPage

                      usuario={usuario}

                      rol={rol}

                      supervisor={
                        usuario?.nombre || ""
                      }

                      tecnicos={
                        usuario?.tecnicos || []
                      }

                      sitios={
                        usuario?.sitios || []
                      }

                      cargarTecnicos={() => {}}

                      cargarSitios={() => {}}

                    />
                  }
                />

                <Route
                  path="*"
                  element={
                    <Navigate to="/" />
                  }
                />

              </>
            )
          }

          {/* 🔥 ADMIN */}
          {
            rol === "admin"

            && (

              <>

                <Route
                  path="/"
                  element={
                    <DashboardPage />
                  }
                />

                <Route
                  path="/admin"
                  element={

                    <AdminPage

                      usuario={usuario}

                      rol={rol}

                      supervisor={
                        usuario?.nombre || ""
                      }

                      tecnicos={
                        usuario?.tecnicos || []
                      }

                      sitios={
                        usuario?.sitios || []
                      }

                      cargarTecnicos={() => {}}

                      cargarSitios={() => {}}

                    />
                  }
                />

                <Route
                  path="/historial"
                  element={
                    <HistorialPage
                      usuario={usuario}
                    />
                  }
                />

                <Route
                  path="/dashboard-mantenimiento"
                  element={
                    <MantenimientoDashboard />
                  }
                />

                <Route
                  path="*"
                  element={
                    <Navigate to="/" />
                  }
                />

              </>
            )
          }

          {/* 🔥 SUPERVISOR */}
          {
            rol === "supervisor"

            && (

              <>

                <Route
                  path="/"
                  element={
                    <DashboardPage />
                  }
                />

                <Route
                  path="/supervisiones"
                  element={
                    <SupervisionesPage />
                  }
                />

                <Route
                  path="/historial"
                  element={
                    <HistorialPage
                      usuario={usuario}
                    />
                  }
                />

                <Route
                  path="/admin"
                  element={

                    <AdminPage

                      usuario={usuario}

                      rol={rol}

                      supervisor={
                        usuario?.nombre || ""
                      }

                      tecnicos={
                        usuario?.tecnicos || []
                      }

                      sitios={
                        usuario?.sitios || []
                      }

                      cargarTecnicos={() => {}}

                      cargarSitios={() => {}}

                    />
                  }
                />

                <Route
                  path="/dashboard-mantenimiento"
                  element={
                    <MantenimientoDashboard />
                  }
                />

                <Route
                  path="*"
                  element={
                    <Navigate to="/" />
                  }
                />

              </>
            )
          }

          {/* 🔥 TECNICO */}
          {
            rol === "tecnico"

            && (

              <>

                <Route
                  path="/mantenimiento"
                  element={
                    <MantenimientoPage />
                  }
                />

                <Route
                  path="/dashboard-mantenimiento"
                  element={
                    <MantenimientoDashboard />
                  }
                />

                <Route
                  path="*"
                  element={
                    <Navigate
                      to="/mantenimiento"
                    />
                  }
                />

              </>
            )
          }

          {/* 🔥 SIN ROL */}
          {
            !rol

            && (

              <Route
                path="*"
                element={
                  <Navigate to="/" />
                }
              />
            )
          }

        </Routes>

      </MainLayout>

    </BrowserRouter>
  );
}

export default AppRouter;