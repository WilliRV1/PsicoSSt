import { T, RISK, RISK_ORDER, CAT, FONTS, artboard, icono, marca, isotipo, esc, n1 } from '../lib.mjs';

// A4 a 96 px por pulgada, que es la resolución con la que exporta el lienzo.
const A4_W = 794, A4_H = 1123;
const MARGEN = 84;
const ANCHO = A4_W - MARGEN * 2; // 626

// Tinta de documento: negro real sobre papel blanco. El neutro frío de
// pantalla se ve sucio impreso, y el gris de texto secundario tiene que subir
// de contraste porque el papel no emite luz.
const P = {
  papel: '#FFFFFF',
  tinta: '#0A0D11',
  tinta2: '#3D4751',
  tinta3: '#6B7681',
  filete: '#DDE2E6',
  fileteFuerte: '#0A0D11',
  panel: '#F5F7F8',
};

/**
 * Chasis de página A4.
 *
 * Cornisa fina arriba con la marca y el folio, pie con la paginación y el
 * sello de verificación. Nada de fondos de color a sangre: un tinte que cubre
 * la página se bebe la tinta de la impresora y encarece cada copia.
 */
const CSS_PAGINA = `
      .p-rub { font-size: 9.5px; font-weight: 600; letter-spacing: 0.07em;
               text-transform: uppercase; color: ${P.tinta3}; }
      .p-prosa { font-size: 16px; line-height: 1.6; color: ${P.tinta2};
                 letter-spacing: -0.004em; text-wrap: pretty; }
      .p-prosa strong { color: ${P.tinta}; font-weight: 600; }
      .p-td { font-size: 15px; color: ${P.tinta}; padding: 8px 0;
              border-bottom: 1px solid ${P.filete}; vertical-align: middle; }
      .p-th { font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
              text-transform: uppercase; color: ${P.tinta3}; text-align: left;
              padding: 0 0 8px; border-bottom: 1.2px solid ${P.fileteFuerte}; }
`;

function hoja({ cornisa, cuerpo, pagina, de = 14, pie = 'Informe individual de riesgo psicosocial' }) {
  return artboard({
    w: A4_W, h: A4_H,
    extraCss: CSS_PAGINA,
    cuerpo: `<div style="width:${A4_W}px;height:${A4_H}px;background:${P.papel};position:relative;overflow:hidden">
      <div style="position:absolute;left:${MARGEN}px;top:44px;width:${ANCHO}px;display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid ${P.filete}">
        ${cornisa}
      </div>
      <div style="position:absolute;left:${MARGEN}px;top:96px;width:${ANCHO}px">${cuerpo}</div>
      <div style="position:absolute;left:${MARGEN}px;bottom:44px;width:${ANCHO}px;display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid ${P.filete}">
        <span style="font-size:9.5px;color:${P.tinta3}">${esc(pie)}</span>
        <span class="num" style="font-size:9.5px;color:${P.tinta3}">${pagina} / ${de}</span>
      </div>
    </div>`,
  });
}

const cornisaEstandar = (folio) => `
  <div style="display:flex;align-items:center;gap:9px">
    ${isotipo(15, 'pdfmk')}
    <span style="font-family:${FONTS.marca};font-weight:700;font-size:13px;letter-spacing:-0.01em;color:${P.tinta}">Psico<span style="color:${T.tealDark}">SST</span></span>
  </div>
  <span class="num" style="font-size:9.5px;color:${P.tinta3};letter-spacing:0.02em">Folio ${esc(folio)}</span>`;

/** Código QR decorativo, determinista: marca de verificación, no escaneable. */
function qr(px = 74) {
  const n = 21, celdas = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const esq = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
    const borde = esq && (x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5));
    const on = esq ? borde : ((x * 7 + y * 13 + ((x * y) % 5)) % 3 === 0);
    if (on) celdas.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${P.tinta}"/>`);
  }
  return `<svg viewBox="0 0 ${n} ${n}" width="${px}" height="${px}" shape-rendering="crispEdges">${celdas.join('')}</svg>`;
}

