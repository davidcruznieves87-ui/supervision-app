import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  obtenerControlReportes,
} from "../../services/controlReportesService";

import theme
from "../../styles/theme";

function DashboardControlReportes() {

  const [
    reportes,
    setReportes,
  ] = useState([]);

  // =====================
  // CARGAR
  // =====================

  useEffect(() => {

    cargarReportes();

  }, []);

  const cargarReportes =
    async () => {

      const data =
        await obtenerControlReportes();

      setReportes(data);

    };

  // =====================
  // MES ACTUAL
  // =====================

  const hoy =
    new Date();

  const año =
    hoy.getFullYear();

  const mes =
    String(
      hoy.getMonth() + 1
    ).padStart(2, "0");

  const mesActual =
    `${año}${mes}`;

  // =====================
  // FILTRAR MES
  // =====================

  const [
  modo,
  setModo,
] = useState(
  "actual"
);

const [
  mesSeleccionado,
  setMesSeleccionado,
] = useState("");

// =====================
// MESES DISPONIBLES
// =====================

const mesesDisponibles =
  [
    ...new Set(
      reportes.map(
        (item) =>
          item.mes
      )
    ),
  ].sort().reverse();

// =====================
// FILTRADOS
// =====================

const filtrados =
  useMemo(() => {

    // 🔥 ACTUAL

    if (
      modo === "actual"
    ) {

      return reportes.filter(
        (item) =>
          item.mes ===
          mesActual
      );

    }

    // 📚 HISTORICO

    if (
      !mesSeleccionado
    ) {

      return [];

    }

    return reportes.filter(
      (item) =>
        item.mes ===
        mesSeleccionado
    );

  }, [

    reportes,

    modo,

    mesActual,

    mesSeleccionado,

  ]);

  // =====================
  // TOTAL DIAS MES
  // =====================

  const mesTabla =
  modo === "actual"
    ? mesActual
    : mesSeleccionado;

const totalDias =
  mesTabla
    ? new Date(
        Number(
          mesTabla.substring(0, 4)
        ),
        Number(
          mesTabla.substring(4, 6)
        ),
        0
      ).getDate()
    : 31;

  // =====================
  // AGRUPAR SALAS
  // =====================

  const salas = {};

  filtrados.forEach(
    (item) => {

      if (
        !salas[item.sala]
      ) {

        salas[item.sala] = {};

      }

      salas[item.sala][
        item.dia
      ] = item;

    }
  );

  // =====================
  // COLOR CELDA
  // =====================

  const obtenerColor =
    (item) => {

      if (!item) {
        return "#FEE2E2";
      }

      const completos = [

        item.bingoCSV,
        item.bingoJSON,
        item.spinCSV,
        item.spinJSON,

      ].filter(Boolean)
       .length;

      if (
        completos === 0
      ) {

        return "#FEE2E2";
      }

      if (
        completos === 2
      ) {

        return "#DCFCE7";
      }

      return "#FEF9C3";

    };

  return (

    <div
      style={{
        ...theme.card,
        overflowX:
          "auto",
      }}
    >

      {/* TITULO */}

      <h2
        style={{
          ...theme.title,
          marginBottom:
            "20px",
        }}
      >

        📊 Control Diario Operativo

      </h2>

{/* MODOS */}

<div
  style={{
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  }}
>

  {/* ACTUAL */}

  <button
    onClick={() =>
      setModo("actual")
    }
    style={{

      ...(modo === "actual"

        ? theme.button.primary

        : theme.button.success),

    }}
  >

    🔥 Mes Actual

  </button>

  {/* HISTORICO */}

  <button
    onClick={() =>
      setModo("historico")
    }
    style={{

      ...(modo === "historico"

        ? theme.button.primary

        : theme.button.success),

    }}
  >

    📚 Histórico

  </button>

  {/* SELECT */}

  {modo ===
    "historico" && (

    <select
      value={
        mesSeleccionado
      }
      onChange={(e) =>
        setMesSeleccionado(
          e.target.value
        )
      }
      style={{
        ...theme.input,
        maxWidth: "200px",
      }}
    >

      <option value="">
        Seleccionar mes
      </option>

      {mesesDisponibles.map(
        (mes) => (

        <option
          key={mes}
          value={mes}
        >

          {mes}

        </option>

      ))}

    </select>

  )}

</div>
      {/* TABLA */}

      <table
        style={{
          borderCollapse:
            "collapse",

          minWidth:
            "1800px",
        }}
      >

        <thead>

          <tr>

            {/* SALA */}

            <th
              style={{

                position:
                  "sticky",

                left: 0,

                background:
                  "#1E293B",

                color:
                  "white",

                padding:
                  "12px",

                zIndex: 2,

              }}
            >

              Sala

            </th>

            {/* DIAS */}

            {Array.from({

              length:
                totalDias,

            }).map(
              (_, index) => {

                const dia =
                  String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  );

                return (

                  <th
                    key={dia}
                    style={{

                      background:
                        "#E2E8F0",

                      padding:
                        "10px",

                      minWidth:
                        "120px",

                      textAlign:
                        "center",

                    }}
                  >

                    {dia}

                  </th>

                );

              }
            )}

          </tr>

        </thead>

        <tbody>

          {Object.keys(
            salas
          ).map((sala) => (

            <tr
              key={sala}
            >

              {/* SALA */}

              <td
                style={{

                  position:
                    "sticky",

                  left: 0,

                  background:
                    "#F8FAFC",

                  fontWeight:
                    "bold",

                  padding:
                    "12px",

                  border:
                    "1px solid #CBD5E1",

                  zIndex: 1,

                }}
              >

                {sala}

              </td>

              {/* DIAS */}

              {Array.from({

                length:
                  totalDias,

              }).map(
                (_, index) => {

                  const dia =
                    index + 1;

                  const item =
                    salas[sala][dia];

                  return (

                    <td
                      key={dia}
                      style={{

                        border:
                          "1px solid #CBD5E1",

                        padding:
                          "8px",

                        textAlign:
                          "center",

                        background:
                          obtenerColor(
                            item
                          ),

                        fontSize:
                          "13px",

                        lineHeight:
                          "20px",

                      }}
                    >

                      {/* BINGO */}

                      {(

                        item?.bingoCSV ||
                        item?.bingoJSON

                      ) && (

                        <div>

                          <strong>
                            Bingo
                          </strong>

                          <br />

                          CSV {

                            item?.bingoCSV

                              ? "✅"

                              : "❌"

                          }

                          <br />

                          JSON {

                            item?.bingoJSON

                              ? "✅"

                              : "❌"

                          }

                        </div>

                      )}

                      {/* SPIN */}

                      {(

                        item?.spinCSV ||
                        item?.spinJSON

                      ) && (

                        <div
                          style={{
                            marginTop:
                              "8px",
                          }}
                        >

                          <strong>
                            Spin
                          </strong>

                          <br />

                          CSV {

                            item?.spinCSV

                              ? "✅"

                              : "❌"

                          }

                          <br />

                          JSON {

                            item?.spinJSON

                              ? "✅"

                              : "❌"

                          }

                        </div>

                      )}

                      {/* VACIO */}

                      {!item && (

                        <div>

                          ❌

                        </div>

                      )}

                    </td>

                  );

                }
              )}

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default
DashboardControlReportes;