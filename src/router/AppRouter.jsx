import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import ProtectedRoute from "./ProtectedRoute";

import MainLayout from "../layouts/MainLayout";

import DashboardPage from "../pages/DashboardPage";

import SupervisionesPage from "../pages/SupervisionesPage";

import ExecutivePage from "../pages/ExecutivePage";

import HistorialPage from "../pages/HistorialPage";

import AdminPage from "../pages/AdminPage";

import useAuth from "../hooks/useAuth";

import {
  obtenerTecnicos,
} from "../services/tecnicosService";

import {
  obtenerSitios,
} from "../services/sitiosService";

export default function AppRouter() {

  const {
    supervisor,
  } = useAuth();

  const [
    tecnicos,
    setTecnicos,
  ] = useState([]);

  const [
    sitios,
    setSitios,
  ] = useState([]);

  // 🔥 CARGAR TECNICOS
  const cargarTecnicos =
    async () => {

      if (!supervisor) return;

      const datos =
        await obtenerTecnicos(
          supervisor
        );

      setTecnicos(datos);
    };

  // 🔥 CARGAR SITIOS
  const cargarSitios =
    async () => {

      if (!supervisor) return;

      const datos =
        await obtenerSitios(
          supervisor
        );

      setSitios(datos);
    };

  // 🔥 INICIALIZAR
  useEffect(() => {

    cargarTecnicos();

    cargarSitios();

  }, [supervisor]);

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<MainLayout />}
        >

          <Route
            index
            element={<DashboardPage />}
          />

          <Route
            path="supervisiones"
            element={
              <SupervisionesPage />
            }
          />

          <Route
            path="historial"
            element={
              <HistorialPage />
            }
          />

          <Route
            path="ejecutivo"
            element={
              <ExecutivePage />
            }
          />

          {/* 🔥 ADMIN */}
          <Route
            path="admin"
            element={

              <ProtectedRoute
                requireAdmin={
                  true
                }
              >

                <AdminPage
                  supervisor={
                    supervisor
                  }
                  tecnicos={
                    tecnicos
                  }
                  sitios={sitios}
                  cargarTecnicos={
                    cargarTecnicos
                  }
                  cargarSitios={
                    cargarSitios
                  }
                />

              </ProtectedRoute>

            }
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}