/** Escala de baremo: cinco bandas iguales con el marcador dentro de la suya. */
function baremo(level, valor, { w = 200, h = 26 } = {}) {
  const idx = RISK_ORDER.indexOf(level);
  const pos = ((idx + 0.55) / 5) * 100;
  return `<div style="width:${w}px">
    <div style="display:flex;height:${h}px;border-radius:${h / 2}px;overflow:hidden;position:relative;background:${P.panel}">
      ${RISK_ORDER.map((k, i) => `<div style="flex:1;background:${i === idx ? RISK[k].bar : RISK[k].bg};${i ? `border-left:1.5px solid ${P.papel}` : ''}"></div>`).join('')}
      <div style="position:absolute;left:${pos}%;top:-3px;width:3px;height:${h + 6}px;background:${P.tinta};border-radius:2px;transform:translateX(-50%)"></div>
    </div>
    <div style="display:flex;margin-top:5px">
      ${RISK_ORDER.map((k, i) => `<span style="flex:1;font-size:8px;color:${i === idx ? RISK[k].text : P.tinta3};font-weight:${i === idx ? 600 : 400};text-align:center">${esc(RISK[k].label)}</span>`).join('')}
    </div>
  </div>`;
}

// ── 1 · Portada del informe individual ─────────────────────────────────
export const pdfPortada = artboard({
  w: A4_W, h: A4_H, extraCss: CSS_PAGINA,
  cuerpo: `<div style="width:${A4_W}px;height:${A4_H}px;background:${P.papel};padding:${MARGEN}px;display:flex;flex-direction:column">
    ${marca({ size: 25 })}

    <div style="margin-top:96px">
      <h1 class="display" style="font-size:46px;color:${P.tinta};max-width:560px">
        Evaluación de factores de riesgo psicosocial
      </h1>
      <p style="font-size:14px;color:${P.tinta3};margin-top:14px">Informe individual</p>
      <p class="p-prosa" style="margin-top:16px;max-width:480px">
        Batería de instrumentos del Ministerio de Trabajo de Colombia ·
        Resolución 2764 de 2022.
      </p>
    </div>

    <div style="margin-top:44px;border-top:1.2px solid ${P.fileteFuerte}">
      ${[
        ['Trabajador evaluado', 'Hernán Duque Prieto', 'CC 79.114.226'],
        ['Empresa', 'Transportes Andinos S.A.S.', 'NIT 900.412.336-1'],
        ['Cargo y área', 'Supervisor de rutas · Conducción', 'Nivel técnico'],
        ['Instrumentos', 'Intralaboral Forma A, Extralaboral y Estrés', '185 ítems'],
        ['Fecha de aplicación', '2 de septiembre de 2026', ''],
      ].map(([k, v, n], i) => `
        <div style="display:flex;gap:22px;padding:12px 0;${i ? `border-top:1px solid ${P.filete}` : ''}">
          <span class="p-rub" style="width:150px;flex-shrink:0;padding-top:4px">${esc(k)}</span>
          <div style="flex:1;min-width:0">
            <p style="font-size:15.5px;font-weight:500;color:${P.tinta};letter-spacing:-0.012em">${esc(v)}</p>
            ${n ? `<p class="num" style="font-size:12.5px;color:${P.tinta3};margin-top:2px">${esc(n)}</p>` : ''}
          </div>
        </div>`).join('')}
    </div>

    <div style="margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:28px">
      <div style="flex:1">
        <p class="p-rub">Profesional responsable</p>
        <svg width="164" height="48" viewBox="0 0 240 76" fill="none" style="margin-top:6px;display:block">
          <path d="M12 56c18-34 26 14 42-16s22 20 36-10 26 26 42-4 24 18 40-8 22 14 32 2" stroke="${P.tinta}" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M104 64c26 2 54 0 78-4" stroke="${P.tinta}" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <div style="border-top:1px solid ${P.tinta};width:206px;padding-top:7px">
          <p style="font-size:14.5px;font-weight:600;color:${P.tinta}">María Torres Gómez</p>
          <p style="font-size:12px;color:${P.tinta2};margin-top:2px">Psicóloga especialista en SST</p>
          <p class="num" style="font-size:12px;color:${P.tinta3};margin-top:1px">T.P. 118432 · Lic. SST 2019-4471</p>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        ${qr(80)}
        <p class="num" style="font-size:9.5px;color:${P.tinta3};margin-top:6px">IN-2026-0918</p>
        <p style="font-size:9.5px;color:${P.tinta3};margin-top:1px">Verificable en psicosst.co/v</p>
      </div>
    </div>

    <p style="font-size:10px;line-height:1.55;color:${P.tinta3};margin-top:26px;padding-top:12px;border-top:1px solid ${P.filete}">
      Documento reservado. Contiene datos sensibles de salud sometidos a la custodia del profesional
      que lo suscribe (Ley 1090 de 2006) y al régimen de protección de datos personales
      (Ley 1581 de 2012). Su reproducción o entrega a terceros sin autorización del titular está prohibida.
    </p>
  </div>`,
});

