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
                _count: {
                    select: {
                        assessments: true,
                        // InterventionPlan y AssessmentReport declaran
                        // onDelete: Cascade contra Organization, y
                        // InterventionAction hace lo propio contra el plan. Con
                        // la guarda anterior —sólo evaluaciones— bastaba con
                        // que una empresa no tuviera ninguna evaluación
                        // registrada para que el borrado arrastrara en silencio
                        // su plan de intervención completo, sus acciones y su
                        // informe de triangulación, todos evidencia del SG-SST
                        // con retención de 20 años (Dec. 1072/2015 art.
                        // 2.2.4.6.13). Un plan de intervención se formula a
                        // partir de resultados que pueden haberse cargado en
                        // otra empresa o migrado, así que "cero evaluaciones"
                        // nunca implicó "cero evidencia".
                        interventionPlans: true,
                        assessmentReports: true,
                    }
                }
            }
        });

        if (!organization) {
            return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
        }

        if (organization.createdByPsychologist !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Un trabajador archivado se archivó justamente porque su evidencia no
        // podía destruirse; borrar la empresa lo borraría a él. Es el segundo
        // camino que quedaba abierto hacia el mismo daño.
        const archivedWorkers = await prisma.worker.count({
            where: { organizationId: orgId, archivedAt: { not: null } }
        });

        const blockers: string[] = [];
        if (organization._count.assessments > 0) blockers.push("evaluaciones");
        if (organization._count.interventionPlans > 0) blockers.push("planes de intervención");
        if (organization._count.assessmentReports > 0) blockers.push("informes de triangulación");
        if (archivedWorkers > 0) blockers.push("trabajadores archivados");

        if (blockers.length > 0) {
            return NextResponse.json(
                {
                    error:
                        `No se puede eliminar: la empresa tiene ${blockers.join(", ")} y esa ` +
                        "evidencia debe conservarse 20 años (Decreto 1072 de 2015, art. 2.2.4.6.13).",
                    blockers,
                },
                { status: 409 }
            );
        }

        // Delete workers first (no cascade configured in schema). Llegados aquí
        // no hay evaluaciones, ni consentimientos —cuelgan de una evaluación—,
        // ni trabajadores archivados: no se destruye evidencia.
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
