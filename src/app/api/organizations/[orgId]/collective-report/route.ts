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
                    scoredResult: { select: { overallRiskCategory: true } },
                },
            },
        },
    });

    // Group by departmentArea (or "Sin área" if null)
    // For each area, count risk distribution across all questionnaire types
    const areaMap: Record<string, {
        area: string;
        workerCount: number;
        riskCounts: Record<string, number>;
    }> = {};

    const RISK_ORDER = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"];

    for (const worker of workers) {
        const area = worker.departmentArea || "Sin área";
        if (!areaMap[area]) {
            areaMap[area] = { area, workerCount: 0, riskCounts: Object.fromEntries(RISK_ORDER.map(k => [k, 0])) };
        }
        // Count this worker only once (use highest risk across assessments)
        const risks = worker.assessments
            .filter(a => a.scoredResult)
            .map(a => a.scoredResult!.overallRiskCategory as string);
        if (risks.length > 0) {
            areaMap[area].workerCount++;
            // Use the most severe risk for this worker
            const highest = RISK_ORDER.slice().reverse().find(r => risks.includes(r)) ?? risks[0];
            areaMap[area].riskCounts[highest] = (areaMap[area].riskCounts[highest] ?? 0) + 1;
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
        totalByRisk,
        generatedAt: new Date().toISOString(),
    });
}