// ── 2 · Resultado y dimensiones ────────────────────────────────────────
const DIMS = [
  ['Demandas de la jornada de trabajo', 91.7, 'muyAlto'],
  ['Demandas cuantitativas', 79.2, 'muyAlto'],
  ['Influencia del trabajo sobre el entorno extralaboral', 68.8, 'alto'],
  ['Características del liderazgo', 51.9, 'muyAlto'],
  ['Reconocimiento y compensación', 45.8, 'alto'],
  ['Control y autonomía sobre el trabajo', 41.7, 'alto'],
  ['Demandas de carga mental', 35.0, 'medio'],
  ['Claridad de rol', 14.3, 'medio'],
  ['Relaciones sociales en el trabajo', 12.5, 'bajo'],
  ['Capacitación', 8.3, 'bajo'],
];

export const pdfIndividual = hoja({
  pagina: 4,
  cornisa: cornisaEstandar('IN-2026-0918'),
  cuerpo: `
    <p class="p-rub">2 · Resultado global</p>

    <div style="display:flex;gap:28px;margin-top:16px;align-items:flex-start">
      <div style="width:196px;flex-shrink:0;padding:20px 22px;border-radius:16px;background:${RISK.muyAlto.bg}">
        <p class="p-rub" style="color:${RISK.muyAlto.text}">Intralaboral Forma A</p>
        <p class="cifra" style="font-size:56px;color:${RISK.muyAlto.text};margin-top:10px">74,8</p>
        <p style="font-size:15px;font-weight:600;color:${RISK.muyAlto.text};margin-top:8px">Riesgo muy alto</p>
        <p style="font-size:12px;color:${RISK.muyAlto.text};margin-top:3px;opacity:0.82">Percentil 96 · baremo técnicos</p>
      </div>
      <div style="flex:1;min-width:0;padding-top:2px">
        <p class="p-prosa">
          El puntaje total transformado sitúa a la persona evaluada en
          <strong>riesgo muy alto</strong>. En este nivel el manual de la batería indica
          intervención inmediata dentro del sistema de vigilancia epidemiológica y
          seguimiento individual documentado, conforme a la Resolución 2764 de 2022.
        </p>
        <div style="margin-top:18px">${baremo('muyAlto', 74.8, { w: 300 })}</div>
        <div style="display:flex;gap:26px;margin-top:20px;padding-top:14px;border-top:1px solid ${P.filete}">
          ${[['Extralaboral', '38,4', 'medio'], ['Estrés', '44,1', 'alto'], ['Ítems válidos', '185 / 185', null]].map(([k, v, r]) => `
            <div><p class="p-rub">${esc(k)}</p>
            <p class="cifra" style="font-size:22px;margin-top:6px;color:${r ? RISK[r].text : P.tinta}">${esc(v)}</p>
            ${r ? `<p style="font-size:11px;color:${RISK[r].text};margin-top:3px">${esc(RISK[r].label)}</p>` : `<p style="font-size:11px;color:${P.tinta3};margin-top:3px">Sin faltantes</p>`}</div>`).join('')}
        </div>
      </div>
    </div>

    <p class="p-rub" style="margin-top:26px">3 · Dimensiones ordenadas por criticidad</p>
    <table style="margin-top:12px">
      <tr>
        <th class="p-th" style="padding-right:20px">Dimensión</th>
        <th class="p-th" style="text-align:right;width:62px;padding-right:18px">Puntaje</th>
        <th class="p-th" style="width:146px;padding-right:20px">Distribución</th>
        <th class="p-th" style="width:84px">Nivel</th>
      </tr>
      ${DIMS.map(([d, p, r]) => `<tr>
        <td class="p-td" style="padding-right:20px">${esc(d)}</td>
        <td class="p-td num" style="text-align:right;padding-right:18px;font-weight:600;color:${RISK[r].text}">${n1(p)}</td>
        <td class="p-td" style="padding-right:20px">
          <div style="height:8px;border-radius:4px;background:${P.panel};overflow:hidden">
            <div style="width:${p}%;height:100%;background:${RISK[r].bar};border-radius:4px"></div>
          </div>
        </td>
        <td class="p-td" style="font-size:13px;font-weight:500;color:${RISK[r].text}">${esc(RISK[r].label)}</td>
      </tr>`).join('')}
    </table>

    <p class="p-rub" style="margin-top:24px">4 · Interpretación</p>
    <p class="p-prosa" style="font-size:15.5px;margin-top:9px">
      El perfil está dominado por <strong>Demandas del trabajo</strong>. Las demandas de la jornada
      alcanzan 91,7 puntos: se reportan jornadas que se extienden más allá de lo pactado, con
      descansos insuficientes entre turnos.
    </p>`,
});

