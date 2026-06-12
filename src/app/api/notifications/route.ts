import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Notification {
    id: string;
    type: "warning" | "info" | "urgent";
    title: string;
    description: string;
    href: string;
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ data: [] });
    }

    const psychId = session.user.id;
    const notifications: Notification[] = [];

    try {
        // 1. Pending signatures
        const pendingReports = await prisma.assessment.count({
            where: {
                psychologistId: psychId,
                status: { in: ["SCORED", "REVIEWED"] },
            },
        });

        if (pendingReports > 0) {
            notifications.push({
                id: "pending-sign",
                type: "info",
                title: `${pendingReports} reporte${pendingReports > 1 ? "s" : ""} sin firmar`,
                description: "Revisa y firma los reportes pendientes para completar el proceso.",
                href: "/dashboard/reports",
            });
        }

        // 2. Expiring workers (>18 months since last signed assessment)
        const EIGHTEEN_MONTHS_MS = 1.5 * 365.25 * 24 * 60 * 60 * 1000;
        const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        const workersWithAssessments = await prisma.worker.findMany({
            where: { organization: { createdByPsychologist: psychId } },
            select: {
                id: true,
                assessments: {
                    where: { psychologistId: psychId, status: "SIGNED" },
                    select: { assessmentDate: true },
                    orderBy: { assessmentDate: "desc" },
                    take: 1,
                },
            },
        });

        let expiredCount = 0;
        let expiringCount = 0;
        for (const w of workersWithAssessments) {
            const lastDate = w.assessments[0]?.assessmentDate;
            if (!lastDate) {
                expiredCount++;
            } else {
                const age = now - new Date(lastDate).getTime();
                if (age >= TWO_YEARS_MS) expiredCount++;
                else if (age >= EIGHTEEN_MONTHS_MS) expiringCount++;
            }
        }

        if (expiredCount > 0) {
            notifications.push({
                id: "expired-workers",
                type: "urgent",
                title: `${expiredCount} evaluaci${expiredCount > 1 ? "ones vencidas" : "ón vencida"}`,
                description: "Res. 2764/2022 exige reevaluación cada 2 años.",
                href: "/dashboard/workers?risk=",
            });
        }

        if (expiringCount > 0) {
            notifications.push({
                id: "expiring-workers",
                type: "warning",
                title: `${expiringCount} evaluaci${expiringCount > 1 ? "ones" : "ón"} por vencer`,
                description: "Trabajadores próximos a cumplir 2 años sin reevaluación.",
                href: "/dashboard/workers",
            });
        }

        // 3. High risk workers
        const highRiskCount = await prisma.worker.count({
            where: {
                assessments: {
                    some: {
                        psychologistId: psychId,
                        scoredResult: {
                            overallRiskCategory: { in: ["ALTO", "MUY_ALTO"] },
                        },
                    },
                },
            },
        });

        if (highRiskCount > 0) {
            notifications.push({
                id: "high-risk",
                type: "warning",
                title: `${highRiskCount} trabajador${highRiskCount > 1 ? "es" : ""} en riesgo alto`,
                description: "Requieren intervención prioritaria según la normativa.",
                href: "/dashboard/assessments?risk=ALTO",
            });
        }

        // 4. Admin: pending psychologist approvals
        if (session.user.isAdmin) {
            const pendingApprovals = await prisma.psychologist.count({
                where: { status: "PENDING" },
            });
            if (pendingApprovals > 0) {
                notifications.push({
                    id: "pending-approvals",
                    type: "info",
                    title: `${pendingApprovals} solicitud${pendingApprovals > 1 ? "es" : ""} de registro`,
                    description: "Psicólogos esperando aprobación de cuenta.",
                    href: "/dashboard/admin/psychologists/pending",
                });
            }
        }

        return NextResponse.json({ data: notifications });
    } catch (error) {
        console.error("[NOTIFICATIONS] Error:", error);
        return NextResponse.json({ data: [] });
    }
}
