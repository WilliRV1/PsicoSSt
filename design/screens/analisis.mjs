import { T, RISK, RISK_ORDER, CAT, FONTS, app, icono, riesgo, pasos, estado, esc, n1 } from '../lib.mjs';
import { cabecera, filtros } from './operacion.mjs';
import { barras, apilada, figura, lineas } from './graficos.mjs';

// ── Analítica ──────────────────────────────────────────────────────────
export const analitica = app({
  w: 1440, h: 1220, activo: 'analyt', migas: ['Analítica'],
  contenido: `
  ${cabecera({
    rubrica: 'Análisis · Toda la cartera',
    titulo: 'Analítica',
    bajada: 'Comparaciones entre empresas, sectores y perfiles. Los agregados solo se muestran cuando el grupo tiene al menos cinco personas: por debajo de ese umbral el dato deja de ser anónimo.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportar datos</span>`,
  })}
  ${filtros(['Últimos 24 meses', 'Todos los sectores', 'Todas las formas'], { busca: 'Comparar empresas…' })}

  <div style="display:flex;gap:22px">
    ${figura('Riesgo intralaboral por sector', 'Puntaje agregado · 12 empresas de la cartera',
      barras([
        ['Transporte', 71.6], ['Agroindustria', 64.2], ['Construcción', 52.8],
        ['Salud humana', 48.1], ['Manufactura', 39.5], ['Logística', 36.7], ['Servicios', 28.4],
      ], { w: 470, color: CAT[0], unidad: '' }))}
    ${figura('Distribución por nivel del cargo', 'Cada barra suma el 100% de su nivel',
      // Las columnas suman la banda del centro de control (214/389/364/224/93),
      // las filas suman 1.284 y alto+muy alto da los 317 que enuncia el panel.
      `<div>${[
        ['Operativo', [22, 74, 138, 121, 52]],
        ['Auxiliar', [18, 61, 79, 54, 21]],
        ['Técnico', [31, 68, 62, 24, 8]],
        ['Profesional', [78, 118, 61, 19, 8]],
        ['Jefatura', [65, 68, 24, 6, 4]],
      ].map(([n, d], i) => `
        <div style="display:flex;align-items:center;gap:13px;padding:8px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <span style="width:88px;flex-shrink:0;font-size:12.5px;color:${T.ink}">${esc(n)}</span>
          <div style="flex:1">${apilada(RISK_ORDER.map((k, j) => [RISK[k].label, d[j], RISK[k].bar]), { w: 0, alto: 11, leyenda: false })}</div>
          <span class="num" style="width:44px;text-align:right;font-size:11.5px;color:${T.secondary}">${d.reduce((a, b) => a + b, 0)}</span>
        </div>`).join('')}
        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:13px">
          ${RISK_ORDER.map((k) => `<div style="display:flex;align-items:center;gap:6px">
            <span style="width:9px;height:9px;border-radius:2.5px;background:${RISK[k].bar}"></span>
            <span style="font-size:11.5px;color:${T.secondary}">${esc(RISK[k].label)}</span></div>`).join('')}
        </div>
        <p style="font-size:12px;line-height:1.6;color:${T.secondary};margin-top:14px;padding-top:12px;border-top:1px solid ${T.border}">
          El riesgo crece de forma monótona al bajar en la escala de cargos. No es un hallazgo de una
          empresa: se repite en las doce.
        </p>
      </div>`)}
  </div>

  <div style="display:flex;gap:22px;margin-top:22px">
    ${figura('Los cuatro dominios en el tiempo', 'Puntaje agregado de la cartera por semestre',
      lineas({
        w: 660, h: 236, max: 100, hover: 3,
        etiquetasX: ['2024-I', '2024-II', '2025-I', '2025-II', '2026-I'],
        series: [
          { nombre: 'Demandas', color: CAT[1], valores: [48.2, 51.6, 55.9, 58.4, 61.2] },
          { nombre: 'Liderazgo', color: CAT[0], valores: [41.5, 42.8, 41.2, 43.6, 44.1] },
          { nombre: 'Control', color: CAT[2], valores: [33.1, 32.4, 31.8, 30.9, 29.6] },
          { nombre: 'Recompensa', color: CAT[3], valores: [21.4, 20.8, 19.9, 18.7, 17.2] },
        ],
      }))}
    <div style="width:398px;flex-shrink:0">
      ${figura('Correlación con estrés', 'Coeficiente de Spearman entre dominio y puntaje de estrés',
        `<div>${[
          ['Demandas del trabajo', 0.71], ['Liderazgo y relaciones', 0.58],
          ['Control sobre el trabajo', 0.44], ['Recompensa', 0.31], ['Extralaboral', 0.29],
        ].map(([n, r], i) => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <span style="flex:1;font-size:12.5px;color:${T.ink}">${esc(n)}</span>
            <div style="width:110px;height:8px;border-radius:999px;background:${T.surfaceMuted};overflow:hidden">
              <div style="width:${r * 100}%;height:100%;background:${CAT[0]};border-radius:999px"></div>
            </div>
            <span class="num" style="font-size:12.5px;font-weight:600;color:${T.ink};width:36px;text-align:right">${r.toFixed(2).replace('.', ',')}</span>
          </div>`).join('')}
          <p style="font-size:11.5px;line-height:1.6;color:${T.muted};margin-top:14px">
            n = 1.284 · todas las correlaciones significativas con p &lt; 0,01.
          </p>
        </div>`, { w: 398 })}
    </div>
  </div>`,
});

