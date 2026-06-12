import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

/**
 * PUT — Update an organization
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { orgId } = await params;

        const organization = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { id: true, createdByPsychologist: true }
        });

        if (!organization) {
            return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
        }

        if (organization.createdByPsychologist !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const {
            name, nit, economicSector, city, department,
            employeeCount, contactName, contactEmail
        } = body;

        if (!name || !nit) {
            return NextResponse.json(
                { error: "El nombre y NIT son obligatorios" },
                { status: 400 }
            );
        }

        const updated = await prisma.organization.update({
            where: { id: orgId },
            data: {
                name,
                nit,
                economicSector: economicSector || null,
                city: city || null,
                department: department || null,
                employeeCount: employeeCount ? parseInt(employeeCount) : null,
                contactName: contactName || null,
                contactEmail: contactEmail || null,
            }
        });

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "UPDATE",
            resourceType: "organization",
            resourceId: orgId,
            metadata: { name, nit },
            ipAddress,
            userAgent
        });

        return NextResponse.json({ data: updated });
    } catch (error) {
        console.error("[ORGANIZATIONS] PUT Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE — Delete an organization (only if no assessments)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { orgId } = await params;

        const organization = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                createdByPsychologist: true,
                _count: { select: { assessments: true } }
            }
        });

        if (!organization) {
            return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
        }

        if (organization.createdByPsychologist !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        if (organization._count.assessments > 0) {
            return NextResponse.json(
                { error: "No se puede eliminar: la empresa tiene evaluaciones registradas" },
                { status: 409 }
            );
        }

        // Delete workers first (no cascade configured in schema)
        await prisma.worker.deleteMany({ where: { organizationId: orgId } });
        await prisma.organization.delete({ where: { id: orgId } });

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "DELETE",
            resourceType: "organization",
            resourceId: orgId,
            metadata: { name: organization.name },
            ipAddress,
            userAgent
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ORGANIZATIONS] DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
