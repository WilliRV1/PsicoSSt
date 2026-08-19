// ════════════════════════════════════════════════════════════
//  Programa de Vigilancia Epidemiológica — Riesgo Psicosocial
//  Diseño en lib/theme.typ: editorial neutro, color sólo para riesgo.
// ════════════════════════════════════════════════════════════

#import "lib/theme.typ": *

#let D = json(bytes(sys.inputs.data))

#show: report.with(
  brand: if D.org.tradeName != none { D.org.tradeName } else { "Programa de Vigilancia Epidemiológica" },
  org-name: D.org.name,
  chapters: true,
)

// ════════════════════════════════════════════════════════════
//  PORTADA
// ════════════════════════════════════════════════════════════
#page(header: none, footer: none, margin: (top: 30mm, bottom: 24mm, left: 24mm, right: 24mm), {

  if D.org.logoPath != none {
    block(image(D.org.logoPath, height: 16mm))
    v(14mm)
  } else {
    v(4mm)
  }

  label-text("Sistema de Gestión de Seguridad y Salud en el Trabajo", size: 6.8pt)
  v(10mm)

  text(font: serif, size: 40pt, weight: 300, fill: ink)[
    Programa de\
    Vigilancia\
    Epidemiológica
  ]

  v(7mm)
  line(length: 54pt, stroke: 1.1pt + ink)
  v(7mm)

  text(font: serif, size: 15pt, weight: 400, fill: ink2, "Factores de Riesgo Psicosocial")
  v(3mm)
  text(font: sans, size: 8.5pt, fill: ink3, "Resolución 2764 de 2022 · Ministerio del Trabajo de Colombia")

  v(1fr)

  line(length: 100%, stroke: 0.4pt + rule2)
  v(5mm)

  grid(
    columns: (1fr, 1fr),
    row-gutter: 7mm,
    column-gutter: 8mm,
    ..(
      ("Empresa", D.org.name),
      ("NIT", D.org.nit),
      ("Trabajadores evaluados", str(D.summary.uniqueWorkers)),
      ("Período de evaluación", D.org.dateStart + " — " + D.org.dateEnd),
      ("Responsable técnico", D.org.psychologistName),
      ("Licencia SST", D.org.psychologistLicense),
    ).map(((lbl, val)) => block({
      label-text(lbl, size: 6pt)
      v(1.5mm)
      text(font: serif, size: 11pt, weight: 500, fill: ink, val)
    }))
  )

  v(6mm)
  line(length: 100%, stroke: 0.4pt + rule2)
  v(4mm)

  text(font: sans, size: 6.8pt, fill: ink3)[
    Documento técnico confidencial. Los resultados son de carácter estadístico y están
    sometidos a reserva conforme a la Ley 1090 de 2006 y la Resolución 2646 de 2008.
    #if D.org.contactLine != none [ \ #D.org.contactLine ]
  ]
})

// ════════════════════════════════════════════════════════════
//  ÍNDICE
// ════════════════════════════════════════════════════════════
#page({
  text(font: serif, size: 21pt, weight: 600, fill: ink, "Contenido")
  v(4mm)
  line(length: 46pt, stroke: 1pt + ink)
  v(9mm)

  // Sin puntos guía: el número alineado a la derecha basta y respira mejor.
  show outline.entry.where(level: 1): it => {
    v(8pt, weak: true)
    set text(font: serif, size: 10.5pt, weight: 600, fill: ink)
    link(it.element.location(),
      it.indented(it.prefix(), it.body() + h(1fr) + text(fill: ink3, it.page())))
  }
  show outline.entry.where(level: 2): it => {
    set text(font: sans, size: 8.2pt, weight: 400, fill: ink2)
    link(it.element.location(),
      it.indented(it.prefix(), it.body() + h(1fr) + text(fill: ink3, it.page())))
  }

  outline(title: none, depth: 2, indent: 13pt)
})

// ════════════════════════════════════════════════════════════
= Introducción

Bajo el cumplimiento de la normatividad vigente en cuanto a la documentación, aplicación
y análisis de la batería de riesgo psicosocial, la empresa *#D.org.name* asume el compromiso
de responder a sus colaboradores en prevención y promoción de su salud mental y bienestar físico.

Desde el área de Gestión Humana y el Sistema Integrado de Gestión se lideran los procesos del
Sistema de Gestión de Seguridad y Salud en el Trabajo según los riesgos prioritarios a los cuales
se encuentran expuestos los trabajadores. En el ámbito psicosocial es fundamental el desarrollo de
un Programa de Vigilancia Epidemiológica para el control de los factores de riesgo psicosocial y
la prevención de las patologías causadas por el estrés ocupacional.

Los factores psicosociales comprenden los aspectos intralaborales, extralaborales o externos a la
organización y las condiciones individuales o características intrínsecas del trabajador, los cuales,
en una interrelación dinámica mediante percepciones y experiencias, influyen en la salud y el desempeño
de las personas. Los factores de riesgo psicosocial son aquellas condiciones psicosociales cuya
identificación y evaluación muestra efectos negativos en la salud de los trabajadores o en el trabajo.

= Justificación

En la actualidad las exigencias del medio laboral relacionadas con la naturaleza cambiante del trabajo,
la dinámica de los mercados, la globalización, el desarrollo tecnológico, los estándares de alto desempeño
y las jornadas prolongadas han ocasionado que la relación hombre–trabajo se presente cada vez más compleja
y con consecuencias negativas, tanto para la salud del trabajador como para la productividad de las
organizaciones.

Los resultados de la Segunda Encuesta Nacional de Condiciones de Salud y Trabajo (MinTrabajo, 2013)
reportaron los factores de riesgo psicosocial como los más frecuentemente percibidos por los trabajadores
junto con los biomecánicos. Estas razones hacen necesaria la identificación y el análisis de los factores
de riesgo psicosocial, sus niveles de expresión y la implementación de controles tanto en los procesos
como en las personas.

#if D.summary.needsSVE {
  v(4pt)
  note-block(accent: rc("MUY_ALTO"))[
    *Obligatoriedad.* Los resultados del diagnóstico muestran que el
    #num(str(D.summary.criticalPercent) + "%") de las evaluaciones se ubica en nivel de riesgo
    Alto o Muy Alto. Conforme a la Resolución 2764 de 2022, al superarse el umbral del 20% de la
    población evaluada, la organización tiene la obligación de implementar y mantener activo el
    presente Programa de Vigilancia Epidemiológica.
  ]
  v(4pt)
}

