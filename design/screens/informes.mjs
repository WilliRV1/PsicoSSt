import { T, RISK, RISK_ORDER, FONTS, app, artboard, icono, riesgo, pasos, estado, marca, isotipo, esc, n1 } from '../lib.mjs';
import { cabecera, filtros, paginacion } from './operacion.mjs';

// ── Lista de informes ──────────────────────────────────────────────────
export const informes = app({
  w: 1440, h: 900, activo: 'reports', migas: ['Informes'],
  contenido: `
  ${cabecera({
    rubrica: 'Análisis · Entregables',
    titulo: 'Informes',
    bajada: 'Un informe sin firma no tiene valor probatorio ante una inspección. La firma digital fija el contenido y genera el folio verificable.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportación masiva</span><span class="btn btn-pri">${icono('firma', { size: 14, color: '#FFF' })}Firmar 9 pendientes</span>`,
  })}
  ${filtros(['Empresa', 'Tipo de informe', 'Estado de firma'], { busca: 'Buscar por folio, trabajador o empresa…' })}
  <table>
    <tr>
      <th class="th">Folio</th><th class="th">Tipo</th><th class="th">Sujeto</th><th class="th">Empresa</th>
      <th class="th">Riesgo</th><th class="th">Firma</th><th class="th" style="text-align:right">Páginas</th>
      <th class="th" style="text-align:right;padding-right:0">Emitido</th>
    </tr>
    ${[
      ['IN-2026-0918', 'Individual', 'Hernán Duque Prieto', 'Transportes Andinos', 'muyAlto', 'Sin firmar', 'neutro', 14, '2026-09-16'],
      ['IN-2026-0917', 'Individual', 'Ana Lucía Cárdenas', 'Clínica del Norte', 'medio', 'Firmado', 'ok', 14, '2026-09-15'],
      ['CO-2026-0042', 'Colectivo', '241 trabajadores', 'Clínica del Norte', 'medio', 'Firmado', 'ok', 38, '2026-09-15'],
      ['SD-2026-0039', 'Sociodemográfico', '241 trabajadores', 'Clínica del Norte', null, 'Firmado', 'ok', 22, '2026-09-15'],
      ['IN-2026-0916', 'Individual', 'José Aníbal Peña', 'Agroindustria Valle', 'alto', 'Sin firmar', 'neutro', 14, '2026-09-15'],
      ['SVE-2026-0011', 'Programa SVE', 'Toda la población', 'Constructora Sierra', null, 'Firmado', 'ok', 46, '2026-09-11'],
      ['IN-2026-0915', 'Individual', 'Marta Ximena Ruiz', 'Constructora Sierra', 'bajo', 'Firmado', 'ok', 14, '2026-09-10'],
    ].map(([f, t, s, o, r, fi, tono, pg, fe]) => `<tr>
      <td class="td num" style="color:${T.tealDark};font-weight:500">${f}</td>
      <td class="td">${esc(t)}</td>
      <td class="td" style="font-weight:500">${esc(s)}</td>
      <td class="td" style="color:${T.secondary}">${esc(o)}</td>
      <td class="td">${r ? `<div style="display:inline-flex;align-items:center;gap:10px">${pasos(r)}${riesgo(r, { size: 'sm' })}</div>` : `<span style="color:${T.muted};font-size:12.5px">No aplica</span>`}</td>
      <td class="td">${estado(fi, tono)}</td>
      <td class="td num" style="text-align:right;color:${T.muted}">${pg}</td>
      <td class="td num" style="text-align:right;color:${T.secondary}">${fe}</td>
    </tr>`).join('')}
  </table>
  ${paginacion(1, 7, 968)}`,
});

// ── Informe individual ─────────────────────────────────────────────────
const DIMS_INFORME = [
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

export const informeIndividual = app({
  w: 1440, h: 2200, activo: 'reports', migas: ['Informes', 'IN-2026-0918'],
  contenido: `
  <div style="display:flex;gap:36px">
    <!-- El documento, compuesto como el PDF que va a salir -->
    <article style="flex:1;min-width:0;background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:44px 52px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:22px;border-bottom:2px solid ${T.ink}">
        <div>
          <h1 class="display" style="font-size:34px">Hernán Duque Prieto</h1>
          <p style="font-size:13px;color:${T.muted};margin-top:10px">Informe individual de riesgo psicosocial</p>
          <p style="font-size:13px;color:${T.secondary};margin-top:6px">
            <span class="num">CC 79.114.226</span> · Transportes Andinos S.A.S. · Supervisor de rutas · Técnico
          </p>
        </div>
        <div style="text-align:right">
          ${marca({ size: 24, sub: '' })}
          <p class="num" style="font-size:11px;color:${T.muted};margin-top:10px">Folio IN-2026-0918</p>
          <p class="num" style="font-size:11px;color:${T.muted}">2026-09-16</p>
        </div>
      </div>

      <section style="margin-top:28px">
        <p class="rub rub-ink">1 · Resultado global</p>
        <div style="display:flex;gap:26px;margin-top:16px">
          <div style="width:216px;flex-shrink:0;padding:20px;border-radius:10px;background:${RISK.muyAlto.bg};border:1px solid ${RISK.muyAlto.border}">
            <p class="rub" style="color:${RISK.muyAlto.text}">Intralaboral Forma A</p>
            <p class="display" style="font-size:52px;color:${RISK.muyAlto.text};margin-top:10px">${n1(74.8)}</p>
            <div style="margin-top:12px">${riesgo('muyAlto')}</div>
            <div style="margin-top:12px">${pasos('muyAlto', { w: 30, h: 9, gap: 4 })}</div>
          </div>
          <div style="flex:1;min-width:0">
            <p class="prose">
              El puntaje total transformado sitúa a la persona evaluada en <strong style="font-weight:600">riesgo
              muy alto</strong>, percentil 96 del baremo nacional para técnicos. En este nivel el manual de la batería
              indica intervención inmediata dentro del sistema de vigilancia epidemiológica y
              seguimiento individual documentado, conforme a la Resolución 2764 de 2022.
            </p>
            <div style="display:flex;gap:26px;margin-top:20px;padding-top:16px;border-top:1px solid ${T.borderMuted}">
              ${[['Extralaboral', 38.4, 'medio'], ['Estrés', 44.1, 'alto'], ['Ítems respondidos', null, null]].map(([k, v, r]) => `
                <div><p class="rub">${esc(k)}</p>
                <div style="display:flex;align-items:baseline;gap:9px;margin-top:7px">
                  <span class="num" style="font-size:21px;font-weight:600;color:${r ? RISK[r].text : T.ink}">${v === null ? '123/123' : n1(v)}</span>
                  ${r ? riesgo(r, { size: 'sm' }) : ''}
                </div></div>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <section style="margin-top:34px">
        <p class="rub rub-ink">2 · Dimensiones ordenadas por criticidad</p>
        <table style="margin-top:14px">
          <tr><th class="th">Dimensión</th><th class="th" style="text-align:right;width:74px">Puntaje</th><th class="th" style="width:190px">Distribución</th><th class="th" style="width:118px;padding-right:0">Nivel</th></tr>
          ${DIMS_INFORME.map(([d, p, r]) => `<tr>
            <td class="td" style="font-size:13px">${esc(d)}</td>
            <td class="td num" style="text-align:right;font-weight:600;color:${RISK[r].text}">${n1(p)}</td>
            <td class="td">
              <div style="height:6px;border-radius:3px;background:${T.surfaceMuted};overflow:hidden"><div class="barra-anim" style="width:${p}%;height:100%;background:${RISK[r].bar};border-radius:999px"></div></div>
            </td>
            <td class="td"><div style="display:flex;align-items:center;gap:9px">${pasos(r, { w: 9, h: 6, gap: 2 })}${riesgo(r, { size: 'sm' })}</div></td>
          </tr>`).join('')}
        </table>
      </section>

      <section style="margin-top:34px">
        <p class="rub rub-ink">3 · Interpretación</p>
        <p class="prose" style="margin-top:14px">
          El perfil está dominado por el dominio <em>Demandas del trabajo</em>. Las
          <strong style="font-weight:600">demandas de la jornada</strong> alcanzan 91,7 puntos: la persona
          reporta jornadas que se extienden más allá de lo pactado, con descansos insuficientes entre
          turnos. Esta condición se combina con demandas cuantitativas muy altas, de modo que el volumen
          de trabajo no se resuelve dentro del tiempo disponible sino alargándolo.
        </p>
        <p class="prose" style="margin-top:13px">
          El riesgo se amplifica porque el <strong style="font-weight:600">control sobre el trabajo es
          bajo</strong>: la persona no decide el orden ni el ritmo de sus tareas. La literatura sobre
          demanda-control asocia esta combinación —demanda alta con control bajo— al mayor riesgo de
          desgaste y de enfermedad cardiovascular en conductores de carga.
        </p>
        <p class="prose" style="margin-top:13px">
          El dominio <em>Recompensa</em> se mantiene en riesgo bajo, lo que constituye un factor
          protector: existe sentido de pertenencia aunque la compensación económica se perciba
          insuficiente.
        </p>
      </section>

      <section style="margin-top:34px">
        <p class="rub rub-ink">4 · Recomendaciones</p>
        <div style="margin-top:14px">
          ${[
            ['Demandas de la jornada', 'Revisar la distribución de tareas, evaluar la suficiencia de personal y ajustar las jornadas laborales garantizando periodos de descanso.'],
            ['Control y autonomía', 'Fomentar la participación en la toma de decisiones, promover la autonomía responsable y flexibilizar horarios donde la operación lo permita.'],
            ['Seguimiento individual', 'Incorporar a la persona al sistema de vigilancia epidemiológica con valoración clínica y seguimiento a tres meses.'],
          ].map(([t, d], i) => `<div style="display:flex;gap:18px;padding:14px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <span class="num" style="font-size:11.5px;color:${T.muted};padding-top:3px;width:20px;flex-shrink:0">${String(i + 1).padStart(2, '0')}</span>
            <div><p style="font-size:13.5px;font-weight:600;color:${T.ink}">${esc(t)}</p>
            <p class="prose" style="font-size:14.5px;margin-top:5px">${esc(d)}</p></div>
          </div>`).join('')}
        </div>
      </section>

      <div style="margin-top:36px;padding-top:22px;border-top:1px solid ${T.border};display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          <p class="rub">Profesional responsable</p>
          <svg width="150" height="44" viewBox="0 0 240 76" fill="none" style="margin-top:8px;display:block">
            <path d="M12 56c18-34 26 14 42-16s22 20 36-10 26 26 42-4 24 18 40-8 22 14 32 2" stroke="${T.ink}" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M104 64c26 2 54 0 78-4" stroke="${T.ink}" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <p style="font-size:15px;font-weight:600;color:${T.ink};margin-top:4px">María Torres Gómez</p>
          <p style="font-size:11.5px;color:${T.secondary};margin-top:5px">Psicóloga · T.P. <span class="num">118432</span> · Lic. SST <span class="num">2019-4471</span></p>
        </div>
        <p class="num" style="font-size:10px;color:${T.muted};text-align:right;line-height:1.7">
          Documento sin firmar<br>El folio se emite al firmar
        </p>
      </div>
    </article>

    <!-- Carril de acción: lo único que no es el documento -->
    <aside style="width:330px;flex-shrink:0">
      <div class="card" style="padding:22px 24px">
        <p class="rub rub-ink">Estado</p>
        <div style="margin-top:14px">
          ${[['Calificado', true, 'automático, 2026-09-16 08:12'], ['Revisado por el profesional', true, 'María Torres, 08:41'], ['Firmado digitalmente', false, 'pendiente'], ['Entregado a la empresa', false, 'bloqueado hasta la firma']].map(([t, ok, d], i) => `
            <div style="display:flex;gap:13px;padding:11px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
              <span style="width:18px;height:18px;border-radius:999px;border:1.5px solid ${ok ? T.success : T.border};background:${ok ? T.success : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
                ${ok ? icono('check', { size: 11, color: '#FFF', w: 3 }) : ''}
              </span>
              <div><p style="font-size:13px;font-weight:${ok ? 500 : 400};color:${ok ? T.ink : T.secondary}">${esc(t)}</p>
              <p class="num" style="font-size:11px;color:${T.muted};margin-top:2px">${esc(d)}</p></div>
            </div>`).join('')}
        </div>
        <span class="btn btn-pri" style="width:100%;justify-content:center;margin-top:16px">${icono('firma', { size: 15, color: '#FFF' })}Firmar informe</span>
        <span class="btn btn-sec" style="width:100%;justify-content:center;margin-top:8px">${icono('desc', { size: 14, color: T.secondary })}Descargar borrador</span>
      </div>

      <div class="card" style="padding:22px 24px;margin-top:18px">
        <p class="rub rub-ink">Trazabilidad</p>
        <p style="font-size:12.5px;line-height:1.6;color:${T.secondary};margin-top:10px">
          Cada puntaje de este informe se puede reconstruir desde las respuestas que lo originaron.
        </p>
        <div style="margin-top:14px">
          ${[['Respuestas de origen', '123 ítems'], ['Baremo aplicado', 'Nacional · operativo'], ['Versión del motor', 'v2.4.1'], ['Huella del cálculo', '4f7a91c8e2']].map(([k, v], i) => `
            <div style="display:flex;justify-content:space-between;gap:14px;padding:8px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
              <span style="font-size:12px;color:${T.muted}">${esc(k)}</span>
              <span class="num" style="font-size:12px;color:${T.ink}">${esc(v)}</span>
            </div>`).join('')}
        </div>
        <span class="btn btn-sec" style="width:100%;justify-content:center;margin-top:14px">${icono('ojo', { size: 14, color: T.secondary })}Ver las 123 respuestas</span>
      </div>

      <div style="margin-top:18px;padding:17px 19px;border-radius:10px;background:${T.surface};border:1px solid ${T.border};display:flex;gap:11px">
        ${icono('candado', { size: 15, color: T.muted })}
        <p style="font-size:11.5px;line-height:1.6;color:${T.secondary}">
          Este informe contiene datos de salud. La empresa recibe únicamente el agregado colectivo;
          el resultado individual es reserva del profesional (Ley 1090 de 2006).
        </p>
      </div>
    </aside>
  </div>`,
});

