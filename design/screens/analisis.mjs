import { T, RISK, RISK_ORDER, CAT, FONTS, app, icono, riesgo, pasos, estado, esc, n1 } from '../lib.mjs';
import { cabecera, filtros } from './operacion.mjs';
import { barras, apilada, figura, lineas } from './graficos.mjs';

// ── Analítica · dentro de una empresa ──────────────────────────────────
//
// Las dos formas del intralaboral no se promedian entre sí: la A tiene 123
// ítems y 19 dimensiones, la B tiene 97 y 16, y cada una se califica contra su
// propio baremo. Lo que sí se puede juntar es el RECUENTO de personas por
// nivel, porque a cada una la clasificó el baremo que le corresponde.
//
// Transportes Andinos: 412 trabajadores = 79 de Forma A (profesionales,
// jefaturas y técnicos) + 333 de Forma B (auxiliares y operativos).
const FORMA_A = {
  nombre: 'Intralaboral Forma A', sub: 'Profesionales, jefaturas y técnicos',
  n: 79, items: 123, dims: 19, total: 33.8, nivel: 'medio',
  dist: [20, 31, 22, 5, 1],
  top: [
    ['Demandas de carga mental', 48.2, 'alto'],
    ['Exigencias de responsabilidad del cargo', 41.7, 'alto'],
    ['Influencia del trabajo sobre el entorno extralaboral', 37.5, 'medio'],
    ['Características del liderazgo', 28.8, 'medio'],
    ['Relación con los colaboradores', 25.0, 'medio'],
  ],
};
const FORMA_B = {
  nombre: 'Intralaboral Forma B', sub: 'Auxiliares y operativos',
  n: 333, items: 97, dims: 16, total: 68.2, nivel: 'muyAlto',
  dist: [18, 48, 104, 113, 50],
  top: [
    ['Demandas de la jornada de trabajo', 91.7, 'muyAlto'],
    ['Demandas cuantitativas', 79.2, 'muyAlto'],
    ['Influencia del trabajo sobre el entorno extralaboral', 68.8, 'alto'],
    ['Características del liderazgo', 58.9, 'muyAlto'],
    ['Control y autonomía sobre el trabajo', 52.3, 'alto'],
  ],
};

function bloqueForma(F) {
  const criticos = F.dist[3] + F.dist[4];
  const pct = (criticos / F.n) * 100;
  return `<div style="flex:1;min-width:0">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:14px;padding-bottom:12px;border-bottom:1.5px solid ${T.ink}">
      <div>
        <p style="font-size:16px;font-weight:600;letter-spacing:-0.018em;color:${T.ink}">${esc(F.nombre)}</p>
        <p style="font-size:12.5px;color:${T.muted};margin-top:3px">${esc(F.sub)}</p>
      </div>
      <p class="num" style="font-size:12.5px;color:${T.muted};flex-shrink:0;text-align:right">${F.n} personas<br>${F.items} ítems · ${F.dims} dimensiones</p>
    </div>

    <div style="display:flex;align-items:flex-end;gap:18px;margin-top:18px">
      <p class="cifra" style="font-size:44px;color:${RISK[F.nivel].text}">${n1(F.total)}</p>
      <div style="padding-bottom:7px">${riesgo(F.nivel)}</div>
      <div style="margin-left:auto;text-align:right;padding-bottom:7px">
        <p class="cifra" style="font-size:22px;color:${pct > 40 ? RISK.muyAlto.text : T.ink}">${n1(pct)}&thinsp;%</p>
        <p style="font-size:11.5px;color:${T.muted};margin-top:3px">en alto o muy alto</p>
      </div>
    </div>

    <div style="margin-top:16px">
      ${apilada(RISK_ORDER.map((k, i) => [RISK[k].label, F.dist[i], RISK[k].bar]), { w: 0, alto: 14, leyenda: false }).replace('width:100%', 'width:100%')}
      <div style="display:flex;flex-wrap:wrap;gap:13px;margin-top:9px">
        ${RISK_ORDER.map((k, i) => `<div style="display:flex;align-items:center;gap:5px">
          <span style="width:8px;height:8px;border-radius:2.5px;background:${RISK[k].bar}"></span>
          <span class="num" style="font-size:11.5px;color:${T.secondary}">${F.dist[i]}</span></div>`).join('')}
      </div>
    </div>

    <p class="rub" style="margin:20px 0 10px">Dimensiones más críticas</p>
    ${F.top.map(([d, p, r], i) => `
      <div style="display:flex;align-items:center;gap:14px;padding:9px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
        <span style="flex:1;font-size:13px;color:${T.ink};min-width:0">${esc(d)}</span>
        <div style="width:96px;height:7px;border-radius:999px;background:${T.surfaceMuted};overflow:hidden;flex-shrink:0">
          <div class="barra-anim" style="width:${p}%;height:100%;background:${RISK[r].bar};border-radius:999px"></div>
        </div>
        <span class="num" style="font-size:13px;font-weight:600;color:${RISK[r].text};width:44px;text-align:right;flex-shrink:0">${n1(p)}</span>
      </div>`).join('')}
  </div>`;
}

