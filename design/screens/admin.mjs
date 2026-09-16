import { T, FONTS, CAT, app, icono, estado, esc, n1 } from '../lib.mjs';
import { cabecera, filtros, paginacion } from './operacion.mjs';
import { barras, figura } from './graficos.mjs';

// ── Panel de administración ────────────────────────────────────────────
export const panelAdmin = app({
  w: 1440, h: 1060, activo: 'admin', empresa: null, migas: ['Panel admin'],
  contenido: `
  ${cabecera({
    rubrica: 'Administración · Plataforma',
    titulo: 'Panel admin',
    bajada: 'Aprobación de profesionales, salud del sistema y registro de auditoría. Todo lo que se hace desde aquí queda firmado con su usuario.',
    acciones: `<span class="btn btn-sec">${icono('libro', { size: 14, color: T.secondary })}Ver auditoría</span>`,
  })}

  <div style="display:flex;border-top:1px solid ${T.border};border-bottom:1px solid ${T.border};margin-bottom:26px">
    ${[['Psicólogos activos', '84', T.ink, ''], ['Solicitudes pendientes', '7', T.warning, 'la más antigua, 3 días'], ['Cuentas suspendidas', '2', T.danger, ''], ['Evaluaciones hoy', '312', T.ink, ''], ['Errores de calificación', '0', T.success, 'últimos 30 días']].map(([k, v, c, n], i) => `
      <div style="flex:1;padding:17px 0 17px ${i ? '24px' : '0'};${i ? `border-left:1px solid ${T.borderMuted}` : ''}">
        <p class="rub">${esc(k)}</p>
        <p class="num" style="font-size:28px;font-weight:600;margin-top:8px;color:${c}">${v}</p>
        ${n ? `<p style="font-size:11px;color:${T.muted};margin-top:4px">${esc(n)}</p>` : ''}
      </div>`).join('')}
  </div>

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
        <p class="rub rub-ink">Solicitudes de acceso pendientes</p>
        <span style="font-size:12.5px;color:${T.tealDark}">Ver las 7</span>
      </div>
      <table>
        <tr><th class="th">Profesional</th><th class="th">T.P.</th><th class="th">Licencia SST</th><th class="th">Posgrado</th><th class="th" style="text-align:right;padding-right:0">Solicitud</th></tr>
        ${[
          ['Valeria Ochoa Mesa', '224118', '2018-2207', 'Verificado', 'ok', 'hace 3 días'],
          ['Ricardo Peláez Cano', '198043', '2023-5512', 'Verificado', 'ok', 'hace 2 días'],
          ['Natalia Bermúdez Soto', '241779', '—', 'Sin adjuntar', 'alerta', 'hace 2 días'],
          ['Óscar Iván Beltrán', '215690', '2021-9930', 'En revisión', 'aviso', 'ayer'],
          ['Juliana Mora Castaño', '233401', '2024-1108', 'Verificado', 'ok', 'hoy'],
        ].map(([n, tp, lic, pos, tono, f]) => `<tr>
          <td class="td" style="font-weight:500">${esc(n)}</td>
          <td class="td num" style="color:${T.secondary}">${tp}</td>
          <td class="td num" style="color:${T.secondary}">${esc(lic)}</td>
          <td class="td">${estado(pos, tono)}</td>
          <td class="td" style="text-align:right;color:${T.secondary};font-size:12.5px">${esc(f)}</td>
        </tr>`).join('')}
      </table>

      <p class="rub rub-ink" style="margin:28px 0 14px">Actividad de la plataforma</p>
      ${figura('Evaluaciones calificadas por día', 'Últimos 14 días · toda la plataforma',
        barras([['Lun', 284], ['Mar', 341], ['Mié', 312], ['Jue', 398], ['Vie', 366], ['Sáb', 74], ['Dom', 21]], { w: 560, color: CAT[0], unidad: '' }))}
    </section>

    <section style="width:376px;flex-shrink:0">
      <p class="rub rub-ink" style="margin-bottom:14px">Salud del sistema</p>
      <div class="card" style="padding:20px 22px">
        ${[
          ['Motor de calificación', 'v2.4.1 · conforme al manual', 'ok', 'Operativo'],
          ['Generación de PDF', 'Latencia media 1,8 s', 'ok', 'Operativo'],
          ['Envío de correos', '3 rebotes en 24 h', 'aviso', 'Degradado'],
          ['Base de datos', 'Réplica al día', 'ok', 'Operativo'],
          ['Respaldo', 'Último: hoy 03:00', 'ok', 'Operativo'],
        ].map(([n, d, tono, est], i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <div style="min-width:0"><p style="font-size:13px;font-weight:500;color:${T.ink}">${esc(n)}</p>
          <p class="num" style="font-size:11px;color:${T.muted};margin-top:2px">${esc(d)}</p></div>
          ${estado(est, tono)}
        </div>`).join('')}
      </div>

      <p class="rub rub-ink" style="margin:26px 0 14px">Conformidad del motor</p>
      <div class="card" style="padding:20px 22px">
        <p style="font-size:12.5px;line-height:1.6;color:${T.secondary}">
          El motor se contrasta contra los casos publicados en el manual oficial en cada despliegue.
          Una sola discrepancia bloquea la salida a producción.
        </p>
        <div style="display:flex;align-items:baseline;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid ${T.borderMuted}">
          <span class="num" style="font-size:30px;font-weight:600;color:${T.success}">248</span>
          <span style="font-size:12.5px;color:${T.secondary}">de 248 casos de conformidad</span>
        </div>
      </div>
    </section>
  </div>`,
});

// ── Psicólogos ─────────────────────────────────────────────────────────
export const psicologos = app({
  w: 1440, h: 900, activo: 'admin', empresa: null, migas: ['Panel admin', 'Psicólogos'],
  contenido: `
  ${cabecera({
    rubrica: 'Administración · Profesionales',
    titulo: 'Psicólogos',
    bajada: 'Suspender una cuenta corta el acceso de inmediato pero no borra nada: los informes que esa persona firmó siguen siendo válidos y auditables.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportar padrón</span>`,
  })}
  ${filtros(['Estado', 'Plan', 'Antigüedad'], { busca: 'Buscar por nombre, correo o tarjeta profesional…' })}
  <table>
    <tr>
      <th class="th">Profesional</th><th class="th">Correo</th><th class="th">T.P.</th>
      <th class="th">Plan</th><th class="th" style="text-align:right">Empresas</th>
      <th class="th" style="text-align:right">Informes firmados</th><th class="th">Estado</th>
      <th class="th" style="text-align:right;padding-right:0">Alta</th>
    </tr>
    ${[
      ['María Torres Gómez', 'maria@consultorio.co', '118432', 'Profesional', 12, 968, 'Activa', 'ok', '2024-02-11'],
      ['Andrés Lozano Peña', 'andres@saludocupacional.co', '176220', 'Business', 31, 2411, 'Activa', 'ok', '2023-06-04'],
      ['Camila Restrepo Díaz', 'camila@sstintegral.com', '201455', 'Starter', 3, 142, 'Activa', 'ok', '2025-09-19'],
      ['Jorge Andrés Villa', 'jvilla@consultoria.co', '154880', 'Profesional', 8, 611, 'Suspendida', 'alerta', '2023-11-27'],
      ['Paula Guzmán Rojas', 'paula@psicolaboral.co', '189031', 'Starter', 2, 88, 'Activa', 'ok', '2026-01-15'],
      ['Sebastián Ríos Mora', 'sebastian@riesgolab.co', '212907', 'Business', 24, 1877, 'Activa', 'ok', '2024-08-02'],
      ['Natalia Bermúdez Soto', 'natalia@bienestarsst.co', '241779', '—', 0, 0, 'Pendiente', 'aviso', '—'],
    ].map(([n, c, tp, pl, e, inf, est, tono, alta]) => `<tr>
      <td class="td" style="font-weight:500">${esc(n)}</td>
      <td class="td" style="color:${T.secondary}">${esc(c)}</td>
      <td class="td num" style="color:${T.secondary}">${tp}</td>
      <td class="td">${esc(pl)}</td>
      <td class="td num" style="text-align:right">${e}</td>
      <td class="td num" style="text-align:right">${inf}</td>
      <td class="td">${estado(est, tono)}</td>
      <td class="td num" style="text-align:right;color:${T.secondary}">${esc(alta)}</td>
    </tr>`).join('')}
  </table>
  ${paginacion(1, 7, 93)}`,
});

// ── Verificación de una solicitud ──────────────────────────────────────
export const solicitudPendiente = app({
  w: 1440, h: 960, activo: 'admin', empresa: null, migas: ['Panel admin', 'Pendientes', 'Valeria Ochoa Mesa'],
  contenido: `
  ${cabecera({
    rubrica: 'Solicitud <span class="num">#SR-2026-0418</span> · recibida hace 3 días',
    titulo: 'Valeria Ochoa Mesa',
    bajada: 'Aprobar esta cuenta le da acceso a datos de salud de terceros. Verifique los tres documentos antes de decidir: la responsabilidad de la habilitación es de quien aprueba.',
  })}

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      ${[
        ['Tarjeta profesional de psicólogo', 'N.º 224118 · expedida el 2018-04-20 por el Colegio Colombiano de Psicólogos', 'Verificado contra el registro público', 'ok', true],
        ['Posgrado en Seguridad y Salud en el Trabajo', 'Especialización · Universidad del Rosario · acta 2019-1140', 'Documento adjunto y legible', 'ok', true],
        ['Licencia vigente en SST', 'N.º 2018-2207 · Secretaría de Salud de Cundinamarca · vence 2027-04-30', 'Vigente al momento de la revisión', 'ok', true],
      ].map(([t, d, nota, tono, ok]) => `
        <div class="card" style="padding:20px 22px;margin-bottom:12px">
          <div style="display:flex;align-items:flex-start;gap:14px">
            <span style="width:22px;height:22px;border-radius:999px;background:${ok ? '#DCFCE7' : T.surfaceMuted};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
              ${ok ? icono('check', { size: 13, color: '#15803D', w: 2.6 }) : ''}
            </span>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                <p style="font-size:14.5px;font-weight:600;color:${T.ink}">${esc(t)}</p>${estado('Verificado', tono)}
              </div>
              <p style="font-size:12.5px;color:${T.secondary};margin-top:5px">${esc(d)}</p>
              <p style="font-size:12px;color:${T.muted};margin-top:6px">${esc(nota)}</p>
              <div style="display:flex;gap:9px;margin-top:12px">
                <span class="btn btn-sec" style="height:30px;font-size:12px">${icono('ojo', { size: 12, color: T.secondary })}Ver documento</span>
                <span class="btn btn-ghost" style="height:30px;font-size:12px">Marcar como no válido</span>
              </div>
            </div>
          </div>
        </div>`).join('')}

      <div style="margin-top:20px;padding:20px 22px;border-radius:12px;background:${T.surface};border:1px solid ${T.border}">
        <p class="lbl" style="margin-bottom:9px">Nota de la revisión (queda en la auditoría)</p>
        <div style="min-height:72px;border:1px solid ${T.border};border-radius:9px;background:${T.paper};padding:12px 14px">
          <p style="font-size:13px;color:${T.secondary}">Los tres documentos coinciden con el registro público del Colegio. Licencia vigente hasta 2027.</p>
        </div>
      </div>
    </section>

    <section style="width:376px;flex-shrink:0">
      <div class="card" style="padding:22px 24px">
        <p class="rub rub-ink">Datos de la solicitud</p>
        <div style="margin-top:14px">
          ${[['Correo', 'valeria@consultorio.co'], ['Teléfono', '+57 310 442 1178'], ['Ciudad', 'Bogotá D.C.'], ['Origen', 'Invitación de María Torres'], ['Recibida', '2026-09-13 10:22'], ['IP de registro', '181.51.204.66']].map(([k, v], i) => `
            <div style="display:flex;justify-content:space-between;gap:14px;padding:9px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
              <span style="font-size:12px;color:${T.muted}">${esc(k)}</span>
              <span class="num" style="font-size:12px;color:${T.ink};text-align:right">${esc(v)}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="card" style="padding:22px 24px;margin-top:18px">
        <p class="rub rub-ink">Decisión</p>
        <p style="font-size:12.5px;line-height:1.6;color:${T.secondary};margin-top:10px">
          Al aprobar, la persona recibe un correo y debe activar el segundo factor antes de entrar por primera vez.
        </p>
        <span class="btn btn-pri" style="width:100%;justify-content:center;margin-top:14px">${icono('check', { size: 15, color: '#FFF' })}Aprobar la cuenta</span>
        <span class="btn btn-sec" style="width:100%;justify-content:center;margin-top:8px">Pedir más documentos</span>
        <span class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:4px;color:${T.danger}">Rechazar</span>
      </div>
    </section>
  </div>`,
});

