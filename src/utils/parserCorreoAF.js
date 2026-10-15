// Extracción de datos operativos desde el contenido original de los correos Orion.
const LABELS = ["AF Num.#", "AF Num.", "Requested by", "Req Date", "1st Approval", "1st Approval Date", "Site", "Activity", "Protocol", "Reason", "Status", "Destination", "Deadline", "Due Date", "Business Name", "Operator Name", "Fullname", "Address", "Contact Name", "Contact Email", "Contact Phone", "Group", "Machine Model", "Game Mix", "Special Indications", "Link"];
const clean = value => String(value ?? "").replace(/&(?:nbsp|#x20|#32);/gi, " ").replace(/\s+/g, " ").replace(/(?:\s*\|\s*)+$/g, "").trim();
const normalizeMail = value => String(value ?? "")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<\/?(?:tr|td|th|p|div|br|li|table)[^>]*>/gi, " \n ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&(?:nbsp|#x20|#32);/gi, " ")
  .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
  .replace(/\\\s*$/gm, " ").replace(/\r/g, " ").replace(/\*\*/g, "")
  .replace(/&#xA;/gi, " ").replace(/^\s*\|\s*\|\s*$/gm, " ");
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
const labels = LABELS.map(esc).join("|");
function getField(body, label) {
  const text = normalizeMail(body);
  const rx = new RegExp(`(?:^|[\\s|])${esc(label)}\\s*:\\s*(?:\\|\\s*)?([\\s\\S]*?)(?=(?:\\s|\\|)(?:${labels})\\s*:|This Email was sent|$)`, "i");
  const m = text.match(rx);
  return m ? clean(m[1]).replace(/^\|\s*/, "").replace(/\s*\|$/, "") : "";
}
function parseTerminals(body) {
  const text = normalizeMail(body);
  const matches = [...text.matchAll(/\bSN\s*:\s*([^|\n]+?)\s*\|\s*VLT\s*:\s*([^|\n]+?)\s*\|\s*LOC\s*:\s*([^|\n]+?)\s*\|/gi)];
  return matches.map((m, i) => {
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const fragment = text.slice(m.index + m[0].length, end).split(/Special\s+Indications\s*:|This Email was sent|\bStatus\s*:/i)[0];
    const parts = fragment.split(/-{2,}\s*>/);
    const before = parts[0].split("|").map(clean).filter(Boolean);
    return {
      sn: clean(m[1]), vlt: clean(m[2]), loc: clean(m[3]),
      juegoActual: before.length >= 3 ? before.slice(1, -1).join(" | ") : before.length === 2 ? before[1] : "",
      juegoNuevo: clean(parts[1] || "")
    };
  });
}
export function extraerDatosCorreoAF(body) {
  if (!body) return {};
  return {
    af: getField(body, "AF Num.#") || getField(body, "AF Num."),
    sala: getField(body, "Site"), tipoActividad: getField(body, "Activity"),
    protocolo: getField(body, "Protocol"), razon: getField(body, "Reason"),
    fechaLimite: getField(body, "Deadline") || getField(body, "Due Date"),
    cliente: getField(body, "Business Name"), operador: getField(body, "Operator Name"),
    contacto: getField(body, "Contact Name"), correo: getField(body, "Contact Email"),
    telefono: getField(body, "Contact Phone"), solicitante: getField(body, "Requested by"),
    direccion: getField(body, "Address"), indicacionesEspeciales: getField(body, "Special Indications"),
    terminales: parseTerminals(body)
  };
}
