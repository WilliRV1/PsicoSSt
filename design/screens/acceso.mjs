import { T, RISK, RISK_ORDER, FONTS, artboard, icono, marca, isotipo, estado, esc } from '../lib.mjs';

const W = 1440, H = 900, IZQ = 588;

/**
 * Chasis de acceso.
 *
 * Mantiene la partición que ya existe en login: formulario a la izquierda
 * sobre superficie blanca, argumento a la derecha sobre papel. Lo que cambia
 * es el peso del lado derecho, que deja de ser una lista de viñetas y pasa a
 * ser una página editorial con el motivo de la escala de riesgo.
 */
function chasis({ formulario, derecha }) {
  return artboard({
    w: W, h: H,
    cuerpo: `<div style="display:flex;width:${W}px;height:${H}px">
      <div style="width:${IZQ}px;flex-shrink:0;background:${T.surface};border-right:1px solid ${T.border};display:flex;flex-direction:column;padding:40px 76px">
        ${marca({ size: 27 })}
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:28px 0">
          ${formulario}
        </div>
        <p style="font-size:11.5px;color:${T.muted}">
          Resolución 2646 de 2008 · Resolución 2764 de 2022 · Ley 1090 de 2006 · Ley 1581 de 2012
        </p>
      </div>
      <div style="flex:1;background:${T.paper};position:relative;overflow:hidden">${derecha}</div>
    </div>`,
  });
}

/** Motivo gráfico del lado derecho: la escala de riesgo como retícula. */
function motivo() {
  const cols = 19; // una columna por dimensión del Intralaboral Forma A
  const niveles = ['sin','bajo','bajo','medio','medio','alto','medio','bajo','alto','muyAlto','alto','medio','bajo','sin','medio','alto','muyAlto','alto','medio'];
  return `<div style="display:flex;gap:4px;align-items:flex-end;height:118px">
    ${Array.from({ length: cols }, (_, i) => {
      const k = niveles[i];
      const alto = 22 + RISK_ORDER.indexOf(k) * 24;
      return `<div style="flex:1;height:${alto}px;background:${RISK[k].bar};border-radius:2px;opacity:${0.35 + RISK_ORDER.indexOf(k) * 0.16}"></div>`;
    }).join('')}
  </div>`;
}

