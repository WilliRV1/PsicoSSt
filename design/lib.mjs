// Sistema visual PsicoSST — dirección «moderno y fluido».
//
// Segunda iteración. La primera conservaba la paleta y las cuatro familias de
// src/app/globals.css y sólo cambiaba la escala; se leía formal y los números
// parecían antiguos. Aquí se conservan el teal de la marca y los cinco niveles
// de riesgo que exige la norma, y se cambia todo lo demás: el papel cálido pasa
// a un neutro frío, Geist sustituye a Barlow + IBM Plex Sans + IBM Plex Mono +
// Source Serif 4, y el movimiento entra con las reglas de Emil Kowalski.

export const T = {
  paper:        '#F7F8F9',
  surface:      '#FFFFFF',
  surfaceMuted: '#F0F2F4',
  ink:          '#0B0F14',
  secondary:    '#55636E',
  muted:        '#8996A1',
  border:       '#E4E8EB',
  borderMuted:  '#EFF2F4',
  teal:         '#009A80',
  tealLight:    '#E4F6F1',
  tealDark:     '#007A65',
  success:      '#17B26A',
  warning:      '#F79009',
  danger:       '#F04438',
  info:         '#2E90FA',
};

// Escala de riesgo de la Resolución 2646. bg/text/border salen tal cual de
// las variables --color-risk-* ; `bar` es el tono macizo para la banda y los
// pasos ordinales, donde un pastel no aguanta a 8px de alto.
export const RISK = {
  sin:     { label: 'Sin riesgo', bg: '#F1F3F5', text: '#55636E', border: '#E4E8EB', bar: '#A9B4BC' },
  bajo:    { label: 'Bajo',       bg: '#E7F8EF', text: '#067647', border: '#CDF0DE', bar: '#17B26A' },
  medio:   { label: 'Medio',      bg: '#FEF6E7', text: '#B54708', border: '#FBE3BC', bar: '#F79009' },
  alto:    { label: 'Alto',       bg: '#FEF0E7', text: '#B93815', border: '#FBD9C4', bar: '#EF6820' },
  muyAlto: { label: 'Muy alto',   bg: '#FEECEC', text: '#B42318', border: '#FBD2D2', bar: '#F04438' },
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
  // Geist hace de interfaz, de titular y de cifra. Una sola familia moderna en
  // lugar de cuatro históricas: es lo que quita de encima el aire de documento.
  sans:  "'Geist', system-ui, -apple-system, 'Helvetica Neue', sans-serif",
  head:  "'Geist', system-ui, -apple-system, sans-serif",
  serif: "'Geist', system-ui, -apple-system, sans-serif",
  // El monoespaciado queda sólo para lo que es literalmente una cadena de
  // máquina: huellas, tokens y claves. Nunca para un puntaje.
  mono:  "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  // La marca conserva Barlow Semi Condensed: es el logotipo, no la interfaz.
  marca: "'Barlow Semi Condensed', 'Arial Narrow', system-ui, sans-serif",
};

const GOOGLE = 'https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600;700&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap';

