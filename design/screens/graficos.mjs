import { T, FONTS, CAT, RAMPA, icono, esc, n1 } from '../lib.mjs';

/**
 * Barras horizontales.
 *
 * Marca fina, extremo redondeado de 4px anclado a la línea base, etiqueta
 * directa al final de cada barra —nunca un número sobre cada punto de una
 * serie larga— y ejes recesivos. El texto va en tinta, no en el color de la
 * serie: el color lo lleva la marca.
 */
export function barras(datos, { w = 400, color = null, rampa = false, unidad = '%', max = null } = {}) {
  const tope = max ?? Math.max(...datos.map((d) => d[1]));
  const anchoEtq = Math.max(...datos.map((d) => d[0].length)) * 6.2 + 8;
  return `<div style="width:${w}px">
    ${datos.map(([k, v], i) => {
      const c = rampa ? RAMPA[Math.min(i + 1, RAMPA.length - 1)] : (color ?? CAT[i % CAT.length]);
      const pct = (v / tope) * 100;
      return `<div style="display:flex;align-items:center;gap:10px;padding:4.5px 0">
        <span style="font-size:12px;color:${T.secondary};width:${Math.min(anchoEtq, 140)}px;flex-shrink:0;text-align:right">${esc(k)}</span>
        <div style="flex:1;min-width:0"><div style="width:${pct.toFixed(1)}%;height:11px;background:${c};border-radius:0 4px 4px 0;min-width:3px"></div></div>
        <span class="num" style="font-size:11.5px;color:${T.secondary};white-space:nowrap;width:44px;flex-shrink:0">${typeof v === 'number' && !Number.isInteger(v) ? n1(v) : v}${unidad}</span>
      </div>`;
    }).join('')}
  </div>`;
}

/**
 * Barra apilada de una sola fila, con separador de 2px del color de la
 * superficie entre segmentos para que dos tonos contiguos no se fundan.
 */
export function apilada(segmentos, { w = 400, alto = 13, leyenda = true } = {}) {
  const total = segmentos.reduce((a, s) => a + s[1], 0);
  const barra = `<div style="display:flex;height:${alto}px;border-radius:4px;overflow:hidden;background:${T.surface}">
      ${segmentos.map(([, v, c], i) => `<div style="width:${((v / total) * 100).toFixed(2)}%;background:${c};${i ? `border-left:2px solid ${T.surface}` : ''}"></div>`).join('')}
    </div>`;
  // Cuando la barra se repite fila a fila la leyenda se pone una sola vez
  // debajo de la tabla; repetirla en cada fila es ruido, no información.
  if (!leyenda) return `<div style="width:${w === 0 ? '100%' : w + 'px'}">${barra}</div>`;
  return `<div style="width:${w}px">
    ${barra}
    <div style="display:flex;flex-wrap:wrap;gap:13px;margin-top:10px">
      ${segmentos.map(([k, v, c]) => `<div style="display:flex;align-items:center;gap:6px">
        <span style="width:9px;height:9px;border-radius:2.5px;background:${c};flex-shrink:0"></span>
        <span style="font-size:11.5px;color:${T.secondary}">${esc(k)}</span>
        <span class="num" style="font-size:11.5px;color:${T.muted}">${((v / total) * 100).toFixed(0)}%</span>
      </div>`).join('')}
    </div>
  </div>`;
}

/** Ficha de gráfico: título, nota y cuerpo. Una sola serie no lleva leyenda. */
export function figura(titulo, nota, cuerpo, { w = 'auto' } = {}) {
  return `<div class="card" style="padding:20px 22px;${w !== 'auto' ? `width:${w}px` : 'flex:1;min-width:0'}">
    <p style="font-family:${FONTS.head};font-size:16px;font-weight:600;letter-spacing:-0.005em;color:${T.ink}">${esc(titulo)}</p>
    ${nota ? `<p style="font-size:11.5px;color:${T.muted};margin-top:4px;margin-bottom:14px">${esc(nota)}</p>` : '<div style="height:14px"></div>'}
    ${cuerpo}
  </div>`;
}

/**
 * Serie temporal de líneas con una capa de hover representada abierta:
 * en la pantalla real el cursor mueve la cruz y el globo; aquí se deja
 * en el punto que la especificación quiere mostrar.
 */
export function lineas({ w = 620, h = 200, series, etiquetasX, max = 100, hover = null }) {
  // padR deja sitio a la etiqueta directa al final de cada serie: sin él
  // «Administrativos» se sale del lienzo y el SVG la recorta.
  const padL = 34, padB = 24, padT = 10, padR = 110;
  const iw = w - padL - padR, ih = h - padB - padT;
  const px = (i) => padL + (i / (etiquetasX.length - 1)) * iw;
  const py = (v) => padT + ih - (v / max) * ih;

  const rejilla = [0, 25, 50, 75, 100].map((v) => `
    <line x1="${padL}" y1="${py(v)}" x2="${w - padR + 4}" y2="${py(v)}" stroke="${T.borderMuted}" stroke-width="1"/>
    <text x="${padL - 8}" y="${py(v) + 3.5}" text-anchor="end" font-family="${FONTS.mono}" font-size="9.5" fill="${T.muted}">${v}</text>`).join('');

  const trazos = series.map((s, si) => {
    const d = s.valores.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
    const puntos = s.valores.map((v, i) => `<circle cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="4" fill="${s.color}" stroke="${T.surface}" stroke-width="2"/>`).join('');
    return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${puntos}
      <text x="${(px(s.valores.length - 1) + 6).toFixed(1)}" y="${(py(s.valores[s.valores.length - 1]) + 3.5).toFixed(1)}" font-family="${FONTS.sans}" font-size="10.5" font-weight="600" fill="${T.secondary}">${esc(s.nombre)}</text>`;
  }).join('');

  const ejeX = etiquetasX.map((l, i) => `<text x="${px(i).toFixed(1)}" y="${h - 6}" text-anchor="middle" font-family="${FONTS.mono}" font-size="9.5" fill="${T.muted}">${esc(l)}</text>`).join('');

  const cruz = hover !== null
    ? `<line x1="${px(hover)}" y1="${padT}" x2="${px(hover)}" y2="${padT + ih}" stroke="${T.ink}" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>`
    : '';

  return `<div style="position:relative;width:${w}px">
    <svg width="${w}" height="${h}" style="display:block">${rejilla}${cruz}${trazos}${ejeX}</svg>
    ${hover !== null ? `<div style="position:absolute;left:${px(hover) + 12}px;top:14px;background:${T.ink};border-radius:8px;padding:9px 12px;min-width:132px">
      <p class="rub" style="color:#8A9FAE">${esc(etiquetasX[hover])}</p>
      ${series.map((s) => `<div style="display:flex;align-items:center;gap:7px;margin-top:6px">
        <span style="width:8px;height:8px;border-radius:2px;background:${s.color}"></span>
        <span style="font-size:11.5px;color:#C8D5DE;flex:1">${esc(s.nombre)}</span>
        <span class="num" style="font-size:11.5px;color:#FFF;font-weight:600">${n1(s.valores[hover])}</span>
      </div>`).join('')}
    </div>` : ''}
  </div>`;
}
