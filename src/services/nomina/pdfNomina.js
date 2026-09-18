import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  fechaVisual,
  segundosAHoras,
} from "./calculoHoras";

import {
  timestampATexto,
} from "./nominaFirestore";


// =====================================================
// UTILIDADES
// =====================================================

const textoSeguro = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "-";
  }

  return String(valor);
};


const obtenerNombreArchivo = (nomina) => {
  const inicio =
    nomina?.periodoInicio || "inicio";

  const fin =
    nomina?.periodoFin || "fin";

  return `Nomina_Detallada_${inicio}_${fin}.pdf`;
};


const ordenarDias = (tecnico) => {
  return Object.entries(
    tecnico?.dias || {}
  ).sort(
    ([fechaA], [fechaB]) =>
      fechaA.localeCompare(fechaB)
  );
};


const nombreDiaPDF = (fechaISO) => {
  if (!fechaISO) {
    return "";
  }

  const fecha =
    new Date(
      `${fechaISO}T12:00:00`
    );

  const nombres = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  return nombres[
    fecha.getDay()
  ];
};


// =====================================================
// ESTADO DEL DÍA
// =====================================================

const obtenerEstadoDia = (dia) => {

  if (!dia) {
    return "-";
  }

  if (
    dia.estado ===
    "FUERA_PERIODO_LABORAL"
  ) {
    return "Fuera de plantilla";
  }


  if (
    dia.esFestivo &&
    dia.trabajado
  ) {

    if (dia.esDomingo) {
      return `${textoSeguro(
        dia.festivoNombre
      )} + Prima dominical`;
    }

    return `Festivo trabajado: ${textoSeguro(
      dia.festivoNombre
    )}`;
  }


  if (
    dia.esFestivo &&
    !dia.trabajado
  ) {
    return `Descanso festivo: ${textoSeguro(
      dia.festivoNombre
    )}`;
  }


  if (dia.esFalta) {
    return "FALTA";
  }


  if (
    dia.esDomingo &&
    dia.trabajado
  ) {
    return "Prima dominical";
  }


  if (dia.esDomingo) {
    return "Domingo sin guardia";
  }


  if (
    dia.esSabado &&
    dia.trabajado
  ) {
    return "Guardia sábado";
  }


  if (dia.esSabado) {
    return "Sábado sin guardia";
  }


  if (dia.trabajado) {

    if (dia.periodoAlto) {
      return "PERIODO ALTO";
    }

    return "Trabajado";
  }


  return "-";
};


// =====================================================
// PRIMAS DOMINICALES
// =====================================================

const obtenerPrimasDominicales = (
  tecnico
) => {

  return ordenarDias(
    tecnico
  )
    .filter(
      ([, dia]) =>
        dia?.esDomingo &&
        dia?.trabajado
    )
    .map(
      ([fecha, dia]) => ({
        fecha,
        horas:
          dia.segundosReportados ||
          0,
      })
    );
};


// =====================================================
// FESTIVOS
// =====================================================

const obtenerFestivos = (
  tecnico
) => {

  return ordenarDias(
    tecnico
  )
    .filter(
      ([, dia]) =>
        dia?.esFestivo
    )
    .map(
      ([fecha, dia]) => ({
        fecha,

        nombre:
          dia.festivoNombre ||
          "Día festivo",

        trabajado:
          dia.trabajado === true,

        horas:
          dia.segundosReportados ||
          0,

        esDomingo:
          dia.esDomingo === true,
      })
    );
};


// =====================================================
// ENCABEZADO GENERAL
// =====================================================

const agregarEncabezado = (
  doc,
  nomina
) => {

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  doc.text(
    "NÓMINA DETALLADA",
    14,
    16
  );


  doc.setFontSize(10);

  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.text(
    `Periodo: ${fechaVisual(
      nomina.periodoInicio
    )} al ${fechaVisual(
      nomina.periodoFin
    )}`,
    14,
    24
  );


  doc.text(
    `Fecha de cierre: ${timestampATexto(
      nomina.fechaCierre
    )}`,
    14,
    30
  );


  doc.text(
    `Archivo origen: ${textoSeguro(
      nomina.nombreArchivo
    )}`,
    14,
    36
  );


  doc.text(
    `Técnicos: ${
      nomina.cantidadTecnicos ??
      nomina.resumenTecnicos
        ?.length ??
      0
    }`,
    14,
    42
  );


  doc.text(
    `Registros: ${
      nomina.cantidadRegistros ??
      0
    }`,
    70,
    42
  );
};


// =====================================================
// PORTADA / RESUMEN
// =====================================================

