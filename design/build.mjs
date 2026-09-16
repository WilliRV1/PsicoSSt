// Compone los .dc.html y el canvas.json a partir de los módulos de pantalla.
// Cada artboard se escribe con el nombre con el que aparece en el lienzo.
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(DIR, 'artboards');
mkdirSync(OUT, { recursive: true });

const mods = {
  panel:       await import('./screens/panel.mjs'),
  fundamentos: await import('./screens/fundamentos.mjs'),
  acceso:      await import('./screens/acceso.mjs'),
  operacion:   await import('./screens/operacion.mjs'),
  evaluaciones: await import('./screens/evaluaciones.mjs'),
  informes:    await import('./screens/informes.mjs'),
  colectivos:  await import('./screens/colectivos.mjs'),
  analisis:    await import('./screens/analisis.mjs'),
  cuenta:      await import('./screens/cuenta.mjs'),
  admin:       await import('./screens/admin.mjs'),
  publico:     await import('./screens/publico.mjs'),
  pdf:         await import('./screens/pdf.mjs'),
};

// nombre en el lienzo · [módulo, export] · página · ancho · alto
// El orden dentro de cada página es el orden de lectura en el lienzo.
export const MANIFEST = [
  // ── Fundamentos ────────────────────────────────────────────────────
  ['Fundamentos',   'fundamentos.fundamentos', 'sistema',  1440, 3700],

  // ── Operación ──────────────────────────────────────────────────────
  ['Main',             'panel.panel',                        'operacion', 1440, 930],
  ['Empresas',         'operacion.empresas',                 'operacion', 1440, 900],
  ['EmpresaDetalle',   'operacion.empresaDetalle',           'operacion', 1440, 1030],
  ['Trabajadores',     'operacion.trabajadores',             'operacion', 1440, 900],
  ['TrabajadorDetalle','operacion.trabajadorDetalle',        'operacion', 1440, 1020],
  ['Evaluaciones',     'evaluaciones.evaluaciones',          'operacion', 1440, 900],
  ['Invitar',          'evaluaciones.invitar',               'operacion', 1440, 1030],
  ['Digitacion',       'evaluaciones.digitacion',            'operacion', 1440, 920],
  ['CargaMasiva',      'evaluaciones.cargaMasiva',           'operacion', 1440, 1090],
  ['ImportarTrabajadores','evaluaciones.importarTrabajadores','operacion', 1440, 900],

  // ── Informes ───────────────────────────────────────────────────────
  ['Informes',         'informes.informes',                  'informes',  1440, 900],
  ['InformeIndividual','informes.informeIndividual',         'informes',  1440, 2200],
  ['FirmarInforme',    'informes.firmar',                    'informes',  1440, 900],
  ['Diagnostico',      'colectivos.informeDiagnostico',      'informes',  1440, 1930],
  ['Sociodemografico', 'colectivos.informeSociodemografico', 'informes',  1440, 1280],
  ['ProgramaSVE',      'colectivos.programaSVE',             'informes',  1440, 1300],

  // ── Acceso ─────────────────────────────────────────────────────────
  ['Ingresar',      'acceso.login',            'acceso',    1440, 900],
  ['Registro',      'acceso.registro',         'acceso',    1440, 900],
  ['Recuperar',     'acceso.recuperar',        'acceso',    1440, 900],
  ['MfaActivar',    'acceso.mfaSetup',         'acceso',    1440, 900],
  ['MfaVerificar',  'acceso.mfaVerify',        'acceso',    1440, 900],
  ['EnRevision',    'acceso.pendiente',        'acceso',    1440, 900],

  // ── Análisis ───────────────────────────────────────────────────────
  ['Analitica',        'analisis.analitica',        'analisis', 1440, 1220],
  ['Tendencias',       'analisis.tendencias',       'analisis', 1440, 1080],
  ['Intervenciones',   'analisis.intervenciones',   'analisis', 1440, 1140],
  ['AsistenteIA',      'analisis.asistenteIA',      'analisis', 1440, 1070],

  // ── Cuenta y sistema ───────────────────────────────────────────────
  ['Creditos',         'cuenta.creditos',           'cuenta',   1440, 1020],
  ['Planes',           'cuenta.planes',             'cuenta',   1440, 1050],
  ['Equipo',           'cuenta.equipo',             'cuenta',   1440, 1110],
  ['Configuracion',    'cuenta.configuracion',      'cuenta',   1440, 1500],
  ['GuiaRapida',       'cuenta.tutorial',           'cuenta',   1440, 1130],

  // ── Administración ─────────────────────────────────────────────────
  ['PanelAdmin',       'admin.panelAdmin',          'admin',    1440, 1060],
  ['Psicologos',       'admin.psicologos',          'admin',    1440, 900],
  ['SolicitudPendiente','admin.solicitudPendiente', 'admin',    1440, 960],
  ['Auditoria',        'admin.auditoria',           'admin',    1440, 900],
  ['Comentarios',      'admin.feedback',            'admin',    1440, 1100],

  // ── Público ────────────────────────────────────────────────────────
  ['Portada',          'publico.portada',           'publico',  1440, 1830],
  ['InvitacionEmpresa','publico.invitacionEmpresa', 'publico',  1440, 900],
  ['Terminos',         'publico.terminos',          'publico',  1440, 1460],
  ['Privacidad',       'publico.privacidad',        'publico',  1440, 1460],
  ['Invitacion',       'publico.invitacion',        'publico',   390,  844],
  ['Consentimiento',   'publico.consentimiento',    'publico',   390,  844],
  ['FichaSocio',       'publico.fichaSociodemografica','publico', 390,  844],
  ['Cuestionario',     'publico.cuestionario',      'publico',   390,  844],
  ['Finalizado',       'publico.finalizado',        'publico',   390,  844],

  // ── PDF · A4 a 96 px por pulgada ───────────────────────────────────
  ['PdfPortada',       'pdf.pdfPortada',            'pdf',       794, 1123],
  ['PdfIndividual',    'pdf.pdfIndividual',         'pdf',       794, 1123],
  ['PdfColectivo',     'pdf.pdfColectivo',          'pdf',       794, 1123],
  ['PdfSociodemografico','pdf.pdfSociodemografico', 'pdf',       794, 1123],
  ['PdfIntervencion',  'pdf.pdfIntervencion',       'pdf',       794, 1123],
];

