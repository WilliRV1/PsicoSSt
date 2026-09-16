import { T, RISK, RISK_ORDER, FONTS, app, icono, estado, esc, n1, mil } from '../lib.mjs';

/**
 * Centro de control · ámbito cartera.
 *
 * Aquí no hay ni una cifra de riesgo, y es deliberado. Los baremos de la
 * batería son nacionales y estratificados por nivel de cargo, así que un
 * puntaje agregado entre empresas mide la composición de cargos de cada una
 * antes que el riesgo: la propia pantalla de analítica muestra que el riesgo
 * sube de forma monótona según baja el nivel del cargo. La obligación legal
 * también es por empleador. El riesgo vive dentro de cada empresa; esta
 * pantalla es la cola de trabajo del psicólogo, que sí es transversal.
 */

/** Recuentos de trabajo. Ninguno es un puntaje: son tareas. */
function cifras() {
  const items = [
    ['Empresas activas', '12', ''],
    ['Evaluaciones en curso', '186', 'de 412 enviadas'],
    ['Informes sin firmar', '9', 'el más antiguo, 6 días'],
    ['Vigencias por vencer', '3', 'en 30 días'],
    ['Medidas vencidas', '6', 'en 2 empresas'],
  ];
  return `<div style="display:flex;border-top:1px solid ${T.border};border-bottom:1px solid ${T.border}">
    ${items.map(([l, v, n], i) => `
      <div style="flex:1;padding:18px 0 18px ${i ? '24px' : '0'};${i ? `border-left:1px solid ${T.borderMuted}` : ''}">
        <p class="rub">${esc(l)}</p>
        <p class="cifra" style="font-size:30px;margin-top:9px">${v}</p>
        ${n ? `<p style="font-size:11.5px;color:${T.muted};margin-top:5px">${esc(n)}</p>` : ''}
      </div>`).join('')}
  </div>`;
}

/** La cola: qué exige una decisión, por qué, y desde cuándo. */
function cola() {
  const filas = [
    ['Transportes Andinos S.A.S.', 'Vigencia vencida', 'alerta', '382 días', 'Programar reaplicación'],
    ['Transportes Andinos S.A.S.', '4 medidas de intervención vencidas', 'alerta', '47 días', 'Revisar plan'],
    ['Clínica del Norte', '6 informes sin firmar', 'aviso', '6 días', 'Firmar'],
    ['Clínica del Norte', 'Vigencia vence el 28 de septiembre', 'aviso', '12 días', 'Programar'],
    ['Agroindustria Valle Ltda.', 'Vigencia vence el 13 de octubre', 'aviso', '27 días', 'Programar'],
    ['Constructora Sierra', '3 informes sin firmar', 'aviso', '2 días', 'Firmar'],
    ['Agroindustria Valle Ltda.', '2 medidas de intervención vencidas', 'alerta', '19 días', 'Revisar plan'],
    ['Servicios Logísticos Meta', 'Sin evaluar desde el alta', 'neutro', '94 días', 'Invitar'],
  ];
  return `<section style="flex:1;min-width:0">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
      <p class="rub-ink">Requiere una decisión</p>
      <span style="font-size:12.5px;color:${T.tealDark}">Ver las 23</span>
    </div>
    <table>
      <tr>
        <th class="th">Empresa</th><th class="th">Motivo</th>
        <th class="th" style="text-align:right">Antigüedad</th>
        <th class="th" style="text-align:right;padding-right:0">Acción</th>
      </tr>
      ${filas.map(([org, motivo, tono, ant, accion]) => `<tr>
        <td class="td" style="font-weight:500">${esc(org)}</td>
        <td class="td">${estado(motivo, tono)}</td>
        <td class="td num" style="text-align:right;color:${tono === 'alerta' ? T.danger : T.secondary}">${esc(ant)}</td>
        <td class="td" style="text-align:right;color:${T.tealDark};font-size:13px">${esc(accion)}</td>
      </tr>`).join('')}
    </table>
  </section>`;
}

/** Actividad reciente y el recordatorio de dónde vive el análisis. */
function carril() {
  const items = [
    ['Forma A · 123 ítems', 'Clínica del Norte', 'Calificado', 'teal', 'hace 8 min'],
    ['Extralaboral · 31 ítems', 'Transportes Andinos', 'Firmado', 'ok', 'hace 41 min'],
    ['Estrés · 31 ítems', 'Constructora Sierra', 'Revisado', 'info', 'hace 2 h'],
    ['Forma B · 97 ítems', 'Agroindustria Valle', 'Calificado', 'teal', 'hace 3 h'],
  ];
  return `<section style="width:352px;flex-shrink:0">
    <p class="rub-ink" style="margin-bottom:14px">Últimas evaluaciones</p>
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

    <div style="margin-top:26px;padding:20px 22px;border-radius:16px;background:${T.surfaceMuted}">
      <p style="font-size:14.5px;font-weight:600;letter-spacing:-0.015em;color:${T.ink}">El riesgo se lee por empresa</p>
      <p style="font-size:12.5px;line-height:1.65;color:${T.secondary};margin-top:8px">
        Los baremos de la batería son nacionales y por nivel de cargo, no por sector.
        Sumar puntajes de empresas distintas mide qué proporción de operativos tiene
        cada una, no cuánto riesgo hay. El diagnóstico, el plan y la vigilancia se
        rinden empresa por empresa.
      </p>
      <div style="display:flex;align-items:center;gap:9px;height:38px;padding:0 12px;border-radius:10px;background:${T.surface};border:1px solid ${T.border};margin-top:14px">
        ${icono('empresa', { size: 15, color: T.muted })}
        <span style="flex:1;font-size:13px;color:${T.muted}">Elija una empresa</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${T.muted}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9l4-4 4 4M16 15l-4 4-4-4"/></svg>
      </div>
    </div>
  </section>`;
}

export const panel = app({
  w: 1440, h: 970, activo: 'panel', creditos: 47, empresa: null,
  contenido: `
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:30px">
    <div>
      <h1 class="display" style="font-size:42px;max-width:820px">
        <span class="cifra">9</span> informes sin firmar y <span class="cifra">3</span> vigencias que vencen este mes
      </h1>
      <p style="font-size:13px;color:${T.muted};margin-top:12px">
        12 empresas · <span class="num">23</span> asuntos abiertos · <span class="num">16 de septiembre de 2026</span>
      </p>
    </div>
    <div style="display:flex;gap:10px;flex-shrink:0;padding-bottom:4px">
      <span class="btn btn-sec">${icono('firma', { size: 14, color: T.secondary })}Firmar pendientes</span>
      <span class="btn btn-pri">${icono('mas', { size: 14, color: '#FFF' })}Nueva evaluación</span>
    </div>
  </div>

  <div style="margin-top:28px">${cifras()}</div>

  <div style="display:flex;gap:44px;margin-top:30px">
    ${cola()}
    ${carril()}
  </div>`,
});
