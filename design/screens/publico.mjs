import { T, RISK, RISK_ORDER, FONTS, app, artboard, icono, marca, isotipo, estado, esc, n1 } from '../lib.mjs';

const MW = 390, MH = 844;

/**
 * Chasis móvil del flujo del trabajador.
 *
 * Sin barra de estado ni teclado dibujados: en un teléfono real los pinta el
 * sistema encima, y una copia pintada se ve doble. El espacio superior se
 * reserva vacío.
 */
function movil(cuerpo, { fondo = T.paper } = {}) {
  return artboard({
    w: MW, h: MH,
    cuerpo: `<div style="width:${MW}px;height:${MH}px;background:${fondo};display:flex;flex-direction:column;overflow:hidden">
      <div style="height:48px;flex-shrink:0"></div>
      ${cuerpo}
    </div>`,
  });
}

// ── 1 · La invitación ──────────────────────────────────────────────────
export const invitacion = movil(`
  <div style="flex:1;display:flex;flex-direction:column;padding:0 24px 28px">
    <div style="padding:8px 0 30px">${marca({ size: 26 })}</div>

    <h1 class="display" style="font-size:40px">Evaluación de riesgo psicosocial</h1>
    <p style="font-size:14px;color:${T.secondary};margin-top:12px">Clínica del Norte le invita a responderla</p>
    <p class="prose" style="font-size:16px;margin-top:16px">
      Su empresa está obligada por ley a medir los factores de riesgo psicosocial. Sus respuestas
      las lee un psicólogo, no su jefe.
    </p>

    <div style="margin-top:26px;border-top:1px solid ${T.border}">
      ${[
        ['reloj', 'Entre 25 y 35 minutos', 'Puede pausar y retomar desde el mismo enlace.'],
        ['candado', 'Su jefe no verá sus respuestas', 'La empresa recibe solo el resultado del grupo, nunca el suyo.'],
        ['escudo', 'Puede negarse sin consecuencias', 'Participar es voluntario y la negativa no se informa a la empresa.'],
      ].map(([ic, t, d]) => `<div style="display:flex;gap:13px;padding:16px 0;border-bottom:1px solid ${T.borderMuted}">
        <div style="width:30px;height:30px;border-radius:8px;background:${T.tealLight};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${icono(ic, { size: 15, color: T.tealDark })}
        </div>
        <div><p style="font-size:14px;font-weight:600;color:${T.ink}">${esc(t)}</p>
        <p style="font-size:13px;line-height:1.5;color:${T.secondary};margin-top:3px">${esc(d)}</p></div>
      </div>`).join('')}
    </div>

    <div style="margin-top:auto;padding-top:26px">
      <span class="btn btn-pri" style="width:100%;height:52px;justify-content:center;font-size:16px">Comenzar</span>
      <p style="font-size:12px;color:${T.muted};text-align:center;margin-top:14px">
        Enlace válido hasta el <span class="num">30 de septiembre de 2026</span>
      </p>
    </div>
  </div>`);

