import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBaremos } from "@/config/battery";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const department = searchParams.get("department");

    if (!organizationId) {
        return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    try {
        const whereClause: any = {
            assessment: {
                organizationId
            }
        };

        if (department && department !== "ALL") {
            whereClause.assessment.worker = {
                departmentArea: department
            };
        }

        const results = await prisma.scoredResult.findMany({
            where: whereClause,
            include: {
                assessment: {
                    include: {
                        worker: true
                    }
                }
            }
        });

        // 1. Anonimato Técnico
        const uniqueWorkers = new Set(results.map(r => r.assessment.workerId));
        const workerCount = uniqueWorkers.size;
        
        if (workerCount < 5 && workerCount > 0 && department !== "ALL") {
            return NextResponse.json({ 
                privacyWarning: true, 
                message: "Datos insuficientes para garantizar el anonimato legal según la Resolución 2646 de 2008." 
            });
        }

        // Agregaciones de Riesgo
        const intralaboralFormaARisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };
        const intralaboralFormaBRisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };
        const extralaboralRisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };
        const stressRisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };

        // Agregaciones por dimensiones para extraer promedios o conteos
        // Para simplificar, acumularemos los scores transformados y el total de evaluaciones para promediar
        const dimensionAveragesA: Record<string, { sum: number, count: number, risks: Record<string, number> }> = {};
        const dimensionAveragesB: Record<string, { sum: number, count: number, risks: Record<string, number> }> = {};
        
        const domainAveragesA: Record<string, { sum: number, count: number }> = {};
        const domainAveragesB: Record<string, { sum: number, count: number }> = {};

        // 2. Matriz de Priorización
        const workerMatrix = new Map<string, { intra: string | null, stress: string | null }>();

        results.forEach(res => {
            const risk = res.overallRiskCategory || "SIN_RIESGO";
            const type = res.assessment?.questionnaireType;
            const form = res.assessment?.formType;
            const workerId = res.assessment.workerId;
            const dimensions = res.dimensionScores as Record<string, any>;

            if (!workerMatrix.has(workerId)) {
                workerMatrix.set(workerId, { intra: null, stress: null });
            }

            const w = workerMatrix.get(workerId)!;

            if (type === "INTRALABORAL") {
                w.intra = risk;
                if (form === "A") {
                    intralaboralFormaARisk[risk as keyof typeof intralaboralFormaARisk]++;
                    if (res.domainScores) {
                        Object.values(res.domainScores as Record<string, any>).forEach((dom: any) => {
                            if (!dom.domainName) return;
                            if (!domainAveragesA[dom.domainName]) domainAveragesA[dom.domainName] = { sum: 0, count: 0 };
                            domainAveragesA[dom.domainName].sum += dom.transformedScore || 0;
                            domainAveragesA[dom.domainName].count++;
                        });
                    }
                    if (dimensions) {
                        Object.values(dimensions).forEach((dim: any) => {
                            if (!dim.dimensionName) return;
                            if (!dimensionAveragesA[dim.dimensionName]) {
                                dimensionAveragesA[dim.dimensionName] = { sum: 0, count: 0, risks: { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 } };
                            }
                            dimensionAveragesA[dim.dimensionName].sum += dim.transformedScore || 0;
                            dimensionAveragesA[dim.dimensionName].count++;
                            if (dim.riskCategory) {
                                dimensionAveragesA[dim.dimensionName].risks[dim.riskCategory]++;
                            }
                        });
                    }
                } else {
                    intralaboralFormaBRisk[risk as keyof typeof intralaboralFormaBRisk]++;
                    if (res.domainScores) {
                        Object.values(res.domainScores as Record<string, any>).forEach((dom: any) => {
                            if (!dom.domainName) return;
                            if (!domainAveragesB[dom.domainName]) domainAveragesB[dom.domainName] = { sum: 0, count: 0 };
                            domainAveragesB[dom.domainName].sum += dom.transformedScore || 0;
                            domainAveragesB[dom.domainName].count++;
                        });
                    }
                    if (dimensions) {
                        Object.values(dimensions).forEach((dim: any) => {
                            if (!dim.dimensionName) return;
                            if (!dimensionAveragesB[dim.dimensionName]) {
                                dimensionAveragesB[dim.dimensionName] = { sum: 0, count: 0, risks: { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 } };
                            }
                            dimensionAveragesB[dim.dimensionName].sum += dim.transformedScore || 0;
                            dimensionAveragesB[dim.dimensionName].count++;
                            if (dim.riskCategory) {
                                dimensionAveragesB[dim.dimensionName].risks[dim.riskCategory]++;
                            }
                        });
                    }
                }
            } else if (type === "EXTRALABORAL") {
                extralaboralRisk[risk as keyof typeof extralaboralRisk]++;
            } else if (type === "STRESS") {
                stressRisk[risk as keyof typeof stressRisk]++;
                w.stress = risk;
            }
        });

        const formatChartData = (data: Record<string, number>) => 
            Object.entries(data).map(([name, value]) => ({ name, value }));

        // Evaluar Matriz de Priorización
        let priorityGroup1D = 0;
        let groupVulnerables = 0;
        let groupAdaptados = 0;
        let groupSanos = 0;

        workerMatrix.forEach((val) => {
            if (val.intra && val.stress) {
                const isIntraHigh = val.intra === "ALTO" || val.intra === "MUY_ALTO";
                const isStressHigh = val.stress === "ALTO" || val.stress === "MUY_ALTO";
                
                if (isIntraHigh && isStressHigh) priorityGroup1D++;
                else if (!isIntraHigh && isStressHigh) groupVulnerables++;
                else if (isIntraHigh && !isStressHigh) groupAdaptados++;
                else groupSanos++;
            }
        });

        // Formatear promedios de dominios/dimensiones para el frontend
        const formatAverages = (avgMap: Record<string, any>) => {
            return Object.entries(avgMap).map(([name, stats]: [string, any]) => ({
                name,
                average: parseFloat((stats.sum / stats.count).toFixed(1)),
                risks: stats.risks
            }));
        };

        const formatDomainAverages = (avgMap: Record<string, any>) => {
            return Object.entries(avgMap).map(([name, stats]: [string, any]) => ({
                name,
                average: parseFloat((stats.sum / stats.count).toFixed(1))
            }));
        };

        let departments: string[] = [];
        if (!department || department === "ALL") {
            departments = Array.from(new Set(results.map(r => r.assessment.worker.departmentArea).filter(Boolean))) as string[];
        }

        return NextResponse.json({
            privacyWarning: false,
            intralaboralFormaA: formatChartData(intralaboralFormaARisk),
            intralaboralFormaB: formatChartData(intralaboralFormaBRisk),
            extralaboral: formatChartData(extralaboralRisk),
            stress: formatChartData(stressRisk),
            dimensionsFormaA: formatAverages(dimensionAveragesA),
            dimensionsFormaB: formatAverages(dimensionAveragesB),
            domainsFormaA: formatDomainAverages(domainAveragesA),
            domainsFormaB: formatDomainAverages(domainAveragesB),
            baremos: getBaremos(),
            totalAssessments: results.length,
            workerCount,
            departments,
            priorityMatrix: {
                priorityGroup1D,
                groupVulnerables,
                groupAdaptados,
                groupSanos
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
