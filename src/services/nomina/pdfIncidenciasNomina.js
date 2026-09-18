import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  fechaVisual,
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


const ordenarDias = (tecnico) => {
  return Object.entries(
    tecnico?.dias || {}
  ).sort(
    ([fechaA], [fechaB]) =>
      fechaA.localeCompare(fechaB)
  );
};


const nombreArchivo = (nomina) => {
  const inicio =
    nomina?.periodoInicio ||
    "inicio";

  const fin =
    nomina?.periodoFin ||
    "fin";

  return `Incidencias_Nomina_${inicio}_${fin}.pdf`;
};


// =====================================================
// EXTRAER PRIMAS DOMINICALES
// =====================================================

const obtenerPrimasDominicales = (
  tecnicos
) => {

  const resultado = [];

  tecnicos.forEach(
    (tecnico) => {

      ordenarDias(
        tecnico
      ).forEach(
        ([fecha, dia]) => {

          if (
            dia?.esDomingo &&
            dia?.trabajado
          ) {

            resultado.push({
              tecnico:
                tecnico.nombre,

              fecha,
            });
          }
        }
      );
    }
  );


  return resultado.sort(
    (a, b) =>
      a.fecha.localeCompare(
        b.fecha
      ) ||
      a.tecnico.localeCompare(
        b.tecnico
      )
  );
};


// =====================================================
// EXTRAER FESTIVOS TRABAJADOS
// =====================================================

const obtenerFestivosTrabajados = (
  tecnicos
) => {

  const resultado = [];

  tecnicos.forEach(
    (tecnico) => {

      ordenarDias(
        tecnico
      ).forEach(
        ([fecha, dia]) => {

          if (
            dia?.esFestivo &&
            dia?.trabajado
          ) {

            resultado.push({
              tecnico:
                tecnico.nombre,

              fecha,

              nombre:
                dia.festivoNombre ||
                "Día festivo",
            });
          }
        }
      );
    }
  );


  return resultado.sort(
    (a, b) =>
      a.fecha.localeCompare(
        b.fecha
      ) ||
      a.tecnico.localeCompare(
        b.tecnico
      )
  );
};


// =====================================================
// EXTRAER FALTAS
// =====================================================

const obtenerFaltas = (
  tecnicos
) => {

  const resultado = [];

  tecnicos.forEach(
    (tecnico) => {

      ordenarDias(
        tecnico
      ).forEach(
        ([fecha, dia]) => {

          if (
            dia?.esFalta === true
          ) {

            resultado.push({
              tecnico:
                tecnico.nombre,

              fecha,
            });
          }
        }
      );
    }
  );


  return resultado.sort(
    (a, b) =>
      a.fecha.localeCompare(
        b.fecha
      ) ||
      a.tecnico.localeCompare(
        b.tecnico
      )
  );
};


// =====================================================
// TÍTULO DE SECCIÓN
// =====================================================

const tituloSeccion = (
  doc,
  titulo,
  y
) => {

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(12);

  doc.text(
    titulo,
    14,
    y
  );
};


// =====================================================
// CONTROL DE ESPACIO
// =====================================================

const comprobarEspacio = (
  doc,
  y,
  espacio = 35
) => {

  const altoPagina =
    doc.internal.pageSize.getHeight();

  if (
    y + espacio >
    altoPagina - 18
  ) {

    doc.addPage();

    return 18;
  }

  return y;
};


// =====================================================
// GENERAR PDF
// =====================================================

