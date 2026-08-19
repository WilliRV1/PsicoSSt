/**
 * Contenido clínico de la Batería de Instrumentos para la Evaluación de
 * Factores de Riesgo Psicosocial (Ministerio de la Protección Social /
 * Pontificia Universidad Javeriana, 2010) y de la Resolución 2764 de 2022.
 *
 * Todo se indexa por CLAVE de dimensión o dominio, nunca por nombre visible.
 * Los nombres visibles difieren entre form-a-config, form-b-config y el mapa
 * de acciones recomendadas ("Relación con los colaboradores" frente a
 * "Relación con los colaboradores (subordinados)", "Recompensa" frente a
 * "Recompensas", …), de modo que cualquier búsqueda por nombre falla en
 * silencio para una parte de las dimensiones.
 */

export type RiskLevel = "SIN_RIESGO" | "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO";

export const RISK_ORDER: RiskLevel[] = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"];

export const RISK_LABEL: Record<RiskLevel, string> = {
    SIN_RIESGO: "Sin riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy alto",
};

/**
 * En el cuestionario de estrés la puntuación no mide exposición a un factor de
 * riesgo sino intensidad sintomática, así que la misma escala se nombra
 * distinto para no inducir a leerla como "riesgo".
 */
export const STRESS_LABEL: Record<RiskLevel, string> = {
    SIN_RIESGO: "Muy bajo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy alto",
};

/**
 * Interpretación normativa de cada nivel. El texto de `meaning` sigue el
 * criterio del Manual General de la Batería; `action` traduce ese criterio a la
 * obligación concreta que impone la Resolución 2764 de 2022.
 */
export const RISK_INTERPRETATION: Record<RiskLevel, { meaning: string; action: string }> = {
    SIN_RIESGO: {
        meaning:
            "Ausencia de riesgo, o riesgo tan bajo que no amerita el desarrollo de actividades de intervención. La condición evaluada opera como factor protector para el trabajador.",
        action: "Mantener y reforzar la condición. No requiere intervención.",
    },
    BAJO: {
        meaning:
            "No se espera que la condición evaluada se relacione con síntomas o respuestas de estrés significativas. El margen de exposición es reducido.",
        action: "Incluir en las acciones de promoción de la salud y prevención primaria.",
    },
    MEDIO: {
        meaning:
            "Nivel de riesgo en el que se esperaría una respuesta de estrés moderada. Aunque no exige intervención inmediata, es un nivel que puede escalar si no se vigila.",
        action:
            "Observación sistemática y acciones de intervención preventiva, para evitar que la condición progrese a niveles superiores.",
    },
    ALTO: {
        meaning:
            "Nivel de riesgo con importante posibilidad de asociación con respuestas de estrés alto y con efectos perjudiciales para la salud del trabajador.",
        action:
            "Intervención en el marco de un sistema de vigilancia epidemiológica, con plan de acción, responsable y fecha de verificación.",
    },
    MUY_ALTO: {
        meaning:
            "Nivel de riesgo con amplia posibilidad de asociarse a respuestas muy altas de estrés y, por tanto, a afectación de la salud del trabajador.",
        action:
            "Intervención inmediata en el marco de un sistema de vigilancia epidemiológica. Requiere seguimiento individual documentado.",
    },
};

/** Definición de cada dominio intralaboral, según el Manual General. */
export const DOMAIN_DEFINITION: Record<string, string> = {
    liderazgo_relaciones:
        "Agrupa las condiciones relativas a la gestión de los jefes inmediatos, la calidad de las interacciones con compañeros y colaboradores, y la información que el trabajador recibe sobre su propio desempeño.",
    control_trabajo:
        "Agrupa el margen de decisión del trabajador sobre su tarea, la claridad con que se le ha comunicado su rol, y las oportunidades de formación, participación y desarrollo que la organización le ofrece.",
    demandas_trabajo:
        "Agrupa las exigencias que el trabajo impone al trabajador: cuantitativas, cognitivas, emocionales, ambientales, de responsabilidad, de jornada y de invasión del tiempo extralaboral.",
    recompensa:
        "Agrupa el conjunto de retribuciones que el trabajador recibe a cambio de su esfuerzo, tanto económicas y de reconocimiento como simbólicas —orgullo de pertenencia y estabilidad percibida—.",
};

