// ════════════════════════════════════════════════════════════
//  Informe individual de evaluación de factores de riesgo psicosocial
//  Batería del Ministerio de Trabajo · Resolución 2764 de 2022
// ════════════════════════════════════════════════════════════

#import "lib/theme.typ": *

#let D = json(bytes(sys.inputs.data))

#show: report.with(
  brand: if D.brand.tradeName != none { D.brand.tradeName } else { "Informe individual" },
  org-name: D.org.name,
  chapters: false,
)

// ─── Componentes propios de este informe ────────────────────

// Distintivo de nivel: el color es el único del documento, así que basta con
// él y el número para leer un resultado de un vistazo.
#let level-chip(level, label, score) = box(
  inset: (x: 7pt, y: 4pt),
  fill: rc(level).lighten(84%),
  stroke: (left: 2pt + rc(level), rest: none),
  {
    text(font: sans, size: 7pt, weight: 600, fill: rc(level), tracking: 0.06em, upper(label))
    h(6pt)
    text(font: sans, size: 8.5pt, weight: 600, fill: ink, num(str(score)))
  },
)

// Distintivo sin nivel, para los puntajes que no tienen baremo propio: los
// cuatro grupos de síntomas del cuestionario de estrés, que el manual no
// baremiza por separado. Mostrarlos con el distintivo de color los etiquetaría
// como "muy bajo" por defecto aunque el puntaje sea alto.
#let score-chip(score) = box(
  inset: (x: 7pt, y: 4pt),
  fill: panel,
  stroke: (left: 2pt + rule2, rest: none),
  {
    text(font: sans, size: 7pt, weight: 600, fill: ink3, tracking: 0.06em, "PUNTAJE")
    h(6pt)
    text(font: sans, size: 8.5pt, weight: 600, fill: ink, num(str(score)))
  },
)

// Una dimensión: nombre, distintivo, escala de baremo y —cuando el nivel lo
// exige— la acción recomendada.
#let dimension-block(d) = block(breakable: false, width: 100%, inset: (y: 6pt), {
  // El nombre y la glosa viven en una caja del ancho de la mancha, pero la
  // glosa es sans pequeño: justificarla abre huecos visibles.
  set par(justify: false)
  grid(
    columns: (1fr, auto),
    align: (left + horizon, right + horizon),
    column-gutter: 10pt,
    text(font: serif, size: 10pt, weight: 600, fill: ink, d.name),
    if d.bounds.len() > 0 { level-chip(d.level, d.levelLabel, d.score) } else { score-chip(d.score) },
  )
  if d.bounds.len() > 0 {
    v(5pt)
    band-scale(d.bounds, d.score, height: 8pt)
  }
  if d.definition != none {
    v(4pt)
    block(micro(d.definition, size: 7.4pt, fill: ink3))
  }
  if d.action != none {
    v(4pt)
    note-block(text(size: 7.6pt)[*Acción recomendada.* #d.action], accent: rc(d.level))
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

  label-text("Batería de instrumentos para la evaluación de factores de riesgo psicosocial")
  v(6mm)

  text(font: serif, size: 30pt, weight: 600, fill: ink)[Informe individual]
  v(2mm)
  block(width: 78%, text(font: serif, size: 13pt, weight: 400, fill: ink2,
    D.meta.questionnaireLabel + if D.meta.formLabel != none { " · " + D.meta.formLabel } else { "" }))

  v(9mm)
  line(length: 100%, stroke: 0.8pt + ink)
  v(7mm)

  grid(
    columns: (1fr, 1fr),
    column-gutter: 14pt,
    row-gutter: 9pt,
    {
      label-text("Trabajador evaluado")
      v(2pt)
      text(font: serif, size: 13pt, weight: 600, fill: ink, D.worker.name)
      v(1pt)
      text(font: sans, size: 8pt, fill: ink2, D.worker.document)
    },
    {
      label-text("Empresa")
      v(2pt)
      text(font: serif, size: 13pt, weight: 600, fill: ink, D.org.name)
      v(1pt)
      text(font: sans, size: 8pt, fill: ink2, "NIT " + D.org.nit + if D.org.city != none { " · " + D.org.city } else { "" })
    },
  )

  v(9mm)

  grid(
    columns: (1fr, 1fr, 1fr),
    column-gutter: 12pt,
    ..(
      ("Fecha de aplicación", D.assessment.date),
      ("Fecha del informe", D.assessment.reportDate),
      ("Resultado global", D.overall.levelLabel),
    ).map(((lbl, val)) => {
      label-text(lbl)
      v(2pt)
      text(font: sans, size: 9pt, weight: 500, fill: ink, val)
    })
  )

  // El pie de portada se ancla abajo para que la mancha superior respire.
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

// Aviso de invalidez: sin fecha de expedición de la licencia el documento no
// puede firmarse, y debe advertirlo en la primera página del cuerpo.
#if D.meta.licenseMissing {
  note-block(accent: rc("MUY_ALTO"))[
    *Informe sin validez.* No se ha registrado la fecha de expedición de la
    licencia en Seguridad y Salud en el Trabajo del profesional evaluador, de
    modo que este documento no puede ser suscrito ni presentado ante la
    autoridad. Registre la fecha en el perfil profesional y vuelva a generarlo.
  ]
  v(6pt)
}

= Identificación

Este informe presenta los resultados de la evaluación de factores de riesgo
psicosocial aplicada al trabajador identificado a continuación, calificada con
los baremos oficiales de la Batería del Ministerio de Trabajo y clasificada
según los niveles de riesgo definidos en la Resolución 2764 de 2022.

#v(4pt)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 16pt,
  [
    #label-text("Datos del trabajador")
    #v(4pt)
    #etable(
      columns: (auto, 1fr),
      header: ("Campo", "Valor"),
      rows: D.worker.ficha.map(r => (r.label, r.value)),
    )
  ],
  [
    #label-text("Datos de la evaluación")
    #v(4pt)
    #etable(
      columns: (auto, 1fr),
      header: ("Campo", "Valor"),
      rows: (
        ("Empresa", D.org.name),
        ("NIT", D.org.nit),
        ..(if D.org.city != none { (("Ciudad", D.org.city),) } else { () }),
        ..(if D.org.economicSector != none { (("Sector económico", D.org.economicSector),) } else { () }),
        ("Instrumento", D.meta.questionnaireLabel),
        ..(if D.meta.formLabel != none { (("Forma", D.meta.formLabel),) } else { () }),
        ("Fecha de aplicación", D.assessment.date),
        ("Hora de registro", D.assessment.submittedTime),
      ),
    )
  ],
)