Un Sistema de Vigilancia Epidemiológica se define como el conjunto de estrategias, técnicas y acciones
orientadas a la evaluación, intervención y control sistemático de las variables que intervienen en las
condiciones de trabajo y de salud relacionadas con los factores de riesgo psicosocial a los que están
expuestos los trabajadores de *#D.org.name*. Este programa permite la identificación, evaluación,
prevención, intervención y monitoreo permanente de la exposición, así como la determinación del origen
de las patologías causadas por estrés ocupacional.

= Marco Legal

En Colombia, la siguiente normatividad regula la identificación, evaluación, prevención, intervención
y monitoreo de los factores de riesgo psicosocial en el ámbito laboral.

#etable(
  columns: (26%, 74%),
  header: ("Norma", "Contenido relevante"),
  rows: (
    ("Decreto 614 de 1984", "Organización y administración de la salud ocupacional. Establece la necesidad de proteger a la persona contra los riesgos psicosociales que puedan afectar la salud individual o colectiva en los lugares de trabajo."),
    ("Resolución 1016 de 1989", "Define los programas empresariales de salud ocupacional y la planificación, organización, ejecución y evaluación de actividades de medicina preventiva, higiene y seguridad industrial."),
    ("Decreto Ley 1295 de 1994", "Define los servicios de prevención que debe brindar la ARL, incluyendo el fomento de estilos de vida y trabajo saludables según el perfil epidemiológico de la organización."),
    ("Ley 1010 de 2006", "Adopta medidas para prevenir, corregir y sancionar el acoso laboral, en protección de la salud mental de los trabajadores y la armonía del ambiente laboral."),
    ("Resolución 2646 de 2008", "Establece disposiciones y responsabilidades para la identificación, evaluación, prevención, intervención y monitoreo permanente de la exposición a factores de riesgo psicosocial y la determinación del origen de las patologías causadas por estrés ocupacional."),
    ("Resoluciones 652 y 1356 de 2012", "Establecen la conformación y funcionamiento del Comité de Convivencia Laboral en entidades públicas y empresas privadas."),
    ("Ley 1562 de 2012", "Modifica el Sistema General de Riesgos Laborales y define el Sistema de Gestión de Seguridad y Salud en el Trabajo."),
    ("Decreto 1477 de 2014", "Expide la tabla de enfermedades laborales. En el Grupo IV incluye los trastornos mentales y del comportamiento derivados de agentes psicosociales: depresión, ansiedad, estrés postraumático, trastornos del sueño y síndrome de burnout."),
    ("Decreto 1072 de 2015", "Decreto Único Reglamentario del Sector Trabajo. Establece las obligaciones del empleador en el SG-SST, incluyendo la gestión de los peligros psicosociales."),
    ("Resolución 2764 de 2022", "Adopta la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial y la Guía Técnica General para la promoción, prevención e intervención. Define la periodicidad de aplicación y la obligatoriedad del programa de vigilancia."),
  ).map(((a, b)) => (text(weight: 600, fill: ink, a), b)),
)

= Objetivos

== Objetivo general

Controlar las condiciones de trabajo y salud mediante la identificación, evaluación, prevención,
intervención y monitoreo de los factores de riesgo psicosocial, con el fin de prevenir la aparición
de los efectos asociados al estrés ocupacional en los trabajadores de *#D.org.name*.

== Objetivos específicos

#bullets((
  [Brindar y estandarizar criterios para la identificación y evaluación de los factores psicosociales laborales, tanto protectores como de riesgo, así como sus potenciales efectos en la salud.],
  [Establecer los lineamientos para identificar los grupos prioritarios de este programa de vigilancia y para intervenirlos, con el fin de disminuir el riesgo de condiciones de salud asociadas a manifestaciones del estrés.],
  [Definir las actividades de prevención recomendadas para fomentar estilos de afrontamiento adecuados ante situaciones estresantes y comportamientos autónomos de autocuidado de la salud.],
  [Establecer mecanismos de recolección y análisis de información que permitan orientar la toma de decisiones oportunas dentro del proceso de seguimiento y control de los agentes de riesgo.],
  [Implementar medidas de prevención y control a través de los diferentes subprogramas de intervención, según los resultados obtenidos en el diagnóstico, en la fuente, el medio o en los trabajadores.],
  [Definir el procedimiento de acción en caso de presentarse una enfermedad laboral calificada originada por agentes psicosociales en el trabajo.],
  [Definir indicadores para evaluar la gestión y el impacto logrado en la salud individual o colectiva de los trabajadores objeto de este programa.],
))

= Descripción del Agente de Riesgo

== Definición

El Comité Mixto OMS–OIT define los factores de riesgo psicosocial como las interacciones entre el
trabajo, su medio ambiente, la satisfacción en el trabajo y las condiciones de su organización, por
una parte; y por la otra, las capacidades del trabajador, sus necesidades, su cultura y su situación
personal fuera del trabajo, todo lo cual, a través de percepciones y experiencias, puede influir en la
salud, en el rendimiento y en la satisfacción en el trabajo.

== Clasificación de los factores psicosociales

=== Características del individuo

#bullets((
  [Información sociodemográfica: edad, sexo, estado civil, nivel educativo, estrato y personas a cargo.],
  [Características de personalidad y estilos de afrontamiento.],
  [Condiciones de salud evaluadas mediante los exámenes médicos ocupacionales.],
))

=== Condiciones intralaborales

#bullets((
  [*Condiciones de la tarea.* Demandas de carga mental, velocidad, complejidad, atención, minuciosidad, variedad y apremio de tiempo; demandas emocionales y exigencias de responsabilidad del cargo.],
  [*Gestión organizacional.* Liderazgo, cambio organizacional, evaluación de desempeño, inducción, servicios de bienestar, políticas de contratación, sistemas de remuneración y capacitación.],
  [*Grupo social de trabajo.* Clima de relaciones, cohesión, calidad de las interacciones y trabajo en equipo.],
  [*Interfase persona–tarea.* Pertinencia del conocimiento y habilidades frente a las demandas de la tarea, niveles de iniciativa y autonomía, reconocimiento e identificación con la organización.],
  [*Jornada de trabajo.* Duración de la jornada, pausas, trabajo nocturno, rotación de turnos, horas extras y descansos semanales.],
))

=== Condiciones extralaborales