export const generarPDFIncidenciasNomina = (
  nomina
) => {

  if (!nomina) {

    throw new Error(
      "No existe información de Nómina para generar el reporte."
    );
  }


  const tecnicos =
    nomina.resumenTecnicos ||
    [];


  if (!tecnicos.length) {

    throw new Error(
      "La Nómina no contiene información de técnicos."
    );
  }


  // ===================================================
  // OBTENER INCIDENCIAS
  // ===================================================

  const primas =
    obtenerPrimasDominicales(
      tecnicos
    );


  const festivos =
    obtenerFestivosTrabajados(
      tecnicos
    );


  const faltas =
    obtenerFaltas(
      tecnicos
    );


  // ===================================================
  // CREAR DOCUMENTO
  // ===================================================

  const doc =
    new jsPDF({
      orientation:
        "portrait",

      unit:
        "mm",

      format:
        "a4",
    });


  // ===================================================
  // ENCABEZADO
  // ===================================================

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  doc.text(
    "REPORTE DE INCIDENCIAS DE NÓMINA",
    105,
    18,
    {
      align:
        "center",
    }
  );


  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(10);


  doc.text(
    `Periodo de Nómina: ${fechaVisual(
      nomina.periodoInicio
    )} al ${fechaVisual(
      nomina.periodoFin
    )}`,
    14,
    30
  );


  doc.text(
    `Fecha de cierre: ${timestampATexto(
      nomina.fechaCierre
    )}`,
    14,
    36
  );


  doc.text(
    `Archivo origen: ${textoSeguro(
      nomina.nombreArchivo
    )}`,
    14,
    42
  );


  doc.text(
    `Técnicos procesados: ${tecnicos.length}`,
    14,
    48
  );


  doc.text(
    `Total incidencias: ${
      primas.length +
      festivos.length +
      faltas.length
    }`,
    14,
    54
  );


  let y = 66;


  // ===================================================
  // PRIMAS DOMINICALES
  // ===================================================

  y =
    comprobarEspacio(
      doc,
      y
    );


  tituloSeccion(
    doc,
    "PRIMAS DOMINICALES",
    y
  );


  if (primas.length) {

    autoTable(doc, {

      startY:
        y + 4,

      head: [[
        "Técnico",
        "Fecha",
      ]],

      body:
        primas.map(
          (item) => [

            item.tecnico,

            fechaVisual(
              item.fecha
            ),
          ]
        ),

      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign:
          "middle",
      },

      headStyles: {
        fontStyle:
          "bold",
      },

      columnStyles: {

        0: {
          cellWidth: 115,
        },

        1: {
          cellWidth: 60,
          halign:
            "center",
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    });


    y =
      (
        doc.lastAutoTable
          ?.finalY ||
        y + 15
      ) + 10;

  } else {

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.text(
      "Sin primas dominicales en este periodo.",
      14,
      y + 7
    );

    y += 17;
  }


  // ===================================================
  // FESTIVOS TRABAJADOS
  // ===================================================

  y =
    comprobarEspacio(
      doc,
      y,
      45
    );


  tituloSeccion(
    doc,
    "DÍAS FESTIVOS TRABAJADOS",
    y
  );


  if (festivos.length) {

    autoTable(doc, {

      startY:
        y + 4,

      head: [[
        "Técnico",
        "Fecha",
        "Día festivo",
      ]],

      body:
        festivos.map(
          (item) => [

            item.tecnico,

            fechaVisual(
              item.fecha
            ),

            item.nombre,
          ]
        ),

      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign:
          "middle",
      },

      headStyles: {
        fontStyle:
          "bold",
      },

      columnStyles: {

        0: {
          cellWidth: 75,
        },

        1: {
          cellWidth: 35,
          halign:
            "center",
        },

        2: {
          cellWidth: 65,
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    });


    y =
      (
        doc.lastAutoTable
          ?.finalY ||
        y + 15
      ) + 10;

  } else {

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.text(
      "Sin días festivos trabajados en este periodo.",
      14,
      y + 7
    );

    y += 17;
  }


  // ===================================================
  // FALTAS
  // ===================================================

  y =
    comprobarEspacio(
      doc,
      y,
      45
    );


  tituloSeccion(
    doc,
    "FALTAS",
    y
  );


  if (faltas.length) {

    autoTable(doc, {

      startY:
        y + 4,

      head: [[
        "Técnico",
        "Fecha de falta",
      ]],

      body:
        faltas.map(
          (item) => [

            item.tecnico,

            fechaVisual(
              item.fecha
            ),
          ]
        ),

      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign:
          "middle",
      },

      headStyles: {
        fontStyle:
          "bold",
      },

      columnStyles: {

        0: {
          cellWidth: 115,
        },

        1: {
          cellWidth: 60,
          halign:
            "center",
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    });

  } else {

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.text(
      "Sin faltas registradas en este periodo.",
      14,
      y + 7
    );
  }


  // ===================================================
  // PIE DE PÁGINA
  // ===================================================

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


    const altoPagina =
      doc.internal.pageSize.getHeight();


    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);


    doc.text(
      `Nómina: ${fechaVisual(
        nomina.periodoInicio
      )} al ${fechaVisual(
        nomina.periodoFin
      )}`,
      14,
      altoPagina - 8
    );


    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      196,
      altoPagina - 8,
      {
        align:
          "right",
      }
    );
  }


  // ===================================================
  // GUARDAR
  // ===================================================

  doc.save(
    nombreArchivo(
      nomina
    )
  );
};