const agregarResumenGeneral = (
  doc,
  nomina
) => {

  agregarEncabezado(
    doc,
    nomina
  );


  const filas =
    (
      nomina.resumenTecnicos ||
      []
    ).map(
      (tecnico) => [

        textoSeguro(
          tecnico.nombre
        ),

        segundosAHoras(
          tecnico
            .segundosReportadosTotal ||
          0
        ),

        segundosAHoras(
          tecnico
            .segundosContabilizadosTotal ||
          0
        ),

        tecnico.faltas ?? 0,

        tecnico.diasTrabajados ??
        0,

        tecnico
          .domingosTrabajados ??
        0,

        tecnico
          .festivosTrabajados ??
        0,

        tecnico.diasPeriodoAlto >
        0
          ? `ALERTA ${tecnico.diasPeriodoAlto}`
          : "OK",
      ]
    );


  autoTable(doc, {

    startY: 50,

    head: [[
      "Técnico",
      "Reportadas",
      "Contabilizadas",
      "Faltas",
      "Días trabajados",
      "Prima dominical",
      "Festivos",
      "Alertas",
    ]],

    body: filas,

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
    },

    headStyles: {
      fontStyle: "bold",
    },

    columnStyles: {
      0: {
        cellWidth: 55,
      },
    },

    margin: {
      left: 14,
      right: 14,
    },
  });
};


// =====================================================
// RESUMEN INDIVIDUAL
// =====================================================

const agregarResumenTecnico = (
  doc,
  tecnico,
  nomina
) => {

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(17);

  doc.text(
    textoSeguro(
      tecnico.nombre
    ),
    14,
    17
  );


  doc.setFontSize(9);

  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.text(
    `Periodo: ${fechaVisual(
      nomina.periodoInicio
    )} al ${fechaVisual(
      nomina.periodoFin
    )}`,
    14,
    24
  );


  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);

  doc.text(
    "RESUMEN DEL TÉCNICO",
    14,
    34
  );


  autoTable(doc, {

    startY: 38,

    head: [[
      "Horas reportadas",
      "Horas contabilizadas",
      "Faltas",
      "Días trabajados",
      "Sábados",
      "Domingos",
      "Alertas",
    ]],

    body: [[

      segundosAHoras(
        tecnico
          .segundosReportadosTotal ||
        0
      ),

      segundosAHoras(
        tecnico
          .segundosContabilizadosTotal ||
        0
      ),

      tecnico.faltas ?? 0,

      tecnico.diasTrabajados ??
      0,

      tecnico.sabadosTrabajados ??
      tecnico.guardiasSabado ??
      0,

      tecnico.domingosTrabajados ??
      0,

      tecnico.diasPeriodoAlto >
      0
        ? `${tecnico.diasPeriodoAlto} día(s)`
        : "Sin alertas",
    ]],

    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: "center",
    },

    headStyles: {
      fontStyle: "bold",
    },

    margin: {
      left: 14,
      right: 14,
    },
  });


  return (
    doc.lastAutoTable
      ?.finalY || 50
  ) + 8;
};


// =====================================================
// PRIMA DOMINICAL
// =====================================================

const agregarPrimasDominicales = (
  doc,
  tecnico,
  inicioY
) => {

  const primas =
    obtenerPrimasDominicales(
      tecnico
    );


  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);

  doc.text(
    "PRIMAS DOMINICALES",
    14,
    inicioY
  );


  if (!primas.length) {

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.text(
      "No se registraron primas dominicales.",
      14,
      inicioY + 6
    );

    return inicioY + 13;
  }


  autoTable(doc, {

    startY:
      inicioY + 3,

    head: [[
      "Fecha",
      "Día",
      "Horas trabajadas",
      "Concepto",
    ]],

    body:
      primas.map(
        (prima) => [

          fechaVisual(
            prima.fecha
          ),

          "Domingo",

          segundosAHoras(
            prima.horas
          ),

          "Prima dominical",
        ]
      ),

    styles: {
      fontSize: 8,
      cellPadding: 2,
    },

    headStyles: {
      fontStyle: "bold",
    },

    margin: {
      left: 14,
      right: 14,
    },
  });


  return (
    doc.lastAutoTable
      ?.finalY ||
    inicioY + 15
  ) + 8;
};


// =====================================================
// DÍAS FESTIVOS
// =====================================================

const agregarFestivos = (
  doc,
  tecnico,
  inicioY
) => {

  const festivos =
    obtenerFestivos(
      tecnico
    );


  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);

  doc.text(
    "DÍAS FESTIVOS",
    14,
    inicioY
  );


  if (!festivos.length) {

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.text(
      "No hay días festivos dentro del periodo.",
      14,
      inicioY + 6
    );

    return inicioY + 13;
  }


  autoTable(doc, {

    startY:
      inicioY + 3,

    head: [[
      "Fecha",
      "Día festivo",
      "Estado",
      "Horas trabajadas",
    ]],

    body:
      festivos.map(
        (festivo) => [

          fechaVisual(
            festivo.fecha
          ),

          festivo.nombre,

          festivo.trabajado
            ? festivo.esDomingo
              ? "Trabajado + Prima dominical"
              : "Trabajado"
            : "Descanso",

          festivo.trabajado
            ? segundosAHoras(
                festivo.horas
              )
            : "00:00:00",
        ]
      ),

    styles: {
      fontSize: 8,
      cellPadding: 2,
    },

    headStyles: {
      fontStyle: "bold",
    },

    columnStyles: {
      1: {
        cellWidth: 75,
      },
    },

    margin: {
      left: 14,
      right: 14,
    },
  });


  return (
    doc.lastAutoTable
      ?.finalY ||
    inicioY + 15
  ) + 8;
};


