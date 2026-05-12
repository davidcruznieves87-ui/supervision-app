import theme
from "../styles/theme";

import Dashboard
from "./Dashboard";

import ExecutiveDashboard
from "./ExecutiveDashboard";

import Historial
from "./Historial";

function DashboardSection({

  esSuperSupervisor,

  supervisiones,

  supervisionesMesActual,

  recuperarSupervision,

  eliminarSupervision,

}) {

  return (

    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    }}>

      {/* DASHBOARD */}
      <div style={theme.card}>

        {esSuperSupervisor ? (

          <ExecutiveDashboard
            supervisiones={supervisiones}
          />

        ) : (

          <Dashboard
            supervisiones={
              supervisionesMesActual
            }
          />

        )}

      </div>

      {/* HISTORIAL */}
      <div style={theme.card}>

        <Historial

          supervisiones={
            supervisionesMesActual
          }

          recuperarSupervision={
            recuperarSupervision
          }

          eliminarSupervision={
            eliminarSupervision
          }

        />

      </div>

    </div>
  );
}

export default DashboardSection;