export const PAGINAS = [
  { id: 'operacion', name: 'Operación' },
  { id: 'sistema',   name: 'Sistema' },
  { id: 'acceso',    name: 'Acceso' },
  { id: 'informes',  name: 'Informes' },
  { id: 'analisis',  name: 'Análisis' },
  { id: 'cuenta',    name: 'Cuenta y sistema' },
  { id: 'admin',     name: 'Administración' },
  { id: 'publico',   name: 'Público' },
  { id: 'pdf',       name: 'PDF' },
];

// Limpieza: los artboards se regeneran enteros en cada build.
for (const f of readdirSync(OUT)) if (f.endsWith('.dc.html') || f === 'canvas.json') unlinkSync(join(OUT, f));

const GAP_X = 120, GAP_Y = 190, ANCHO_FILA = 4800;
const artboards = [];
const porPagina = new Map();

for (const [nombre, ref, pagina, w, h] of MANIFEST) {
  const [mod, exp] = ref.split('.');
  const html = mods[mod]?.[exp];
  if (typeof html !== 'string') throw new Error(`Falta el export ${ref} para "${nombre}"`);
  writeFileSync(join(OUT, `${nombre}.dc.html`), html);

  if (!porPagina.has(pagina)) porPagina.set(pagina, []);
  porPagina.get(pagina).push({ nombre, w, h });
}

// Disposición: se llena cada fila hasta ANCHO_FILA y se salta a la siguiente,
// cuya altura es la del artboard más alto de la fila anterior.
for (const [pagina, lista] of porPagina) {
  let y = 0, x = 0, altoFila = 0;
  for (const a of lista) {
    if (x > 0 && x + a.w > ANCHO_FILA) { y += altoFila + GAP_Y; x = 0; altoFila = 0; }
    const ab = { file: `${a.nombre}.dc.html`, x, y, w: a.w, h: a.h, page: pagina };
    if (pagina === 'pdf') ab.print = 'fixed';
    artboards.push(ab);
    x += a.w + GAP_X;
    altoFila = Math.max(altoFila, a.h);
  }
}