// ── 2 · Consentimiento informado ───────────────────────────────────────
export const consentimiento = movil(`
  <div style="flex:1;display:flex;flex-direction:column;min-height:0">
    <div style="padding:0 24px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13px;color:${T.secondary}">Paso <span class="num">1</span> de <span class="num">3</span></span>
        ${isotipo(22)}
      </div>
      <div style="display:flex;gap:5px;margin-top:12px">
        ${[T.teal, T.border, T.border].map((c) => `<div style="flex:1;height:3px;border-radius:2px;background:${c}"></div>`).join('')}
      </div>
    </div>

    <div style="flex:1;overflow:hidden;padding:12px 24px 0">
      <h1 class="display" style="font-size:31px">Consentimiento informado</h1>
      <p class="prose" style="font-size:14.5px;margin-top:12px">
        Necesitamos su autorización expresa para tratar sus datos de salud. Puede cerrar esta
        página sin firmar.
      </p>

      <div style="margin-top:18px">
        ${[
          ['Para qué se usan sus respuestas', 'Para calificar su nivel de riesgo psicosocial conforme a la Resolución 2646 de 2008 y construir el diagnóstico colectivo de su empresa.'],
          ['Quién las puede ver', 'Únicamente el psicólogo responsable, con licencia vigente en SST. Su empresa recibe resultados agregados de grupos de cinco personas o más.'],
          ['Cuánto tiempo se conservan', 'Veinte años, el plazo que la Resolución 1995 de 1999 fija para la historia clínica. La custodia es del psicólogo (Ley 1090 de 2006).'],
          ['Sus derechos', 'Puede conocer, actualizar, rectificar y pedir la supresión de sus datos cuando quiera (Ley 1581 de 2012).'],
        ].map(([t, d], i) => `<div style="padding:9px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <p style="font-size:13.5px;font-weight:600;color:${T.ink}">${esc(t)}</p>
          <p style="font-size:12.5px;line-height:1.5;color:${T.secondary};margin-top:4px">${esc(d)}</p>
        </div>`).join('')}
      </div>
    </div>

    <div style="flex-shrink:0;padding:14px 24px 20px;border-top:1px solid ${T.border};background:${T.surface}">
      <div style="display:flex;gap:11px;align-items:flex-start">
        <span style="width:22px;height:22px;border-radius:6px;border:1.5px solid ${T.teal};background:${T.teal};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
          ${icono('check', { size: 13, color: '#FFF', w: 2.8 })}
        </span>
        <p style="font-size:13px;line-height:1.5;color:${T.ink}">
          Autorizo el tratamiento de mis datos personales y de salud en los términos descritos.
        </p>
      </div>
      <span class="btn btn-pri" style="width:100%;height:50px;justify-content:center;font-size:15.5px;margin-top:16px">Acepto y continúo</span>
      <p style="font-size:12px;color:${T.muted};text-align:center;margin-top:12px">No acepto y salgo</p>
    </div>
  </div>`);

// ── 3 · Ficha sociodemográfica ─────────────────────────────────────────
function campoMovil(label, valor, { placeholder = false } = {}) {
  return `<div style="margin-bottom:16px">
    <p class="lbl" style="margin-bottom:7px">${esc(label)}</p>
    <div style="height:48px;border:1px solid ${T.border};border-radius:9px;background:${T.surface};padding:0 14px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:15px;color:${placeholder ? T.muted : T.ink}">${esc(valor)}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${T.muted}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </div>
  </div>`;
}

export const fichaSociodemografica = movil(`
  <div style="flex:1;display:flex;flex-direction:column;min-height:0">
    <div style="padding:0 24px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13px;color:${T.secondary}">Paso <span class="num">2</span> de <span class="num">3</span></span>
        ${isotipo(22)}
      </div>
      <div style="display:flex;gap:5px;margin-top:12px">
        ${[T.teal, T.teal, T.border].map((c) => `<div style="flex:1;height:3px;border-radius:2px;background:${c}"></div>`).join('')}
      </div>
    </div>

    <div style="flex:1;overflow:hidden;padding:12px 24px 0">
      <h1 class="display" style="font-size:31px">Sus datos</h1>
      <p style="font-size:13.5px;line-height:1.55;color:${T.secondary};margin-top:10px">
        Sirven para entender el resultado del grupo. Se piden una sola vez.
      </p>
      <div style="margin-top:22px">
        ${campoMovil('Sexo', 'Mujer')}
        ${campoMovil('Año de nacimiento', '1988')}
        ${campoMovil('Estado civil', 'Unión libre')}
        ${campoMovil('Último nivel de estudios', 'Profesional')}
        ${campoMovil('Personas a su cargo', 'Dos')}
        ${campoMovil('Tipo de vivienda', 'Seleccione', { placeholder: true })}
      </div>
    </div>

    <div style="flex-shrink:0;padding:16px 24px 26px;border-top:1px solid ${T.border};background:${T.surface};display:flex;gap:11px">
      <span class="btn btn-sec" style="width:104px;height:50px;justify-content:center">Atrás</span>
      <span class="btn btn-pri" style="flex:1;height:50px;justify-content:center;font-size:15.5px">Continuar</span>
    </div>
  </div>`);

// ── 4 · El cuestionario ────────────────────────────────────────────────
const OPC = ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'];

