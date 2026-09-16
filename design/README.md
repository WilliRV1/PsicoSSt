# Sistema de diseño PsicoSST — dirección «moderno y fluido»

Las 51 pantallas del sistema (46 de producto + 5 plantillas de PDF), dibujadas
como artboards de un lienzo de Claude Design.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `lib.mjs` | El sistema: paleta, tipografía, movimiento, iconos, primitivas de riesgo, chasis de aplicación |
| `screens/*.mjs` | Una pantalla o un grupo de pantallas por archivo |
| `screens/graficos.mjs` | Primitivas de visualización (barras, apiladas, líneas) |
| `screens/pdf.mjs` | Las cinco plantillas A4 que hoy compila Typst |
| `build.mjs` | Compone `artboards/*.dc.html` y `artboards/canvas.json` |
| `preview.mjs` | Convierte un artboard en HTML plano para mirarlo en el navegador |
| `audit.mjs` + `scan.py` | Miden la altura real de cada artboard y detectan recortes |

## Reconstruir

```bash
node build.mjs          # regenera los 51 artboards y el canvas.json
node preview.mjs [Main] # HTML plano en .preview/ para inspección visual
node audit.mjs          # prepara la auditoría de alturas
python3 scan.py         # informa recortes y holguras (requiere capturas en .audit/)
```

## La dirección

Segunda iteración. La primera («clínico editorial») conservaba la paleta y las
familias de `src/app/globals.css` y sólo cambiaba la escala. Se leía formal y los
números parecían antiguos. Esta dirección conserva **el teal de la marca** y **los
cinco niveles de riesgo que exige la norma**, y cambia todo lo demás.

### Tipografía: de cuatro familias a una

| Antes | Ahora | Por qué |
|---|---|---|
| Barlow Semi Condensed en titular | **Geist** 600, −0,035em | Una condensada de periódico impone tono editorial. Barlow se queda sólo en el logotipo. |
| Source Serif 4 en la narrativa | **Geist** 400, 15,5/1,65 | La serif con cursivas era el mayor foco de formalidad, y los detectores de interfaz generada la marcan. |
| IBM Plex Mono en los puntajes | **Geist** con `tabular-nums`, −0,045em | Un `74,8` en monoespaciado se lee como salida de terminal. Las cifras tabulares de Geist alinean igual y parecen de este siglo. |
| IBM Plex Sans en la interfaz | **Geist** 400/500 | Una sola voz. |

`Geist Mono` queda para lo que de verdad es una cadena de máquina: huellas, tokens y claves.

### Color

- El lienzo pasa de `#F2F0EC` (papel cálido) a `#F7F8F9` (neutro frío). Un beige de
  fondo es de las primeras cosas que delatan a una interfaz generada.
- El teal de la marca (`#009A80`) no cambia.
- Los cinco niveles de riesgo conservan sus tonos —verde, ámbar, naranja, rojo— en
  su versión saturada y limpia, en lugar de los pasteles de Tailwind.

### Movimiento

Tomado del manual de ingeniería de interfaz de Emil Kowalski:

- Techo absoluto de **300 ms**. Pulsar: 100–160 ms. Menú: 150–250 ms. Capa: 200–300 ms.
- Curva de entrada `cubic-bezier(0.23, 1, 0.32, 1)`; movimiento en pantalla `cubic-bezier(0.77, 0, 0.175, 1)`.
- Sólo se animan `transform` y `opacity`.
- Entrada escalonada de 45 ms entre piezas (`.anim` en `lib.mjs`).
- `scale(0.97)` al pulsar un botón.
- Lo que se ve más de cien veces al día no se anima.
- Con `prefers-reduced-motion` se conserva la opacidad y se retira el desplazamiento.

### Reglas

1. **Una familia, tres trabajos.** Geist hace de titular, de interfaz y de cifra.
2. **La cifra no es una máquina.** Cifras tabulares de la grotesca, no monoespaciado.
3. **Elevación suave, no filete duro.** 1 px de sombra más un halo amplio y tenue.
4. **El degradado vive en el isotipo.** En ningún fondo, botón ni tarjeta.
5. **El riesgo nunca decora.** Ámbar, naranja y rojo significan un nivel de la Resolución 2646.
6. **El movimiento se gana su sitio.**

### El ordinal de riesgo

Cada nivel se acompaña siempre de un indicador de cinco pasos (`pasos()` en `lib.mjs`).
El color sólo confirma lo que ya dice la posición, así que el nivel sobrevive a la
impresión en blanco y negro, al daltonismo y a la miniatura de una tabla densa.

### Paleta categórica de los informes

`CAT` en `lib.mjs` nace del teal primario y del azul del isotipo, y está verificada con
el validador de la guía de visualización: banda de luminosidad, piso de croma, ΔE 11,2
en el peor par adyacente bajo protanopía y contraste ≥ 3:1 contra la superficie.
`CAT_OSCURO` es la versión para modo oscuro, validada por separado (ΔE 13,5).

## Los PDF

`screens/pdf.mjs` rediseña las cinco plantillas que hoy viven en `typst/*.typ`:
portada e interior del informe individual, diagnóstico colectivo, perfil
sociodemográfico y plan de intervención. A4 a 96 px por pulgada (794 × 1123),
una hoja por artboard, paginación fija.

