import theme
from "../styles/theme";

import {

  BarChart,
  Bar,

  XAxis,
  YAxis,

  Tooltip,

  ResponsiveContainer,

  PieChart,
  Pie,
  Cell,

} from "recharts";

function Dashboard({

  supervisiones,

}) {

  // 🔥 KPIS
  const totalSupervisiones =
    supervisiones.length;

  const totalFallas =
    supervisiones.reduce(

      (acc, sup) =>

        acc +
        (sup.fallas?.length || 0),

      0
    );

  const fallasCriticas =
    supervisiones.reduce(

      (acc, sup) => {

        return (

          acc +

          (sup.fallas || []).filter(

            (f) =>
              f.urgencia ===
              "Crítica"

          ).length

        );

      },

      0
    );

  const fallasAltas =
    supervisiones.reduce(

      (acc, sup) => {

        return (

          acc +

          (sup.fallas || []).filter(

            (f) =>
              f.urgencia ===
              "Alta"

          ).length

        );

      },

      0
    );

  // 🔥 TÉCNICOS
  const tecnicosMap = {};

  supervisiones.forEach(
    (s) => {

      if (
        !tecnicosMap[s.tecnico]
      ) {

        tecnicosMap[s.tecnico] = 0;
      }

      tecnicosMap[s.tecnico] +=
        s.fallas?.length || 0;
    }
  );

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

      .slice(0, 5);

  // 🔥 SITIOS
  const sitiosMap = {};

  supervisiones.forEach(
    (s) => {

      if (
        !sitiosMap[s.sitio]
      ) {

        sitiosMap[s.sitio] = 0;
      }

      sitiosMap[s.sitio] +=
        s.fallas?.length || 0;
    }
  );

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

      .slice(0, 5);

  // 🔥 URGENCIAS
  const urgencias = [

    {
      name: "Baja",

      value:
        supervisiones.reduce(

          (acc, sup) =>

            acc +

            (sup.fallas || [])
              .filter(
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

          (acc, sup) =>

            acc +

            (sup.fallas || [])
              .filter(
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

          (acc, sup) =>

            acc +

            (sup.fallas || [])
              .filter(
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

          (acc, sup) =>

            acc +

            (sup.fallas || [])
              .filter(
                (f) =>
                  f.urgencia ===
                  "Crítica"
              ).length,

          0
        ),
    },

  ];

  const COLORS = [

    "#22c55e",

    "#facc15",

    "#fb923c",

    "#ef4444",

  ];

  return (

    <div>

      {/* TITULO */}
      <h2 style={{
        ...theme.title,
        textAlign: "center",
        marginBottom: "30px",
      }}>

        📊 Dashboard Ejecutivo

      </h2>

      {/* KPIS */}
      <div style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px",
        marginBottom: "35px",
      }}>

        {/* SUPERVISIONES */}
        <div style={{
          ...theme.card,
          textAlign: "center",
          background:
            theme.colors.primary,
          color: "white",
        }}>

          <p style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "12px",
          }}>

            Supervisiones

          </p>

          <h1 style={{
            margin: 0,
            fontSize: "52px",
          }}>

            {totalSupervisiones}

          </h1>

        </div>

        {/* FALLAS */}
        <div style={{
          ...theme.card,
          textAlign: "center",
          background:
            "#10b981",
          color: "white",
        }}>

          <p style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "12px",
          }}>

            Total Fallas

          </p>

          <h1 style={{
            margin: 0,
            fontSize: "52px",
          }}>

            {totalFallas}

          </h1>

        </div>

        {/* ALTAS */}
        <div style={{
          ...theme.card,
          textAlign: "center",
          background:
            "#fb923c",
          color: "white",
        }}>

          <p style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "12px",
          }}>

            Fallas Altas

          </p>

          <h1 style={{
            margin: 0,
            fontSize: "52px",
          }}>

            {fallasAltas}

          </h1>

        </div>

        {/* CRITICAS */}
        <div style={{
          ...theme.card,
          textAlign: "center",
          background:
            "#ef4444",
          color: "white",
        }}>

          <p style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "12px",
          }}>

            Fallas Críticas

          </p>

          <h1 style={{
            margin: 0,
            fontSize: "52px",
          }}>

            {fallasCriticas}

          </h1>

        </div>

      </div>

      {/* GRAFICAS */}
      <div style={{
        display: "grid",
        gridTemplateColumns:
          "1fr 1fr",
        gap: "25px",
        marginBottom: "35px",
      }}>

        {/* TECNICOS */}
        <div style={theme.card}>

          <h3 style={{
            marginBottom: "20px",
            color:
              theme.colors.text,
          }}>

            👨‍🔧 Técnicos con más fallas

          </h3>

          <ResponsiveContainer
            width="100%"
            height={320}
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
                fill={
                  theme.colors.primary
                }
                radius={[
                  10,
                  10,
                  0,
                  0,
                ]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* SITIOS */}
        <div style={theme.card}>

          <h3 style={{
            marginBottom: "20px",
            color:
              theme.colors.text,
          }}>

            🏢 Sitios con más incidencias

          </h3>

          <ResponsiveContainer
            width="100%"
            height={320}
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
                fill="#10b981"
                radius={[
                  10,
                  10,
                  0,
                  0,
                ]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* PIE */}
      <div style={theme.card}>

        <h3 style={{
          textAlign: "center",
          marginBottom: "25px",
          color:
            theme.colors.text,
        }}>

          ⚠️ Distribución de urgencias

        </h3>

        <ResponsiveContainer
          width="100%"
          height={420}
        >

          <PieChart>

            <Pie

              data={urgencias}

              cx="50%"

              cy="50%"

              outerRadius={140}

              dataKey="value"

              label

            >

              {urgencias.map(
                (entry, index) => (

                  <Cell

                    key={index}

                    fill={
                      COLORS[
                        index %
                        COLORS.length
                      ]
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
  );
}

export default Dashboard;