// ── Firma del informe ──────────────────────────────────────────────────
export const firmar = artboard({
  w: 1440, h: 900,
  cuerpo: `<div style="width:1440px;height:900px;background:rgba(12,21,32,0.55);display:flex;align-items:center;justify-content:center">
    <div style="width:620px;background:${T.surface};border-radius:16px;border:1px solid ${T.border};overflow:hidden">
      <div style="padding:30px 36px 0">
        <h2 class="display" style="font-size:32px">Firmar cierra el informe</h2>
        <p style="font-size:13px;color:${T.muted};margin-top:10px">Firma digital · Folio <span class="num">IN-2026-0918</span></p>
        <p style="font-size:13.5px;line-height:1.6;color:${T.secondary};margin-top:10px">
          Al firmar, el contenido queda fijado: ningún puntaje, interpretación ni recomendación
          puede modificarse después. Si aparece un error habrá que emitir un informe de corrección.
        </p>
      </div>

      <div style="padding:24px 36px">
        <p class="rub rub-ink" style="margin-bottom:10px">Su rúbrica</p>
        <div style="height:132px;border:1px solid ${T.border};border-radius:10px;background:${T.paper};display:flex;align-items:center;justify-content:center;position:relative">
          <svg width="240" height="76" viewBox="0 0 240 76" fill="none">
            <path d="M12 56c18-34 26 14 42-16s22 20 36-10 26 26 42-4 24 18 40-8 22 14 32 2" stroke="${T.ink}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <path d="M104 64c26 2 54 0 78-4" stroke="${T.ink}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
          </svg>
          <span style="position:absolute;right:12px;bottom:10px;font-size:11.5px;color:${T.tealDark}">Volver a trazar</span>
        </div>
        <div style="display:flex;gap:10px;align-items:flex-start;margin-top:16px">
          <span style="width:17px;height:17px;border-radius:5px;border:1px solid ${T.teal};background:${T.teal};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">${icono('check', { size: 11, color: '#FFF', w: 2.8 })}</span>
          <p style="font-size:12.5px;line-height:1.55;color:${T.secondary}">
            Declaro que revisé la calificación y la interpretación, y que asumo la responsabilidad
            profesional del contenido conforme a la Ley 1090 de 2006.
          </p>
        </div>

        <div style="margin-top:18px;padding:15px 17px;border-radius:10px;background:${T.paper};border:1px solid ${T.border}">
          <p class="rub" style="margin-bottom:9px">Lo que se emite</p>
          ${[['Folio verificable', 'IN-2026-0918'], ['Huella SHA-256', '4f7a91c8e2…b7d3'], ['Sello de tiempo', '2026-09-16 09:04:12 −05'], ['Código QR de verificación', 'Incluido en la página 1']].map(([k, v]) => `
            <div style="display:flex;justify-content:space-between;gap:14px;padding:4px 0">
              <span style="font-size:12px;color:${T.muted}">${esc(k)}</span>
              <span class="num" style="font-size:12px;color:${T.ink}">${esc(v)}</span>
            </div>`).join('')}
        </div>
      </div>

      <div style="padding:20px 36px;border-top:1px solid ${T.border};background:${T.paper};display:flex;justify-content:flex-end;gap:10px">
        <span class="btn btn-ghost">Cancelar</span>
        <span class="btn btn-pri">${icono('firma', { size: 15, color: '#FFF' })}Firmar y emitir</span>
      </div>
    </div>
  </div>`,
});
