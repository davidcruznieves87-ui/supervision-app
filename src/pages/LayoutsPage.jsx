import { useState } from "react";
import * as XLSX from "xlsx";
import {
  parseLocation,
} from "../utils/layouts/parserLocation";

import {
  agruparIslas,
} from "../utils/layouts/agruparIslas";

import IslaCard
from "../components/layouts/IslaCard";

import PlanoSala
from "../components/layouts/PlanoSala";

function LayoutsPage() {

  const [maquinas, setMaquinas] =
    useState([]);

  const [sala, setSala] =
    useState("");

  const manejarArchivo =
    async (event) => {

      const archivo =
        event.target.files?.[0];

      if (!archivo)
        return;

      const buffer =
        await archivo.arrayBuffer();

      const workbook =
        XLSX.read(
          buffer,
          {
            type: "array",
          }
        );

      const hoja =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const datos =
        XLSX.utils.sheet_to_json(
          hoja
        );

      console.log(
        "DATOS:",
        datos
      );

      const maquinasProcesadas =
  datos
    .map((fila) => {

      const parsed =
        parseLocation(
          fila["LOCATION"]
        );

      if (!parsed)
        return null;

      return {

        sala:
          fila["SITENAME"],

        location:
          fila["LOCATION"],

        vlt:
          fila["VLT"],

        juego:
          fila["GAME"],

        mueble:
          fila["MODEL"],

        serie:
          fila["SERIAL NO"],

        ...parsed,
      };

    })
    .filter(Boolean);

setMaquinas(
  maquinasProcesadas
);

      if (
  datos.length > 0 &&
  datos[0]["SITENAME"]
) {
  setSala(
    datos[0]["SITENAME"]
  );
}
    };

  const obtenerIslas = () => {

  const islas =
    new Set();

  maquinas.forEach(
    maquina => {

      if (
        maquina.isla
      ) {

        islas.add(
          maquina.isla
        );

      }

    }
  );

  return Array.from(
    islas
  ).sort();

};

  const islas =
    obtenerIslas();

    const layout =
  agruparIslas(
    maquinas
  );

  return (

    <div>

      <h1>
        📐 Constructor de Layouts
      </h1>

      <p>
        Machine Inventory →
        Layout
      </p>

      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={
          manejarArchivo
        }
      />

<pre
  style={{
    marginTop: 20,
    maxHeight: 300,
    overflow: "auto",
    background: "#111827",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
  }}
>
  
</pre>
      {sala && (

        <div
          style={{
            marginTop: 20,
          }}
        >
          <strong>
            Sala:
          </strong>
          {" "}
          {sala}
        </div>

      )}

      {islas.length > 0 && (

        <div
          style={{
            marginTop: 30,
          }}
        >

          <h2>
            Islas Detectadas
          </h2>

          <PlanoSala
  layout={layout}
/>

    {Object.entries(layout).map(
  ([nombre, isla]) => (

    <IslaCard
      key={nombre}
      nombre={nombre}
      isla={isla}
    />

  )

  
)
}

<pre
  style={{
    background: "#111827",
    color: "#fff",
    padding: 20,
    borderRadius: 12,
    overflow: "auto",
    maxHeight: 500,
  }}
>

</pre>



          {islas.map(
            isla => (

              <div
                key={isla}
                style={{
                  padding: 10,
                  marginBottom: 10,
                  border:
                    "1px solid #CBD5E1",
                  borderRadius: 8,
                }}
              >
                🏝️ Isla {isla}
              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}

export default LayoutsPage;