#bullets((
  [Utilización del tiempo libre y desplazamiento vivienda–trabajo–vivienda.],
  [Pertenencia a redes de apoyo social: familia, grupos sociales, comunitarios o de salud.],
  [Características de la vivienda y de su entorno.],
  [Situación económica del grupo familiar y acceso a servicios de salud.],
))

== Efectos de los factores de riesgo psicosocial

Los factores protectores generan en el trabajador sentido de crecimiento personal, identificación y
compromiso con la organización. Cuando los factores psicosociales son percibidos en riesgo pueden
generar efectos diversos según su intensidad, frecuencia y potencial dañino.

#bullets((
  [*Fisiológicos.* Malestares gastrointestinales, cardiovasculares y osteomusculares.],
  [*Psicológicos.* Frustración, angustia, ansiedad y depresión; a nivel cognitivo, disminución de la capacidad de atención, memoria y concentración.],
  [*Comportamentales.* Posible aumento de conductas y consumos adictivos.],
  [*Sobre el trabajo.* Ausentismo, accidentalidad, rotación de personal, desmotivación, deterioro del rendimiento y clima laboral negativo.],
))

== Instrumento de evaluación

La evaluación se realiza con la Batería de Instrumentos para la Evaluación de Factores de Riesgo
Psicosocial, desarrollada y validada por el Ministerio de la Protección Social en conjunto con la
Pontificia Universidad Javeriana sobre una muestra de 2.360 trabajadores, y adoptada oficialmente
mediante la Resolución 2764 de 2022.

#etable(
  columns: (32%, 30%, 18%, 20%),
  align-spec: (left, left, center, center),
  header: ("Instrumento", "Población", "Ítems", "Duración"),
  rows: (
    ("Intralaboral Forma A", "Jefaturas, profesionales o técnicos", "123", "≈ 28 min"),
    ("Intralaboral Forma B", "Cargos auxiliares u operarios", "97", "≈ 33 min"),
    ("Extralaboral", "Toda la población trabajadora", "31", "≈ 15 min"),
    ("Evaluación del Estrés (3.ª versión)", "Toda la población trabajadora", "31", "≈ 7 min"),
    ("Ficha de Datos Generales", "Toda la población trabajadora", "—", "≈ 5 min"),
  ).map(((a, b, c, d)) => (text(weight: 600, fill: ink, a), b, num(c), d)),
)

=== Dominios y dimensiones intralaborales

#etable(
  columns: (30%, 70%),
  header: ("Dominio", "Dimensiones"),
  rows: (
    ("Demandas del trabajo", "Demandas cuantitativas · Carga mental · Demandas emocionales · Exigencias de responsabilidad del cargo · Demandas ambientales y de esfuerzo físico · Demandas de la jornada · Consistencia de rol · Influencia del trabajo sobre el entorno extralaboral"),
    ("Control sobre el trabajo", "Control y autonomía · Oportunidades de desarrollo y uso de habilidades · Participación y manejo del cambio · Claridad de rol · Capacitación"),
    ("Liderazgo y relaciones sociales", "Características del liderazgo · Relaciones sociales en el trabajo · Retroalimentación del desempeño · Relación con los colaboradores"),
    ("Recompensa", "Reconocimiento y compensación · Recompensas derivadas de la pertenencia a la organización y del trabajo que se realiza"),
  ).map(((a, b)) => (text(weight: 600, fill: ink, a), b)),
)

= Descripción de la Empresa

#etable(
  columns: (30%, 70%),
  header: ("Campo", "Detalle"),
  rows: (
    ("Razón social", D.org.name),
    ("NIT", D.org.nit),
    ("Trabajadores evaluados", str(D.summary.uniqueWorkers)),
    ("Evaluaciones aplicadas", str(D.summary.totalAssessments) + " — Intralaboral A: " + str(D.summary.intraA) + " · Intralaboral B: " + str(D.summary.intraB) + " · Extralaboral: " + str(D.summary.extra) + " · Estrés: " + str(D.summary.stress)),
    ("Período de evaluación", D.org.dateStart + " — " + D.org.dateEnd),
    ("Áreas evaluadas", if D.areas.len() > 0 { D.areas.map(a => a.name).join(", ") } else { "No especificado" }),
    ("Responsable técnico", D.org.psychologistName + " — Licencia SST " + D.org.psychologistLicense),
  ).map(((a, b)) => (text(weight: 600, fill: ink, a), b)),
)

== Descripción demográfica

Caracterización sociodemográfica de la población trabajadora evaluada, obtenida a partir de la
Ficha de Datos Generales de la Batería de Instrumentos.

#let demo-table(title, rows) = {
  if rows.len() == 0 { return }
  block(breakable: false, {
    heading(level: 3, title)
    etable(
      columns: (56%, 22%, 22%),
      align-spec: (left, center, center),
      header: ("Categoría", "N", "%"),
      rows: rows.map(r => (r.label, num(str(r.count)), num(str(r.pct) + "%"))),
    )
  })
}

#demo-table("Distribución por sexo", D.demographics.gender)
#demo-table("Distribución por rango de edad", D.demographics.ageRanges)
#demo-table("Distribución por nivel educativo", D.demographics.education)
#demo-table("Distribución por estado civil", D.demographics.maritalStatus)
#demo-table("Distribución por antigüedad en la empresa", D.demographics.seniority)

== Horarios, turnos y aspectos laborales

#demo-table("Tipo de contratación", D.demographics.contractType)
#demo-table("Jornada de trabajo", D.demographics.workSchedule)

Los beneficios adicionales a los de ley que la organización otorgue a sus trabajadores —brigadas de
salud, jornadas deportivas, pausas activas, celebraciones de fechas especiales, capacitaciones e
integraciones— se constituyen, desde el enfoque de la prevención de factores de riesgo psicosocial,
en aspectos protectores en pro del bienestar y la salud física y mental de los trabajadores.

= Metodología del Programa

== Universo de trabajo y alcance

El programa cubre a todos los trabajadores directos de *#D.org.name*, con diferentes alcances en el
abordaje de cada grupo. Las intervenciones se implementan prioritariamente en aquellas áreas, grupos
o tareas en que los factores de riesgo sean identificados y percibidos con riesgo Alto y Muy Alto.

Para el personal nuevo no contemplado dentro del presente cronograma se tendrá en cuenta en las
valoraciones definidas para cada año, con el requisito de inclusión de llevar más de seis meses
laborando para la empresa, tiempo prudente para contar con criterios de valoración de las condiciones
internas de trabajo.

