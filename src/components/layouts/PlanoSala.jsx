function PlanoSala({ layout }) {

  const islas =
    Object.keys(layout)
      .sort();

  return (

    <div
      style={{
        marginTop: 40,
        background: "#F8FAFC",
        border: "2px solid #CBD5E1",
        borderRadius: 20,
        padding: 25,
      }}
    >

      <h2>
        🗺️ Plano de Sala
      </h2>

      <p>
        Vista preliminar de distribución
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill,minmax(140px,1fr))",
          gap: 20,
          marginTop: 20,
        }}
      >

        {islas.map(isla => (

          <div
            key={isla}
            style={{
              height: 90,
              border: "2px solid #2563EB",
              borderRadius: 12,
              background: "#DBEAFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            🏝️ {isla}
          </div>

        ))}

      </div>

    </div>

  );

}

export default PlanoSala;