const argumento = `
  <div style="padding:72px 72px 0;height:100%;display:flex;flex-direction:column">
    <p class="rub">Batería de riesgo psicosocial · Colombia</p>
    <h2 class="display" style="font-size:56px;margin-top:20px;max-width:560px">
      De 123 respuestas<br>a un informe defendible.
    </h2>
    <p class="prose" style="max-width:520px;margin-top:22px">
      PsicoSST califica los cuatro instrumentos de la batería con los algoritmos exactos
      del manual oficial, redacta la interpretación por dimensión y deja constancia de
      cada operación. El juicio profesional sigue siendo suyo; la aritmética, no.
    </p>
    <div style="margin-top:38px;max-width:560px">${motivo()}</div>
    <p class="rub" style="margin-top:14px;max-width:560px">19 dimensiones · 4 dominios · Intralaboral Forma A</p>

    <div style="margin-top:auto;padding-bottom:64px;display:flex;flex-direction:column;gap:18px;max-width:520px">
      ${[
        ['check', 'Calificación conforme a los manuales', 'Baremos, factores de transformación e ítems invertidos tal como los publica el Ministerio.'],
        ['informe', 'Informes listos para entregar', 'PDF firmado digitalmente, con folio verificable y anexo de trazabilidad.'],
        ['escudo', 'Trazabilidad hasta la respuesta', 'Cada puntaje se puede reconstruir desde los ítems que lo originaron.'],
      ].map(([ic, t, d]) => `<div style="display:flex;gap:13px;align-items:flex-start">
        <div style="width:26px;height:26px;border-radius:7px;background:${T.tealLight};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${icono(ic, { size: 14, color: T.tealDark })}
        </div>
        <div>
          <p style="font-size:13.5px;font-weight:600;color:${T.ink}">${esc(t)}</p>
          <p style="font-size:12.5px;line-height:1.55;color:${T.secondary};margin-top:3px">${esc(d)}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>`;

function campo(label, valor, { pista = '', foco = false, tipo = 'texto' } = {}) {
  return `<div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
      <p class="lbl">${esc(label)}</p>
      ${pista ? `<span style="font-size:12px;color:${T.tealDark}">${esc(pista)}</span>` : ''}
    </div>
    <div class="input" style="height:44px;font-size:14px;color:${valor ? T.ink : T.muted};${foco ? `border-color:${T.teal};box-shadow:0 0 0 3px rgba(0,154,128,0.12)` : ''};justify-content:space-between">
      <span>${esc(valor)}</span>
      ${tipo === 'clave' ? icono('ojo', { size: 15, color: T.muted }) : ''}
    </div>
  </div>`;
}

// ── Ingresar ───────────────────────────────────────────────────────────
export const login = chasis({
  derecha: argumento,
  formulario: `
    <h1 class="display" style="font-size:38px">Entre a su consultorio</h1>
    <p style="font-size:13.5px;line-height:1.6;color:${T.secondary};margin-top:10px;max-width:400px">
      El acceso está restringido a psicólogos con licencia vigente en Seguridad y Salud en el Trabajo.
    </p>
    <div style="display:flex;flex-direction:column;gap:17px;margin-top:30px;max-width:400px">
      ${campo('Correo electrónico', 'psicologa@consultorio.co', { foco: true })}
      ${campo('Contraseña', '••••••••••', { pista: '¿La olvidó?', tipo: 'clave' })}
      <span class="btn btn-pri" style="height:46px;justify-content:center;font-size:15px;margin-top:5px">Ingresar</span>
      <p style="font-size:13px;color:${T.secondary};text-align:center">
        ¿Aún no tiene cuenta? <span style="color:${T.tealDark};font-weight:500">Solicite acceso</span>
      </p>
      <div style="display:flex;gap:10px;align-items:flex-start;padding-top:15px;border-top:1px solid ${T.borderMuted};margin-top:5px">
        ${icono('escudo', { size: 15, color: T.muted })}
        <p style="font-size:12px;line-height:1.55;color:${T.muted}">
          Sus credenciales protegen historias clínicas ocupacionales. Verificamos tarjeta
          profesional y posgrado antes de habilitar la cuenta.
        </p>
      </div>
    </div>`,
});

// ── Solicitar acceso ───────────────────────────────────────────────────
export const registro = chasis({
  derecha: `
    <div style="padding:72px 72px 0;height:100%;display:flex;flex-direction:column">
      <p class="rub">Verificación profesional</p>
      <h2 class="display" style="font-size:52px;margin-top:20px;max-width:520px">
        Tres documentos<br>y una revisión humana.
      </h2>
      <p class="prose" style="max-width:500px;margin-top:20px">
        Ningún registro se aprueba solo. Un administrador verifica la tarjeta profesional
        ante el Colegio Colombiano de Psicólogos y el posgrado en SST antes de habilitar
        el acceso a datos de salud de terceros.
      </p>
      <div style="margin-top:40px;max-width:520px;display:flex;flex-direction:column;gap:0">
        ${[
          ['01', 'Tarjeta profesional de psicólogo', 'Número y fecha de expedición.'],
          ['02', 'Posgrado en Seguridad y Salud en el Trabajo', 'Acta de grado o diploma.'],
          ['03', 'Licencia vigente en SST', 'Expedida por la secretaría de salud departamental.'],
        ].map(([n, t, d]) => `<div style="display:flex;gap:20px;padding:19px 0;border-top:1px solid ${T.border}">
          <span class="num" style="font-size:12px;color:${T.muted};padding-top:2px">${n}</span>
          <div><p style="font-size:14.5px;font-weight:600;color:${T.ink}">${esc(t)}</p>
          <p style="font-size:12.5px;color:${T.secondary};margin-top:3px">${esc(d)}</p></div>
        </div>`).join('')}
      </div>
      <p style="font-size:12px;line-height:1.6;color:${T.muted};margin-top:auto;padding-bottom:64px;max-width:500px">
        La revisión toma entre 24 y 48 horas hábiles. Recibirá una notificación por correo
        con el resultado, aprobado o no.
      </p>
    </div>`,
  formulario: `
    <h1 class="display" style="font-size:38px">Solicite acceso</h1>
    <p style="font-size:13.5px;color:${T.secondary};margin-top:10px">Paso <span class="num">1</span> de <span class="num">2</span> · Datos de la cuenta</p>
    <div style="display:flex;gap:6px;margin-top:16px;max-width:400px">
      <div style="flex:1;height:3px;border-radius:2px;background:${T.teal}"></div>
      <div style="flex:1;height:3px;border-radius:2px;background:${T.border}"></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:15px;margin-top:26px;max-width:400px">
      ${campo('Nombre completo', 'María Torres Gómez', { foco: true })}
      ${campo('Correo electrónico', 'psicologa@consultorio.co')}
      <div style="display:flex;gap:12px">
        <div style="flex:1">${campo('Tarjeta profesional', '118432')}</div>
        <div style="flex:1">${campo('Licencia SST', '2019-4471')}</div>
      </div>
      ${campo('Contraseña', '••••••••••', { tipo: 'clave' })}
      <div style="display:flex;gap:9px;align-items:flex-start;margin-top:3px">
        <span style="width:15px;height:15px;border-radius:4px;border:1px solid ${T.teal};background:${T.teal};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">${icono('check', { size: 10, color: '#FFF', w: 2.6 })}</span>
        <p style="font-size:12px;line-height:1.5;color:${T.secondary}">
          Acepto los <span style="color:${T.tealDark}">términos</span> y la
          <span style="color:${T.tealDark}">política de tratamiento de datos</span> (Ley 1581 de 2012).
        </p>
      </div>
      <span class="btn btn-pri" style="height:46px;justify-content:center;font-size:15px;margin-top:5px">Continuar</span>
    </div>`,
});

// ── Recuperar contraseña ───────────────────────────────────────────────
export const recuperar = chasis({
  derecha: `
    <div style="padding:72px;height:100%;display:flex;flex-direction:column;justify-content:center">
      <p class="rub">Seguridad de la cuenta</p>
      <h2 class="display" style="font-size:50px;margin-top:20px;max-width:480px">
        El enlace<br>caduca en 30 minutos.
      </h2>
      <p class="prose" style="max-width:480px;margin-top:20px">
        Enviamos un código de seis dígitos al correo registrado. No lo comparta: quien lo
        tenga puede restablecer el acceso a todas las historias clínicas de su cartera.
      </p>
      <div style="margin-top:34px;padding:19px 22px;border:1px solid ${T.border};border-radius:10px;background:${T.surface};max-width:480px;display:flex;gap:13px">
        ${icono('alerta', { size: 17, color: T.warning })}
        <p style="font-size:12.5px;line-height:1.6;color:${T.secondary}">
          Si no solicitó este cambio, ignore el correo y avise al administrador. Todo
          intento de restablecimiento queda en el registro de auditoría con IP y hora.
        </p>
      </div>
    </div>`,
  formulario: `
    <h1 class="display" style="font-size:38px">Restablezca su contraseña</h1>
    <p style="font-size:13.5px;line-height:1.6;color:${T.secondary};margin-top:10px;max-width:400px">
      Escriba el correo con el que se registró y le enviaremos un código de verificación.
    </p>
    <div style="display:flex;flex-direction:column;gap:17px;margin-top:28px;max-width:400px">
      ${campo('Correo electrónico', 'psicologa@consultorio.co', { foco: true })}
      <span class="btn btn-pri" style="height:46px;justify-content:center;font-size:15px">Enviar código</span>
      <p style="font-size:13px;color:${T.secondary};text-align:center">
        <span style="color:${T.tealDark};font-weight:500">Volver a ingresar</span>
      </p>
    </div>`,
});

// ── Configurar segundo factor ──────────────────────────────────────────
function qr() {
  // Retícula determinista: un QR de adorno legible como marca, no escaneable.
  const n = 21;
  const celdas = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const esquina = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
    const borde = esquina && (x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5));
    const on = esquina ? borde : ((x * 7 + y * 13 + ((x * y) % 5)) % 3 === 0);
    if (on) celdas.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${T.ink}"/>`);
  }
  return `<svg viewBox="0 0 ${n} ${n}" width="160" height="160" shape-rendering="crispEdges">${celdas.join('')}</svg>`;
}