== Enfoque del programa

El propósito de la vigilancia epidemiológica se sitúa en el contexto de la prevención, fundamentalmente
la prevención primaria, orientada por las políticas de salud y seguridad y el control en la fuente de los
factores de riesgo. Se considera ideal el enfoque que vigila la presentación del factor de riesgo para
prevenir la ocurrencia de patologías, por cuanto ayuda a prevenir y no espera la ocurrencia de casos
para registrarlos y actuar sobre ellos.

== Fases del programa

#etable(
  columns: (24%, 76%),
  header: ("Fase", "Descripción"),
  rows: (
    ("1. Información preliminar", "Identificación de las necesidades de la empresa en relación con el diseño e implementación del sistema, mediante la revisión inicial de la matriz de requisitos legales a nivel psicosocial propuesta por la ARL."),
    ("2. Identificación y evaluación", "Identificación y valoración de los factores de riesgo psicosocial y de sus efectos en la salud, mediante la aplicación de la Batería de Instrumentos, el análisis psicosocial de puestos de trabajo y la medición de condiciones de salud."),
    ("3. Análisis de la información", "Identificación de áreas, ocupaciones y personas con mayor exposición y mayores efectos, para establecer hipótesis explicativas y definir prioridades. Incluye tabulación, codificación, análisis estadístico y clasificación en grupos de intervención."),
    ("4. Toma de decisiones e implementación", "Prevención y control de los factores de riesgo y de sus efectos, y promoción de la salud. Se implementan acciones generales de prevención primaria y acciones específicas según el grupo de intervención."),
    ("5. Evaluación de resultados", "Medición del impacto de las intervenciones y ajustes necesarios. Se ejecuta para cada actividad y se consolida anualmente, con difusión a la alta dirección y a los responsables."),
  ).map(((a, b)) => (text(weight: 600, fill: ink, a), b)),
)

== Análisis psicosocial del puesto de trabajo

Corresponde a la evaluación objetiva del riesgo. Su objetivo es recoger en forma sistemática y objetiva
la información relativa al cargo y a los factores de riesgo psicosocial presentes en el puesto de trabajo,
considerando la validación de la información por el personal del área. Debe realizarse por un psicólogo
especialista en seguridad y salud en el trabajo con licencia vigente en psicología ocupacional.

El análisis valora a profundidad el dominio de demandas del trabajo, compuesto por las dimensiones de
demandas cuantitativas, carga mental, demandas emocionales, exigencias de responsabilidad del cargo,
demandas ambientales y de esfuerzo físico, demandas de la jornada y consistencia del rol. La duración
promedio de cada observación, evaluando las siete dimensiones, es de 90 a 120 minutos.

=== Requisitos

#bullets((
  [Debe realizarse en momentos que muestren la dinámica habitual del puesto que va a estudiarse.],
  [Debe seguir un método estandarizado que permita tomar la misma información por diferentes evaluadores y de varias fuentes.],
  [Debe reconocer únicamente las condiciones contenidas en las guías específicas por dimensiones de la Batería de Evaluación.],
  [Las condiciones son de carácter exclusivo: deben identificarse cada una por separado, evitando explicar unas a partir de otras.],
))

=== Frecuencia de aplicación

Se realiza para cargos tipo, priorizando los puestos donde los instrumentos subjetivos hayan arrojado
puntajes Alto y Muy Alto, o los puestos de las personas ubicadas dentro del grupo de prioridad de
intervención. Igualmente, cuando se realice análisis de puesto de trabajo para calificar el origen del
estrés como enfermedad laboral, o cuando se requiera un proceso de reubicación laboral.

= Resultados del Diagnóstico

#block(breakable: false, {
  grid(
    columns: (1fr, 1fr, 1fr, 1fr),
    column-gutter: 6pt,
    ..(
      (str(D.summary.uniqueWorkers), "Evaluados"),
      (str(D.summary.totalAssessments), "Evaluaciones"),
      (str(D.groups.d), "Grupo D"),
      (str(D.summary.criticalPercent) + "%", "Zona crítica"),
    ).map(((val, lbl)) => block(
      width: 100%, inset: (x: 9pt, y: 10pt), fill: panel, stroke: (top: 1.6pt + ink, rest: none),
      {
        text(font: sans, size: 21pt, weight: 600, fill: ink, num(val))
        v(3pt)
        label-text(lbl, size: 5.8pt)
      }
    ))
  )
})

== Perfil general de riesgo

Distribución porcentual de los niveles de riesgo obtenidos en cada uno de los cuestionarios aplicados.

#block(breakable: true, {
  for (key, title, n) in (
    ("intra", "Intralaboral", D.summary.intraA + D.summary.intraB),
    ("extra", "Extralaboral", D.summary.extra),
    ("stress", "Sintomatología de estrés", D.summary.stress),
  ) {
    let dist = D.distributions.at(key)
    let cnt = D.counts.at(key)
    block(width: 100%, breakable: false, inset: (bottom: 11pt), {
      grid(columns: (1fr, auto), align: (left + bottom, right + bottom),
        text(font: serif, size: 10.5pt, weight: 600, fill: ink, title),
        text(font: sans, size: 7pt, fill: ink3, num("N = " + str(n))))
      v(4pt)
      stacked-bar(dist, height: 11pt)
      v(4pt)
      grid(
        columns: (1fr,) * 5,
        ..risk-keys.map(k => block({
          text(font: sans, size: 6.3pt, fill: ink3, risk-labels.at(k))
          linebreak()
          text(font: sans, size: 8.5pt, weight: 600, fill: rc(k),
            num(str(dist.at(k, default: 0)) + "%"))
          text(font: sans, size: 6.5pt, fill: ink3, num("  (" + str(cnt.at(k, default: 0)) + ")"))
        }))
      )
    })
  }
})

== Correlación entre condiciones de trabajo y condiciones de salud

Al cruzar el nivel de riesgo intralaboral con la sintomatología de estrés se obtienen cuatro grupos
que determinan la prioridad de intervención. La ubicación de cada trabajador en la matriz define las
conductas a seguir descritas en el capítulo de niveles de intervención.