// Notas fijas: una por página, colocada arriba a la izquierda de su fila
// inicial. Explican la intención de diseño sin robarle sitio a las pantallas.
const NOTAS = {
  operacion: ['El núcleo diario. El Centro de control abre con la banda de\ndistribución de riesgo a todo el ancho en vez de cuatro\ntarjetas de estadística: una sola lectura, ordenada de menor\na mayor riesgo, legible también en gris.\n\nLa barra lateral pasa de 5 a 14 destinos agrupados en cuatro\nbloques. Hoy IA, analítica, tendencias, intervenciones,\ncréditos, trabajadores y el módulo admin no son alcanzables\ndesde la navegación.'],
  sistema:   ['La paleta, los radios y las familias salen tal cual de\nglobals.css. Lo que cambia es la escala: Barlow Semi\nCondensed sube de etiqueta de 10px a titular de 78px, y\nSource Serif 4 —hoy solo en los PDF— entra a pantalla para\nla narrativa interpretativa.\n\nEl ordinal de cinco pasos acompaña siempre a la píldora de\nriesgo, de modo que el nivel se lee por posición antes que\npor color.'],
  acceso:    ['Formulario sobre superficie blanca a la izquierda,\nargumento editorial sobre papel a la derecha. Es la\npartición que ya existe en login, con el lado derecho\nconvertido en página de verdad.\n\nEl segundo factor aparece como obligatorio, no opcional:\nuna cuenta abre historias clínicas de cientos de personas.'],
  informes:  ['El informe individual se compone como el documento que va a\nsalir en PDF, no como un tablero. La interpretación va en\nSource Serif 4 —la misma familia del PDF— y el carril\nderecho es lo único que no es el documento.\n\nEn los colectivos, la paleta categórica está verificada con\nel validador de la guía de visualización: ΔE 11,2 en el peor\npar adyacente bajo protanopía.'],
  analisis:  ['Las cuatro pantallas que hoy son un marcador de «próximamente»\nen el código: analítica, tendencias, intervenciones y el\nasistente.\n\nEn Intervenciones el criterio es que una recomendación sin\nresponsable y sin fecha no es una intervención. En el\nasistente, que ningún texto generado llega a un informe\nfirmado sin aprobación explícita registrada.'],
  cuenta:    ['Créditos, planes, equipo, configuración y la guía de\nprimeros pasos.\n\nLa matriz de permisos vive dentro de Equipo en vez de en una\npantalla de «Roles» aparte: el permiso solo se entiende\nmirando a quién se le asigna.'],
  admin:     ['Aprobar una cuenta habilita el acceso a datos de salud de\nterceros, así que la pantalla de verificación trata los tres\ndocumentos como una lista de comprobación explícita y deja\nnota en la auditoría.\n\nEl registro de auditoría es inmutable y sin borrado: es lo\nque se presenta ante una inspección.'],
  pdf:       ['Las cinco plantillas que hoy compila Typst en typst/*.typ,\nrediseñadas: portada e interior del informe individual,\ndiagnóstico colectivo, perfil sociodemográfico y plan de\nintervención.\n\nA4 a 96 px por pulgada, una hoja por artboard, paginación\nfija. El texto corrido va a 16 px —los 12 pt de suelo para\nlectura en papel— y los filetes nunca bajan de 1 px.\n\nPara llevarlas a producción hay que añadir Geist a\ntypst/fonts/ y reemplazar la paleta de lib/theme.typ, que\nhoy usa tonos de riesgo terrosos distintos a los de la app.'],
  publico:   ['Lo que ven personas fuera del consultorio. El flujo del\ntrabajador va a 390×844 porque se responde en el teléfono.\n\nSin barra de estado ni teclado dibujados: en un móvil real\nlos pinta el sistema encima y una copia pintada se ve doble.\nBlancos de pulsación de 56px, un ítem por pantalla y el\nenunciado en Source Serif para que se lea como una pregunta,\nno como un control.'],
};

const notas = [];
for (const [pagina, textos] of Object.entries(NOTAS)) {
  if (!porPagina.has(pagina)) continue;
  textos.forEach((text, i) => {
    notas.push({ id: `nota-${pagina}-${i + 1}`, x: -420, y: 10 + i * 340, w: 360, text, page: pagina });
  });
}

const usadas = new Set(artboards.map((a) => a.page));
const canvas = {
  artboards,
  annotations: notas,
  pages: PAGINAS.filter((p) => usadas.has(p.id)),
  launch: { view: 'canvas', page: 'operacion' },
};
writeFileSync(join(OUT, 'canvas.json'), JSON.stringify(canvas, null, 2));

console.log(`${MANIFEST.length} artboards · ${canvas.pages.length} páginas · ${notas.length} notas · ${OUT}`);
