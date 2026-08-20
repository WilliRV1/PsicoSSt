// ════════════════════════════════════════════════════════════
//  Plan de intervención de factores de riesgo psicosocial
// ════════════════════════════════════════════════════════════

#import "lib/theme.typ": *

#let D = json(bytes(sys.inputs.data))

#show: report.with(
  brand: if D.brand.tradeName != none { D.brand.tradeName } else { "Plan de intervención" },
  org-name: D.org.name,
  chapters: false,
)

// Color por estado de la acción. Se reutiliza la escala de riesgo en lugar de
// introducir una segunda paleta: el documento entero se apoya en que un color
// significa siempre lo mismo, y aquí la lectura es la misma —verde resuelto,
// rojo urgente—.
// Las llaves no son decorativas: en modo markup un `#let x = if …` termina en
// el salto de línea, y los `else` de las líneas siguientes se leerían como
// texto, dejando la función devolviendo `none` para todo lo que no sea DONE.
#let status-color(s) = {
  if s == "DONE" { rc("SIN_RIESGO") }
  else if s == "IN_PROGRESS" { rc("MEDIO") }
  else if s == "CANCELLED" { ink3 }
  else { rc("ALTO") }
}

#let status-chip(s, label) = box(
  inset: (x: 6pt, y: 3pt),
  fill: status-color(s).lighten(84%),
  stroke: (left: 2pt + status-color(s), rest: none),
  text(font: sans, size: 6.3pt, weight: 600, fill: status-color(s), tracking: 0.05em, upper(label)),
)

#let action-block(a) = block(width: 100%, breakable: false, inset: (bottom: 9pt), {
  set par(justify: false)
  grid(
    columns: (1fr, auto),
    align: (left + top, right + top),
    column-gutter: 10pt,
    text(font: serif, size: 9.8pt, weight: 500, fill: ink, a.measure),
    status-chip(a.status, a.statusLabel),
  )
  v(4pt)
  // Metadatos en una sola línea: responsable, plazo y área. Como tabla ocuparían
  // el triple de alto para tres datos cortos.
  {
    set text(font: sans, size: 7pt, fill: ink3)
    [Responsable: #text(fill: ink2, a.responsible)]
    if a.dueDate != none {
      [ · Plazo: #text(fill: if a.overdueDays > 0 { rc("MUY_ALTO") } else { ink2 }, a.dueDate)]
      if a.overdueDays > 0 {
        text(fill: rc("MUY_ALTO"), weight: 600,
          " · vencida hace " + str(a.overdueDays)
            + (if a.overdueDays == 1 { " día" } else { " días" }))
      }
    } else {
      [ · #text(fill: rc("MEDIO"), "Sin fecha de vencimiento")]
    }
    if a.area != none [ · Área: #text(fill: ink2, a.area)]
  }
  if a.notes != none {
    v(4pt)
    micro(a.notes, size: 7pt, fill: ink3)
  }
  v(5pt)
  line(length: 100%, stroke: 0.3pt + rule)
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

  label-text("Factores de riesgo psicosocial · Resolución 2764 de 2022")
  v(6mm)

  text(font: serif, size: 30pt, weight: 600, fill: ink)[Plan de intervención]
  v(3mm)
  block(width: 82%, text(font: serif, size: 13pt, weight: 400, fill: ink2, D.plan.title))

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
      ("Periodo del plan", D.plan.period),
      ("Estado", D.plan.status),
      ("Acciones registradas", str(D.summary.total)),
      ("Formulado el", D.plan.createdAt),
      ("Avance", str(D.summary.completionPercent) + "%"),
      ("Corte del informe", D.org.today),
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

= Estado del plan

Este plan recoge las acciones acordadas a partir del diagnóstico de factores de
riesgo psicosocial. La Resolución 2764 de 2022 exige que cada medida quede
documentada con su responsable y su fecha de verificación, de modo que lo que
se presenta a continuación es el estado de avance a la fecha de corte, no un
listado de intenciones.

#v(6pt)

#block(width: 100%, inset: 13pt, fill: panel, stroke: (left: 3pt + rc("SIN_RIESGO"), rest: 0.35pt + rule), {
  set par(justify: false, leading: 0.55em)
  grid(
    columns: (1fr, auto),
    align: (left + horizon, right + horizon),
    {
      label-text("Avance del plan")
      v(3pt)
      micro("Acciones cumplidas sobre el total, excluidas las canceladas.")
    },
    {
      set align(right)
      text(font: sans, size: 30pt, weight: 600, fill: ink, num(str(D.summary.completionPercent)))
      text(font: sans, size: 12pt, weight: 500, fill: ink3, "%")
    },
  )
  v(9pt)
  box(width: 100%, height: 9pt, {
    place(top + left, rect(width: 100%, height: 9pt, fill: rule, stroke: none))
    place(top + left, rect(width: D.summary.completionPercent * 1%, height: 9pt,
      fill: rc("SIN_RIESGO"), stroke: none))
  })
})

#v(8pt)

#grid(
  columns: (1fr,) * D.summary.byStatus.len(),
  column-gutter: 8pt,
  ..D.summary.byStatus.map(s => block(
    width: 100%, height: 20mm, inset: 9pt, fill: panel,
    stroke: (top: 1.8pt + status-color(s.status), rest: none),
    {
      set par(justify: false, leading: 0.5em)
      text(font: sans, size: 18pt, weight: 600, fill: status-color(s.status), num(str(s.count)))
      v(3pt)
      label-text(s.label, size: 5.6pt)
    },
  ))
)

#if D.summary.overdue > 0 or D.summary.unscheduled > 0 [
  #v(9pt)
  #note-block(accent: rc("MUY_ALTO"))[
    *Requiere atención.*
    #if D.summary.overdue > 0 [
      #D.summary.overdue #if D.summary.overdue == 1 { "acción sigue abierta y ya superó" } else { "acciones siguen abiertas y ya superaron" }
      su fecha de vencimiento.
    ]
    #if D.summary.unscheduled > 0 [
      #D.summary.unscheduled #if D.summary.unscheduled == 1 { "acción no tiene" } else { "acciones no tienen" }
      fecha de verificación asignada, requisito que la Resolución 2764 de 2022
      exige para cada medida del plan.
    ]
  ]
]

