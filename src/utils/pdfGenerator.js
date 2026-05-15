import jsPDF from "jspdf";

const convertirImagenABase64 =
  (url) => {

    return new Promise(
      (resolve, reject) => {

        // 🔥 SI YA ES BASE64
        if (
          url.startsWith("data:image")
        ) {

          resolve(url);

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

            canvas.width =
              img.width;

            canvas.height =
              img.height;

            const ctx =
              canvas.getContext("2d");

            ctx.drawImage(
              img,
              0,
              0
            );

            const dataURL =
              canvas.toDataURL(
                "image/jpeg",
                0.7
              );

            resolve(dataURL);

          } catch (error) {

            reject(error);
          }
        };

        img.onerror =
          reject;

        img.src = url;
      }
    );
  };

export const generarPDFSupervision =
  async ({
    folio,
    sitio,
    tecnico,
    fallas,
  }) => {

    const pdf =
      new jsPDF();

    pdf.setFontSize(18);

    pdf.text(
      "Reporte de Supervisión",
      20,
      20
    );

    pdf.setFontSize(12);

    pdf.text(
      `Folio: ${folio}`,
      20,
      40
    );

    pdf.text(
      `Sitio: ${sitio}`,
      20,
      50
    );

    pdf.text(
      `Técnico: ${tecnico}`,
      20,
      60
    );

    let y = 80;

    for (const falla of fallas) {

      // 🔥 SALTO DE PAGINA
      if (y > 220) {

        pdf.addPage();

        y = 20;
      }

      pdf.setFontSize(14);

      pdf.text(
        `VLT: ${falla.vlt}`,
        20,
        y
      );

      y += 10;

      pdf.setFontSize(12);

      pdf.text(
        `Falla: ${falla.descripcion}`,
        20,
        y
      );

      y += 10;

      pdf.text(
        `Urgencia: ${falla.urgencia}`,
        20,
        y
      );

      y += 15;

      // 🔥 IMAGEN NUEVA
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

          pdf.addImage(
            imagenBase64,
            "JPEG",
            20,
            y,
            70,
            50
          );

          y += 60;

        } catch (error) {

          console.log(
            "Error imagen:",
            error
          );
        }
      }

      y += 20;
    }

    pdf.save(
      `Supervision-${folio}.pdf`
    );
  };