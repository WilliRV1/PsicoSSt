// ════════════════════════════════════════════════════════════
//  Informe diagnóstico organizacional de riesgo psicosocial
//  Batería del Ministerio de Trabajo · Resolución 2764 de 2022
// ════════════════════════════════════════════════════════════

#import "lib/theme.typ": *

#let D = json(bytes(sys.inputs.data))

#show: report.with(
  brand: if D.brand.tradeName != none { D.brand.tradeName } else { "Diagnóstico organizacional" },
  org-name: D.org.name,
  chapters: false,
)

// ─── Componentes propios ────────────────────────────────────

// Cifra destacada con su rótulo. Se usa en rejilla, así que la altura tiene que
// ser la misma aunque el rótulo ocupe una o dos líneas.
#let stat(value, label) = block(
  width: 100%, height: 22mm, inset: 9pt, fill: panel, stroke: 0.35pt + rule,
  {
    set par(justify: false, leading: 0.5em)
    text(font: sans, size: 19pt, weight: 600, fill: ink, num(value))
    v(3pt)
    label-text(label, size: 5.8pt)
  },
)

// Distribución de un instrumento: barra apilada más los porcentajes.
#let dist-panel(title, dist) = block(
  width: 100%, inset: 10pt, fill: panel, stroke: 0.35pt + rule,
  {
    set par(justify: false, leading: 0.55em)
    text(font: serif, size: 10.5pt, weight: 600, fill: ink, title)
    v(7pt)
    stacked-bar(dist, height: 9pt)
    v(6pt)
    grid(
      columns: (1fr,) * 5,
      ..risk-keys.map(k => {
        set align(center)
        text(font: sans, size: 9pt, weight: 600, fill: rc(k), num(str(dist.at(k)) + "%"))
        linebreak()
        text(font: sans, size: 5.5pt, fill: ink3, risk-labels.at(k))
      })
    )
  },
)

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

  label-text("Batería de instrumentos para la evaluación de factores de riesgo psicosocial")
  v(6mm)

  text(font: serif, size: 30pt, weight: 600, fill: ink)[Informe diagnóstico]
  linebreak()
  text(font: serif, size: 30pt, weight: 600, fill: ink)[organizacional]
  v(3mm)
  text(font: serif, size: 13pt, weight: 400, fill: ink2,
    "Resolución 2764 de 2022 · Ministerio del Trabajo de Colombia")

  v(9mm)
  line(length: 100%, stroke: 0.8pt + ink)
  v(7mm)

  label-text("Empresa evaluada")
  v(2pt)
  text(font: serif, size: 17pt, weight: 600, fill: ink, D.org.name)
  v(1pt)
  text(font: sans, size: 8.5pt, fill: ink2, "NIT " + D.org.nit)

  v(9mm)

  grid(
    columns: (1fr, 1fr, 1fr),
    column-gutter: 12pt,
    row-gutter: 8mm,
    ..(
      ("Trabajadores evaluados", str(D.coverage.uniqueWorkers)),
      ("Fecha del informe", D.org.today),
      ("Trabajadores en riesgo crítico", str(D.coverage.criticalWorkerPercent) + "%"),
      ("Sector económico", if D.org.economicSector != none { D.org.economicSector } else { "No registrado" }),
      ("Ciudad", if D.org.city != none { D.org.city } else { "No registrada" }),
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

// ─── Índice ─────────────────────────────────────────────────
// Compacto y en el flujo, no en página propia: el cuerpo del informe son pocas
// páginas y dedicarle una entera al contenido sería puro relleno.
#block(width: 100%, inset: (x: 12pt, y: 11pt), fill: panel, stroke: 0.35pt + rule, {
  label-text("Contenido")
  v(6pt)
  show outline.entry.where(level: 1): it => text(font: sans, size: 8pt, weight: 600, fill: ink, it)
  show outline.entry.where(level: 2): it => text(font: sans, size: 7.2pt, fill: ink3, it)
  set par(leading: 0.52em)
  outline(title: none, depth: 2, indent: 11pt)
})

#v(14pt)

= Presentación y alcance