#block(breakable: false, {
  v(3pt)
  grid(
    columns: (21mm, 1fr, 1fr),
    column-gutter: 7pt,
    row-gutter: 7pt,

    [],
    align(center, label-text("Estrés bajo o medio", size: 6pt)),
    align(center, label-text("Estrés alto o muy alto", size: 6pt)),

    align(right + horizon, label-text("Riesgo intralaboral bajo o medio", size: 5.8pt)),
    quad-cell("Grupo A", "Sanos", D.groups.a,
      "Condiciones de trabajo y de salud favorables. Seguimiento bianual y promoción.", rc("SIN_RIESGO")),
    quad-cell("Grupo B", "Vulnerables", D.groups.b,
      "Estrés elevado pese a condiciones laborales favorables. Sugiere origen extralaboral o individual.", rc("MEDIO")),

    align(right + horizon, label-text("Riesgo intralaboral alto o muy alto", size: 5.8pt)),
    quad-cell("Grupo C", "Adaptados", D.groups.c,
      "Condiciones laborales adversas sin sintomatología aún. Intervención en la fuente.", rc("ALTO")),
    quad-cell("Grupo D", "Prioridad de intervención", D.groups.d,
      "Riesgo y sintomatología simultáneos. Atención inmediata e individual.", rc("MUY_ALTO")),
  )
  v(6pt)
})

=== Matriz de distribución

Número de trabajadores según el cruce exacto de ambos instrumentos. La intensidad del sombreado es
proporcional a la concentración de casos.

#block(breakable: false, {
  let flat = D.correlation.flatten()
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
    ..D.correlation.enumerate().map(((i, row)) => (
      table.cell(align: right, fill: paper,
        label-text(risk-labels.at(risk-keys.at(i)), size: 5.6pt, tracking: 0.05em)),
      ..row.map(v => table.cell(
        fill: if v == 0 or peak == 0 { paper } else { ink.lighten(100% - (18% + 62% * v / peak)) },
        text(fill: if peak > 0 and v / peak > 0.55 { paper } else { ink },
          weight: 600, num(if v == 0 { "·" } else { str(v) }))
      ))
    )).flatten()
  )
  v(3pt)
  grid(columns: (1fr, 1fr), align: (left, right),
    label-text("Filas: riesgo intralaboral", size: 5.8pt),
    label-text("Columnas: sintomatología de estrés", size: 5.8pt))
})

#if D.domains.formA.len() > 0 or D.domains.formB.len() > 0 [
  == Resultado por dominios

  Puntaje transformado promedio de cada dominio situado sobre las bandas de baremo de la Resolución
  2764 de 2022. El marcador indica el valor observado; las bandas, los umbrales de clasificación.

  #let domain-block(title, items) = if items.len() > 0 {
    block(breakable: true, width: 100%, inset: (bottom: 8pt), {
      heading(level: 3, title)
      for d in items {
        block(width: 100%, breakable: false, inset: (bottom: 9pt), {
          grid(columns: (1fr, auto), align: (left + bottom, right + bottom),
            text(font: serif, size: 9.5pt, weight: 600, fill: ink, d.name),
            text(font: sans, size: 7pt, fill: ink3, num(str(d.avg) + " / 100")))
          v(3pt)
          band-scale(d.bounds, d.avg)
        })
      }
    })
  }

  #domain-block("Forma A — jefaturas, profesionales y técnicos", D.domains.formA)
  #domain-block("Forma B — auxiliares y operarios", D.domains.formB)

  #block(breakable: false, { risk-legend() })
]

#if D.criticalDimensions.len() > 0 [
  == Dimensiones en riesgo crítico

  Dimensiones con mayor proporción de trabajadores en nivel Alto o Muy Alto. Constituyen los focos
  prioritarios de intervención en la fuente y en el medio.

  #block(breakable: true, {
    let top = D.criticalDimensions.slice(0, calc.min(12, D.criticalDimensions.len()))
    let peak = calc.max(..top.map(d => d.criticalPercent), 1)
    for d in top {
      block(width: 100%, inset: (bottom: 6pt), {
        grid(columns: (1fr, auto), align: (left + bottom, right + bottom),
          {
            text(font: serif, size: 9.5pt, weight: 600, fill: ink, d.name)
            text(font: sans, size: 6.5pt, fill: ink3, "  " + d.questionnaire)
          },
          text(font: sans, size: 8.5pt, weight: 600,
            fill: if d.criticalPercent >= 40 { rc("MUY_ALTO") } else if d.criticalPercent >= 20 { rc("ALTO") } else { ink2 },
            num(str(d.criticalPercent) + "%")))
        v(3pt)
        grid(
          columns: (calc.max(d.criticalPercent, 1) * 1fr, calc.max(peak - d.criticalPercent, 1) * 1fr),
          rows: (5pt,),
          rect(width: 100%, height: 5pt, stroke: none,
            fill: if d.criticalPercent >= 40 { rc("MUY_ALTO") } else if d.criticalPercent >= 20 { rc("ALTO") } else { rc("MEDIO") }),
          rect(width: 100%, height: 5pt, fill: rule, stroke: none),
        )
      })
    }
  })
]

== Análisis por áreas de trabajo

#if D.areas.len() > 0 [
  #block(breakable: true, {
    for a in D.areas {
      block(width: 100%, breakable: false, inset: (bottom: 8pt), {
        grid(columns: (1fr, auto), align: (left + bottom, right + bottom),
          text(font: serif, size: 9.5pt, weight: 600, fill: ink, a.name),
          text(font: sans, size: 7pt, fill: ink3, num("N = " + str(a.count))))
        v(3pt)
        stacked-bar(a.dist, height: 8pt)
      })
    }
    v(2pt)
    risk-legend()
  })
] else [
  No se registró información de áreas o departamentos para la población evaluada.
]

#v(6pt)
#note-block[
  *Custodia de datos.* Los resultados presentados son estrictamente estadísticos y no permiten la
  identificación individual de los trabajadores, garantizando el anonimato conforme a la Ley 1090 de
  2006 y a los criterios de reserva de la historia clínica.
]

= Niveles de Intervención

== Intervención primaria

Dirigida a la totalidad de la población de la empresa —#num(str(D.summary.uniqueWorkers)) trabajadores
evaluados— a través de acciones de promoción y fomento de estilos de afrontamiento adecuados ante
situaciones intra y extralaborales que puedan desencadenar sintomatología asociada al estrés.

#bullets((
  [Elaboración y difusión de material que apoye el control del factor de riesgo.],
  [Campañas de sensibilización en fortalecimiento de ambientes de trabajo favorables y estilos de vida y trabajo saludables.],
  [Capacitaciones en control de riesgo psicosocial, estilos de afrontamiento y manejo del estrés.],
  [Prevención del consumo de sustancias psicoactivas y otras adicciones.],
  [Medidas de prevención del acoso laboral: política, código de convivencia y funcionamiento efectivo del Comité de Convivencia Laboral.],
  [Asesorías de intervención en crisis en caso de ser requerido.],
))

