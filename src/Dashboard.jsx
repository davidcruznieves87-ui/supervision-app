import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard({ supervisiones }) {

  let totalFallas = 0;
  let criticas = 0;
  let altas = 0;
  let medias = 0;
  let bajas = 0;

  supervisiones.forEach((s) => {
    s.fallas?.forEach((f) => {
      totalFallas++;

      if (f.urgencia === "Crítica") criticas++;
      else if (f.urgencia === "Alta") altas++;
      else if (f.urgencia === "Media") medias++;
      else bajas++;
    });
  });

  const data = [
    { name: "Críticas", value: criticas, color: "#dc2626" },
    { name: "Altas", value: altas, color: "#f97316" },
    { name: "Medias", value: medias, color: "#facc15" },
    { name: "Bajas", value: bajas, color: "#22c55e" },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow mt-4">

      <h2 className="text-lg font-bold mb-4 text-center">
        📊 Dashboard Operativo
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-5">

        <div className="bg-blue-100 p-3 rounded-lg text-center">
          <p className="text-sm">Supervisiones</p>

          <h3 className="text-2xl font-bold">
            {supervisiones.length}
          </h3>
        </div>

        <div className="bg-red-100 p-3 rounded-lg text-center">
          <p className="text-sm">Fallas Totales</p>

          <h3 className="text-2xl font-bold">
            {totalFallas}
          </h3>
        </div>

      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>

          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
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