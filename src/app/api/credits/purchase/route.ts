import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CreditService } from "@/lib/services/credit-service";
import { getPackageById } from "@/config/credit-packages";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { packageId, paymentRef } = body;

        if (!packageId) {
            return NextResponse.json(
                { error: "Se requiere el ID del paquete" },
                { status: 400 }
            );
        }

        const pkg = getPackageById(packageId);
        if (!pkg) {
            return NextResponse.json(
                { error: "Paquete no encontrado" },
                { status: 404 }
            );
        }

        const result = await CreditService.purchasePackage(
            session.user.id,
            packageId,
            paymentRef
        );

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "CREDIT_PURCHASE",
            resourceType: "credit_transaction",
            resourceId: result.transactionId,
            metadata: {
                packageId: pkg.id,
                packageName: pkg.name,
                credits: pkg.credits,
                priceCOP: pkg.priceCOP,
                paymentRef,
            },
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            message: `${pkg.credits} créditos agregados exitosamente`,
            balance: result.balance,
            transactionId: result.transactionId,
        });
    } catch (error) {
        console.error("[CREDITS] Purchase Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
