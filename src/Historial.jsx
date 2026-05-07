function Historial({ supervisiones, recuperarSupervision }) {

  return (

    <div className="bg-white p-6 rounded-2xl shadow-xl mt-8 border border-gray-200">

      <h2 className="text-3xl font-black text-center mb-6 text-slate-800">
        📂 Historial de Supervisiones
      </h2>

      {supervisiones.length === 0 ? (

        <p className="text-center text-gray-500">
          No hay supervisiones registradas
        </p>

      ) : (

        <div className="space-y-4">

          {supervisiones.map((s, index) => (

            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow"
            >

              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

                <div>

                  <p className="text-lg font-bold text-slate-800">
                    📍 Sitio: {s.sitio}
                  </p>

                  <p className="text-gray-700">
                    👨‍🔧 Técnico: {s.tecnico}
                  </p>

                  <p className="text-gray-500 text-sm">
                    🕒 {s.fechaHora}
                  </p>

                  <p className="mt-2 font-semibold text-cyan-700">
                    ⚠️ Fallas: {s.fallas?.length || 0}
                  </p>

                </div>

                <button
                  onClick={() => recuperarSupervision(s)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-5 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  ♻️ Recuperar
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default Historial;