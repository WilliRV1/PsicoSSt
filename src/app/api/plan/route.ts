import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PLANS } from "@/config/plans";
import { getEntitlements } from "@/lib/entitlements";
import { SubscriptionService } from "@/lib/services/subscription-service";

/** Estado comercial de la cuenta para el panel y el badge del shell. */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [entitlements, subscription] = await Promise.all([
            getEntitlements(session.user.id),
            SubscriptionService.getCurrent(session.user.id),
        ]);

        if (!entitlements || !subscription) {
            return NextResponse.json({ plan: null });
        }

        const now = Date.now();
        const daysLeft = Math.ceil((subscription.periodEnd.getTime() - now) / (24 * 60 * 60 * 1000));

        return NextResponse.json({
            plan: entitlements.plan,
            planName: PLANS[entitlements.plan].name,
            billingPeriod: entitlements.billingPeriod,
            status: entitlements.status,
            periodStart: subscription.periodStart,
            periodEnd: subscription.periodEnd,
            daysLeft,
            writable: entitlements.writable,
            unitsAvailable: entitlements.unitsAvailable,
            quotaGranted: subscription.quotaGranted,
            orgLimit: entitlements.orgLimit,
            orgCount: entitlements.orgCount,
            draftReports: entitlements.draftReports,
            canImport: entitlements.canImport,
            canUseClima: entitlements.canUseClima,
            features: entitlements.features,
        });
    } catch (error) {
        console.error("[PLAN] GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