// ── 3 · Diagnóstico colectivo ──────────────────────────────────────────
const AREAS = [
  ['Operación de vehículos', 198, [8, 24, 41, 78, 47]],
  ['Mantenimiento', 74, [4, 14, 22, 21, 13]],
  ['Logística y patios', 61, [6, 17, 20, 12, 6]],
  ['Administración', 42, [11, 16, 10, 4, 1]],
  ['Comercial', 22, [4, 8, 7, 2, 1]],
  ['Dirección', 15, [5, 6, 3, 1, 0]],
];

function apiladaPdf(dist, total, { alto = 12 } = {}) {
  return `<div style="display:flex;height:${alto}px;border-radius:${alto / 2}px;overflow:hidden;background:${P.panel}">
    ${dist.map((v, i) => v > 0 ? `<div style="width:${((v / total) * 100).toFixed(2)}%;background:${RISK[RISK_ORDER[i]].bar};${i ? `border-left:1.5px solid ${P.papel}` : ''}"></div>` : '').join('')}
  </div>`;
}

export const pdfColectivo = hoja({
  pagina: 6, de: 38, pie: 'Diagnóstico organizacional de riesgo psicosocial',
  cornisa: cornisaEstandar('CO-2026-0043'),
  cuerpo: `
    <p class="p-rub">3 · Distribución de la población</p>
    <div style="display:flex;align-items:flex-end;gap:22px;margin-top:14px">
      <p class="cifra" style="font-size:60px;color:${P.tinta}">412</p>
      <div style="padding-bottom:9px">
        <p style="font-size:16px;font-weight:500;color:${P.tinta}">trabajadores evaluados</p>
        <p style="font-size:13px;color:${P.tinta3};margin-top:2px">cobertura del 100% de la población</p>
      </div>
      <div style="margin-left:auto;text-align:right;padding-bottom:9px">
        <p class="cifra" style="font-size:36px;color:${RISK.alto.text}">41,0&thinsp;%</p>
        <p style="font-size:12px;color:${P.tinta2};margin-top:2px">en riesgo alto o muy alto</p>
      </div>
    </div>

    <div style="margin-top:18px">
      ${apiladaPdf([38, 79, 126, 118, 51], 412, { alto: 26 })}
      <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:11px">
        ${RISK_ORDER.map((k, i) => `<div style="display:flex;align-items:center;gap:6px">
          <span style="width:9px;height:9px;border-radius:3px;background:${RISK[k].bar}"></span>
          <span style="font-size:11.5px;color:${P.tinta2}">${esc(RISK[k].label)}</span>
          <span class="num" style="font-size:11.5px;color:${P.tinta3}">${[38, 79, 126, 118, 51][i]}</span>
        </div>`).join('')}
      </div>
    </div>

    <p class="p-rub" style="margin-top:32px">4 · Riesgo por área</p>
    <table style="margin-top:12px">
      <tr>
        <th class="p-th">Área</th>
        <th class="p-th" style="width:210px">Distribución</th>
        <th class="p-th" style="text-align:right;width:56px">Trab.</th>
        <th class="p-th" style="text-align:right;width:92px;padding-right:0">Alto + muy alto</th>
      </tr>
      ${AREAS.map(([a, t, dist]) => {
        const pct = ((dist[3] + dist[4]) / t) * 100;
        return `<tr>
          <td class="p-td">${esc(a)}</td>
          <td class="p-td">${apiladaPdf(dist, t, { alto: 11 })}</td>
          <td class="p-td num" style="text-align:right;color:${P.tinta2}">${t}</td>
          <td class="p-td num" style="text-align:right;font-weight:600;color:${pct > 40 ? RISK.muyAlto.text : pct > 25 ? RISK.alto.text : P.tinta2}">${n1(pct)}&thinsp;%</td>
        </tr>`;
      }).join('')}
    </table>

    <div style="margin-top:28px;padding:20px 22px;border-radius:16px;background:${P.panel}">
      <p class="p-rub">Hallazgo principal</p>
      <p class="p-prosa" style="margin-top:9px">
        El patrón es homogéneo y apunta a una causa organizacional, no individual:
        <strong>Demandas del trabajo</strong> es el dominio crítico en cinco de las seis áreas.
        La operación de vehículos concentra 125 de los 169 casos en riesgo alto o muy alto,
        con una prevalencia del 63,1&thinsp;% frente al 11,9&thinsp;% de administración.
      </p>
    </div>`,
});

