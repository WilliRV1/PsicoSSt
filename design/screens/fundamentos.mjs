import { T, RISK, RISK_ORDER, FONTS, CAT, artboard, icono, riesgo, pasos, estado, marca, isotipo, esc, n1 } from '../lib.mjs';

const W = 1440;

function seccion(n, titulo, nota, cuerpo) {
  return `<section style="padding:40px 0;border-top:1px solid ${T.border}">
    <div style="display:flex;gap:48px">
      <div style="width:236px;flex-shrink:0">
        <p class="num" style="font-size:12px;color:${T.muted}">${n}</p>
        <h2 class="display" style="font-size:28px;margin-top:8px">${esc(titulo)}</h2>
        <p style="font-size:13px;line-height:1.6;color:${T.secondary};margin-top:11px">${nota}</p>
      </div>
      <div style="flex:1;min-width:0">${cuerpo}</div>
    </div>
  </section>`;
}

function muestra(hex, nombre, nota) {
  return `<div style="width:124px">
    <div style="height:60px;border-radius:12px;background:${hex};border:1px solid rgba(11,15,20,0.08)"></div>
    <p style="font-size:12.5px;font-weight:500;margin-top:9px;color:${T.ink}">${esc(nombre)}</p>
    <p class="num" style="font-size:11.5px;color:${T.muted};margin-top:2px">${hex}</p>
    ${nota ? `<p style="font-size:10.5px;color:${T.muted};margin-top:2px">${esc(nota)}</p>` : ''}
  </div>`;
}

const color = `
  <p class="rub" style="margin-bottom:14px">Base</p>
  <div style="display:flex;gap:15px;flex-wrap:wrap">
    ${muestra(T.paper, 'Lienzo', 'antes #F2F0EC')}
    ${muestra(T.surface, 'Superficie', '')}
    ${muestra(T.surfaceMuted, 'Superficie apagada', '')}
    ${muestra(T.ink, 'Tinta', 'antes #0C1520')}
    ${muestra(T.secondary, 'Secundario', '')}
    ${muestra(T.muted, 'Apagado', '')}
    ${muestra(T.border, 'Filete', '')}
  </div>
  <p class="rub" style="margin:26px 0 14px">Señal</p>
  <div style="display:flex;gap:15px;flex-wrap:wrap">
    ${muestra(T.teal, 'Marca', 'sin cambio')}
    ${muestra(T.tealDark, 'Marca oscura', '')}
    ${muestra(T.tealLight, 'Marca clara', '')}
    ${muestra(T.success, 'Éxito', '')}
    ${muestra(T.warning, 'Aviso', '')}
    ${muestra(T.danger, 'Peligro', '')}
    ${muestra(T.info, 'Información', '')}
  </div>
  <p style="font-size:12.5px;line-height:1.6;color:${T.secondary};margin-top:22px;max-width:660px">
    El teal de la marca se conserva. Lo que se fue es el papel cálido: un beige de
    fondo es la primera cosa que delata a una interfaz generada, y era la mitad del
    aire de documento antiguo. El lienzo pasa a un neutro frío y las superficies a blanco puro.
  </p>`;

