export function agruparIslas(maquinas) {

  const resultado = {};

  maquinas.forEach((maquina) => {

    if (
      !maquina.isla ||
      !maquina.cara
    ) {
      return;
    }

    if (!resultado[maquina.isla]) {

      resultado[maquina.isla] = {

        cara1: [],

        cara2: [],
      };
    }

    if (maquina.cara === 1) {

      resultado[
        maquina.isla
      ].cara1.push(
        maquina
      );

    } else {

      resultado[
        maquina.isla
      ].cara2.push(
        maquina
      );
    }

  });

  // Orden visual

  Object.values(
    resultado
  ).forEach((isla) => {

    // Cara 1
    isla.cara1.sort(
      (a, b) =>
        b.posicion -
        a.posicion
    );

    // Cara 2
    isla.cara2.sort(
      (a, b) =>
        a.posicion -
        b.posicion
    );

  });

  return resultado;
}