Este documento presenta el diagnóstico de los factores de riesgo psicosocial de
#D.org.name, elaborado a partir de la aplicación de la Batería de Instrumentos
para la Evaluación de Factores de Riesgo Psicosocial del Ministerio del Trabajo
y calificado con los baremos vigentes conforme a la Resolución 2764 de 2022.

El diagnóstico es el insumo del que se derivan el programa de vigilancia
epidemiológica y el plan de intervención de la organización. Sus resultados son
estrictamente estadísticos: describen condiciones de grupos de trabajadores, no
situaciones individuales.

= Metodología

#bullets((
  [*Instrumento utilizado:* Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial, desarrollada por la Pontificia Universidad Javeriana y el Ministerio de la Protección Social (2010), y adoptada mediante la Resolución 2764 de 2022 del Ministerio del Trabajo de Colombia.],
  [*Cuestionarios aplicados:* Cuestionario de Factores de Riesgo Psicosocial Intralaboral (Formas A y B), Extralaboral, y para la Evaluación del Estrés.],
  [*Baremos poblacionales:* Tablas de clasificación nacionales establecidas y actualizadas en la Resolución 2764 de 2022.],
  [*Profesional responsable:* #D.professional.name, con licencia en Seguridad y Salud en el Trabajo #D.professional.license.],
))

== Cobertura de la evaluación

#grid(
  columns: (1fr, 1fr),
  column-gutter: 8pt,
  stat(str(D.coverage.uniqueWorkers), "Trabajadores evaluados"),
  stat(str(D.coverage.criticalWorkerPercent) + "%", "Trabajadores en riesgo alto o muy alto"),
)

#v(7pt)

#micro[
  A cada trabajador se le aplican hasta tres cuestionarios —intralaboral,
  extralaboral y de estrés—. El nivel de riesgo de la empresa, del que depende
  la periodicidad de la evaluación, se calcula aparte según el artículo 3 de la
  Resolución 2764 de 2022.
]

#v(8pt)

#if D.coverage.predominant != none [
  El nivel de riesgo más frecuente es *#lower(D.coverage.predominant.label)*, con
  el #D.coverage.predominant.percent% de los resultados.
  #if D.coverage.highest != none and D.coverage.highest.level != D.coverage.predominant.level [
    El nivel más severo registrado es *#lower(D.coverage.highest.label)*.
  ]
]

#if D.coverage.unsigned > 0 [
  #v(4pt)
  #note-block(accent: rc("MEDIO"))[
    *Evaluaciones sin firma.* Algunas de las evaluaciones incluidas en este
    diagnóstico están calificadas pero aún no han sido firmadas por el
    profesional. Los resultados estadísticos son válidos, pero el informe no
    debe presentarse ante la autoridad hasta que todas las evaluaciones estén
    suscritas.
  ]
]

== Reserva y anonimato

#note-block[
  Los resultados de este informe son agregados y no permiten identificar a
  ningún trabajador. Ningún grupo se reporta por separado con menos de
  #D.minGroupSize trabajadores; los grupos que no alcanzan ese umbral se suman
  en una sola fila. La información está sujeta a reserva profesional conforme a la Ley
  1090 de 2006 y debe conservarse por veinte años según la Resolución 2346 de
  2007.
]

= Resultados generales

Distribución de los resultados globales de cada instrumento entre los cinco
niveles de riesgo. Los porcentajes se calculan sobre las evaluaciones
calificadas de cada cuestionario, que no son necesariamente las mismas para los
tres instrumentos.

#v(5pt)

#dist-panel("Intralaboral", D.distributions.intra)
#v(7pt)
#dist-panel("Extralaboral", D.distributions.extra)
#v(7pt)
#dist-panel("Estrés", D.distributions.stress)

#v(9pt)
#risk-legend()

#if D.domains.formA.len() > 0 or D.domains.formB.len() > 0 [
  = Resultados por dominio

  Puntaje transformado promedio de cada dominio, situado sobre las bandas de
  baremo que corresponden a la forma del cuestionario. El marcador señala el
  valor observado y las bandas los umbrales de clasificación.

  #if D.domains.formA.len() > 0 [
    == Forma A · cargos de jefatura, profesionales y técnicos
    #domain-list(D.domains.formA)
  ]

  #if D.domains.formB.len() > 0 [
    == Forma B · cargos auxiliares y operarios
    #domain-list(D.domains.formB)
  ]
]

