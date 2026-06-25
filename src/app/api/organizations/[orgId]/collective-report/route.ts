import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, nit: true, city: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Get all scored assessments for this org
    const workers = await prisma.worker.findMany({
        where: { organizationId: orgId },
        select: {
            jobTitle: true,
            jobLevel: true,
            departmentArea: true,
            assessments: {
                where: {
                    psychologistId: session.user.id,
                    status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                },
                select: {
                    questionnaireType: true,
                    scoredResult: { select: { overallRiskCategory: true, dimensionScores: true, domainScores: true } },
                },
            },
        },
    });

    // Group by departmentArea (or "Sin área" if null) and jobTitle
    // For each, count risk distribution across all questionnaire types
    const areaMap: Record<string, {
        area: string;
        workerCount: number;
        riskCounts: Record<string, number>;
    }> = {};

    const jobTitleMap: Record<string, {
        jobTitle: string;
        workerCount: number;
        riskCounts: Record<string, number>;
    }> = {};

    const RISK_ORDER = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"];

    for (const worker of workers) {
        const area = worker.departmentArea || "Sin área";
        const jobTitle = worker.jobTitle || "Sin cargo";

        if (!areaMap[area]) {
            areaMap[area] = { area, workerCount: 0, riskCounts: Object.fromEntries(RISK_ORDER.map(k => [k, 0])) };
        }
        if (!jobTitleMap[jobTitle]) {
            jobTitleMap[jobTitle] = { jobTitle, workerCount: 0, riskCounts: Object.fromEntries(RISK_ORDER.map(k => [k, 0])) };
        }

        // Count this worker only once (use highest risk across assessments)
        const risks = worker.assessments
            .filter(a => a.scoredResult)
            .map(a => a.scoredResult!.overallRiskCategory as string);
        if (risks.length > 0) {
            // Use the most severe risk for this worker
            const highest = RISK_ORDER.slice().reverse().find(r => risks.includes(r)) ?? risks[0];
            
            areaMap[area].workerCount++;
            areaMap[area].riskCounts[highest] = (areaMap[area].riskCounts[highest] ?? 0) + 1;

            jobTitleMap[jobTitle].workerCount++;
            jobTitleMap[jobTitle].riskCounts[highest] = (jobTitleMap[jobTitle].riskCounts[highest] ?? 0) + 1;
        }
    }

    // New logic: Detailed breakdown by form type, domains, and dimensions
    const detailedBreakdown = {
        formA: { totalWorkers: 0, dimensions: {} as Record<string, Record<string, number>>, domains: {} as Record<string, Record<string, number>> },
        formB: { totalWorkers: 0, dimensions: {} as Record<string, Record<string, number>>, domains: {} as Record<string, Record<string, number>> },
        extralaboral: { totalWorkers: 0, dimensions: {} as Record<string, Record<string, number>>, domains: {} as Record<string, Record<string, number>> },
        stress: { totalWorkers: 0, riskCounts: Object.fromEntries(RISK_ORDER.map(k => [k, 0])) }
    };

    // Helper to safely aggregate
    const aggregateRisks = (source: Record<string, any>, targetBreakdown: any) => {
        if (!source || typeof source !== 'object') return;
        for (const [key, value] of Object.entries(source)) {
            const risk = value?.riskCategory;
            if (!risk) continue;
            if (!targetBreakdown[key]) targetBreakdown[key] = Object.fromEntries(RISK_ORDER.map(k => [k, 0]));
            if (targetBreakdown[key][risk] !== undefined) {
                targetBreakdown[key][risk]++;
            }
        }
    };

    for (const worker of workers) {
        for (const assessment of worker.assessments) {
            const result = assessment.scoredResult;
            if (!result) continue;

            const dimScores = result.dimensionScores as Record<string, any>;
            const domScores = result.domainScores as Record<string, any>;

            if (assessment.questionnaireType === "INTRALABORAL") {
                if (worker.jobLevel === "JEFATURA" || worker.jobLevel === "PROFESIONAL" || worker.jobLevel === "TECNICO") {
                    detailedBreakdown.formA.totalWorkers++;
                    aggregateRisks(dimScores, detailedBreakdown.formA.dimensions);
                    aggregateRisks(domScores, detailedBreakdown.formA.domains);
                } else {
                    detailedBreakdown.formB.totalWorkers++;
                    aggregateRisks(dimScores, detailedBreakdown.formB.dimensions);
                    aggregateRisks(domScores, detailedBreakdown.formB.domains);
                }
            } else if (assessment.questionnaireType === "EXTRALABORAL") {
                detailedBreakdown.extralaboral.totalWorkers++;
                aggregateRisks(dimScores, detailedBreakdown.extralaboral.dimensions);
                aggregateRisks(domScores, detailedBreakdown.extralaboral.domains);
            } else if (assessment.questionnaireType === "STRESS") {
                detailedBreakdown.stress.totalWorkers++;
                const risk = result.overallRiskCategory;
                if (detailedBreakdown.stress.riskCounts[risk] !== undefined) {
                    detailedBreakdown.stress.riskCounts[risk]++;
                }
            }
        }
    }

    // Overall totals
    const totalByRisk: Record<string, number> = Object.fromEntries(RISK_ORDER.map(k => [k, 0]));
    for (const entry of Object.values(areaMap)) {
        for (const [k, v] of Object.entries(entry.riskCounts)) {
            totalByRisk[k] = (totalByRisk[k] ?? 0) + v;
        }
    }

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: session.user.id },
        select: { fullName: true, licenseNumber: true, professionalCard: true },
    });

    return NextResponse.json({
        organization: { name: org.name, nit: org.nit, city: org.city },
        psychologist,
        areas: Object.values(areaMap),
        jobTitles: Object.values(jobTitleMap),
        totalByRisk,
        detailedBreakdown,
        generatedAt: new Date().toISOString(),
    });
}
