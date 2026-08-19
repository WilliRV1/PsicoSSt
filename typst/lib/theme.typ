// ════════════════════════════════════════════════════════════
//  Sistema de diseño de los informes de PsicoSST.
//
//  Registro editorial neutro: gris cálido para todo el documento y color
//  reservado exclusivamente a los cinco niveles de riesgo, de modo que
//  cualquier mancha de color en una página signifique siempre lo mismo.
//
//  Todo informe empieza con:
//      #import "lib/theme.typ": *
//      #show: report.with(brand: ..., org-name: ...)
// ════════════════════════════════════════════════════════════

// ─── Paleta neutra ──────────────────────────────────────────
#let paper   = rgb("#FCFBFA")
#let ink     = rgb("#16150F")
#let ink2    = rgb("#57534E")
#let ink3    = rgb("#8A857E")
#let rule    = rgb("#E2DFDA")
#let rule2   = rgb("#CFCBC4")
#let panel   = rgb("#F5F3F0")

// Único color del documento: severidad del riesgo.
#let risk-colors = (
  SIN_RIESGO: rgb("#3E7A63"),
  BAJO:       rgb("#6F9558"),
  MEDIO:      rgb("#C39A3B"),
  ALTO:       rgb("#BE7039"),
  MUY_ALTO:   rgb("#A34037"),
)
#let risk-keys = ("SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO")
#let risk-labels = (
  SIN_RIESGO: "Sin riesgo", BAJO: "Bajo", MEDIO: "Medio",
  ALTO: "Alto", MUY_ALTO: "Muy alto",
)
#let rc(k) = risk-colors.at(k, default: ink3)

// ─── Tipografía ─────────────────────────────────────────────
#let serif = "Source Serif 4"
#let sans  = "Inter"

#let label-text(s, size: 6.5pt, fill: ink3, tracking: 0.09em) = {
  // Nunca justificar ni separar con guion: estas etiquetas viven en cajas
  // estrechas y ambas cosas las destrozan.
  set par(justify: false, leading: 0.5em)
  text(font: sans, size: size, weight: 600, fill: fill, tracking: tracking,
    hyphenate: false, upper(s))
}

// Cifras tabulares: en una columna de números todos deben ocupar lo mismo.
#let num(s) = text(font: sans, features: ("tnum",), s)

// ─── Componentes ────────────────────────────────────────────

// Tabla editorial: sin verticales, sólo filetes horizontales.
#let etable(columns: (), header: (), rows: (), align-spec: none) = {
  set text(font: sans, size: 8pt, fill: ink2, hyphenate: false)
  // Bandera, no justificado: las columnas son estrechas y justificar abre
  // huecos enormes entre palabras y parte todo con guiones.
  set par(justify: false, leading: 0.62em)
  let al = if align-spec == none { columns.map(_ => left) } else { align-spec }
  table(
    columns: columns,
    align: al,
    inset: (x: 7pt, y: 6.5pt),
    stroke: (x, y) => (
      top: if y == 0 { 0.9pt + ink } else if y == 1 { 0.7pt + ink } else { 0.35pt + rule },
      bottom: none, left: none, right: none,
    ),
    table.header(..header.map(h => label-text(h, size: 6.3pt, fill: ink2))),
    ..rows.flatten(),
  )
  v(2pt)
}

// Barra apilada de distribución de riesgo.
#let stacked-bar(dist, height: 8pt) = {
  let vals = risk-keys.map(k => calc.max(dist.at(k, default: 0), 0))
  if vals.sum() == 0 { return box(height: height, width: 100%, fill: rule) }
  grid(
    columns: vals.map(v => v * 1fr),
    rows: (height,),
    ..risk-keys.enumerate().map(((i, k)) =>
      if vals.at(i) > 0 { rect(width: 100%, height: height, fill: rc(k), stroke: none) }
      else { none }
    )
  )
}

#let risk-legend() = {
  set text(font: sans, size: 6.3pt, fill: ink2)
  grid(
    columns: (auto,) * 10,
    column-gutter: 4pt,
    align: horizon,
    ..risk-keys.map(k => (
      rect(width: 6pt, height: 6pt, fill: rc(k), stroke: none),
      risk-labels.at(k),
    )).flatten()
  )
}