= Acciones

#if D.groups.len() == 0 [
  #note-block[
    El plan no tiene acciones registradas. Un plan sin medidas concretas, con
    responsable y fecha, no satisface la obligación de intervención que se
    deriva del diagnóstico.
  ]
] else [
  Las acciones se agrupan por el nivel de riesgo que las originó y, dentro de
  cada grupo, por fecha de vencimiento.

  #for g in D.groups [
    == #g.label

    #for a in g.actions [#action-block(a)]
  ]
]

#if D.areas.len() > 0 [
  = Avance por área

  Distribución de las acciones vigentes y su grado de cumplimiento. Las acciones
  canceladas no se incluyen.

  #v(5pt)

  #etable(
    columns: (2fr, auto, auto, auto, 1.6fr),
    align-spec: (left, center, center, center, left),
    header: ("Área", "Acciones", "Cumplidas", "Avance", ""),
    rows: D.areas.map(a => {
      let pct = if a.total > 0 { calc.round(a.done / a.total * 100) } else { 0 }
      (
        text(fill: ink, weight: 500, a.name),
        num(str(a.total)),
        num(str(a.done)),
        text(weight: 600,
          fill: if pct >= 80 { rc("SIN_RIESGO") } else if pct >= 40 { rc("MEDIO") } else { rc("ALTO") },
          num(str(pct) + "%")),
        box(width: 100%, height: 6pt, {
          place(left + horizon, rect(width: 100%, height: 5pt, fill: rule, stroke: none))
          place(left + horizon, rect(width: pct * 1%, height: 5pt,
            fill: if pct >= 80 { rc("SIN_RIESGO") } else if pct >= 40 { rc("MEDIO") } else { rc("ALTO") },
            stroke: none))
        }),
      )
    }),
  )
]

= Seguimiento

#bullets((
  [*Verificación.* Cada acción debe verificarse en la fecha comprometida y
   dejar evidencia documental del cumplimiento. La verificación es
   responsabilidad del área designada y su registro forma parte del sistema de
   gestión de seguridad y salud en el trabajo.],
  [*Reprogramación.* Una acción que no pueda cumplirse en el plazo previsto
   debe reprogramarse de forma expresa, con la nueva fecha y el motivo. Dejarla
   vencida sin decisión no la suspende: la mantiene incumplida.],
  [*Efectividad.* El cierre de las acciones no equivale a la reducción del
   riesgo. La efectividad se comprueba en la siguiente aplicación de la
   Batería, comparando los niveles de las dimensiones intervenidas.],
  [*Reserva.* Este documento se deriva de información sujeta a reserva
   profesional conforme a la Ley 1090 de 2006 y debe conservarse junto con el
   diagnóstico que lo originó.],
))

#v(18pt)

#block(breakable: false, width: 100%, {
  set par(justify: false, leading: 0.6em)
  label-text("Firma del profesional responsable")
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