export const analitica = app({
  w: 1440, h: 1240, activo: 'analyt', empresa: 'Transportes Andinos S.A.S.',
  migas: ['Empresas', 'Transportes Andinos', 'Analítica'],
  contenido: `
  ${cabecera({
    titulo: 'El riesgo está en la operación, no en la empresa',
    rubrica: '412 trabajadores evaluados · corte al <span class="num">16 de septiembre de 2026</span>',
    bajada: 'El 48,9% de los auxiliares y operativos está en riesgo alto o muy alto, frente al 7,6% de profesionales y jefaturas. Es una diferencia de seis veces dentro de la misma empresa.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportar datos</span>`,
  })}

  <div style="display:flex;gap:44px">
    ${bloqueForma(FORMA_A)}
    ${bloqueForma(FORMA_B)}
  </div>

  <div style="display:flex;gap:11px;align-items:flex-start;margin-top:26px;padding:15px 18px;border-radius:12px;background:${T.surfaceMuted}">
    ${icono('escudo', { size: 16, color: T.secondary })}
    <p style="font-size:12.5px;line-height:1.65;color:${T.secondary};max-width:900px">
      <strong style="color:${T.ink};font-weight:600">Los dos puntajes no se comparan entre sí.</strong>
      La Forma A y la Forma B son instrumentos distintos —123 ítems y 19 dimensiones frente a
      97 y 16— y cada uno se califica contra su propio baremo nacional. Lo que sí es comparable
      es el nivel de riesgo de cada persona, porque a cada una la clasificó el baremo que le
      corresponde: por eso el recuento conjunto de abajo sí tiene sentido.
    </p>
  </div>

  <div style="margin-top:26px">
    ${figura('Personas en riesgo alto o muy alto, por área', 'Recuento sobre el total de cada área · las dos formas juntas',
      `<div style="margin-top:4px">
        ${[
          ['Operación de vehículos', 198, 117, 'B'],
          ['Mantenimiento', 74, 31, 'B'],
          ['Logística y patios', 61, 15, 'B'],
          ['Administración', 42, 4, 'A'],
          ['Comercial', 22, 2, 'A'],
          ['Dirección', 15, 0, 'A'],
        ].map(([a, t, c, forma], i) => {
          const pct = (c / t) * 100;
          return `<div style="display:flex;align-items:center;gap:16px;padding:11px 0;${i ? `border-top:1px solid ${T.borderMuted}` : `border-top:1.5px solid ${T.ink}`}">
            <span style="width:180px;flex-shrink:0;font-size:13px;color:${T.ink}">${esc(a)}</span>
            <span class="chip" style="flex-shrink:0;background:${T.surfaceMuted};color:${T.secondary}">Forma ${forma}</span>
            <div style="flex:1;height:9px;border-radius:999px;background:${T.surfaceMuted};overflow:hidden">
              <div class="barra-anim" style="width:${pct}%;height:100%;background:${pct > 40 ? RISK.muyAlto.bar : pct > 20 ? RISK.alto.bar : RISK.medio.bar};border-radius:999px"></div>
            </div>
            <span class="num" style="width:74px;text-align:right;font-size:12.5px;color:${T.secondary};flex-shrink:0">${c} de ${t}</span>
            <span class="num" style="width:54px;text-align:right;font-size:13.5px;font-weight:600;color:${pct > 40 ? RISK.muyAlto.text : T.ink};flex-shrink:0">${n1(pct)}&thinsp;%</span>
          </div>`;
        }).join('')}
      </div>`)}
  </div>`,
});

// ── Tendencias · la propia serie de la empresa ─────────────────────────
export const tendencias = app({
  w: 1440, h: 1060, activo: 'trends', empresa: 'Transportes Andinos S.A.S.',
  migas: ['Empresas', 'Transportes Andinos', 'Tendencias'],
  contenido: `
  ${cabecera({
    titulo: 'Cuatro aplicaciones en seis años, y el riesgo sube en las cuatro',
    rubrica: 'Transportes Andinos S.A.S. · aplicaciones de <span class="num">2020, 2022, 2024 y 2026</span>',
    bajada: 'Cada serie compara la empresa consigo misma, que es la única comparación en la que el baremo no cambia. Las dos formas van por separado porque miden instrumentos distintos.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportar</span>`,
  })}

  <div style="display:flex;border-top:1px solid ${T.border};border-bottom:1px solid ${T.border};margin-bottom:26px">
    ${[['Aplicaciones', '4', 'desde 2020'], ['Forma B · variación', '+26,1', 'puntos'], ['Forma A · variación', '+2,3', 'puntos'], ['Brecha entre formas', '34,4', 'puntos, de 8,0 en 2020'], ['Medidas cumplidas', '0', 'de 13 asignadas']].map(([k, v, n], i) => `
      <div style="flex:1;padding:18px 0 18px ${i ? '24px' : '0'};${i ? `border-left:1px solid ${T.borderMuted}` : ''}">
        <p class="rub">${esc(k)}</p>
        <p class="cifra" style="font-size:28px;margin-top:9px;color:${i === 1 || i === 4 ? T.danger : T.ink}">${v}</p>
        <p style="font-size:11.5px;color:${T.muted};margin-top:5px">${esc(n)}</p>
      </div>`).join('')}
  </div>

  <div style="display:flex;gap:22px">
    ${figura('Puntaje total por forma', 'Cada forma contra su propio baremo · nunca promediadas entre sí',
      lineas({
        w: 560, h: 240, max: 100, hover: 3,
        etiquetasX: ['2020', '2022', '2024', '2026'],
        series: [
          { nombre: 'Forma B', color: CAT[1], valores: [42.1, 51.8, 63.4, 68.2] },
          { nombre: 'Forma A', color: CAT[0], valores: [31.5, 32.4, 33.1, 33.8] },
        ],
      })
      + `<p style="font-size:12px;line-height:1.65;color:${T.secondary};margin-top:14px">
          La brecha pasa de 10,6 a 34,4 puntos. El deterioro está concentrado en la operación:
          los profesionales y jefaturas se mueven 2,3 puntos en seis años.</p>`)}

    ${figura('Personas en riesgo alto o muy alto', 'Recuento sobre los evaluados de cada aplicación',
      `<div style="margin-top:4px">
        ${[['2020', 287, 61], ['2022', 341, 98], ['2024', 398, 142], ['2026', 412, 169]].map(([a, t, c], i) => {
          const pct = (c / t) * 100;
          return `<div style="display:flex;align-items:center;gap:16px;padding:14px 0;${i ? `border-top:1px solid ${T.borderMuted}` : `border-top:1.5px solid ${T.ink}`}">
            <span class="num" style="width:44px;flex-shrink:0;font-size:13px;color:${T.ink}">${a}</span>
            <div style="flex:1;height:11px;border-radius:999px;background:${T.surfaceMuted};overflow:hidden">
              <div class="barra-anim" style="width:${pct}%;height:100%;background:${RISK.alto.bar};border-radius:999px"></div>
            </div>
            <span class="num" style="width:80px;text-align:right;font-size:12.5px;color:${T.secondary};flex-shrink:0">${c} de ${t}</span>
            <span class="num" style="width:52px;text-align:right;font-size:14px;font-weight:600;color:${RISK.alto.text};flex-shrink:0">${n1(pct)}&thinsp;%</span>
          </div>`;
        }).join('')}
        <p style="font-size:12px;line-height:1.65;color:${T.secondary};margin-top:16px;padding-top:14px;border-top:1px solid ${T.border}">
          La cobertura creció de 287 a 412 personas, así que el recuento sube en parte por eso.
          La proporción no: pasa del 21,3% al 41,0%, y esa sí es comparable entre aplicaciones.
        </p>
      </div>`)}
  </div>

  <div style="margin-top:22px;padding:24px 28px;border-radius:16px;background:${T.surface};border:1px solid ${T.border}">
    <p class="rub-ink">Lo que dice la serie</p>
    <p class="prose" style="margin-top:12px;max-width:1010px">
      El riesgo de los operativos sube en las cuatro aplicaciones, sin una sola reversión, y
      en el mismo periodo no se ejecutó ninguna de las 13 medidas asignadas desde 2022.
      <strong>Es el hallazgo que una inspección del Ministerio buscaría primero</strong>: hay
      diagnóstico, hay plan, y no hay evidencia de intervención.
    </p>
  </div>`,
});

// ── Intervenciones ─────────────────────────────────────────────────────
export const intervenciones = app({
  w: 1440, h: 1140, activo: 'interv', empresa: 'Transportes Andinos S.A.S.', migas: ['Intervenciones'],
  contenido: `
  ${cabecera({
    rubrica: 'Análisis · Planes de acción',
    titulo: 'Intervenciones',
    bajada: 'Una recomendación sin responsable y sin fecha no es una intervención. Aquí cada medida tiene dueño, plazo y evidencia de cumplimiento.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportar plan</span><span class="btn btn-pri">${icono('mas', { size: 14, color: '#FFF' })}Nueva medida</span>`,
  })}

  <div style="display:flex;gap:9px;margin-bottom:22px">
    ${[['Todas', 47, true], ['Vencidas', 6, false], ['En curso', 19, false], ['Cumplidas', 22, false]].map(([t, n, on]) => `
      <span class="chip" style="height:32px;padding:0 15px;font-size:13px;gap:8px;font-weight:${on ? 600 : 400};background:${on ? T.ink : T.surface};color:${on ? '#FFF' : T.secondary};border:1px solid ${on ? T.ink : T.border}">
        ${esc(t)}<span class="num" style="opacity:0.65">${n}</span></span>`).join('')}
  </div>

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      ${[
        ['Rediseño de la jornada de conducción', 'Transportes Andinos', 'Demandas de la jornada', 'Jorge Ospina · Gerencia de operaciones', '2026-08-30', 'Vencida', 'alerta', 35],
        ['Autonomía en la programación de rutas', 'Transportes Andinos', 'Control y autonomía', 'Lina Marín · SST', '2026-12-15', 'En curso', 'teal', 62],
        ['Formación de líderes de operación', 'Agroindustria Valle', 'Características del liderazgo', 'Camila Restrepo · Gestión humana', '2027-02-28', 'En curso', 'teal', 20],
        ['Pausas activas en turnos nocturnos', 'Clínica del Norte', 'Demandas de la jornada', 'Andrés Lozano · SST', '2026-06-30', 'Cumplida', 'ok', 100],
        ['Comité de convivencia laboral', 'Constructora Sierra', 'Relaciones sociales', 'Paula Guzmán · Gestión humana', '2026-05-15', 'Cumplida', 'ok', 100],
      ].map(([t, org, dim, resp, fecha, est, tono, pct]) => `
        <div class="card" style="padding:18px 21px;margin-bottom:12px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
            <div style="min-width:0">
              <p style="font-family:${FONTS.head};font-size:18px;font-weight:600;letter-spacing:-0.005em;color:${T.ink}">${esc(t)}</p>
              <p style="font-size:12.5px;color:${T.secondary};margin-top:5px">${esc(org)} · ${esc(dim)}</p>
            </div>
            ${estado(est, tono)}
          </div>
          <div style="display:flex;align-items:center;gap:16px;margin-top:14px">
            <div style="flex:1;height:5px;border-radius:999px;background:${T.surfaceMuted};overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${pct === 100 ? T.success : tono === 'alerta' ? T.danger : T.teal};border-radius:999px"></div>
            </div>
            <span class="num" style="font-size:11.5px;color:${T.muted};width:34px;text-align:right">${pct}%</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:13px;padding-top:12px;border-top:1px solid ${T.borderMuted}">
            <p style="font-size:12px;color:${T.secondary}">${esc(resp)}</p>
            <p class="num" style="font-size:12px;color:${tono === 'alerta' ? T.danger : T.muted}">Vence ${fecha}</p>
          </div>
        </div>`).join('')}
    </section>

    <section style="width:376px;flex-shrink:0">
      ${figura('Cumplimiento por empresa', 'Medidas cumplidas sobre el total asignado',
        `<div>${[['Constructora Sierra', 9, 10], ['Clínica del Norte', 7, 9], ['Alimentos del Caribe', 4, 6], ['Agroindustria Valle', 2, 9], ['Transportes Andinos', 0, 13]].map(([n, hecho, total], i) => `
          <div style="padding:10px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <span style="font-size:12.5px;color:${T.ink}">${esc(n)}</span>
              <span class="num" style="font-size:12px;color:${hecho / total > 0.6 ? T.success : hecho === 0 ? T.danger : T.warning}">${hecho}/${total}</span>
            </div>
            <div style="height:6px;border-radius:999px;background:${T.surfaceMuted};margin-top:7px;overflow:hidden">
              <div style="width:${(hecho / total) * 100}%;height:100%;background:${hecho / total > 0.6 ? T.success : hecho === 0 ? T.danger : T.warning};border-radius:999px"></div>
            </div>
          </div>`).join('')}</div>`, { w: 376 })}

      <div style="margin-top:20px;padding:20px 22px;border-radius:12px;background:#FEE2E2;border:1px solid #FECACA">
        <div style="display:flex;gap:11px">
          ${icono('alerta', { size: 17, color: '#B91C1C' })}
          <div>
            <p style="font-size:13.5px;font-weight:600;color:#B91C1C">Transportes Andinos no ha ejecutado ninguna medida</p>
            <p style="font-size:12.5px;line-height:1.6;color:#9F1239;margin-top:6px">
              13 medidas asignadas desde 2022, cero cumplidas, y el riesgo subió 29,5 puntos en el mismo
              periodo. Es el hallazgo que una inspección del Ministerio buscaría primero.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>`,
});

// ── Asistente IA ───────────────────────────────────────────────────────
export const asistenteIA = app({
  w: 1440, h: 1070, activo: 'ai', empresa: null, migas: ['Asistente IA'],
  contenido: `
  ${cabecera({
    rubrica: 'Análisis · Apoyo a la redacción',
    titulo: 'Asistente',
    bajada: 'El asistente redacta borradores de interpretación a partir de puntajes ya calculados. No califica, no decide un nivel de riesgo y no firma: eso sigue siendo del profesional.',
  })}

  <div style="display:flex;align-items:flex-start;gap:13px;padding:16px 20px;border-radius:10px;background:#DBEAFE;border:1px solid #BFDBFE;margin-bottom:24px">
    ${icono('escudo', { size: 18, color: '#1D4ED8' })}
    <div>
      <p style="font-size:13.5px;font-weight:600;color:#1D4ED8">Cada salida queda marcada como generada y requiere su revisión</p>
      <p style="font-size:12.5px;line-height:1.6;color:#1E40AF;margin-top:4px">
        Ningún texto del asistente llega a un informe firmado sin pasar por una edición o una aprobación
        explícita suya, que queda registrada en el log de auditoría con fecha y usuario.
      </p>
    </div>
  </div>

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:16px 22px;border-bottom:1px solid ${T.border};background:${T.paper};display:flex;align-items:center;justify-content:space-between">
          <p style="font-size:13px;font-weight:600;color:${T.ink}">Interpretación · Transportes Andinos · Demandas del trabajo</p>
          <span class="num" style="font-size:11.5px;color:${T.muted}">Borrador · 2026-09-16 09:12</span>
        </div>

        <div style="padding:22px 26px">
          <div style="display:flex;gap:13px;margin-bottom:20px">
            <div style="width:26px;height:26px;border-radius:7px;background:${T.tealLight};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${icono('ia', { size: 14, color: T.tealDark })}
            </div>
            <div style="flex:1">
              <p class="rub rub-ink" style="margin-bottom:9px">Borrador generado</p>
              <p class="prose">
                El dominio <em>Demandas del trabajo</em> alcanza 71,6 puntos, nivel muy alto. Dentro de él,
                las demandas de la jornada (88,4) y las demandas cuantitativas (74,1) concentran el peso del
                resultado, mientras que la carga mental se mantiene en riesgo medio.
              </p>
              <p class="prose" style="margin-top:12px">
                El patrón es coherente con una operación de transporte de carga en la que el volumen de
                trabajo se absorbe extendiendo la jornada. La combinación con un control sobre el trabajo
                bajo agrava el pronóstico: la persona no dispone de margen para reorganizar su ritmo.
              </p>
              <div style="display:flex;gap:9px;margin-top:16px">
                <span class="btn btn-pri" style="height:32px;font-size:12.5px">${icono('check', { size: 13, color: '#FFF' })}Aceptar y editar</span>
                <span class="btn btn-sec" style="height:32px;font-size:12.5px">Regenerar</span>
                <span class="btn btn-ghost" style="height:32px;font-size:12.5px">Descartar</span>
              </div>
            </div>
          </div>

          <div style="padding:15px 17px;border-radius:9px;background:${T.paper};border:1px solid ${T.border}">
            <p class="rub" style="margin-bottom:10px">Datos que recibió el modelo</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${['Puntajes por dimensión', 'Niveles de la Resolución 2646', 'Sector económico', 'Nivel del cargo', 'Tamaño de la población'].map((c) => `
                <span class="chip" style="background:${T.surfaceMuted};color:${T.secondary};border:1px solid ${T.border};font-weight:400">${esc(c)}</span>`).join('')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
              <p class="rub" style="width:100%;margin-bottom:2px">Datos que no salieron del sistema</p>
              ${['Nombres', 'Documentos de identidad', 'Respuestas ítem por ítem', 'Correos'].map((c) => `
                <span class="chip" style="background:#FEE2E2;color:#B91C1C;border:1px solid #FECACA;font-weight:400">${esc(c)}</span>`).join('')}
            </div>
          </div>
        </div>

        <div style="padding:16px 26px;border-top:1px solid ${T.border};background:${T.paper}">
          <div class="input" style="height:44px;justify-content:space-between">
            <span>Pida un ajuste: «más breve», «sin tecnicismos», «enfocado en la jornada»…</span>
            ${icono('flecha', { size: 15, color: T.muted })}
          </div>
        </div>
      </div>
    </section>

    <section style="width:376px;flex-shrink:0">
      <p class="rub rub-ink" style="margin-bottom:14px">Qué puede pedirle</p>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${[
          ['informe', 'Interpretación por dominio', 'Redacta el apartado 3 de un informe individual o colectivo.'],
          ['plan', 'Medidas de intervención', 'Propone acciones a partir de las dimensiones críticas.'],
          ['grafico', 'Lectura del perfil sociodemográfico', 'Conecta el perfil de la población con el riesgo extralaboral.'],
          ['libro', 'Resumen para la gerencia', 'Traduce el informe técnico a una página sin jerga.'],
        ].map(([ic, t, d]) => `
          <div class="card" style="padding:15px 17px;display:flex;gap:12px">
            <div style="width:26px;height:26px;border-radius:7px;background:${T.surfaceMuted};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${icono(ic, { size: 14, color: T.secondary })}
            </div>
            <div><p style="font-size:13.5px;font-weight:600;color:${T.ink}">${esc(t)}</p>
            <p style="font-size:12px;line-height:1.55;color:${T.secondary};margin-top:3px">${esc(d)}</p></div>
          </div>`).join('')}
      </div>

      <div style="margin-top:20px;padding:18px 20px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
        <p class="rub rub-ink">Consumo</p>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-top:12px">
          <span style="font-size:12.5px;color:${T.secondary}">Generaciones este mes</span>
          <span class="num" style="font-size:18px;font-weight:600">38</span>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-top:9px;padding-top:10px;border-top:1px solid ${T.borderMuted}">
          <span style="font-size:12.5px;color:${T.secondary}">Aceptadas sin editar</span>
          <span class="num" style="font-size:18px;font-weight:600;color:${T.secondary}">11</span>
        </div>
        <p style="font-size:11.5px;line-height:1.6;color:${T.muted};margin-top:12px">
          Incluido en el plan Profesional. No consume créditos de evaluación.
        </p>
      </div>
    </section>
  </div>`,
});
