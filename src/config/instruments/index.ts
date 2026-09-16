import type { FormConfig, QuestionnaireType } from "@/types/battery";
import { formAConfig, formBConfig, extralaboralConfig, stressConfig } from "@/config/battery";
import climaConfig from "@/config/battery/clima-config.json";
import { RISK_INTERPRETATION, RISK_LABEL, STRESS_LABEL } from "@/lib/reports/battery-content";
import type { InstrumentDef, InstrumentFamily } from "./types";

export type { InstrumentDef, InstrumentFamily, ScaleDef, TotalStrategy } from "./types";

const BATTERY_SCALE = {
    min: 0,
    max: 4,
    labels: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
};

const STRESS_SCALE = {
    min: 0,
    max: 3,
    labels: ["Siempre", "Casi siempre", "A veces", "Nunca"],
};

const CLIMA_SCALE = {
    min: 1,
    max: 5,
    labels: [
        "Totalmente en desacuerdo",
        "En desacuerdo",
        "Ni de acuerdo ni en desacuerdo",
        "De acuerdo",
        "Totalmente de acuerdo",
    ],
};

/**
 * En clima el nivel ordinal mide DESFAVORABILIDAD, para que ALTO y MUY_ALTO
 * sigan significando «requiere atención» en toda la plataforma. Por eso los
 * 35 ítems están invertidos en clima-config.json: acordar con una afirmación
 * positiva puntúa bajo.
 */
const CLIMA_LABELS = {
    SIN_RIESGO: "Muy favorable",
    BAJO: "Favorable",
    MEDIO: "Neutro",
    ALTO: "Desfavorable",
    MUY_ALTO: "Muy desfavorable",
} as const;

const CLIMA_INTERPRETATION = {
    SIN_RIESGO: {
        meaning: "Percepción muy favorable: la condición evaluada opera como fortaleza de la organización.",
        action: "Reconocer y sostener las prácticas que la producen.",
    },
    BAJO: {
        meaning: "Percepción favorable, con margen de mejora puntual.",
        action: "Mantener y comunicar los avances; recoger sugerencias del equipo.",
    },
    MEDIO: {
        meaning: "Percepción dividida: parte del equipo no comparte la valoración positiva.",
        action: "Explorar las causas con el equipo y definir una acción de mejora con responsable.",
    },
    ALTO: {
        meaning: "Percepción desfavorable: la condición evaluada afecta la experiencia de trabajo del equipo.",
        action: "Plan de mejora con acciones concretas, responsable y fecha de verificación.",
    },
    MUY_ALTO: {
        meaning: "Percepción muy desfavorable y extendida en el equipo.",
        action: "Intervención prioritaria con seguimiento del área de talento humano.",
    },
} as const;

export const INSTRUMENTS: Record<QuestionnaireType, InstrumentDef> = {
    INTRALABORAL: {
        id: "INTRALABORAL",
        family: "BATTERY",
        regulated: true,
        label: "Cuestionario de factores de riesgo psicosocial intralaboral",
        shortLabel: "Intralaboral",
        description: "Condiciones del trabajo: liderazgo, control, demandas y recompensas.",
        scale: BATTERY_SCALE,
        usesFormType: true,
        usesOccupationalGroup: false,
        hasControlQuestions: true,
        requireComplete: false,
        // M2 p. 80
        missingTolerance: [
            "liderazgo_caracteristicas",
            "relaciones_sociales",
            "relacion_colaboradores",
            "demandas_ambientales",
        ],
        totalStrategy: "domains",
        baremoKey: (formType) => (formType === "A" ? "intralaboral_a" : "intralaboral_b"),
        levelLabels: RISK_LABEL,
        interpretation: RISK_INTERPRETATION,
        invitationColumn: "intralaboralAssessmentId",
        config: (formType) => (formType === "A" ? formAConfig : formBConfig) as FormConfig,
        order: 1,
    },
    EXTRALABORAL: {
        id: "EXTRALABORAL",
        family: "BATTERY",
        regulated: true,
        label: "Cuestionario de factores de riesgo psicosocial extralaboral",
        shortLabel: "Extralaboral",
        description: "Condiciones fuera del trabajo que influyen en la salud del trabajador.",
        scale: BATTERY_SCALE,
        usesFormType: false,
        usesOccupationalGroup: true,
        hasControlQuestions: false,
        requireComplete: false,
        // M3 p. 148
        missingTolerance: ["caracteristicas_vivienda"],
        totalStrategy: "flat",
        baremoKey: () => "extralaboral",
        levelLabels: RISK_LABEL,
        interpretation: RISK_INTERPRETATION,
        invitationColumn: "extralaboralAssessmentId",
        config: () => extralaboralConfig as unknown as FormConfig,
        order: 2,
    },
    STRESS: {
        id: "STRESS",
        family: "BATTERY",
        regulated: true,
        label: "Cuestionario para la evaluación del estrés (tercera versión)",
        shortLabel: "Estrés",
        description: "Síntomas fisiológicos, sociales, intelectuales y psicoemocionales.",
        scale: STRESS_SCALE,
        usesFormType: false,
        usesOccupationalGroup: true,
        hasControlQuestions: false,
        requireComplete: true,
        missingTolerance: [],
        totalStrategy: "weighted",
        baremoKey: () => "stress",
        levelLabels: STRESS_LABEL,
        interpretation: RISK_INTERPRETATION,
        invitationColumn: "stressAssessmentId",
        config: () => stressConfig as unknown as FormConfig,
        order: 3,
    },
    CLIMA: {
        id: "CLIMA",
        family: "CLIMA",
        regulated: false,
        label: "Encuesta de clima organizacional",
        shortLabel: "Clima",
        description: "Percepción del equipo sobre liderazgo, comunicación, reconocimiento y pertenencia. No es un instrumento normativo.",
        scale: CLIMA_SCALE,
        usesFormType: false,
        usesOccupationalGroup: false,
        hasControlQuestions: false,
        requireComplete: false,
        missingTolerance: [],
        totalStrategy: "flat",
        baremoKey: () => "clima",
        levelLabels: CLIMA_LABELS,
        interpretation: CLIMA_INTERPRETATION,
        invitationColumn: "climaAssessmentId",
        config: () => climaConfig as unknown as FormConfig,
        order: 4,
        provisionalBaremos: true,
    },
};

export const INSTRUMENT_IDS = Object.keys(INSTRUMENTS) as QuestionnaireType[];

export function getInstrument(id: QuestionnaireType): InstrumentDef {
    return INSTRUMENTS[id];
}

export function isInstrumentId(value: unknown): value is QuestionnaireType {
    return typeof value === "string" && value in INSTRUMENTS;
}

export function instrumentsByFamily(family: InstrumentFamily): InstrumentDef[] {
    return INSTRUMENT_IDS.map((id) => INSTRUMENTS[id]).filter((i) => i.family === family);
}

/** Instrumentos de la Batería normativa, en el orden de diligenciamiento. */
export const BATTERY_IDS: QuestionnaireType[] = instrumentsByFamily("BATTERY")
    .sort((a, b) => a.order - b.order)
    .map((i) => i.id);

/** Orden de diligenciamiento de cualquier conjunto de instrumentos. */
export function sortByOrder(ids: QuestionnaireType[]): QuestionnaireType[] {
    return [...ids].sort((a, b) => INSTRUMENTS[a].order - INSTRUMENTS[b].order);
}

export function familyOf(id: QuestionnaireType): InstrumentFamily {
    return INSTRUMENTS[id].family;
}