// ── Tendencias ─────────────────────────────────────────────────────────
export const tendencias = app({
  w: 1440, h: 1080, activo: 'trends', migas: ['Tendencias'],
  contenido: `
  ${cabecera({
    rubrica: 'Análisis · Series históricas',
    titulo: 'Tendencias',
    bajada: 'La batería se reaplica cada uno o dos años. Con tres aplicaciones o más empieza a distinguirse una tendencia real de una variación de medición.',
    acciones: `<span class="btn btn-sec">Comparar empresas</span><span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportar</span>`,
  })}

  <div style="display:flex;border-top:1px solid ${T.border};border-bottom:1px solid ${T.border};margin-bottom:24px">
    ${[['Empresas con serie', '9', 'de 12'], ['Aplicaciones acumuladas', '31', ''], ['Empresas que mejoran', '4', ''], ['Empresas que empeoran', '5', '']].map(([k, v, n], i) => `
      <div style="flex:1;padding:17px 0 17px ${i ? '26px' : '0'};${i ? `border-left:1px solid ${T.borderMuted}` : ''}">
        <p class="rub">${esc(k)}</p>
        <div style="display:flex;align-items:baseline;gap:8px;margin-top:8px">
          <span class="num" style="font-size:28px;font-weight:600;color:${i === 3 ? T.danger : i === 2 ? T.success : T.ink}">${v}</span>
          ${n ? `<span class="num" style="font-size:12px;color:${T.muted}">${esc(n)}</span>` : ''}
        </div>
      </div>`).join('')}
  </div>

  <div style="display:flex;gap:22px">
    ${figura('Riesgo intralaboral por empresa', 'Series con al menos tres aplicaciones',
      lineas({
        w: 660, h: 260, max: 100, hover: 2,
        etiquetasX: ['2020', '2022', '2024', '2026'],
        series: [
          { nombre: 'Transportes A.', color: CAT[1], valores: [42.1, 51.8, 63.4, 71.6] },
          { nombre: 'Agroind. Valle', color: CAT[3], valores: [55.2, 58.9, 61.0, 64.2] },
          { nombre: 'Constructora S.', color: CAT[2], valores: [61.4, 54.2, 48.8, 41.2] },
          { nombre: 'Clínica Norte', color: CAT[0], valores: [44.8, 46.1, 47.2, 48.1] },
        ],
      }))}

    <div style="width:398px;flex-shrink:0">
      ${figura('Variación desde la primera aplicación', 'Puntos de diferencia · negativo es mejora',
        `<div>${[
          ['Constructora Sierra', -20.2, true], ['Alimentos del Caribe', -8.4, true],
          ['Textiles Bogotá', -5.1, true], ['Servicios Meta', -1.9, true],
          ['Clínica del Norte', 3.3, false], ['Agroindustria Valle', 9.0, false],
          ['Transportes Andinos', 29.5, false],
        ].map(([n, v, bien], i) => {
          const max = 30;
          const ancho = (Math.abs(v) / max) * 50;
          return `<div style="display:flex;align-items:center;gap:11px;padding:9px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <span style="flex:1;font-size:12.5px;color:${T.ink}">${esc(n)}</span>
            <div style="width:140px;display:flex;align-items:center">
              <div style="width:70px;display:flex;justify-content:flex-end">${bien ? `<div style="width:${ancho}%;height:9px;background:${T.success};border-radius:4px 0 0 4px"></div>` : ''}</div>
              <div style="width:1px;height:14px;background:${T.border}"></div>
              <div style="width:70px">${!bien ? `<div style="width:${ancho}%;height:9px;background:${T.danger};border-radius:999px"></div>` : ''}</div>
            </div>
            <span class="num" style="font-size:12.5px;font-weight:600;color:${bien ? T.success : T.danger};width:46px;text-align:right">${v > 0 ? '+' : '−'}${n1(Math.abs(v))}</span>
          </div>`;
        }).join('')}</div>`, { w: 398 })}
    </div>
  </div>

  <div style="margin-top:22px;padding:24px 28px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
    <p class="rub rub-ink">Lo que dice la serie</p>
    <p class="prose" style="margin-top:12px;max-width:1010px">
      <strong style="font-weight:600">Constructora Sierra es el único caso con mejora sostenida</strong>:
      baja 20,2 puntos en seis años, con descensos en las tres reaplicaciones. Coincide con la puesta en
      marcha de su programa de vigilancia epidemiológica en 2021, y es la evidencia más útil que existe
      en la cartera para sustentar una intervención ante otra empresa.
      En el extremo opuesto, Transportes Andinos sube 29,5 puntos sin que se haya ejecutado ninguna
      medida de las recomendadas en 2022.
    </p>
  </div>`,
});

// ── Intervenciones ─────────────────────────────────────────────────────
export const intervenciones = app({
  w: 1440, h: 1140, activo: 'interv', migas: ['Intervenciones'],
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
  w: 1440, h: 1070, activo: 'ai', migas: ['Asistente IA'],
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