export const mfaSetup = chasis({
  derecha: `
    <div style="padding:72px;height:100%;display:flex;flex-direction:column;justify-content:center">
      <p class="rub">Segundo factor</p>
      <h2 class="display" style="font-size:50px;margin-top:20px;max-width:500px">
        La contraseña<br>ya no alcanza.
      </h2>
      <p class="prose" style="max-width:480px;margin-top:20px">
        Una cuenta de PsicoSST abre historias clínicas ocupacionales de cientos de personas.
        El segundo factor es obligatorio y no se puede desactivar desde la propia cuenta.
      </p>
      <div style="margin-top:36px;max-width:480px">
        ${[
          ['Aplicación de autenticación', 'Google Authenticator, 1Password, Authy. Funciona sin señal.', true],
          ['Código por correo', 'Alternativa si no puede instalar una aplicación.', false],
        ].map(([t, d, rec]) => `<div style="display:flex;gap:14px;padding:17px 0;border-top:1px solid ${T.border}">
          <div style="width:24px;height:24px;border-radius:999px;border:1px solid ${rec ? T.teal : T.border};background:${rec ? T.teal : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            ${rec ? icono('check', { size: 12, color: '#FFF', w: 2.6 }) : ''}
          </div>
          <div><p style="font-size:14px;font-weight:600;color:${T.ink}">${esc(t)}${rec ? ` <span class="rub" style="color:${T.tealDark};margin-left:6px">Recomendado</span>` : ''}</p>
          <p style="font-size:12.5px;color:${T.secondary};margin-top:3px">${esc(d)}</p></div>
        </div>`).join('')}
      </div>
    </div>`,
  formulario: `
    <h1 class="display" style="font-size:38px">Active el segundo factor</h1>
    <p style="font-size:13.5px;line-height:1.6;color:${T.secondary};margin-top:10px;max-width:400px">
      Escanee el código con su aplicación de autenticación y escriba los seis dígitos que aparezcan.
    </p>
    <div style="display:flex;gap:26px;margin-top:26px;align-items:flex-start;max-width:400px">
      <div style="padding:13px;border:1px solid ${T.border};border-radius:10px;background:${T.surface};flex-shrink:0">${qr()}</div>
      <div style="padding-top:4px">
        <p class="lbl" style="margin-bottom:7px">Clave manual</p>
        <p class="num" style="font-size:12.5px;line-height:1.75;color:${T.ink};word-break:break-all">JBSW Y3DP EHPK 3PXP</p>
        <p style="font-size:11.5px;line-height:1.55;color:${T.muted};margin-top:10px">
          Úsela si no puede escanear el código desde este equipo.
        </p>
      </div>
    </div>
    <div style="margin-top:24px;max-width:400px">
      <p class="lbl" style="margin-bottom:9px">Código de verificación</p>
      <div style="display:flex;gap:9px">
        ${['4', '8', '2', '9', '', ''].map((d, i) => `<div style="flex:1;height:52px;border:1px solid ${i === 4 ? T.teal : T.border};${i === 4 ? 'box-shadow:0 0 0 3px rgba(0,154,128,0.12);' : ''}border-radius:8px;background:${T.surface};display:flex;align-items:center;justify-content:center"><span class="num" style="font-size:21px;font-weight:600;color:${T.ink}">${d}</span></div>`).join('')}
      </div>
      <span class="btn btn-pri" style="height:46px;justify-content:center;font-size:15px;width:100%;margin-top:17px">Activar y continuar</span>
    </div>`,
});

