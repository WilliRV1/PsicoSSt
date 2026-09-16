import { T, RISK, RISK_ORDER, FONTS, app, icono, riesgo, pasos, estado, esc, n1, mil } from '../lib.mjs';

/** Cabecera de página: rúbrica, titular Barlow, bajada y acciones. */
export function cabecera({ rubrica, titulo, bajada = '', acciones = '' }) {
  return `<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:30px;margin-bottom:26px">
    <div style="min-width:0">
      <p class="rub">${rubrica}</p>
      <h1 class="display" style="font-size:40px;margin-top:11px">${esc(titulo)}</h1>
      ${bajada ? `<p style="font-size:13.5px;line-height:1.6;color:${T.secondary};margin-top:9px;max-width:620px">${bajada}</p>` : ''}
    </div>
    ${acciones ? `<div style="display:flex;gap:10px;flex-shrink:0">${acciones}</div>` : ''}
  </div>`;
}

/** Barra de filtros: buscador ancho + criterios. Idéntica en las 6 listas. */
export function filtros(campos, { busca = 'Buscar…' } = {}) {
  return `<div style="display:flex;gap:10px;align-items:center;margin-bottom:20px">
    <div class="input" style="flex:1;max-width:330px;gap:9px">
      ${icono('buscar', { size: 14, color: T.muted })}<span>${esc(busca)}</span>
    </div>
    ${campos.map((c) => `<div class="input" style="gap:9px;color:${T.secondary};font-size:13px">
      <span>${esc(c)}</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${T.muted}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </div>`).join('')}
    <div style="margin-left:auto;display:flex;align-items:center;gap:9px;font-size:12.5px;color:${T.muted}">
      ${icono('filtro', { size: 13, color: T.muted })}<span class="num">4</span><span>filtros activos</span>
    </div>
  </div>`;
}

