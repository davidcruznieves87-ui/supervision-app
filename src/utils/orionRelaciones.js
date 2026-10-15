// Motor compartido de relaciones Orion. Solo lectura; no modifica Firestore.
export const orionText = (v) => String(v ?? "");
export const orionFirst = (o, ...ks) => { for (const k of ks) if (o?.[k] !== undefined && o[k] !== null && o[k] !== "") return o[k]; return null; };
export const orionFecha = (v) => { if (!v) return null; if (typeof v?.toDate === "function") return v.toDate(); if (typeof v?.seconds === "number") return new Date(v.seconds * 1000); const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
export const orionFechaDe = (x) => orionFirst(x, "fechaCorreo", "fechaRecepcion", "fecha", "fechaCreacion", "receivedTime");
export const orionCuerpo = (x) => orionText(orionFirst(x, "contenidoOriginal", "cuerpo", "body", "descripcion", "detalle"));
export const orionAsunto = (x) => orionText(orionFirst(x, "asunto", "subject"));
export const orionTipo = (x) => orionText(orionFirst(x, "tipo", "tipoCorreo")).toUpperCase().trim();
export const orionFolio = (x, tipo) => {
  const keys = tipo === "SF" ? ["sfId", "sf", "folioSF", "folio", "numero"] : ["tcId", "tc", "folioTC", "folio", "numero"];
  const value = orionFirst(x, ...keys);
  const direct = orionText(value).match(/\d{3,}/);
  if (direct) return direct[0];
  const m = orionAsunto(x).match(new RegExp(`\\b${tipo}\\s*#?\\s*(\\d{3,})\\b`, "i"));
  return m?.[1] || "";
};
export const orionSala = (x) => {
  const explicit = orionFirst(x, "sala", "sitio", "nombreSala");
  if (explicit) return orionText(explicit);
  const m = orionAsunto(x).match(/\b(?:SF|TC)\s*#?\s*\d+(?:-\d+)?\s*[-–—]\s*(.+)$/i);
  return m?.[1]?.trim() || "—";
};

// La tabla de SF incluye un identificador de falla (6261-1), y un estado
// al final de la fila (FIXED, PENDING, etc.). Nunca inferimos FIXED
// por la mera presencia del identificador.
export function extraerSubfoliosSF(sf) {
  const body = orionCuerpo(sf).replace(/\r/g, "\n");
  const section = body.match(/Technical\s+calls\s+Attended\b([\s\S]*?)(?=\bRemarks\b|\bObservations\b|$)/i)?.[1] || "";
  if (!section) return [];
  const folioSF = orionFolio(sf, "SF");
  const salida = [];
  // Separamos al inicio de cada subfolio, aun cuando Outlook aplane la tabla en una sola línea.
  const marker = /\b(\d{3,7})\s*-\s*(\d{1,3})\b/g;
  const found = [...section.matchAll(marker)];
  for (let i = 0; i < found.length; i++) {
    const m = found[i];
    const fragment = section.slice(m.index + m[0].length, found[i + 1]?.index ?? section.length);
    const statusMatches = [...fragment.matchAll(/\b(FIXED|RESOLVED|CLOSED|PENDING|OPEN|IN\s+PROGRESS|NOT\s+FIXED|UNRESOLVED)\b/gi)];
    const raw = statusMatches.length ? statusMatches[statusMatches.length - 1][1].toUpperCase().replace(/\s+/g, " ") : "SIN ESTADO";
    const estado = raw === "FIXED" ? "CERRADO" : "NO CONFIRMADO";
    salida.push({ tc: m[1], subfolio: `${m[1]}-${m[2]}`, estadoOrion: raw, estado, sf: folioSF, sala: orionSala(sf), fecha: orionFechaDe(sf), fuenteId: sf.id, asuntoSF: orionAsunto(sf), fragmento: fragment.trim().slice(0, 1500) });
  }
  return salida;
}

export function construirRelacionesTC(correos) {
  const sfCorreos = correos.filter(x => orionTipo(x) === "SF" || (!orionTipo(x) && /\bSF\s*\d{3,}/i.test(orionAsunto(x))));
  const porSubfolio = new Map();
  for (const sf of sfCorreos) {
    for (const r of extraerSubfoliosSF(sf)) {
      if (!r.sf) continue;
      const list = porSubfolio.get(r.subfolio) || [];
      // La misma SF puede notificar varias veces; conservamos fuentes sin duplicar la relación.
      const existing = list.find(x => x.sf === r.sf);
      if (!existing) list.push({...r, fuentes: [r.fuenteId]});
      else {
        if (!existing.fuentes.includes(r.fuenteId)) existing.fuentes.push(r.fuenteId);
        if (r.estado === "CERRADO") Object.assign(existing, {...r, fuentes: existing.fuentes});
      }
      porSubfolio.set(r.subfolio, list);
    }
  }
  return porSubfolio;
}
export function relacionesDeTC(mapa, tc) {
  const n = orionText(tc).match(/\d{3,}/)?.[0];
  if (!n) return [];
  return [...mapa.entries()].filter(([sub]) => sub.startsWith(`${n}-`)).flatMap(([,rs]) => rs).sort((a,b) => a.subfolio.localeCompare(b.subfolio, "es", {numeric:true}));
}