const tipo = `
  <div style="display:flex;flex-direction:column;gap:0">
    ${[
      ['Titular', '<p class="display" style="font-size:72px">1.284</p>', 'Geist 600 · −0,035em · 1,02'],
      ['Cifra grande', '<p class="cifra" style="font-size:44px">74,8</p>', 'Geist 600 · tabular · −0,045em'],
      ['Título', '<p class="display" style="font-size:34px">Demandas del trabajo</p>', 'Geist 600 · −0,035em'],
      ['Texto corrido', '<p class="prose" style="max-width:540px">El trabajador percibe que las exigencias de carga mental superan su capacidad de respuesta habitual.</p>', 'Geist 400 · 15,5/1,65'],
      ['Interfaz', `<p style="font-size:13.5px;color:${T.ink};max-width:540px">Etiquetas, celdas de tabla, botones y campos.</p>`, 'Geist 400/500 · 13,5'],
      ['Rúbrica', '<p class="rub rub-ink">Liderazgo y relaciones sociales</p>', 'Geist 600 · 11 · 0,05em'],
      ['Máquina', '<p class="maq" style="font-size:14px">4f7a91c8e2b7d3 · jbswy3dpehpk</p>', 'Geist Mono · sólo huellas y tokens'],
    ].map(([k, v, nota], i) => `
      <div style="display:flex;align-items:baseline;gap:28px;padding:20px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
        <p class="rub" style="width:118px;flex-shrink:0">${esc(k)}</p>
        <div style="flex:1;min-width:0">${v}</div>
        <p style="font-size:11.5px;color:${T.muted};flex-shrink:0;text-align:right;width:190px">${esc(nota)}</p>
      </div>`).join('')}
  </div>
  <div style="display:flex;gap:18px;margin-top:26px">
    <div style="flex:1;padding:18px 20px;border-radius:14px;background:${T.surfaceMuted}">
      <p class="rub" style="margin-bottom:10px">Lo que se retiró</p>
      <p style="font-size:12.5px;line-height:1.65;color:${T.secondary}">
        <strong style="color:${T.ink};font-weight:600">Barlow Semi Condensed</strong> como titular: una
        condensada de periódico impone tono editorial. Se queda sólo en el logotipo.<br><br>
        <strong style="color:${T.ink};font-weight:600">Source Serif 4</strong> en pantalla: la serif con
        cursivas era el mayor foco de formalidad, y los detectores de interfaz generada la marcan.<br><br>
        <strong style="color:${T.ink};font-weight:600">IBM Plex Mono</strong> para puntajes: un 74,8 en
        monoespaciado se lee como salida de terminal, no como un dato.
      </p>
    </div>
    <div style="flex:1;padding:18px 20px;border-radius:14px;background:${T.surfaceMuted}">
      <p class="rub" style="margin-bottom:10px">Por qué una sola familia</p>
      <p style="font-size:12.5px;line-height:1.65;color:${T.secondary}">
        Geist cubre titular, interfaz y cifra. Sus cifras tabulares alinean en columna
        igual que una monoespaciada, pero con el ancho y el contraste de una grotesca
        contemporánea: la tabla sigue cuadrando y el número deja de parecer antiguo.<br><br>
        El tracking negativo —de −0,02em en el dato a −0,045em en la cifra grande— es lo
        que convierte una columna de números en un bloque visual, en vez de una lista de
        caracteres sueltos.
      </p>
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
        <td class="td"><span style="display:inline-block;width:36px;height:14px;border-radius:7px;background:${r.bar}"></span></td>
        <td class="td">${pasos(k).replace(new RegExp(r.bar, 'g'), `hsl(210 8% ${74 - i * 14}%)`)}</td>
      </tr>`;
    }).join('')}
  </table>
  <p style="font-size:12.5px;line-height:1.65;color:${T.secondary};margin-top:18px;max-width:680px">
    Los cinco niveles de la Resolución 2646 conservan sus tonos —verde, ámbar, naranja, rojo— pero
    pasan a la versión saturada y limpia de cada uno. Los pasteles anteriores, sobre papel cálido,
    daban el aspecto de una tabla impresa.
    El ordinal de cinco pasos acompaña <strong style="color:${T.ink};font-weight:600">siempre</strong>
    a la píldora, así que el nivel se lee por posición antes que por color y sobrevive al gris,
    al daltonismo y a la miniatura.
  </p>`;

const comps = `
  <div style="display:flex;gap:56px;flex-wrap:wrap">
    <div>
      <p class="rub" style="margin-bottom:14px">Botones</p>
      <div style="display:flex;gap:10px;align-items:center">
        <span class="btn btn-pri">${icono('mas', { size: 15, color: '#FFF' })}Primario</span>
        <span class="btn btn-acc">Acento</span>
        <span class="btn btn-sec">Secundario</span>
        <span class="btn btn-ghost">Terciario</span>
      </div>
      <p style="font-size:11.5px;color:${T.muted};margin-top:10px;max-width:330px">
        Al pulsar, <span class="maq">scale(0.97)</span> en 130&nbsp;ms. Un botón sin estado activo
        se siente muerto al tacto.
      </p>
    </div>
    <div>
      <p class="rub" style="margin-bottom:14px">Campo</p>
      <div style="width:236px">
        <p class="lbl" style="margin-bottom:8px">Correo electrónico</p>
        <div class="input" style="border-color:${T.ink};box-shadow:0 0 0 3px rgba(11,15,20,0.08)">psicologa@consultorio.co</div>
      </div>
    </div>
    <div>
      <p class="rub" style="margin-bottom:14px">Estados</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;max-width:320px">
        ${estado('Pendiente', 'neutro')}${estado('Calificado', 'teal')}${estado('Revisado', 'info')}
        ${estado('Firmado', 'ok')}${estado('Vence pronto', 'aviso')}${estado('Vencida', 'alerta')}
      </div>
    </div>
  </div>
  <div style="display:flex;gap:56px;margin-top:32px;flex-wrap:wrap;align-items:flex-start">
    <div>
      <p class="rub" style="margin-bottom:14px">Radios y elevación</p>
      <div style="display:flex;gap:12px;align-items:flex-end">
        ${[8, 10, 12, 16, 20].map((r) => `<div style="text-align:center">
          <div class="card" style="width:52px;height:52px;border-radius:${r}px"></div>
          <p class="num" style="font-size:11px;color:${T.muted};margin-top:6px">${r}</p></div>`).join('')}
        <div style="text-align:center">
          <div class="card card-alto" style="width:52px;height:52px;border-radius:16px"></div>
          <p style="font-size:11px;color:${T.muted};margin-top:6px">alta</p>
        </div>
      </div>
    </div>
    <div>
      <p class="rub" style="margin-bottom:14px">Iconografía · trazo 1,6 · rejilla 24</p>
      <div style="display:flex;gap:17px;align-items:center">
        ${['panel', 'empresa', 'persona', 'form', 'informe', 'grafico', 'tend', 'plan', 'ia', 'escudo', 'firma', 'candado'].map((i) => icono(i, { size: 19, color: T.secondary })).join('')}
      </div>
    </div>
    <div>
      <p class="rub" style="margin-bottom:14px">Marca</p>
      <div style="display:flex;gap:22px;align-items:center">${marca({ size: 30 })}${isotipo(30, 'mk2')}</div>
    </div>
  </div>`;

const motion = `
  <div style="display:flex;gap:20px">
    <div style="flex:1">
      <p class="rub" style="margin-bottom:12px">Duraciones</p>
      <table>
        ${[
          ['Respuesta al pulsar', '100 – 160 ms'],
          ['Tooltip y globo pequeño', '125 – 200 ms'],
          ['Menú y desplegable', '150 – 250 ms'],
          ['Modal, panel y cajón', '200 – 300 ms'],
          ['Escalonado entre piezas', '30 – 80 ms'],
        ].map(([k, v], i) => `<tr>
          <td class="td" style="font-size:13px;${i === 0 ? 'border-top:none' : ''}">${esc(k)}</td>
          <td class="td num" style="text-align:right;color:${T.secondary}">${esc(v)}</td>
        </tr>`).join('')}
      </table>
      <p style="font-size:12px;line-height:1.6;color:${T.secondary};margin-top:14px">
        Techo absoluto de 300&nbsp;ms. Ante la duda, más rápido: la velocidad es
        rendimiento percibido.
      </p>
    </div>
    <div style="flex:1">
      <p class="rub" style="margin-bottom:12px">Curvas</p>
      <div>
        ${[
          ['Entrada en pantalla', 'cubic-bezier(0.23, 1, 0.32, 1)'],
          ['Movimiento dentro de la pantalla', 'cubic-bezier(0.77, 0, 0.175, 1)'],
          ['Cajón estilo iOS', 'cubic-bezier(0.32, 0.72, 0, 1)'],
        ].map(([k, v], i) => `<div style="padding:13px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <p style="font-size:13px;color:${T.ink}">${esc(k)}</p>
          <p class="maq" style="font-size:12px;color:${T.secondary};margin-top:4px">${esc(v)}</p>
        </div>`).join('')}
      </div>
      <p style="font-size:12px;line-height:1.6;color:${T.secondary};margin-top:14px">
        Sólo se animan <span class="maq">transform</span> y <span class="maq">opacity</span>.
        Nada de <span class="maq">height</span>, <span class="maq">width</span> ni
        <span class="maq">margin</span>: no van por GPU y tironean.
      </p>
    </div>
    <div style="flex:1">
      <p class="rub" style="margin-bottom:12px">Cuándo no animar</p>
      <div>
        ${[
          ['Más de cien veces al día', 'Sin animación', 'alerta'],
          ['Decenas de veces al día', 'Reducida al mínimo', 'aviso'],
          ['Ocasional', 'Animación estándar', 'teal'],
          ['Primera vez o excepcional', 'Cabe el detalle', 'ok'],
        ].map(([k, v, tono], i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;${i ? `border-top:1px solid ${T.borderMuted}` : ''}">
          <span style="font-size:13px;color:${T.ink}">${esc(k)}</span>${estado(v, tono)}
        </div>`).join('')}
      </div>
      <p style="font-size:12px;line-height:1.6;color:${T.secondary};margin-top:14px">
        Con <span class="maq">prefers-reduced-motion</span> se conserva la opacidad y se
        retira el desplazamiento. Un atajo de teclado nunca anima.
      </p>
    </div>
  </div>`;

const reglas = `
  <div style="display:flex;gap:18px;flex-wrap:wrap">
    ${[
      ['Una familia, tres trabajos', 'Geist hace de titular, de interfaz y de cifra. Las cuatro familias anteriores eran cuatro tonos de voz compitiendo en la misma pantalla.'],
      ['La cifra no es una máquina', 'Puntaje y porcentaje van en cifras tabulares de la misma grotesca, con tracking negativo. El monoespaciado queda para huellas y tokens.'],
      ['Elevación suave, no filete duro', 'Una sombra de 1px más un halo amplio y muy tenue. La regla anterior de «sólo líneas» mantenía todo plano, y plano se lee como impreso.'],
      ['El degradado vive en el isotipo', 'Los tres tonos teal→cian→azul son la marca. En ningún fondo, botón ni tarjeta.'],
      ['El riesgo nunca decora', 'Ámbar, naranja y rojo significan un nivel de la Resolución 2646. No se usan para botones ni acentos.'],
      ['El movimiento se gana su sitio', 'Se anima lo que ocurre pocas veces. Lo que se ve cien veces al día aparece y ya.'],
    ].map(([t, d]) => `<div style="width:344px;padding:20px 22px;border-radius:16px;background:${T.surface};border:1px solid ${T.border};box-shadow:0 1px 2px rgba(11,15,20,0.04)">
      <p style="font-size:16px;font-weight:600;letter-spacing:-0.015em;color:${T.ink}">${esc(t)}</p>
      <p style="font-size:12.5px;line-height:1.6;color:${T.secondary};margin-top:8px">${esc(d)}</p>
    </div>`).join('')}
  </div>`;

export const fundamentos = artboard({
  w: W, h: 3700,
  cuerpo: `<div style="padding:56px 64px 64px" class="anim">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
      <div>
        <p class="rub">Sistema de diseño · PsicoSST</p>
        <h1 class="display" style="font-size:66px;margin-top:14px">Moderno y fluido</h1>
        <p class="prose" style="font-size:17px;max-width:680px;margin-top:18px">
          Segunda dirección. Conserva el teal de la marca y los cinco niveles de riesgo que
          exige la norma, y cambia todo lo que hacía que el producto se leyera como un
          documento: el papel cálido, la condensada de titular, la serif de la narrativa
          y el monoespaciado de los puntajes.
        </p>
      </div>
      ${marca({ size: 34 })}
    </div>
    ${seccion('01', 'Color', 'Se va el beige; se queda el teal.', color)}
    ${seccion('02', 'Tipografía', 'Cuatro familias históricas pasan a una contemporánea.', tipo)}
    ${seccion('03', 'Escala de riesgo', 'Mismos cinco niveles, tonos limpios.', escalaRiesgo)}
    ${seccion('04', 'Componentes', 'Las primitivas que se repiten en las 46 pantallas.', comps)}
    ${seccion('05', 'Movimiento', 'Tomado del manual de ingeniería de interfaz de Emil Kowalski.', motion)}
    ${seccion('06', 'Reglas', 'Lo que evita que el sistema se deshaga al crecer.', reglas)}
  </div>`,
});
