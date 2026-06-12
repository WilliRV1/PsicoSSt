import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;

    // Verify ownership
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const [riskGroups, monthlyAssessments, statusCounts, workerRisks] = await Promise.all([
        // Risk distribution
        prisma.scoredResult.groupBy({
            by: ["overallRiskCategory"],
            _count: { overallRiskCategory: true },
            where: { assessment: { organizationId: orgId, psychologistId: session.user.id } },
        }),

        // Last 6 months evaluations by type
        prisma.assessment.findMany({
            where: {
                organizationId: orgId,
                psychologistId: session.user.id,
                status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                assessmentDate: { gte: sixMonthsAgo },
            },
            select: { assessmentDate: true, questionnaireType: true },
        }),

        // Status counts (signed vs pending)
        prisma.assessment.groupBy({
            by: ["status"],
            _count: { status: true },
            where: {
                organizationId: orgId,
                psychologistId: session.user.id,
                status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
            },
        }),

        // Workers with their latest assessment risk
        prisma.worker.findMany({
            where: { organizationId: orgId },
            select: {
                id: true,
                fullName: true,
                jobTitle: true,
                assessments: {
                    where: {
                        psychologistId: session.user.id,
                        status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                    },
                    select: {
                        id: true,
                        status: true,
                        questionnaireType: true,
                        assessmentDate: true,
                        scoredResult: { select: { overallRiskCategory: true } },
                    },
                    orderBy: { assessmentDate: "desc" },
                    take: 3,
                },
            },
            orderBy: { fullName: "asc" },
        }),
    ]);

    // Build monthly data (last 6 months)
    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        monthKeys.push(d.toISOString().slice(0, 7));
    }

    const monthlyMap: Record<string, { month: string; label: string; intralaboral: number; extralaboral: number; stress: number }> = {};
    for (const mk of monthKeys) {
        const [year, month] = mk.split("-");
        const label = new Date(parseInt(year), parseInt(month) - 1, 1)
            .toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
        monthlyMap[mk] = { month: mk, label, intralaboral: 0, extralaboral: 0, stress: 0 };
    }
    for (const a of monthlyAssessments) {
        const mk = new Date(a.assessmentDate).toISOString().slice(0, 7);
        if (monthlyMap[mk]) {
            const qt = a.questionnaireType as string;
            if (qt === "INTRALABORAL") monthlyMap[mk].intralaboral++;
            else if (qt === "EXTRALABORAL") monthlyMap[mk].extralaboral++;
            else if (qt === "STRESS") monthlyMap[mk].stress++;
        }
    }
    const monthlyData = monthKeys.map(mk => monthlyMap[mk]);

    // Status summary
    const signed = statusCounts.find(s => s.status === "SIGNED")?._count.status ?? 0;
    const pending = statusCounts
        .filter(s => s.status === "SCORED" || s.status === "REVIEWED")
        .reduce((sum, s) => sum + s._count.status, 0);
    const total = signed + pending;

    // Risk distribution
    const riskOrder = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"];
    const riskDistribution = riskOrder.map(key => {
        const found = riskGroups.find(g => g.overallRiskCategory === key);
        return { key, count: found?._count.overallRiskCategory ?? 0 };
    });

    // Predominant risk
    const predominantRisk = riskGroups.sort((a, b) => b._count.overallRiskCategory - a._count.overallRiskCategory)[0]?.overallRiskCategory ?? null;
    const criticalCount = riskGroups
        .filter(g => g.overallRiskCategory === "ALTO" || g.overallRiskCategory === "MUY_ALTO")
        .reduce((sum, g) => sum + g._count.overallRiskCategory, 0);

    return NextResponse.json({
        summary: { total, signed, pending, criticalCount },
        riskDistribution,
        monthlyData,
        predominantRisk,
        workers: workerRisks,
    });
}
