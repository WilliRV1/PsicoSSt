// Sistema visual PsicoSST — dirección «clínico editorial».
// Los valores de color, radio y tipografía se toman literalmente de
// src/app/globals.css y de las pantallas ya implementadas (login, Sidebar,
// Header, StatCard). Lo que cambia es la ESCALA, no la paleta: Barlow pasa de
// etiqueta de 10px a titular de 56px, y Source Serif 4 —que hoy solo vive en
// los PDF— entra a pantalla para la narrativa interpretativa.

export const T = {
  paper:        '#F2F0EC',
  surface:      '#FFFFFF',
  surfaceMuted: '#E8E5E0',
  ink:          '#0C1520',
  secondary:    '#4A5F70',
  muted:        '#8A9FAE',
  border:       '#D4CFC8',
  borderMuted:  '#E2DED8',
  teal:         '#009A80',
  tealLight:    '#CCF0E8',
  tealDark:     '#007A65',
  success:      '#16A34A',
  warning:      '#D97706',
  danger:       '#DC2626',
  info:         '#2563EB',
};

// Escala de riesgo de la Resolución 2646. bg/text/border salen tal cual de
// las variables --color-risk-* ; `bar` es el tono macizo para la banda y los
// pasos ordinales, donde un pastel no aguanta a 8px de alto.
export const RISK = {
  sin:     { label: 'Sin riesgo', bg: '#F2F0EC', text: '#4A5F70', border: '#D4CFC8', bar: '#B8B2A8' },
  bajo:    { label: 'Bajo',       bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0', bar: '#16A34A' },
  medio:   { label: 'Medio',      bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', bar: '#D97706' },
  alto:    { label: 'Alto',       bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA', bar: '#EA580C' },
  muyAlto: { label: 'Muy alto',   bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', bar: '#DC2626' },
};
export const RISK_ORDER = ['sin', 'bajo', 'medio', 'alto', 'muyAlto'];

/**
 * Paleta categórica para los informes colectivos.
 *
 * Nace de la marca —el teal primario y el azul del isotipo— y está verificada
 * con el validador de la guía de visualización: banda de luminosidad, piso de
 * croma, separación bajo daltonismo (ΔE 11,2 en el peor par adyacente, protan)
 * y contraste contra la superficie. El orden es fijo: una serie conserva su
 * color aunque un filtro elimine a las demás.
 */
export const CAT = ['#00806B', '#B45309', '#2C6BFF', '#BE185D', '#7C3AED'];
export const CAT_OSCURO = ['#0FA68F', '#D97706', '#4B82F0', '#DB2777', '#8B5CF6'];

/** Rampa secuencial de un solo tono para lo ordinal: edad, estrato, escolaridad. */
export const RAMPA = ['#CCF0E8', '#8ED9C8', '#4FC2AA', '#1FA88C', '#00806B', '#005C4E'];

export const FONTS = {
  sans:  "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
  head:  "'Barlow Semi Condensed', 'Arial Narrow', system-ui, sans-serif",
  mono:  "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  serif: "'Source Serif 4', Georgia, 'Times New Roman', serif",
};

const GOOGLE = 'https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..600;1,8..60,300..600&display=swap';

// CSS compartido. Solo cubre el chrome que se repite idéntico en 40 pantallas
// (barra lateral, cabecera, tabla, ficha). Todo lo que alguien querría
// recolorear —titulares, cifras, niveles de riesgo— va con style= en línea,
// que es lo que edita el panel de propiedades del lienzo.
export const CSS = `
  @import url('${GOOGLE}');

  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${FONTS.sans}; background: ${T.paper}; color: ${T.ink};
         -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  a { color: ${T.tealDark}; text-decoration: none; }
  a:hover { color: ${T.teal}; text-decoration: underline; }
  p { margin: 0; }
  h1, h2, h3, h4 { margin: 0; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; }

  /* Rúbrica: la etiqueta condensada en versalitas que ordena cada bloque.
     Es el gesto que ya existía en el sidebar (10px / 0.22em) elevado a
     principio de todo el sistema. */
  .rub { font-family: ${FONTS.head}; font-size: 10px; font-weight: 600;
         letter-spacing: 0.22em; text-transform: uppercase; color: ${T.muted}; }
  .rub-ink { color: ${T.secondary}; }

  /* Titular editorial: Barlow Semi Condensed en tamaños de revista. */
  .display { font-family: ${FONTS.head}; font-weight: 600; letter-spacing: -0.02em;
             line-height: 0.94; color: ${T.ink}; }

  /* Todo dato es monoespaciado: puntaje, conteo, fecha, token, hash. */
  .num { font-family: ${FONTS.mono}; font-variant-numeric: tabular-nums; }

  /* Narrativa clínica: la interpretación se lee como texto, no como UI. */
  .prose { font-family: ${FONTS.serif}; font-size: 16.5px; line-height: 1.62;
           color: #1D2B38; text-wrap: pretty; }

  /* ── Chrome de aplicación ─────────────────────────────────────────── */
  .shell { display: flex; height: 100%; background: ${T.paper}; }
  .side { width: 240px; flex-shrink: 0; background: ${T.surface};
          border-right: 1px solid ${T.border}; display: flex; flex-direction: column; }
  .side-brand { padding: 26px 24px 22px; }
  .side-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 22px; }
  .side-group { display: flex; flex-direction: column; gap: 1px; }
  .side-group > .rub { padding: 0 12px; margin-bottom: 7px; }
  .nav { display: flex; align-items: center; gap: 9px; height: 32px; padding: 0 12px;
         font-size: 13px; color: ${T.secondary}; border-left: 2px solid transparent;
         border-radius: 6px; }
  .nav-on { color: ${T.teal}; font-weight: 600; background: ${T.tealLight};
            border-left-color: ${T.teal}; }
  .side-foot { padding: 14px 16px; border-top: 1px solid ${T.border};
               display: flex; align-items: center; gap: 10px; }

  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .top { height: 52px; flex-shrink: 0; background: ${T.surface};
         border-bottom: 1px solid ${T.border}; display: flex; align-items: center;
         justify-content: space-between; padding: 0 28px; }
  .kbd { font-family: ${FONTS.mono}; font-size: 11px; padding: 2px 6px; border-radius: 4px;
         background: ${T.surfaceMuted}; color: ${T.muted}; }
  .body { flex: 1; padding: 34px 40px 44px; overflow: hidden; }

  /* ── Primitivas ───────────────────────────────────────────────────── */
  .card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; }
  .btn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 16px;
         border-radius: 8px; font-size: 13.5px; font-weight: 600; letter-spacing: 0.01em; }
  .btn-pri { background: ${T.teal}; color: #FFF; }
  .btn-sec { background: ${T.surface}; color: ${T.ink}; border: 1px solid ${T.border}; }
  .btn-ghost { color: ${T.secondary}; }
  .input { height: 40px; border: 1px solid ${T.border}; border-radius: 8px;
           background: ${T.surface}; padding: 0 13px; font-size: 14px; color: ${T.muted};
           display: flex; align-items: center; }
  .lbl { font-size: 11.5px; font-weight: 600; letter-spacing: 0.11em;
         text-transform: uppercase; color: ${T.muted}; }
  .th { font-family: ${FONTS.head}; font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
        text-transform: uppercase; color: ${T.muted}; text-align: left;
        padding: 0 0 10px; border-bottom: 1px solid ${T.border}; }
  .td { padding: 13px 0; border-bottom: 1px solid ${T.borderMuted}; font-size: 13.5px;
        color: ${T.ink}; vertical-align: middle; }
  .chip { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 9px;
          border-radius: 999px; font-size: 11.5px; font-weight: 600; }
`;

// ── Utilidades de composición ────────────────────────────────────────
// Formato colombiano: la coma es el separador decimal y el punto el de miles.
// Un «58.2» en una pantalla en español se lee como 582 o como un error.
export const n1 = (x) => Number(x).toFixed(1).replace('.', ',');
export const mil = (x) => Number(x).toLocaleString('es-CO');

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Isotipo de grafo, copiado nodo a nodo de src/components/psicosst/logo.tsx. */
export function isotipo(size = 26, id = 'mk') {
  const r = 35.6 / 39.6;
  return `<svg viewBox="2.2 2.2 35.6 39.6" width="${(size * r).toFixed(1)}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="4" y1="22" x2="36" y2="22" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0FD6A0"/><stop offset=".5" stop-color="#0FB3DA"/><stop offset="1" stop-color="#2C6BFF"/>
    </linearGradient></defs>
    <g stroke="url(#${id})" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 7V37"/><path d="M20 7 7 15"/><path d="M7 15 7 30"/><path d="M7 30 20 37"/>
      <path d="M20 7 33 15"/><path d="M33 15 33 30"/><path d="M33 30 20 37"/>
      <path d="M7 15 33 30"/><path d="M33 15 7 30"/>
    </g>
    <g fill="url(#${id})">
      <circle cx="20" cy="7" r="4.6"/><circle cx="20" cy="37" r="4.6"/><circle cx="7" cy="15" r="4"/>
      <circle cx="33" cy="15" r="4"/><circle cx="7" cy="30" r="4"/><circle cx="33" cy="30" r="4"/>
      <circle cx="20" cy="22" r="4.2"/>
    </g></svg>`;
}

/** Marca completa: isotipo + logotipo Barlow + bajada en versalitas. */
export function marca({ size = 26, light = false, sub = 'Riesgo psicosocial' } = {}) {
  const nom = light ? '#EEF4F9' : T.ink;
  const acc = light ? '#21C8E0' : T.teal;
  const baj = light ? '#5B7085' : T.muted;
  return `<div style="display:flex;align-items:center;gap:11px">
    ${isotipo(size)}
    <div style="display:flex;flex-direction:column;gap:3px">
      <span style="font-family:${FONTS.head};font-weight:700;font-size:${(size * 0.72).toFixed(1)}px;letter-spacing:-0.01em;line-height:1;color:${nom}">Psico<span style="color:${acc}">SST</span></span>
      ${sub ? `<span style="font-size:${Math.max(size * 0.27, 8.5).toFixed(1)}px;letter-spacing:0.15em;text-transform:uppercase;color:${baj};line-height:1">${sub}</span>` : ''}
    </div></div>`;
}

/**
 * Indicador ordinal de riesgo: cinco pasos, el activo macizo.
 * Es la pieza que hace el nivel legible sin depender del color —posición
 * primero, color después— y funciona en gris, que es como se imprime.
 */
export function pasos(level, { w = 13, h = 7, gap = 3 } = {}) {
  const i = RISK_ORDER.indexOf(level);
  const cells = RISK_ORDER.map((k, n) => {
    const on = n <= i;
    return `<span style="width:${w}px;height:${h}px;border-radius:1.5px;background:${on ? RISK[level].bar : 'transparent'};border:1px solid ${on ? RISK[level].bar : T.border}"></span>`;
  }).join('');
  return `<span style="display:inline-flex;gap:${gap}px;align-items:center">${cells}</span>`;
}

/** Píldora de nivel. */
export function riesgo(level, { size = 'md' } = {}) {
  const r = RISK[level];
  const fs = size === 'sm' ? 11 : 11.5;
  const h = size === 'sm' ? 20 : 22;
  return `<span class="chip" style="height:${h}px;font-size:${fs}px;background:${r.bg};color:${r.text};border:1px solid ${r.border}">
    <span style="width:5px;height:5px;border-radius:999px;background:${r.bar}"></span>${r.label}</span>`;
}

/** Estado de flujo de una evaluación. */
export function estado(txt, tone = 'neutro') {
  const map = {
    neutro:  [T.surfaceMuted, T.secondary, T.border],
    teal:    [T.tealLight, T.tealDark, '#A9E3D6'],
    ok:      ['#DCFCE7', '#15803D', '#BBF7D0'],
    aviso:   ['#FEF3C7', '#B45309', '#FDE68A'],
    alerta:  ['#FEE2E2', '#B91C1C', '#FECACA'],
    info:    ['#DBEAFE', '#1D4ED8', '#BFDBFE'],
  };
  const [bg, fg, bd] = map[tone] || map.neutro;
  return `<span class="chip" style="background:${bg};color:${fg};border:1px solid ${bd}">${esc(txt)}</span>`;
}

/** Iconos de trazo, rejilla de 24, 1.6px — nunca emoji. */
const ICON = {
  panel:   'M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z',
  empresa: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 11h.01M15 11h.01',
  persona: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6M23 11h-6',
  form:    'M9 3h6a2 2 0 0 1 2 2v0h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1a2 2 0 0 1 2-2zM9 12h6M9 16h4',
  informe: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  grafico: 'M3 3v18h18M7 15l4-5 3 3 5-7',
  tend:    'M3 17l6-6 4 4 7-8M17 7h4v4',
  plan:    'M9 11l3 3 8-8M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  ia:      'M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  credito: 'M2 7h20v10H2zM2 11h20M6 15h3',
  tienda:  'M3 9l1.5-5h15L21 9M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 13h6',
  equipo:  'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  ajuste:  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1.7a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7.5a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V1.7a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
  escudo:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  buscar:  'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  luna:    'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  salir:   'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  mas:     'M12 5v14M5 12h14',
  flecha:  'M5 12h14M13 5l7 7-7 7',
  desc:    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  check:   'M20 6 9 17l-5-5',
  alerta:  'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  reloj:   'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  filtro:  'M22 3H2l8 9.5V19l4 2v-8.5z',
  firma:   'M3 17c3-6 5 3 8-2s4 2 7-3M4 21h16',
  candado: 'M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4',
  correo:  'M3 5h18v14H3zM3 6l9 7 9-7',
  subir:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 8l5-5 5 5M12 3v12',
  ojo:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  libro:   'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
};

export function icono(name, { size = 15, color = 'currentColor', w = 1.6 } = {}) {
  const d = ICON[name];
  if (!d) throw new Error('icono desconocido: ' + name);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><path d="${d}"/></svg>`;
}

/**
 * Navegación completa.
 *
 * La barra implementada hoy lista 5 destinos para ~30 páginas: IA, analítica,
 * tendencias, intervenciones, créditos, trabajadores y todo el módulo admin no
 * son alcanzables salvo escribiendo la URL. Aquí se agrupa el sistema entero
 * en cuatro bloques con el mismo lenguaje de rúbrica que ya usaba el sidebar.
 */
export const NAV = [
  ['Operación', [
    ['panel',   'Centro de control', 'panel'],
    ['orgs',    'Empresas',          'empresa'],
    ['workers', 'Trabajadores',      'persona'],
    ['assess',  'Evaluaciones',      'form'],
  ]],
  ['Análisis', [
    ['reports', 'Informes',       'informe'],
    ['analyt',  'Analítica',      'grafico'],
    ['trends',  'Tendencias',     'tend'],
    ['interv',  'Intervenciones', 'plan'],
    ['ai',      'Asistente IA',   'ia'],
  ]],
  ['Cuenta', [
    ['credits', 'Créditos',      'credito'],
    ['store',   'Planes',        'tienda'],
    ['users',   'Equipo',        'equipo'],
    ['settings','Configuración', 'ajuste'],
  ]],
  ['Administración', [
    ['admin',   'Panel admin', 'escudo'],
  ]],
];

export function sidebar(activo, { usuario = 'María Torres Gómez', iniciales = 'MT' } = {}) {
  const grupos = NAV.map(([sec, items]) => `
    <div class="side-group">
      <p class="rub">${esc(sec)}</p>
      ${items.map(([id, label, ic]) => {
        const on = id === activo;
        const col = on ? T.teal : T.muted;
        return `<div class="nav${on ? ' nav-on' : ''}">${icono(ic, { size: 14.5, color: col })}<span>${esc(label)}</span></div>`;
      }).join('')}
    </div>`).join('');

  return `<aside class="side">
    <div class="side-brand">${marca({ size: 26 })}</div>
    <nav class="side-nav">${grupos}</nav>
    <div class="side-foot">
      <div style="width:28px;height:28px;border-radius:999px;background:${T.tealLight};color:${T.teal};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${esc(iniciales)}</div>
      <div style="flex:1;min-width:0">
        <p style="font-size:12.5px;font-weight:600;color:${T.secondary};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(usuario)}</p>
        <p class="num" style="font-size:10.5px;color:${T.muted};margin-top:1px">Lic. SST 2019-4471</p>
      </div>
      ${icono('salir', { size: 14, color: T.muted })}
    </div>
  </aside>`;
}

export function topbar({ creditos = 47, migas = [] } = {}) {
  const colorCr = creditos <= 0 ? T.danger : creditos <= 5 ? T.warning : T.secondary;
  const ruta = migas.length
    ? `<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:${T.muted}">
         ${migas.map((m, i) => `${i ? `<span style="color:${T.border}">/</span>` : ''}<span style="${i === migas.length - 1 ? `color:${T.ink};font-weight:500` : ''}">${esc(m)}</span>`).join('')}
       </div>` : '';
  return `<header class="top">
    <div style="display:flex;align-items:center;gap:22px">
      <div style="display:flex;align-items:center;gap:8px;color:${T.muted};font-size:13px">
        ${icono('buscar', { size: 14, color: T.muted })}<span>Buscar</span><span class="kbd">⌘K</span>
      </div>
      ${ruta}
    </div>
    <div style="display:flex;align-items:center;gap:16px">
      <div style="display:flex;align-items:baseline;gap:5px;font-size:13px;color:${colorCr}">
        <span class="num" style="font-weight:600">${creditos}</span>
        <span style="font-size:12px;color:${T.muted}">créditos</span>
      </div>
      <span style="width:1px;height:16px;background:${T.border}"></span>
      ${icono('luna', { size: 15, color: T.muted })}
    </div>
  </header>`;
}

/** Envoltorio .dc.html. `logic` solo se emite si la pantalla lo necesita. */
export function artboard({ w, h, cuerpo, extraCss = '', logic = '' }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>${CSS}${extraCss}</style>
</helmet>
<div style="width:${w}px;height:${h}px;background:${T.paper};overflow:hidden">
${cuerpo}
</div>
</x-dc>
${logic ? `<script data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>\n${logic}\n</script>` : ''}
</body>
</html>`;
}

/** Pantalla de aplicación: barra lateral + cabecera + lienzo de contenido. */
export function app({ w = 1440, h = 900, activo, migas = [], creditos = 47, contenido, extraCss = '', usuario, iniciales }) {
  return artboard({
    w, h, extraCss,
    cuerpo: `<div class="shell" style="height:${h}px">
  ${sidebar(activo, { usuario, iniciales })}
  <div class="main">
    ${topbar({ creditos, migas })}
    <div class="body">${contenido}</div>
  </div>
</div>`,
  });
}
