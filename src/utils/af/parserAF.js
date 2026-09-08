import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


/*
=====================================================
FUNCIÓN PRINCIPAL
=====================================================

El componente manda directamente:

extraerAF(file)

Esta función:
1. Lee el PDF
2. Extrae el texto
3. Analiza los datos generales
4. Analiza las terminales
=====================================================
*/

export async function extraerAF(file) {

  if (!file) {
    throw new Error(
      "No se recibió archivo PDF."
    );
  }


  /*
  =====================================================
  LEER PDF
  =====================================================
  */

  const texto =
    await leerPDFAF(file);


  console.log(
    "===== TEXTO PDF EXTRAIDO ====="
  );

  console.log(texto);


  /*
  =====================================================
  EXTRAER INFORMACIÓN
  =====================================================
  */

  const datos =
    analizarAF(texto);


  return datos;
}


/*
=====================================================
LEER PDF
=====================================================
*/

export async function leerPDFAF(file) {

  const arrayBuffer =
    await file.arrayBuffer();


  const pdf =
    await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;


  let textoCompleto = "";


  for (
    let pagina = 1;
    pagina <= pdf.numPages;
    pagina++
  ) {

    const page =
      await pdf.getPage(
        pagina
      );


    const contenido =
      await page.getTextContent();


    /*
    IMPORTANTE:

    Conservamos cada item separado
    por espacios.

    Los caracteres:
    |
    -->
    :
    siguen presentes.
    */

    const textoPagina =
      contenido.items
        .map((item) => item.str)
        .join(" ");


    textoCompleto +=
      ` ${textoPagina} `;

  }


  return normalizarTexto(
    textoCompleto
  );
}


/*
=====================================================
ANALIZAR AF
=====================================================
*/

function analizarAF(texto) {

  if (!texto) {

    return crearResultadoVacio();

  }


  const t =
    normalizarTexto(texto);


  /*
  =====================================================
  CAMPOS GENERALES
  =====================================================
  */

  const af =
    buscar(
      t,
      /AF\s*Num\.?\s*#?\s*:\s*(\d+)/i
    );


  const proyecto =
    buscar(
      t,
      /Proj\.?\s*#?\s*:\s*([A-Z0-9-]+)/i
    );


  /*
  SALA

  Capturamos desde Site:
  hasta Activity:
  */

  const sala =
    buscar(
      t,
      /Site\s*:\s*(.*?)(?=\s+Activity\s*:)/i
    );


  /*
  ACTIVIDAD

  Puede venir:

  Activity:
  Protocol:

  o:

  Activity:
  Reason:
  */

  const tipoActividad =
    buscar(
      t,
      /Activity\s*:\s*(.*?)(?=\s+Protocol\s*:|\s+Reason\s*:|\s+Status\s*:)/i
    );


  const protocolo =
    buscar(
      t,
      /Protocol\s*:\s*(.*?)(?=\s+Reason\s*:|\s+Status\s*:)/i
    );


  /*
  RAZÓN
  */

  const razon =
    buscar(
      t,
      /Reason\s*:\s*(.*?)(?=\s+Status\s*:)/i
    );


  /*
  FECHA

  Permitimos:

  Deadline:
  Due Date:
  */

  const fechaLimite =
    buscar(
      t,
      /(?:Deadline|Due\s*Date)\s*:\s*(\d{4}-\d{2}-\d{2})/i
    );


  /*
  CLIENTE
  */

  let cliente =
    buscar(
      t,
      /Business\s*Name\s*:\s*(.*?)(?=\s+Operator\s*Name\s*:|\s+Fullname\s*:|\s+Contact\s*Name\s*:)/i
    );


  /*
  Algunos formatos pueden usar Client:
  */

  if (!cliente) {

    cliente =
      buscar(
        t,
        /Client\s*:\s*(.*?)(?=\s+Contact|\s+Email|\s+Deadline|\s+Due\s*Date)/i
      );

  }


  /*
  CONTACTO
  */

  let contacto =
    buscar(
      t,
      /Contact\s*Name\s*:\s*(.*?)(?=\s+Contact\s*Email\s*:)/i
    );


  if (!contacto) {

    contacto =
      buscar(
        t,
        /Fullname\s*:\s*(.*?)(?=\s+Email\s*:|\s+Contact\s*Email\s*:)/i
      );

  }


  /*
  CORREO
  */

  let correo =
    buscar(
      t,
      /Contact\s*Email\s*:\s*([^\s|]+@[^\s|]+)/i
    );


  if (!correo) {

    correo =
      buscar(
        t,
        /Email\s*:\s*([^\s|]+@[^\s|]+)/i
      );

  }


  /*
  =====================================================
  TERMINALES
  =====================================================
  */

  const terminales =
    extraerTerminales(t);


  /*
  =====================================================
  INDICACIONES
  =====================================================
  */

  const indicacionesEspeciales =
    extraerIndicaciones(t);


  /*
  =====================================================
  RESULTADO
  =====================================================
  */

  return {

    af,

    proyecto,

    sala,

    tipoActividad,

    protocolo,

    razon,

    motivo:
      razon,

    fechaLimite,

    cliente,

    contacto,

    correo,

    indicacionesEspeciales,

    terminales,

  };
}


/*
=====================================================
EXTRAER TERMINALES
=====================================================
*/

