// src/services/nomina/parserNomina.js

export const limpiarTexto = (valor) => {
  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor)
    .replace(/\u00a0/g, " ")
    .trim();
};


export const normalizarNombre = (nombre) => {
  return limpiarTexto(nombre)
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
};


export const obtenerCampo = (registro, posiblesNombres) => {
  const claves = Object.keys(registro || {});

  for (const posible of posiblesNombres) {
    const encontrada = claves.find(
      (clave) =>
        limpiarTexto(clave).toLowerCase() ===
        posible.toLowerCase()
    );

    if (encontrada !== undefined) {
      return limpiarTexto(registro[encontrada]);
    }
  }

  return "";
};


export const leerArchivoXLS = (contenido) => {
  const parser = new DOMParser();

  const documento = parser.parseFromString(
    contenido,
    "text/html"
  );

  const tabla = documento.querySelector("table");

  if (!tabla) {
    throw new Error(
      "No se encontró una tabla válida dentro del archivo."
    );
  }

  const filas = Array.from(
    tabla.querySelectorAll("tr")
  );

  if (filas.length < 2) {
    throw new Error(
      "El archivo no contiene registros."
    );
  }

  const encabezados = Array.from(
    filas[0].querySelectorAll("th, td")
  ).map((celda) =>
    limpiarTexto(celda.textContent)
  );

  const registros = filas
    .slice(1)
    .map((fila) => {
      const celdas = Array.from(
        fila.querySelectorAll("td")
      ).map((celda) =>
        limpiarTexto(celda.textContent)
      );

      const registro = {};

      encabezados.forEach((encabezado, index) => {
        registro[encabezado] =
          celdas[index] || "";
      });

      return registro;
    })
    .filter((registro) =>
      Object.values(registro).some(
        (valor) => limpiarTexto(valor) !== ""
      )
    );

  return registros;
};