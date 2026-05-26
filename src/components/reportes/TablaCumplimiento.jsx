function TablaCumplimiento({
  resultados,
}) {

  if (
    resultados.length === 0
  ) {

    return null;

  }

  return (

    <div>

      <h2
        style={{
          marginBottom: "20px",
        }}
      >

        📊 Cumplimiento Detectado

      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse:
            "collapse",
        }}
      >

        <thead>

          <tr
            style={{
              background:
                "#E2E8F0",
            }}
          >

            <th style={{
              padding: "12px",
            }}>
              Fecha
            </th>

            <th style={{
              padding: "12px",
            }}>
              Sala
            </th>

            <th style={{
              padding: "12px",
            }}>
              CSV
            </th>

            <th style={{
              padding: "12px",
            }}>
              JSON
            </th>

            <th style={{
              padding: "12px",
            }}>
              Estado
            </th>

          </tr>

        </thead>

        <tbody>

          {resultados.map(
            (
              item,
              index
            ) => (

            <tr
              key={index}
              style={{
                borderBottom:
                  "1px solid #E2E8F0",
              }}
            >

              {/* FECHA */}

              <td style={{
                padding: "12px",
              }}>
                {item.fecha}
              </td>

              {/* SALA */}

              <td style={{
                padding: "12px",
              }}>
                {item.sala}
              </td>

              {/* CSV */}

<td style={{
  padding: "12px",
  textAlign:
    "center",
}}>
  {
    item.bingoCSV ||
    item.spinCSV

      ? "✅"

      : "❌"
  }
</td>

{/* JSON */}

<td style={{
  padding: "12px",
  textAlign:
    "center",
}}>
  {
    item.bingoJSON ||
    item.spinJSON

      ? "✅"

      : "❌"
  }
</td>

              {/* ESTADO */}

              <td style={{
                padding: "12px",
                fontWeight:
                  "bold",
              }}>
                {item.estado}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default
TablaCumplimiento;