// =====================================================
// DETALLE DIARIO
// =====================================================

const agregarDetalleDiario = (
  doc,
  tecnico,
  inicioY
) => {

  if (inicioY > 155) {
    doc.addPage();
    inicioY = 18;
  }


  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(12);

  doc.text(
    "DETALLE DE HORAS POR DÍA",
    14,
    inicioY
  );


  const filas =
    ordenarDias(
      tecnico
    ).map(
      ([fecha, dia]) => {

        const reportadas =
          dia?.segundosReportados ||
          0;

        const contabilizadas =
          dia?.segundosContabilizados ||
          0;


        return [

          fechaVisual(
            fecha
          ),

          nombreDiaPDF(
            fecha
          ),

          segundosAHoras(
            reportadas
          ),

          segundosAHoras(
            contabilizadas
          ),

          obtenerEstadoDia(
            dia
          ),

          dia?.periodoAlto
            ? `Reportado ${segundosAHoras(
                reportadas
              )} / máximo 08:00:00`
            : "",
        ];
      }
    );


  autoTable(doc, {

    startY:
      inicioY + 4,

    head: [[
      "Fecha",
      "Día",
      "Reportadas",
      "Contabilizadas",
      "Estado / concepto",
      "Observación",
    ]],

    body: filas,

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
      overflow: "linebreak",
    },

    headStyles: {
      fontStyle: "bold",
    },

    columnStyles: {

      0: {
        cellWidth: 28,
      },

      1: {
        cellWidth: 28,
      },

      2: {
        cellWidth: 30,
        halign: "center",
      },

      3: {
        cellWidth: 32,
        halign: "center",
      },

      4: {
        cellWidth: 75,
      },

      5: {
        cellWidth: 70,
      },
    },

    margin: {
      left: 14,
      right: 14,
    },

    didParseCell: (
      data
    ) => {

      if (
        data.section !==
        "body"
      ) {
        return;
      }


      const fila =
        data.row.raw;

      const estado =
        String(
          fila?.[4] || ""
        );


      if (
        estado.includes(
          "FALTA"
        )
      ) {

        data.cell.styles
          .fontStyle =
          "bold";
      }


      if (
        estado.includes(
          "Prima dominical"
        )
      ) {

        data.cell.styles
          .fontStyle =
          "bold";
      }


      if (
        estado.includes(
          "Festivo"
        ) ||
        estado.includes(
          "festivo"
        )
      ) {

        data.cell.styles
          .fontStyle =
          "bold";
      }


      if (
        estado.includes(
          "PERIODO ALTO"
        )
      ) {

        data.cell.styles
          .fontStyle =
          "bold";
      }
    },
  });
};


// =====================================================
// PIE DE PÁGINA
// =====================================================

const agregarPiePaginas = (
  doc,
  nomina
) => {

  const totalPaginas =
    doc.getNumberOfPages();


  for (
    let pagina = 1;
    pagina <= totalPaginas;
    pagina += 1
  ) {

    doc.setPage(
      pagina
    );


    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);


    doc.text(
      `Nómina ${fechaVisual(
        nomina.periodoInicio
      )} al ${fechaVisual(
        nomina.periodoFin
      )}`,
      14,
      202
    );


    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      283,
      202,
      {
        align: "right",
      }
    );
  }
};


// =====================================================
// GENERAR PDF
// =====================================================

export const generarPDFNominaHistorica = (
  nomina
) => {

  if (!nomina) {

    throw new Error(
      "No existe una Nómina histórica para generar."
    );
  }


  const tecnicos =
    nomina.resumenTecnicos ||
    [];


  if (!tecnicos.length) {

    throw new Error(
      "La Nómina histórica no contiene técnicos."
    );
  }


  const doc =
    new jsPDF({
      orientation:
        "landscape",

      unit:
        "mm",

      format:
        "a4",
    });


  // ===================================================
  // PÁGINA 1 - RESUMEN
  // ===================================================

  agregarResumenGeneral(
    doc,
    nomina
  );


  // ===================================================
  // UNA SECCIÓN POR TÉCNICO
  // ===================================================

  tecnicos.forEach(
    (tecnico) => {

      doc.addPage();


      let y =
        agregarResumenTecnico(
          doc,
          tecnico,
          nomina
        );


      y =
        agregarPrimasDominicales(
          doc,
          tecnico,
          y
        );


      if (y > 160) {
        doc.addPage();
        y = 18;
      }


      y =
        agregarFestivos(
          doc,
          tecnico,
          y
        );


      agregarDetalleDiario(
        doc,
        tecnico,
        y
      );
    }
  );


  // ===================================================
  // PIE DE PÁGINA
  // ===================================================

  agregarPiePaginas(
    doc,
    nomina
  );


  // ===================================================
  // DESCARGAR
  // ===================================================

  doc.save(
    obtenerNombreArchivo(
      nomina
    )
  );
};