// ── Verificar segundo factor ───────────────────────────────────────────
export const mfaVerify = chasis({
  derecha: `
    <div style="padding:72px;height:100%;display:flex;flex-direction:column;justify-content:center">
      <p class="rub">Sesión en curso</p>
      <h2 class="display" style="font-size:50px;margin-top:20px;max-width:480px">Un paso más.</h2>
      <p class="prose" style="max-width:470px;margin-top:20px">
        Pedimos el segundo factor en cada inicio de sesión desde un equipo nuevo, y una vez
        cada treinta días desde los equipos que ya reconoce.
      </p>
      <div style="margin-top:36px;max-width:470px;padding:20px 22px;border:1px solid ${T.border};border-radius:10px;background:${T.surface}">
        <p class="rub" style="margin-bottom:12px">Este intento</p>
        ${[['Equipo', 'macOS · Chrome 141'], ['Dirección IP', '181.51.204.66'], ['Ubicación aproximada', 'Bogotá, Colombia'], ['Hora', '2026-09-16 08:41']].map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12.5px">
            <span style="color:${T.muted}">${esc(k)}</span><span class="num" style="color:${T.ink}">${esc(v)}</span>
          </div>`).join('')}
      </div>
      <p style="font-size:12px;color:${T.muted};margin-top:16px;max-width:470px">
        ¿No reconoce este intento? <span style="color:${T.tealDark}">Bloquee la cuenta</span> y cambie su contraseña.
      </p>
    </div>`,
  formulario: `
    <h1 class="display" style="font-size:38px">Verifique su identidad</h1>
    <p style="font-size:13.5px;line-height:1.6;color:${T.secondary};margin-top:10px;max-width:400px">
      Ingrese el código de seis dígitos de su aplicación de autenticación.
    </p>
    <div style="margin-top:30px;max-width:400px">
      <div style="display:flex;gap:9px">
        ${['7', '1', '4', '', '', ''].map((d, i) => `<div style="flex:1;height:58px;border:1px solid ${i === 3 ? T.teal : T.border};${i === 3 ? 'box-shadow:0 0 0 3px rgba(0,154,128,0.12);' : ''}border-radius:8px;background:${T.surface};display:flex;align-items:center;justify-content:center"><span class="num" style="font-size:23px;font-weight:600;color:${T.ink}">${d}</span></div>`).join('')}
      </div>
      <span class="btn btn-pri" style="height:46px;justify-content:center;font-size:15px;width:100%;margin-top:20px">Verificar</span>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">
        <span style="font-size:12.5px;color:${T.tealDark}">Enviar el código por correo</span>
        <span class="num" style="font-size:12.5px;color:${T.muted}">Reenviar en 0:47</span>
      </div>
    </div>`,
});

// ── Cuenta en revisión ─────────────────────────────────────────────────
export const pendiente = artboard({
  w: W, h: H,
  cuerpo: `<div style="width:${W}px;height:${H}px;display:flex;align-items:center;justify-content:center;background:${T.paper}">
    <div style="width:720px">
      ${marca({ size: 30 })}
      <div style="margin-top:44px;padding:44px 48px;background:${T.surface};border:1px solid ${T.border};border-radius:14px">
        <div style="display:flex;align-items:center;gap:11px">
          <span style="width:8px;height:8px;border-radius:999px;background:${T.warning}"></span>
          <p class="rub" style="color:${T.warning}">En revisión</p>
        </div>
        <h1 class="display" style="font-size:44px;margin-top:16px">Su solicitud está con un administrador</h1>
        <p class="prose" style="margin-top:16px;max-width:560px">
          Estamos verificando su tarjeta profesional ante el Colegio Colombiano de Psicólogos
          y su posgrado en Seguridad y Salud en el Trabajo. Es una revisión humana: toma entre
          24 y 48 horas hábiles y le avisamos por correo en cuanto haya respuesta.
        </p>
        <div style="margin-top:30px;border-top:1px solid ${T.border}">
          ${[
            ['Tarjeta profesional de psicólogo', 'Recibido', 'ok'],
            ['Posgrado en Seguridad y Salud en el Trabajo', 'Recibido', 'ok'],
            ['Licencia vigente en SST', 'En verificación', 'aviso'],
          ].map(([t, e, tono]) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:15px 0;border-bottom:1px solid ${T.borderMuted}">
            <span style="font-size:13.5px;color:${T.ink}">${esc(t)}</span>${estado(e, tono)}
          </div>`).join('')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:28px">
          <p style="font-size:12.5px;color:${T.muted}">
            Solicitud <span class="num">#SR-2026-0418</span> · enviada el <span class="num">15 sep 2026</span>
          </p>
          <span class="btn btn-sec">${icono('salir', { size: 14, color: T.secondary })}Cerrar sesión</span>
        </div>
      </div>
      <p style="font-size:12px;color:${T.muted};margin-top:20px;text-align:center">
        ¿Lleva más de 48 horas? Escriba a <span style="color:${T.tealDark}">soporte@psicosst.co</span>
      </p>
    </div>
  </div>`,
});
