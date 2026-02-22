import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

/**
 * GET — List all psychologists (admin only)
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.isAdmin) {
            return NextResponse.json(
                { error: "FORBIDDEN", message: "Acceso restringido a administradores" },
                { status: 403 }
            );
        }

        const psychologists = await prisma.psychologist.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                licenseNumber: true,
                professionalCard: true,
                sstCredential: true,
                status: true,
                isAdmin: true,
                mfaEnabled: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ data: psychologists });
    } catch (error) {
        console.error("[ADMIN_PSYCHOLOGISTS] GET Error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Error interno" },
            { status: 500 }
        );
    }
}

/**
 * PATCH — Update a psychologist's status (admin only)
 */
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.isAdmin) {
            return NextResponse.json(
                { error: "FORBIDDEN", message: "Acceso restringido a administradores" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { psychologistId, status } = body;

        if (!psychologistId || !status) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", message: "psychologistId y status son requeridos" },
                { status: 400 }
            );
        }

        const validStatuses = ["ACTIVE", "SUSPENDED", "INACTIVE"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", message: `Status inválido. Use: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        // Cannot modify own account
        if (psychologistId === session.user.id) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", message: "No puedes modificar tu propia cuenta" },
                { status: 400 }
            );
        }

        const target = await prisma.psychologist.findUnique({
            where: { id: psychologistId },
            select: { id: true, fullName: true, status: true },
        });

        if (!target) {
            return NextResponse.json(
                { error: "NOT_FOUND", message: "Psicólogo no encontrado" },
                { status: 404 }
            );
        }

        const previousStatus = target.status;

        await prisma.psychologist.update({
            where: { id: psychologistId },
            data: { status },
        });

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "UPDATE",
            resourceType: "psychologist",
            resourceId: psychologistId,
            metadata: { change: `Status: ${previousStatus} → ${status}` },
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            message: `Estado del psicólogo "${target.fullName}" actualizado a ${status}`,
            previousStatus,
            newStatus: status,
        });
    } catch (error) {
        console.error("[ADMIN_PSYCHOLOGISTS] PATCH Error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Error interno" },
            { status: 500 }
        );
    }
}
