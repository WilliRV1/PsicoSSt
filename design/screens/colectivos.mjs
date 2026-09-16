import { T, RISK, RISK_ORDER, CAT, RAMPA, FONTS, app, icono, riesgo, pasos, estado, esc, n1 } from '../lib.mjs';
import { cabecera } from './operacion.mjs';
import { barras, apilada, figura, lineas } from './graficos.mjs';

/** Cabecera común de los tres informes colectivos. */
function cabeceraInforme({ tipo, titulo, folio, bajada, acciones }) {
  return `${cabecera({
    rubrica: `${tipo} · Folio <span class="num">${folio}</span>`,
    titulo,
    bajada,
    acciones,
  })}`;
}

const ACCIONES = `<span class="btn btn-sec">${icono('ojo', { size: 14, color: T.secondary })}Vista de impresión</span><span class="btn btn-pri">${icono('desc', { size: 14, color: '#FFF' })}Descargar PDF</span>`;

// ── Diagnóstico organizacional ─────────────────────────────────────────
const DOM_COL = [
  ['Liderazgo y relaciones sociales', 58.2, 'alto'],
  ['Control sobre el trabajo', 29.4, 'medio'],
  ['Demandas del trabajo', 71.6, 'muyAlto'],
  ['Recompensa', 12.8, 'bajo'],
];

const AREAS = [
  ['Operación de vehículos', 198, [8, 24, 41, 78, 47]],
  ['Mantenimiento', 74, [4, 14, 22, 21, 13]],
  ['Logística y patios', 61, [6, 17, 20, 12, 6]],
  ['Administración', 42, [11, 16, 10, 4, 1]],
  ['Comercial', 22, [4, 8, 7, 2, 1]],
  ['Dirección', 15, [5, 6, 3, 1, 0]],
];

