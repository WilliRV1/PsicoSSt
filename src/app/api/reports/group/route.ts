import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        // Contamos cuántos trabajadores únicos hay en la muestra
        const uniqueWorkers = new Set(results.map(r => r.assessment.workerId));
        const workerCount = uniqueWorkers.size;
        
        if (workerCount < 5 && workerCount > 0 && department !== "ALL") {
            return NextResponse.json({ 
                privacyWarning: true, 
                message: "Datos insuficientes para garantizar el anonimato legal según la Resolución 2646 de 2008." 
            });
        }

        // Agregaciones de Riesgo por Cuestionario
        const intralaboralRisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };
        const extralaboralRisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };
        const stressRisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };

        // 2. Matriz de Priorización (Intralaboral vs Estrés)
        const workerMatrix = new Map<string, { intra: string | null, stress: string | null }>();

        results.forEach(res => {
            const risk = res.overallRiskCategory || "SIN_RIESGO";
            const type = res.assessment?.questionnaireType;
            const workerId = res.assessment.workerId;

            if (!workerMatrix.has(workerId)) {
                workerMatrix.set(workerId, { intra: null, stress: null });
            }

            const w = workerMatrix.get(workerId)!;

            if (type === "INTRALABORAL") {
                intralaboralRisk[risk as keyof typeof intralaboralRisk]++;
                w.intra = risk;
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
        let priorityGroup1D = 0; // Prioridad de Intervención (Alto/Muy Alto en Intra Y Alto/Muy Alto en Estrés)
        let groupVulnerables = 0; // Alto/Muy Alto en Estrés pero Bajo/Medio/Sin Riesgo Intra
        let groupSanos = 0; // Sin Riesgo/Bajo en ambos
        let groupAdaptados = 0; // Alto/Muy Alto en Intra pero Sin Riesgo/Bajo en Estrés

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

        // Get list of all departments in org for the dropdown filter (only if no department filter was applied so we have the full list)
        let departments: string[] = [];
        if (!department || department === "ALL") {
            departments = Array.from(new Set(results.map(r => r.assessment.worker.departmentArea).filter(Boolean))) as string[];
        }

        return NextResponse.json({
            privacyWarning: false,
            intralaboral: formatChartData(intralaboralRisk),
            extralaboral: formatChartData(extralaboralRisk),
            stress: formatChartData(stressRisk),
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
