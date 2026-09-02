import {
    formAConfig,
    formBConfig,
    extralaboralConfig,
    stressConfig,
    baremos
} from "@/config/battery";
import {
    FormConfig,
    RiskCategory,
    DimensionScore,
    DomainScore,
    TotalScore,
    ScoredResultData,
    FormType,
    QuestionnaireType,
    BaremoThreshold,
    ItemResponses,
    JobLevel
} from "@/types/battery";

/**
 * Redondeo estricto a 1 decimal por aproximación
 */
function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

/**
 * Validates if a dimension should be nullified based on missing items.
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

    if (questionnaireType === "INTRALABORAL") {
        const tolerantDimensions = [
            "liderazgo_caracteristicas",
            "relaciones_sociales",
            "relacion_colaboradores",
            "demandas_ambientales"
        ];
        if (tolerantDimensions.includes(dimensionKey) && missingCount === 1) {
            return true;
        }
    }
    
    return false;
}

/**
 * Reverses scores for specific items (4 - value).
 */
export function applyInversions(
    responses: ItemResponses,
    invertedItems: number[]
): ItemResponses {
    const result = { ...responses };
    for (const item of invertedItems) {
        const key = String(item);
        if (key in result && result[key] !== undefined && result[key] !== null) {
            result[key] = 4 - result[key];
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
    config: any,
    baremoTable: Record<string, BaremoThreshold>,
    questionnaireType: QuestionnaireType
): DimensionScore {
    const isValid = validateDimensionNullity(responses, config.items, config.key, questionnaireType);
    
    let rawScore = 0;
    let answeredCount = 0;
    
    if (isValid) {
        for (const item of config.items) {
            const val = responses[String(item)];
            if (val !== undefined && val !== null) {
                rawScore += val;
                answeredCount++;
            }
        }
        
        // Imputación por media si hay faltantes permitidos
        if (answeredCount < config.items.length && answeredCount > 0) {
            const avg = rawScore / answeredCount;
            const missing = config.items.length - answeredCount;
            rawScore += (avg * missing);
        }
    }

    const itemCount = config.items.length;
    const transformationFactor = itemCount * 4; // Fijo (Tabla 25 y 14)
    
    const transformedScore = (!isValid || transformationFactor === 0) ? 0 : (rawScore / transformationFactor) * 100;
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
    domainConfig: any,
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

/** Los 31 ítems del cuestionario de estrés, tercera versión. */
const STRESS_ITEMS = Array.from({ length: 31 }, (_, i) => i + 1);

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
    let config: any;
    let baremoKey: string;

    if (questionnaireType === "INTRALABORAL") {
        config = formType === "A" ? formAConfig : formBConfig;
        baremoKey = formType === "A" ? "intralaboral_a" : "intralaboral_b";
    } else if (questionnaireType === "EXTRALABORAL") {
        config = extralaboralConfig;
        baremoKey = "extralaboral";
    } else {
        config = stressConfig;
        baremoKey = "stress";
    }

    let baremoTable = (baremos as any)[baremoKey];

    // Los baremos de extralaboral y de estrés están estratificados por nivel
    // ocupacional (M3 Tabla 17, M4 Tabla 5).
    if (questionnaireType === "EXTRALABORAL") {
        baremoTable = baremoTable[occupationalGroup(metadata)];
    }

    // El manual de estrés (M4) sólo publica baremo para el puntaje TOTAL —
    // Tabla 6 clasifica por nivel ocupacional, nada más. No hay baremo propio
    // para los 4 grupos de síntomas. A falta de uno publicado por subescala,
    // se reutilizan aquí esas mismas cinco bandas para clasificar el puntaje
    // ponderado de cada grupo (Tabla 4): es una lectura derivada, no un
    // baremo oficial de subescala, pero preferible a que el desglose por
    // síntoma caiga siempre en "Sin Riesgo" sin importar la gravedad real —
    // que es lo que impedía que la alerta de salud mental (ver
    // DIMENSION_ACTION.sintomas_psicoemocionales) se disparara alguna vez.
    const stressTotalThresholds: BaremoThreshold | null =
        questionnaireType === "STRESS" ? baremoTable[occupationalGroup(metadata)] : null;

    // El manual no admite ítems faltantes en Estrés; se necesita saber esto
    // antes de calificar cada grupo de síntomas, no sólo el total.
    const stressComplete = questionnaireType === "STRESS"
        ? STRESS_ITEMS.every(i => rawResponses[String(i)] !== undefined && rawResponses[String(i)] !== null)
        : true;

    let processedResponses = { ...rawResponses };
    if (questionnaireType !== "STRESS") {
        for (const dim of config.dimensions) {
            processedResponses = applyInversions(processedResponses, dim.invertedItems);
        }
    }

    const dimensionResults: Record<string, DimensionScore> = {};
    let allDimensionsValid = true;

    for (const dim of config.dimensions) {
        let isFiltered = false;
        if (questionnaireType === "INTRALABORAL") {
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
            dimensionResults[dim.key] = {
                dimensionKey: dim.key,
                dimensionName: dim.name,
                rawScore: 0,
                maxPossible: dim.items.length * 4,
                transformedScore: 0,
                transformationFactor: dim.items.length * 4,
                riskCategory: "SIN_RIESGO",
                riskLevel: 1,
                itemCount: dim.items.length,
                invertedItems: dim.invertedItems,
                isValid: true,
                isFiltered: true
            };
        } else if (questionnaireType === "STRESS") {
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
            const transformedScore = stressComplete && maxPossible > 0
                ? (rawScore / maxPossible) * 100
                : 0;
            const roundedTransformed = round1(transformedScore);
            const riskCategory: RiskCategory = (stressComplete && stressTotalThresholds)
                ? lookupRiskCategory(roundedTransformed, stressTotalThresholds)
                : "INVALIDO";

            dimensionResults[dim.key] = {
                dimensionKey: dim.key,
                dimensionName: dim.name,
                rawScore: stressComplete ? round1(rawScore) : 0,
                maxPossible,
                transformedScore: stressComplete ? roundedTransformed : 0,
                transformationFactor: maxPossible,
                riskCategory: stressComplete ? riskCategory : "INVALIDO",
                riskLevel: stressComplete ? getRiskLevel(riskCategory) : 0,
                itemCount: dim.items.length,
                invertedItems: dim.invertedItems,
                isValid: stressComplete
            };
            if (!stressComplete) {
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

    if (questionnaireType === "INTRALABORAL") {
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
    } else if (questionnaireType === "EXTRALABORAL") {
        for (const key in dimensionResults) {
            totalRaw += dimensionResults[key].rawScore;
        }
        if (allDimensionsValid) {
            totalTransformed = (totalRaw / config.totalTransformationFactor) * 100;
        }
    } else if (questionnaireType === "STRESS") {
        // Todos los ítems deben estar respondidos: el manual no admite
        // faltantes en este cuestionario. Ya se reflejó en allDimensionsValid
        // (vía stressComplete) al calificar cada grupo de síntomas arriba.
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
    const totalThresholds: BaremoThreshold =
        questionnaireType === "STRESS"
            ? (stressTotalThresholds as BaremoThreshold)
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
