import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
        return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    try {
        const results = await prisma.scoredResult.findMany({
            where: {
                assessment: {
                    organizationId
                }
            },
            include: {
                worker: true,
                assessment: true
            }
        });

        // Agregaciones de Riesgo por Cuestionario
        const intralaboralRisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };
        const extralaboralRisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };
        const stressRisk = { "SIN_RIESGO": 0, "BAJO": 0, "MEDIO": 0, "ALTO": 0, "MUY_ALTO": 0 };

        results.forEach(res => {
            const risk = (res.totalRisk as any) || "SIN_RIESGO";
            if (res.questionnaireType === "INTRALABORAL") {
                intralaboralRisk[risk as keyof typeof intralaboralRisk]++;
            } else if (res.questionnaireType === "EXTRALABORAL") {
                extralaboralRisk[risk as keyof typeof extralaboralRisk]++;
            } else if (res.questionnaireType === "STRESS") {
                stressRisk[risk as keyof typeof stressRisk]++;
            }
        });

        const formatChartData = (data: Record<string, number>) => 
            Object.entries(data).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            intralaboral: formatChartData(intralaboralRisk),
            extralaboral: formatChartData(extralaboralRisk),
            stress: formatChartData(stressRisk),
            totalAssessments: results.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
