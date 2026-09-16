# Sistema de diseño PsicoSST — dirección «clínico editorial»

Las 46 pantallas del sistema, dibujadas como artboards de un lienzo de Claude Design.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `lib.mjs` | El sistema: paleta, tipografía, iconos, primitivas de riesgo, chasis de aplicación |
| `screens/*.mjs` | Una pantalla o un grupo de pantallas por archivo |
| `screens/graficos.mjs` | Primitivas de visualización (barras, apiladas, líneas) |
| `build.mjs` | Compone `artboards/*.dc.html` y `artboards/canvas.json` |
| `preview.mjs` | Convierte un artboard en HTML plano para mirarlo en el navegador |
| `audit.mjs` + `scan.py` | Miden la altura real de cada artboard y detectan recortes |

## Reconstruir

```bash
node build.mjs          # regenera los 46 artboards y el canvas.json
node preview.mjs [Main] # HTML plano en .preview/ para inspección visual
node audit.mjs          # prepara la auditoría de alturas
python3 scan.py         # informa recortes y holguras (requiere capturas en .audit/)
```

## La dirección

La paleta, los radios y las familias tipográficas se conservan tal como están en
`src/app/globals.css`. Lo que cambia es la **escala**:

- **Barlow Semi Condensed** deja de ser solo una etiqueta de 10 px y pasa a titular de hasta 78 px.
- **Source Serif 4** —hoy reservada a los PDF— entra a pantalla para la narrativa interpretativa.
- **IBM Plex Mono** cubre todo dato: puntaje, porcentaje, fecha, folio y huella.
- **IBM Plex Sans** se queda en la interfaz.

### Reglas

1. **Filete, no sombra.** La interfaz se construye con líneas de 1 px. La única sombra permitida es el anillo de foco.
2. **El degradado vive en el isotipo.** Los tres tonos teal→cian→azul son la marca; en ningún otro sitio.
3. **El dato es monoespaciado**, con cifras tabulares, y en formato colombiano (`58,2`, no `58.2`).
4. **La interpretación es texto**, compuesta en la misma familia del PDF.
5. **El riesgo nunca decora.** Naranja y rojo significan un nivel de la Resolución 2646.
6. **Cada cifra tiene procedencia.** Todo puntaje enlaza a los ítems que lo originaron.

### El ordinal de riesgo

Cada nivel se acompaña siempre de un indicador de cinco pasos (`pasos()` en `lib.mjs`).
El color solo confirma lo que ya dice la posición, así que el nivel sobrevive a la
impresión en blanco y negro, al daltonismo y a la miniatura de una tabla densa.

### Paleta categórica de los informes

`CAT` en `lib.mjs` nace del teal primario y del azul del isotipo, y está verificada con
el validador de la guía de visualización: banda de luminosidad, piso de croma, ΔE 11,2
en el peor par adyacente bajo protanopía y contraste ≥ 3:1 contra la superficie.
`CAT_OSCURO` es la versión para modo oscuro, validada por separado (ΔE 13,5).

## Dos correcciones al producto que el rediseño incorpora

- **Navegación**: la barra lateral implementada lista 5 destinos para ~30 páginas. IA,
  analítica, tendencias, intervenciones, créditos, trabajadores y el módulo admin no son
  alcanzables salvo escribiendo la URL. Aquí el sistema entero se agrupa en cuatro bloques.
- **Escala de riesgo**: `src/components/psicosst/risk-badge.tsx` usa Tailwind crudo
  (`bg-green-100`, `text-yellow-700`) e ignora las variables `--color-risk-*` que ya
  existen en `globals.css`. El sistema de aquí consume los tokens.

`src/design-system/` no lo importa nadie y declara otras familias (Manrope, Inter,
JetBrains Mono) que las que carga `src/app/layout.tsx`. Es código muerto.
