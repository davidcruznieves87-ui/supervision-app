import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();


function limpiar(valor = "") {
  return valor
    .replace(/\s+/g, " ")
    .replace(/\b\d+\s*$/, "")
    .trim();
}


export async function leerPDFAF(file) {
  const buffer =
    await file.arrayBuffer();

  const pdf =
    await pdfjsLib.getDocument({
      data: buffer,
    }).promise;

  let texto = "";

  for (
    let i = 1;
    i <= pdf.numPages;
    i++
  ) {
    const page =
      await pdf.getPage(i);

    const content =
      await page.getTextContent();

    texto +=
      content.items
        .map(
          item => item.str
        )
        .join(" ");

    texto += "\n";
  }

  return texto;
}


export function extraerAF(texto) {
  const tieneProtocol =
    texto.includes("Protocol:");

  console.log(
    `AF detectada: ${
      tieneProtocol
        ? "CON PROTOCOL"
        : "SIN PROTOCOL"
    }`
  );

  const terminales =
    extraerTerminales(texto);

  console.log(
    "TERMINALES EXTRAÍDAS:",
    terminales
  );

  return {

    af:
      texto.match(
        /AF\s*Num\.?#?:?\s*(\d+)/i
      )?.[1] || "",

    solicitante: limpiar(
      texto.match(
        /Requested by:\s*([\s\S]*?)\s*Req Date:/i
      )?.[1]
    ),

    sala: limpiar(
      texto.match(
        /Site:\s*([\s\S]*?)\s*Activity:/i
      )?.[1]
    ),

    tipoActividad: limpiar(
      texto.match(
        /Activity:\s*([\s\S]*?)(?:\s*Protocol:|\s*Destination:)/i
      )?.[1]
    ),

    protocolo: limpiar(
      texto.match(
        /Protocol:\s*([\s\S]*?)\s*Reason:/i
      )?.[1] || ""
    ),

    // Mantenemos "motivo" porque
    // ActividadesPage ya puede usar este campo.
    motivo: limpiar(
      texto.match(
        /Reason:\s*([\s\S]*?)\s*Status:/i
      )?.[1] || ""
    ),

    // También generamos "razon" para poder
    // mostrarlo directamente en las tarjetas.
    razon: limpiar(
      texto.match(
        /Reason:\s*([\s\S]*?)\s*Status:/i
      )?.[1] || ""
    ),

    cliente: limpiar(
      texto.match(
        /Business Name:\s*([\s\S]*?)\s*Operator Name:/i
      )?.[1]
    ),

    operador: limpiar(
      texto.match(
        /Operator Name:\s*([\s\S]*?)\s*Fullname:/i
      )?.[1]
    ),

    contacto: limpiar(
      texto.match(
        /Contact Name:\s*([\s\S]*?)\s*Contact Email:/i
      )?.[1]
    ),

    correo: limpiar(
      texto.match(
        /Contact Email:\s*([\s\S]*?)\s*Contact Phone:/i
      )?.[1]
    ),

    fechaLimite:
      texto.match(
        /Deadline:\s*(\d{4}-\d{2}-\d{2})/i
      )?.[1] || "",

    terminales,

    indicacionesEspeciales: limpiar(
      texto.match(
        /Special Indications:\s*([\s\S]*?)\s*Status:/i
      )?.[1]
    ),

  };
}


/*
===================================================
 EXTRAER TERMINALES
===================================================

Formato esperado en AF:

SN: 2020090226 | VLT: 24503 | Loc: C1NX4 |
GALAXY II |
CASHIN RAIL EXPRESS |
QUIXANT 7000 --> 88 FESTIVAL


Resultado:

{
  sn: "2020090226",
  vlt: "24503",
  loc: "C1NX4",
  juegoActual: "CASHIN RAIL EXPRESS",
  juegoNuevo: "88 FESTIVAL"
}

===================================================
*/

function extraerTerminales(texto) {

  const terminales = [];

  /*
  Primero localizamos cada terminal por:

  SN
  VLT
  LOC

  Después tomamos todo el texto existente
  hasta encontrar el siguiente SN o el final.
  */

  const regexTerminal =
    /SN:\s*(\d+)\s*\|\s*VLT:\s*(\d+)\s*\|\s*LOC:\s*([A-Z0-9]+)\s*\|([\s\S]*?)(?=SN:\s*\d+\s*\|\s*VLT:|$)/gi;

  let match;

  while (
    (match =
      regexTerminal.exec(texto)) !== null
  ) {

    const sn =
      match[1]?.trim() || "";

    const vlt =
      match[2]?.trim() || "";

    const loc =
      match[3]?.trim() || "";

    const contenido =
      limpiar(match[4] || "");


    /*
    -----------------------------------------------
    Detectar cambio:
    -----------------------------------------------

    Ejemplo:

    GALAXY II |
    CASHIN RAIL EXPRESS |
    QUIXANT 7000 --> 88 FESTIVAL

    Primero buscamos lo que está después de -->
    */

    let juegoNuevo = "";

    const cambioMatch =
      contenido.match(
        /-->\s*([^|]+?)(?=\s*(?:SN:|$))/i
      );

    if (cambioMatch) {
      juegoNuevo =
        limpiar(cambioMatch[1]);
    }


    /*
    -----------------------------------------------
    Detectar juego actual
    -----------------------------------------------

    Antes de --> normalmente tendremos:

    GALAXY II |
    CASHIN RAIL EXPRESS |
    QUIXANT 7000

    El último campo es plataforma,
    así que tomamos el penúltimo.
    */

    const antesCambio =
      contenido
        .split("-->")[0]
        ?.trim() || "";

    const partes =
      antesCambio
        .split("|")
        .map(item =>
          limpiar(item)
        )
        .filter(Boolean);


    let juegoActual = "";

    /*
    Ejemplo de partes:

    [
      "GALAXY II",
      "CASHIN RAIL EXPRESS",
      "QUIXANT 7000"
    ]

    Tomamos el penúltimo elemento.
    */

    if (partes.length >= 2) {

      juegoActual =
        partes[
          partes.length - 2
        ];

    } else if (
      partes.length === 1
    ) {

      juegoActual =
        partes[0];

    }


    terminales.push({

      sn,

      vlt,

      loc,

      juegoActual,

      juegoNuevo,

    });

  }


  /*
  -------------------------------------------------
  FALLBACK
  -------------------------------------------------

  Si por alguna variante del PDF no se encontró
  el bloque completo, al menos recuperamos
  SN / VLT / LOC como lo hacía el parser anterior.
  */

  if (
    terminales.length === 0
  ) {

    const regexBasico =
      /SN:\s*(\d+)\s*\|\s*VLT:\s*(\d+)\s*\|\s*LOC:\s*([A-Z0-9]+)/gi;

    let matchBasico;

    while (
      (
        matchBasico =
          regexBasico.exec(texto)
      ) !== null
    ) {

      terminales.push({

        sn:
          matchBasico[1],

        vlt:
          matchBasico[2],

        loc:
          matchBasico[3],

        juegoActual: "",

        juegoNuevo: "",

      });

    }

  }


  return terminales;
}