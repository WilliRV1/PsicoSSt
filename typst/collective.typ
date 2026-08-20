// ════════════════════════════════════════════════════════════
//  Informe colectivo de riesgo psicosocial
//  Variantes: ejecutivo (gerencia) y técnico (área de SST)
// ════════════════════════════════════════════════════════════

#import "lib/theme.typ": *

#let D = json(bytes(sys.inputs.data))
#let tecnico = D.variant == "technical"

#show: report.with(
  brand: if D.brand.tradeName != none { D.brand.tradeName } else { D.variantLabel },
  org-name: D.org.name,
  chapters: false,
)

// ─── Componentes propios ────────────────────────────────────

#let stat(value, label, accent: ink) = block(
  width: 100%, height: 21mm, inset: 9pt, fill: panel, stroke: (top: 1.8pt + accent, rest: none),
  {
    set par(justify: false, leading: 0.5em)
    text(font: sans, size: 18pt, weight: 600, fill: accent, num(value))
    v(3pt)
    label-text(label, size: 5.6pt)
  },
)

// Medidor del índice de salud. Barra simple: el número ya es la cifra, la barra
// sólo sitúa dónde cae dentro del rango completo.
#let health-gauge(score) = {
  let accent = if score >= 80 { rc("SIN_RIESGO") }
    else if score >= 60 { rc("BAJO") }
    else if score >= 40 { rc("MEDIO") }
    else if score >= 20 { rc("ALTO") }
    else { rc("MUY_ALTO") }
  block(width: 100%, inset: 13pt, fill: panel, stroke: (left: 3pt + accent, rest: 0.35pt + rule), {
    set par(justify: false, leading: 0.55em)
    grid(
      columns: (1fr, auto),
      align: (left + horizon, right + horizon),
      {
        label-text("Índice de salud psicosocial")
        v(3pt)
        micro("Trabajadores sin ningún instrumento en riesgo alto o muy alto, sobre el total de evaluados.")
      },
      {
        set align(right)
        text(font: sans, size: 30pt, weight: 600, fill: accent, num(str(score)))
        text(font: sans, size: 12pt, weight: 500, fill: ink3, "/100")
      },
    )
    v(9pt)
    box(width: 100%, height: 9pt, {
      place(top + left, rect(width: 100%, height: 9pt, fill: rule, stroke: none))
      place(top + left, rect(width: score * 1%, height: 9pt, fill: accent, stroke: none))
    })
  })
}

#let domain-list(items) = for d in items {
  block(width: 100%, breakable: false, inset: (bottom: 10pt), {
    set par(justify: false)
    grid(
      columns: (1fr, auto),
      align: (left + bottom, right + bottom),
      column-gutter: 10pt,
      text(font: serif, size: 10pt, weight: 600, fill: ink, d.name),
      {
        text(font: sans, size: 6.5pt, weight: 600, fill: rc(d.level),
          tracking: 0.06em, upper(risk-labels.at(d.level)))
        h(6pt)
        text(font: sans, size: 9.5pt, weight: 600, fill: ink, num(str(d.avg)))
        h(6pt)
        text(font: sans, size: 6.5pt, fill: ink3, num(str(d.count)) + " evaluados")
      },
    )
    if d.bounds.len() > 0 {
      v(5pt)
      band-scale(d.bounds, d.avg, height: 9pt)
    }
    if d.definition != none {
      v(4pt)
      micro(d.definition, size: 7.2pt, fill: ink3)
    }
  })
}

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

  text(font: serif, size: 30pt, weight: 600, fill: ink)[Informe colectivo]
  v(3mm)
  text(font: serif, size: 14pt, weight: 400, fill: ink2,
    if tecnico [Versión técnica · dirigida al área de Seguridad y Salud en el Trabajo]
    else [Versión ejecutiva · dirigida a la dirección de la organización])

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
      ("Periodo evaluado", D.org.dateStart + " — " + D.org.dateEnd),
      ("Trabajadores evaluados", str(D.coverage.uniqueWorkers)),
      ("Índice de salud", str(D.healthScore) + "/100"),
      ("Fecha del informe", D.org.today),
      ("Vigencia del diagnóstico", str(D.validity.years) + if D.validity.years == 1 { " año" } else { " años" }),
      ("Próxima evaluación", D.validity.expiresOn),
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

= Panorama general

