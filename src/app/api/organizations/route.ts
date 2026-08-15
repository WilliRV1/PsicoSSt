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
                        workerId: true,
                        status: true,
                        assessmentDate: true,
                        scoredResult: { select: { overallRiskCategory: true } }
                    },
                    orderBy: { assessmentDate: "desc" }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const ONE_YEAR_MS  = 365.25 * 24 * 60 * 60 * 1000;
        const TWO_YEARS_MS = 2 * ONE_YEAR_MS;
        const now = Date.now();

        const enrichedOrgs = organizations.map(org => {
            const signed  = org.assessments.filter(a => a.status === "SIGNED");
            const pending = org.assessments.filter(a => a.status === "SCORED" || a.status === "REVIEWED");

            const evaluatedWorkerIds = new Set(signed.map(a => a.workerId));
            const criticalWorkerIds  = new Set(
                signed
                    .filter(a => ["ALTO", "MUY_ALTO"].includes(a.scoredResult?.overallRiskCategory ?? ""))
                    .map(a => a.workerId)
            );

            const evaluatedCount = evaluatedWorkerIds.size;
            const criticalCount  = criticalWorkerIds.size;
            const criticalPct    = evaluatedCount > 0 ? (criticalCount / evaluatedCount) * 100 : 0;

            const lastSigned = signed[0]?.assessmentDate ?? null;

            let complianceStatus: "vencida" | "por_vencer" | "sin_evaluar" | "vigente";
            let expiryDate: Date | null = null;
            let daysLeft: number | null = null;

            if (!lastSigned) {
                complianceStatus = "sin_evaluar";
            } else {
                const validityMs = criticalPct > 20 ? ONE_YEAR_MS : TWO_YEARS_MS;
                expiryDate = new Date(new Date(lastSigned).getTime() + validityMs);
                daysLeft = Math.floor((expiryDate.getTime() - now) / (1000 * 60 * 60 * 24));

                if (daysLeft < 0) complianceStatus = "vencida";
                else if (daysLeft <= 90) complianceStatus = "por_vencer";
                else complianceStatus = "vigente";
            }

            const lastActivity = org.assessments.length > 0 ? org.assessments[0].assessmentDate : org.createdAt;

            return {
                id: org.id,
                name: org.name,
                nit: org.nit,
                city: org.city,
                department: org.department,
                workersCount: org._count.workers,
                evaluationsCount: org._count.assessments,
                evaluatedWorkers: evaluatedCount,
                criticalWorkers: criticalCount,
                pendingSignatures: pending.length,
                complianceStatus,
                expiryDate,
                daysLeft,
                lastActivity,
                pendingInterventions: org._count.interventionPlans,
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

        // Colombian NIT format: 6–10 digits, dash, 1 check digit (e.g. 900123456-7)
        if (!/^\d{6,10}-\d$/.test(nit)) {
            return NextResponse.json(
                { error: "Formato de NIT inválido. Use el formato: 123456789-0" },
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