= Priorización de dimensiones

Las dimensiones se ordenan por un índice de prioridad que pondera el puntaje
promedio del grupo y la proporción de trabajadores que se clasificaron en riesgo
alto o muy alto. Una dimensión con puntaje medio moderado pero con una fracción
grande de casos críticos sube en el orden, porque concentra el daño en un
subgrupo aunque el promedio lo diluya.

#v(5pt)

#etable(
  columns: (2.4fr, auto, auto, auto, auto),
  align-spec: (left, left, center, center, center),
  header: ("Dimensión", "Instrumento", "Promedio", "% crítico", "Prioridad"),
  rows: D.dimensions.map(d => (
    text(fill: ink, weight: 500, d.name),
    d.questionnaire,
    num(str(d.avg)),
    text(fill: if d.criticalPercent >= 40 { rc("MUY_ALTO") }
               else if d.criticalPercent >= 20 { rc("ALTO") }
               else { ink2 },
      weight: 600, num(str(d.criticalPercent) + "%")),
    num(str(d.priority)),
  )),
)

= Riesgo intralaboral y sintomatología de estrés

El cruce de ambos instrumentos separa a los trabajadores en cuatro grupos que
requieren respuestas distintas. Se calcula únicamente sobre quienes tienen
calificados los dos cuestionarios#if D.correlationBase > 0 [: #D.correlationBase trabajadores].

#v(6pt)

#if D.correlationBase == 0 [
  #note-block[
    Ningún trabajador tiene calificados simultáneamente el cuestionario
    intralaboral y el de estrés, de modo que este cruce no puede calcularse.
    Aplicar ambos instrumentos a la misma población es lo que permite
    distinguir la exposición al riesgo de la respuesta del organismo a esa
    exposición.
  ]
] else [
  // No partible: las celdas tienen altura fija, y al cortarse entre páginas la
  // mitad superior —el rótulo del grupo y su nombre— desaparece y quedan cifras
  // sueltas sin decir de qué grupo son.
  #block(breakable: false, grid(
    columns: (1fr, 1fr),
    column-gutter: 8pt,
    row-gutter: 8pt,
    quad-cell("Grupo A", "Sanos", D.groups.sanos,
      "Sin riesgo crítico y sin sintomatología. Mantener las condiciones actuales.",
      rc("SIN_RIESGO")),
    quad-cell("Grupo B", "Vulnerables", D.groups.vulnerables,
      "Sintomatología alta sin exposición crítica. Revisar factores extralaborales e individuales.",
      rc("MEDIO")),
    quad-cell("Grupo C", "Adaptados", D.groups.adaptados,
      "Exposición crítica sin sintomatología. Intervenir la condición antes de que aparezca el daño.",
      rc("ALTO")),
    quad-cell("Grupo D", "Prioridad de intervención", D.groups.prioritarios,
      "Exposición crítica y sintomatología simultáneas. Atención inmediata e individual.",
      rc("MUY_ALTO")),
  ))

  #v(10pt)

  == Matriz de distribución

  Número de trabajadores según el cruce exacto de ambos instrumentos. La
  intensidad del sombreado es proporcional a la concentración de casos.

  #v(4pt)
  #heat-matrix(
    D.correlation,
    row-label: "Filas: riesgo intralaboral",
    col-label: "Columnas: sintomatología de estrés",
  )
]

= Resultados por área

