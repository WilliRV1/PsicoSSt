import { formAConfig, formBConfig, baremos } from "@/config/battery";
import { getInstrument, type ScaleDef } from "@/config/instruments";
import {
    RiskCategory,
    DimensionScore,
    DomainScore,
    TotalScore,
    ScoredResultData,
    FormType,
    QuestionnaireType,
    BaremoThreshold,
    ItemResponses,
    DimensionConfig,
    DomainConfig,
} from "@/types/battery";

/** Forma de una tabla de baremos (M2/M3): bandas por dimensión, por dominio y del total. */
interface BaremoFormTable {
    dimensions: Record<string, BaremoThreshold>;
    domains: Record<string, BaremoThreshold>;
    total: BaremoThreshold;
}

/** Escala de la Batería (0-4). Es el valor por omisión de las funciones públicas. */
const BATTERY_SCALE: ScaleDef = { min: 0, max: 4, labels: [] };

/**
 * Redondeo estricto a 1 decimal por aproximación
 */
function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

/**
 * Validates if a dimension should be nullified based on missing items.
 *
 * Únicas dimensiones que admiten un ítem sin respuesta: las que declara cada
 * instrumento en `missingTolerance` (M2 p. 80 para el intralaboral, M3 p. 148
 * para el extralaboral). En el resto, un solo faltante invalida la dimensión,
 * su dominio y el total.
 */
export function validateDimensionNullity(
    responses: ItemResponses,
    items: number[],
    dimensionKey: string,
    questionnaireType: QuestionnaireType
): boolean {
    const missingCount = items.filter(item => {
        const val = responses[String(item)];
        return val === undefined || val === null;
    }).length;

    if (missingCount === 0) return true;

    return missingCount === 1 && getInstrument(questionnaireType).missingTolerance.includes(dimensionKey);
}

/**
 * Reverses scores for specific items: `max + min - value` (4 - value en la Batería).
 */
export function applyInversions(
    responses: ItemResponses,
    invertedItems: number[],
    scale: ScaleDef = BATTERY_SCALE
): ItemResponses {
    const result = { ...responses };
    for (const item of invertedItems) {
        const key = String(item);
        if (key in result && result[key] !== undefined && result[key] !== null) {
            result[key] = scale.max + scale.min - result[key];
        }
    }
    return result;
}

/**
 * Maps a transformed score to a risk category based on thresholds.
 */
export function lookupRiskCategory(
    transformedScore: number,
    thresholds: BaremoThreshold
): RiskCategory {
    const score = round1(transformedScore);

    if (score <= thresholds.sinRiesgo[1]) return "SIN_RIESGO";
    if (score <= thresholds.bajo[1]) return "BAJO";
    if (score <= thresholds.medio[1]) return "MEDIO";
    if (score <= thresholds.alto[1]) return "ALTO";
    return "MUY_ALTO";
}

export function getRiskLevel(category: RiskCategory): number {
    const levels: Record<RiskCategory, number> = {
        // Cero queda reservado para lo que no es un nivel de riesgo.
        "INVALIDO": 0,
        "SIN_RIESGO": 1,
        "BAJO": 2,
        "MEDIO": 3,
        "ALTO": 4,
        "MUY_ALTO": 5
    };
    return levels[category];
}

