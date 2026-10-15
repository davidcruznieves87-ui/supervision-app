import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// =====================================================
// LAYOUT Y PROTECCIÓN
// =====================================================
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

// =====================================================
// PÁGINAS
// =====================================================
import DashboardPage from "../pages/DashboardPage";
import ActividadesPage from "../pages/ActividadesPage";
import SupervisionesPage from "../pages/SupervisionesPage";
import LlamadosTecnicosPage from "../pages/LlamadosTecnicosPage";
import HojasServicioPage from "../pages/HojasServicioPage";
import HistorialPage from "../pages/HistorialPage";
import ConectividadPage from "../pages/ConectividadPage";
import AdminPage from "../pages/AdminPage";
import HistorialRotacionesPage from "../pages/HistorialRotacionesPage";
import DashboardEjecutivoPage from "../pages/DashboardEjecutivoPage";
import MantenimientoPage from "../pages/MantenimientoPage";
import MantenimientoDashboard from "../pages/MantenimientoDashboard";
import ResumenJsonPage from "../pages/ResumenJsonPage";
import NominaPage from "../pages/NominaPage";
import AuditoriaCorreosPage from "../pages/AuditoriaCorreosPage";

const rolesGestion = ["supervisor", "admin", "superadmin"];

function AppRouter({ usuario }) {
  return (
    <BrowserRouter>
      <MainLayout usuario={usuario}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisiones"
            element={
              <ProtectedRoute allowedRoles={["supervisor", "superadmin"]}>
                <SupervisionesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/conectividad"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <ConectividadPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/historial"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <HistorialPage usuario={usuario} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <AdminPage
                  usuario={usuario}
                  rol={usuario?.rol}
                  supervisor={usuario?.nombre || ""}
                  tecnicos={usuario?.tecnicos || []}
                  sitios={usuario?.sitios || []}
                  cargarTecnicos={() => {}}
                  cargarSitios={() => {}}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mantenimiento"
            element={
              <ProtectedRoute allowedRoles={["tecnico", "superadmin"]}>
                <MantenimientoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/comparador-json"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <ResumenJsonPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard-mantenimiento"
            element={
              <ProtectedRoute allowedRoles={["tecnico", ...rolesGestion]}>
                <MantenimientoDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/historial-rotaciones"
            element={
              <ProtectedRoute allowedRoles={["supervisor", "superadmin"]}>
                <HistorialRotacionesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard-ejecutivo"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <DashboardEjecutivoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/actividades"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <ActividadesPage />
              </ProtectedRoute>
            }
          />

          {/* ORION: LLAMADAS TÉCNICAS Y HOJAS DE SERVICIO */}
          <Route
            path="/llamados-tecnicos"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <LlamadosTecnicosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hojas-servicio"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <HojasServicioPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina"
            element={
              <ProtectedRoute allowedRoles={["supervisor", "superadmin"]}>
                <NominaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/auditoria-correos"
            element={
              <ProtectedRoute allowedRoles={rolesGestion}>
                <AuditoriaCorreosPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default AppRouter;
