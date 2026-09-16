import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/config/plans";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

/**
 * Asignación manual de un plan por un administrador: transferencia bancaria,
 * cortesía, piloto. El cobro en línea pasa por /api/payments; esto es la vía
 * para todo lo que no.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const admin = await prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, isAdmin: true, status: true },
        });
        if (!admin?.isAdmin || admin.status !== "ACTIVE") {
            return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
        }

        const body = await req.json();
        const psychologistId = typeof body.psychologistId === "string" ? body.psychologistId : null;
        const plan = typeof body.plan === "string" && body.plan in PLANS ? (body.plan as PlanId) : null;
        const days = Number.parseInt(String(body.days ?? PLANS[plan ?? "PROFESIONAL"].periodDays), 10);

        if (!psychologistId || !plan || !Number.isFinite(days) || days <= 0 || days > 3660) {
            return NextResponse.json(
                { error: "Se requieren psychologistId, plan (RESIDENTE | PROFESIONAL) y días (1-3660)" },
                { status: 400 }
            );
        }

        const target = await prisma.psychologist.findUnique({
            where: { id: psychologistId },
            select: { fullName: true },
        });
        if (!target) {
            return NextResponse.json({ error: "Psychologist not found" }, { status: 404 });
        }

        const previous = await SubscriptionService.getCurrent(psychologistId);
        const subscription = await SubscriptionService.adminAssign({
            psychologistId,
            plan,
            days,
            actorEmail: admin.email,
        });

        const { ipAddress, userAgent } = extractRequestMeta(req);
        await logAudit({
            userId: admin.id,
            action: "UPDATE",
            resourceType: "Subscription",
            resourceId: subscription.id,
            metadata: {
                event: "ADMIN_PLAN_ASSIGNED",
                psychologistId,
                plan,
                days,
                previousPlan: previous?.plan ?? null,
                previousStatus: previous?.status ?? null,
                previousPeriodEnd: previous?.periodEnd ?? null,
            },
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            message: `Plan ${PLANS[plan].name} asignado a ${target.fullName} por ${days} días`,
            subscription,
        });
    } catch (error) {
        console.error("POST /api/admin/subscriptions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