export const cuestionario = movil(`
  <div style="flex:1;display:flex;flex-direction:column;min-height:0">
    <div style="padding:0 24px 18px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span class="num" style="font-size:13px;color:${T.secondary}">18 de 123</span>
        <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:${T.muted}">
          ${icono('check', { size: 13, color: T.success })}<span>Guardado</span>
        </div>
      </div>
      <div style="height:4px;border-radius:2px;background:${T.surfaceMuted};margin-top:12px;overflow:hidden">
        <div style="width:14.6%;height:100%;background:${T.teal}"></div>
      </div>
    </div>

    <div style="flex:1;padding:0 24px;display:flex;flex-direction:column;min-height:0">
      <div style="padding:14px 0 26px">
        <p style="font-size:25px;line-height:1.32;letter-spacing:-0.02em;color:${T.ink};font-weight:500">
          Por la cantidad de trabajo que tengo debo quedarme tiempo adicional.
        </p>
        <p class="rub" style="margin-top:14px">¿Con qué frecuencia?</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:9px">
        ${OPC.map((o, i) => {
          const on = i === 0;
          return `<div style="height:56px;border-radius:11px;border:1.5px solid ${on ? T.teal : T.border};background:${on ? T.tealLight : T.surface};display:flex;align-items:center;gap:14px;padding:0 18px">
            <span style="width:22px;height:22px;border-radius:999px;border:1.5px solid ${on ? T.teal : T.border};background:${on ? T.teal : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${on ? '<span style="width:8px;height:8px;border-radius:999px;background:#FFF"></span>' : ''}
            </span>
            <span style="font-size:16px;font-weight:${on ? 600 : 400};color:${on ? T.tealDark : T.ink}">${esc(o)}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div style="flex-shrink:0;padding:18px 24px 26px;display:flex;align-items:center;justify-content:space-between">
      <span style="display:flex;align-items:center;gap:8px;font-size:14px;color:${T.secondary};height:44px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${T.secondary}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>
        Anterior
      </span>
      <span class="btn btn-pri" style="height:48px;padding:0 24px;font-size:15.5px">Siguiente${icono('flecha', { size: 15, color: '#FFF' })}</span>
    </div>
  </div>`);

// ── 5 · Cierre ─────────────────────────────────────────────────────────
export const finalizado = movil(`
  <div style="flex:1;display:flex;flex-direction:column;padding:0 24px 32px;justify-content:center">
    <div style="width:56px;height:56px;border-radius:16px;background:${T.tealLight};display:flex;align-items:center;justify-content:center">
      ${icono('check', { size: 28, color: T.tealDark, w: 2.2 })}
    </div>
    <h1 class="display" style="font-size:40px;margin-top:24px">Listo. Gracias.</h1>
    <p class="prose" style="font-size:16px;margin-top:14px">
      Respondió los <span class="num">185</span> ítems de los tres cuestionarios. A partir de aquí
      el trabajo es del psicólogo responsable.
    </p>

    <div style="margin-top:30px;border-top:1px solid ${T.border}">
      ${[
        ['Sus respuestas ya no se pueden modificar', 'La batería se califica sobre el conjunto cerrado de respuestas.'],
        ['No recibirá su resultado individual por aquí', 'Si quiere conocerlo, puede pedírselo directamente al psicólogo responsable.'],
        ['Su empresa recibirá el diagnóstico del grupo', 'Sin nombres y solo sobre grupos de cinco personas o más.'],
      ].map(([t, d]) => `<div style="padding:15px 0;border-bottom:1px solid ${T.borderMuted}">
        <p style="font-size:14px;font-weight:600;color:${T.ink}">${esc(t)}</p>
        <p style="font-size:13px;line-height:1.5;color:${T.secondary};margin-top:3px">${esc(d)}</p>
      </div>`).join('')}
    </div>

    <div style="margin-top:28px;padding:17px 19px;border-radius:11px;background:${T.surface};border:1px solid ${T.border}">
      <p style="font-size:13.5px;font-weight:600;color:${T.ink}">¿Necesita hablar con alguien?</p>
      <p style="font-size:13px;line-height:1.55;color:${T.secondary};margin-top:5px">
        Línea nacional de salud mental <span class="num">192</span>, opción <span class="num">4</span> · gratuita, 24 horas.
      </p>
    </div>

    <div style="margin-top:auto;padding-top:26px;display:flex;justify-content:center">${marca({ size: 22 })}</div>
  </div>`);

// ── Invitación a una empresa (escritorio) ──────────────────────────────
export const invitacionEmpresa = artboard({
  w: 1440, h: 900,
  cuerpo: `<div style="width:1440px;height:900px;background:${T.paper};display:flex;align-items:center;justify-content:center">
    <div style="width:760px">
      ${marca({ size: 28 })}
      <div style="margin-top:36px;padding:44px 48px;background:${T.surface};border:1px solid ${T.border};border-radius:14px">
        <p class="rub">Invitación de María Torres Gómez · Psicóloga SST</p>
        <h1 class="display" style="font-size:44px;margin-top:14px">Registre a su empresa en PsicoSST</h1>
        <p class="prose" style="margin-top:16px;max-width:600px">
          Al aceptar, su empresa queda vinculada al consultorio de María Torres para la aplicación
          de la Batería de Riesgo Psicosocial. Usted seguirá siendo el responsable del tratamiento
          de los datos de sus trabajadores; PsicoSST actúa como encargado.
        </p>

        <div style="display:flex;gap:26px;margin-top:30px;padding:22px 0;border-top:1px solid ${T.border};border-bottom:1px solid ${T.border}">
          ${[['Empresa', 'Alimentos del Caribe S.A.'], ['NIT', '805.119.883-2'], ['Trabajadores estimados', '98'], ['Vigencia del enlace', '7 días']].map(([k, v]) => `
            <div style="flex:1"><p class="rub">${esc(k)}</p>
            <p class="num" style="font-size:15px;color:${T.ink};margin-top:7px">${esc(v)}</p></div>`).join('')}
        </div>

        <p class="rub rub-ink" style="margin-top:26px">Lo que la empresa recibe</p>
        <div style="display:flex;gap:18px;margin-top:14px">
          ${[
            ['informe', 'Diagnóstico colectivo', 'Resultados por dominio, dimensión y área, sin nombres.'],
            ['plan', 'Plan de intervención', 'Medidas con responsable, plazo y evidencia.'],
            ['escudo', 'Soporte ante inspección', 'Informes firmados con folio verificable.'],
          ].map(([ic, t, d]) => `<div style="flex:1;padding:17px 19px;border:1px solid ${T.border};border-radius:10px;background:${T.paper}">
            ${icono(ic, { size: 17, color: T.tealDark })}
            <p style="font-size:14px;font-weight:600;color:${T.ink};margin-top:11px">${esc(t)}</p>
            <p style="font-size:12.5px;line-height:1.55;color:${T.secondary};margin-top:5px">${esc(d)}</p>
          </div>`).join('')}
        </div>

        <div style="display:flex;gap:11px;align-items:flex-start;margin-top:26px">
          <span style="width:17px;height:17px;border-radius:5px;border:1px solid ${T.border};flex-shrink:0;margin-top:1px"></span>
          <p style="font-size:12.5px;line-height:1.55;color:${T.secondary}">
            Declaro que cuento con la autorización de tratamiento de datos de mis trabajadores
            (Ley 1581 de 2012) y acepto los <span style="color:${T.tealDark}">términos del servicio</span>.
          </p>
        </div>
        <div style="display:flex;gap:10px;margin-top:22px">
          <span class="btn btn-pri" style="height:46px;font-size:15px">Aceptar y registrar la empresa</span>
          <span class="btn btn-ghost" style="height:46px">Rechazar la invitación</span>
        </div>
      </div>
    </div>
  </div>`,
});

// ── Portada pública ────────────────────────────────────────────────────
export const portada = artboard({
  w: 1440, h: 1830,
  cuerpo: `<div style="width:1440px;height:1830px;background:${T.paper};overflow:hidden">
    <header style="height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 64px;border-bottom:1px solid ${T.border}">
      ${marca({ size: 27 })}
      <div style="display:flex;align-items:center;gap:28px">
        ${['La batería', 'Cumplimiento', 'Precios'].map((n) => `<span style="font-size:13.5px;color:${T.secondary}">${esc(n)}</span>`).join('')}
        <span style="font-size:13.5px;color:${T.ink};font-weight:500">Ingresar</span>
        <span class="btn btn-pri">Solicitar acceso</span>
      </div>
    </header>

    <section style="padding:76px 64px 0;display:flex;gap:64px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <p class="rub">Resolución 2646 de 2008 · Colombia</p>
        <h1 class="display" style="font-size:78px;margin-top:20px;max-width:700px">
          La batería,<br>calificada bien<br>la primera vez.
        </h1>
        <p class="prose" style="font-size:18px;max-width:520px;margin-top:24px">
          PsicoSST aplica los algoritmos exactos del manual oficial a los cuatro instrumentos de la
          Batería de Riesgo Psicosocial, redacta la interpretación por dimensión y emite el informe
          firmado con folio verificable. Para psicólogos con licencia vigente en SST.
        </p>
        <div style="display:flex;gap:11px;margin-top:30px">
          <span class="btn btn-pri" style="height:48px;font-size:15.5px;padding:0 22px">Solicitar acceso</span>
          <span class="btn btn-sec" style="height:48px;font-size:15.5px;padding:0 22px">Ver un informe de ejemplo</span>
        </div>
        <p style="font-size:12.5px;color:${T.muted};margin-top:16px">
          Verificamos tarjeta profesional y posgrado en SST antes de habilitar la cuenta.
        </p>
      </div>

      <div style="width:520px;flex-shrink:0;padding:30px 32px;background:${T.surface};border:1px solid ${T.border};border-radius:14px">
        <p class="rub rub-ink">Los cuatro instrumentos</p>
        <div style="margin-top:16px">
          ${[
            ['Intralaboral Forma A', '123 ítems', 'Profesionales, jefaturas y técnicos'],
            ['Intralaboral Forma B', '97 ítems', 'Auxiliares y operativos'],
            ['Extralaboral', '31 ítems', 'Todos los trabajadores'],
            ['Cuestionario de estrés', '31 ítems', 'Todos los trabajadores'],
          ].map(([n, it, p], i) => `<div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding:13px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
            <div><p style="font-size:14.5px;font-weight:600;color:${T.ink}">${esc(n)}</p>
            <p style="font-size:12.5px;color:${T.secondary};margin-top:2px">${esc(p)}</p></div>
            <span class="num" style="font-size:13px;color:${T.tealDark};flex-shrink:0">${esc(it)}</span>
          </div>`).join('')}
        </div>
        <div style="margin-top:20px;padding-top:18px;border-top:1px solid ${T.border}">
          <p class="rub" style="margin-bottom:11px">19 dimensiones · 4 dominios</p>
          <div style="display:flex;gap:4px;align-items:flex-end;height:74px">
            ${['sin','bajo','bajo','medio','medio','alto','medio','bajo','alto','muyAlto','alto','medio','bajo','sin','medio','alto','muyAlto','alto','medio'].map((k) => `
              <div style="flex:1;height:${16 + RISK_ORDER.indexOf(k) * 14}px;background:${RISK[k].bar};border-radius:2px"></div>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section style="padding:72px 64px 0">
      <div style="border-top:1.5px solid ${T.ink}">
        ${[
          ['Conforme al manual, verificado', 'El motor se contrasta contra los 248 casos publicados en el manual oficial en cada despliegue. Una sola discrepancia bloquea la salida a producción.'],
          ['Trazable hasta la respuesta', 'Cada puntaje se reconstruye desde los ítems que lo originaron, con baremo, versión del motor y huella del cálculo.'],
          ['Firmado y verificable', 'La firma digital emite un folio con QR que un inspector puede validar sin tener acceso al sistema.'],
        ].map(([t, d], i) => `<div style="display:flex;gap:56px;align-items:baseline;padding:26px 0;${i ? `border-top:1px solid ${T.border}` : ''}">
          <p class="display" style="flex:1;font-size:30px;min-width:0">${esc(t)}</p>
          <p class="prose" style="flex:1.1;font-size:16px;min-width:0">${esc(d)}</p>
        </div>`).join('')}
      </div>
    </section>

    <section style="padding:72px 64px 0">
      <div style="padding:46px 52px;background:${T.ink};border-radius:16px;display:flex;align-items:center;gap:56px">
        <div style="flex:1">
          <p class="rub" style="color:#5B7085">Lo que cambia en la práctica</p>
          <h2 class="display" style="font-size:44px;color:#EEF4F9;margin-top:14px;max-width:520px">
            De tres días de hoja de cálculo a una tarde.
          </h2>
          <p style="font-family:${FONTS.serif};font-size:16.5px;line-height:1.62;color:#A8BBCA;margin-top:16px;max-width:520px">
            Calificar 400 cuestionarios a mano, con sus ítems invertidos y sus factores de transformación,
            es donde aparecen los errores que una inspección encuentra. Ese trabajo es aritmética, y la
            aritmética no necesita a un psicólogo.
          </p>
        </div>
        <div style="width:380px;flex-shrink:0">
          ${[['Cuestionarios calificados', '148.320'], ['Informes firmados', '31.744'], ['Psicólogos activos', '84'], ['Errores de calificación', '0']].map(([k, v], i) => `
            <div style="display:flex;align-items:baseline;justify-content:space-between;padding:14px 0;${i ? 'border-top:1px solid #1A2B3C' : ''}">
              <span style="font-size:13px;color:#5B7085">${esc(k)}</span>
              <span class="num" style="font-size:24px;font-weight:600;color:${i === 3 ? '#00C9A7' : '#EEF4F9'}">${esc(v)}</span>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <footer style="padding:56px 64px 44px;margin-top:56px;border-top:1px solid ${T.border};display:flex;align-items:flex-end;justify-content:space-between">
      <div>
        ${marca({ size: 24 })}
        <p style="font-size:12px;color:${T.muted};margin-top:14px;max-width:420px">
          Plataforma para profesionales con licencia vigente en Seguridad y Salud en el Trabajo.
          El sistema automatiza la calificación pero no reemplaza el juicio profesional del psicólogo.
        </p>
      </div>
      <div style="display:flex;gap:26px;font-size:12.5px;color:${T.secondary}">
        ${['Términos', 'Privacidad', 'Tratamiento de datos', 'Soporte'].map((n) => `<span>${esc(n)}</span>`).join('')}
      </div>
    </footer>
  </div>`,
});

// ── Documentos legales ─────────────────────────────────────────────────
function legal({ titulo, rubrica, entrada, secciones, actualizado }) {
  return artboard({
    w: 1440, h: 1460,
    cuerpo: `<div style="width:1440px;height:1460px;background:${T.paper};overflow:hidden">
      <header style="height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 64px;border-bottom:1px solid ${T.border}">
        ${marca({ size: 27 })}
        <span style="font-size:13.5px;color:${T.secondary}">Volver al inicio</span>
      </header>
      <div style="display:flex;gap:64px;padding:56px 64px 0">
        <aside style="width:250px;flex-shrink:0">
          <p class="rub rub-ink">En esta página</p>
          <div style="margin-top:14px">
            ${secciones.map(([t], i) => `<p style="font-size:13px;line-height:1.4;color:${i === 0 ? T.ink : T.secondary};padding:8px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''};${i === 0 ? `font-weight:600;border-left:2px solid ${T.teal};padding-left:11px;margin-left:-13px` : ''}">${esc(t)}</p>`).join('')}
          </div>
          <div style="margin-top:26px;padding:15px 17px;border-radius:10px;background:${T.surface};border:1px solid ${T.border}">
            <p class="rub">Última actualización</p>
            <p class="num" style="font-size:13px;color:${T.ink};margin-top:7px">${esc(actualizado)}</p>
          </div>
        </aside>
        <article style="flex:1;max-width:760px">
          <p class="rub">${esc(rubrica)}</p>
          <h1 class="display" style="font-size:52px;margin-top:14px">${esc(titulo)}</h1>
          <p class="prose" style="font-size:18px;margin-top:18px">${entrada}</p>
          ${secciones.map(([t, p], i) => `<section style="margin-top:34px">
            <div style="display:flex;gap:16px;align-items:baseline">
              <span class="num" style="font-size:12px;color:${T.muted};width:22px;flex-shrink:0">${String(i + 1).padStart(2, '0')}</span>
              <h2 style="font-family:${FONTS.head};font-size:25px;font-weight:600;letter-spacing:-0.01em;color:${T.ink}">${esc(t)}</h2>
            </div>
            <div style="padding-left:38px;margin-top:11px">
              ${p.map((x) => `<p class="prose" style="margin-bottom:11px">${x}</p>`).join('')}
            </div>
          </section>`).join('')}
        </article>
      </div>
    </div>`,
  });
}

export const terminos = legal({
  rubrica: 'Documento legal',
  titulo: 'Términos y condiciones',
  actualizado: '2026-08-01',
  entrada: 'Estas condiciones rigen el uso de PsicoSST por parte de profesionales de la psicología con licencia vigente en Seguridad y Salud en el Trabajo. Al crear una cuenta usted las acepta en su totalidad.',
  secciones: [
    ['Quién puede usar la plataforma', [
      'El acceso está restringido a psicólogos titulados, con tarjeta profesional vigente expedida por el Colegio Colombiano de Psicólogos, posgrado en Seguridad y Salud en el Trabajo y licencia vigente expedida por la autoridad sanitaria departamental.',
      'PsicoSST verifica estos tres requisitos antes de habilitar una cuenta y puede suspenderla si alguno deja de cumplirse. La suspensión corta el acceso pero no invalida los informes ya firmados.',
    ]],
    ['Alcance del servicio', [
      'PsicoSST automatiza la calificación de los cuatro instrumentos de la batería conforme al manual oficial, genera interpretaciones de apoyo y emite informes firmables. <strong style="font-weight:600">No reemplaza el juicio profesional del psicólogo</strong>, que sigue siendo el responsable del contenido de todo informe que firme.',
      'Las funciones de asistencia por inteligencia artificial producen borradores marcados como generados. Ningún texto generado llega a un informe firmado sin revisión o aprobación explícita del profesional.',
    ]],
    ['Responsabilidad sobre los datos', [
      'El profesional y la empresa evaluada son los responsables del tratamiento de los datos de los trabajadores. PsicoSST actúa como encargado y trata los datos únicamente conforme a sus instrucciones.',
      'Es responsabilidad del profesional recabar el consentimiento informado de cada persona evaluada antes de la aplicación, y verificar que la empresa cuente con la autorización de tratamiento correspondiente.',
    ]],
    ['Créditos y facturación', [
      'Un crédito equivale a una evaluación calificada. Los créditos incluidos en un plan se asignan al inicio de cada periodo y no se acumulan; los comprados por paquete no caducan.',
      'La anulación de una evaluación por error de digitación dentro de las 48 horas siguientes reversa el crédito consumido.',
    ]],
    ['Conservación y terminación', [
      'Al terminar la relación contractual el profesional conserva el derecho a exportar la totalidad de sus informes durante 90 días. Cumplido ese plazo los datos se conservan cifrados por el término de custodia legal de la historia clínica ocupacional y dejan de ser accesibles desde la plataforma.',
    ]],
  ],
});

export const privacidad = legal({
  rubrica: 'Documento legal',
  titulo: 'Política de privacidad',
  actualizado: '2026-08-01',
  entrada: 'Esta política describe cómo PsicoSST trata los datos personales, incluidos datos sensibles de salud, en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 y la Ley 1090 de 2006.',
  secciones: [
    ['Qué datos se tratan', [
      'De los profesionales: nombre, correo, tarjeta profesional, licencia SST, datos de facturación y registros de acceso.',
      'De los trabajadores evaluados: identificación, datos sociodemográficos, respuestas a los cuestionarios y puntajes resultantes. <strong style="font-weight:600">Las respuestas y los puntajes son datos sensibles de salud</strong> y reciben el nivel de protección más alto previsto en la ley.',
    ]],
    ['Quién puede ver qué', [
      'El resultado individual de un trabajador solo es accesible para el psicólogo responsable de su evaluación. Ni la empresa, ni su jefe directo, ni el área de gestión humana tienen acceso a él.',
      'La empresa recibe exclusivamente resultados agregados. El sistema no muestra ningún agregado calculado sobre menos de cinco personas, porque por debajo de ese umbral el dato deja de ser anónimo.',
    ]],
    ['Trazabilidad de los accesos', [
      'Toda lectura de una historia clínica ocupacional queda registrada con usuario, fecha, hora y dirección IP en un log inmutable. Ese registro no se puede editar ni borrar, ni siquiera por un administrador de la plataforma.',
    ]],
    ['Derechos del titular', [
      'Cualquier persona evaluada puede conocer, actualizar y rectificar sus datos, solicitar prueba de la autorización otorgada, ser informada sobre el uso dado a sus datos y revocar la autorización o solicitar la supresión cuando no exista un deber legal de conservarlos.',
      'Las solicitudes se atienden en los términos del artículo 14 de la Ley 1581 de 2012 escribiendo a <span style="color:#007A65">datos@psicosst.co</span>.',
    ]],
    ['Conservación y seguridad', [
      'Los datos de salud se conservan veinte años, el plazo que fija la Resolución 1995 de 1999 —modificada por la Resolución 839 de 2017— para la historia clínica. Se almacenan cifrados en reposo y en tránsito, en infraestructura ubicada en territorio de la Comunidad Andina.',
      'El acceso de los profesionales exige un segundo factor de autenticación que no puede desactivarse desde la propia cuenta.',
    ]],
  ],
});