function extraerTerminales(texto) {

  const terminales = [];


  /*
  =====================================================
  BUSCAR INICIO DE CADA TERMINAL
  =====================================================

  Capturamos solamente:

  SN
  VLT
  LOC

  y guardamos la posición donde empieza.

  Después cortamos manualmente hasta el siguiente SN.

  Esto es mucho más resistente que intentar
  capturar toda la terminal con un único regex.
  =====================================================
  */

  const regexInicio =
    /SN\s*:\s*([^|]+?)\s*\|\s*VLT\s*:\s*([^|]+?)\s*\|\s*LOC\s*:\s*([^|]+?)\s*\|/gi;


  const encontrados = [];

  let match;


  while (
    (
      match =
        regexInicio.exec(texto)
    ) !== null
  ) {

    encontrados.push({

      index:
        match.index,

      finEncabezado:
        regexInicio.lastIndex,

      sn:
        limpiar(match[1]),

      vlt:
        limpiar(match[2]),

      loc:
        limpiar(match[3]),

    });
  }


  /*
  =====================================================
  PROCESAR CADA TERMINAL
  =====================================================
  */

  encontrados.forEach(
    (terminal, index) => {

      /*
      El bloque termina:

      - en el siguiente SN
      - o al final del documento
      */

      let finBloque =
        index <
        encontrados.length - 1
          ? encontrados[index + 1]
              .index
          : texto.length;


      let contenido =
        texto
          .substring(
            terminal.finEncabezado,
            finBloque
          )
          .trim();


      /*
      Para la última terminal quitamos
      cualquier sección posterior.
      */

      contenido =
        contenido
          .split(
            /Special\s*Indications\s*:/i
          )[0]
          .split(
            /Indicaciones\s*Especiales\s*:/i
          )[0]
          .trim();


      /*
      ===================================================
      DETECTAR FLECHA
      ===================================================

      Soportamos:

      -->
      --->
      -- >

      PDF.js puede introducir espacios.
      */

      const regexFlecha =
        /-{2,}\s*>/;


      const flecha =
        regexFlecha.exec(
          contenido
        );


      let izquierda =
        contenido;


      let juegoNuevo =
        "";


      if (flecha) {

        izquierda =
          contenido
            .substring(
              0,
              flecha.index
            )
            .trim();


        juegoNuevo =
          contenido
            .substring(
              flecha.index +
              flecha[0].length
            )
            .trim();

      }


      /*
      ===================================================
      CAMPOS ANTES DE LA FLECHA
      ===================================================

      Ejemplo:

      GALAXY II
      |
      TEMPLE OF GODS
      |
      QUIXANT 7000

      [0] gabinete
      [1] juego actual
      [2] plataforma

      Si el nombre del juego genera más segmentos,
      conservamos todo lo intermedio.
      */

      const campos =
        izquierda
          .split("|")
          .map(limpiar)
          .filter(Boolean);


      let juegoActual = "";


      if (campos.length >= 3) {

        juegoActual =
          campos
            .slice(
              1,
              campos.length - 1
            )
            .join(" | ")
            .trim();

      }

      else if (
        campos.length === 2
      ) {

        juegoActual =
          campos[1];

      }

      else if (
        campos.length === 1
      ) {

        juegoActual =
          campos[0];

      }


      /*
      ===================================================
      LIMPIAR JUEGO NUEVO
      ===================================================
      */

      juegoNuevo =
        juegoNuevo
          .replace(
            /\s+Special\s*Indications\s*:.*$/i,
            ""
          )
          .replace(
            /\s+Indicaciones\s*Especiales\s*:.*$/i,
            ""
          )
          .replace(
            /\s+Status\s*:.*$/i,
            ""
          )
          .trim();


      terminales.push({

        sn:
          terminal.sn,

        vlt:
          terminal.vlt,

        loc:
          terminal.loc,

        juegoActual,

        juegoNuevo,

      });

    }
  );


  console.log(
    "===== TERMINALES PARSER ====="
  );

  console.table(
    terminales
  );


  return terminales;
}


/*
=====================================================
INDICACIONES ESPECIALES
=====================================================
*/

function extraerIndicaciones(texto) {

  let match =
    texto.match(
      /Special\s*Indications\s*:\s*(.*?)(?=\s+Status\s*:|This\s+Email|$)/i
    );


  if (!match) {

    match =
      texto.match(
        /Indicaciones\s*Especiales\s*:\s*(.*?)(?=\s+Status\s*:|$)/i
      );

  }


  if (!match) {
    return "";
  }


  return limpiar(
    match[1]
  );
}


/*
=====================================================
BUSCAR
=====================================================
*/

function buscar(
  texto,
  regex
) {

  const resultado =
    texto.match(regex);


  if (
    !resultado ||
    !resultado[1]
  ) {

    return "";

  }


  return limpiar(
    resultado[1]
  );
}


/*
=====================================================
LIMPIAR
=====================================================
*/

function limpiar(valor) {

  if (!valor) {
    return "";
  }


  return String(valor)
    .replace(
      /\u00A0/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


/*
=====================================================
NORMALIZAR
=====================================================
*/

function normalizarTexto(texto) {

  if (!texto) {
    return "";
  }


  return String(texto)
    .replace(
      /\r/g,
      " "
    )
    .replace(
      /\n/g,
      " "
    )
    .replace(
      /\u00A0/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


/*
=====================================================
RESULTADO VACÍO
=====================================================
*/

function crearResultadoVacio() {

  return {

    af: "",

    proyecto: "",

    sala: "",

    tipoActividad: "",

    protocolo: "",

    razon: "",

    motivo: "",

    fechaLimite: "",

    cliente: "",

    contacto: "",

    correo: "",

    indicacionesEspeciales: "",

    terminales: [],

  };
}