import { T, RISK, RISK_ORDER, FONTS, artboard, icono, riesgo, pasos, estado, marca, isotipo, esc } from '../lib.mjs';

const W = 1440;

function seccion(n, titulo, nota, cuerpo) {
  return `<section style="padding:38px 0;border-top:1px solid ${T.border}">
    <div style="display:flex;gap:44px">
      <div style="width:230px;flex-shrink:0">
        <p class="num" style="font-size:11px;color:${T.muted}">${n}</p>
        <h2 class="display" style="font-size:27px;margin-top:7px">${esc(titulo)}</h2>
        <p style="font-size:12.5px;line-height:1.55;color:${T.secondary};margin-top:10px">${nota}</p>
      </div>
      <div style="flex:1;min-width:0">${cuerpo}</div>
    </div>
  </section>`;
}

function muestra(hex, nombre, variable) {
  return `<div style="width:118px">
    <div style="height:56px;border-radius:7px;background:${hex};border:1px solid rgba(12,21,32,0.10)"></div>
    <p style="font-size:12px;font-weight:500;margin-top:8px;color:${T.ink}">${esc(nombre)}</p>
    <p class="num" style="font-size:10.5px;color:${T.muted};margin-top:2px">${hex}</p>
    <p class="num" style="font-size:9.5px;color:${T.border};margin-top:1px">${esc(variable)}</p>
  </div>`;
}

const color = `
  <p class="rub" style="margin-bottom:13px">Base</p>
  <div style="display:flex;gap:14px;flex-wrap:wrap">
    ${muestra(T.paper, 'Papel', '--color-background')}
    ${muestra(T.surface, 'Superficie', '--color-surface')}
    ${muestra(T.surfaceMuted, 'Superficie apagada', '--color-surface-muted')}
    ${muestra(T.ink, 'Tinta', '--color-foreground')}
    ${muestra(T.secondary, 'Texto secundario', '--color-text-secondary')}
    ${muestra(T.muted, 'Texto apagado', '--color-text-muted')}
    ${muestra(T.border, 'Filete', '--color-border')}
  </div>
  <p class="rub" style="margin:24px 0 13px">Señal</p>
  <div style="display:flex;gap:14px;flex-wrap:wrap">
    ${muestra(T.teal, 'Primario', '--color-primary')}
    ${muestra(T.tealDark, 'Primario oscuro', '--color-teal-dark')}
    ${muestra(T.tealLight, 'Primario claro', '--color-teal-light')}
    ${muestra(T.success, 'Éxito', '--color-success')}
    ${muestra(T.warning, 'Aviso', '--color-warning')}
    ${muestra(T.danger, 'Peligro', '--color-danger')}
    ${muestra(T.info, 'Información', '--color-info')}
  </div>`;

const tipo = `
  <div style="display:flex;flex-direction:column;gap:22px">
    <div style="display:flex;align-items:baseline;gap:26px">
      <p class="rub" style="width:132px;flex-shrink:0">Display 78</p>
      <p class="display" style="font-size:78px">1.284</p>
      <p style="font-size:11.5px;color:${T.muted};margin-left:auto">Barlow Semi&nbsp;Condensed 600 · −0,02em</p>
    </div>
    <div style="display:flex;align-items:baseline;gap:26px;border-top:1px solid ${T.borderMuted};padding-top:20px">
      <p class="rub" style="width:132px;flex-shrink:0">Título 40</p>
      <p class="display" style="font-size:40px">Demandas del trabajo</p>
      <p style="font-size:11.5px;color:${T.muted};margin-left:auto">Barlow 600</p>
    </div>
    <div style="display:flex;align-items:baseline;gap:26px;border-top:1px solid ${T.borderMuted};padding-top:20px">
      <p class="rub" style="width:132px;flex-shrink:0">Narrativa 16,5</p>
      <p class="prose" style="max-width:520px">El trabajador percibe que las exigencias de carga mental superan su capacidad de respuesta habitual.</p>
      <p style="font-size:11.5px;color:${T.muted};margin-left:auto">Source Serif&nbsp;4 400 · 1,62</p>
    </div>
    <div style="display:flex;align-items:baseline;gap:26px;border-top:1px solid ${T.borderMuted};padding-top:20px">
      <p class="rub" style="width:132px;flex-shrink:0">Interfaz 13,5</p>
      <p style="font-size:13.5px;color:${T.ink};max-width:520px">Texto de interfaz, etiquetas de formulario, celdas de tabla y botones.</p>
      <p style="font-size:11.5px;color:${T.muted};margin-left:auto">IBM Plex Sans 400/500/600</p>
    </div>
    <div style="display:flex;align-items:baseline;gap:26px;border-top:1px solid ${T.borderMuted};padding-top:20px">
      <p class="rub" style="width:132px;flex-shrink:0">Dato</p>
      <p class="num" style="font-size:20px;color:${T.ink}">68,4 · 24,7% · 2026-09-16 · 4f7a91c</p>
      <p style="font-size:11.5px;color:${T.muted};margin-left:auto">IBM Plex Mono · cifras tabulares</p>
    </div>
    <div style="display:flex;align-items:baseline;gap:26px;border-top:1px solid ${T.borderMuted};padding-top:20px">
      <p class="rub" style="width:132px;flex-shrink:0">Rúbrica</p>
      <p class="rub rub-ink">Liderazgo y relaciones sociales en el trabajo</p>
      <p style="font-size:11.5px;color:${T.muted};margin-left:auto">Barlow 600 · 10px · 0,22em</p>
    </div>
  </div>`;

