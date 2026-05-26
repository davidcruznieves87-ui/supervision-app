export const normalizarFechaOperativa =
(fecha, hora) => {

  // YYYYMMDD

  const año =
    Number(
      fecha.substring(0, 4)
    );

  const mes =
    Number(
      fecha.substring(4, 6)
    );

  const dia =
    Number(
      fecha.substring(6, 8)
    );

  const horaNum =
    Number(
      hora?.substring(0, 2)
    || "0");

  const fechaObj =
    new Date(
      año,
      mes - 1,
      dia
    );

  // -------------------
  // REGLA OPERATIVA
  // -------------------

  // Si es día 1
  // y antes de las 8am
  // pertenece al mes anterior

  if (
    dia === 1 &&
    horaNum < 8
  ) {

    fechaObj.setDate(
      fechaObj.getDate() - 1
    );

  }

  const nuevoAño =
    fechaObj
      .getFullYear();

  const nuevoMes =
    String(
      fechaObj.getMonth() + 1
    ).padStart(2, "0");

  const nuevoDia =
    String(
      fechaObj.getDate()
    ).padStart(2, "0");

  return `${nuevoAño}${nuevoMes}${nuevoDia}`;

};