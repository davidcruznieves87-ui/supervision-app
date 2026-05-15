
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const convertirImagenABase64 =
  (src) => {

    return new Promise(
      (resolve, reject) => {

        if (!src) {

          resolve(null);

          return;
        }

        // 🔥 YA ES BASE64
        if (
          typeof src === "string" &&
          src.startsWith("data:image")
        ) {

          resolve(src);

          return;
        }

        const img = new Image();

        img.crossOrigin =
          "Anonymous";

        img.onload = () => {

          try {

            const canvas =
              document.createElement(
                "canvas"
              );

            const MAX_WIDTH = 1200;

            let width =
              img.width;

            let height =
              img.height;

            // 🔥 REDUCIR TAMAÑO
            if (
              width > MAX_WIDTH
            ) {

              height *=
                MAX_WIDTH / width;

              width =
                MAX_WIDTH;
            }

            canvas.width =
              width;

            canvas.height =
              height;

            const ctx =
              canvas.getContext("2d");

            ctx.drawImage(
              img,
              0,
              0,
              width,
              height
            );

            // 🔥 FORZAR JPEG
            const base64 =
              canvas.toDataURL(
                "image/jpeg",
                0.8
              );

            resolve(base64);

          } catch (error) {

            reject(error);
          }
        };

        img.onerror =
          (error) => {

            console.log(
              "Error cargando imagen PDF:",
              error
            );

            reject(error);
          };

        img.src = src;
      }
    );
  };

const obtenerColorUrgencia =
  (urgencia) => {

    switch (urgencia) {

      case "Alta":
        return [220, 53, 69];

      case "Media":
        return [255, 193, 7];

      default:
        return [25, 135, 84];
    }
  };

export const generarPDFSupervision =
  async ({
    folio,
    sitio,
    tecnico,
    fallas,
    supervisor,
  }) => {

    const pdf =
      new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

    const fecha =
      new Date().toLocaleString();

    // =====================================
    // HEADER
    // =====================================

    pdf.setFillColor(
      20,
      28,
      48
    );

    pdf.rect(
      0,
      0,
      210,
      35,
      "F"
    );

    pdf.setTextColor(
      255,
      255,
      255
    );

    pdf.setFontSize(22);

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.text(
      "REPORTE DE SUPERVISION",
      20,
      18
    );

    pdf.setFontSize(10);

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.text(
      `Folio: ${folio}`,
      20,
      28
    );

    pdf.text(
      fecha,
      145,
      28
    );

    // =====================================
    // INFORMACION GENERAL
    // =====================================

    pdf.setTextColor(
      0,
      0,
      0
    );

    pdf.setFillColor(
      245,
      247,
      250
    );

    pdf.roundedRect(
      15,
      45,
      180,
      40,
      4,
      4,
      "F"
    );

    pdf.setFontSize(14);

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.text(
      "DATOS GENERALES",
      20,
      55
    );

    pdf.setFontSize(11);

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.text(
      `Sitio: ${sitio || "N/A"}`,
      20,
      65
    );

    pdf.text(
      `Tecnico: ${tecnico || "N/A"}`,
      20,
      73
    );

    pdf.text(
      `Supervisor: ${supervisor || "N/A"}`,
      110,
      65
    );

    pdf.text(
      `Total Fallas: ${fallas.length}`,
      110,
      73
    );

    // =====================================
    // TABLA RESUMEN
    // =====================================

    autoTable(pdf, {
      startY: 95,
      head: [[
        "VLT",
        "Descripcion",
        "Urgencia",
      ]],
      body: fallas.map(
        (falla) => [
          falla.vlt,
          falla.descripcion,
          falla.urgencia,
        ]
      ),
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [20, 28, 48],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    let y =
      pdf.lastAutoTable.finalY + 15;

    // =====================================
    // FALLAS DETALLADAS
    // =====================================

    for (const falla of fallas) {

      if (y > 220) {

        pdf.addPage();

        y = 20;
      }

      // CARD
      pdf.setFillColor(
        250,
        250,
        250
      );

      pdf.roundedRect(
        15,
        y,
        180,
        80,
        4,
        4,
        "F"
      );

      // TITULO VLT
      pdf.setFontSize(15);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        `VLT ${falla.vlt}`,
        20,
        y + 10
      );

      // BADGE URGENCIA
      const color =
        obtenerColorUrgencia(
          falla.urgencia
        );

      pdf.setFillColor(
        color[0],
        color[1],
        color[2]
      );

      pdf.roundedRect(
        145,
        y + 3,
        35,
        10,
        3,
        3,
        "F"
      );

      pdf.setTextColor(
        255,
        255,
        255
      );

      pdf.setFontSize(10);

      pdf.text(
        falla.urgencia,
        155,
        y + 10
      );

      // DESCRIPCION
      pdf.setTextColor(
        0,
        0,
        0
      );

      pdf.setFontSize(11);

      pdf.setFont(
        "helvetica",
        "normal"
      );

      const descripcion =
        pdf.splitTextToSize(
          falla.descripcion || "Sin descripcion",
          75
        );

      pdf.text(
        descripcion,
        20,
        y + 25
      );

      // IMAGEN
      if (falla.imagen) {

        try {

          const imagenURL =
            falla.imagen.preview ||
            falla.imagen.url ||
            falla.imagen;

          const imagenBase64 =
            await convertirImagenABase64(
              imagenURL
            );

          if (imagenBase64) {

            pdf.setFontSize(10);

            pdf.text(
              "EVIDENCIA:",
              110,
              y + 18
            );

            try {

  const imagenBase64 =
    await convertirImagenABase64(
      imagenURL
    );

  if (imagenBase64) {

    pdf.addImage(

  imagenBase64,

  "PNG",

  105,

  y + 22,

  70,

  45,

  undefined,

  "FAST"

);
  }

} catch (error) {

  console.log(
    "Error renderizando imagen PDF:",
    error
  );
}
          }

        } catch (error) {

          console.log(
            "Error imagen PDF:",
            error
          );
        }
      }

      y += 90;
    }

    // =====================================
    // FOOTER PAGINAS
    // =====================================

    const totalPages =
      pdf.internal.getNumberOfPages();

    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {

      pdf.setPage(i);

      pdf.setFontSize(9);

      pdf.setTextColor(
        120,
        120,
        120
      );

      pdf.text(
        `Pagina ${i} de ${totalPages}`,
        170,
        290
      );

      pdf.text(
        "Sistema de Supervision Enterprise",
        15,
        290
      );
    }

    pdf.save(
      `Supervision-${folio}.pdf`
    );
  };