const escalaRiesgo = `
  <table>
    <tr>
      <th class="th">Nivel</th><th class="th">Píldora</th><th class="th">Ordinal</th>
      <th class="th">Tramo típico</th><th class="th">Macizo</th><th class="th" style="padding-right:0">En gris</th>
    </tr>
    ${RISK_ORDER.map((k, i) => {
      const r = RISK[k];
      const tramos = ['0 – 3,8', '3,9 – 15,4', '15,5 – 30,8', '30,9 – 46,2', '46,3 – 100'];
      return `<tr>
        <td class="td" style="font-weight:500">${esc(r.label)}</td>
        <td class="td">${riesgo(k)}</td>
        <td class="td">${pasos(k)}</td>
        <td class="td num" style="color:${T.secondary}">${tramos[i]}</td>
        <td class="td"><span style="display:inline-block;width:34px;height:14px;border-radius:3px;background:${r.bar}"></span></td>
        <td class="td">${pasos(k, { w: 13, h: 7 }).replace(new RegExp(r.bar, 'g'), `hsl(0 0% ${78 - i * 15}%)`)}</td>
      </tr>`;
    }).join('')}
  </table>
  <p style="font-size:12.5px;line-height:1.6;color:${T.secondary};margin-top:16px;max-width:640px">
    El ordinal de cinco pasos acompaña <em>siempre</em> a la píldora. El color solo confirma lo
    que ya dice la posición, así que el nivel sobrevive a la impresión en blanco y negro,
    al daltonismo y a la miniatura de una tabla densa.
  </p>`;

const comps = `
  <div style="display:flex;gap:56px;flex-wrap:wrap">
    <div>
      <p class="rub" style="margin-bottom:13px">Botones</p>
      <div style="display:flex;gap:10px;align-items:center">
        <span class="btn btn-pri">${icono('mas', { size: 14, color: '#FFF' })}Primario</span>
        <span class="btn btn-sec">Secundario</span>
        <span class="btn btn-ghost">Terciario</span>
      </div>
    </div>
    <div>
      <p class="rub" style="margin-bottom:13px">Campo</p>
      <div style="width:230px">
        <p class="lbl" style="margin-bottom:7px">Correo electrónico</p>
        <div class="input" style="border-color:${T.teal};box-shadow:0 0 0 3px rgba(0,154,128,0.12)">psicologa@consultorio.co</div>
      </div>
    </div>
    <div>
      <p class="rub" style="margin-bottom:13px">Estados de flujo</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;max-width:330px">
        ${estado('Pendiente', 'neutro')}${estado('Calificado', 'teal')}${estado('Revisado', 'info')}
        ${estado('Firmado', 'ok')}${estado('Vence pronto', 'aviso')}${estado('Vencida', 'alerta')}
      </div>
    </div>
  </div>
  <div style="display:flex;gap:56px;margin-top:30px;flex-wrap:wrap">
    <div>
      <p class="rub" style="margin-bottom:13px">Radios</p>
      <div style="display:flex;gap:10px;align-items:flex-end">
        ${[4, 8, 12, 16, 999].map((r) => `<div style="text-align:center">
          <div style="width:44px;height:44px;border:1px solid ${T.border};background:${T.surface};border-radius:${r}px"></div>
          <p class="num" style="font-size:10px;color:${T.muted};margin-top:5px">${r === 999 ? '∞' : r}</p></div>`).join('')}
      </div>
    </div>
    <div>
      <p class="rub" style="margin-bottom:13px">Iconografía · trazo 1,6 · rejilla 24</p>
      <div style="display:flex;gap:16px;align-items:center;color:${T.secondary}">
        ${['panel', 'empresa', 'persona', 'form', 'informe', 'grafico', 'tend', 'plan', 'ia', 'escudo', 'firma', 'candado'].map((i) => icono(i, { size: 19, color: T.secondary })).join('')}
      </div>
    </div>
    <div>
      <p class="rub" style="margin-bottom:13px">Marca</p>
      <div style="display:flex;gap:22px;align-items:center">${marca({ size: 30 })}${isotipo(30, 'mk2')}</div>
    </div>
  </div>`;