Reglas propias del papel, distintas a las de pantalla:

- Papel blanco puro y tinta negra real: el neutro frío de pantalla se ve sucio impreso.
- El gris de texto secundario sube de contraste porque el papel no emite luz.
- Texto corrido a **16 px** (los 12 pt de suelo para lectura en papel); etiquetas y
  líneas legales pueden bajar a 12 px.
- Ningún filete por debajo de 1 px, y ningún fondo de color a sangre.

**Para llevarlas a producción** hay que añadir Geist a `typst/fonts/` y reemplazar la
paleta de `typst/lib/theme.typ`, que hoy usa tonos de riesgo terrosos
(`#3E7A63`, `#6F9558`, `#C39A3B`, `#BE7039`, `#A34037`) distintos a los de la aplicación.

## Los skills instalados

Los tres están instalados de verdad en este repositorio, no aplicados de memoria:

| Fuente | Cómo se instala | Dónde |
|---|---|---|
| **Impeccable** (`pbakaus/impeccable`, Apache 2.0) | Marketplace de Claude Code | `.claude/settings.json` |
| **Taste Skill** (`hestudy/taste-skill-claude-marketplace`, MIT) | Marketplace de Claude Code | `.claude/settings.json` |
| **Emil Kowalski** (`emilkowalski/skills`, MIT) | No es marketplace: 13 skills copiados | `.claude/skills/` |

Ver `.claude/skills/README.md` para el detalle y cómo revertirlo.

## Qué cambió al aplicar sus reglas

El `craft-floor.md` de Impeccable y su `operate.md` prohíben cosas que esta
maqueta hacía en las 51 pantallas:

| Regla | Qué había | Qué hay |
|---|---|---|
| «A kicker or eyebrow above a heading. **This one is a ban**: no brief earns it back» | Una etiqueta en versalitas sobre cada titular | El titular va primero; los datos que llevaba la etiqueta (NIT, folio, fecha) bajan debajo |
| «The hero-metric template: big number, small label, supporting stats» | `1.284` gigante + etiqueta + cuatro cifras | El titular es una frase: «317 de 1.284 trabajadores están en riesgo alto o muy alto» |
| «Same-size cards of icon + heading + text as the page structure. **Nested cards are always wrong**» | Rejillas de fichas en portada, fundamentos y diagnóstico —estas últimas dentro de otra ficha | Filas separadas por filete |
| «Section numbers (01/02/03) unless the sequence carries information» | Numeración decorativa | Sólo en el PDF, donde numera los apartados del informe |
| «Tracking floor −0.04em» | `.cifra` iba a −0,045em | −0,04em |
| «Browser surfaces … the cheapest signal that a page was built» | Selección, cursor, barra y anillo de foco por defecto | Tematizados desde la paleta |
| «**No orchestrated page-load sequences.** Product loads into a task» | Entrada escalonada en las 46 pantallas de producto | Sólo en portada y acceso; en producto, el movimiento informa de un estado |
| «Every interactive component has: default, hover, focus, active, disabled, loading, error» | Tres estados | Los siete, documentados en Fundamentos |
| «Skeleton states for loading, not spinners» · «Empty states that teach the interface» | No existían | Ambos, en Fundamentos |

> El skill de Impeccable propone ejecutar `scripts/impeccable context`, que descarga
> y corre un binario propio. **No se ejecutó**: sus reglas se aplicaron leyendo los
> archivos de referencia del repositorio.

## De dónde salen las reglas

- **Taste Skill** (`hestudy/taste-skill-claude-marketplace`, `Leonxlnx/taste-skill`) — dials de variación de diseño, intensidad de movimiento y densidad visual; la variante *soft* (contraste suave, aire, motion de muelle) es la que gobierna aquí.
- **Emil Kowalski** (`emilkowalski/skills`, skill `emil-design-eng`) — las 43 reglas de movimiento: duraciones, curvas, cuándo no animar.
- **Impeccable** (`pbakaus/impeccable`, impeccable.style) — el catálogo de 61 «tells» de interfaz generada. Los que corrigió esta iteración: el beige de fondo, la serif cursiva de titular, el filete lateral de pestaña y los radios inconsistentes.

Ninguno está instalado: son marketplaces de terceros, fuera del catálogo de Anthropic.
Se aplicaron sus reglas leyendo la fuente.

## Dos correcciones al producto que el rediseño incorpora

- **Navegación**: la barra lateral implementada lista 5 destinos para ~30 páginas. IA,
  analítica, tendencias, intervenciones, créditos, trabajadores y el módulo admin no son
  alcanzables salvo escribiendo la URL. Aquí el sistema entero se agrupa en cuatro bloques.
- **Escala de riesgo**: `src/components/psicosst/risk-badge.tsx` usa Tailwind crudo
  (`bg-green-100`, `text-yellow-700`) e ignora las variables `--color-risk-*` que ya
  existen en `globals.css`.

`src/design-system/` no lo importa nadie y declara otras familias (Manrope, Inter,
JetBrains Mono) que las que carga `src/app/layout.tsx`. Es código muerto.
