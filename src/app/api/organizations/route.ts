import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

/**
 * GET — List organizations for the current psychologist
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const organizations = await prisma.organization.findMany({
            where: { createdByPsychologist: session.user.id },
            include: {
                _count: { select: { workers: true, assessments: true, interventionPlans: true } },
                assessments: {
                    select: {
                        assessmentDate: true,
                        scoredResult: { select: { overallRiskCategory: true } }
                    },
                    orderBy: { assessmentDate: "desc" }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const enrichedOrgs = organizations.map(org => {
            const totalAssessments = org.assessments.length;
            const highRiskCount = org.assessments.filter(a => 
                a.scoredResult?.overallRiskCategory === "ALTO" || 
                a.scoredResult?.overallRiskCategory === "MUY_ALTO"
            ).length;

            // Health Score calculation (simplified for demo: 100% minus the percentage of high risk)
            const healthScore = totalAssessments === 0 ? 100 : Math.max(0, Math.round(100 - (highRiskCount / totalAssessments) * 100));
            
            // Simulated trend (could be calculated comparing with previous month)
            const trendValue = healthScore > 80 ? 5 : (healthScore > 50 ? -2 : -10);
            const trendLabel = trendValue > 0 ? `+${trendValue}` : `${trendValue}`;
            const trendDirection = trendValue > 0 ? "up" : (trendValue < 0 ? "down" : "flat");
            let healthLabel = "Excelente";
            if (healthScore <= 80 && healthScore > 50) healthLabel = "Atención";
            if (healthScore <= 50) healthLabel = "Crítico";

            const lastActivity = org.assessments.length > 0 ? org.assessments[0].assessmentDate : org.createdAt;

            return {
                id: org.id,
                name: org.name,
                nit: org.nit,
                city: org.city,
                department: org.department,
                workersCount: org._count.workers,
                evaluationsCount: org._count.assessments,
                healthScore,
                healthLabel,
                trend: trendLabel,
                trendDirection,
                lastActivity,
                pendingInterventions: org._count.interventionPlans,
                highRiskCount
            };
        });

        return NextResponse.json({ data: enrichedOrgs });
    } catch (error) {
        console.error("[ORGANIZATIONS] GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST — Create a new organization
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, nit, economicSector, city, department, employeeCount } = body;

        if (!name || !nit) {
            return NextResponse.json(
                { error: "El nombre y NIT son obligatorios" },
                { status: 400 }
            );
        }

        // Check if NIT already exists
        const existing = await prisma.organization.findUnique({
            where: { nit },
            select: { id: true }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Ya existe una organización con este NIT" },
                { status: 409 }
            );
        }

        const organization = await prisma.organization.create({
            data: {
                name,
                nit,
                economicSector: economicSector || null,
                city: city || null,
                department: department || null,
                employeeCount: employeeCount ? parseInt(employeeCount) : null,
                createdByPsychologist: session.user.id
            }
        });

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "CREATE",
            resourceType: "organization",
            resourceId: organization.id,
            metadata: { name, nit },
            ipAddress,
            userAgent
        });

        return NextResponse.json({ data: organization }, { status: 201 });
    } catch (error) {
        console.error("[ORGANIZATIONS] POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
