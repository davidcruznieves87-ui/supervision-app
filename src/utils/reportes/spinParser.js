// =========================
// FECHA SPIN
// =========================

export const obtenerFechaSpin =
  (nombre) => {

    try {

      // (2026-05-01)

      const match =
        nombre.match(
          /\((\d{4}-\d{2}-\d{2})\)/
        );

      if (!match) {
        return null;
      }

      return match[1];

    } catch (error) {

      console.error(
        "❌ Error fecha Spin:",
        error
      );

      return null;
    }
};

// =========================
// SALA SPIN
// =========================

export const obtenerSalaSpin =
  () => {

    return "SPIN";
};