/** Pie de tabla con el recuento y la paginación. */
export function paginacion(desde, hasta, total) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px">
    <p style="font-size:12.5px;color:${T.muted}">
      <span class="num">${desde}–${hasta}</span> de <span class="num">${mil(total)}</span>
    </p>
    <div style="display:flex;gap:5px">
      ${['‹', '1', '2', '3', '…', '9', '›'].map((p, i) => `<span class="num" style="min-width:28px;height:28px;padding:0 8px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:12.5px;${p === '1' ? `background:${T.ink};color:#FFF` : `color:${T.secondary};border:1px solid ${T.border};background:${T.surface}`}">${p}</span>`).join('')}
    </div>
  </div>`;
}

// ── Empresas ───────────────────────────────────────────────────────────
const EMPRESAS = [
  ['Transportes Andinos S.A.S.', '900.412.336-1', 'Transporte terrestre', 412, 412, 'alto', 'Vencida', 'alerta', '2025-08-30'],
  ['Clínica del Norte', '830.077.441-9', 'Salud humana', 268, 241, 'medio', 'Vence en 12 días', 'aviso', '2026-09-28'],
  ['Agroindustria Valle Ltda.', '891.302.118-4', 'Agroindustria', 156, 156, 'muyAlto', 'Vence en 27 días', 'aviso', '2026-10-13'],
  ['Constructora Sierra', '900.664.201-7', 'Construcción', 203, 203, 'medio', 'Vigente', 'ok', '2027-02-11'],
  ['Alimentos del Caribe', '805.119.883-2', 'Manufactura', 98, 74, 'bajo', 'Vigente', 'ok', '2027-04-02'],
  ['Servicios Logísticos Meta', '901.220.470-5', 'Logística', 77, 0, 'sin', 'Sin evaluar', 'neutro', '—'],
  ['Textiles Bogotá S.A.', '860.031.552-8', 'Manufactura', 70, 70, 'bajo', 'Vigente', 'ok', '2027-05-19'],
];

export const empresas = app({
  w: 1440, h: 900, activo: 'orgs', migas: ['Empresas'],
  contenido: `
  ${cabecera({
    rubrica: 'Operación · Cartera de clientes',
    titulo: 'Empresas',
    bajada: 'Cada empresa mantiene su propia vigencia. La batería debe reaplicarse cada dos años, o cada año cuando el riesgo global es alto o muy alto.',
    acciones: `<span class="btn btn-sec">${icono('subir', { size: 14, color: T.secondary })}Importar</span><span class="btn btn-pri">${icono('mas', { size: 14, color: '#FFF' })}Nueva empresa</span>`,
  })}
  ${filtros(['Sector', 'Vigencia', 'Riesgo global'], { busca: 'Buscar por razón social o NIT…' })}
  <table>
    <tr>
      <th class="th">Razón social</th><th class="th">NIT</th><th class="th">Sector</th>
      <th class="th" style="text-align:right">Trabajadores</th><th class="th" style="text-align:right">Evaluados</th>
      <th class="th">Riesgo global</th><th class="th">Vigencia</th><th class="th" style="text-align:right;padding-right:0">Vence</th>
    </tr>
    ${EMPRESAS.map(([n, nit, sec, t, e, r, v, tono, f]) => `<tr>
      <td class="td" style="font-weight:500">${esc(n)}</td>
      <td class="td num" style="color:${T.secondary}">${nit}</td>
      <td class="td" style="color:${T.secondary}">${esc(sec)}</td>
      <td class="td num" style="text-align:right">${t}</td>
      <td class="td num" style="text-align:right;color:${e === t ? T.ink : T.secondary}">${e}<span style="color:${T.muted};font-size:11.5px"> · ${Math.round((e / t) * 100)}%</span></td>
      <td class="td"><div style="display:inline-flex;align-items:center;gap:10px">${pasos(r)}${riesgo(r, { size: 'sm' })}</div></td>
      <td class="td">${estado(v, tono)}</td>
      <td class="td num" style="text-align:right;color:${T.secondary}">${f}</td>
    </tr>`).join('')}
  </table>
  ${paginacion(1, 7, 12)}`,
});

// ── Detalle de empresa ─────────────────────────────────────────────────
const DOMINIOS = [
  ['Liderazgo y relaciones sociales', 'alto', 58.2, 4],
  ['Control sobre el trabajo', 'medio', 29.4, 5],
  ['Demandas del trabajo', 'muyAlto', 71.6, 8],
  ['Recompensa', 'bajo', 12.8, 2],
];

export const empresaDetalle = app({
  w: 1440, h: 1030, activo: "orgs", migas: ['Empresas', 'Transportes Andinos S.A.S.'],
  contenido: `
  ${cabecera({
    rubrica: `Empresa · NIT <span class="num">900.412.336-1</span>`,
    titulo: 'Transportes Andinos S.A.S.',
    bajada: 'Transporte terrestre de carga · 412 trabajadores en 6 áreas · Bogotá, Medellín y Barranquilla.',
    acciones: `<span class="btn btn-sec">${icono('persona', { size: 14, color: T.secondary })}Trabajadores</span><span class="btn btn-sec">${icono('informe', { size: 14, color: T.secondary })}Informes</span><span class="btn btn-pri">${icono('mas', { size: 14, color: '#FFF' })}Nueva evaluación</span>`,
  })}

  <div style="display:flex;gap:9px;border-bottom:1px solid ${T.border};margin-bottom:26px">
    ${['Resumen', 'Trabajadores', 'Evaluaciones', 'Informes', 'Plan de intervención', 'Cumplimiento'].map((t, i) => `
      <span style="padding:0 3px 11px;font-size:13.5px;font-weight:${i === 0 ? 600 : 400};color:${i === 0 ? T.ink : T.secondary};border-bottom:2px solid ${i === 0 ? T.teal : 'transparent'};margin-bottom:-1px">${esc(t)}</span>
      ${i < 5 ? '<span style="width:12px"></span>' : ''}`).join('')}
  </div>

  <div style="display:flex;align-items:center;gap:15px;padding:16px 20px;border-radius:10px;background:#FEE2E2;border:1px solid #FECACA;margin-bottom:26px">
    ${icono('alerta', { size: 19, color: '#B91C1C' })}
    <div style="flex:1">
      <p style="font-size:13.5px;font-weight:600;color:#B91C1C">La vigencia venció el 30 de agosto de 2025</p>
      <p style="font-size:12.5px;color:#9F1239;margin-top:2px">Con riesgo global alto la batería debe reaplicarse cada año. Lleva <span class="num">382</span> días sin evaluación vigente.</p>
    </div>
    <span class="btn" style="background:#B91C1C;color:#FFF">Programar reaplicación</span>
  </div>

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      <p class="rub rub-ink" style="margin-bottom:15px">Riesgo por dominio · Intralaboral Forma A</p>
      ${DOMINIOS.map(([n, r, p, d]) => `
        <div style="padding:15px 0;border-bottom:1px solid ${T.borderMuted}">
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px">
            <p style="font-size:14.5px;font-weight:500;color:${T.ink}">${esc(n)}</p>
            <div style="display:flex;align-items:center;gap:13px;flex-shrink:0">
              <span class="num" style="font-size:16px;font-weight:600;color:${RISK[r].text}">${n1(p)}</span>
              ${riesgo(r, { size: 'sm' })}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:13px;margin-top:9px">
            <div style="flex:1;height:5px;border-radius:3px;background:${T.surfaceMuted};overflow:hidden">
              <div class="barra-anim" style="width:${p}%;height:100%;background:${RISK[r].bar};border-radius:999px"></div>
            </div>
            <span class="num" style="font-size:11px;color:${T.muted};width:96px;text-align:right">${d} dimensiones</span>
          </div>
        </div>`).join('')}
      <p class="prose" style="margin-top:20px">
        <strong style="font-weight:600">Demandas del trabajo</strong> es el dominio crítico: 71,6 puntos,
        muy alto. Dentro de él, <em>demandas de la jornada</em> y <em>demandas cuantitativas</em> explican
        la mayor parte del puntaje, lo que es consistente con una operación de transporte de carga.
      </p>
    </section>

    <section style="width:400px;flex-shrink:0">
      <p class="rub rub-ink" style="margin-bottom:15px">Ficha</p>
      <div class="card" style="padding:19px 21px">
        ${[
          ['Representante legal', 'Jorge Ospina Rivas'],
          ['Contacto SST', 'lina.marin@transandinos.co'],
          ['ARL', 'Positiva Compañía de Seguros'],
          ['Actividad económica', '4923 · Transporte de carga'],
          ['Clase de riesgo', 'IV'],
          ['Áreas registradas', '6'],
          ['Última evaluación', '2024-08-30'],
          ['Psicólogo responsable', 'María Torres Gómez'],
        ].map(([k, v], i) => `<div style="display:flex;justify-content:space-between;gap:18px;padding:9px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <span style="font-size:12.5px;color:${T.muted};flex-shrink:0">${esc(k)}</span>
          <span style="font-size:12.5px;color:${T.ink};text-align:right">${esc(v)}</span>
        </div>`).join('')}
      </div>

      <p class="rub rub-ink" style="margin:26px 0 15px">Cobertura por área</p>
      ${[['Operación de vehículos', 198, 198], ['Mantenimiento', 74, 74], ['Logística y patios', 61, 61], ['Administración', 42, 42], ['Comercial', 22, 22], ['Dirección', 15, 15]].map(([a, t, e]) => `
        <div style="display:flex;align-items:center;gap:13px;padding:8px 0">
          <span style="font-size:12.5px;color:${T.ink};width:150px;flex-shrink:0">${esc(a)}</span>
          <div style="flex:1;height:4px;border-radius:2px;background:${T.surfaceMuted};overflow:hidden">
            <div style="width:${(e / t) * 100}%;height:100%;background:${T.teal}"></div>
          </div>
          <span class="num" style="font-size:11.5px;color:${T.secondary};width:34px;text-align:right">${e}</span>
        </div>`).join('')}
    </section>
  </div>`,
});

// ── Trabajadores ───────────────────────────────────────────────────────
const TRAB = [
  ['Ana Lucía Cárdenas', 'CC 52.418.903', 'Clínica del Norte', 'Profesional', 'Enfermería', 'medio', '2026-08-14', 'Firmado', 'ok'],
  ['Hernán Duque Prieto', 'CC 79.114.226', 'Transportes Andinos', 'Técnico', 'Conducción', 'muyAlto', '2026-09-02', 'Calificado', 'teal'],
  ['Marta Ximena Ruiz', 'CC 43.902.117', 'Constructora Sierra', 'Jefatura', 'Obra civil', 'bajo', '2026-09-09', 'Revisado', 'info'],
  ['José Aníbal Peña', 'CC 16.780.334', 'Agroindustria Valle', 'Auxiliar', 'Cosecha', 'alto', '2026-09-11', 'Calificado', 'teal'],
  ['Diana Carolina Soto', 'CC 1.020.774.556', 'Clínica del Norte', 'Técnico', 'Laboratorio', 'medio', '2026-09-12', 'Pendiente', 'neutro'],
  ['Wilmar Estupiñán', 'CC 94.556.012', 'Transportes Andinos', 'Operativo', 'Mantenimiento', 'alto', '2026-09-14', 'Pendiente', 'neutro'],
  ['Luz Adriana Molina', 'CC 39.447.108', 'Alimentos del Caribe', 'Profesional', 'Calidad', 'sin', '2026-09-15', 'Firmado', 'ok'],
];

export const trabajadores = app({
  w: 1440, h: 900, activo: 'workers', migas: ['Trabajadores'],
  contenido: `
  ${cabecera({
    rubrica: 'Operación · Población evaluable',
    titulo: 'Trabajadores',
    bajada: 'Los datos de identificación son sensibles y quedan registrados en el log de auditoría cada vez que se consultan.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportar</span><span class="btn btn-sec">${icono('subir', { size: 14, color: T.secondary })}Importar CSV</span><span class="btn btn-pri">${icono('mas', { size: 14, color: '#FFF' })}Nuevo trabajador</span>`,
  })}
  ${filtros(['Empresa', 'Nivel del cargo', 'Área', 'Último riesgo'], { busca: 'Buscar por nombre o documento…' })}
  <table>
    <tr>
      <th class="th">Trabajador</th><th class="th">Documento</th><th class="th">Empresa</th>
      <th class="th">Nivel del cargo</th><th class="th">Área</th><th class="th">Último riesgo</th>
      <th class="th">Estado</th><th class="th" style="text-align:right;padding-right:0">Aplicación</th>
    </tr>
    ${TRAB.map(([n, doc, org, niv, area, r, f, est, tono]) => `<tr>
      <td class="td" style="font-weight:500">${esc(n)}</td>
      <td class="td num" style="color:${T.secondary}">${esc(doc)}</td>
      <td class="td" style="color:${T.secondary}">${esc(org)}</td>
      <td class="td" style="color:${T.secondary}">${esc(niv)}</td>
      <td class="td" style="color:${T.secondary}">${esc(area)}</td>
      <td class="td"><div style="display:inline-flex;align-items:center;gap:10px">${pasos(r)}${riesgo(r, { size: 'sm' })}</div></td>
      <td class="td">${estado(est, tono)}</td>
      <td class="td num" style="text-align:right;color:${T.secondary}">${f}</td>
    </tr>`).join('')}
  </table>
  ${paginacion(1, 7, 1284)}`,
});

// ── Detalle de trabajador ──────────────────────────────────────────────
export const trabajadorDetalle = app({
  w: 1440, h: 1020, activo: 'workers', migas: ['Trabajadores', 'Hernán Duque Prieto'],
  contenido: `
  <div style="display:flex;align-items:flex-start;gap:20px;margin-bottom:26px">
    <div style="width:58px;height:58px;border-radius:12px;background:${T.tealLight};color:${T.tealDark};display:flex;align-items:center;justify-content:center;font-family:${FONTS.head};font-size:22px;font-weight:700;flex-shrink:0">HD</div>
    <div style="flex:1;min-width:0">
      <p class="rub">Trabajador · <span class="num">CC 79.114.226</span></p>
      <h1 class="display" style="font-size:40px;margin-top:9px">Hernán Duque Prieto</h1>
      <p style="font-size:13.5px;color:${T.secondary};margin-top:8px">
        Transportes Andinos S.A.S. · Supervisor de rutas · Técnico · vinculado desde <span class="num">2019-03-04</span>
      </p>
    </div>
    <div style="display:flex;gap:10px;flex-shrink:0">
      <span class="btn btn-sec">${icono('libro', { size: 14, color: T.secondary })}Historial</span>
      <span class="btn btn-pri">${icono('informe', { size: 14, color: '#FFF' })}Ver informe</span>
    </div>
  </div>

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      <div style="padding:24px 26px;border:1px solid ${RISK.muyAlto.border};border-radius:12px;background:${RISK.muyAlto.bg}">
        <p class="rub" style="color:${RISK.muyAlto.text}">Riesgo total intralaboral · Forma A</p>
        <div style="display:flex;align-items:flex-end;gap:20px;margin-top:12px">
          <span class="display" style="font-size:64px;color:${RISK.muyAlto.text}">74,8</span>
          <div style="padding-bottom:10px">
            ${riesgo('muyAlto')}
            <p style="font-size:12.5px;color:${RISK.muyAlto.text};margin-top:7px">Percentil <span class="num">96</span> del baremo nacional de técnicos</p>
          </div>
          <div style="margin-left:auto;padding-bottom:8px">${pasos('muyAlto', { w: 24, h: 11, gap: 5 })}</div>
        </div>
      </div>

      <p class="rub rub-ink" style="margin:28px 0 14px">Dimensiones críticas</p>
      <table>
        <tr><th class="th">Dimensión</th><th class="th">Dominio</th><th class="th" style="text-align:right">Puntaje</th><th class="th">Nivel</th><th class="th" style="text-align:right;padding-right:0">Ítems</th></tr>
        ${[
          ['Demandas de la jornada de trabajo', 'Demandas', 91.7, 'muyAlto', 3],
          ['Demandas cuantitativas', 'Demandas', 79.2, 'muyAlto', 6],
          ['Influencia del trabajo sobre el entorno extralaboral', 'Demandas', 68.8, 'alto', 4],
          ['Características del liderazgo', 'Liderazgo', 51.9, 'muyAlto', 13],
          ['Reconocimiento y compensación', 'Recompensa', 45.8, 'alto', 6],
          ['Control y autonomía sobre el trabajo', 'Control', 41.7, 'alto', 3],
        ].map(([d, dom, p, r, n]) => `<tr>
          <td class="td" style="font-weight:500">${esc(d)}</td>
          <td class="td" style="color:${T.muted};font-size:12.5px">${esc(dom)}</td>
          <td class="td num" style="text-align:right;font-weight:600;color:${RISK[r].text}">${n1(p)}</td>
          <td class="td"><div style="display:inline-flex;align-items:center;gap:10px">${pasos(r)}${riesgo(r, { size: 'sm' })}</div></td>
          <td class="td num" style="text-align:right;color:${T.muted}">${n}</td>
        </tr>`).join('')}
      </table>
    </section>

    <section style="width:392px;flex-shrink:0">
      <p class="rub rub-ink" style="margin-bottom:14px">Los cuatro instrumentos</p>
      ${[
        ['Intralaboral Forma A', '123 ítems', 74.8, 'muyAlto', '2026-09-02'],
        ['Extralaboral', '31 ítems', 38.4, 'medio', '2026-09-02'],
        ['Estrés', '31 ítems', 44.1, 'alto', '2026-09-02'],
        ['Ficha sociodemográfica', 'Completa', null, null, '2026-09-02'],
      ].map(([n, sub, p, r, f]) => `
        <div class="card" style="padding:15px 17px;margin-bottom:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div style="min-width:0">
              <p style="font-size:13.5px;font-weight:600;color:${T.ink}">${esc(n)}</p>
              <p class="num" style="font-size:11.5px;color:${T.muted};margin-top:3px">${esc(sub)} · ${f}</p>
            </div>
            ${p !== null
              ? `<div style="display:flex;align-items:center;gap:11px;flex-shrink:0"><span class="num" style="font-size:16px;font-weight:600;color:${RISK[r].text}">${n1(p)}</span>${riesgo(r, { size: 'sm' })}</div>`
              : estado('Completa', 'ok')}
          </div>
        </div>`).join('')}

      <p class="rub rub-ink" style="margin:26px 0 14px">Evolución</p>
      <div class="card" style="padding:18px 20px">
        ${[['2022', 'medio', 34.2], ['2024', 'alto', 58.6], ['2026', 'muyAlto', 74.8]].map(([a, r, p]) => `
          <div style="display:flex;align-items:center;gap:13px;padding:9px 0">
            <span class="num" style="font-size:12.5px;color:${T.muted};width:34px">${a}</span>
            <div style="flex:1;height:7px;border-radius:4px;background:${T.surfaceMuted};overflow:hidden">
              <div class="barra-anim" style="width:${p}%;height:100%;background:${RISK[r].bar};border-radius:999px"></div>
            </div>
            <span class="num" style="font-size:12.5px;font-weight:600;color:${RISK[r].text};width:38px;text-align:right">${n1(p)}</span>
          </div>`).join('')}
        <p style="font-size:12px;line-height:1.55;color:${T.secondary};margin-top:12px;padding-top:12px;border-top:1px solid ${T.borderMuted}">
          Sube <span class="num">40,6</span> puntos en cuatro años y cambia dos niveles. Es un caso de seguimiento individual, no solo colectivo.
        </p>
      </div>
    </section>
  </div>`,
});