== Intervención secundaria y terciaria

#etable(
  columns: (16%, 30%, 54%),
  header: ("Nivel", "Dirigido a", "Actividades"),
  rows: (
    (
      "Secundaria",
      "Trabajadores de los grupos B y D, y remitidos por las EPS con diagnósticos asociados a factores de riesgo psicosocial de origen común.",
      "Diagnóstico de condiciones de trabajo · Estudios de puesto de trabajo para definir mecanismos de cumplimiento de restricciones o necesidad de reubicación · Seguimiento y control para asegurar el manejo asistencial · Seguimiento de las recomendaciones de la EPS · Retroalimentación individual · Análisis psicosocial de puestos de trabajo · Asesorías psicológicas.",
    ),
    (
      "Terciaria",
      "Casos: trabajadores con patologías derivadas del estrés diagnosticadas y reconocidas por la ARL o las Juntas de Calificación como de origen laboral.",
      "Estudios de puesto de trabajo donde se identifique la pauta a seguir, de reubicación o readaptación · Rehabilitación psicosocial · Seguimiento y control para asegurar el tratamiento por parte de la ARL · Seguimiento de las recomendaciones del estudio de puesto de trabajo.",
    ),
  ).map(((a, b, c)) => (text(weight: 600, fill: ink, a), b, c)),
)

== Conductas a seguir por grupo

#etable(
  columns: (18%, 26%, 56%),
  header: ("Grupo", "Clasificación", "Conductas a seguir"),
  rows: (
    (
      "A — Sanos (" + str(D.groups.a) + ")",
      "Riesgo intralaboral medio, bajo o sin riesgo. Estrés medio, bajo o sin riesgo.",
      "Retest bianual para condiciones de salud por autorreporte · Inclusión en los procesos generales de capacitación y promoción de la salud · Fortalecimiento de los factores protectores identificados.",
    ),
    (
      "B — Vulnerables (" + str(D.groups.b) + ")",
      "Riesgo intralaboral medio, bajo o sin riesgo. Estrés alto o muy alto.",
      "Retroalimentación individual de resultados de la escala de estrés · Asesoría psicológica grupal inicial con sugerencias para el manejo de situaciones estresantes · Indagación de fuentes específicas de estrés · Retest anual · Capacitación en manejo de estrés y técnicas de relajación.",
    ),
    (
      "C — Adaptados (" + str(D.groups.c) + ")",
      "Riesgo intralaboral alto o muy alto. Estrés medio, bajo o sin riesgo.",
      "Retroalimentación de resultados a los trabajadores que puntúen alto · Retroalimentación al grupo directivo sobre condiciones de trabajo y salud · Análisis psicosocial del puesto de trabajo de los cargos con riesgo alto o muy alto · Asesoría psicológica inicial · Retest bianual.",
    ),
    (
      "D — Prioridad (" + str(D.groups.d) + ")",
      "Riesgo intralaboral alto o muy alto. Estrés alto o muy alto.",
      "Retroalimentación individual de resultados con recomendaciones específicas para la empresa y el trabajador · Análisis psicosocial del puesto de trabajo de todos los cargos del grupo · Asesoría psicológica inicial y seguimiento, con un máximo de tres sesiones · Remisión a EPS según criterio profesional · Capacitación en manejo de estrés · Análisis de accidentalidad y ausentismo · Retest anual.",
    ),
  ).map(((a, b, c)) => (text(weight: 600, fill: ink, a), b, c)),
)

= Plan de Intervención General

Cronograma de actividades de intervención que cubren a toda la población trabajadora, con los
responsables asignados dentro de la organización.

#etable(
  columns: (6%, 34%, 26%, 34%),
  align-spec: (center, left, left, left),
  header: ("N.º", "Tema o actividad", "Responsable", "Observación"),
  rows: (
    ("Selección de personal", "Talento Humano, SST", "Revisión y ajuste del proceso de selección."),
    ("Gestión del desempeño", "Talento Humano, SST", "Revisión del plan de incentivos y canales comunicativos."),
    ("Incentivos", "Talento Humano, Bienestar", "Programa y divulgación."),
    ("Gestión por competencias", "Talento Humano, SST", "Empoderamiento, rotación de personal, cambio de roles."),
    ("Inducción y entrenamiento", "Talento Humano, SST", "Revisión y ajuste del programa."),
    ("Formación, capacitación y bienestar", "Talento Humano, Bienestar", "Programas interempresariales con vinculación de familias."),
    ("Sucesión y plan de carrera", "Talento Humano", "Programa de crecimiento de carrera y reconocimientos."),
    ("Gestión del cambio", "Talento Humano, SST", "Taller de empoderamiento en la gestión del cambio."),
    ("Gestión del conocimiento", "Talento Humano", "Plan de capacitación en el perfil ocupacional u operacional."),
    ("Comunicaciones internas", "Talento Humano, SST", "Programa y canales comunicativos."),
    ("Gestión del clima y la cultura", "Talento Humano, SST", "Aplicación, evaluación, seguimiento y campañas."),
    ("Seguridad y salud en el trabajo", "SST", "Revisión y ajustes al SG-SST."),
    ("Prevención de consumo de alcohol y SPA", "Talento Humano, SST", "Programa, política, campañas y divulgación."),
    ("Prevención del riesgo público", "SST", "Capacitaciones."),
    ("Convivencia laboral", "Comité de Convivencia, SST", "Talleres de comunicación asertiva y resolución de conflictos."),
    ("Escuela de líderes", "Talento Humano, Bienestar", "Desarrollo de competencias en estilos de liderazgo."),
    ("Calidad de vida", "Bienestar Laboral", "Taller y programa."),
    ("Promoción de la resiliencia", "Talento Humano, Bienestar", "Talleres."),
    ("Programa de salud mental", "SST, Bienestar", "Talleres y seguimiento psicológico."),
    ("Taller de inteligencia emocional", "Talento Humano, Bienestar", "Talleres."),
    ("Administración del tiempo y tiempo libre", "Talento Humano, Bienestar", "Talleres."),
    ("Manejo de la economía familiar", "Talento Humano, Bienestar", "Talleres de inteligencia financiera."),
  ).enumerate().map(((i, r)) => (
    num(str(i + 1)), text(weight: 600, fill: ink, r.at(0)), r.at(1), r.at(2)
  )),
)