/** Definición de cada dimensión, según el Manual General. */
export const DIMENSION_DEFINITION: Record<string, string> = {
    // ── Intralaboral: liderazgo y relaciones sociales ──
    liderazgo_caracteristicas:
        "Atributos de la gestión de los jefes inmediatos en la planificación y asignación del trabajo, la consecución de resultados, la resolución de conflictos, la motivación, el apoyo y la comunicación con sus colaboradores.",
    relaciones_sociales:
        "Cantidad y calidad de las interacciones que se establecen con otras personas en el trabajo, el trabajo en equipo y la cohesión del grupo.",
    retroalimentacion_desempeno:
        "Información que el trabajador recibe sobre la forma como realiza su trabajo, y que le permite identificar sus fortalezas y los aspectos que debe mejorar.",
    relacion_colaboradores:
        "Atributos de la gestión de los subordinados en la ejecución del trabajo, la consecución de resultados, la resolución de conflictos y la participación. Sólo se evalúa en trabajadores con personal a cargo.",

    // ── Intralaboral: control sobre el trabajo ──
    claridad_rol:
        "Definición y comunicación del papel que se espera que el trabajador desempeñe: objetivos, funciones, resultados esperados, margen de autonomía e impacto del cargo en la organización.",
    capacitacion:
        "Actividades de inducción, entrenamiento y formación que la organización brinda para desarrollar y fortalecer los conocimientos y habilidades del trabajador.",
    participacion_cambio:
        "Mecanismos organizacionales orientados a incrementar la capacidad de adaptarse a los cambios en el trabajo, incluida la información previa y la posibilidad de opinar sobre ellos.",
    oportunidades_desarrollo:
        "Posibilidad que el trabajo le ofrece al trabajador de aplicar, aprender y desarrollar sus habilidades y conocimientos.",
    control_autonomia:
        "Margen de decisión del trabajador sobre el orden de sus actividades, la cantidad, el ritmo, la forma de trabajar y las pausas durante la jornada.",

    // ── Intralaboral: demandas del trabajo ──
    demandas_ambientales:
        "Condiciones del lugar de trabajo y carga física que exigen del trabajador un esfuerzo de adaptación: ruido, iluminación, temperatura, higiene, orden, ventilación, vibración y esfuerzo físico.",
    demandas_emocionales:
        "Situaciones afectivas propias del contenido de la tarea con potencial de interferir con los sentimientos del trabajador, incluidas la exposición al sufrimiento de terceros y la obligación de ocultar las emociones propias.",
    demandas_cuantitativas:
        "Exigencias relativas a la cantidad de trabajo que debe ejecutarse en relación con el tiempo disponible para hacerlo.",
    influencia_trabajo_extralaboral:
        "Exigencias de tiempo y esfuerzo que el trabajo impone y que terminan afectando la vida personal y familiar del trabajador.",
    exigencias_responsabilidad:
        "Obligaciones implícitas en el cargo cuyos resultados no pueden ser transferidos a otra persona: manejo de bienes, información confidencial, o la salud y seguridad de otros.",
    demandas_carga_mental:
        "Demandas de procesamiento cognitivo que impone la tarea: atención sostenida, memoria y análisis de información para generar una respuesta.",
    consistencia_rol:
        "Compatibilidad entre las distintas exigencias del cargo y los principios de eficiencia, calidad técnica y ética propios del servicio o producto.",
    demandas_jornada:
        "Exigencias del tiempo laboral en cuanto a duración, horario, turnos y periodos destinados a pausas y descansos.",

    // ── Intralaboral: recompensa ──
    reconocimiento_compensacion:
        "Conjunto de retribuciones que la organización otorga al trabajador en contraprestación al esfuerzo realizado: retribución económica, valoración y reconocimiento del trabajo.",
    recompensas_pertenencia:
        "Sentimiento de orgullo y percepción de estabilidad laboral, así como la percepción del trabajo como elemento que dignifica a quien lo realiza.",

    // ── Extralaboral ──
    tiempo_fuera_trabajo:
        "Cantidad y calidad del tiempo del que dispone el trabajador para el descanso, la recreación y la atención de sus asuntos personales.",
    relaciones_familiares:
        "Propiedades que caracterizan las interacciones del trabajador con su núcleo familiar, incluidos el apoyo percibido y la calidad del vínculo.",
    comunicacion_relaciones:
        "Cualidades que caracterizan la comunicación e interacción del trabajador con sus allegados y amigos fuera del ámbito laboral.",
    situacion_economica:
        "Disponibilidad de medios económicos del grupo familiar para atender los gastos básicos y hacer frente a imprevistos.",
    caracteristicas_vivienda:
        "Condiciones de infraestructura, ubicación, servicios y entorno de la vivienda donde habita el trabajador.",
    influencia_entorno_extralaboral:
        "Influjo de las exigencias de los roles familiares y personales sobre el bienestar y la actividad laboral del trabajador.",
    desplazamiento_vivienda:
        "Condiciones en que se realiza el traslado entre la vivienda y el lugar de trabajo: comodidad, duración y medio de transporte utilizado.",

    // ── Estrés ──
    sintomas_fisiologicos:
        "Manifestaciones corporales asociadas a la respuesta de estrés: alteraciones cardiovasculares y gastrointestinales, dolores de cabeza y trastornos del sueño.",
    sintomas_sociales:
        "Cambios en la conducta de relación: aislamiento, dificultades en el trato con otros y aumento del consumo de sustancias.",
    sintomas_intelectuales:
        "Alteraciones del rendimiento cognitivo y laboral: dificultades de concentración y memoria, desmotivación y aumento de la accidentalidad.",
    sintomas_psicoemocionales:
        "Manifestaciones afectivas de la respuesta de estrés: ansiedad, irritabilidad, tristeza y sensación de sobrecarga.",
};