// CSS compartido. Solo cubre el chrome que se repite idéntico en 40 pantallas
// (barra lateral, cabecera, tabla, ficha). Todo lo que alguien querría
// recolorear —titulares, cifras, niveles de riesgo— va con style= en línea,
// que es lo que edita el panel de propiedades del lienzo.
export const CSS = `
  @import url('${GOOGLE}');

  /* Duraciones y curvas del manual de Emil Kowalski: nada por encima de
     300 ms, sólo transform y opacity, y una curva de salida fuerte. */
  :root {
    --sal: cubic-bezier(0.23, 1, 0.32, 1);
    --ent: cubic-bezier(0.77, 0, 0.175, 1);
    --t-toque: 130ms;
    --t-menu:  200ms;
    --t-capa:  260ms;
  }

  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${FONTS.sans}; background: ${T.paper}; color: ${T.ink};
         -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
         font-feature-settings: 'cv11', 'ss01'; }
  a { color: ${T.tealDark}; text-decoration: none; }
  a:hover { color: ${T.teal}; }
  p { margin: 0; }
  h1, h2, h3, h4 { margin: 0; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; }

  /* Rúbrica. El tracking baja de 0,22em a 0,05em: aquel espaciado de cartel
     de museo era la mitad del aire formal que sobraba. */
  .rub { font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
         text-transform: uppercase; color: ${T.muted}; }
  .rub-ink { color: ${T.secondary}; }

  /* Titular. Geist muy apretado en lugar de una condensada de periódico. */
  .display { font-family: ${FONTS.head}; font-weight: 600; letter-spacing: -0.035em;
             line-height: 1.02; color: ${T.ink}; }

  /* Cifra. Misma familia que el resto, cifras tabulares y tracking negativo:
     alinea en columna sin parecer salida de una máquina de escribir. */
  .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  .cifra { font-variant-numeric: tabular-nums; letter-spacing: -0.045em;
           font-weight: 600; line-height: 1; color: ${T.ink}; }
  /* Sólo para cadenas que de verdad son de máquina: huellas, tokens, claves. */
  .maq { font-family: ${FONTS.mono}; font-size: 0.92em; letter-spacing: -0.01em; }

  /* Texto corrido. Era Source Serif 4 y ahí estaba el aire de documento. */
  .prose { font-size: 15.5px; line-height: 1.65; color: ${T.secondary};
           letter-spacing: -0.006em; text-wrap: pretty; }
  .prose strong { color: ${T.ink}; font-weight: 600; }
  .prose em { font-style: normal; color: ${T.ink}; font-weight: 500; }

  /* ── Chrome de aplicación ─────────────────────────────────────────── */
  .shell { display: flex; height: 100%; background: ${T.paper}; }
  .side { width: 244px; flex-shrink: 0; background: ${T.surface};
          border-right: 1px solid ${T.border}; display: flex; flex-direction: column; }
  .side-brand { padding: 22px 20px 18px; }
  .side-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 20px; }
  .side-group { display: flex; flex-direction: column; gap: 2px; }
  .side-group > .rub { padding: 0 10px; margin-bottom: 6px; font-size: 10.5px; }
  /* Píldora completa en lugar del filete izquierdo: el borde de 2px era el
     gesto más anticuado de la barra. */
  .nav { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 10px;
         font-size: 13.5px; color: ${T.secondary}; border-radius: 9px;
         transition: background var(--t-toque) var(--sal), color var(--t-toque) var(--sal); }
  .nav-on { color: ${T.ink}; font-weight: 500; background: ${T.surfaceMuted}; }
  .side-foot { padding: 12px; border-top: 1px solid ${T.border}; }
  .side-user { display: flex; align-items: center; gap: 10px; padding: 8px 10px;
               border-radius: 10px; background: ${T.surfaceMuted}; }

  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .top { height: 60px; flex-shrink: 0; background: ${T.surface};
         border-bottom: 1px solid ${T.border}; display: flex; align-items: center;
         justify-content: space-between; padding: 0 24px; }
  .busca { display: flex; align-items: center; gap: 9px; height: 34px; padding: 0 12px;
           min-width: 268px; border-radius: 10px; background: ${T.surfaceMuted};
           color: ${T.muted}; font-size: 13.5px; }
  .kbd { font-family: ${FONTS.mono}; font-size: 10.5px; padding: 2px 5px; border-radius: 5px;
         background: ${T.surface}; color: ${T.muted}; border: 1px solid ${T.border}; }
  .body { flex: 1; padding: 32px 36px 44px; overflow: hidden; }

  /* ── Primitivas ───────────────────────────────────────────────────── */
  /* Elevación suave en lugar de «filete y nunca sombra». La regla anterior
     mantenía todo plano, y plano se lee como impreso. */
  .card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 16px;
          box-shadow: 0 1px 2px rgba(11,15,20,0.04); }
  .card-alto { box-shadow: 0 1px 2px rgba(11,15,20,0.04), 0 12px 32px -18px rgba(11,15,20,0.18); }

  .btn { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px;
         border-radius: 10px; font-size: 13.5px; font-weight: 500; letter-spacing: -0.005em;
         transition: transform var(--t-toque) var(--sal), background var(--t-toque) var(--sal); }
  .btn:active { transform: scale(0.97); }
  .btn-pri { background: ${T.ink}; color: #FFF; }
  .btn-acc { background: ${T.teal}; color: #FFF; }
  .btn-sec { background: ${T.surface}; color: ${T.ink}; border: 1px solid ${T.border};
             box-shadow: 0 1px 2px rgba(11,15,20,0.04); }
  .btn-ghost { color: ${T.secondary}; }

  .input { height: 40px; border: 1px solid ${T.border}; border-radius: 10px;
           background: ${T.surface}; padding: 0 13px; font-size: 14px; color: ${T.muted};
           display: flex; align-items: center; }
  .lbl { font-size: 12px; font-weight: 500; letter-spacing: -0.005em; color: ${T.secondary}; }
  .th { font-size: 11px; font-weight: 500; letter-spacing: 0.02em; color: ${T.muted};
        text-align: left; padding: 0 0 11px; border-bottom: 1px solid ${T.border};
        text-transform: none; }
  .td { padding: 14px 0; border-bottom: 1px solid ${T.borderMuted}; font-size: 13.5px;
        color: ${T.ink}; vertical-align: middle; }
  .chip { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px;
          border-radius: 8px; font-size: 12px; font-weight: 500; letter-spacing: -0.005em; }

  /* ── Movimiento ───────────────────────────────────────────────────── */
  /* Una entrada escalonada, 30–80 ms entre piezas, sólo transform y opacity.
     Es lo único que se anima: nada que se vea cien veces al día lleva motion. */
  @keyframes sube { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes aparece { from { opacity: 0; } to { opacity: 1; } }
  @keyframes crece { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .anim > * { animation: sube 520ms var(--sal) both; }
  .anim > *:nth-child(1) { animation-delay: 0ms; }
  .anim > *:nth-child(2) { animation-delay: 45ms; }
  .anim > *:nth-child(3) { animation-delay: 90ms; }
  .anim > *:nth-child(4) { animation-delay: 135ms; }
  .anim > *:nth-child(5) { animation-delay: 180ms; }
  .anim > *:nth-child(6) { animation-delay: 225ms; }
  .anim > *:nth-child(n+7) { animation-delay: 260ms; }
  .barra-anim { transform-origin: left center; animation: crece 620ms var(--sal) both; }

  @media (prefers-reduced-motion: reduce) {
    /* Se conserva la opacidad y se retira el desplazamiento. */
    .anim > *, .barra-anim { animation: aparece 200ms linear both; transform: none; }
    .btn:active { transform: none; }
  }
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
      <span style="font-family:${FONTS.marca};font-weight:700;font-size:${(size * 0.72).toFixed(1)}px;letter-spacing:-0.01em;line-height:1;color:${nom}">Psico<span style="color:${acc}">SST</span></span>
      ${sub ? `<span style="font-size:${Math.max(size * 0.27, 8.5).toFixed(1)}px;letter-spacing:0.15em;text-transform:uppercase;color:${baj};line-height:1">${sub}</span>` : ''}
    </div></div>`;
}