#if D.areas.reported.len() == 0 [
  #note-block[
    Ninguna área de la organización alcanza los #D.minGroupSize trabajadores que
    se exigen para reportarla por separado sin comprometer el anonimato de sus
    integrantes. Sus #D.areas.withheld.workers trabajadores se encuentran
    incluidos en las cifras generales de este informe.
  ]
] else [
  Áreas ordenadas por la proporción de evaluaciones en riesgo alto o muy alto.
  La segmentación permite dirigir la intervención donde la exposición se
  concentra, en lugar de aplicar una misma medida a toda la organización.

  #v(5pt)

  #etable(
    columns: (2.4fr, auto, auto, 2fr),
    align-spec: (left, center, center, left),
    header: ("Área", "Trabajadores", "% crítico", "Distribución"),
    rows: D.areas.reported.map(a => (
      text(fill: ink, weight: 500, a.name),
      num(str(a.workers)),
      text(fill: if a.criticalPercent >= 40 { rc("MUY_ALTO") }
                 else if a.criticalPercent >= 20 { rc("ALTO") }
                 else { ink2 },
        weight: 600, num(str(a.criticalPercent) + "%")),
      stacked-bar(a.dist, height: 7pt),
    )),
  )

  #if D.areas.withheld.areas > 0 [
    #v(5pt)
    #micro[
      Se omitieron #D.areas.withheld.areas áreas que no alcanzan los
      #D.minGroupSize trabajadores necesarios para reportarlas sin comprometer el
      anonimato de sus integrantes. Sus #D.areas.withheld.workers trabajadores sí
      están incluidos en las cifras generales del informe.
    ]
  ]
]

= Cruce área × dimensión

Porcentaje de trabajadores en riesgo alto o muy alto para cada una de las
dimensiones de mayor prioridad, desglosado por área. Una dimensión crítica en
el resultado general puede concentrarse en un área puntual o repetirse en
todas, y de eso depende si la intervención debe ser localizada o
organizacional.

#if D.areaDimensionMatrix.areas.len() == 0 or D.areaDimensionMatrix.dimensions.len() == 0 [
  #v(4pt)
  #note-block[
    No hay suficientes áreas por encima del umbral de anonimato, o ninguna
    dimensión con casos en riesgo crítico, para construir este cruce.
  ]
] else [
  #v(4pt)
  #let dim-codes = range(D.areaDimensionMatrix.dimensions.len()).map(i => "D" + str(i + 1))
  #crosstab-heat(
    D.areaDimensionMatrix.cells.map(row => row.map(c => c.criticalPercent)),
    row-labels: D.areaDimensionMatrix.areas,
    col-labels: dim-codes,
    row-header: "Área",
  )
  #v(5pt)
  #micro[
    #D.areaDimensionMatrix.dimensions.enumerate()
      .map(((i, d)) => dim-codes.at(i) + " — " + d.name)
      .join("   ·   ")
  ]
  #v(2pt)
  #micro[
    Cada celda es el porcentaje de trabajadores de esa área en riesgo alto o
    muy alto para esa dimensión, sobre quienes la tienen calificada.
  ]
]

= Nivel de riesgo de la empresa

El parágrafo del artículo 3 de la Resolución 2764 de 2022 fija cómo se
determina el nivel de riesgo psicosocial intralaboral de una empresa: se
promedia el puntaje bruto total de los trabajadores, se transforma ese promedio
y se compara con los baremos, por separado para cada forma del cuestionario.
De este resultado —y no de la proporción de trabajadores en riesgo— depende que
la evaluación deba repetirse cada año o cada dos.

#v(5pt)

#if D.companyRisk.byForm.len() == 0 [
  #note-block[
    No hay cuestionarios intralaborales calificados, de modo que este nivel no
    puede establecerse.
  ]
] else [
  #etable(
    columns: (auto, auto, auto, auto, 1fr),
    align-spec: (left, center, center, center, left),
    header: ("Forma", "Trabajadores", "Bruto promedio", "Transformado", "Nivel de riesgo"),
    rows: D.companyRisk.byForm.map(f => (
      text(fill: ink, weight: 500, "Forma " + f.form),
      num(str(f.workers)),
      num(str(f.rawAverage)),
      num(str(f.transformed)),
      text(weight: 600, fill: rc(f.level), upper(f.levelLabel)),
    )),
  )

  #v(6pt)
  #micro[
    Forma A: cargos de nivel técnico, profesional y directivo. Forma B: cargos
    de nivel auxiliar y operativo. Se excluyen los cuestionarios que no
    alcanzaron el mínimo de ítems respondidos.
  ]
]

= Conclusiones

#let criticas = D.dimensions.filter(d => d.criticalPercent >= 20)

