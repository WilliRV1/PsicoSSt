import type { FormConfig, FormType, QuestionnaireType } from "@/types/battery";
import type { RiskLevel } from "@/lib/reports/battery-content";

/**
 * Definición declarativa de un instrumento.
 *
 * Todo lo que el motor, los formularios y los informes decidían con
 * `if (questionnaireType === …)` vive aquí como datos. Añadir un instrumento
 * es añadir una entrada, no una rama en 34 archivos.
 */

/** Familia a efectos de cupo (una unidad por trabajador y familia) y cadencia. */
export type InstrumentFamily = "BATTERY" | "CLIMA";

export interface ScaleDef {
    min: number;
    max: number;
    /** Etiquetas visibles de cada opción, de `min` a `max`. */
    labels: string[];
}

/**
 * Cómo se agrega el total del cuestionario.
 * - domains:  suma de dominios / factor (intralaboral)
 * - flat:     suma de dimensiones / factor (extralaboral, clima)
 * - weighted: promedios ponderados por grupo de ítems (estrés, M4)
 */
export type TotalStrategy = "domains" | "flat" | "weighted";

export interface InstrumentDef {
    id: QuestionnaireType;
    family: InstrumentFamily;
    /**
     * true → forma parte de la Batería normativa: entra en SVE, cumplimiento,
     * cadencia de la Res. 2764/2022 y el bloque normativo del informe.
     * false → instrumento libre (clima): sin restricción legal y fuera de todo lo anterior.
     */
    regulated: boolean;
    label: string;
    shortLabel: string;
    /** Descripción de una línea para la interfaz. */
    description: string;
    scale: ScaleDef;
    /** El intralaboral tiene formas A y B; los demás escriben "A" de relleno. */
    usesFormType: boolean;
    /** Baremos estratificados por grupo ocupacional (extralaboral, estrés). */
    usesOccupationalGroup: boolean;
    /** Preguntas de control que filtran dimensiones (sólo intralaboral). */
    hasControlQuestions: boolean;
    /** Ningún ítem puede faltar (estrés, M4). */
    requireComplete: boolean;
    /** Dimensiones que toleran UN ítem sin respuesta (M2 p. 80, M3 p. 148). */
    missingTolerance: string[];
    totalStrategy: TotalStrategy;
    /** Clave de primer nivel en baremos.json. El intralaboral resuelve por forma. */
    baremoKey: (formType: FormType) => string;
    /** Etiqueta de cada nivel ordinal para este instrumento. */
    levelLabels: Record<RiskLevel, string>;
    /** Interpretación y actuación por nivel. */
    interpretation: Record<RiskLevel, { meaning: string; action: string }>;
    /** Columna de AssessmentInvitation que guarda la evaluación de este instrumento. */
    invitationColumn:
        | "intralaboralAssessmentId"
        | "extralaboralAssessmentId"
        | "stressAssessmentId"
        | "climaAssessmentId";
    /** Configuración de ítems/dimensiones. El intralaboral resuelve por forma. */
    config: (formType: FormType) => FormConfig;
    /** Orden en que el trabajador diligencia los instrumentos de una invitación. */
    order: number;
    /**
     * Baremos de referencia interna, no publicados por una autoridad. El
     * informe lo advierte y ninguna agregación normativa los usa.
     */
    provisionalBaremos?: boolean;
}