// ── Auditoría ──────────────────────────────────────────────────────────
export const auditoria = app({
  w: 1440, h: 900, activo: 'admin', empresa: null, migas: ['Panel admin', 'Auditoría'],
  contenido: `
  ${cabecera({
    rubrica: 'Administración · Trazabilidad',
    titulo: 'Registro de auditoría',
    bajada: 'Inmutable y sin borrado. Es lo que se presenta ante una inspección del Ministerio de Trabajo o ante un requerimiento de la Superintendencia de Industria y Comercio.',
    acciones: `<span class="btn btn-sec">${icono('desc', { size: 14, color: T.secondary })}Exportar rango</span>`,
  })}
  ${filtros(['Últimas 24 horas', 'Tipo de evento', 'Usuario', 'Severidad'], { busca: 'Buscar por usuario, recurso o dirección IP…' })}
  <table>
    <tr>
      <th class="th">Momento</th><th class="th">Evento</th><th class="th">Usuario</th>
      <th class="th">Recurso</th><th class="th">IP</th><th class="th" style="padding-right:0">Severidad</th>
    </tr>
    ${[
      ['2026-09-16 08:41:12', 'Inicio de sesión', 'maria@consultorio.co', '—', '181.51.204.66', 'Informativo', 'neutro'],
      ['2026-09-16 08:42:03', 'Lectura de historia clínica', 'maria@consultorio.co', 'Trabajador CC 79.114.226', '181.51.204.66', 'Sensible', 'info'],
      ['2026-09-16 08:44:51', 'Firma de informe', 'maria@consultorio.co', 'IN-2026-0917', '181.51.204.66', 'Crítico', 'aviso'],
      ['2026-09-16 09:02:18', 'Exportación masiva de datos', 'andres@consultorio.co', '241 registros · Clínica del Norte', '190.24.88.12', 'Crítico', 'aviso'],
      ['2026-09-16 09:14:37', 'Login fallido', 'paula@consultorio.co', '—', '186.30.117.4', 'Advertencia', 'aviso'],
      ['2026-09-16 09:14:52', 'Login fallido', 'paula@consultorio.co', '—', '186.30.117.4', 'Advertencia', 'aviso'],
      ['2026-09-16 09:15:09', 'Cuenta bloqueada por intentos', 'paula@consultorio.co', '—', '186.30.117.4', 'Crítico', 'alerta'],
      ['2026-09-16 09:31:44', 'Aprobación de psicólogo', 'admin@psicosst.co', 'SR-2026-0417', '52.14.203.88', 'Crítico', 'aviso'],
    ].map(([t, e, u, r, ip, sev, tono]) => `<tr>
      <td class="td num" style="color:${T.secondary};font-size:12.5px">${t}</td>
      <td class="td" style="font-weight:500">${esc(e)}</td>
      <td class="td" style="color:${T.secondary};font-size:12.5px">${esc(u)}</td>
      <td class="td num" style="color:${T.secondary};font-size:12px">${esc(r)}</td>
      <td class="td num" style="color:${T.muted};font-size:12px">${ip}</td>
      <td class="td">${estado(sev, tono)}</td>
    </tr>`).join('')}
  </table>
  ${paginacion(1, 8, 41822)}`,
});

