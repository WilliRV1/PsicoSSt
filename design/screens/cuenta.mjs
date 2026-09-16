import { T, RISK, FONTS, CAT, app, icono, estado, esc, n1, marca } from '../lib.mjs';
import { cabecera, filtros, paginacion } from './operacion.mjs';
import { barras, figura } from './graficos.mjs';

// ── Créditos ───────────────────────────────────────────────────────────
export const creditos = app({
  w: 1440, h: 1020, activo: 'credits', empresa: null, migas: ['Créditos'],
  contenido: `
  ${cabecera({
    rubrica: 'Cuenta · Consumo',
    titulo: 'Créditos',
    bajada: 'Un crédito equivale a una evaluación calificada. Los informes, la firma digital y el asistente no consumen créditos.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Descargar movimientos</span><span class="btn btn-pri">${icono('tienda', { size: 14, color: '#FFF' })}Comprar créditos</span>`,
  })}

  <div style="display:flex;gap:22px;margin-bottom:26px">
    <div style="flex:1;padding:26px 30px;border-radius:12px;background:${T.surface};border:1px solid ${T.danger}40">
      <p class="rub" style="color:${T.danger}">Saldo disponible</p>
      <div style="display:flex;align-items:flex-end;gap:22px;margin-top:12px">
        <span class="display" style="font-size:66px;color:${T.danger}">47</span>
        <div style="padding-bottom:11px">
          <p style="font-size:14px;color:${T.ink};font-weight:500">créditos</p>
          <p style="font-size:12.5px;color:${T.secondary};margin-top:3px">Al ritmo de septiembre se agotan en <span class="num">4</span> días</p>
        </div>
      </div>
      <div style="display:flex;gap:11px;align-items:flex-start;margin-top:20px;padding:13px 15px;border-radius:9px;background:#FEE2E2;border:1px solid #FECACA">
        ${icono('alerta', { size: 15, color: '#B91C1C' })}
        <p style="font-size:12.5px;line-height:1.55;color:#9F1239">
          Tiene <span class="num">412</span> invitaciones preparadas para Transportes Andinos que no puede
          enviar con el saldo actual.
        </p>
      </div>
    </div>
    <div style="width:420px;flex-shrink:0;padding:26px 28px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
      <p class="rub rub-ink">Consumo por mes</p>
      <div style="margin-top:16px">
        ${barras([['Jun', 84], ['Jul', 121], ['Ago', 96], ['Sep', 380]], { w: 360, color: CAT[0], unidad: '' })}
      </div>
      <p style="font-size:12px;line-height:1.6;color:${T.secondary};margin-top:14px;padding-top:12px;border-top:1px solid ${T.borderMuted}">
        Septiembre casi cuadruplica el promedio del trimestre, por la reaplicación en Clínica del Norte y las invitaciones de Constructora Sierra.
      </p>
    </div>
  </div>

  <p class="rub rub-ink" style="margin-bottom:14px">Movimientos</p>
  <table>
    <tr>
      <th class="th">Fecha</th><th class="th">Concepto</th><th class="th">Empresa</th>
      <th class="th">Referencia</th><th class="th" style="text-align:right">Movimiento</th>
      <th class="th" style="text-align:right;padding-right:0">Saldo</th>
    </tr>
    // Encadenado: 26 de saldo inicial + 150 + 1 + 250 − 164 − 214 − 1 − 1 = 47.
    ${[
      ['2026-09-16 08:12', 'Calificación de evaluación', 'Transportes Andinos', 'EV-2026-1184', -1, 47],
      ['2026-09-15 16:40', 'Calificación de evaluación', 'Clínica del Norte', 'EV-2026-1183', -1, 48],
      ['2026-09-15 09:02', 'Carga masiva · 214 evaluaciones', 'Clínica del Norte', 'IMP-2026-0071', -214, 49],
      ['2026-09-12 10:15', 'Invitaciones enviadas · 164 trabajadores', 'Constructora Sierra', 'INV-2026-0188', -164, 263],
      ['2026-09-10 11:24', 'Compra · paquete Business', '—', 'PAG-2026-0233', 250, 427],
      ['2026-09-04 14:55', 'Reverso por evaluación anulada', 'Agroindustria Valle', 'EV-2026-1102', 1, 177],
      ['2026-09-01 00:00', 'Asignación mensual · plan Profesional', '—', 'PLN-2026-09', 150, 176],
    ].map(([f, c, o, r, m, s]) => `<tr>
      <td class="td num" style="color:${T.secondary};font-size:12.5px">${f}</td>
      <td class="td">${esc(c)}</td>
      <td class="td" style="color:${T.secondary}">${esc(o)}</td>
      <td class="td num" style="color:${T.tealDark};font-size:12.5px">${esc(r)}</td>
      <td class="td num" style="text-align:right;font-weight:600;color:${m > 0 ? T.success : T.ink}">${m > 0 ? '+' : '−'}${Math.abs(m)}</td>
      <td class="td num" style="text-align:right;color:${T.secondary}">${s}</td>
    </tr>`).join('')}
  </table>
  ${paginacion(1, 7, 418)}`,
});

// ── Planes ─────────────────────────────────────────────────────────────
const PLANES = [
  ['Starter', '190.000', 50, ['Hasta 3 empresas', 'Los cuatro instrumentos', 'Informes individuales', 'Soporte por correo'], false],
  ['Profesional', '420.000', 150, ['Hasta 15 empresas', 'Informes colectivos y SVE', 'Analítica y tendencias', 'Asistente de redacción', 'Firma digital ilimitada'], true],
  ['Business', '890.000', 400, ['Empresas ilimitadas', 'Hasta 5 psicólogos en el equipo', 'API de importación', 'Comparación entre aplicaciones', 'Soporte por correo y chat'], false],
  ['Corporativo', 'A convenir', null, ['Todo lo del plan Business', 'Despliegue dedicado', 'Acuerdo de nivel de servicio', 'Soporte 24/7'], false],
];

export const planes = app({
  w: 1440, h: 1090, activo: 'store', empresa: null, migas: ['Planes'],
  contenido: `
  ${cabecera({
    rubrica: 'Cuenta · Suscripción',
    titulo: 'Planes',
    bajada: 'Todos los planes incluyen los cuatro instrumentos de la batería, la calificación conforme al manual y la trazabilidad completa. Lo que cambia es el volumen y el trabajo colectivo.',
  })}

  <div style="display:flex;gap:9px;margin-bottom:26px">
    ${[['Mensual', false], ['Anual · dos meses gratis', true]].map(([t, on]) => `
      <span class="chip" style="height:32px;padding:0 15px;font-size:13px;font-weight:${on ? 600 : 400};background:${on ? T.ink : T.surface};color:${on ? '#FFF' : T.secondary};border:1px solid ${on ? T.ink : T.border}">${esc(t)}</span>`).join('')}
  </div>

  <div style="display:flex;gap:18px">
    ${PLANES.map(([n, precio, cr, feats, actual]) => `
      <div style="flex:1;padding:26px 24px;border-radius:14px;background:${T.surface};border:1px solid ${actual ? T.teal : T.border};position:relative;display:flex;flex-direction:column">
        ${actual ? `<span class="rub" style="position:absolute;top:-8px;left:24px;background:${T.teal};color:#FFF;padding:3px 9px;border-radius:5px">Su plan</span>` : ''}
        <p style="font-family:${FONTS.head};font-size:26px;font-weight:600;letter-spacing:-0.01em;color:${T.ink}">${esc(n)}</p>
        <div style="display:flex;align-items:baseline;gap:5px;margin-top:14px">
          ${precio === 'A convenir'
            ? `<span style="font-size:22px;font-weight:600;color:${T.ink}">A convenir</span>`
            : `<span style="font-size:14px;color:${T.secondary}">$</span><span class="num" style="font-size:32px;font-weight:600;color:${T.ink}">${precio}</span><span style="font-size:12.5px;color:${T.muted}">/mes</span>`}
        </div>
        <p class="num" style="font-size:12px;color:${T.tealDark};margin-top:8px">${cr ? `${cr} créditos mensuales` : 'Créditos a la medida'}</p>
        <div style="height:1px;background:${T.borderMuted};margin:18px 0"></div>
        <div style="display:flex;flex-direction:column;gap:10px;flex:1">
          ${feats.map((f) => `<div style="display:flex;gap:9px;align-items:flex-start">
            ${icono('check', { size: 13, color: T.teal, w: 2.4 })}
            <span style="font-size:12.5px;line-height:1.45;color:${T.secondary}">${esc(f)}</span></div>`).join('')}
        </div>
        <span class="btn ${actual ? 'btn-sec' : 'btn-pri'}" style="width:100%;justify-content:center;margin-top:22px">${actual ? 'Plan actual' : precio === 'A convenir' ? 'Hablar con ventas' : 'Cambiar a este plan'}</span>
      </div>`).join('')}
  </div>

  <div style="display:flex;gap:22px;margin-top:26px">
    <div style="flex:1;padding:22px 26px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
      <p class="rub rub-ink">Paquetes de créditos sueltos</p>
      <p style="font-size:12.5px;color:${T.secondary};margin-top:7px">Para picos de reaplicación. No caducan y se suman al saldo del plan.</p>
      <div style="display:flex;gap:11px;margin-top:16px">
        ${[['50', '95.000'], ['150', '255.000'], ['250', '390.000'], ['500', '720.000']].map(([c, p]) => `
          <div style="flex:1;padding:15px 16px;border:1px solid ${T.border};border-radius:9px;text-align:center">
            <p class="num" style="font-size:22px;font-weight:600;color:${T.ink}">${c}</p>
            <p class="rub" style="margin-top:3px">créditos</p>
            <p class="num" style="font-size:12.5px;color:${T.secondary};margin-top:9px">$${p}</p>
          </div>`).join('')}
      </div>
    </div>
    <div style="width:376px;flex-shrink:0;padding:22px 24px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
      <p class="rub rub-ink">Facturación</p>
      <div style="margin-top:14px">
        ${[['Razón social', 'Consultorio Torres SAS'], ['NIT', '901.774.220-3'], ['Medio de pago', 'Mercado Pago · ••4471'], ['Próximo cobro', '2026-10-01'], ['Régimen', 'Responsable de IVA · 19%']].map(([k, v], i) => `
          <div style="display:flex;justify-content:space-between;gap:14px;padding:8px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <span style="font-size:12px;color:${T.muted}">${esc(k)}</span>
            <span style="font-size:12px;color:${T.ink};text-align:right">${esc(v)}</span>
          </div>`).join('')}
      </div>
      <span class="btn btn-sec" style="width:100%;justify-content:center;margin-top:14px">Ver facturas</span>
    </div>
  </div>`,
});

// ── Equipo ─────────────────────────────────────────────────────────────
export const equipo = app({
  w: 1440, h: 1110, activo: 'users', empresa: null, migas: ['Equipo'],
  contenido: `
  ${cabecera({
    rubrica: 'Cuenta · Personas con acceso',
    titulo: 'Equipo',
    bajada: 'Cada persona con acceso debe tener licencia vigente en SST. El sistema registra quién consultó qué historia y cuándo, sin excepción.',
    acciones: `<span class="btn btn-pri">${icono('mas', { size: 14, color: '#FFF' })}Invitar psicólogo</span>`,
  })}
  ${filtros(['Rol', 'Estado', 'Empresas asignadas'], { busca: 'Buscar por nombre o correo…' })}
  <table>
    <tr>
      <th class="th">Persona</th><th class="th">Correo</th><th class="th">Rol</th>
      <th class="th">Licencia SST</th><th class="th" style="text-align:right">Empresas</th>
      <th class="th">MFA</th><th class="th">Estado</th><th class="th" style="text-align:right;padding-right:0">Último acceso</th>
    </tr>
    ${[
      ['María Torres Gómez', 'maria@consultorio.co', 'Propietaria', '2019-4471', 12, true, 'Activa', 'ok', '2026-09-16 08:41'],
      ['Andrés Lozano Peña', 'andres@consultorio.co', 'Psicólogo', '2021-8802', 5, true, 'Activa', 'ok', '2026-09-15 17:20'],
      ['Camila Restrepo Díaz', 'camila@consultorio.co', 'Psicóloga', '2022-1145', 3, true, 'Activa', 'ok', '2026-09-15 11:06'],
      ['Paula Guzmán Rojas', 'paula@consultorio.co', 'Psicóloga', '2020-3390', 4, false, 'MFA pendiente', 'aviso', '2026-09-12 09:33'],
      ['Sebastián Ríos Mora', 'sebastian@consultorio.co', 'Solo lectura', '—', 12, true, 'Activa', 'ok', '2026-09-11 15:47'],
      ['Valeria Ochoa Mesa', 'valeria@consultorio.co', 'Psicóloga', '2018-2207', 0, false, 'Invitación enviada', 'neutro', '—'],
    ].map(([n, c, r, lic, e, mfa, est, tono, ult]) => `<tr>
      <td class="td" style="font-weight:500">${esc(n)}</td>
      <td class="td" style="color:${T.secondary}">${esc(c)}</td>
      <td class="td">${esc(r)}</td>
      <td class="td num" style="color:${T.secondary}">${esc(lic)}</td>
      <td class="td num" style="text-align:right">${e}</td>
      <td class="td">${mfa ? icono('check', { size: 15, color: T.success, w: 2.4 }) : icono('alerta', { size: 15, color: T.warning })}</td>
      <td class="td">${estado(est, tono)}</td>
      <td class="td num" style="text-align:right;color:${T.secondary};font-size:12.5px">${esc(ult)}</td>
    </tr>`).join('')}
  </table>

  <div style="margin-top:26px;padding:20px 24px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
    <p class="rub rub-ink" style="margin-bottom:14px">Qué puede hacer cada rol</p>
    <table>
      <tr><th class="th">Permiso</th><th class="th" style="text-align:center">Propietaria</th><th class="th" style="text-align:center">Psicólogo</th><th class="th" style="text-align:center;padding-right:0">Solo lectura</th></tr>
      ${[
        ['Ver informes individuales de sus empresas', true, true, false],
        ['Firmar informes', true, true, false],
        ['Crear empresas y trabajadores', true, true, false],
        ['Comprar créditos y cambiar el plan', true, false, false],
        ['Invitar y retirar personas del equipo', true, false, false],
        ['Consultar el registro de auditoría', true, false, false],
      ].map(([p, a, b, c], i) => `<tr>
        <td class="td" style="font-size:13px">${esc(p)}</td>
        ${[a, b, c].map((v) => `<td class="td" style="text-align:center">${v ? icono('check', { size: 15, color: T.success, w: 2.4 }) : `<span style="color:${T.border};font-size:15px">—</span>`}</td>`).join('')}
      </tr>`).join('')}
    </table>
  </div>`,
});

// ── Configuración y perfil ─────────────────────────────────────────────
function seccionAjuste(titulo, nota, cuerpo) {
  return `<div style="display:flex;gap:40px;padding:26px 0;border-top:1px solid ${T.border}">
    <div style="width:250px;flex-shrink:0">
      <p style="font-family:${FONTS.head};font-size:19px;font-weight:600;letter-spacing:-0.005em;color:${T.ink}">${esc(titulo)}</p>
      <p style="font-size:12.5px;line-height:1.6;color:${T.secondary};margin-top:7px">${esc(nota)}</p>
    </div>
    <div style="flex:1;min-width:0">${cuerpo}</div>
  </div>`;
}

function interruptor(label, desc, on) {
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid ${T.borderMuted}">
    <div><p style="font-size:13.5px;font-weight:500;color:${T.ink}">${esc(label)}</p>
    <p style="font-size:12px;line-height:1.5;color:${T.secondary};margin-top:3px">${esc(desc)}</p></div>
    <span style="width:38px;height:22px;border-radius:999px;background:${on ? T.teal : T.border};flex-shrink:0;position:relative;margin-top:2px">
      <span style="position:absolute;top:2px;${on ? 'right:2px' : 'left:2px'};width:18px;height:18px;border-radius:999px;background:#FFF"></span>
    </span>
  </div>`;
}

