import theme
from "../styles/theme";
import {
  eliminarSupervisionDB,
} from "../services/supervisionesService";

import {
  generarPDFSupervision,
} from "../utils/pdf/pdfSupervision";

import logo
from "../logo.png";

import Historial
from "../components/Historial";

import {
  useState,
  useEffect,
} from "react";

import {
  obtenerSupervisiones,
} from "../services/supervisionesService";

export default function HistorialPage() {

  const [
    supervisiones,
    setSupervisiones,
  ] = useState([]);

  // 🔥 CARGAR
  const cargarSupervisiones =
    async () => {

      const datos =
        await obtenerSupervisiones();

      setSupervisiones(datos);
    };

  useEffect(() => {

    cargarSupervisiones();

  }, []);

  // 🔥 PDF
 const generarPDF =
  async (s) => {

    await generarPDFSupervision({

      folio:
        s.folio,

      sitio:
        s.sitio,

      tecnico:
        s.tecnico,

      supervisor:
        s.supervisor,

      fechaHora:
        s.fechaHora,

      fallas:
        s.fallas || [],

    });
  };

    const eliminarSupervision =
  async (id) => {

    const confirmar =
      window.confirm(
        "¿Eliminar supervisión?"
      );

    if (!confirmar) return;

    const ok =
      await eliminarSupervisionDB(
        id
      );

    if (!ok) {

      alert(
        "❌ Error al eliminar"
      );

      return;
    }

    // 🔥 RECARGAR
    cargarSupervisiones();
  };
  return (

    <div style={theme.layout.page}>

      <div style={theme.layout.content}>

        <div style={theme.card}>

          <h1 style={theme.title}>

            🕘 Historial

          </h1>

          <Historial

            supervisiones={
              supervisiones
            }

            recuperarSupervision={
              generarPDF
            }

            eliminarSupervision={
  eliminarSupervision
}

          />

        </div>

      </div>

    </div>
  );
}