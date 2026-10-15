// Catálogo operativo. No modifica Firestore ni filtra páginas por sí solo.
// Los alias deben verificarse contra los nombres reales que envía Orion.
export const ZONAS_SALAS = Object.freeze({
  TIJUANA: [
    "CARRUSEL", "OTAY ALAMEDA", "BOOK OTAY", "MACROPLAZA",
    "PUEBLO AMIGO", "LAZ BARRERA", "REVOLUCION", "JAI ALAI",
    "ENSENADA", "ENSENADA III", "YAK ENSENADA MACROPLAZA",
    "HIPODROMO DE AGUACALIENTE", "CLUB 333", "GALERIAS",
    "PLAZA RIO", "PLAYAS", "TECATE", "CALIENTE ROSARITO", "YAK ROSARITO"
  ],
  MEXICALI: [
    "MEXICALI WALDOS", "CALIMAX", "WINPOT MEXICALI",
    "GOLDEN LION MEXICALI", "HOORO", "WINPOT MANDARIN",
    "MEXICALI CIE", "WINCLUB", "MUNDO DIVERTIDO",
    "BIG BOLA SAN LUIS RIO COLORADO", "M CASINO SAN LUIS RIO COLORADO",
    "CASINO EMINE", "LUCKY CASH", "CENTRO CIVICO", "BOOK MELGAR", "CHINESCA"
  ],
  PACIFICO: [
    "Culiacán Forum", "Culiacán II Tres Ríos", "Culiacán 3 Ríos",
    "Tropicana Culiacán", "Flamingo Culiacán", "Vivento 4 Ríos",
    "Midas Guamúchil", "Durango", "Zafiro", "Mazatlán",
    "Midas Mazatlán", "París Gómez Palacio", "La Paz",
    "Central La Paz", "Fortune La Paz", "Capital Premium",
    "Los Cabos", "Caliente Nogales", "M. Nogales", "Palermo Nogales",
    "Winland Chihuahua", "Life Chihuahua", "Caliente Chihuahua",
    "PlayCity Juárez", "CIMA JRZ", "Fanattic JRZ", "Royalty",
    "Plaza Delicias Chihuahua", "Casino Hermosillo", "M. Rodríguez",
    "M. HMO", "Yak HMO", "PlayCity HMO", "Guaymas"
  ]
});

export const ZONAS = Object.freeze(Object.keys(ZONAS_SALAS));

export function normalizarNombreSala(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Mapeo conservador: solo coincidencias exactas tras normalización.
// No se asignan salas por coincidencias parciales (p. ej. PLAZA RIO).
const INDICE_SALAS = new Map();
for (const [zona, salas] of Object.entries(ZONAS_SALAS)) {
  for (const sala of salas) {
    const clave = normalizarNombreSala(sala);
    if (INDICE_SALAS.has(clave)) {
      throw new Error(`Sala duplicada entre zonas: ${sala}`);
    }
    INDICE_SALAS.set(clave, { zona, sala });
  }
}

export function identificarSala(nombreSala) {
  return INDICE_SALAS.get(normalizarNombreSala(nombreSala)) ?? null;
}

export function obtenerZonaSala(nombreSala) {
  return identificarSala(nombreSala)?.zona ?? null;
}

export function salasDeZona(zona) {
  return [...(ZONAS_SALAS[zona] ?? [])];
}

export function esSalaDeMisZonas(nombreSala) {
  return identificarSala(nombreSala) !== null;
}

// Útil para una auditoría previa a integrar filtros; no altera datos.
export function clasificarSalasObservadas(nombres = []) {
  return nombres.map((nombre) => ({
    nombre,
    ...(identificarSala(nombre) ?? { zona: null, sala: null })
  }));
}
