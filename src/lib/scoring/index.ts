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
 * Validates if a dimension should be nullified based on missing items.
 * Rule: More than 1 item missing for N > 2, or any missing for N <= 2.
 */
export function validateDimensionNullity(
    responses: ItemResponses,
    items: number[]
): boolean {
    const missingCount = items.filter(item => {
        const val = responses[String(item)];
        return val === undefined || val === null;
    }).length;

    const n = items.length;
    if (n <= 2) return missingCount === 0;
    return missingCount <= 1;
}

/**
 * Reverses scores for specific items (4 - value).
 * Typically used for "Negative/Risk" items to make High Score = High Risk.
 */
export function applyInversions(
    responses: ItemResponses,
    invertedItems: number[]
): ItemResponses {
    const result = { ...responses };
    for (const item of invertedItems) {
        const key = String(item);
        if (key in result) {
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
    // Round to 1 decimal for lookup to match baremo precision
    const score = Math.round(transformedScore * 10) / 10;

    if (score <= thresholds.sinRiesgo[1]) return "SIN_RIESGO";
    if (score <= thresholds.bajo[1]) return "BAJO";
    if (score <= thresholds.medio[1]) return "MEDIO";
    if (score <= thresholds.alto[1]) return "ALTO";
    return "MUY_ALTO";
}

/**
 * Returns risk level (1-5) for a category
 */
export function getRiskLevel(category: RiskCategory): number {
    const levels: Record<RiskCategory, number> = {
        "SIN_RIESGO": 1,
        "BAJO": 2,
        "MEDIO": 3,
        "ALTO": 4,
        "MUY_ALTO": 5
    };
    return levels[category];
}

/**
 * Calculates result for a single dimension
 */
export function calculateDimensionScore(
    responses: ItemResponses,
    config: any, // DimensionConfig
    baremoTable: Record<string, BaremoThreshold>
): DimensionScore {
    let rawScore = 0;
    for (const item of config.items) {
        rawScore += responses[String(item)] ?? 0;
    }

    const itemCount = config.items.length;
    const maxPossible = itemCount * 4;

    // Validate Nullity
    const isValid = validateDimensionNullity(responses, config.items);
    const transformedScore = (!isValid || maxPossible === 0) ? 0 : (rawScore / maxPossible) * 100;

    const thresholds = baremoTable[config.key];
    const riskCategory = (thresholds && isValid)
        ? lookupRiskCategory(transformedScore, thresholds)
        : "SIN_RIESGO" as RiskCategory;

    return {
        dimensionKey: config.key,
        dimensionName: config.name,
        rawScore,
        maxPossible,
        transformedScore: Math.round(transformedScore * 100) / 100,
        transformationFactor: maxPossible === 0 ? 0 : Math.round((100 / maxPossible) * 1000) / 1000,
        riskCategory,
        riskLevel: getRiskLevel(riskCategory),
        itemCount,
        invertedItems: config.invertedItems,
        isValid
    };
}

/**
 * Aggregates dimensions into a domain score
 */
export function calculateDomainScore(
    domainKey: string,
    domainName: string,
    dimensionScores: Record<string, DimensionScore>,
    dimensionKeys: string[],
    baremoTable: Record<string, BaremoThreshold>
): DomainScore {
    let rawScore = 0;
    let maxPossible = 0;

    for (const key of dimensionKeys) {
        const score = dimensionScores[key];
        if (score) {
            rawScore += score.rawScore;
            maxPossible += score.maxPossible;
        }
    }

    const transformedScore = maxPossible === 0 ? 0 : (rawScore / maxPossible) * 100;
    const thresholds = baremoTable[domainKey];
    const riskCategory = thresholds
        ? lookupRiskCategory(transformedScore, thresholds)
        : "SIN_RIESGO" as RiskCategory;

    return {
        domainKey,
        domainName,
        rawScore,
        maxPossible,
        transformedScore: Math.round(transformedScore * 100) / 100,
        riskCategory,
        riskLevel: getRiskLevel(riskCategory),
        dimensions: dimensionKeys
    };
}

/**
 * Main entry point: Score a complete questionnaire
 */
export function scoreQuestionnaire(
    rawResponses: ItemResponses,
    formType: FormType,
    questionnaireType: QuestionnaireType,
    metadata?: {
        occupationalGroup?: string,
        gender?: string,
        jobLevel?: string,
        hasCustomerInteraction?: boolean
    }
): ScoredResultData {
    // 1. Get Config
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

    const baremoTable = (baremos as any)[baremoKey];

    // 2. Pre-process: Apply Inversions or Custom Mappings
    // Inversions are defined per dimension in the config
    let processedResponses = { ...rawResponses };
    if (questionnaireType === "STRESS") {
        for (const dim of config.dimensions) {
            for (const item of dim.items) {
                const key = String(item);
                const uiValue = rawResponses[key];
                if (uiValue !== undefined && uiValue !== null) {
                    // For stress, uiValue 0=Siempre, 1=Casi siempre, 2=A veces, 3=Nunca.
                    // If legacy data has 4, treat as Nunca.
                    const inverted = 3 - Math.min(uiValue, 3); // 3=Siempre, 0=Nunca
                    
                    if ([1, 2, 3, 9, 13, 14, 15, 23, 24].includes(item)) {
                        processedResponses[key] = inverted * 3; // Max 9
                    } else if ([4, 5, 6, 10, 11, 16, 17, 18, 19, 25, 26, 27, 28].includes(item)) {
                        processedResponses[key] = inverted * 2; // Max 6
                    } else {
                        processedResponses[key] = inverted * 1; // Max 3
                    }
                }
            }
        }
    } else {
        for (const dim of config.dimensions) {
            processedResponses = applyInversions(processedResponses, dim.invertedItems);
        }
    }

    // 3. Score Dimensions
    const dimensionResults: Record<string, DimensionScore> = {};
    for (const dim of config.dimensions) {
        let currentResponses = processedResponses;

        // Apply Filter Logic
        let isFiltered = false;
        if (questionnaireType === "INTRALABORAL") {
            // Relación con colaboradores filter (only for Form A if NOT JEFATURA)
            if (formType === "A" && dim.key === "relacion_colaboradores" && metadata?.jobLevel !== "JEFATURA") {
                isFiltered = true;
            }
            // Demandas emocionales filter (customer interaction)
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
                transformationFactor: 0,
                riskCategory: "SIN_RIESGO",
                riskLevel: 1,
                itemCount: dim.items.length,
                invertedItems: dim.invertedItems,
                isValid: true,
                isFiltered: true
            };
        } else {
            dimensionResults[dim.key] = calculateDimensionScore(
                currentResponses,
                dim,
                baremoTable.dimensions || {}
            );
        }
    }

    // 4. Score Domains
    const domainResults: Record<string, DomainScore> = {};
    let totalRaw = 0;
    let totalMax = 0;

    if (config.domains) {
        for (const dom of config.domains) {
            const domainScore = calculateDomainScore(
                dom.key,
                dom.name,
                dimensionResults,
                dom.dimensionKeys,
                baremoTable.domains || {}
            );
            domainResults[dom.key] = domainScore;
            totalRaw += domainScore.rawScore;
            totalMax += domainScore.maxPossible;
        }
    } else {
        // Simple questionnaires (Extralaboral, Stress) might not have domains
        // so we aggregate all dimensions directly for the total
        for (const key in dimensionResults) {
            totalRaw += dimensionResults[key].rawScore;
            totalMax += dimensionResults[key].maxPossible;
        }
    }

    // 5. Calculate Total
    let totalTransformed = 0;
    
    if (questionnaireType === "STRESS") {
        const dimFis = dimensionResults["sintomas_fisiologicos"]?.rawScore || 0;
        const dimSoc = dimensionResults["sintomas_sociales"]?.rawScore || 0;
        const dimInt = dimensionResults["sintomas_intelectuales"]?.rawScore || 0;
        const dimPsi = dimensionResults["sintomas_psicoemocionales"]?.rawScore || 0;
        
        // Promedios ponderados por grupo
        const avgFis = dimFis / 8;
        const avgSoc = dimSoc / 4;
        const avgInt = dimInt / 10;
        const avgPsi = dimPsi / 9;
        
        const totalRawStress = (avgFis * 4) + (avgSoc * 3) + (avgInt * 2) + (avgPsi * 1);
        
        totalRaw = totalRawStress;
        totalMax = 61.16; // Factor de transformación para estrés
        
        // Validación de completitud: el estrés exige todos los ítems
        const allItemsAnswered = Object.keys(rawResponses).length >= 31;
        totalTransformed = allItemsAnswered ? (totalRawStress / 61.16) * 100 : 0;
    } else {
        totalTransformed = totalMax === 0 ? 0 : (totalRaw / totalMax) * 100;
    }

    // Total Baremo lookup
    let totalThresholds: BaremoThreshold;
    if (questionnaireType === "STRESS") {
        const group = metadata?.occupationalGroup || "profesionales_tecnicos";
        const gender = metadata?.gender || "F";

        // Handle gender-nested baremos if present, otherwise fallback
        const genderTable = baremoTable.total[gender] || baremoTable.total;
        totalThresholds = genderTable[group] || genderTable;
    } else {
        totalThresholds = baremoTable.total;
    }

    const totalCategory = lookupRiskCategory(totalTransformed, totalThresholds);

    const total: TotalScore = {
        rawScore: totalRaw,
        maxPossible: totalMax,
        transformedScore: Math.round(totalTransformed * 100) / 100,
        riskCategory: totalCategory,
        riskLevel: getRiskLevel(totalCategory)
    };

    return {
        formType,
        questionnaireType,
        dimensions: dimensionResults,
        domains: domainResults,
        total
    };
}
