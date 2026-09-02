// ════════════════════════════════════════════════════════════
//  Perfil sociodemográfico y ocupacional de la población evaluada
// ════════════════════════════════════════════════════════════

#import "lib/theme.typ": *

#let D = json(bytes(sys.inputs.data))

#show: report.with(
  brand: if D.brand.tradeName != none { D.brand.tradeName } else { "Perfil sociodemográfico" },
  org-name: D.org.name,
  chapters: false,
)

// Una variable: tabla de frecuencias con barra proporcional. La barra se escala
// contra la categoría mayoritaria y no contra 100, porque con doce categorías
// todas las barras contra 100 quedarían igual de cortas y no distinguirían nada.
#let profile(b) = block(width: 100%, breakable: false, inset: (bottom: 12pt), {
  set par(justify: false)
  let peak = calc.max(..b.rows.map(r => r.pct), 1)

  text(font: serif, size: 10.5pt, weight: 600, fill: ink, b.title)
  if b.note != none {
    v(2pt)
    micro(b.note, size: 7pt, fill: ink3)
  }
  v(6pt)

  table(
    columns: (1.5fr, auto, auto, 1.6fr),
    align: (left + horizon, right + horizon, right + horizon, left + horizon),
    inset: (x: 6pt, y: 5pt),
    stroke: (x, y) => (top: if y == 0 { 0.7pt + ink } else { 0.3pt + rule }, rest: none),
    ..b.rows.map(r => (
      text(font: sans, size: 8pt, fill: ink, r.label),
      text(font: sans, size: 8pt, fill: ink2, num(str(r.count))),
      text(font: sans, size: 8pt, weight: 600, fill: ink, num(str(r.pct) + "%")),
      box(width: 100%, height: 6pt, {
        place(left + horizon, rect(width: 100%, height: 5pt, fill: paper, stroke: none))
        place(left + horizon,
          rect(width: (r.pct / peak) * 100%, height: 5pt, fill: ink.lighten(55%), stroke: none))
      }),
    )).flatten()
  )

  if b.missing > 0 {
    v(4pt)
    micro(
      "Sin dato registrado: " + str(b.missing) + " "
        + (if b.missing == 1 { "trabajador" } else { "trabajadores" })
        + ". Los porcentajes se calculan sobre quienes sí tienen el dato.",
      size: 6.6pt, fill: ink3,
    )
  }
})

// ════════════════════════════════════════════════════════════
//  PORTADA
// ════════════════════════════════════════════════════════════
#page(header: none, footer: none, margin: (top: 30mm, bottom: 24mm, left: 24mm, right: 24mm), {
  set par(justify: false, leading: 0.62em)

  if D.brand.logoPath != none {
    block(image(D.brand.logoPath, height: 15mm))
    v(12mm)
  } else {
    v(4mm)
  }

  label-text("Evaluación de factores de riesgo psicosocial · Resolución 2764 de 2022")
  v(6mm)

  text(font: serif, size: 30pt, weight: 600, fill: ink)[Perfil sociodemográfico]
  v(3mm)
  text(font: serif, size: 13pt, weight: 400, fill: ink2,
    "Caracterización de la población evaluada")

  v(9mm)
  line(length: 100%, stroke: 0.8pt + ink)
  v(7mm)

  label-text("Organización")
  v(2pt)
  text(font: serif, size: 17pt, weight: 600, fill: ink, D.org.name)
  v(1pt)
  text(font: sans, size: 8.5pt, fill: ink2,
    "NIT " + D.org.nit + if D.org.city != none { " · " + D.org.city } else { "" })

  v(9mm)

  grid(
    columns: (1fr, 1fr, 1fr),
    column-gutter: 12pt,
    row-gutter: 8mm,
    ..(
      ("Trabajadores evaluados", str(D.coverage.evaluated)),
      ("Fecha del informe", D.org.today),
      ("Sector económico", if D.org.economicSector != none { D.org.economicSector } else { "No registrado" }),
      ("Trabajadores registrados", str(D.coverage.registered)),
    ).map(((lbl, val)) => {
      label-text(lbl)
      v(2pt)
      text(font: sans, size: 9pt, weight: 500, fill: ink, val)
    })
  )

  place(bottom + left, block(width: 100%, {
    line(length: 100%, stroke: 0.4pt + rule)
    v(5pt)
    grid(
      columns: (1fr, auto),
      align: (left, right),
      {
        text(font: serif, size: 9.5pt, weight: 600, fill: ink, D.professional.name)
        linebreak()
        text(font: sans, size: 7pt, fill: ink3,
          "Psicólogo especialista en SST · " + D.professional.license)
      },
      if D.brand.contactLine != none {
        text(font: sans, size: 7pt, fill: ink3, D.brand.contactLine)
      },
    )
  }))
})

