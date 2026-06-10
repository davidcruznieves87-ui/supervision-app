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

    motivo: limpiar(
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

    terminales:
      extraerTerminales(texto),

    indicacionesEspeciales: limpiar(
      texto.match(
        /Special Indications:\s*([\s\S]*?)\s*Status:/i
      )?.[1]
    ),

  };
}

function extraerTerminales(texto) {

  const terminales = [];

  const regex =
    /SN:\s*(\d+)\s*\|\s*VLT:\s*(\d+)\s*\|\s*LOC:\s*([A-Z0-9]+)/gi;

  let match;

  while (
    (match = regex.exec(texto)) !== null
  ) {

    terminales.push({

      sn: match[1],

      vlt: match[2],

      loc: match[3],

    });

  }

  return terminales;
}