export const informeDiagnostico = app({
  w: 1440, h: 1860, activo: 'reports', migas: ['Empresas', 'Transportes Andinos', 'Diagnóstico'],
  contenido: `
  ${cabeceraInforme({
    tipo: 'Informe colectivo',
    folio: 'CO-2026-0043',
    titulo: 'Diagnóstico organizacional',
    bajada: 'Transportes Andinos S.A.S. · 412 trabajadores evaluados de 412 · Intralaboral Formas A y B, Extralaboral y Estrés · corte al 16 de septiembre de 2026.',
    acciones: ACCIONES,
  })}

  <div style="padding:26px 30px;border-radius:12px;background:${T.surface};border:1px solid ${T.border};margin-bottom:26px">
    <p class="rub rub-ink">Conclusión</p>
    <p class="prose" style="font-size:18px;margin-top:12px;max-width:1000px">
      La empresa se ubica en <strong style="font-weight:600">riesgo alto</strong> en el resultado
      intralaboral agregado. El 41% de la población está en riesgo alto o muy alto, muy por encima del
      24,7% de la cartera. El patrón es homogéneo y apunta a una causa organizacional, no individual:
      <em>Demandas del trabajo</em> es el dominio crítico en cinco de las seis áreas, y dentro de él
      las demandas de la jornada explican la mayor parte del puntaje.
    </p>
  </div>

  <div style="display:flex;gap:22px;margin-bottom:26px">
    ${figura('Riesgo por dominio', 'Puntaje transformado agregado · 0 a 100',
      `<div>${DOM_COL.map(([n, p, r]) => `
        <div style="padding:11px 0;${n !== DOM_COL[0][0] ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:14px">
            <span style="font-size:13px;color:${T.ink}">${esc(n)}</span>
            <div style="display:flex;align-items:center;gap:11px;flex-shrink:0">
              <span class="num" style="font-size:14.5px;font-weight:600;color:${RISK[r].text}">${n1(p)}</span>
              ${riesgo(r, { size: 'sm' })}
            </div>
          </div>
          <div style="height:9px;border-radius:0 4px 4px 0;background:${T.surfaceMuted};margin-top:8px;overflow:hidden">
            <div style="width:${p}%;height:100%;background:${RISK[r].bar};border-radius:0 4px 4px 0"></div>
          </div>
        </div>`).join('')}</div>`)}

    ${figura('Distribución de la población', '412 trabajadores · niveles de la Resolución 2646',
      apilada(RISK_ORDER.map((k, i) => [RISK[k].label, [38, 79, 126, 118, 51][i], RISK[k].bar]), { w: 420, alto: 26 })
      + `<p class="prose" style="font-size:14.5px;margin-top:16px">169 personas en riesgo alto o muy alto. La norma exige seguimiento individual documentado para cada una de ellas.</p>`)}
  </div>

  ${figura('Riesgo por área', 'Cada fila suma el 100% de su área · ordenadas por proporción en riesgo alto y muy alto',
    `<div style="margin-top:4px">
      <div style="display:flex;align-items:center;gap:14px;padding-bottom:9px;border-bottom:1px solid ${T.border}">
        <span style="width:168px;flex-shrink:0"></span>
        <span class="th" style="flex:1;border:0;padding:0">Distribución</span>
        <span class="th" style="width:58px;border:0;padding:0;text-align:right">Trab.</span>
        <span class="th" style="width:88px;border:0;padding:0;text-align:right">Alto + muy alto</span>
      </div>
      ${AREAS.map(([a, t, dist]) => {
        const criticos = dist[3] + dist[4];
        const pct = (criticos / t) * 100;
        return `<div style="display:flex;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid ${T.borderMuted}">
          <span style="width:168px;flex-shrink:0;font-size:13px;color:${T.ink}">${esc(a)}</span>
          <div style="flex:1">${apilada(RISK_ORDER.map((k, i) => [RISK[k].label, dist[i], RISK[k].bar]), { w: 0, alto: 11, leyenda: false })}</div>
          <span class="num" style="width:58px;text-align:right;font-size:12.5px;color:${T.secondary}">${t}</span>
          <span class="num" style="width:88px;text-align:right;font-size:13px;font-weight:600;color:${pct > 40 ? RISK.muyAlto.text : pct > 25 ? RISK.alto.text : T.secondary}">${n1(pct)}%</span>
        </div>`;
      }).join('')}
      <div style="display:flex;flex-wrap:wrap;gap:15px;margin-top:14px">
        ${RISK_ORDER.map((k) => `<div style="display:flex;align-items:center;gap:6px">
          <span style="width:9px;height:9px;border-radius:2.5px;background:${RISK[k].bar}"></span>
          <span style="font-size:11.5px;color:${T.secondary}">${esc(RISK[k].label)}</span></div>`).join('')}
      </div>
    </div>`)}

  <div style="display:flex;gap:22px;margin-top:22px">
    ${figura('Las diez dimensiones más críticas', 'Puntaje transformado · umbral de riesgo alto en 40',
      barras([
        ['Jornada de trabajo', 88.4], ['Demandas cuantitativas', 74.1], ['Influencia extralaboral', 66.2],
        ['Características del liderazgo', 58.9], ['Control y autonomía', 52.3], ['Reconocimiento', 47.7],
        ['Carga mental', 41.8], ['Claridad de rol', 33.5], ['Retroalimentación', 28.1], ['Capacitación', 19.4],
      ], { w: 560, color: CAT[1], unidad: '' }))}

    ${figura('Evolución del riesgo intralaboral', 'Puntaje agregado por año de aplicación',
      lineas({
        w: 500, h: 206, max: 100, hover: 1,
        etiquetasX: ['2020', '2022', '2024', '2026'],
        series: [
          { nombre: 'Operativos', color: CAT[0], valores: [42.1, 51.8, 63.4, 71.6] },
          { nombre: 'Administrativos', color: CAT[2], valores: [31.5, 33.2, 34.8, 36.1] },
        ],
      })
      + `<p style="font-size:12px;line-height:1.6;color:${T.secondary};margin-top:14px">
          La brecha entre operativos y administrativos pasa de 10,6 a 35,5 puntos en seis años. El deterioro
          está concentrado en la operación, no distribuido en la empresa.</p>`)}
  </div>

  <div style="margin-top:22px;padding:24px 28px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
    <p class="rub rub-ink">Medidas de intervención prioritarias</p>
    <div style="display:flex;gap:20px;margin-top:16px">
      ${[
        ['01', 'Rediseño de la jornada de conducción', 'Revisar la distribución de tareas, evaluar la suficiencia de personal y ajustar las jornadas garantizando periodos de descanso.', 'Inmediata', 'alerta'],
        ['02', 'Autonomía en la programación de rutas', 'Fomentar la participación en la toma de decisiones y flexibilizar horarios donde la operación lo permita.', '3 meses', 'aviso'],
        ['03', 'Formación de líderes de operación', 'Fortalecer habilidades blandas con énfasis en comunicación asertiva y retroalimentación constructiva.', '6 meses', 'info'],
      ].map(([n, t, d, plazo, tono]) => `
        <div style="flex:1;padding:18px 20px;border:1px solid ${T.border};border-radius:10px;background:${T.paper}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="num" style="font-size:11.5px;color:${T.muted}">${n}</span>${estado(plazo, tono)}
          </div>
          <p style="font-family:${FONTS.head};font-size:17px;font-weight:600;color:${T.ink};margin-top:11px">${esc(t)}</p>
          <p style="font-size:12.5px;line-height:1.6;color:${T.secondary};margin-top:8px">${esc(d)}</p>
        </div>`).join('')}
    </div>
  </div>`,
});

