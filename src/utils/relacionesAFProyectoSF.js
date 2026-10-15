// Índice documental AF -> PJ -> SF. Solo lectura; no infiere cierres.
const val = v => String(v ?? "");
const first = (o, ...keys) => keys.map(k => o?.[k]).find(v => v !== undefined && v !== null && v !== "");
const body = x => val(first(x, "contenidoOriginal", "cuerpo", "body", "descripcion", "detalle"));
const subject = x => val(first(x, "asunto", "subject"));
const number = x => val(x).match(/\d{2,}/)?.[0] || "";
const arr = v => v == null || v === "" ? [] : Array.isArray(v) ? v : [v];
const nums = v => arr(v).map(x => number(typeof x === "object" ? first(x,"folio","numero","id") : x)).filter(Boolean);
const unique = values => [...new Set(values.filter(Boolean))];
const matches = (text, re) => [...text.matchAll(re)].map(m => m[1]);

// Los correos de Proyecto Orion pueden referirse a una AF como
// "Hoja de Actividad 1994 | CARRUSEL | ...", sin escribir el prefijo AF.
// Exigir el encabezado completo evita relacionar por números sueltos.
const referencesAF = x => unique([
  ...nums(first(x,"afRelacionadas","afId","folioAF","af")),
  ...matches(subject(x) + " " + body(x), /\bAF\s*(?:N[uú]m(?:ero)?\.?\s*[:#-]?\s*|[#:-]\s*|)(\d{2,})\b/gi),
  ...matches(body(x), /\bHoja\s+de\s+Actividad\s*[:#-]?\s*(\d{2,})\b/gi),
]);
const referencesPJ = x => unique([
  ...nums(first(x,"proyectos","pjs","pjRelacionados","proyectosRelacionados","proyectoId","pjId","folioPJ","pj","proyecto")),
  ...matches(subject(x) + " " + body(x), /\b(?:PJ|PROJECT|PROYECTO)\s*(?:N[uú]m(?:ero)?\.?\s*[:#-]?\s*|[#:-]\s*|)(\d{2,})\b/gi),
  // Formato SF Orion: "Project\n_____\n\n3618". Solo el bloque de encabezado.
  ...matches(body(x), /\b(?:Project|Proyecto)\s*\r?\n\s*_{3,}\s*\r?\n\s*(\d{2,})\b/gi),
]);
const projectFolio = x => number(first(x,"proyectoId","pjId","folioPJ","pj","folio","numero")) ||
  (subject(x).match(/\b(?:PJ|PROJECT|PROYECTO)\s*#?\s*(\d{2,})\b/i)?.[1] || "");
const sfFolio = x => number(first(x,"sfId","folioSF","sf","folio","numero")) ||
  (subject(x).match(/\bSF\s*#?\s*(\d{3,})\b/i)?.[1] || "");
const type = x => val(first(x,"tipo","tipoCorreo")).toUpperCase().trim();
const isProject = x => ["PJ","PROYECTO"].includes(type(x)) || (!type(x) && /\b(?:New|Nuevo|Updated|Auto)\s+(?:PJ|Project|Proyecto)\b/i.test(subject(x)));
const isSF = x => ["SF","HOJA_SERVICIO","HOJA DE SERVICIO"].includes(type(x)) || (!type(x) && /\b(?:New|Nuevo)\s+SF\b/i.test(subject(x)));
const origin = x => `${x._coleccion || (type(x) ? "orion_correos" : "orion_proyectos")}/${x.id || "sin-id"}`;
const add = (map, folio, fuente) => {
  if (!folio) return;
  if (!map.has(folio)) map.set(folio, {folio, fuentes:[]});
  const item = map.get(folio);
  if (!item.fuentes.some(x => x.documento === fuente.documento && x.motivo === fuente.motivo)) item.fuentes.push(fuente);
};
export function crearIndiceAFProyectoSF(correos = [], proyectos = []) {
  const allProjects = [...proyectos, ...correos.filter(isProject)].filter(isProject);
  const projects = new Map();
  for (const p of allProjects) {
    const n = projectFolio(p);
    if (!n) continue;
    if (!projects.has(n)) projects.set(n, []);
    projects.get(n).push(p);
  }
  const sheets = new Map();
  for (const s of correos.filter(isSF)) {
    const n = sfFolio(s);
    if (!n) continue;
    if (!sheets.has(n)) sheets.set(n, []);
    sheets.get(n).push(s);
  }
  return {projects, sheets};
}
export function resolverAFProyectoSF(indice, af, documentosAF = [], pjExplicitos = []) {
  const afId = number(af);
  const proyectos = new Map();
  for (const pj of pjExplicitos.map(number).filter(Boolean)) {
    add(proyectos,pj,{documento:`AF ${afId}`,motivo:"Proyecto indicado en ficha AF"});
  }
  for (const a of documentosAF) for (const pj of referencesPJ(a)) {
    add(proyectos,pj,{documento:origin(a),motivo:"Proyecto mencionado en notificación AF"});
  }
  for (const [pj, documentos] of indice.projects) {
    for (const p of documentos) {
      if (afId && referencesAF(p).includes(afId)) {
        add(proyectos,pj,{documento:origin(p),motivo:"AF mencionada explícitamente en PJ"});
      }
    }
  }
  const hojas = new Map();
  for (const [sf, documentos] of indice.sheets) {
    for (const doc of documentos) {
      const pjs = referencesPJ(doc).filter(pj=>proyectos.has(pj));
      const porAF = afId && referencesAF(doc).includes(afId);
      if (!pjs.length && !porAF) continue;
      if (!hojas.has(sf)) hojas.set(sf,{folio:sf,fuentes:[],porPJ:[],porAF:false});
      const item = hojas.get(sf);
      const fuente = origin(doc);
      if (!item.fuentes.includes(fuente)) item.fuentes.push(fuente);
      item.porPJ = unique([...item.porPJ,...pjs]);
      item.porAF ||= Boolean(porAF);
    }
  }
  const order = (a,b)=>Number(a.folio)-Number(b.folio);
  return {proyectos:[...proyectos.values()].sort(order),hojas:[...hojas.values()].sort(order)};
}