= Indicadores del Programa

Los siguientes indicadores permiten evaluar la gestión y el impacto del programa. El informe generado
debe ser difundido a la alta dirección, a los implicados de cada actividad y al responsable del SG-SST.

#etable(
  columns: (25%, 12%, 22%, 29%, 12%),
  align-spec: (left, left, left, left, center),
  header: ("Objetivo", "Tipo", "Indicador", "Fórmula", "Frecuencia"),
  rows: (
    ("Identificar los factores de riesgo psicosocial y los factores protectores", "Ejecución", "% de encuestas aplicadas", "N.º encuestas aplicadas × 100 / N.º población definida", "Anual"),
    ("Evaluar y analizar los factores de riesgo psicosocial", "Ejecución", "% de encuestas evaluadas y analizadas", "N.º encuestas analizadas × 100 / N.º encuestas aplicadas", "Anual"),
    ("Clasificar la población por grupos de intervención", "Ejecución", "Resultado por grupos A, B, C y D", "N.º encuestas por grupo × 100 / N.º encuestas analizadas", "Anual"),
    ("Realizar intervenciones en grupos priorizados", "Ejecución", "Actividades de intervención para grupos prioritarios", "N.º actividades realizadas para grupos B y D × 100 / N.º programadas", "Anual"),
    ("Detectar casos nuevos", "Incidencia", "% de casos nuevos en grupos B y D", "Casos nuevos grupos B y D × 100 / N.º total de la población", "Anual"),
    ("Fomentar estilos de afrontamiento adecuados", "Ejecución", "% de actividades desarrolladas", "Actividades desarrolladas × 100 / Actividades programadas", "Anual"),
    ("Medir prevalencia de exposición al riesgo alto", "Prevalencia", "% de ambientes con riesgo alto", "Ambientes con riesgo alto × 100 / Total ambientes evaluados", "Anual"),
    ("Medir el impacto de la intervención", "Impacto", "% de ambientes con riesgo alto tras la intervención", "Ambientes con riesgo alto post-intervención × 100 / Total ambientes con riesgo alto", "Anual"),
  ).map(((a, b, c, d, e)) => (text(weight: 600, fill: ink, a), b, c, text(size: 7.2pt, d), e)),
)

= Control de Documentación

La información resultante de la aplicación del programa debe manejarse según los parámetros de los
procedimientos de control de documentos y registros de *#D.org.name*. Debe considerarse en especial:

#bullets((
  [Los registros médicos y las historias psicológicas completas —incluyendo los cuestionarios diligenciados y los informes de resultados individuales— están sometidos a los criterios de confidencialidad, reserva y custodia de las historias clínicas.],
  [Deben mantenerse en los archivos de la empresa durante *veinte años después del retiro del trabajador*, en medio magnético o físico, bajo la responsabilidad de reserva y custodia del médico o psicólogo especialista en seguridad y salud en el trabajo que el empleador disponga.],
  [Todo informe consolidado que incluya información individual está sometido a reserva y se considera confidencial. Su uso se limita a fines de prevención y control.],
  [El acceso a la plataforma y a los resultados individuales debe estar restringido al profesional responsable, garantizando la trazabilidad de las consultas mediante registros de auditoría.],
))

= Recursos Necesarios

== Recursos humanos

#bullets((
  [Responsable del SG-SST, como administrador de los esfuerzos de gestión del sistema.],
  [Psicólogo especializado en seguridad y salud en el trabajo, con licencia vigente, que dirige y orienta los procesos de diagnóstico e intervención del riesgo.],
  [Psicólogos para la ejecución de actividades específicas, bajo la asesoría técnica del psicólogo especialista.],
  [Soporte del área de Gestión Humana, dado que muchas de las actividades requieren ser apalancadas desde esta gerencia.],
))

== Recursos técnicos y científicos

#bullets((
  [Equipos de cómputo y software para el manejo de la información del sistema.],
  [Formatos de las pruebas psicológicas establecidas para el diagnóstico.],
  [Salones y ayudas audiovisuales para las actividades de entrenamiento y sensibilización.],
  [Consultorio dotado para realizar las evaluaciones médicas y psicológicas requeridas.],
))

== Recursos financieros

Dentro del presupuesto general para el desarrollo del programa de salud ocupacional se han definido
recursos específicos para el desarrollo y mantenimiento del sistema de vigilancia para el control de
factores de riesgo psicosocial, incluyendo los elementos descritos en el presente documento.

= Responsabilidades

== Gerencia, grupo directivo y jefes de área

#bullets((
  [Proveer los recursos necesarios para el adecuado funcionamiento del programa.],
  [Facilitar la obtención de información requerida para su mantenimiento.],
  [Facilitar la participación de los trabajadores en las actividades establecidas.],
  [Asignar el recurso humano especializado responsable del desarrollo y mantenimiento del programa.],
  [Identificar y remitir a Gestión Humana a los trabajadores con cambios de conducta o comportamiento para su valoración y estudio.],
))

== Responsable del SG-SST y psicólogo especialista

#bullets((
  [Participar en el diseño y aplicación de alternativas de control para factores de riesgo psicosocial.],
  [Integrar las actividades del SG-SST con el presente programa, según los principios de gestión establecidos en la empresa.],
  [Asegurar canales de comunicación en ambas vías para la difusión de los hallazgos y medidas resultantes.],
  [Asegurar la investigación y el seguimiento de los casos identificados dentro del programa.],
))

== Trabajadores

#bullets((
  [Informar oportunamente al área de SST sobre cambios de condiciones o conductas de trabajo que puedan generar efectos psicosociales dañinos.],
  [Participar en las actividades y seguir las indicaciones del programa, para lograr un adecuado control de los riesgos.],
  [Incorporar en el comportamiento diario conductas de autocuidado difundidas en los programas de capacitación.],
))

= Conclusiones