// Escala de baremo: cinco bandas de igual ancho con el marcador interpolado
// dentro de su banda. Usar anchos proporcionales al puntaje haría que la banda
// "muy alto" (que llega a 100) se comiera más de la mitad de la escala y
// aplastara toda la discriminación útil a la izquierda.
#let band-scale(bounds, value, height: 11pt) = {
  let n = bounds.len()
  let idx = n - 1
  let frac = 1.0
  let done = false
  for (i, b) in bounds.enumerate() {
    if not done and value <= b {
      idx = i
      let prev = if i == 0 { 0.0 } else { bounds.at(i - 1) }
      frac = if b - prev > 0 { (value - prev) / (b - prev) } else { 0.0 }
      done = true
    }
  }
  let pos = (idx + calc.min(calc.max(frac, 0.0), 1.0)) / n

  block(width: 100%, {
    box(width: 100%, height: height, {
      place(top + left, grid(
        columns: (1fr,) * n,
        rows: (height,),
        ..risk-keys.map(k => rect(width: 100%, height: height, fill: rc(k).lighten(62%), stroke: none))
      ))
      // Marcador del valor observado.
      place(top + left, dx: pos * 100% - 0.9pt,
        rect(width: 1.8pt, height: height, fill: ink, stroke: none))
    })
    // Umbrales de cada banda, alineados al borde derecho de su tramo.
    v(2pt)
    grid(
      columns: (1fr,) * n,
      ..bounds.map(b => align(right, text(font: sans, size: 5.4pt, fill: ink3,
        num(str(calc.round(b, digits: 1))))))
    )
  })
}

// Celda del cuadrante 2×2. Altura fija para que las dos filas se alineen.
#let quad-cell(tag, name, n, desc, accent) = block(
  width: 100%, height: 45mm, inset: 11pt, fill: panel,
  stroke: (left: 2.5pt + accent, rest: 0.35pt + rule),
  {
    set par(justify: false, leading: 0.6em)
    label-text(tag, size: 6.2pt, fill: accent)
    v(2pt)
    text(font: serif, size: 11.5pt, weight: 600, fill: ink, name)
    v(2pt)
    text(font: sans, size: 22pt, weight: 600, fill: accent, num(str(n)))
    v(3pt)
    text(font: sans, size: 6.8pt, fill: ink2, desc)
  }
)

#let note-block(body, accent: ink) = block(
  width: 100%, inset: (x: 12pt, y: 10pt), fill: panel,
  stroke: (left: 2.5pt + accent, rest: none),
  {
    set par(justify: false, leading: 0.62em)
    text(font: sans, size: 8pt, fill: ink2, hyphenate: false, body)
  }
)

// Texto auxiliar en sans: definiciones, notas al pie de un bloque, glosas.
// Siempre en bandera — nunca vive en una columna lo bastante ancha como para
// que justificarlo salga bien.
#let micro(body, size: 7.6pt, fill: ink2) = {
  set par(justify: false, leading: 0.6em)
  text(font: sans, size: size, fill: fill, hyphenate: false, body)
}

// Mapa de calor 5x5 del cruce entre dos instrumentos. La intensidad se
// normaliza contra el pico de la matriz, no contra un máximo fijo: con un
// máximo fijo una organización pequeña saldría toda del mismo tono pálido.
#let heat-matrix(matrix, row-label: "", col-label: "") = block(breakable: false, {
  let flat = matrix.flatten()
  let peak = if flat.len() > 0 { calc.max(..flat) } else { 0 }
  set text(font: sans, size: 7.5pt)
  table(
    columns: (auto,) + (1fr,) * 5,
    align: center + horizon,
    inset: (x: 5pt, y: 7pt),
    stroke: 0.35pt + rule,
    table.header(
      table.cell(fill: paper)[],
      ..risk-keys.map(k => table.cell(fill: paper,
        label-text(risk-labels.at(k), size: 5.6pt, tracking: 0.05em)))
    ),
    ..matrix.enumerate().map(((i, row)) => (
      table.cell(align: right, fill: paper,
        label-text(risk-labels.at(risk-keys.at(i)), size: 5.6pt, tracking: 0.05em)),
      ..row.map(v => table.cell(
        fill: if v == 0 or peak == 0 { paper } else { ink.lighten(100% - (18% + 62% * v / peak)) },
        text(fill: if peak > 0 and v / peak > 0.55 { paper } else { ink },
          weight: 600, num(if v == 0 { "·" } else { str(v) }))
      ))
    )).flatten()
  )
  if row-label != "" or col-label != "" {
    v(3pt)
    grid(columns: (1fr, 1fr), align: (left, right),
      label-text(row-label, size: 5.8pt),
      label-text(col-label, size: 5.8pt))
  }
})

