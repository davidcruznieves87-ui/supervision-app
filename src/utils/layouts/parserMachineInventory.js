export function parseLocation(location) {
  if (!location) return null;

  const texto =
    String(location)
      .trim()
      .toUpperCase();

  // A1FX5
  const corto =
    texto.match(
      /^([A-Z])([12])(FX|NX)(\d)$/
    );

  if (corto) {
    return {
      isla: corto[1],
      cara: Number(corto[2]),
      zona: corto[3],
      posicion: Number(corto[4]),
    };
  }

  // A1F10
  const largo =
    texto.match(
      /^([A-Z])([12])([FN])(\d+)$/
    );

  if (largo) {
    return {
      isla: largo[1],
      cara: Number(largo[2]),
      zona:
        largo[3] === "F"
          ? "FX"
          : "NX",
      posicion:
        Number(largo[4]),
    };
  }

  return null;
}

export function convertirMaquina(
  fila
) {
  const parsed =
    parseLocation(
      fila["LOCATION"]
    );

  if (!parsed)
    return null;

  return {
    sala:
      fila["TEAM"],

    serie:
      fila["SERIAL NO"],

    mueble:
      fila["MODEL"],

    vlt:
      fila["VLT"],

    juego:
      fila["GAME"],

    location:
      fila["LOCATION"],

    ...parsed,
  };
}

export function agruparPorIsla(
  maquinas
) {
  const resultado = {};

  maquinas.forEach(
    maquina => {

      if (
        !resultado[
          maquina.isla
        ]
      ) {
        resultado[
          maquina.isla
        ] = [];
      }

      resultado[
        maquina.isla
      ].push(
        maquina
      );

    }
  );

  return resultado;
}