export interface CollectiveMetrics {
    totalEvaluated: number;
    healthScore: number;
    healthScoreTrend: number | null; // e.g., +5 or -2 compared to last year
    topFindings: Array<{ name: string; risk: string; value: number }>;
    protectiveFactors: Array<{ name: string; risk: string; value: number }>;
    criticalAreas: Array<{ name: string; highRiskPercentage: number }>;
    rawDimensions: Record<string, { sinRiesgo: number; bajo: number; medio: number; alto: number; muyAlto: number; total: number }>;
    rawDomains: Record<string, { sinRiesgo: number; bajo: number; medio: number; alto: number; muyAlto: number; total: number }>;
}

export function computeCollectiveMetrics(workers: any[], previousWorkers?: any[]): CollectiveMetrics {
    let totalEvaluated = workers.length;
    let highRiskCount = 0;
    
    // Flatten all dimensions from all workers' assessments
    const dimensionCounts: Record<string, { sinRiesgo: number; bajo: number; medio: number; alto: number; muyAlto: number; total: number }> = {};
    const domainCounts: Record<string, { sinRiesgo: number; bajo: number; medio: number; alto: number; muyAlto: number; total: number }> = {};
    const areaCounts: Record<string, { total: number; highRisk: number }> = {};

    workers.forEach(worker => {
        const area = worker.departmentArea || "Sin área";
        if (!areaCounts[area]) areaCounts[area] = { total: 0, highRisk: 0 };
        areaCounts[area].total++;

        let hasHighRisk = false;

        worker.assessments.forEach((assessment: any) => {
            const result = assessment.scoredResult;
            if (!result) return;
            
            const risk = result.overallRiskCategory;
            if (risk === "ALTO" || risk === "MUY_ALTO") hasHighRisk = true;

            const dims = result.dimensionScores as Record<string, any>;
            if (dims) {
                for (const [dimName, data] of Object.entries(dims)) {
                    if (!dimensionCounts[dimName]) {
                        dimensionCounts[dimName] = { sinRiesgo: 0, bajo: 0, medio: 0, alto: 0, muyAlto: 0, total: 0 };
                    }
                    const dimRisk = data.riskCategory;
                    dimensionCounts[dimName].total++;
                    if (dimRisk === "SIN_RIESGO") dimensionCounts[dimName].sinRiesgo++;
                    if (dimRisk === "BAJO") dimensionCounts[dimName].bajo++;
                    if (dimRisk === "MEDIO") dimensionCounts[dimName].medio++;
                    if (dimRisk === "ALTO") dimensionCounts[dimName].alto++;
                    if (dimRisk === "MUY_ALTO") dimensionCounts[dimName].muyAlto++;
                }
            }

            const doms = result.domainScores as Record<string, any>;
            if (doms) {
                for (const [domName, data] of Object.entries(doms)) {
                    if (!domainCounts[domName]) {
                        domainCounts[domName] = { sinRiesgo: 0, bajo: 0, medio: 0, alto: 0, muyAlto: 0, total: 0 };
                    }
                    const domRisk = data.riskCategory;
                    domainCounts[domName].total++;
                    if (domRisk === "SIN_RIESGO") domainCounts[domName].sinRiesgo++;
                    if (domRisk === "BAJO") domainCounts[domName].bajo++;
                    if (domRisk === "MEDIO") domainCounts[domName].medio++;
                    if (domRisk === "ALTO") domainCounts[domName].alto++;
                    if (domRisk === "MUY_ALTO") domainCounts[domName].muyAlto++;
                }
            }
        });

        if (hasHighRisk) {
            highRiskCount++;
            areaCounts[area].highRisk++;
        }
    });

    // Health Score: 100 - (percentage of workers with high risk * 0.8) - (percentage of medium risk * 0.4) 
    // Simplified for now: based on workers without high risk.
    const healthScore = totalEvaluated > 0 
        ? Math.round(((totalEvaluated - highRiskCount) / totalEvaluated) * 100) 
        : 100;

    // Process dimensions
    const dimensionScores = Object.entries(dimensionCounts).map(([name, counts]) => {
        const total = counts.sinRiesgo + counts.bajo + counts.medio + counts.alto + counts.muyAlto;
        const negativePercentage = total > 0 ? ((counts.alto + counts.muyAlto) / total) * 100 : 0;
        const positivePercentage = total > 0 ? ((counts.sinRiesgo + counts.bajo) / total) * 100 : 0;
        return { name, negativePercentage, positivePercentage, total };
    });

    // Sort for top findings (most negative)
    const sortedNegative = [...dimensionScores].sort((a, b) => b.negativePercentage - a.negativePercentage);
    const topFindings = sortedNegative.slice(0, 5).map(d => ({
        name: d.name,
        risk: d.negativePercentage > 50 ? "Crítico" : "Alto",
        value: Math.round(d.negativePercentage)
    }));

    // Sort for protective factors (most positive)
    const sortedPositive = [...dimensionScores].sort((a, b) => b.positivePercentage - a.positivePercentage);
    const protectiveFactors = sortedPositive.slice(0, 3).map(d => ({
        name: d.name,
        risk: "Fortaleza",
        value: Math.round(d.positivePercentage)
    }));

    // Critical Areas
    const criticalAreas = Object.entries(areaCounts)
        .map(([name, counts]) => ({
            name,
            highRiskPercentage: Math.round((counts.highRisk / counts.total) * 100)
        }))
        .filter(a => a.highRiskPercentage > 30) // Only areas with > 30% high risk
        .sort((a, b) => b.highRiskPercentage - a.highRiskPercentage);

    return {
        totalEvaluated,
        healthScore,
        healthScoreTrend: null, 
        topFindings,
        protectiveFactors,
        criticalAreas,
        rawDimensions: dimensionCounts,
        rawDomains: domainCounts
    };
}