// ── Perfil sociodemográfico ────────────────────────────────────────────
export const informeSociodemografico = app({
  w: 1440, h: 1280, activo: 'reports', migas: ['Empresas', 'Clínica del Norte', 'Sociodemográfico'],
  contenido: `
  ${cabeceraInforme({
    tipo: 'Informe colectivo',
    folio: 'SD-2026-0039',
    titulo: 'Perfil sociodemográfico',
    bajada: 'Clínica del Norte · 241 fichas completas de 268 trabajadores registrados (90%) · la ficha sociodemográfica es obligatoria en la batería y se diligencia una sola vez.',
    acciones: ACCIONES,
  })}

  <div style="display:flex;border-top:1px solid ${T.border};border-bottom:1px solid ${T.border};margin-bottom:24px">
    ${[['Fichas completas', '241', ''], ['Edad promedio', '37,4', 'años'], ['Antigüedad promedio', '5,8', 'años'], ['Mujeres', '71', '%'], ['Con personas a cargo', '64', '%']].map(([k, v, u], i) => `
      <div style="flex:1;padding:17px 0 17px ${i ? '26px' : '0'};${i ? `border-left:1px solid ${T.borderMuted}` : ''}">
        <p class="rub">${esc(k)}</p>
        <div style="display:flex;align-items:baseline;gap:6px;margin-top:8px">
          <span class="num" style="font-size:28px;font-weight:600;color:${T.ink}">${v}</span>
          ${u ? `<span style="font-size:12px;color:${T.muted}">${esc(u)}</span>` : ''}
        </div>
      </div>`).join('')}
  </div>

  <div style="display:flex;gap:22px">
    ${figura('Grupo de edad', 'Variable ordinal · un solo tono de claro a oscuro',
      barras([['18 a 27', 14], ['28 a 37', 38], ['38 a 47', 29], ['48 a 57', 15], ['58 o más', 4]], { w: 400, rampa: true }))}
    ${figura('Nivel educativo', 'Variable ordinal · un solo tono',
      barras([['Primaria', 2], ['Bachillerato', 11], ['Técnico', 24], ['Tecnológico', 18], ['Profesional', 33], ['Posgrado', 12]], { w: 400, rampa: true }))}
    ${figura('Antigüedad en la empresa', 'Variable ordinal · un solo tono',
      barras([['Menos de 1', 9], ['1 a 3', 27], ['4 a 7', 31], ['8 a 12', 22], ['Más de 12', 11]], { w: 400, rampa: true }))}
  </div>

  <div style="display:flex;gap:22px;margin-top:22px">
    ${figura('Estado civil', 'Variable categórica · orden de color fijo',
      barras([['Soltero', 28], ['Casado', 31], ['Unión libre', 26], ['Separado', 12], ['Viudo', 3]], { w: 400 }))}
    ${figura('Tipo de vivienda', 'Variable categórica',
      apilada([['Propia', 38, CAT[0]], ['Arrendada', 49, CAT[1]], ['Familiar', 13, CAT[2]]], { w: 400, alto: 26 })
      + `<p style="font-size:12px;line-height:1.6;color:${T.secondary};margin-top:16px">
          Casi la mitad de la población vive en arriendo. Es un dato que pesa en la dimensión
          <em>situación económica del grupo familiar</em> del cuestionario extralaboral.</p>`)}
    ${figura('Personas a cargo', 'Variable ordinal · un solo tono',
      barras([['Ninguna', 36], ['Una', 24], ['Dos', 23], ['Tres', 12], ['Cuatro o más', 5]], { w: 400, rampa: true }))}
  </div>

  <div style="margin-top:22px;padding:24px 28px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
    <p class="rub rub-ink">Lectura del perfil</p>
    <p class="prose" style="margin-top:12px;max-width:1010px">
      La población es mayoritariamente femenina (71%), joven-adulta y con formación técnica o
      profesional. La combinación de <strong style="font-weight:600">turnos asistenciales</strong>,
      <strong style="font-weight:600">64% con personas a cargo</strong> y <strong style="font-weight:600">49%
      en vivienda arrendada</strong> concentra la tensión en la dimensión <em>balance entre la vida
      laboral y familiar</em>, que en el cuestionario extralaboral de esta empresa es la de puntaje
      más alto. El perfil sociodemográfico no es un anexo estadístico: explica por qué el riesgo
      extralaboral aquí no se resuelve con medidas dentro de la jornada.
    </p>
  </div>`,
});

