import { T, RISK, FONTS, app, artboard, icono, riesgo, pasos, estado, marca, esc } from '../lib.mjs';
import { cabecera, filtros, paginacion } from './operacion.mjs';

// ── Lista de evaluaciones ──────────────────────────────────────────────
const EVAL = [
  ['EV-2026-1184', 'Hernán Duque Prieto', 'Transportes Andinos', 'Forma A', 123, 'muyAlto', 'Calificado', 'teal', '2026-09-16 08:12'],
  ['EV-2026-1183', 'Ana Lucía Cárdenas', 'Clínica del Norte', 'Forma A', 123, 'medio', 'Firmado', 'ok', '2026-09-15 16:40'],
  ['EV-2026-1182', 'José Aníbal Peña', 'Agroindustria Valle', 'Forma B', 97, 'alto', 'Calificado', 'teal', '2026-09-15 11:02'],
  ['EV-2026-1181', 'Marta Ximena Ruiz', 'Constructora Sierra', 'Extralaboral', 31, 'bajo', 'Revisado', 'info', '2026-09-14 09:55'],
  ['EV-2026-1180', 'Diana Carolina Soto', 'Clínica del Norte', 'Estrés', 31, 'medio', 'Pendiente', 'neutro', '2026-09-14 08:30'],
  ['EV-2026-1179', 'Wilmar Estupiñán', 'Transportes Andinos', 'Forma B', 97, 'alto', 'Calificado', 'teal', '2026-09-13 15:18'],
  ['EV-2026-1178', 'Luz Adriana Molina', 'Alimentos del Caribe', 'Forma A', 123, 'sin', 'Firmado', 'ok', '2026-09-12 10:44'],
];

export const evaluaciones = app({
  w: 1440, h: 900, activo: 'assess', empresa: 'Transportes Andinos S.A.S.', migas: ['Evaluaciones'],
  contenido: `
  ${cabecera({
    rubrica: 'Operación · Aplicaciones de la batería',
    titulo: 'Evaluaciones',
    bajada: 'Una evaluación recorre cuatro estados: pendiente, calificada, revisada y firmada. Solo la firma del psicólogo responsable la cierra.',
    acciones: `<span class="btn btn-sec">${icono('subir', { size: 14, color: T.secondary })}Carga masiva</span><span class="btn btn-pri">${icono('mas', { size: 14, color: '#FFF' })}Nueva evaluación</span>`,
  })}
  ${filtros(['Empresa', 'Instrumento', 'Estado', 'Nivel de riesgo'], { busca: 'Buscar por folio, trabajador o documento…' })}
  <table>
    <tr>
      <th class="th">Folio</th><th class="th">Trabajador</th><th class="th">Empresa</th>
      <th class="th">Instrumento</th><th class="th" style="text-align:right">Ítems</th>
      <th class="th">Riesgo</th><th class="th">Estado</th><th class="th" style="text-align:right;padding-right:0">Aplicación</th>
    </tr>
    ${EVAL.map(([f, t, o, i, n, r, e, tono, fe]) => `<tr>
      <td class="td num" style="color:${T.tealDark};font-weight:500">${f}</td>
      <td class="td" style="font-weight:500">${esc(t)}</td>
      <td class="td" style="color:${T.secondary}">${esc(o)}</td>
      <td class="td" style="color:${T.secondary}">${esc(i)}</td>
      <td class="td num" style="text-align:right;color:${T.muted}">${n}</td>
      <td class="td"><div style="display:inline-flex;align-items:center;gap:10px">${pasos(r)}${riesgo(r, { size: 'sm' })}</div></td>
      <td class="td">${estado(e, tono)}</td>
      <td class="td num" style="text-align:right;color:${T.secondary};font-size:12.5px">${fe}</td>
    </tr>`).join('')}
  </table>
  ${paginacion(1, 7, 1184)}`,
});

