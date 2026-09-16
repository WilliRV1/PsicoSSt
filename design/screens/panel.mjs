import { T, RISK, RISK_ORDER, FONTS, app, icono, riesgo, pasos, estado, esc, n1 } from '../lib.mjs';

// Cifras de muestra, coherentes entre sí: los cinco niveles suman 1.284 y
// alto+muy alto da exactamente el 24,7% que enuncia el titular.
const DIST = [
  ['sin', 214], ['bajo', 389], ['medio', 364], ['alto', 224], ['muyAlto', 93],
];
const TOTAL = DIST.reduce((a, [, n]) => a + n, 0);

/**
 * Banda de distribución de riesgo.
 *
 * Es la pieza firma del sistema y sustituye al gráfico de torta: una sola
 * barra a todo el ancho, ordenada de menor a mayor riesgo, con el dato en
 * monoespaciado bajo cada tramo. Se lee de un vistazo, imprime en gris sin
 * perder el orden y no necesita leyenda aparte.
 */
function banda() {
  const tramos = DIST.map(([k, n]) => {
    const pct = (n / TOTAL) * 100;
    return `<div style="width:${pct.toFixed(2)}%;height:46px;background:${RISK[k].bar};position:relative">
      ${pct > 9 ? `<span class="num" style="position:absolute;left:11px;top:13px;font-size:15px;font-weight:600;color:${k === 'sin' ? T.ink : '#FFF'}">${n}</span>` : ''}
    </div>`;
  }).join('');

  // El último tramo es el más estrecho (7,2%) y su etiqueta es la más larga:
  // se alinea a la derecha para que «Muy alto» quepa entero en vez de cortarse.
  const pies = DIST.map(([k, n], i) => {
    const pct = (n / TOTAL) * 100;
    const ult = i === DIST.length - 1;
    return `<div style="width:${pct.toFixed(2)}%;${ult ? 'text-align:right' : 'padding-right:12px'}">
      <p class="rub" style="color:${RISK[k].text};white-space:nowrap">${esc(RISK[k].label)}</p>
      <p class="num" style="font-size:11.5px;color:${T.muted};margin-top:4px">${n1(pct)}%</p>
    </div>`;
  }).join('');

  return `<div>
    <div class="barra-anim" style="display:flex;border-radius:10px;overflow:hidden">${tramos}</div>
    <div style="display:flex;margin-top:9px">${pies}</div>
  </div>`;
}

/** Cifras clave sin tarjetas: filetes verticales, como una tabla de revista. */
function cifras() {
  const items = [
    ['Empresas activas', '12', null],
    ['Evaluaciones este mes', '380', '×4 frente a agosto'],
    ['Informes sin firmar', '9', null],
    ['Vigencias por vencer', '3', 'en 30 días'],
  ];
  return `<div style="display:flex;border-top:1px solid ${T.border};border-bottom:1px solid ${T.border}">
    ${items.map(([l, v, n], i) => `
      <div style="flex:1;padding:18px 0 18px ${i ? '26px' : '0'};${i ? `border-left:1px solid ${T.borderMuted}` : ''}">
        <p class="rub">${esc(l)}</p>
        <div style="display:flex;align-items:baseline;gap:9px;margin-top:9px">
          <span class="num" style="font-size:30px;font-weight:600;line-height:1;color:${T.ink}">${v}</span>
          ${n ? `<span class="num" style="font-size:11.5px;color:${T.muted}">${esc(n)}</span>` : ''}
        </div>
      </div>`).join('')}
  </div>`;
}

/** Empresas que exigen una decisión hoy — el sitio donde arranca el trabajo. */
function accion() {
  const filas = [
    ['Transportes Andinos S.A.S.', 'Vigencia vencida', 'alerta', '412', 'alto'],
    ['Clínica del Norte', 'Vence en 12 días', 'aviso', '268', 'medio'],
    ['Agroindustria Valle Ltda.', 'Vence en 27 días', 'aviso', '156', 'muyAlto'],
    ['Constructora Sierra', '6 informes sin firmar', 'info', '203', 'medio'],
  ];
  return `<section style="flex:1;min-width:0">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
      <p class="rub rub-ink">Requiere una decisión</p>
      <span style="font-size:12.5px;color:${T.tealDark}">Ver todas</span>
    </div>
    <table>
      <tr><th class="th">Empresa</th><th class="th">Motivo</th><th class="th" style="text-align:right">Trab.</th><th class="th" style="text-align:right;padding-right:0">Riesgo global</th></tr>
      ${filas.map(([org, motivo, tono, n, r]) => `
        <tr>
          <td class="td" style="font-weight:500">${esc(org)}</td>
          <td class="td">${estado(motivo, tono)}</td>
          <td class="td num" style="text-align:right;color:${T.secondary}">${n}</td>
          <td class="td" style="text-align:right"><div style="display:inline-flex;align-items:center;gap:10px">${pasos(r)}${riesgo(r, { size: 'sm' })}</div></td>
        </tr>`).join('')}
    </table>
  </section>`;
}

/** Actividad reciente, en un carril estrecho: contexto, no protagonista. */
function actividad() {
  const items = [
    ['Forma A · 123 ítems', 'Clínica del Norte', 'Calificado', 'teal', 'hace 8 min'],
    ['Extralaboral · 31 ítems', 'Transportes Andinos', 'Firmado', 'ok', 'hace 41 min'],
    ['Estrés · 31 ítems', 'Constructora Sierra', 'Revisado', 'info', 'hace 2 h'],
    ['Forma B · 97 ítems', 'Agroindustria Valle', 'Calificado', 'teal', 'hace 3 h'],
    ['Forma A · 123 ítems', 'Clínica del Norte', 'Pendiente', 'neutro', 'ayer'],
  ];
  return `<section style="width:352px;flex-shrink:0">
    <p class="rub rub-ink" style="margin-bottom:14px">Últimas evaluaciones</p>
    <div>
      ${items.map(([inst, org, est, tono, t]) => `
        <div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid ${T.borderMuted}">
          <div style="flex:1;min-width:0">
            <p style="font-size:13px;font-weight:500;color:${T.ink}">${esc(inst)}</p>
            <p style="font-size:11.5px;color:${T.muted};margin-top:3px">${esc(org)} · <span class="num">${esc(t)}</span></p>
          </div>
          ${estado(est, tono)}
        </div>`).join('')}
    </div>
  </section>`;
}

export const panel = app({
  w: 1440, h: 970, activo: 'panel', creditos: 47,
  contenido: `
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:30px">
    <div>
      <h1 class="display" style="font-size:42px;max-width:840px">
        317 de <span class="cifra">1.284</span> trabajadores están en riesgo alto o muy alto
      </h1>
      <p style="font-size:13px;color:${T.muted};margin-top:12px">
        12 empresas · corte al <span class="num">16 de septiembre de 2026</span>
      </p>
    </div>
    <div style="display:flex;gap:10px;flex-shrink:0;padding-bottom:4px">
      <span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportar cartera</span>
      <span class="btn btn-pri">${icono('mas', { size: 14, color: '#FFF' })}Nueva evaluación</span>
    </div>
  </div>

  <div style="margin-top:26px">${banda()}</div>

  <p class="prose" style="margin-top:22px;max-width:780px">
    Tres empresas concentran el 71% de esos casos, y en las tres el dominio crítico es
    <em>Demandas del trabajo</em>. Es el lugar por donde conviene empezar la intervención.
  </p>

  <div style="margin-top:30px">${cifras()}</div>

  <div style="display:flex;gap:44px;margin-top:30px">
    ${accion()}
    ${actividad()}
  </div>`,
});