= Alcance

Este documento caracteriza a la población a la que se aplicó la Batería de
Instrumentos para la Evaluación de Factores de Riesgo Psicosocial. El perfil
sociodemográfico es lo que permite interpretar los resultados de riesgo: una
misma condición de trabajo no significa lo mismo en una población joven con
contrato temporal que en una con quince años de antigüedad y contrato
indefinido.

#v(4pt)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 8pt,
  ..(
    (str(D.coverage.evaluated), "Trabajadores evaluados"),
    (str(D.coverage.registered), "Trabajadores registrados"),
  ).map(((val, lbl)) => block(
    width: 100%, height: 20mm, inset: 9pt, fill: panel, stroke: 0.35pt + rule,
    {
      set par(justify: false, leading: 0.5em)
      text(font: sans, size: 18pt, weight: 600, fill: ink, num(val))
      v(3pt)
      label-text(lbl, size: 5.6pt)
    },
  ))
)

#v(8pt)

#if D.coverage.registered > D.coverage.evaluated [
  #note-block(accent: rc("MEDIO"))[
    *Cobertura parcial.* La organización tiene #D.coverage.registered
    trabajadores registrados y se evaluó a #D.coverage.evaluated. Este perfil
    describe únicamente a la población evaluada, que es la que produjo los
    resultados de riesgo; no debe leerse como la composición de la planta
    completa.
  ]
] else [
  #note-block[
    Se evaluó a la totalidad de los trabajadores registrados en la organización.
  ]
]

#v(6pt)

#micro[
  A cada trabajador se le aplican hasta tres cuestionarios, de modo que el
  número de evaluaciones supera al de personas. Todas las frecuencias de este
  informe se cuentan sobre trabajadores, nunca sobre evaluaciones.
]

= Características personales y familiares

#for b in D.personal [#profile(b)]

= Características ocupacionales

#for b in D.occupational [#profile(b)]

= Reserva de la información

#note-block[
  Los datos presentados son agregados y no permiten identificar a ningún
  trabajador. La información está sujeta a reserva profesional conforme a la
  Ley 1090 de 2006 y debe conservarse por veinte años según la Resolución 2346
  de 2007. No puede emplearse como criterio de selección, permanencia o
  desvinculación laboral.
]

#v(18pt)

#block(breakable: false, width: 100%, {
  set par(justify: false, leading: 0.6em)
  label-text("Firma del profesional evaluador")
  v(6pt)
  if D.professional.signaturePath != none {
    image(D.professional.signaturePath, height: 15mm)
    v(2pt)
  } else {
    v(13mm)
  }
  line(length: 62mm, stroke: 0.6pt + ink)
  v(4pt)
  text(font: serif, size: 11pt, weight: 600, fill: ink, D.professional.name)
  linebreak()
  set text(font: sans, size: 7.6pt, fill: ink2)
  [Psicólogo especialista en Seguridad y Salud en el Trabajo]
  linebreak()
  [Licencia SST #D.professional.license]
})