/**
 * Indicador ordinal de riesgo: cinco pasos, el activo macizo.
 * Es la pieza que hace el nivel legible sin depender del color —posición
 * primero, color después— y funciona en gris, que es como se imprime.
 */
export function pasos(level, { w = 14, h = 6, gap = 3 } = {}) {
  const i = RISK_ORDER.indexOf(level);
  const cells = RISK_ORDER.map((k, n) => {
    const on = n <= i;
    // El paso apagado es una pista rellena, no un rectángulo con contorno:
    // los contornos vacíos se leen como casilla de formulario.
    return `<span style="width:${w}px;height:${h}px;border-radius:${(h / 2).toFixed(1)}px;background:${on ? RISK[level].bar : '#E4E8EB'}"></span>`;
  }).join('');
  return `<span style="display:inline-flex;gap:${gap}px;align-items:center">${cells}</span>`;
}

/** Píldora de nivel. */
export function riesgo(level, { size = 'md' } = {}) {
  const r = RISK[level];
  const fs = size === 'sm' ? 11.5 : 12;
  const h = size === 'sm' ? 22 : 24;
  return `<span class="chip" style="height:${h}px;font-size:${fs}px;background:${r.bg};color:${r.text}">
    <span style="width:6px;height:6px;border-radius:999px;background:${r.bar}"></span>${r.label}</span>`;
}

/** Estado de flujo de una evaluación. */
export function estado(txt, tone = 'neutro') {
  const map = {
    neutro:  [T.surfaceMuted, T.secondary],
    teal:    [T.tealLight, T.tealDark],
    ok:      ['#E7F8EF', '#067647'],
    aviso:   ['#FEF6E7', '#B54708'],
    alerta:  ['#FEECEC', '#B42318'],
    info:    ['#E8F1FE', '#1849A9'],
  };
  const [bg, fg] = map[tone] || map.neutro;
  return `<span class="chip" style="background:${bg};color:${fg}">${esc(txt)}</span>`;
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
    <div class="side-brand">${marca({ size: 25 })}</div>
    <nav class="side-nav">${grupos}</nav>
    <div class="side-foot">
      <div class="side-user">
        <div style="width:28px;height:28px;border-radius:9px;background:${T.ink};color:#FFF;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0">${esc(iniciales)}</div>
        <div style="flex:1;min-width:0">
          <p style="font-size:12.5px;font-weight:500;color:${T.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(usuario)}</p>
          <p class="num" style="font-size:11px;color:${T.muted};margin-top:1px">Lic. SST 2019-4471</p>
        </div>
        ${icono('salir', { size: 14, color: T.muted })}
      </div>
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
    <div style="display:flex;align-items:center;gap:18px">
      <div class="busca">
        ${icono('buscar', { size: 15, color: T.muted })}<span style="flex:1">Buscar</span><span class="kbd">⌘K</span>
      </div>
      ${ruta}
    </div>
    <div style="display:flex;align-items:center;gap:14px">
      <div style="display:flex;align-items:center;gap:7px;height:32px;padding:0 12px;border-radius:9px;background:${T.surfaceMuted}">
        <span class="num" style="font-size:13px;font-weight:600;color:${colorCr}">${creditos}</span>
        <span style="font-size:12.5px;color:${T.muted}">créditos</span>
      </div>
      ${icono('luna', { size: 16, color: T.muted })}
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
    <div class="body anim">${contenido}</div>
  </div>
</div>`,
  });
}