#bullets((
  [Se evaluaron #D.coverage.uniqueWorkers trabajadores de la organización.
   #D.coverage.criticalWorkers trabajadores —el
   #D.coverage.criticalWorkerPercent% de los evaluados— presentaron al menos un
   instrumento en riesgo alto o muy alto.],
  ..(if D.companyRisk.annualRequired {
      ([El nivel de riesgo psicosocial intralaboral de la empresa resulta alto o
        muy alto en #D.companyRisk.byForm.filter(f => f.level == "ALTO" or f.level == "MUY_ALTO").map(f => "la forma " + f.form).join(" y "). Conforme al
        artículo 3 de la Resolución 2764 de 2022, la evaluación debe repetirse
        de forma *anual*, enmarcada en un sistema de vigilancia epidemiológica,
        y las condiciones identificadas requieren intervención inmediata en la
        fuente mediante controles administrativos, controles operacionales y
        cambios organizacionales.],)
    } else {
      ([El nivel de riesgo psicosocial intralaboral de la empresa se ubica en
        medio o bajo en las formas evaluadas. Conforme al artículo 3 de la
        Resolución 2764 de 2022, la evaluación se repite *cada dos años* y
        requiere intervención tanto en la fuente como en el trabajador.],)
    }),
  ..(if criticas.len() > 0 {
      ([Concentran la prioridad #criticas.len() dimensiones con al menos un 20%
        de trabajadores en riesgo crítico; encabeza la lista
        #criticas.first().name, con el #criticas.first().criticalPercent%.],)
    } else { () }),
  ..(if D.correlationBase > 0 and D.groups.prioritarios > 0 {
      ([#D.groups.prioritarios trabajadores presentan simultáneamente exposición
        crítica y sintomatología de estrés. Son el grupo de atención inmediata y
        requieren seguimiento individual documentado.],)
    } else { () }),
  ..(if D.correlationBase > 0 and D.groups.vulnerables > 0 {
      ([#D.groups.vulnerables trabajadores presentan sintomatología de estrés sin
        exposición intralaboral crítica, lo que sugiere revisar las condiciones
        extralaborales y los factores individuales antes de intervenir el puesto.],)
    } else { () }),
))

= Recomendaciones

#let accionables = D.dimensions.filter(d => d.action != none and d.criticalPercent >= 20)

#if accionables.len() == 0 [
  #note-block[
    Ninguna dimensión alcanza el 20% de trabajadores en riesgo alto o muy alto,
    por lo que no se identifican condiciones que exijan intervención específica.
    Se recomienda sostener las acciones de promoción y prevención vigentes y
    repetir la evaluación dentro del plazo que fija la Resolución 2764 de 2022.
  ]
] else [
  Acciones sugeridas para las dimensiones con al menos un 20% de trabajadores en
  riesgo alto o muy alto, en el orden de prioridad establecido. Cada acción debe
  incorporarse al plan de trabajo anual con responsable, recursos y fecha de
  verificación.

  #v(5pt)

  #etable(
    columns: (1.3fr, auto, 2.6fr),
    align-spec: (left, center, left),
    header: ("Dimensión", "% crítico", "Acción recomendada"),
    rows: accionables.map(d => (
      text(fill: ink, weight: 500, d.name),
      text(fill: rc(if d.criticalPercent >= 40 { "MUY_ALTO" } else { "ALTO" }),
        weight: 600, num(str(d.criticalPercent) + "%")),
      d.action,
    )),
  )
]

#v(14pt)

#block(width: 100%, inset: (x: 12pt, y: 11pt), fill: rgb("eff6ff"), stroke: 0.35pt + rgb("bfdbfe"), {
  text(font: sans, size: 7.5pt, fill: rgb("1e40af"), [
    *Nota legal:* Este informe diagnóstico organizacional es un documento técnico que forma parte
    del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) de la organización,
    según lo dispuesto en la Resolución 2764 de 2022 y la Resolución 2646 de 2008. Los datos
    presentados son exclusivamente estadísticos y no permiten la identificación individual de
    trabajadores, en estricto cumplimiento de la Ley 1090 de 2006 sobre confidencialidad.
  ])
})

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

#if D.glossary.len() > 0 [
  = Anexo · Glosario de las dimensiones evaluadas

  Definiciones tomadas del Manual General de la Batería de Instrumentos para la
  Evaluación de Factores de Riesgo Psicosocial.

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