= Resultado global

#block(width: 100%, inset: 13pt, fill: panel, stroke: (left: 3pt + rc(D.overall.level), rest: 0.35pt + rule), {
  grid(
    columns: (1fr, auto),
    align: (left + horizon, right + horizon),
    {
      label-text(if D.meta.isStress { "Nivel de síntomas de estrés" } else { "Nivel de riesgo global" })
      v(3pt)
      text(font: serif, size: 22pt, weight: 600, fill: rc(D.overall.level), D.overall.levelLabel)
    },
    {
      set align(right)
      label-text("Puntaje transformado")
      v(3pt)
      text(font: sans, size: 22pt, weight: 600, fill: ink, num(str(D.overall.score)))
    },
  )
  if D.overall.bounds.len() > 0 {
    v(9pt)
    band-scale(D.overall.bounds, D.overall.score, height: 10pt)
    v(6pt)
    risk-legend()
  }
})

#v(8pt)

*Interpretación.* #D.overall.meaning

*Actuación requerida.* #D.overall.action

#if D.meta.isStress [
  #v(4pt)
  #note-block[
    En el cuestionario de estrés la puntuación no mide exposición a un factor de
    riesgo sino la intensidad de los síntomas reportados por el trabajador. El
    manual de la Batería baremiza únicamente el puntaje total, por lo que los
    cuatro grupos de síntomas se presentan como puntajes descriptivos y no se
    clasifican individualmente en niveles.
  ]
]

#if D.domains.len() > 0 [
  = Resultados por dominio

  Los resultados se presentan agrupados en los cuatro dominios de la Batería.
  Cada dominio muestra su puntaje transformado y su posición en la escala de
  baremo, seguido del detalle de las dimensiones que lo componen.

  #for dom in D.domains [
    == #dom.name

    #block(width: 100%, inset: 11pt, fill: panel, stroke: (left: 2.5pt + rc(dom.level), rest: none), {
      set par(justify: false)
      grid(
        columns: (1fr, auto),
        align: (left + horizon, right + horizon),
        column-gutter: 10pt,
        if dom.definition != none { micro(dom.definition) },
        level-chip(dom.level, dom.levelLabel, dom.score),
      )
      if dom.bounds.len() > 0 {
        v(7pt)
        band-scale(dom.bounds, dom.score, height: 9pt)
      }
      if dom.action != none {
        v(7pt)
        micro[*Acción sobre el dominio.* #dom.action]
      }
    })

    #v(3pt)
    #for d in dom.dimensions [#dimension-block(d)]
  ]
]