export const configuracion = app({
  w: 1440, h: 1500, activo: 'settings', empresa: null, migas: ['Configuración'],
  contenido: `
  ${cabecera({ rubrica: 'Cuenta · Preferencias', titulo: 'Configuración' })}

  ${seccionAjuste('Perfil profesional', 'Estos datos aparecen en el pie de cada informe que usted firma.',
    `<div style="display:flex;gap:24px;align-items:flex-start">
      <div style="flex:1;display:flex;flex-direction:column;gap:14px">
        ${[['Nombre completo', 'María Torres Gómez'], ['Tarjeta profesional', '118432'], ['Licencia SST', '2019-4471'], ['Correo de contacto', 'maria@consultorio.co']].map(([l, v]) => `
          <div><p class="lbl" style="margin-bottom:7px">${esc(l)}</p><div class="input">${esc(v)}</div></div>`).join('')}
      </div>
      <div style="width:300px;flex-shrink:0">
        <p class="lbl" style="margin-bottom:7px">Rúbrica registrada</p>
        <div style="height:112px;border:1px solid ${T.border};border-radius:9px;background:${T.paper};display:flex;align-items:center;justify-content:center">
          <svg width="190" height="60" viewBox="0 0 240 76" fill="none">
            <path d="M12 56c18-34 26 14 42-16s22 20 36-10 26 26 42-4 24 18 40-8 22 14 32 2" stroke="${T.ink}" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M104 64c26 2 54 0 78-4" stroke="${T.ink}" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="btn btn-sec" style="width:100%;justify-content:center;margin-top:9px;height:32px;font-size:12.5px">Volver a trazar</span>
      </div>
    </div>`)}

  ${seccionAjuste('Seguridad', 'Una cuenta de PsicoSST abre historias clínicas ocupacionales. El segundo factor no es opcional.',
    `${interruptor('Segundo factor obligatorio', 'Aplicación de autenticación. Activo desde el 4 de marzo de 2025.', true)}
     ${interruptor('Pedir el segundo factor en cada sesión', 'Si se desactiva, se pide una vez cada 30 días por equipo reconocido.', false)}
     ${interruptor('Cerrar sesión tras 30 minutos de inactividad', 'Recomendado en equipos compartidos de consultorio.', true)}
     ${interruptor('Avisar de inicios de sesión desde equipos nuevos', 'Llega un correo con equipo, IP y hora aproximada.', true)}`)}

  ${seccionAjuste('Notificaciones', 'Lo que llega a su correo. Las alertas críticas no se pueden desactivar.',
    `${interruptor('Vigencias próximas a vencer', 'Un aviso a los 60, 30 y 7 días antes del vencimiento.', true)}
     ${interruptor('Evaluaciones completadas por los trabajadores', 'Resumen diario, no un correo por respuesta.', true)}
     ${interruptor('Informes pendientes de firma', 'Recordatorio semanal mientras queden informes sin firmar.', true)}
     ${interruptor('Novedades del producto', 'Cambios en el motor de calificación y nuevas funciones.', false)}`)}

  ${seccionAjuste('Informes', 'Valores por defecto al generar un entregable.',
    `<div style="display:flex;gap:16px;margin-bottom:6px">
      <div style="flex:1"><p class="lbl" style="margin-bottom:7px">Baremo por defecto</p><div class="input">Nacional (Ministerio de Trabajo)</div></div>
      <div style="flex:1"><p class="lbl" style="margin-bottom:7px">Idioma del informe</p><div class="input">Español (Colombia)</div></div>
    </div>
    ${interruptor('Incluir el anexo de trazabilidad', 'Agrega las respuestas ítem por ítem al final del PDF.', true)}
    ${interruptor('Incluir el código QR de verificación', 'Permite a un inspector validar el folio sin acceso al sistema.', true)}`)}

  <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:26px;border-top:1px solid ${T.border}">
    <span class="btn btn-ghost">Descartar cambios</span>
    <span class="btn btn-pri">Guardar</span>
  </div>`,
});