// ── 4 · Perfil sociodemográfico ────────────────────────────────────────
function tablaFrec(titulo, filas, { pico = null } = {}) {
  const max = pico ?? Math.max(...filas.map((f) => f[1]));
  return `<div style="margin-bottom:24px">
    <p style="font-size:16px;font-weight:600;letter-spacing:-0.015em;color:${P.tinta}">${esc(titulo)}</p>
    <table style="margin-top:9px">
      ${filas.map(([k, pct, n], i) => `<tr>
        <td class="p-td" style="font-size:14px;${i === 0 ? `border-top:1.2px solid ${P.fileteFuerte}` : ''}">${esc(k)}</td>
        <td class="p-td num" style="text-align:right;width:44px;color:${P.tinta3};font-size:13px;${i === 0 ? `border-top:1.2px solid ${P.fileteFuerte}` : ''}">${n}</td>
        <td class="p-td num" style="text-align:right;width:52px;font-weight:600;font-size:14px;${i === 0 ? `border-top:1.2px solid ${P.fileteFuerte}` : ''}">${pct}&thinsp;%</td>
        <td class="p-td" style="width:118px;padding-left:14px;${i === 0 ? `border-top:1.2px solid ${P.fileteFuerte}` : ''}">
          <div style="height:7px;border-radius:4px;background:${P.panel};overflow:hidden">
            <div style="width:${(pct / max) * 100}%;height:100%;background:${T.teal};border-radius:4px"></div>
          </div>
        </td>
      </tr>`).join('')}
    </table>
  </div>`;
}

export const pdfSociodemografico = hoja({
  pagina: 3, de: 22, pie: 'Perfil sociodemográfico y ocupacional de la población evaluada',
  cornisa: cornisaEstandar('SD-2026-0039'),
  cuerpo: `
    <p class="p-rub">2 · Composición de la población</p>
    <div style="display:flex;gap:0;margin-top:14px;border-top:1.2px solid ${P.fileteFuerte};border-bottom:1px solid ${P.filete};padding:16px 0">
      ${[['Fichas completas', '241', ''], ['Edad promedio', '37,4', 'años'], ['Antigüedad', '5,8', 'años'], ['Mujeres', '71', '%']].map(([k, v, u], i) => `
        <div style="flex:1;padding-left:${i ? '20px' : '0'};${i ? `border-left:1px solid ${P.filete}` : ''}">
          <p class="p-rub">${esc(k)}</p>
          <div style="display:flex;align-items:baseline;gap:5px;margin-top:7px">
            <span class="cifra" style="font-size:28px;color:${P.tinta}">${v}</span>
            ${u ? `<span style="font-size:12px;color:${P.tinta3}">${esc(u)}</span>` : ''}
          </div>
        </div>`).join('')}
    </div>

    <div style="display:flex;gap:34px;margin-top:26px">
      <div style="flex:1;min-width:0">
        ${tablaFrec('Grupo de edad', [['18 a 27', 14, 34], ['28 a 37', 38, 92], ['38 a 47', 29, 70], ['48 a 57', 15, 36], ['58 o más', 4, 9]])}
        ${tablaFrec('Antigüedad en la empresa', [['Menos de 1 año', 9, 22], ['1 a 3 años', 27, 65], ['4 a 7 años', 31, 75], ['8 a 12 años', 22, 53], ['Más de 12 años', 11, 26]])}
      </div>
      <div style="flex:1;min-width:0">
        ${tablaFrec('Nivel educativo', [['Primaria', 2, 5], ['Bachillerato', 11, 26], ['Técnico', 24, 58], ['Tecnológico', 18, 44], ['Profesional', 33, 79], ['Posgrado', 12, 29]])}
        ${tablaFrec('Personas a cargo', [['Ninguna', 36, 87], ['Una', 24, 58], ['Dos', 23, 55], ['Tres', 12, 29], ['Cuatro o más', 5, 12]])}
      </div>
    </div>

    <div style="margin-top:6px;padding:18px 20px;border-radius:16px;background:${P.panel}">
      <p class="p-rub">Lectura del perfil</p>
      <p class="p-prosa" style="margin-top:9px">
        La combinación de turnos asistenciales, 64&thinsp;% de la población con personas a cargo y
        49&thinsp;% en vivienda arrendada concentra la tensión en la dimensión <strong>balance entre la
        vida laboral y familiar</strong>, que en el cuestionario extralaboral de esta empresa es la de
        puntaje más alto.
      </p>
    </div>`,
});