#bullets((
  [Se evaluaron *#num(str(D.summary.uniqueWorkers)) trabajadores* de la empresa *#D.org.name* mediante la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial, completando *#num(str(D.summary.totalAssessments)) evaluaciones* entre los cuestionarios intralaboral, extralaboral y de estrés, durante el período comprendido entre el #D.org.dateStart y el #D.org.dateEnd.],

  [El *#num(str(D.summary.criticalPercent) + "%")* de las evaluaciones aplicadas arrojó un nivel de riesgo Alto o Muy Alto, lo que #if D.summary.criticalPercent > 30 [constituye una proporción significativamente elevada que exige intervención prioritaria e inmediata.] else if D.summary.criticalPercent > 15 [representa una proporción moderada que amerita implementar acciones de intervención y seguimiento sistemático.] else [refleja un perfil de riesgo favorable, en el cual corresponde mantener y fortalecer las acciones de promoción y prevención.]],

  [La correlación entre condiciones de trabajo y condiciones de salud permitió clasificar la población en cuatro grupos: Grupo A, sanos, con #num(str(D.groups.a)); Grupo B, vulnerables, con #num(str(D.groups.b)); Grupo C, adaptados, con #num(str(D.groups.c)); y Grupo D, prioridad de intervención, con #num(str(D.groups.d)) trabajadores.],
))

#if D.groups.d > 0 [
  #bullets((
    [Se identificaron *#num(str(D.groups.d)) trabajadores en el Grupo D*, quienes presentan simultáneamente riesgo intralaboral y sintomatología de estrés en niveles Alto o Muy Alto. Este grupo constituye la prioridad de intervención y requiere retroalimentación individual, análisis psicosocial del puesto de trabajo, asesoría psicológica con seguimiento y, cuando el criterio profesional lo determine, remisión a la EPS.],
  ))
]

#if D.groups.b > 0 [
  #bullets((
    [Los *#num(str(D.groups.b)) trabajadores del Grupo B* presentan sintomatología de estrés elevada pese a percibir condiciones intralaborales favorables, lo que sugiere la influencia de factores extralaborales o individuales. Se recomienda indagar fuentes específicas de estrés y fortalecer los estilos de afrontamiento.],
  ))
]

#if D.groups.c > 0 [
  #bullets((
    [Los *#num(str(D.groups.c)) trabajadores del Grupo C* perciben condiciones intralaborales adversas sin manifestar aún sintomatología de estrés. Este grupo requiere intervención en la fuente para evitar que la exposición sostenida derive en efectos sobre la salud.],
  ))
]

#if D.criticalDimensions.len() > 0 [
  #bullets((
    [Las dimensiones que concentran la mayor proporción de trabajadores en riesgo crítico son #D.criticalDimensions.slice(0, calc.min(5, D.criticalDimensions.len())).map(d => strong(d.name) + " (" + str(d.criticalPercent) + "%)").join(", ", last: " y "). La intervención sobre estas dimensiones debe priorizarse en la fuente y en el medio, conforme a la Guía Técnica General de la Resolución 2764 de 2022.],
  ))
]

#if D.summary.needsSVE [
  #bullets((
    [Dado que la proporción de trabajadores en riesgo crítico supera el umbral del 20% establecido normativamente, la organización tiene la obligación legal de implementar y mantener activo el presente Programa de Vigilancia Epidemiológica, con seguimiento documentado de las intervenciones y medición anual de los indicadores definidos.],
  ))
]

#bullets((
  [Se recomienda realizar la reevaluación de los factores de riesgo psicosocial en un plazo máximo de #if D.summary.criticalPercent > 20 [*un (1) año*] else [*dos (2) años*], conforme a lo establecido en la Resolución 2764 de 2022, con el fin de medir el impacto de las acciones de intervención implementadas.],
  [Los resultados del presente programa deben integrarse al Sistema de Gestión de Seguridad y Salud en el Trabajo de la organización, alimentando la matriz de identificación de peligros y valoración de riesgos, el plan anual de trabajo y el programa de capacitación.],
))

= Bibliografía

// Ajustes acotados a la lista: no deben filtrarse al bloque de firma.
#block[
#set par(justify: false, hanging-indent: 14pt)
#set text(size: 9pt, hyphenate: false)

#for r in (
  [Alcover, C., Martínez, D., Rodríguez, F. y Domínguez, R. (2004). _Introducción a la Psicología del Trabajo._ Madrid: McGraw Hill.],
  [Betancur, F. (2001). _Salud Ocupacional: un enfoque humanista._ Bogotá: McGraw-Hill Interamericana.],
  [Comité Mixto OIT-OMS. (1992). _Factores psicosociales en el trabajo. Naturaleza, incidencia y prevención._ México: Alfa Omega.],
  [Ministerio de la Protección Social y Pontificia Universidad Javeriana. (2010). _Batería de instrumentos para la evaluación de factores de riesgo psicosocial._ Bogotá.],
  [Ministerio de la Protección Social. (2004). _Protocolo para la determinación del origen de patologías derivadas del estrés._ Bogotá.],
  [Ministerio de la Protección Social. (2008). _Resolución 2646 de 2008._ Bogotá.],
  [Ministerio de Trabajo. (2014). _Decreto 1477 de 2014. Tabla de enfermedades laborales._ Bogotá.],
  [Ministerio de Trabajo. (2015). _Decreto 1072 de 2015. Decreto Único Reglamentario del Sector Trabajo._ Bogotá.],
  [Ministerio de Trabajo. (2022). _Resolución 2764 de 2022._ Bogotá.],
  [Ministerio de Trabajo y Organización Iberoamericana de Seguridad Social. (2013). _Informe ejecutivo II Encuesta Nacional de Condiciones de Seguridad y Salud en el Trabajo._ Bogotá.],
  [Toro, F. (1991). _Desempeño y productividad._ Medellín: Cincel.],
) [
  #block(inset: (bottom: 5pt), r)
]
]

// ─── Firma ──────────────────────────────────────────────────
#v(1fr)
#set par(justify: false, hanging-indent: 0pt, leading: 0.6em)
#align(center, block(width: 78mm, {
  set text(hyphenate: false)
  if D.org.signaturePath != none {
    block(height: 18mm, align(center + bottom, image(D.org.signaturePath, height: 16mm)))
  } else {
    v(18mm)
  }
  line(length: 100%, stroke: 0.7pt + ink)
  v(4pt)
  text(font: serif, size: 11pt, weight: 600, fill: ink, D.org.psychologistName)
  linebreak()
  text(font: sans, size: 7.5pt, fill: ink2, "Psicólogo(a) especialista en Seguridad y Salud en el Trabajo")
  linebreak()
  text(font: sans, size: 7.5pt, fill: ink2, "Licencia SST " + D.org.psychologistLicense)
  linebreak()
  v(2pt)
  text(font: sans, size: 7.5pt, fill: ink3, D.org.today)
}))