// ── Comentarios de los usuarios ────────────────────────────────────────
export const feedback = app({
  w: 1440, h: 1100, activo: 'admin', empresa: null, migas: ['Panel admin', 'Comentarios'],
  contenido: `
  ${cabecera({
    rubrica: 'Administración · Voz del usuario',
    titulo: 'Comentarios',
    bajada: 'Lo que los psicólogos reportan desde el widget de soporte, sin filtrar y sin resumir.',
  })}

  <div style="display:flex;gap:9px;margin-bottom:22px">
    ${[['Todos', 128, true], ['Errores', 34, false], ['Sugerencias', 71, false], ['Sin responder', 19, false]].map(([t, n, on]) => `
      <span class="chip" style="height:32px;padding:0 15px;font-size:13px;gap:8px;font-weight:${on ? 600 : 400};background:${on ? T.ink : T.surface};color:${on ? '#FFF' : T.secondary};border:1px solid ${on ? T.ink : T.border}">
        ${esc(t)}<span class="num" style="opacity:0.65">${n}</span></span>`).join('')}
  </div>

  <div style="display:flex;gap:34px">
    <section style="flex:1;min-width:0">
      ${[
        ['Andrés Lozano Peña', 'andres@saludocupacional.co', 'Error', 'alerta', '2026-09-15', 'Al importar un CSV con 3.400 filas la página se queda cargando y no da error ni éxito. Tuve que partir el archivo en tres. Debería avisar el límite antes de subir.', true],
        ['Camila Restrepo Díaz', 'camila@sstintegral.com', 'Sugerencia', 'info', '2026-09-14', 'Necesito poder comparar dos aplicaciones de la misma empresa lado a lado. Hoy tengo que abrir dos pestañas y cambiar entre ellas para escribir el apartado de evolución.', false],
        ['Sebastián Ríos Mora', 'sebastian@riesgolab.co', 'Sugerencia', 'info', '2026-09-12', 'Los informes colectivos deberían permitir filtrar por área sin generar un PDF nuevo. Las gerencias siempre piden el corte de su propia área.', false],
        ['Paula Guzmán Rojas', 'paula@psicolaboral.co', 'Error', 'alerta', '2026-09-11', 'La firma digital no carga en Safari. En Chrome funciona. El recuadro de la rúbrica aparece en blanco y no puedo trazar.', true],
      ].map(([n, c, tipo, tono, f, txt, urgente]) => `
        <div class="card" style="padding:19px 22px;margin-bottom:12px;${urgente ? `border-color:${T.danger}35` : ''}">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
            <div style="display:flex;align-items:center;gap:11px;min-width:0">
              <div style="width:26px;height:26px;border-radius:999px;background:${T.surfaceMuted};color:${T.secondary};display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;flex-shrink:0">${esc(n.split(' ').map((x) => x[0]).slice(0, 2).join(''))}</div>
              <div style="min-width:0"><p style="font-size:13px;font-weight:600;color:${T.ink}">${esc(n)}</p>
              <p style="font-size:11.5px;color:${T.muted}">${esc(c)}</p></div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
              ${estado(tipo, tono)}<span class="num" style="font-size:11.5px;color:${T.muted}">${f}</span>
            </div>
          </div>
          <p class="prose" style="font-size:14.5px;margin-top:13px">«${esc(txt)}»</p>
          <div style="display:flex;gap:9px;margin-top:13px;padding-top:12px;border-top:1px solid ${T.borderMuted}">
            <span class="btn btn-sec" style="height:29px;font-size:12px">Responder</span>
            <span class="btn btn-ghost" style="height:29px;font-size:12px">Convertir en incidencia</span>
          </div>
        </div>`).join('')}
    </section>

    <section style="width:376px;flex-shrink:0">
      ${figura('Por tipo', 'Últimos 90 días',
        barras([['Sugerencia', 71], ['Error', 34], ['Pregunta', 18], ['Otro', 5]], { w: 336, color: CAT[0], unidad: '' }), { w: 376 })}

      <div class="card" style="padding:20px 22px;margin-top:18px">
        <p class="rub rub-ink">Lo que más se repite</p>
        <div style="margin-top:12px">
          ${[['Comparar dos aplicaciones', 14], ['Filtrar el informe colectivo por área', 11], ['Límite de la carga masiva', 9], ['Firma digital en Safari', 6], ['Exportar a Excel', 5]].map(([t, n], i) => `
            <div style="display:flex;justify-content:space-between;gap:14px;padding:9px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
              <span style="font-size:12.5px;color:${T.ink}">${esc(t)}</span>
              <span class="num" style="font-size:12.5px;font-weight:600;color:${T.secondary}">${n}</span>
            </div>`).join('')}
        </div>
      </div>
    </section>
  </div>`,
});
