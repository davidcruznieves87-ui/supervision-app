import {
  useState,
} from "react";

import theme
from "../styles/theme";


import SubidaReportes
from "../components/reportes/SubidaReportes";

import TablaCumplimiento
from "../components/reportes/TablaCumplimiento";

import DashboardControlReportes
from "../components/reportes/DashboardControlReportes";

import {
  guardarControlReportes,
}
from "../services/controlReportesService";

function ControlReportesPage() {

  const [
    resultados,
    setResultados,
  ] = useState([]);

  const [
    resetUpload,
    setResetUpload,
  ] = useState(false);

  // -------------------
  // GUARDAR
  // -------------------

  const guardar =
  async () => {

    try {

      await guardarControlReportes(
        resultados
      );

      // LIMPIAR
      setResultados([]);

      // RESET INPUT
      setResetUpload(
        (prev) => !prev
      );

      alert(
        "✅ Reportes guardados"
      );

    } catch (error) {

      console.error(
        error
      );

      alert(
        "❌ Error guardando"
      );

    }

  };

  return (

    <div
      style={{
        padding: "30px",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          ...theme.card,
        }}
      >

        <h1
          style={{
            ...theme.title,
          }}
        >

          📦 Control Inteligente de Reportes

        </h1>

        {/* SUBIDA */}

        <SubidaReportes

          setResultados={
            setResultados
          }

          resetUpload={
            resetUpload
          }

        />

        {/* BOTON GUARDAR */}

        {resultados.length > 0 && (

          <button
            onClick={guardar}
            style={{
              ...theme.button.success,

              marginBottom:
                "20px",
            }}
          >

            💾 Guardar Reportes

          </button>

        )}

      </div>

      {/* TABLA */}

      {resultados.length > 0 && (

        <div
          style={{
            ...theme.card,
          }}
        >

          <TablaCumplimiento
            resultados={
              resultados
            }
          />

        </div>

      )}

      {/* DASHBOARD */}

      <DashboardControlReportes />

    </div>

  );

}

export default
ControlReportesPage;