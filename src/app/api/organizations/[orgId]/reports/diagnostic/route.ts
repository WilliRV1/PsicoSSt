import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RiskCategory } from "@/generated/prisma/client";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Verify organization ownership/access
        const org = await prisma.organization.findFirst({
            where: {
                id: orgId,
                createdByPsychologist: session.user.id
            }
        });

        if (!org && !session.user.isAdmin) {
            return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
        }

        // 2. Fetch all signed assessments with their scored results and worker info
        const assessments = await prisma.assessment.findMany({
            where: {
                organizationId: orgId,
                status: "SIGNED"
            },
            include: {
                worker: {
                    select: {
                        departmentArea: true,
                        jobTitle: true,
                        jobLevel: true
                    }
                },
                scoredResult: true
            }
        });

        if (assessments.length === 0) {
            return NextResponse.json({
                summary: { totalAssessments: 0 },
                message: "No signed assessments found for this organization."
            });
        }

        // 3. Process Statistical Analysis
        const stats = {
            totalAssessments: assessments.length,
            riskDistribution: calculateDistribution(assessments, "total"),
            intralaboralDistribution: calculateDistribution(assessments, "intralaboral"),
            extralaboralDistribution: calculateDistribution(assessments, "extralaboral"),
            stressDistribution: calculateDistribution(assessments, "stress"),
            segmentation: {
                byArea: segmentByField(assessments, "departmentArea"),
                byJobTitle: segmentByField(assessments, "jobTitle")
            },
            correlation: calculateStressCorrelation(assessments)
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Diagnostic Report API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

function calculateDistribution(assessments: any[], type: "total" | "intralaboral" | "extralaboral" | "stress") {
    const distribution: Record<string, number> = {
        SIN_RIESGO: 0,
        BAJO: 0,
        MEDIO: 0,
        ALTO: 0,
        MUY_ALTO: 0
    };

    assessments.forEach(a => {
        let risk: RiskCategory | undefined;
        const res = a.scoredResult;
        if (!res) return;

        if (type === "total" && a.questionnaireType === "INTRALABORAL") {
            risk = res.overallRiskCategory;
        } else if (type === "intralaboral" && a.questionnaireType === "INTRALABORAL") {
            risk = res.overallRiskCategory;
        } else if (type === "extralaboral" && a.questionnaireType === "EXTRALABORAL") {
            risk = res.overallRiskCategory;
        } else if (type === "stress" && a.questionnaireType === "STRESS") {
            risk = res.overallRiskCategory;
        }

        if (risk && distribution[risk] !== undefined) {
            distribution[risk]++;
        }
    });

    // Convert to percentages
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total === 0) return distribution;

    const percentages: Record<string, number> = {};
    for (const key in distribution) {
        percentages[key] = Math.round((distribution[key] / total) * 100);
    }

    return percentages;
}

function segmentByField(assessments: any[], field: string) {
    const groups: Record<string, any[]> = {};

    assessments.forEach(a => {
        const val = a.worker[field] || "No especificado";
        if (!groups[val]) groups[val] = [];
        groups[val].push(a);
    });

    const result: Record<string, any> = {};
    const others: any[] = [];

    for (const groupName in groups) {
        if (groups[groupName].length >= 10) {
            result[groupName] = {
                count: groups[groupName].length,
                riskDistribution: calculateDistribution(groups[groupName], "total")
            };
        } else {
            others.push(...groups[groupName]);
        }
    }

    if (others.length > 0) {
        result["Otros (Grupos < 10)"] = {
            count: others.length,
            riskDistribution: calculateDistribution(others, "total")
        };
    }

    return result;
}

function calculateStressCorrelation(assessments: any[]) {
    // Stress vs Intralaboral Risk
    const correlation: Record<string, Record<string, number>> = {
        SIN_RIESGO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        BAJO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        MEDIO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        ALTO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        MUY_ALTO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 }
    };

    // We need to match workers who have BOTH Intralaboral and Stress
    const workerMap: Record<string, { intra?: RiskCategory, stress?: RiskCategory }> = {};

    assessments.forEach(a => {
        if (!workerMap[a.workerId]) workerMap[a.workerId] = {};
        if (a.questionnaireType === "INTRALABORAL") workerMap[a.workerId].intra = a.scoredResult?.overallRiskCategory;
        if (a.questionnaireType === "STRESS") workerMap[a.workerId].stress = a.scoredResult?.overallRiskCategory;
    });

    for (const workerId in workerMap) {
        const { intra, stress } = workerMap[workerId];
        if (intra && stress) {
            correlation[intra][stress]++;
        }
    }

    return correlation;
}