#grid(
  columns: (1fr, 1fr, 1fr, 1fr),
  column-gutter: 8pt,
  stat(str(D.coverage.uniqueWorkers), "Trabajadores evaluados"),
  stat(str(D.coverage.totalAssessments), "Evaluaciones aplicadas"),
  stat(str(D.coverage.criticalWorkers), "En riesgo alto o muy alto",
    accent: if D.coverage.criticalWorkerPercent >= 20 { rc("ALTO") } else { ink }),
  stat(str(D.groups.prioritarios), "Prioridad de intervención",
    accent: if D.groups.prioritarios > 0 { rc("MUY_ALTO") } else { ink }),
)

#v(9pt)

#health-gauge(D.healthScore)

#v(8pt)

#micro[
  A cada trabajador se le aplican hasta tres cuestionarios, de modo que el
  número de evaluaciones supera al de personas. Las cifras que se refieren a
  trabajadores y las que se refieren a evaluaciones se identifican como tales a
  lo largo del informe.
]

== Vigencia del diagnóstico

#if D.validity.years == 1 [
  #note-block(accent: rc("ALTO"))[
    *Vigencia de un año.* La evaluación debe repetirse a más tardar el
    #D.validity.expiresOn, y no en el plazo ordinario de dos años, porque
    #D.validity.reasons.join(", ", last: " y ").
  ]
] else [
  #note-block[
    *Vigencia de dos años.* El diagnóstico no presenta las condiciones que
    obligan a acortar el plazo, de modo que la evaluación debe repetirse a más
    tardar el #D.validity.expiresOn, conforme a la Resolución 2764 de 2022.
  ]
]

#if not tecnico [
  = Lectura consultiva

  #if D.narrative != none [
    #D.narrative

    #v(4pt)
    #micro[
      Texto redactado con asistencia de inteligencia artificial a partir de las
      cifras de este informe, y sujeto a la revisión del profesional que lo
      suscribe.
    ]
  ] else [
    #note-block[
      No se generó la lectura consultiva asistida para este informe. Las
      conclusiones y recomendaciones que siguen se derivan directamente de los
      resultados y no dependen de esa capa.
    ]
  ]

  #if D.actionPlan.len() > 0 [
    == Plan de acción propuesto

    #v(4pt)
    #etable(
      columns: (auto, 2.4fr, 1fr, auto, auto),
      align-spec: (center, left, left, center, center),
      header: ("Prioridad", "Acción", "Responsable", "Plazo", "Impacto"),
      rows: D.actionPlan.map(r => (
        text(weight: 600,
          fill: if r.priority == "Alta" { rc("MUY_ALTO") }
                else if r.priority == "Media" { rc("MEDIO") }
                else { ink2 },
          r.priority),
        text(fill: ink, r.action),
        r.responsible,
        r.time,
        r.impact,
      )),
    )
  ]
]

= Prioridades

#let criticas = D.dimensions.filter(d => d.criticalPercent >= 20)

#if criticas.len() == 0 [
  #note-block[
    Ninguna dimensión alcanza el 20% de trabajadores en riesgo alto o muy alto.
    No se identifican focos que exijan intervención específica.
  ]
] else [
  Condiciones con mayor proporción de trabajadores en riesgo alto o muy alto.
  El porcentaje se calcula sobre quienes respondieron el cuestionario
  correspondiente.

  #v(5pt)

  #for d in criticas.slice(0, if tecnico { criticas.len() } else { calc.min(5, criticas.len()) }) {
    block(width: 100%, breakable: false, inset: (bottom: 8pt), {
      set par(justify: false)
      grid(
        columns: (1fr, auto),
        align: (left + horizon, right + horizon),
        column-gutter: 10pt,
        {
          text(font: serif, size: 10pt, weight: 600, fill: ink, d.name)
          h(6pt)
          text(font: sans, size: 6.5pt, fill: ink3, d.questionnaire)
        },
        text(font: sans, size: 10pt, weight: 600,
          fill: if d.criticalPercent >= 40 { rc("MUY_ALTO") } else { rc("ALTO") },
          num(str(d.criticalPercent) + "%")),
      )
      v(4pt)
      // Barra proporcional al porcentaje crítico, sobre el 100% de la columna.
      box(width: 100%, height: 6pt, {
        place(top + left, rect(width: 100%, height: 6pt, fill: rule, stroke: none))
        place(top + left, rect(width: d.criticalPercent * 1%, height: 6pt,
          fill: if d.criticalPercent >= 40 { rc("MUY_ALTO") } else { rc("ALTO") }, stroke: none))
      })
      if d.action != none {
        v(5pt)
        micro[*Acción recomendada.* #d.action]
      }
    })
  }

  #if not tecnico and criticas.len() > 5 [
    #micro[
      Se listan las cinco condiciones de mayor prevalencia. Las
      #(criticas.len() - 5) restantes con al menos un 20% de trabajadores en
      riesgo crítico se detallan en la versión técnica de este informe.
    ]
  ]
]

