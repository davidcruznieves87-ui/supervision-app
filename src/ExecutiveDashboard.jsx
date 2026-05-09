import Dashboard from "./Dashboard";

function ExecutiveDashboard({

  supervisiones,

}) {

  // 🔥 AGRUPAR POR SUPERVISOR
  const agrupadas = {};

  supervisiones.forEach((s) => {

    const nombre =
      s.supervisor || "Sin Supervisor";

    if (!agrupadas[nombre]) {

      agrupadas[nombre] = [];
    }

    agrupadas[nombre].push(s);
  });

  // 🔥 RANKING
  const ranking = Object.entries(
    agrupadas
  )
    .map(([nombre, lista]) => {

      let totalFallas = 0;

      lista.forEach((s) => {

        totalFallas +=
          (s.fallas || []).length;
      });

      return {
        nombre,
        total: lista.length,
        fallas: totalFallas,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (

    <div className="mt-10">

      <h2 className="text-4xl font-black text-slate-800 mb-10 text-center">
        👑 Panel Ejecutivo Regional
      </h2>

      {/* 🔥 RANKING */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 mb-10">

        <h3 className="text-3xl font-black text-slate-800 mb-6">
          🏆 Ranking Supervisores
        </h3>

        <div className="space-y-4">

          {ranking.map((r, index) => (

            <div
              key={r.nombre}
              className="bg-slate-50 rounded-2xl p-5 flex flex-col md:flex-row md:justify-between md:items-center"
            >

              <div>

                <p className="text-2xl font-black text-cyan-700">

                  #{index + 1} • {r.nombre}
                </p>

                <p className="text-gray-600 mt-2">

                  Supervisiones:
                  <span className="font-black ml-2">
                    {r.total}
                  </span>

                </p>

              </div>

              <div className="text-red-600 font-black text-xl mt-3 md:mt-0">

                ⚠️ Fallas:
                <span className="ml-2">
                  {r.fallas}
                </span>

              </div>

            </div>
          ))}

        </div>

      </div>

      {/* 🔥 DASHBOARDS */}
      <div className="space-y-10">

        {Object.entries(agrupadas).map(
          ([supervisor, lista]) => {

            const total =
              lista.length;

            let criticas = 0;

            let altas = 0;

            let totalFallas = 0;

            const vltMap = {};

            const sitioMap = {};

            lista.forEach((s) => {

              sitioMap[s.sitio] =
                (sitioMap[s.sitio] || 0) + 1;

              (s.fallas || []).forEach((f) => {

                totalFallas++;

                if (
                  f.urgencia === "Crítica"
                ) {
                  criticas++;
                }

                if (
                  f.urgencia === "Alta"
                ) {
                  altas++;
                }

                if (f.vlt) {

                  vltMap[f.vlt] =
                    (vltMap[f.vlt] || 0) + 1;
                }
              });
            });

            const promedio =
              total > 0
                ? (
                    totalFallas / total
                  ).toFixed(1)
                : 0;

            const porcentajeCriticas =
              totalFallas > 0
                ? (
                    (criticas / totalFallas) *
                    100
                  ).toFixed(1)
                : 0;

            const topVLT =
              Object.entries(vltMap)
                .sort(
                  (a, b) => b[1] - a[1]
                )[0];

            const topSitio =
              Object.entries(sitioMap)
                .sort(
                  (a, b) => b[1] - a[1]
                )[0];

            return (

              <div
                key={supervisor}
                className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6"
              >

                <div className="mb-8">

                  <h3 className="text-3xl font-black text-cyan-700">

                    👨‍💼 {supervisor}
                  </h3>

                  {/* 🔥 KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">

                    <div className="bg-cyan-50 rounded-2xl p-5 text-center">

                      <p className="text-gray-600">
                        Supervisiones
                      </p>

                      <p className="text-4xl font-black text-cyan-700 mt-2">
                        {total}
                      </p>

                    </div>

                    <div className="bg-red-50 rounded-2xl p-5 text-center">

                      <p className="text-gray-600">
                        Críticas
                      </p>

                      <p className="text-4xl font-black text-red-600 mt-2">
                        {criticas}
                      </p>

                    </div>

                    <div className="bg-orange-50 rounded-2xl p-5 text-center">

                      <p className="text-gray-600">
                        % Críticas
                      </p>

                      <p className="text-4xl font-black text-orange-500 mt-2">
                        {porcentajeCriticas}%
                      </p>

                    </div>

                    <div className="bg-emerald-50 rounded-2xl p-5 text-center">

                      <p className="text-gray-600">
                        Promedio Fallas
                      </p>

                      <p className="text-4xl font-black text-emerald-600 mt-2">
                        {promedio}
                      </p>

                    </div>

                    <div className="bg-violet-50 rounded-2xl p-5 text-center">

                      <p className="text-gray-600">
                        Altas
                      </p>

                      <p className="text-4xl font-black text-violet-600 mt-2">
                        {altas}
                      </p>

                    </div>

                  </div>

                  {/* 🔥 TOPS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

                    <div className="bg-slate-50 rounded-2xl p-5">

                      <p className="text-lg font-black text-slate-800">
                        🎰 VLT más problemático
                      </p>

                      <p className="text-2xl text-red-600 font-black mt-3">

                        {topVLT
                          ? `${topVLT[0]} (${topVLT[1]})`
                          : "Sin datos"}
                      </p>

                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5">

                      <p className="text-lg font-black text-slate-800">
                        📍 Sitio más crítico
                      </p>

                      <p className="text-2xl text-orange-500 font-black mt-3">

                        {topSitio
                          ? `${topSitio[0]} (${topSitio[1]})`
                          : "Sin datos"}
                      </p>

                    </div>

                  </div>

                </div>

                {/* 🔥 DASHBOARD */}
                <Dashboard
                  supervisiones={lista}
                />

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}

export default ExecutiveDashboard;