#let bullets(items) = for it in items [
  #grid(columns: (11pt, 1fr), gutter: 0pt,
    text(fill: ink3, "—"),
    block(inset: (bottom: 4.5pt), it))
]

// ─── Plantilla ──────────────────────────────────────────────
//
// `chapters: true`  — capítulos en romano, cada uno abre página con un
//                     numeral grande. Para documentos largos (SVE, colectivo).
// `chapters: false` — secciones "1.", "1.1" en flujo continuo, sin salto de
//                     página. Para documentos cortos donde forzar un salto por
//                     sección dejaría media página en blanco (informe
//                     individual, sociodemográfico).
#let report(
  brand: none,
  org-name: "",
  chapters: true,
  body,
) = {
  set page(
    paper: "a4",
    margin: (top: 26mm, bottom: 22mm, left: 24mm, right: 24mm),
    fill: paper,
    header: {
      set text(font: sans, size: 6.5pt, fill: ink3, tracking: 0.08em)
      grid(
        columns: (1fr, auto),
        align: (left, right),
        upper(if brand != none { brand } else { "" }),
        upper(org-name),
      )
      v(-6pt)
      line(length: 100%, stroke: 0.4pt + rule)
    },
    footer: context {
      set align(center)
      text(font: serif, size: 9pt, fill: ink3, num(str(counter(page).get().first())))
    },
  )

  set text(font: serif, size: 10pt, fill: ink, lang: "es", hyphenate: true)
  set par(justify: true, leading: 0.72em, spacing: 1.05em, first-line-indent: 0pt)

  show strong: set text(weight: 600)
  show emph: set text(style: "italic")

  if chapters {
    // Capítulos en romano; secciones como "4.1" para seguir la convención
    // de los documentos de SST.
    set heading(numbering: (..n) => {
      let v = n.pos()
      if v.len() == 1 { numbering("I.", ..v) } else { str(v.at(0)) + "." + str(v.at(1)) }
    })

    // Capítulo: portadilla con numeral grande.
    show heading.where(level: 1): it => {
      pagebreak(weak: true)
      block(above: 0pt, below: 26pt, {
        text(font: serif, size: 58pt, weight: 300, fill: rule2,
          counter(heading).display("I"))
        v(-14pt)
        line(length: 46pt, stroke: 1pt + ink)
        v(10pt)
        text(font: serif, size: 21pt, weight: 600, fill: ink, it.body)
      })
    }
    show heading.where(level: 2): it => block(above: 20pt, below: 9pt, {
      text(font: serif, size: 13pt, weight: 600, fill: ink,
        counter(heading).display() + h(6pt) + it.body)
    })
    show heading.where(level: 3): it => block(above: 14pt, below: 6pt,
      label-text(it.body, size: 7pt, fill: ink2))

    body
  } else {
    set heading(numbering: "1.1")

    // Sin salto de página: sólo una regla superior y el numeral al margen,
    // para que las secciones cortas no dejen huecos.
    show heading.where(level: 1): it => block(above: 26pt, below: 11pt, {
      line(length: 100%, stroke: 0.9pt + ink)
      v(7pt)
      grid(
        columns: (auto, 1fr),
        column-gutter: 9pt,
        text(font: sans, size: 13pt, weight: 600, fill: ink3,
          counter(heading).display()),
        text(font: serif, size: 16pt, weight: 600, fill: ink, it.body),
      )
    })
    show heading.where(level: 2): it => block(above: 16pt, below: 7pt, {
      text(font: serif, size: 11.5pt, weight: 600, fill: ink,
        counter(heading).display() + h(6pt) + it.body)
    })
    show heading.where(level: 3): it => block(above: 12pt, below: 5pt,
      label-text(it.body, size: 7pt, fill: ink2))

    body
  }
}