#if D.alerts.len() > 0 [
  = Alertas por subgrupo

  Grupos cuya proporción de trabajadores en riesgo crítico supera en al menos
  quince puntos porcentuales el promedio de la organización
  (#D.coverage.criticalWorkerPercent%). Señalan dónde la exposición se
  concentra y permiten dirigir la intervención en lugar de repartirla.

  #v(5pt)

  #etable(
    columns: (auto, 1.6fr, auto, auto, auto),
    align-spec: (left, left, center, center, center),
    header: ("Variable", "Grupo", "Trabajadores", "% crítico", "Desviación"),
    rows: D.alerts.map(a => (
      a.variable,
      text(fill: ink, weight: 500, a.group),
      num(str(a.workers)),
      text(weight: 600, fill: rc(if a.riskPercent >= 40 { "MUY_ALTO" } else { "ALTO" }),
        num(str(a.riskPercent) + "%")),
      num("+" + str(a.difference) + " pp"),
    )),
  )

  #if D.alertsWithheld > 0 [
    #v(4pt)
    #micro[
      Se excluyeron #D.alertsWithheld grupos con menos de diez trabajadores. Por
      debajo de ese tamaño un solo caso desplaza el porcentaje decenas de puntos
      y el resultado no distingue una tendencia de una coincidencia, además de
      comprometer el anonimato de sus integrantes.
    ]
  ]
]

#if tecnico [
  = Resultados por dominio

  Puntaje transformado promedio de cada dominio sobre las bandas de baremo de su
  forma. El marcador señala el valor observado.

  #if D.domains.formA.len() > 0 [
    == Forma A · jefaturas, profesionales y técnicos
    #domain-list(D.domains.formA)
  ]
  #if D.domains.formB.len() > 0 [
    == Forma B · auxiliares y operarios
    #domain-list(D.domains.formB)
  ]
  #if D.domains.formA.len() == 0 and D.domains.formB.len() == 0 [
    #note-block[
      No hay resultados de dominio disponibles: requieren evaluaciones del
      cuestionario intralaboral calificadas.
    ]
  ]

  = Distribución por instrumento

  #for (title, n, dist) in (
    ("Intralaboral", D.coverage.intra, D.distributions.intra),
    ("Extralaboral", D.coverage.extra, D.distributions.extra),
    ("Estrés", D.coverage.stress, D.distributions.stress),
  ) {
    block(width: 100%, breakable: false, inset: (bottom: 9pt), {
      set par(justify: false)
      grid(
        columns: (1fr, auto),
        align: (left + horizon, right + horizon),
        text(font: serif, size: 10pt, weight: 600, fill: ink, title),
        text(font: sans, size: 7pt, fill: ink3, num(str(n)) + " evaluaciones"),
      )
      v(5pt)
      stacked-bar(dist, height: 9pt)
      v(5pt)
      grid(
        columns: (1fr,) * 5,
        ..risk-keys.map(k => {
          set align(center)
          text(font: sans, size: 8.5pt, weight: 600, fill: rc(k), num(str(dist.at(k)) + "%"))
          linebreak()
          text(font: sans, size: 5.5pt, fill: ink3, risk-labels.at(k))
        })
      )
    })
  }

  #if D.correlationBase > 0 [
    = Riesgo intralaboral y sintomatología de estrés

    Cruce de ambos instrumentos sobre los #D.correlationBase trabajadores que
    tienen calificados los dos cuestionarios.

    #v(5pt)

    #block(breakable: false, grid(
      columns: (1fr, 1fr),
      column-gutter: 8pt,
      row-gutter: 8pt,
      quad-cell("Grupo A", "Sanos", D.groups.sanos,
        "Sin riesgo crítico y sin sintomatología. Mantener las condiciones.",
        rc("SIN_RIESGO")),
      quad-cell("Grupo B", "Vulnerables", D.groups.vulnerables,
        "Sintomatología sin exposición crítica. Revisar factores extralaborales.",
        rc("MEDIO")),
      quad-cell("Grupo C", "Adaptados", D.groups.adaptados,
        "Exposición crítica sin sintomatología. Intervenir antes del daño.",
        rc("ALTO")),
      quad-cell("Grupo D", "Prioridad de intervención", D.groups.prioritarios,
        "Exposición y sintomatología simultáneas. Atención inmediata.",
        rc("MUY_ALTO")),
    ))

    #v(9pt)
    #heat-matrix(
      D.correlation,
      row-label: "Filas: riesgo intralaboral",
      col-label: "Columnas: sintomatología de estrés",
    )
  ]

  #if D.areas.reported.len() > 0 [
    = Resultados por área

    #etable(
      columns: (2fr, auto, auto, auto, 2fr),
      align-spec: (left, center, center, center, left),
      header: ("Área", "Trabajadores", "Evaluaciones", "% crítico", "Distribución"),
      rows: D.areas.reported.map(a => (
        text(fill: ink, weight: 500, a.name),
        num(str(a.workers)),
        num(str(a.assessments)),
        text(fill: if a.criticalPercent >= 40 { rc("MUY_ALTO") }
                   else if a.criticalPercent >= 20 { rc("ALTO") } else { ink2 },
          weight: 600, num(str(a.criticalPercent) + "%")),
        stacked-bar(a.dist, height: 7pt),
      )),
    )

    #if D.areas.withheld.areas > 0 [
      #v(4pt)
      #micro[
        Se omitieron #D.areas.withheld.areas áreas con menos de
        #D.minGroupSize trabajadores, para no exponer resultados
        individualizables. Sus #D.areas.withheld.workers trabajadores están
        incluidos en las cifras generales.
      ]
    ]
  ]
]