export function calculateDimensionScore(
    responses: ItemResponses,
    config: DimensionConfig,
    baremoTable: Record<string, BaremoThreshold>,
    questionnaireType: QuestionnaireType
): DimensionScore {
    const scale = getInstrument(questionnaireType).scale;
    const isValid = validateDimensionNullity(responses, config.items, config.key, questionnaireType);

    let rawScore = 0;

    if (isValid) {
        // M2 p. 76: el ítem sin responder "se tomará como un dato perdido, sin
        // calificación alguna". El bruto es la suma de lo respondido y se
        // divide por el factor completo; imputar la media lo inflaba.
        for (const item of config.items) {
            const val = responses[String(item)];
            if (val !== undefined && val !== null) {
                rawScore += val;
            }
        }
    }

    const itemCount = config.items.length;
    // Tabla 25 y 14: ítems × amplitud de la escala. En la Batería (0-4) es
    // itemCount*4; una escala 1-5 descuenta el mínimo para que 0-100 sea real.
    const transformationFactor = itemCount * (scale.max - scale.min);
    const offset = itemCount * scale.min;

    const transformedScore = (!isValid || transformationFactor === 0) ? 0 : ((rawScore - offset) / transformationFactor) * 100;
    const roundedTransformed = round1(transformedScore);

    const thresholds = baremoTable[config.key];
    const riskCategory = (thresholds && isValid)
        ? lookupRiskCategory(roundedTransformed, thresholds)
        : "SIN_RIESGO" as RiskCategory;

    return {
        dimensionKey: config.key,
        dimensionName: config.name,
        rawScore: isValid ? round1(rawScore) : 0,
        maxPossible: transformationFactor,
        transformedScore: isValid ? roundedTransformed : 0,
        transformationFactor,
        riskCategory: isValid ? riskCategory : "INVALIDO",
        riskLevel: isValid ? getRiskLevel(riskCategory) : 0,
        itemCount,
        invertedItems: config.invertedItems,
        isValid
    };
}

export function calculateDomainScore(
    domainConfig: DomainConfig,
    dimensionScores: Record<string, DimensionScore>,
    baremoTable: Record<string, BaremoThreshold>
): DomainScore {
    let rawScore = 0;
    let allValid = true;

    for (const key of domainConfig.dimensionKeys) {
        const score = dimensionScores[key];
        if (score && score.isValid && !score.isFiltered) {
            rawScore += score.rawScore;
        } else if (score && !score.isValid) {
            allValid = false;
        }
    }

    const transformationFactor = domainConfig.transformationFactor; // Valor fijo del manual
    const transformedScore = (!allValid || transformationFactor === 0) ? 0 : (rawScore / transformationFactor) * 100;
    const roundedTransformed = round1(transformedScore);

    const thresholds = baremoTable[domainConfig.key];
    const riskCategory = (thresholds && allValid)
        ? lookupRiskCategory(roundedTransformed, thresholds)
        : "SIN_RIESGO" as RiskCategory;

    return {
        domainKey: domainConfig.key,
        domainName: domainConfig.name,
        rawScore: allValid ? round1(rawScore) : 0,
        maxPossible: transformationFactor, // Repurposed for API compatibility
        transformedScore: allValid ? roundedTransformed : 0,
        riskCategory: allValid ? riskCategory : "INVALIDO",
        riskLevel: allValid ? getRiskLevel(riskCategory) : 0,
        dimensions: domainConfig.dimensionKeys
    };
}

/**
 * Grupo de baremos que corresponde al trabajador.
 *
 * "Jefes, profesionales y técnicos" frente a "auxiliares y operarios", que es
 * la misma partición que separa las formas A y B del cuestionario intralaboral.
 */
function occupationalGroup(metadata?: { jobLevel?: string; occupationalGroup?: string }): string {
    if (metadata?.jobLevel === "AUXILIAR" || metadata?.jobLevel === "OPERATIVO") {
        return "auxiliares_operativos";
    }
    if (metadata?.occupationalGroup === "auxiliares_operativos") {
        return "auxiliares_operativos";
    }
    return "jefes_profesionales_tecnicos";
}

/**
 * Puntaje total general de la evaluación de factores de riesgo psicosocial:
 * la suma de los brutos totales del intralaboral y del extralaboral aplicados
 * al mismo trabajador.
 *
 * Es una salida que el manual exige cuando se aplican ambos cuestionarios
 * (M2 p. 80, literal d). El factor sale de la Tabla 28 (M2 p. 84): 616 en la
 * forma A y 512 en la forma B. Los baremos, de la Tabla 34 (M2 p. 86), son los
 * mismos que reproduce la Tabla 34 del manual extralaboral (M3 p. 153).
 *
 * Si cualquiera de los dos cuestionarios es inválido tampoco puede calcularse
 * el total general (M2 p. 80).
 */
