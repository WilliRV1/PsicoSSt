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
        riskCategory: isValid ? riskCategory : "SIN_RIESGO",
        riskLevel: isValid ? getRiskLevel(riskCategory) : 1,
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
        riskCategory: allValid ? riskCategory : "SIN_RIESGO",
        riskLevel: allValid ? getRiskLevel(riskCategory) : 1,
        dimensions: domainConfig.dimensionKeys
    };
}

export function scoreQuestionnaire(
    rawResponses: ItemResponses,
    formType: FormType,
    questionnaireType: QuestionnaireType,
    metadata?: {
        occupationalGroup?: string, // 'jefes_profesionales_tecnicos' o 'auxiliares_operativos'
        gender?: string,
        jobLevel?: string,
        hasCustomerInteraction?: boolean
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

    // Baremos diferenciales Extralaboral
    if (questionnaireType === "EXTRALABORAL") {
        let group = "jefes_profesionales_tecnicos";
        if (metadata?.jobLevel === "AUXILIAR" || metadata?.jobLevel === "OPERATIVO") {
            group = "auxiliares_operativos";
        } else if (metadata?.occupationalGroup === "auxiliares_operativos") {
            group = "auxiliares_operativos";
        }
        baremoTable = baremoTable[group];
    }

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
            // "no jefe" -> relacion_colaboradores = 0.0
            if (formType === "A" && dim.key === "relacion_colaboradores" && 
                metadata?.jobLevel !== "JEFATURA" && metadata?.jobLevel !== "PROFESIONAL") {
                // If it's explicitly marked as not having people in charge, but since we only have jobLevel, we assume JEFATURA/PROFESIONAL might have people.
                // Or if we have a specific flag. We will use jobLevel for now as proxy if specific flag is missing.
                isFiltered = true; 
            }
            // "no atiende clientes" -> demandas_emocionales = 0.0
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
        // Validación de 31 ítems sin faltantes
        allDimensionsValid = Object.keys(rawResponses).length >= 31;
        
        if (allDimensionsValid) {
            // Grupo 1: 1-8
            let sum1 = 0; for(let i=1; i<=8; i++) sum1 += rawResponses[String(i)] || 0;
            const avg1 = sum1 / 8;
            
            // Grupo 2: 9-12
            let sum2 = 0; for(let i=9; i<=12; i++) sum2 += rawResponses[String(i)] || 0;
            const avg2 = sum2 / 4;
            
            // Grupo 3: 13-22
            let sum3 = 0; for(let i=13; i<=22; i++) sum3 += rawResponses[String(i)] || 0;
            const avg3 = sum3 / 10;
            
            // Grupo 4: 23-31
            let sum4 = 0; for(let i=23; i<=31; i++) sum4 += rawResponses[String(i)] || 0;
            const avg4 = sum4 / 9;
            
            totalRaw = (avg1 * 4) + (avg2 * 3) + (avg3 * 2) + (avg4 * 1);
            totalTransformed = (totalRaw / config.totalTransformationFactor) * 100;
        }
    }

    let totalThresholds: BaremoThreshold;
    if (questionnaireType === "STRESS") {
        let group = "jefes_profesionales_tecnicos";
        if (metadata?.jobLevel === "AUXILIAR" || metadata?.jobLevel === "OPERATIVO") {
            group = "auxiliares_operativos";
        } else if (metadata?.occupationalGroup === "auxiliares_operativos") {
            group = "auxiliares_operativos";
        }
        
        const gender = metadata?.gender === "M" ? "M" : "F";
        totalThresholds = baremoTable[gender]?.[group];
        if (!totalThresholds) {
            totalThresholds = baremoTable["F"]["jefes_profesionales_tecnicos"];
        }
    } else {
        totalThresholds = baremoTable.total;
    }

    const roundedTotalTransformed = round1(totalTransformed);
    const totalCategory = (allDimensionsValid && totalThresholds) 
        ? lookupRiskCategory(roundedTotalTransformed, totalThresholds) 
        : "SIN_RIESGO" as RiskCategory;

    const total: TotalScore = {
        rawScore: allDimensionsValid ? round1(totalRaw) : 0,
        maxPossible: config.totalTransformationFactor,
        transformedScore: allDimensionsValid ? roundedTotalTransformed : 0,
        riskCategory: allDimensionsValid ? totalCategory : "SIN_RIESGO",
        riskLevel: allDimensionsValid ? getRiskLevel(totalCategory) : 1
    };

    return {
        formType,
        questionnaireType,
        dimensions: dimensionResults,
        domains: domainResults,
        total
    };
}