const reglas = `
  <div style="display:flex;gap:18px;flex-wrap:wrap">
    ${[
      ['Filete, no sombra', 'La interfaz se construye con líneas de 1px. La única sombra permitida es el anillo de foco. Un informe clínico no flota.'],
      ['El degradado vive en el isotipo', 'Los tres tonos teal→cian→azul son la marca. En ningún otro sitio: ni fondos, ni botones, ni tarjetas.'],
      ['El dato es monoespaciado', 'Puntaje, porcentaje, fecha, folio y hash en IBM Plex Mono con cifras tabulares. Las columnas alinean solas.'],
      ['La interpretación es texto', 'La narrativa por dimensión se compone en Source Serif 4, la misma del PDF. Se lee como el informe que es.'],
      ['El riesgo nunca decora', 'Naranja y rojo significan un nivel de la Resolución 2646. No se usan para botones, avisos ni acentos.'],
      ['Cada cifra tiene procedencia', 'Todo puntaje enlaza a los ítems que lo originaron. La trazabilidad no es una pantalla aparte: es un atributo del número.'],
    ].map(([t, d]) => `<div style="width:512px;padding:17px 19px;border:1px solid ${T.border};border-radius:10px;background:${T.surface}">
      <p style="font-family:${FONTS.head};font-size:16px;font-weight:600;letter-spacing:-0.01em;color:${T.ink}">${esc(t)}</p>
      <p style="font-size:12.5px;line-height:1.58;color:${T.secondary};margin-top:7px">${esc(d)}</p>
    </div>`).join('')}
  </div>`;

export const fundamentos = artboard({
  w: W, h: 2420,
  cuerpo: `<div style="padding:52px 60px 60px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:34px">
      <div>
        <p class="rub">Sistema de diseño · PsicoSST</p>
        <h1 class="display" style="font-size:62px;margin-top:12px">Clínico editorial</h1>
        <p class="prose" style="max-width:660px;margin-top:16px">
          La paleta, los radios y las familias tipográficas se conservan tal como están en
          <span class="num" style="font-size:14.5px">globals.css</span>. Lo que cambia es la escala:
          Barlow Semi&nbsp;Condensed deja de ser solo una etiqueta de 10&nbsp;px y pasa a titular,
          y Source Serif&nbsp;4 —hoy reservada al PDF— entra a pantalla para que la interpretación
          se lea como el documento clínico que es.
        </p>
      </div>
      ${marca({ size: 34 })}
    </div>
    ${seccion('01', 'Color', 'Idéntico a producción. Ni un tono nuevo.', color)}
    ${seccion('02', 'Tipografía', 'Cuatro familias, cada una con un trabajo que ninguna otra hace.', tipo)}
    ${seccion('03', 'Escala de riesgo', 'Los cinco niveles de la Resolución 2646, legibles sin color.', escalaRiesgo)}
    ${seccion('04', 'Componentes', 'Las primitivas que se repiten en las 40 pantallas.', comps)}
    ${seccion('05', 'Reglas', 'Lo que hace que el sistema no se deshaga al crecer.', reglas)}
  </div>`,
});
