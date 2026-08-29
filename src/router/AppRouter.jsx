
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

import ActividadesPage from "../pages/ActividadesPage";

import SupervisionesPage from "../pages/SupervisionesPage";

import HistorialPage from "../pages/HistorialPage";

import ConectividadPage from "../pages/ConectividadPage";

import AdminPage from "../pages/AdminPage";

import HistorialRotacionesPage from "../pages/HistorialRotacionesPage";

import DashboardEjecutivoPage from "../pages/DashboardEjecutivoPage";

import MantenimientoPage from "../pages/MantenimientoPage";

import MantenimientoDashboard from "../pages/MantenimientoDashboard";

import ControlReportesPage from "../pages/ControlReportesPage";

import LayoutsPage from "../pages/LayoutsPage";

// 🔍 NUEVO COMPARADOR JSON
import ResumenJsonPage from "../pages/ResumenJsonPage";


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


          {/* 🔥 CONECTIVIDAD */}
          <Route
            path="/conectividad"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "supervisor",
                  "admin",
                  "superadmin",
                ]}
              >

                <ConectividadPage />

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


          {/* 🔥 CONTROL REPORTES */}
          <Route
            path="/control-reportes"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "supervisor",
                  "admin",
                  "superadmin",
                ]}
              >

                <ControlReportesPage />

              </ProtectedRoute>

            }
          />


          {/* 🔍 COMPARADOR JSON */}
          <Route
            path="/comparador-json"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "supervisor",
                  "admin",
                  "superadmin",
                ]}
              >

                <ResumenJsonPage />

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


          {/* 🔥 DASHBOARD EJECUTIVO */}
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


          {/* 🔥 ACTIVIDADES */}
          <Route
            path="/actividades"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "supervisor",
                  "admin",
                  "superadmin",
                ]}
              >

                <ActividadesPage />

              </ProtectedRoute>

            }
          />


          {/* 🔥 LAYOUTS */}
          <Route
            path="/layouts"
            element={

              <ProtectedRoute
                allowedRoles={[
                  "supervisor",
                  "admin",
                  "superadmin",
                ]}
              >

                <LayoutsPage />

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