= Conclusiones

#bullets((
  [Se evaluaron #D.coverage.uniqueWorkers trabajadores mediante
   #D.coverage.totalAssessments aplicaciones de la Batería, entre
   #D.org.dateStart y #D.org.dateEnd. El índice de salud psicosocial resultante
   es de #D.healthScore sobre 100.],
  ..(if D.coverage.criticalWorkerPercent >= 20 {
      ([#D.coverage.criticalWorkers trabajadores —el
        #D.coverage.criticalWorkerPercent%— presentan al menos un instrumento en
        riesgo alto o muy alto. Al alcanzar el umbral del 20% de la población
        evaluada, la organización debe implementar un sistema de vigilancia
        epidemiológica de factores de riesgo psicosocial conforme a la
        Resolución 2764 de 2022.],)
    } else {
      ([#D.coverage.criticalWorkers trabajadores —el
        #D.coverage.criticalWorkerPercent%— presentan al menos un instrumento en
        riesgo alto o muy alto, por debajo del umbral del 20% que obliga a
        implementar un sistema de vigilancia epidemiológica.],)
    }),
  ..(if D.groups.prioritarios > 0 {
      ([#D.groups.prioritarios trabajadores concentran exposición crítica y
        sintomatología de estrés de forma simultánea. Constituyen la prioridad
        de intervención y requieren seguimiento individual documentado.],)
    } else { () }),
  ..(if D.alerts.len() > 0 {
      ([La exposición no se distribuye de manera homogénea: #D.alerts.len()
        #if D.alerts.len() == 1 { "subgrupo se desvía" } else { "subgrupos se desvían" }
        al menos quince puntos porcentuales por encima del promedio, encabezados
        por #D.alerts.first().group.],)
    } else { () }),
  [La próxima evaluación debe realizarse a más tardar el #D.validity.expiresOn.],
))

= Reserva de la información

#note-block[
  Los resultados de este informe son agregados y no permiten identificar a
  ningún trabajador. Ningún grupo se reporta por separado con menos de
  #D.minGroupSize trabajadores. La información está sujeta a reserva profesional
  conforme a la Ley 1090 de 2006 y debe conservarse por veinte años según la
  Resolución 2346 de 2007. Los resultados no pueden emplearse como criterio de
  selección, permanencia o desvinculación laboral.
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