#if D.dimensions.len() > 0 [
  = #if D.meta.isStress { "Resultados por grupo de síntomas" } else { "Resultados por dimensión" }

  #if D.meta.isStress [
    Los cuatro grupos de síntomas se ordenan de mayor a menor puntaje. Un
    puntaje más alto indica mayor presencia de sintomatología en ese grupo.
  ] else [
    Las dimensiones se ordenan de mayor a menor puntaje, de modo que las
    condiciones más críticas aparezcan primero.
  ]

  #v(3pt)
  #for d in D.dimensions [#dimension-block(d)]
]

#if D.critical.len() > 0 [
  = Plan de intervención individual

  Las siguientes condiciones se clasificaron en riesgo alto o muy alto y, según
  el artículo 9 de la Resolución 2764 de 2022, requieren intervención en el
  marco del sistema de vigilancia epidemiológica. Cada acción debe asignarse a
  un responsable y a una fecha de verificación en el plan de trabajo anual.

  #v(4pt)
  #etable(
    columns: (1.1fr, auto, 2fr),
    align-spec: (left, center, left),
    header: ("Condición evaluada", "Nivel", "Acción recomendada"),
    rows: D.critical.map(c => (
      text(fill: ink, weight: 500, c.name),
      c.levelLabel,
      c.action,
    )),
  )
] else [
  = Plan de intervención individual

  #note-block[
    Ninguna de las condiciones evaluadas se clasificó en riesgo alto o muy alto,
    por lo que no se requieren acciones de intervención individual. Las
    condiciones evaluadas se mantienen dentro del programa de promoción y
    prevención de la organización.
  ]
]

= Análisis del profesional

#if D.narrative.analysis != none [
  #D.narrative.analysis
] else [
  #text(fill: ink3)[
    El profesional evaluador no registró un análisis cualitativo para esta
    evaluación. Los resultados cuantitativos presentados conservan su validez,
    pero el análisis profesional es el que permite contextualizarlos frente a
    las condiciones concretas del puesto de trabajo.
  ]
]

#if D.narrative.recommendations != none [
  == Recomendaciones del evaluador

  #D.narrative.recommendations
]

= Consideraciones legales

#bullets((
  [*Reserva profesional.* Este documento contiene información sujeta a reserva
   conforme a la Ley 1090 de 2006. Su contenido sólo puede ser conocido por el
   trabajador evaluado y por el profesional responsable de la evaluación.],
  [*Custodia.* El informe debe reposar en la historia clínica ocupacional del
   trabajador y conservarse por un periodo mínimo de veinte (20) años, de
   acuerdo con la Resolución 2346 de 2007.],
  [*Uso.* Los resultados no pueden emplearse como criterio de selección,
   permanencia o desvinculación laboral. Su finalidad es exclusivamente la
   identificación y control de los factores de riesgo psicosocial.],
  [*Alcance.* Los resultados corresponden a la percepción del trabajador en el
   momento de la aplicación y deben interpretarse junto con las demás fuentes de
   información del sistema de vigilancia epidemiológica.],
  [*Reevaluación.* La empresa debe realizar el seguimiento o reevaluación en un plazo máximo de dos años, o anualmente si existe riesgo alto o muy alto, conforme a la Resolución 2764 de 2022.],
))

#v(20pt)

// Firma: en bloque no partible para que nunca quede separada de su nombre.
#block(breakable: false, width: 100%, {
  set par(justify: false, leading: 0.6em)
  // Sin esta etiqueta el filete de firma queda flotando sin explicar qué es,
  // sobre todo cuando el bloque cae al principio de una página.
  label-text("Firma del profesional evaluador")
  v(6pt)
  if D.professional.signaturePath != none {
    image(D.professional.signaturePath, height: 15mm)
    v(2pt)
  } else {
    // Espacio para firmar a mano cuando no hay imagen registrada.
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
  if D.professional.sstLicenseDate != none [ · expedida el #D.professional.sstLicenseDate]
  if D.professional.professionalCard != none [
    #linebreak()
    Tarjeta profesional #D.professional.professionalCard
  ]
  if D.professional.sstCredential != none [
    #linebreak()
    #D.professional.sstCredential
  ]
})

#if D.glossary.len() > 0 [
  = Anexo · Glosario de las condiciones evaluadas

  Definiciones tomadas del Manual General de la Batería de Instrumentos para la
  Evaluación de Factores de Riesgo Psicosocial. Se incluyen únicamente las
  condiciones que este instrumento evaluó.

  #v(4pt)
  #for g in D.glossary [
    #block(breakable: false, inset: (bottom: 7pt), {
      set par(justify: false)
      text(font: serif, size: 9.5pt, weight: 600, fill: ink, g.name)
      linebreak()
      micro(g.definition)
    })
  ]
]
