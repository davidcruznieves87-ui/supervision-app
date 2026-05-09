function Historial({
  supervisiones,
  recuperarSupervision,
  eliminarSupervision,
}) {

  return (

    <div className="mt-10">

      <h2 className="text-3xl font-black text-slate-800 mb-6">
        📂 Historial de Supervisiones
      </h2>

      {supervisiones.length === 0 && (

        <div className="bg-white rounded-2xl p-6 shadow text-center text-gray-500 font-bold">
          No hay supervisiones registradas
        </div>

      )}

      <div className="space-y-5">

        {supervisiones.map((s, index) => (

          <div
            key={s.id || index}
            className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6"
          >

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5">

              <div>

                <p className="text-cyan-700 font-black text-lg">
                  📄 {s.folio || "Sin folio"}
                </p>

                <p className="text-2xl font-black text-slate-800">
                  📍 {s.sitio}
                </p>

                <p className="text-lg text-gray-600 mt-1">
                  👨‍🔧 {s.tecnico}
                </p>

                <p className="text-md text-gray-500 mt-1">
                  🕒 {s.fechaHora}
                </p>

                <p className="text-md text-gray-500 mt-1">
                  ⚠️ {s.fallas?.length || 0} fallas registradas
                </p>

              </div>

              <div className="flex flex-col md:flex-row gap-3">

                <button
                  onClick={() => recuperarSupervision(s)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black px-6 py-4 rounded-2xl shadow-lg"
                >
                  ♻️ Recuperar
                </button>

                <button
                  onClick={() => eliminarSupervision(s.id)}
                  className="bg-red-500 hover:bg-red-400 text-white font-black px-6 py-4 rounded-2xl shadow-lg"
                >
                  🗑️ Eliminar
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}

export default Historial;