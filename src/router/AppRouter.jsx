import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// 🔥 LAYOUT
import MainLayout from "../layouts/MainLayout";

// 🔥 ROUTE
import ProtectedRoute from "./ProtectedRoute";

// 🔥 PAGINAS
import DashboardPage from "../pages/DashboardPage";

import SupervisionesPage from "../pages/SupervisionesPage";

import HistorialPage from "../pages/HistorialPage";

import AdminPage from "../pages/AdminPage";

import HistorialRotacionesPage from "../pages/HistorialRotacionesPage";

import DashboardEjecutivoPage from "../pages/DashboardEjecutivoPage";

import MantenimientoPage from "../pages/MantenimientoPage";

import MantenimientoDashboard from "../pages/MantenimientoDashboard";

function AppRouter({
  usuario,
}) {

  return (

    <BrowserRouter>

      <MainLayout
        usuario={usuario}
      >

        <Routes>

          {/* 🔥 DASHBOARD */}
          <Route
            path="/"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "supervisor",
                  "admin",
                  "superadmin",
                ]}
              >

                <DashboardPage />

              </ProtectedRoute>

            }
          />

          {/* 🔥 SUPERVISIONES */}
          <Route
            path="/supervisiones"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "supervisor",
                  "superadmin",
                ]}
              >

                <SupervisionesPage />

              </ProtectedRoute>

            }
          />

          {/* 🔥 HISTORIAL */}
          <Route
            path="/historial"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "supervisor",
                  "admin",
                  "superadmin",
                ]}
              >

                <HistorialPage
                  usuario={usuario}
                />

              </ProtectedRoute>

            }
          />

          {/* 🔥 ADMIN */}
          <Route
            path="/admin"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "supervisor",
                  "admin",
                  "superadmin",
                ]}
              >

                <AdminPage

                  usuario={usuario}

                  rol={
                    usuario?.rol
                  }

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

              </ProtectedRoute>

            }
          />

          {/* 🔥 MANTENIMIENTO */}
          <Route
            path="/mantenimiento"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "tecnico",
                  "superadmin",
                ]}
              >

                <MantenimientoPage />

              </ProtectedRoute>

            }
          />

          {/* 🔥 DASHBOARD MTTO */}
          <Route
            path="/dashboard-mantenimiento"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "tecnico",
                  "supervisor",
                  "admin",
                  "superadmin",
                ]}
              >

                <MantenimientoDashboard />

              </ProtectedRoute>

            }
          />
{/* 🔥 HISTORIAL ROTACIONES */}
<Route
  path="/historial-rotaciones"
  element={

    <ProtectedRoute
      allowedRoles={[
        "supervisor",
        "superadmin",
      ]}
    >

      <HistorialRotacionesPage />

    </ProtectedRoute>

  }
/>

<Route
  path="/dashboard-ejecutivo"
  element={

    <ProtectedRoute
      allowedRoles={[
        "supervisor",
        "admin",
        "superadmin",
      ]}
    >

      <DashboardEjecutivoPage />

    </ProtectedRoute>
  }
/>
          {/* 🔥 FALLBACK */}
          <Route
            path="*"
            element={
              <Navigate to="/" />
            }
          />

        </Routes>

      </MainLayout>

    </BrowserRouter>
  );
}

export default AppRouter;