// ── Guía rápida ────────────────────────────────────────────────────────
export const tutorial = app({
  w: 1440, h: 1130, activo: 'panel', empresa: null, migas: ['Guía rápida'],
  contenido: `
  ${cabecera({
    rubrica: 'Primeros pasos',
    titulo: 'De cero a un informe firmado',
    bajada: 'Cinco pasos. Si es su primera evaluación, este es el camino más corto y no se salta ningún requisito de la norma.',
  })}

  <div style="display:flex;gap:18px;margin-bottom:28px">
    ${[
      ['01', 'Registre la empresa', 'NIT, sector, actividad económica y clase de riesgo. El sector determina el baremo que se aplicará.', 'empresa', true],
      ['02', 'Cargue los trabajadores', 'Uno a uno o con un CSV. El nivel del cargo decide si le corresponde Forma A o Forma B.', 'persona', true],
      ['03', 'Envíe las invitaciones', 'Cada trabajador responde desde su teléfono, con consentimiento informado previo.', 'form', false],
      ['04', 'Revise la calificación', 'El sistema califica solo. Usted verifica y ajusta la interpretación si hace falta.', 'informe', false],
      ['05', 'Firme y entregue', 'La firma emite el folio verificable. Sin ella el informe no tiene valor probatorio.', 'firma', false],
    ].map(([n, t, d, ic, hecho]) => `
      <div style="flex:1;padding:22px 22px;border-radius:12px;background:${T.surface};border:1px solid ${hecho ? '#BBF7D0' : T.border}">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="width:32px;height:32px;border-radius:9px;background:${hecho ? '#DCFCE7' : T.surfaceMuted};display:flex;align-items:center;justify-content:center">
            ${icono(ic, { size: 16, color: hecho ? '#15803D' : T.secondary })}
          </div>
          ${hecho ? icono('check', { size: 16, color: T.success, w: 2.6 }) : `<span class="num" style="font-size:11.5px;color:${T.muted}">${n}</span>`}
        </div>
        <p style="font-family:${FONTS.head};font-size:18px;font-weight:600;letter-spacing:-0.005em;color:${T.ink};margin-top:14px">${esc(t)}</p>
        <p style="font-size:12.5px;line-height:1.6;color:${T.secondary};margin-top:7px">${esc(d)}</p>
      </div>`).join('')}
  </div>

  <div style="display:flex;gap:22px">
    <div style="flex:1;padding:26px 28px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
      <p class="rub rub-ink">Las preguntas que más se repiten</p>
      <div style="margin-top:16px">
        ${[
          ['¿Puedo aplicar la batería a toda la empresa con una sola forma?', 'No. La Forma A es para profesionales, jefaturas y técnicos; la Forma B para auxiliares y operativos. Aplicar la forma equivocada invalida el resultado.'],
          ['¿Cada cuánto debo reaplicarla?', 'El artículo 3 de la Resolución 2764 de 2022 fija cada dos años con riesgo bajo o medio, y cada año con riesgo alto o muy alto.'],
          ['¿La empresa puede ver los resultados individuales?', 'No. El resultado individual es reserva del profesional (Ley 1090 de 2006). La empresa recibe el informe colectivo.'],
          ['¿Qué pasa si un trabajador deja ítems en blanco?', 'El cuestionario se anula: la batería no admite imputación de faltantes. Hay que repetir la aplicación.'],
        ].map(([q, a], i) => `<div style="padding:14px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <p style="font-size:13.5px;font-weight:600;color:${T.ink}">${esc(q)}</p>
          <p class="prose" style="font-size:14.5px;margin-top:6px">${esc(a)}</p>
        </div>`).join('')}
      </div>
    </div>

    <div style="width:376px;flex-shrink:0">
      <div style="padding:24px 26px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
        <p class="rub rub-ink">Marco legal aplicable</p>
        <div style="margin-top:14px">
          ${[
            ['Resolución 2646 de 2008', 'Define los factores de riesgo psicosocial y obliga a evaluarlos.'],
            ['Resolución 2764 de 2022', 'Adopta la batería, la guía técnica y los protocolos, y fija la periodicidad. Derogó la Resolución 2404 de 2019.'],
            ['Ley 1090 de 2006', 'Ejercicio de la psicología y custodia de la historia clínica.'],
            ['Ley 1581 de 2012', 'Protección de datos personales y habeas data.'],
          ].map(([n, d], i) => `<div style="padding:11px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <p style="font-size:13px;font-weight:600;color:${T.ink}">${esc(n)}</p>
            <p style="font-size:12px;line-height:1.5;color:${T.secondary};margin-top:3px">${esc(d)}</p>
          </div>`).join('')}
        </div>
      </div>
      <div style="margin-top:18px;padding:20px 22px;border-radius:12px;background:${T.tealLight};border:1px solid #A9E3D6">
        <p style="font-size:14px;font-weight:600;color:${T.tealDark}">¿Prefiere que lo acompañemos?</p>
        <p style="font-size:12.5px;line-height:1.6;color:${T.tealDark};margin-top:7px;opacity:0.85">
          Agende 30 minutos con nuestro equipo clínico para revisar juntos su primera aplicación.
        </p>
        <span class="btn" style="background:${T.tealDark};color:#FFF;margin-top:14px">Agendar sesión</span>
      </div>
    </div>
  </div>`,
});
