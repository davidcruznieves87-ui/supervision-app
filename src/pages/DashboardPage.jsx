import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import theme from "../styles/theme";
import Header from "../components/Header";
import DashboardSupervisor from "../components/dashboard/DashboardSupervisor";
import { obtenerSupervisiones } from "../services/supervisionesService";

export default function DashboardPage() {

  const { usuario, loading } = useAuth();

  const [supervisiones, setSupervisiones] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {

    cargarDatos();

  }, []);

  const cargarDatos = async () => {

    try {

      const datos =
        await obtenerSupervisiones();

      setSupervisiones(datos);

    } catch (error) {

      console.error(error);

    } finally {

      setCargando(false);

    }
  };

  if (loading || cargando) {

    return (

      <div style={theme.layout.page}>

        <h2>Cargando Dashboard...</h2>

      </div>

    );
  }

  const supervisionesSupervisor =
    supervisiones.filter(
      (s) =>
        s.supervisor ===
        usuario?.nombre
    );

  return (

    <div style={theme.layout.page}>

      <Header
        supervisor={
          usuario?.nombre
        }
        online={true}
      />

      <div style={theme.layout.content}>

        <DashboardSupervisor
          supervisiones={
            supervisionesSupervisor
          }
          usuario={usuario}
        />

      </div>

    </div>

  );
}