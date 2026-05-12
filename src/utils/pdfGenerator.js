import jsPDF from "jspdf";

import autoTable
from "jspdf-autotable";

export const generarPDFSupervision = ({

  logo,

  folio,

  sitio,

  tecnico,

  fallas,

}) => {

  const doc =
    new jsPDF();

  // 🔥 COLORES SISTEMA
  const primary = [
    6,
    182,
    212,
  ];

  const dark = [
    17,
    24,
    39,
  ];

  const gray = [
    107,
    114,
    128,
  ];

  // 🔥 HEADER
  doc.setFillColor(
    ...dark
  );

  doc.rect(
    0,
    0,
    220,
    42,
    "F"
  );

  doc.addImage(
    logo,
    "PNG",
    15,
    6,
    28,
    28
  );

  doc.setTextColor(
    255,
    255,
    255
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(24);

  doc.text(
    "Sistema de Supervisión",
    105,
    18,
    null,
    null,
    "center"
  );

  doc.setFontSize(12);

  doc.setTextColor(
    ...primary
  );

  doc.text(
    "Reporte Operativo",
    105,
    28,
    null,
    null,
    "center"
  );

  // 🔥 INFORMACIÓN
  doc.setTextColor(
    ...dark
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(16);

  doc.text(
    "Información General",
    14,
    58
  );

  doc.setDrawColor(
    ...primary
  );

  doc.line(
    14,
    61,
    80,
    61
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(12);

  doc.text(
    `Folio: ${folio}`,
    14,
    74
  );

  doc.text(
    `Sitio: ${sitio}`,
    14,
    84
  );

  doc.text(
    `Técnico: ${tecnico}`,
    14,
    94
  );

  doc.text(
    `Fecha: ${new Date().toLocaleString()}`,
    14,
    104
  );

  // 🔥 MÉTRICAS
  const totalFallas =
    fallas.length;

  const criticas =
    fallas.filter(
      (f) =>
        f.urgencia ===
        "Crítica"
    ).length;

  const altas =
    fallas.filter(
      (f) =>
        f.urgencia ===
        "Alta"
    ).length;

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(16);

  doc.text(
    "Resumen Operativo",
    14,
    122
  );

  doc.line(
    14,
    125,
    76,
    125
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(12);

  doc.text(
    `Total de fallas: ${totalFallas}`,
    14,
    138
  );

  doc.text(
    `Fallas críticas: ${criticas}`,
    14,
    148
  );

  doc.text(
    `Fallas altas: ${altas}`,
    14,
    158
  );

  // 🔥 CONCLUSIÓN
  let conclusion =
    "Operación estable.";

  if (criticas >= 1) {

    conclusion =
      "Se detectaron fallas críticas que requieren atención inmediata.";

  } else if (altas >= 2) {

    conclusion =
      "Se detectaron incidencias de prioridad alta.";
  }

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    "Conclusión:",
    14,
    175
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setTextColor(
    ...gray
  );

  doc.text(
    conclusion,
    14,
    184
  );

  // 🔥 TABLA FALLAS
  const body =
    fallas.map(
      (f, index) => [

        index + 1,

        `VLT: ${f.vlt || "N/A"} - ${f.descripcion}`,

        f.urgencia,

      ]
    );

  autoTable(doc, {

    startY: 195,

    head: [[
      "#",
      "Falla Detectada",
      "Urgencia",
    ]],

    body,

    styles: {

      fontSize: 11,

      cellPadding: 4,

    },

    headStyles: {

      fillColor:
        primary,

      textColor: [
        255,
        255,
        255,
      ],

      fontStyle:
        "bold",

    },

    alternateRowStyles: {

      fillColor: [
        245,
        245,
        245,
      ],

    },

  });

  // 🔥 EVIDENCIAS
  let y =
    doc.lastAutoTable.finalY + 20;

  fallas.forEach(
    (f, index) => {

      if (f.imagen) {

        if (y > 220) {

          doc.addPage();

          y = 25;
        }

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setTextColor(
          ...dark
        );

        doc.text(
          `Evidencia ${index + 1}`,
          14,
          y
        );

        doc.addImage(
          f.imagen,
          "JPEG",
          14,
          y + 6,
          90,
          70
        );

        y += 88;
      }
    }
  );

  // 🔥 FIRMA
  if (y > 240) {

    doc.addPage();

    y = 50;
  }

  doc.setDrawColor(
    ...gray
  );

  doc.line(
    25,
    y + 25,
    95,
    y + 25
  );

  doc.setFontSize(11);

  doc.setTextColor(
    ...gray
  );

  doc.text(
    "Supervisor Responsable",
    35,
    y + 35
  );

  // 🔥 FOOTER
  const totalPages =
    doc.internal.getNumberOfPages();

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {

    doc.setPage(i);

    doc.setFontSize(10);

    doc.setTextColor(
      ...gray
    );

    doc.text(

      `Página ${i} de ${totalPages}`,

      170,

      290

    );
  }

  // 🔥 GUARDAR
  doc.save(
    `${folio}.pdf`
  );
};