// ── Programa de vigilancia epidemiológica ──────────────────────────────
export const programaSVE = app({
  w: 1440, h: 1300, activo: 'reports', migas: ['Empresas', 'Constructora Sierra', 'Programa SVE'],
  contenido: `
  ${cabeceraInforme({
    tipo: 'Programa',
    folio: 'SVE-2026-0011',
    titulo: 'Vigilancia epidemiológica',
    bajada: 'Constructora Sierra · 203 trabajadores · el sistema de vigilancia es obligatorio cuando hay población en riesgo alto o muy alto (Resolución 2646 de 2008, artículo 14).',
    acciones: ACCIONES,
  })}

  <div style="display:flex;gap:22px;margin-bottom:24px">
    <div style="flex:1;padding:24px 28px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
      <p class="rub rub-ink">Población objeto de vigilancia</p>
      <div style="display:flex;align-items:flex-end;gap:22px;margin-top:14px">
        <span class="display" style="font-size:58px">61</span>
        <div style="padding-bottom:9px">
          <p style="font-size:14px;color:${T.ink};font-weight:500">trabajadores en riesgo alto o muy alto</p>
          <p style="font-size:12.5px;color:${T.secondary};margin-top:3px">30,0% de la población evaluada · todos con seguimiento individual abierto</p>
        </div>
      </div>
      <div style="margin-top:20px">
        ${apilada([['Riesgo alto', 44, RISK.alto.bar], ['Riesgo muy alto', 17, RISK.muyAlto.bar], ['Resto de la población', 142, T.surfaceMuted]], { w: 560, alto: 16 })}
      </div>
    </div>
    <div style="width:376px;flex-shrink:0;padding:24px 26px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
      <p class="rub rub-ink">Estado del programa</p>
      <div style="margin-top:14px">
        ${[['Casos abiertos', '61', T.ink], ['Con valoración clínica', '48', T.success], ['Seguimiento vencido', '9', T.warning], ['Casos cerrados en 2026', '23', T.secondary]].map(([k, v, c], i) => `
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <span style="font-size:12.5px;color:${T.secondary}">${esc(k)}</span>
            <span class="num" style="font-size:18px;font-weight:600;color:${c}">${v}</span>
          </div>`).join('')}
      </div>
    </div>
  </div>

  <div style="display:flex;gap:22px">
    ${figura('Fases del programa', 'Ciclo anual · cada fase deja evidencia documental',
      `<div style="margin-top:4px">
        ${[
          ['Identificación', 'Aplicación de la batería y clasificación por nivel', 'Cumplida', 'ok', 100],
          ['Evaluación individual', 'Valoración clínica de los casos priorizados', 'En curso', 'teal', 79],
          ['Intervención', 'Medidas organizacionales e individuales', 'En curso', 'teal', 41],
          ['Seguimiento', 'Reevaluación a 3, 6 y 12 meses', 'Programada', 'neutro', 12],
          ['Evaluación del programa', 'Indicadores de efectividad y ajuste', 'Pendiente', 'neutro', 0],
        ].map(([f, d, e, tono, pct], i) => `
          <div style="display:flex;gap:16px;padding:14px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <span class="num" style="font-size:11.5px;color:${T.muted};width:20px;flex-shrink:0;padding-top:3px">${String(i + 1).padStart(2, '0')}</span>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
                <p style="font-size:14px;font-weight:600;color:${T.ink}">${esc(f)}</p>${estado(e, tono)}
              </div>
              <p style="font-size:12.5px;color:${T.secondary};margin-top:4px">${esc(d)}</p>
              <div style="display:flex;align-items:center;gap:10px;margin-top:9px">
                <div style="flex:1;height:5px;border-radius:0 3px 3px 0;background:${T.surfaceMuted};overflow:hidden">
                  <div style="width:${pct}%;height:100%;background:${pct === 100 ? T.success : T.teal};border-radius:0 3px 3px 0"></div>
                </div>
                <span class="num" style="font-size:11px;color:${T.muted};width:32px;text-align:right">${pct}%</span>
              </div>
            </div>
          </div>`).join('')}
      </div>`)}

    ${figura('Indicadores de efectividad', 'Comparación entre la línea base 2024 y el corte 2026',
      `<div style="margin-top:4px">
        ${[
          ['Prevalencia de riesgo alto y muy alto', '41,2%', '30,0%', true],
          ['Ausentismo por causa médica', '4,8%', '3,1%', true],
          ['Rotación anual', '22,4%', '18,9%', true],
          ['Accidentalidad con incapacidad', '17', '14', true],
          ['Cobertura de la evaluación', '78%', '100%', true],
          ['Casos con seguimiento al día', '52%', '85%', true],
        ].map(([k, base, hoy, mejora], i) => `
          <div style="display:flex;align-items:center;gap:14px;padding:12px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <span style="flex:1;font-size:13px;color:${T.ink}">${esc(k)}</span>
            <span class="num" style="font-size:12.5px;color:${T.muted};width:58px;text-align:right">${esc(base)}</span>
            ${icono('flecha', { size: 12, color: T.border })}
            <span class="num" style="font-size:13.5px;font-weight:600;color:${mejora ? T.success : T.danger};width:58px;text-align:right">${esc(hoy)}</span>
          </div>`).join('')}
        <p style="font-size:12px;line-height:1.6;color:${T.secondary};margin-top:16px;padding-top:14px;border-top:1px solid ${T.border}">
          Los seis indicadores mejoran respecto de la línea base. El programa se mantiene con los mismos
          objetivos y se ajusta el plazo de la fase de intervención.
        </p>
      </div>`)}
  </div>`,
});
