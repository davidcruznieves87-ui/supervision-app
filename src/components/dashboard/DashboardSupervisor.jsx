import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import theme from "../../styles/theme";

export default function DashboardSupervisor({
  supervisiones,
  usuario,
}) {

  const totalSupervisiones =
    supervisiones.length;

  const totalFallas =
    supervisiones.reduce(
      (acc, s) =>
        acc +
        (s.fallas?.length || 0),
      0
    );

  const fallasAltas =
    supervisiones.reduce(
      (acc, s) =>
        acc +
        (s.fallas || []).filter(
          (f) =>
            f.urgencia === "Alta"
        ).length,
      0
    );

  const fallasCriticas =
    supervisiones.reduce(
      (acc, s) =>
        acc +
        (s.fallas || []).filter(
          (f) =>
            f.urgencia === "Crítica"
        ).length,
      0
    );

  const sitiosUnicos =
    new Set(
      supervisiones.map(
        (s) => s.sitio
      )
    ).size;

  // 🔥 SITIOS

  const sitiosMap = {};

  supervisiones.forEach((s) => {

    if (!sitiosMap[s.sitio]) {

      sitiosMap[s.sitio] = 0;

    }

    sitiosMap[s.sitio] +=
      s.fallas?.length || 0;

  });

  const topSitios =
    Object.entries(
      sitiosMap
    )
      .map(
        ([name, value]) => ({
          name,
          value,
        })
      )
      .sort(
        (a, b) =>
          b.value - a.value
      )
      .slice(0, 10);

  // 🔥 TECNICOS

  const tecnicosMap = {};

  supervisiones.forEach((s) => {

    if (!tecnicosMap[s.tecnico]) {

      tecnicosMap[s.tecnico] = 0;

    }

    tecnicosMap[s.tecnico] +=
      s.fallas?.length || 0;

  });

  const topTecnicos =
    Object.entries(
      tecnicosMap
    )
      .map(
        ([name, value]) => ({
          name,
          value,
        })
      )
      .sort(
        (a, b) =>
          b.value - a.value
      )
      .slice(0, 10);

  // 🔥 URGENCIAS

  const urgencias = [

    {
      name: "Baja",
      value:
        supervisiones.reduce(
          (acc, s) =>
            acc +
            (s.fallas || []).filter(
              (f) =>
                f.urgencia ===
                "Baja"
            ).length,
          0
        ),
    },

    {
      name: "Media",
      value:
        supervisiones.reduce(
          (acc, s) =>
            acc +
            (s.fallas || []).filter(
              (f) =>
                f.urgencia ===
                "Media"
            ).length,
          0
        ),
    },

    {
      name: "Alta",
      value:
        supervisiones.reduce(
          (acc, s) =>
            acc +
            (s.fallas || []).filter(
              (f) =>
                f.urgencia ===
                "Alta"
            ).length,
          0
        ),
    },

    {
      name: "Crítica",
      value:
        supervisiones.reduce(
          (acc, s) =>
            acc +
            (s.fallas || []).filter(
              (f) =>
                f.urgencia ===
                "Crítica"
            ).length,
          0
        ),
    },

  ];

  const COLORS = [
    "#22C55E",
    "#FACC15",
    "#FB923C",
    "#EF4444",
  ];

  return (

    <div>

      <h1 style={theme.title}>

        📊 Dashboard Supervisor

      </h1>

      <p
        style={{
          color:
            theme.colors.textLight,
          marginBottom: "25px",
        }}
      >

        Bienvenido {
          usuario?.nombre
        }

      </p>

      {/* KPIS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >

        <div style={theme.card}>
          <h3>
            📋 Supervisiones
          </h3>
          <h1>
            {
              totalSupervisiones
            }
          </h1>
        </div>

        <div style={theme.card}>
          <h3>
            ⚠️ Fallas
          </h3>
          <h1>
            {totalFallas}
          </h1>
        </div>

        <div style={theme.card}>
          <h3>
            🟠 Altas
          </h3>
          <h1>
            {fallasAltas}
          </h1>
        </div>

        <div style={theme.card}>
          <h3>
            🔴 Críticas
          </h3>
          <h1>
            {fallasCriticas}
          </h1>
        </div>

        <div style={theme.card}>
          <h3>
            🏢 Sitios
          </h3>
          <h1>
            {sitiosUnicos}
          </h1>
        </div>

      </div>

      {/* GRAFICAS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "25px",
        }}
      >

        <div style={theme.card}>

          <h3>
            🏢 Sitios con más incidencias
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart
              data={topSitios}
            >

              <XAxis
                dataKey="name"
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="value"
                fill={
                  theme.colors.primary
                }
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        <div style={theme.card}>

          <h3>
            👨‍🔧 Técnicos con más incidencias
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart
              data={topTecnicos}
            >

              <XAxis
                dataKey="name"
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#10B981"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

      <div
        style={{
          marginTop: "25px",
        }}
      >

        <div style={theme.card}>

          <h3>
            ⚠️ Distribución de Urgencias
          </h3>

          <ResponsiveContainer
            width="100%"
            height={400}
          >

            <PieChart>

              <Pie
                data={urgencias}
                dataKey="value"
                outerRadius={140}
                label
              >

                {urgencias.map(
                  (
                    item,
                    index
                  ) => (

                    <Cell
                      key={index}
                      fill={
                        COLORS[index]
                      }
                    />

                  )
                )}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}