// ── 5 · Plan de intervención ───────────────────────────────────────────
export const pdfIntervencion = hoja({
  pagina: 9, de: 46, pie: 'Plan de intervención y sistema de vigilancia epidemiológica',
  cornisa: cornisaEstandar('SVE-2026-0011'),
  cuerpo: `
    <p class="p-rub">5 · Medidas de intervención priorizadas</p>
    <p class="p-prosa" style="margin-top:11px">
      Cada medida indica la dimensión que la origina, el responsable designado por la empresa,
      el plazo comprometido y la evidencia con la que se verificará su cumplimiento. Una medida
      sin responsable y sin fecha no es verificable ante una inspección.
    </p>

    <div style="margin-top:22px">
      ${[
        ['01', 'Rediseño de la jornada de conducción', 'Demandas de la jornada · 88,4 · muy alto',
         'Revisar la distribución de tareas, evaluar la suficiencia de personal y ajustar las jornadas laborales garantizando periodos de descanso entre turnos.',
         'Gerencia de operaciones', '31 de diciembre de 2026', 'Programación de turnos y registro de horas extra', 'muyAlto'],
        ['02', 'Autonomía en la programación de rutas', 'Control y autonomía · 52,3 · muy alto',
         'Fomentar la participación en la toma de decisiones, promover la autonomía responsable y flexibilizar horarios donde la operación lo permita.',
         'Jefatura de SST', '31 de marzo de 2027', 'Acta del comité y encuesta de percepción', 'muyAlto'],
        ['03', 'Formación de líderes de operación', 'Características del liderazgo · 58,9 · alto',
         'Fortalecer habilidades blandas de los líderes, con énfasis en comunicación asertiva y retroalimentación constructiva.',
         'Gestión humana', '30 de junio de 2027', 'Listados de asistencia y evaluación posterior', 'alto'],
      ].map(([n, t, dim, d, resp, plazo, ev, nivel], i) => `
        <div style="padding:20px 0;${i ? `border-top:1px solid ${P.filete}` : `border-top:1.2px solid ${P.fileteFuerte}`}">
          <div style="display:flex;gap:18px">
            <span class="num" style="font-size:13px;color:${P.tinta3};width:24px;flex-shrink:0;padding-top:4px">${n}</span>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
                <p style="font-size:18px;font-weight:600;letter-spacing:-0.02em;color:${P.tinta}">${esc(t)}</p>
                <span style="flex-shrink:0;font-size:11px;font-weight:600;padding:4px 10px;border-radius:8px;background:${RISK[nivel].bg};color:${RISK[nivel].text}">${esc(RISK[nivel].label)}</span>
              </div>
              <p class="num" style="font-size:12px;color:${P.tinta3};margin-top:4px">${esc(dim)}</p>
              <p class="p-prosa" style="font-size:15px;margin-top:9px">${esc(d)}</p>
              <div style="display:flex;gap:22px;margin-top:13px;padding-top:11px;border-top:1px solid ${P.filete}">
                ${[['Responsable', resp], ['Plazo', plazo], ['Evidencia', ev]].map(([k, v]) => `
                  <div style="flex:1"><p class="p-rub">${esc(k)}</p>
                  <p style="font-size:13px;color:${P.tinta};margin-top:4px;line-height:1.4">${esc(v)}</p></div>`).join('')}
              </div>
            </div>
          </div>
        </div>`).join('')}
    </div>

    <div style="margin-top:20px;padding:18px 20px;border-radius:16px;background:${RISK.muyAlto.bg}">
      <p class="p-rub" style="color:${RISK.muyAlto.text}">Seguimiento obligatorio</p>
      <p class="p-prosa" style="font-size:15px;margin-top:8px;color:${RISK.muyAlto.text}">
        Los 61 trabajadores en riesgo alto o muy alto ingresan al sistema de vigilancia epidemiológica
        con valoración clínica individual y reevaluación a los 3, 6 y 12 meses. La empresa debe conservar
        la evidencia de cada seguimiento por el término de la historia clínica ocupacional.
      </p>
    </div>`,
});
