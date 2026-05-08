
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

function Dashboard({ supervisiones }) {

  const totalSupervisiones = supervisiones.length;

  const totalFallas = supervisiones.reduce(
    (acc, sup) => acc + (sup.fallas?.length || 0),
    0
  );

  const fallasCriticas = supervisiones.reduce((acc, sup) => {
    return (
      acc +
      (sup.fallas || []).filter(
        (f) => f.urgencia === "Crítica"
      ).length
    );
  }, 0);

  const fallasAltas = supervisiones.reduce((acc, sup) => {
    return (
      acc +
      (sup.fallas || []).filter(
        (f) => f.urgencia === "Alta"
      ).length
    );
  }, 0);

  const tecnicosMap = {};

  supervisiones.forEach((s) => {
    if (!tecnicosMap[s.tecnico]) {
      tecnicosMap[s.tecnico] = 0;
    }

    tecnicosMap[s.tecnico] += s.fallas?.length || 0;
  });

  const topTecnicos = Object.entries(tecnicosMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const sitiosMap = {};

  supervisiones.forEach((s) => {
    if (!sitiosMap[s.sitio]) {
      sitiosMap[s.sitio] = 0;
    }

    sitiosMap[s.sitio] += s.fallas?.length || 0;
  });

  const topSitios = Object.entries(sitiosMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const urgencias = [
    {
      name: "Baja",
      value: supervisiones.reduce(
        (acc, sup) =>
          acc +
          (sup.fallas || []).filter(
            (f) => f.urgencia === "Baja"
          ).length,
        0
      ),
    },
    {
      name: "Media",
      value: supervisiones.reduce(
        (acc, sup) =>
          acc +
          (sup.fallas || []).filter(
            (f) => f.urgencia === "Media"
          ).length,
        0
      ),
    },
    {
      name: "Alta",
      value: supervisiones.reduce(
        (acc, sup) =>
          acc +
          (sup.fallas || []).filter(
            (f) => f.urgencia === "Alta"
          ).length,
        0
      ),
    },
    {
      name: "Crítica",
      value: supervisiones.reduce(
        (acc, sup) =>
          acc +
          (sup.fallas || []).filter(
            (f) => f.urgencia === "Crítica"
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
    <div className="mt-10">

      <h2 className="text-4xl font-black text-center text-slate-800 mb-8">
        📊 Dashboard Ejecutivo
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">

        <div className="bg-cyan-500 rounded-3xl p-6 shadow-2xl text-center">
          <p className="text-white text-xl font-bold mb-2">
            Supervisiones
          </p>
          <p className="text-5xl font-black text-black">
            {totalSupervisiones}
          </p>
        </div>

        <div className="bg-emerald-500 rounded-3xl p-6 shadow-2xl text-center">
          <p className="text-white text-xl font-bold mb-2">
            Total Fallas
          </p>
          <p className="text-5xl font-black text-black">
            {totalFallas}
          </p>
        </div>

        <div className="bg-orange-400 rounded-3xl p-6 shadow-2xl text-center">
          <p className="text-white text-xl font-bold mb-2">
            Fallas Altas
          </p>
          <p className="text-5xl font-black text-black">
            {fallasAltas}
          </p>
        </div>

        <div className="bg-red-500 rounded-3xl p-6 shadow-2xl text-center">
          <p className="text-white text-xl font-bold mb-2">
            Fallas Críticas
          </p>
          <p className="text-5xl font-black text-white">
            {fallasCriticas}
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">

          <h3 className="text-2xl font-black text-slate-800 mb-5 text-center">
            👨‍🔧 Técnicos con más fallas
          </h3>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topTecnicos}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#06b6d4"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">

          <h3 className="text-2xl font-black text-slate-800 mb-5 text-center">
            🏢 Sitios con más incidencias
          </h3>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topSitios}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#10b981"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl mb-10">

        <h3 className="text-3xl font-black text-center text-slate-800 mb-6">
          ⚠️ Distribución de urgencias
        </h3>

        <ResponsiveContainer width="100%" height={420}>
          <PieChart>
            <Pie
              data={urgencias}
              cx="50%"
              cy="50%"
              outerRadius={140}
              dataKey="value"
              label
            >
              {urgencias.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default Dashboard;