export function scoreGeneralTotal(
    intralaboral: ScoredResultData,
    extralaboral: ScoredResultData
): TotalScore {
    const formType = intralaboral.formType;
    const config = formType === "A" ? formAConfig : formBConfig;
    const transformationFactor = config.generalTransformationFactor;
    const thresholds = (baremos as unknown as { total_general: Record<string, BaremoThreshold> }).total_general[
        formType === "A" ? "forma_a" : "forma_b"
    ];

    const isValid =
        intralaboral.questionnaireType === "INTRALABORAL" &&
        extralaboral.questionnaireType === "EXTRALABORAL" &&
        intralaboral.total.isValid !== false &&
        extralaboral.total.isValid !== false;

    const rawScore = isValid
        ? round1(intralaboral.total.rawScore + extralaboral.total.rawScore)
        : 0;
    const transformedScore = isValid ? round1((rawScore / transformationFactor) * 100) : 0;
    const riskCategory: RiskCategory = isValid
        ? lookupRiskCategory(transformedScore, thresholds)
        : "INVALIDO";

    return {
        rawScore,
        maxPossible: transformationFactor,
        transformedScore,
        riskCategory,
        riskLevel: isValid ? getRiskLevel(riskCategory) : 0,
        isValid
    };
}

/**
 * Valor de un ítem del cuestionario de estrés.
 *
 * La Tabla 4 del manual reparte los 31 ítems en tres grupos con pesos
 * distintos, según la gravedad del síntoma que describen: los del primer grupo
 * valen el triple que los del tercero. Aplicar un peso único a todos —como se
 * hacía— reduce el puntaje máximo posible de 100 a 49,1, con lo que ningún
 * trabajador puede clasificar en nivel alto por más síntomas que reporte.
 *
 * `stored` es lo que guarda la interfaz: 0=Siempre, 1=Casi siempre, 2=A veces,
 * 3=Nunca.
 */
const STRESS_WEIGHTS: Record<number, [number, number, number, number]> = {};
for (const i of [1, 2, 3, 9, 13, 14, 15, 23, 24]) STRESS_WEIGHTS[i] = [9, 6, 3, 0];
for (const i of [4, 5, 6, 10, 11, 16, 17, 18, 19, 25, 26, 27, 28]) STRESS_WEIGHTS[i] = [6, 4, 2, 0];
for (const i of [7, 8, 12, 20, 21, 22, 29, 30, 31]) STRESS_WEIGHTS[i] = [3, 2, 1, 0];

export function stressItemValue(item: number, stored: number | undefined | null): number {
    if (stored === undefined || stored === null) return 0;
    const escala = STRESS_WEIGHTS[item];
    if (!escala) return 0;
    return escala[stored] ?? 0;
}

/** Peso máximo posible de un ítem de estrés (stored=0, "Siempre"). */
function stressItemMaxWeight(item: number): number {
    return STRESS_WEIGHTS[item]?.[0] ?? 0;
}