// ── Nueva evaluación por invitación ────────────────────────────────────
export const invitar = app({
  w: 1440, h: 1030, activo: 'assess', empresa: 'Transportes Andinos S.A.S.', migas: ['Evaluaciones', 'Nueva', 'Por invitación'],
  contenido: `
  ${cabecera({
    rubrica: 'Nueva evaluación · Paso <span class="num">2</span> de <span class="num">3</span>',
    titulo: 'Invitar a responder',
    bajada: 'Cada trabajador recibe un enlace personal con vigencia limitada. Responde desde su propio teléfono y usted nunca ve quién contestó qué hasta que el sistema califica.',
  })}

  <div style="display:flex;gap:6px;margin-bottom:28px;max-width:560px">
    ${['Instrumentos', 'Destinatarios', 'Envío'].map((p, i) => `
      <div style="flex:1">
        <div style="height:3px;border-radius:2px;background:${i <= 1 ? T.teal : T.border}"></div>
        <p class="rub" style="margin-top:8px;color:${i <= 1 ? T.tealDark : T.muted}">${esc(p)}</p>
      </div>`).join('')}
  </div>

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      <p class="rub rub-ink" style="margin-bottom:14px">Instrumentos seleccionados</p>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${[
          ['Intralaboral Forma A', 'Profesionales, jefaturas y técnicos', 123, true, '1 crédito'],
          ['Intralaboral Forma B', 'Auxiliares y operativos', 97, true, '1 crédito'],
          ['Extralaboral', 'Todos los trabajadores', 31, true, 'Incluido'],
          ['Cuestionario de estrés', 'Todos los trabajadores', 31, true, 'Incluido'],
        ].map(([n, d, it, on, cr]) => `
          <div style="display:flex;align-items:center;gap:14px;padding:15px 18px;border:1px solid ${on ? T.teal : T.border};border-radius:10px;background:${on ? 'rgba(0,154,128,0.04)' : T.surface}">
            <span style="width:17px;height:17px;border-radius:5px;border:1px solid ${on ? T.teal : T.border};background:${on ? T.teal : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${on ? icono('check', { size: 11, color: '#FFF', w: 2.8 }) : ''}
            </span>
            <div style="flex:1;min-width:0">
              <p style="font-size:14px;font-weight:600;color:${T.ink}">${esc(n)}</p>
              <p style="font-size:12.5px;color:${T.secondary};margin-top:2px">${esc(d)}</p>
            </div>
            <span class="num" style="font-size:12.5px;color:${T.muted}">${it} ítems</span>
            <span class="rub" style="color:${T.tealDark};width:70px;text-align:right">${esc(cr)}</span>
          </div>`).join('')}
      </div>

      <p class="rub rub-ink" style="margin:28px 0 14px">Destinatarios · <span class="num">412</span> trabajadores de Transportes Andinos</p>
      <div class="card" style="padding:18px 20px">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${[['Toda la empresa', true], ['Por área', false], ['Por nivel del cargo', false], ['Selección manual', false]].map(([t, on]) => `
            <span class="chip" style="height:30px;padding:0 14px;font-size:13px;font-weight:${on ? 600 : 400};background:${on ? T.ink : T.surface};color:${on ? '#FFF' : T.secondary};border:1px solid ${on ? T.ink : T.border}">${esc(t)}</span>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:26px;margin-top:18px;padding-top:16px;border-top:1px solid ${T.borderMuted}">
          ${[['Forma A', 79], ['Forma B', 333], ['Sin correo', 34], ['Ya evaluados', 0]].map(([k, v]) => `
            <div><p class="rub">${esc(k)}</p><p class="num" style="font-size:22px;font-weight:600;margin-top:6px;color:${v === 34 ? T.warning : T.ink}">${v}</p></div>`).join('')}
        </div>
        <div style="display:flex;gap:11px;align-items:flex-start;margin-top:16px;padding:13px 15px;border-radius:8px;background:#FEF3C7;border:1px solid #FDE68A">
          ${icono('alerta', { size: 15, color: '#B45309' })}
          <p style="font-size:12.5px;line-height:1.55;color:#92400E">
            <strong style="font-weight:600">34 trabajadores no tienen correo registrado.</strong>
            Para ellos el sistema genera un código de acceso impreso que usted entrega en sitio.
          </p>
        </div>
      </div>
    </section>

    <section style="width:376px;flex-shrink:0">
      <p class="rub rub-ink" style="margin-bottom:14px">Condiciones del envío</p>
      <div class="card" style="padding:20px 22px">
        ${[
          ['Vigencia del enlace', '14 días'],
          ['Recordatorio automático', 'A los 3 y 7 días'],
          ['Consentimiento informado', 'Obligatorio, antes del primer ítem'],
          ['Anonimato ante la empresa', 'Resultados individuales reservados'],
          ['Ficha sociodemográfica', 'Se pide una sola vez'],
        ].map(([k, v], i) => `<div style="padding:11px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <p style="font-size:12px;color:${T.muted}">${esc(k)}</p>
          <p style="font-size:13px;color:${T.ink};margin-top:3px">${esc(v)}</p>
        </div>`).join('')}
      </div>

      <div style="margin-top:20px;padding:20px 22px;border:1px solid ${T.border};border-radius:12px;background:${T.surface}">
        <p class="rub rub-ink">Consumo de créditos</p>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-top:14px">
          <span style="font-size:13px;color:${T.secondary}">412 evaluaciones × 1</span>
          <span class="num" style="font-size:20px;font-weight:600">412</span>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-top:9px;padding-top:12px;border-top:1px solid ${T.borderMuted}">
          <span style="font-size:13px;color:${T.secondary}">Saldo tras el envío</span>
          <span class="num" style="font-size:20px;font-weight:600;color:${T.danger}">−365</span>
        </div>
        <div style="display:flex;gap:10px;align-items:flex-start;margin-top:14px;padding:12px 14px;border-radius:8px;background:#FEE2E2;border:1px solid #FECACA">
          ${icono('alerta', { size: 14, color: '#B91C1C' })}
          <p style="font-size:12px;line-height:1.5;color:#9F1239">Saldo insuficiente. Necesita <span class="num">365</span> créditos más para enviar la totalidad.</p>
        </div>
        <span class="btn btn-sec" style="width:100%;justify-content:center;margin-top:12px">${icono('tienda', { size: 14, color: T.secondary })}Comprar créditos</span>
        <span class="btn btn-pri" style="width:100%;justify-content:center;margin-top:9px;opacity:0.45">Enviar 412 invitaciones</span>
      </div>
    </section>
  </div>`,
});

// ── Digitación manual (modo foco, sin barra lateral) ───────────────────
const ITEMS = [
  [13, 'Por la cantidad de trabajo que tengo debo quedarme tiempo adicional', 4],
  [14, 'Me alcanza el tiempo de trabajo para tener al día mis deberes', 1, true],
  [15, 'Por la cantidad de trabajo que tengo debo trabajar sin parar', 4],
  [16, 'Mi trabajo me exige hacer mucho esfuerzo mental', 3],
  [17, 'Mi trabajo me exige estar muy concentrado', null],
  [18, 'Mi trabajo me exige memorizar mucha información', null],
  [19, 'En mi trabajo tengo que tomar decisiones difíciles muy rápido', null],
  [20, 'Mi trabajo me exige atender a muchos asuntos al mismo tiempo', null],
  [21, 'Mi trabajo requiere que me fije en pequeños detalles', null],
  [22, 'En mi trabajo respondo por cosas de mucho valor', null],
];
const OPCIONES = ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'];

export const digitacion = artboard({
  w: 1440, h: 920,
  cuerpo: `<div style="width:1440px;height:920px;background:${T.paper};display:flex;flex-direction:column">
    <header style="height:58px;flex-shrink:0;background:${T.surface};border-bottom:1px solid ${T.border};display:flex;align-items:center;justify-content:space-between;padding:0 32px">
      ${marca({ size: 24, sub: '' })}
      <div style="display:flex;align-items:center;gap:20px">
        <p style="font-size:13px;color:${T.secondary}">Hernán Duque Prieto · <span class="num">CC 79.114.226</span> · Forma A</p>
        <span style="width:1px;height:18px;background:${T.border}"></span>
        <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:${T.muted}">
          ${icono('check', { size: 13, color: T.success })}<span>Guardado hace <span class="num">4 s</span></span>
        </div>
        <span class="btn btn-ghost">Salir</span>
      </div>
    </header>

    <div style="flex:1;display:flex;min-height:0">
      <div style="flex:1;min-width:0;overflow:hidden;padding:34px 44px">
        <div style="max-width:880px;margin:0 auto">
          <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:8px">
            <p class="rub rub-ink">Demandas del trabajo · Demandas cuantitativas y de carga mental</p>
            <p class="num" style="font-size:12.5px;color:${T.muted}">18 / 123</p>
          </div>
          <div style="height:4px;border-radius:2px;background:${T.surfaceMuted};overflow:hidden;margin-bottom:26px">
            <div style="width:14.6%;height:100%;background:${T.teal}"></div>
          </div>

          <div style="display:flex;margin-bottom:11px;padding-left:452px">
            ${OPCIONES.map((o) => `<div style="flex:1;text-align:center"><p class="rub" style="line-height:1.3">${esc(o)}</p></div>`).join('')}
          </div>

          ${ITEMS.map(([n, txt, val, inv]) => `
            <div style="display:flex;align-items:center;gap:0;padding:13px 0;border-top:1px solid ${T.borderMuted};${val === null ? '' : `background:${T.surface}`}">
              <div style="width:452px;flex-shrink:0;display:flex;gap:13px;padding-right:24px">
                <span class="num" style="font-size:12px;color:${T.muted};padding-top:2px;width:22px;flex-shrink:0">${n}</span>
                <div>
                  <p style="font-size:14px;line-height:1.45;color:${T.ink}">${esc(txt)}</p>
                  ${inv ? `<span class="rub" style="color:${T.info};margin-top:5px;display:inline-block">Ítem invertido</span>` : ''}
                </div>
              </div>
              ${OPCIONES.map((_, i) => {
                const on = val === i;
                return `<div style="flex:1;display:flex;justify-content:center">
                  <span style="width:22px;height:22px;border-radius:999px;border:1.5px solid ${on ? T.teal : T.border};background:${on ? T.teal : 'transparent'};display:flex;align-items:center;justify-content:center">
                    ${on ? '<span style="width:7px;height:7px;border-radius:999px;background:#FFF"></span>' : ''}
                  </span></div>`;
              }).join('')}
            </div>`).join('')}

          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:28px;padding-top:20px;border-top:1px solid ${T.border}">
            <div style="display:flex;align-items:center;gap:10px;font-size:12.5px;color:${T.muted}">
              <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span><span class="kbd">4</span><span class="kbd">5</span>
              <span>para responder ·</span><span class="kbd">↑</span><span class="kbd">↓</span><span>para moverse</span>
            </div>
            <div style="display:flex;gap:10px">
              <span class="btn btn-sec">Anterior</span>
              <span class="btn btn-pri">Siguiente bloque${icono('flecha', { size: 14, color: '#FFF' })}</span>
            </div>
          </div>
        </div>
      </div>

      <aside style="width:292px;flex-shrink:0;background:${T.surface};border-left:1px solid ${T.border};padding:28px 24px">
        <p class="rub rub-ink">Avance por dominio</p>
        <div style="margin-top:16px">
          ${[['Demandas del trabajo', 50, 18], ['Liderazgo y relaciones', 41, 0], ['Control sobre el trabajo', 21, 0], ['Recompensa', 11, 0]].map(([d, t, hecho]) => `
            <div style="padding:11px 0;border-bottom:1px solid ${T.borderMuted}">
              <div style="display:flex;justify-content:space-between;align-items:baseline">
                <span style="font-size:12.5px;color:${T.ink}">${esc(d)}</span>
                <span class="num" style="font-size:11.5px;color:${hecho === t ? T.success : T.muted}">${hecho}/${t}</span>
              </div>
              <div style="height:3px;border-radius:2px;background:${T.surfaceMuted};margin-top:7px;overflow:hidden">
                <div style="width:${(hecho / t) * 100}%;height:100%;background:${hecho === t ? T.success : T.teal}"></div>
              </div>
            </div>`).join('')}
        </div>

        <div style="margin-top:24px;padding:16px 17px;border-radius:10px;background:${T.paper};border:1px solid ${T.border}">
          <p class="rub rub-ink">Sin responder</p>
          <p class="num" style="font-size:30px;font-weight:600;margin-top:8px;color:${T.warning}">105</p>
          <p style="font-size:12px;line-height:1.55;color:${T.secondary};margin-top:7px">
            La batería no admite ítems en blanco: si alguno queda sin marcar, el cuestionario se anula y no se puede calificar.
          </p>
        </div>

        <div style="margin-top:20px;display:flex;gap:10px;align-items:flex-start">
          ${icono('escudo', { size: 14, color: T.muted })}
          <p style="font-size:11.5px;line-height:1.55;color:${T.muted}">
            Cada respuesta se registra con marca de tiempo y usuario. La digitación queda en el log de auditoría.
          </p>
        </div>
      </aside>
    </div>
  </div>`,
});

// ── Carga masiva ───────────────────────────────────────────────────────
export const cargaMasiva = app({
  w: 1440, h: 1090, activo: 'assess', empresa: 'Clínica del Norte', migas: ['Evaluaciones', 'Carga masiva'],
  contenido: `
  ${cabecera({
    rubrica: 'Evaluaciones · Importación',
    titulo: 'Carga masiva',
    bajada: 'Para cuestionarios diligenciados en papel. El archivo se valida entero antes de escribir nada: o entran todas las filas correctas, o no entra ninguna.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Descargar plantilla</span>`,
  })}

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      <div style="border:1.5px dashed ${T.border};border-radius:12px;background:${T.surface};padding:44px;text-align:center">
        <div style="width:46px;height:46px;border-radius:12px;background:${T.tealLight};display:flex;align-items:center;justify-content:center;margin:0 auto">
          ${icono('subir', { size: 21, color: T.tealDark })}
        </div>
        <p style="font-family:${FONTS.head};font-size:21px;font-weight:600;color:${T.ink};margin-top:16px">Arrastre el archivo aquí</p>
        <p style="font-size:13px;color:${T.secondary};margin-top:6px">CSV o Excel · hasta 5.000 filas · máximo 10&nbsp;MB</p>
        <span class="btn btn-sec" style="margin-top:18px">Seleccionar archivo</span>
      </div>

      <div style="display:flex;align-items:center;gap:15px;margin-top:20px;padding:15px 18px;border:1px solid ${T.border};border-radius:10px;background:${T.surface}">
        ${icono('form', { size: 19, color: T.secondary })}
        <div style="flex:1;min-width:0">
          <p style="font-size:13.5px;font-weight:500;color:${T.ink}">papel_transandinos_septiembre.csv</p>
          <p class="num" style="font-size:11.5px;color:${T.muted};margin-top:2px">218 filas · 1,4 MB · leído hace 2 min</p>
        </div>
        ${estado('Validado con avisos', 'aviso')}
      </div>

      <p class="rub rub-ink" style="margin:28px 0 14px">Resultado de la validación</p>
      <div style="display:flex;border-top:1px solid ${T.border};border-bottom:1px solid ${T.border}">
        ${[['Filas leídas', 218, T.ink], ['Listas para importar', 203, T.success], ['Con advertencia', 11, T.warning], ['Rechazadas', 4, T.danger]].map(([k, v, c], i) => `
          <div style="flex:1;padding:17px 0 17px ${i ? '24px' : '0'};${i ? `border-left:1px solid ${T.borderMuted}` : ''}">
            <p class="rub">${esc(k)}</p>
            <p class="num" style="font-size:27px;font-weight:600;margin-top:8px;color:${c}">${v}</p>
          </div>`).join('')}
      </div>

      <table style="margin-top:22px">
        <tr><th class="th" style="width:60px">Fila</th><th class="th">Documento</th><th class="th">Detalle</th><th class="th" style="padding-right:0">Resolución</th></tr>
        ${[
          [17, 'CC 79.114.226', 'El ítem 44 está en blanco', 'Rechazada', 'alerta'],
          [42, 'CC 52.418.903', 'El trabajador ya tiene una Forma A en 2026', 'Rechazada', 'alerta'],
          [58, 'CC 16.780.334', 'Nivel del cargo «OPERATIVO» normalizado a «Operativo»', 'Corregida', 'aviso'],
          [61, 'CC 1.020.774.556', 'Fecha 14/09/26 interpretada como 2026-09-14', 'Corregida', 'aviso'],
          [103, 'CC 94.556.012', 'El documento no existe en la empresa seleccionada', 'Rechazada', 'alerta'],
        ].map(([f, d, det, res, tono]) => `<tr>
          <td class="td num" style="color:${T.muted}">${f}</td>
          <td class="td num" style="color:${T.secondary}">${esc(d)}</td>
          <td class="td">${esc(det)}</td>
          <td class="td">${estado(res, tono)}</td>
        </tr>`).join('')}
      </table>
    </section>

    <section style="width:376px;flex-shrink:0">
      <p class="rub rub-ink" style="margin-bottom:14px">Columnas esperadas</p>
      <div class="card" style="padding:18px 20px">
        ${[
          ['documento', 'Obligatoria', true],
          ['tipo_documento', 'Obligatoria', true],
          ['instrumento', 'A · B · EXTRALABORAL · ESTRES', true],
          ['fecha_aplicacion', 'AAAA-MM-DD', true],
          ['item_1 … item_123', 'Valores de 0 a 4', true],
          ['observaciones', 'Opcional', false],
        ].map(([c, d, ob], i) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:9px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <span class="num" style="font-size:12px;color:${ob ? T.ink : T.muted}">${esc(c)}</span>
          <span style="font-size:11.5px;color:${T.muted};text-align:right">${esc(d)}</span>
        </div>`).join('')}
      </div>

      <div style="margin-top:20px;padding:18px 20px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
        <p class="rub rub-ink">Antes de importar</p>
        <p style="font-size:12.5px;line-height:1.6;color:${T.secondary};margin-top:10px">
          Las 4 filas rechazadas quedan fuera. Puede descargar el archivo de errores, corregirlo y volver a cargar solo esas filas.
        </p>
        <span class="btn btn-sec" style="width:100%;justify-content:center;margin-top:14px">${icono('desc', { size: 14, color: T.secondary })}Descargar 4 filas con error</span>
        <span class="btn btn-pri" style="width:100%;justify-content:center;margin-top:9px">Importar 214 evaluaciones</span>
        <p style="font-size:11.5px;color:${T.muted};margin-top:10px;text-align:center">Consume <span class="num">214</span> créditos · saldo actual <span class="num">47</span></p>
      </div>
    </section>
  </div>`,
});

// ── Importar trabajadores de una empresa ───────────────────────────────
export const importarTrabajadores = app({
  w: 1440, h: 900, activo: 'workers', empresa: 'Clínica del Norte', migas: ['Empresas', 'Clínica del Norte', 'Importar'],
  contenido: `
  ${cabecera({
    rubrica: 'Clínica del Norte · Población',
    titulo: 'Importar trabajadores',
    bajada: 'Pegue el contenido separado por comas o suba un archivo. Las columnas se detectan solas y usted confirma la correspondencia antes de escribir.',
  })}

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      <p class="rub rub-ink" style="margin-bottom:12px">Origen</p>
      <div style="display:flex;gap:9px;margin-bottom:16px">
        ${[['Pegar texto', true], ['Subir archivo', false], ['Desde otra empresa', false]].map(([t, on]) => `
          <span class="chip" style="height:32px;padding:0 15px;font-size:13px;font-weight:${on ? 600 : 400};background:${on ? T.ink : T.surface};color:${on ? '#FFF' : T.secondary};border:1px solid ${on ? T.ink : T.border}">${esc(t)}</span>`).join('')}
      </div>
      <div style="border:1px solid ${T.teal};box-shadow:0 0 0 3px rgba(0,154,128,0.12);border-radius:10px;background:${T.surface};padding:16px 18px;height:250px;overflow:hidden">
        <pre class="num" style="margin:0;font-size:12px;line-height:1.85;color:${T.ink}">documento,tipo,nombre,cargo,nivel,area,fecha_ingreso
52418903,CC,Ana Lucía Cárdenas,Enfermera jefe,Profesional,Enfermería,2018-02-12
1020774556,CC,Diana Carolina Soto,Bacterióloga,Técnico,Laboratorio,2021-07-05
39447108,CC,Luz Adriana Molina,Coordinadora,Profesional,Calidad,2016-11-30
79556201,CC,Óscar Iván Beltrán,Auxiliar de farmacia,Auxiliar,Farmacia,2022-03-14
43902117,CC,Marta Ximena Ruiz,Jefe de urgencias,Jefatura,Urgencias,2015-09-01
<span style="color:${T.muted}">… 263 filas más</span></pre>
      </div>

      <p class="rub rub-ink" style="margin:26px 0 12px">Correspondencia de columnas</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${[['documento', 'Documento', true], ['tipo', 'Tipo de documento', true], ['nombre', 'Nombre completo', true], ['cargo', 'Cargo', true], ['nivel', 'Nivel del cargo', true], ['area', 'Área', true], ['fecha_ingreso', 'Fecha de ingreso', true]].map(([o, d, ok]) => `
          <div style="display:flex;align-items:center;gap:9px;padding:9px 13px;border:1px solid ${ok ? '#BBF7D0' : T.border};border-radius:8px;background:${ok ? '#F0FDF4' : T.surface}">
            <span class="num" style="font-size:11.5px;color:${T.muted}">${esc(o)}</span>
            ${icono('flecha', { size: 12, color: T.muted })}
            <span style="font-size:12.5px;color:${T.ink};font-weight:500">${esc(d)}</span>
            ${ok ? icono('check', { size: 12, color: T.success, w: 2.4 }) : ''}
          </div>`).join('')}
      </div>
    </section>

    <section style="width:376px;flex-shrink:0">
      <p class="rub rub-ink" style="margin-bottom:14px">Vista previa</p>
      <div class="card" style="padding:20px 22px">
        ${[['Filas detectadas', '268', T.ink], ['Nuevos trabajadores', '241', T.success], ['Ya registrados, se actualizan', '27', T.info], ['Documentos duplicados', '0', T.muted]].map(([k, v, c], i) => `
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding:11px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <span style="font-size:12.5px;color:${T.secondary}">${esc(k)}</span>
            <span class="num" style="font-size:17px;font-weight:600;color:${c}">${v}</span>
          </div>`).join('')}
      </div>

      <div style="margin-top:18px;padding:16px 18px;border-radius:10px;background:${T.surface};border:1px solid ${T.border};display:flex;gap:11px">
        ${icono('escudo', { size: 15, color: T.muted })}
        <p style="font-size:12px;line-height:1.6;color:${T.secondary}">
          Está cargando datos personales de 268 personas. La empresa debe contar con autorización de tratamiento (Ley 1581 de 2012) antes de este paso.
        </p>
      </div>

      <span class="btn btn-pri" style="width:100%;justify-content:center;margin-top:16px">Importar 268 trabajadores</span>
      <span class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:6px">Cancelar</span>
    </section>
  </div>`,
});