/**
 * Acción recomendada por dimensión, para las que resultan en riesgo alto o muy
 * alto. Reindexado por clave desde `lib/scoring/recommendations.ts`.
 */
export const DIMENSION_ACTION: Record<string, string> = {
    liderazgo_caracteristicas:
        "Fortalecer las habilidades de dirección del jefe inmediato, con énfasis en comunicación asertiva y retroalimentación constructiva.",
    relaciones_sociales:
        "Crear espacios formales e informales de integración y activar los protocolos del Comité de Convivencia Laboral.",
    retroalimentacion_desempeno:
        "Institucionalizar evaluaciones de desempeño periódicas orientadas al desarrollo y no únicamente a la crítica.",
    relacion_colaboradores:
        "Capacitar al trabajador en liderazgo participativo y gestión de equipos, dado que tiene personal a cargo.",
    claridad_rol:
        "Actualizar el perfil del cargo, comunicar expectativas concretas y eliminar las instrucciones contradictorias.",
    capacitacion:
        "Incluir al trabajador en el plan anual de capacitación, a partir de las necesidades reales de su rol.",
    participacion_cambio:
        "Involucrar al trabajador en las decisiones que afectan su trabajo y comunicar los cambios organizacionales con antelación.",
    oportunidades_desarrollo:
        "Asignar tareas que reten sus capacidades y considerar rotación de puestos para enriquecer la experiencia.",
    control_autonomia:
        "Reducir la supervisión excesiva, permitiendo que el trabajador defina el ritmo y el orden de sus tareas dentro de límites acordados.",
    demandas_ambientales:
        "Realizar mediciones de higiene industrial (ruido, iluminación, ergonomía) en el puesto e implementar pausas activas.",
    demandas_emocionales:
        "Proveer apoyo psicológico y entrenamiento en regulación emocional, y rotar las tareas de mayor desgaste emocional.",
    demandas_cuantitativas:
        "Analizar la carga de trabajo del puesto y redistribuir funciones o reforzar el equipo en los picos operativos.",
    influencia_trabajo_extralaboral:
        "Aplicar de forma efectiva la política de desconexión laboral y respetar los horarios de descanso.",
    exigencias_responsabilidad:
        "Dotar al trabajador de los recursos —tiempo, presupuesto, equipo— que corresponden a la responsabilidad delegada.",
    demandas_carga_mental:
        "Establecer pausas cognitivas regulares y optimizar las herramientas de trabajo para reducir la fricción operativa.",
    consistencia_rol:
        "Estandarizar los procesos del cargo y verificar que las instrucciones recibidas no sean contradictorias entre sí.",
    demandas_jornada:
        "Revisar el esquema de turnos, limitar estrictamente las horas extra y garantizar los descansos compensatorios.",
    reconocimiento_compensacion:
        "Revisar la equidad de la compensación del cargo y establecer mecanismos de reconocimiento del logro.",
    recompensas_pertenencia:
        "Reforzar los planes de bienestar y el sentido de propósito y pertenencia del trabajador.",

    tiempo_fuera_trabajo:
        "Orientar sobre el uso del tiempo libre y facilitar el acceso a convenios recreativos o deportivos de la caja de compensación.",
    relaciones_familiares:
        "Vincular al trabajador y su familia a las actividades de bienestar, y ofrecer orientación familiar si la acepta.",
    comunicacion_relaciones:
        "Ofrecer formación en comunicación asertiva y resolución de conflictos aplicable a su entorno personal.",
    situacion_economica:
        "Brindar educación financiera y facilitar el acceso a fondo de empleados o convenios de libranza.",
    caracteristicas_vivienda:
        "Informar sobre subsidios de vivienda y programas de mejoramiento de la caja de compensación familiar.",
    influencia_entorno_extralaboral:
        "Hacer seguimiento del caso y considerar flexibilidad temporal mientras persista la situación extralaboral.",
    desplazamiento_vivienda:
        "Evaluar trabajo híbrido, horarios escalonados o acceso a rutas de transporte para reducir el tiempo de traslado.",

    sintomas_fisiologicos:
        "Remitir a valoración médica ocupacional y vincular a los programas de salud preventiva de la organización.",
    sintomas_sociales:
        "Ofrecer primeros auxilios psicológicos y remitir a la EPS cuando el cuadro lo amerite.",
    sintomas_intelectuales:
        "Revisar la carga cognitiva del puesto y vigilar los indicadores de accidentalidad y de rendimiento del trabajador.",
    sintomas_psicoemocionales:
        "Activar la ruta de atención en salud mental y remitir a la EPS para valoración por psicología o psiquiatría.",
};

/** Acción recomendada a nivel de dominio, para el plan de intervención. */
export const DOMAIN_ACTION: Record<string, string> = {
    liderazgo_relaciones:
        "Programa de desarrollo de líderes y de convivencia laboral, con énfasis en habilidades de dirección y resolución de conflictos.",
    control_trabajo:
        "Rediseño participativo del puesto: ampliar el margen de decisión, precisar el rol y ampliar la oferta de formación.",
    demandas_trabajo:
        "Revisión de la carga de trabajo del área: distribución de tareas, suficiencia de personal y ajuste de la jornada.",
    recompensa:
        "Revisión del esquema de compensación y reconocimiento, y refuerzo de los programas de bienestar y desarrollo de carrera.",
};