export function scoreQuestionnaire(
    rawResponses: ItemResponses,
    formType: FormType,
    questionnaireType: QuestionnaireType,
    metadata?: {
        occupationalGroup?: string, // 'jefes_profesionales_tecnicos' o 'auxiliares_operativos'
        gender?: string,
        jobLevel?: string,
        hasCustomerInteraction?: boolean,
        /**
         * Respuesta del trabajador a "soy jefe de otras personas en mi trabajo",
         * la pregunta de control que antecede a los ítems 115 a 123 de la forma
         * A. Es el único criterio del manual: el nivel del cargo no lo
         * determina, porque un técnico puede tener personal a cargo y un
         * profesional puede no tenerlo.
         */
        hasPeopleInCharge?: boolean
    }
): ScoredResultData {
    const instrument = getInstrument(questionnaireType);
    const config = instrument.config(formType);
    const weighted = instrument.totalStrategy === "weighted";

    let baremoTable = (baremos as unknown as Record<string, BaremoFormTable>)[instrument.baremoKey(formType)];

    // Los baremos de extralaboral están estratificados por nivel ocupacional
    // (M3 Tabla 17); los de estrés también, pero sólo para el total (abajo).
    if (instrument.usesOccupationalGroup && !weighted) {
        baremoTable = (baremoTable as unknown as Record<string, BaremoFormTable>)[occupationalGroup(metadata)];
    }

    // M4 Tabla 6 (p. 382) baremiza ÚNICAMENTE el puntaje total, estratificado
    // por nivel ocupacional. No existe baremo publicado para los cuatro grupos
    // de síntomas, así que sus puntajes se reportan como descriptivos y sin
    // nivel: reutilizar aquí las bandas del total fabricaba una clasificación
    // que el instrumento no respalda.
    const weightedTotalThresholds: BaremoThreshold | null = weighted
        ? (baremoTable as unknown as Record<string, BaremoThreshold>)[occupationalGroup(metadata)]
        : null;

    // Los instrumentos que no admiten faltantes (estrés, M4) necesitan saberlo
    // antes de calificar cada grupo, no sólo el total.
    const allItems = config.dimensions.flatMap(d => d.items);
    const isComplete = instrument.requireComplete
        ? allItems.every(i => rawResponses[String(i)] !== undefined && rawResponses[String(i)] !== null)
        : true;

    let processedResponses = { ...rawResponses };
    if (!weighted) {
        for (const dim of config.dimensions) {
            processedResponses = applyInversions(processedResponses, dim.invertedItems, instrument.scale);
        }
    }

    const dimensionResults: Record<string, DimensionScore> = {};
    let allDimensionsValid = true;

    for (const dim of config.dimensions) {
        let isFiltered = false;
        if (instrument.hasControlQuestions) {
            // El manual (M2, Paso 2): quien responde que no es jefe de otras
            // personas no debe responder los ítems 115 a 123, y la dimensión
            // "relación con los colaboradores" obtiene puntaje bruto cero. El
            // factor de transformación del dominio y del total NO cambia.
            if (formType === "A" && dim.key === "relacion_colaboradores" &&
                metadata?.hasPeopleInCharge === false) {
                isFiltered = true;
            }
            // Ídem para quien no brinda servicio a clientes o usuarios.
            if (dim.key === "demandas_emocionales" && metadata?.hasCustomerInteraction === false) {
                isFiltered = true;
            }
        }

        if (isFiltered) {
            const factor = dim.items.length * (instrument.scale.max - instrument.scale.min);
            dimensionResults[dim.key] = {
                dimensionKey: dim.key,
                dimensionName: dim.name,
                rawScore: 0,
                maxPossible: factor,
                transformedScore: 0,
                transformationFactor: factor,
                riskCategory: "SIN_RIESGO",
                riskLevel: 1,
                itemCount: dim.items.length,
                invertedItems: dim.invertedItems,
                isValid: true,
                isFiltered: true
            };
        } else if (weighted) {
            // Puntaje real del grupo de síntomas: pesos de la Tabla 4, no el
            // promedio genérico de calculateDimensionScore (que además usaba
            // itemCount*4 como máximo, una escala equivocada — los ítems de
            // estrés van de 0 a 3, no de 0 a 4).
            let rawScore = 0;
            let maxPossible = 0;
            for (const item of dim.items) {
                rawScore += stressItemValue(item, rawResponses[String(item)]);
                maxPossible += stressItemMaxWeight(item);
            }
            const transformedScore = isComplete && maxPossible > 0
                ? (rawScore / maxPossible) * 100
                : 0;
            const roundedTransformed = round1(transformedScore);

            dimensionResults[dim.key] = {
                dimensionKey: dim.key,
                dimensionName: dim.name,
                rawScore: isComplete ? round1(rawScore) : 0,
                maxPossible,
                transformedScore: isComplete ? roundedTransformed : 0,
                transformationFactor: maxPossible,
                riskCategory: isComplete ? null : "INVALIDO",
                riskLevel: 0,
                itemCount: dim.items.length,
                invertedItems: dim.invertedItems,
                isValid: isComplete,
                isUnscored: isComplete
            };
            if (!isComplete) {
                allDimensionsValid = false;
            }
        } else {
            const dimScore = calculateDimensionScore(
                processedResponses,
                dim,
                baremoTable.dimensions || {},
                questionnaireType
            );
            dimensionResults[dim.key] = dimScore;
            if (!dimScore.isValid) {
                allDimensionsValid = false;
            }
        }
    }

    const domainResults: Record<string, DomainScore> = {};
    let totalRaw = 0;
    let totalTransformed = 0;

    if (instrument.totalStrategy === "domains") {
        for (const dom of config.domains) {
            const domainScore = calculateDomainScore(
                dom,
                dimensionResults,
                baremoTable.domains || {}
            );
            domainResults[dom.key] = domainScore;
            if (domainScore.rawScore > 0) {
                totalRaw += domainScore.rawScore;
            }
        }

        if (allDimensionsValid) {
            totalTransformed = (totalRaw / config.totalTransformationFactor) * 100;
        }
    } else if (instrument.totalStrategy === "flat") {
        // Suma de brutos de las dimensiones. En una escala con mínimo distinto
        // de cero se descuenta el mínimo acumulado para que 0-100 sea real.
        for (const key in dimensionResults) {
            totalRaw += dimensionResults[key].rawScore;
        }
        if (allDimensionsValid) {
            const offset = allItems.length * instrument.scale.min;
            totalTransformed = ((totalRaw - offset) / config.totalTransformationFactor) * 100;
        }
    } else {
        // Todos los ítems deben estar respondidos: el manual no admite
        // faltantes en este cuestionario. Ya se reflejó en allDimensionsValid
        // (vía isComplete) al calificar cada grupo de síntomas arriba.
        if (allDimensionsValid) {
            const promedio = (desde: number, hasta: number) => {
                let suma = 0;
                let n = 0;
                for (let i = desde; i <= hasta; i++) {
                    suma += stressItemValue(i, rawResponses[String(i)]);
                    n++;
                }
                return n > 0 ? suma / n : 0;
            };

            // M4, Paso 2: promedios ponderados de los cuatro grupos de ítems.
            totalRaw =
                promedio(1, 8) * 4 +
                promedio(9, 12) * 3 +
                promedio(13, 22) * 2 +
                promedio(23, 31);

            totalTransformed = (totalRaw / config.totalTransformationFactor) * 100;
        }
    }

    // La Tabla 6 del manual del estrés distingue baremos por nivel ocupacional
    // y por nada más. La tabla anterior los duplicaba por sexo con valores
    // idénticos, lo que sugería una diferenciación que el instrumento no hace.
    const totalThresholds: BaremoThreshold = weighted
        ? (weightedTotalThresholds as BaremoThreshold)
        : baremoTable.total;

    const roundedTotalTransformed = round1(totalTransformed);
    const totalCategory: RiskCategory =
        allDimensionsValid && totalThresholds
            ? lookupRiskCategory(roundedTotalTransformed, totalThresholds)
            : "INVALIDO";

    const total: TotalScore = {
        rawScore: allDimensionsValid ? round1(totalRaw) : 0,
        maxPossible: config.totalTransformationFactor,
        transformedScore: allDimensionsValid ? roundedTotalTransformed : 0,
        riskCategory: allDimensionsValid ? totalCategory : "INVALIDO",
        riskLevel: allDimensionsValid ? getRiskLevel(totalCategory) : 0,
        isValid: allDimensionsValid
    };

    return {
        formType,
        questionnaireType,
        dimensions: dimensionResults,
        domains: domainResults,
        total
    };
}
