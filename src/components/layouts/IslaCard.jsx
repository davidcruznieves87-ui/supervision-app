function IslaCard({ nombre, isla }) {

  return (

    <div
      style={{
        marginBottom: 30,
        border: "1px solid #CBD5E1",
        borderRadius: 16,
        padding: 20,
        background: "#fff",
      }}
    >

      <h2>
        🏝️ Isla {nombre}
      </h2>

      <h3>
        Cara 1
      </h3>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >

        {isla.cara1.map(
          maquina => (

            <div
              key={maquina.location}
              style={{
                width: 170,
                border:
                  "1px solid #CBD5E1",
                borderRadius: 10,
                padding: 10,
              }}
            >

              <strong>
                {maquina.vlt}
              </strong>

              <br />

              {maquina.juego}

              <br />

              <small>
                {maquina.mueble}
              </small>

              <br />

              <small>
                {maquina.location}
              </small>

            </div>

          )
        )}

      </div>

      <hr
        style={{
          margin: "20px 0",
        }}
      />

      <h3>
        Cara 2
      </h3>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >

        {isla.cara2.map(
          maquina => (

            <div
              key={maquina.location}
              style={{
                width: 170,
                border:
                  "1px solid #CBD5E1",
                borderRadius: 10,
                padding: 10,
              }}
            >

              <strong>
                {maquina.vlt}
              </strong>

              <br />

              {maquina.juego}

              <br />

              <small>
                {maquina.mueble}
              </small>

              <br />

              <small>
                {maquina.location}
              </small>

            </div>

          )
        )}

      </div>

    </div>

  );

}

export default IslaCard;