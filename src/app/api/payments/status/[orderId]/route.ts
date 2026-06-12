import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    const order = await prisma.paymentOrder.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            status: true,
            packageId: true,
            psychologistId: true,
            completedAt: true,
        },
    });

    if (!order || order.psychologistId !== session.user.id) {
        return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
        orderId: order.id,
        status: order.status,
        packageId: order.packageId,
        completedAt: order.completedAt,
    });
}
