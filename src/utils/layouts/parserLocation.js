export function parseLocation(location) {

  if (!location) return null;

  const texto =
    String(location)
      .trim()
      .toUpperCase();

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