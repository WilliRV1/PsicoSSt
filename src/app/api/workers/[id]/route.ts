import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const worker = await prisma.worker.findFirst({
            where: { id, organization: { createdByPsychologist: session.user.id } },
            include: {
                organization: {
                    select: { name: true }
                }
            }
        });

        if (!worker) {
            return NextResponse.json({ error: "Worker not found" }, { status: 404 });
        }

        return NextResponse.json(worker);
    } catch (error) {
        console.error("Get worker error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

/**
 * PUT — Update a worker
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const worker = await prisma.worker.findUnique({
            where: { id },
            include: {
                organization: {
                    select: { createdByPsychologist: true }
                }
            }
        });

        if (!worker) {
            return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
        }

        if (worker.organization.createdByPsychologist !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const {
            fullName, documentType, documentId, gender, birthDate, birthYear, maritalStatus,
            profession, jobTitle, jobLevel, educationLevel, departmentArea, 
            residenceCity, residenceDepartment, socioeconomicStratum, housingType,
            dependentsCount, workCity, workDepartment, freeTimeUsage, transportMeans,
            displacementTime, hasCustomerInteraction,
            lessThanOneYearInCompany, yearsInCompany, 
            lessThanOneYearInPosition, yearsInPosition, 
            contractType, workSchedule, hoursPerDay, hoursPerWeek, paymentModality
        } = body;

        if (!fullName) {
            return NextResponse.json(
                { error: "El nombre completo es obligatorio" },
                { status: 400 }
            );
        }

        const updated = await prisma.worker.update({
            where: { id },
            data: {
                fullName,
                documentType: documentType || undefined,
                documentId: documentId || undefined,
                gender: gender || null,
                birthDate: birthDate ? new Date(birthDate) : null,
                birthYear: birthYear ? parseInt(birthYear) : null,
                maritalStatus: maritalStatus || null,
                profession: profession || null,
                jobTitle: jobTitle || null,
                jobLevel: jobLevel || undefined,
                educationLevel: educationLevel || undefined,
                departmentArea: departmentArea || null,
                residenceCity: residenceCity || null,
                residenceDepartment: residenceDepartment || null,
                socioeconomicStratum: socioeconomicStratum ? String(socioeconomicStratum) : null,
                housingType: housingType || null,
                dependentsCount: dependentsCount !== undefined && dependentsCount !== null ? parseInt(dependentsCount) : null,
                workCity: workCity || null,
                workDepartment: workDepartment || null,
                freeTimeUsage: Array.isArray(freeTimeUsage) ? freeTimeUsage : undefined,
                transportMeans: transportMeans || null,
                displacementTime: displacementTime ? parseInt(displacementTime) : null,
                hasCustomerInteraction: hasCustomerInteraction !== undefined ? !!hasCustomerInteraction : undefined,
                lessThanOneYearInCompany: lessThanOneYearInCompany !== undefined ? !!lessThanOneYearInCompany : undefined,
                yearsInCompany: yearsInCompany ? parseInt(yearsInCompany) : null,
                lessThanOneYearInPosition: lessThanOneYearInPosition !== undefined ? !!lessThanOneYearInPosition : undefined,
                yearsInPosition: yearsInPosition ? parseInt(yearsInPosition) : null,
                contractType: contractType || null,
                workSchedule: workSchedule || null,
                hoursPerDay: hoursPerDay ? String(hoursPerDay) : null,
                hoursPerWeek: hoursPerWeek ? String(hoursPerWeek) : null,
                paymentModality: paymentModality || null,
            }
        });

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "UPDATE",
            resourceType: "worker",
            resourceId: id,
            metadata: { fullName },
            ipAddress,
            userAgent
        });

        return NextResponse.json({ data: updated });
    } catch (error) {
        console.error("[WORKERS] PUT Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * Estados de evaluación a partir de los cuales existe evidencia calificada.
 *
 * Mismo criterio que la guarda del DELETE de evaluaciones: desde que hay
 * puntuación, el resultado ya es un dato de salud ocupacional del trabajador.
 * AssessmentStatus no tiene DELIVERED —la entrega se marca sobre el informe,
 * no sobre la evaluación—, así que ese caso se cubre aparte con generatedReports.
 */
const SCORED_STATUSES = ["SCORED", "REVIEWED", "SIGNED"] as const;

/**
 * DELETE — Archiva un trabajador. Nunca lo borra.
 *
 * El Dec. 1072/2015 art. 2.2.4.6.13 obliga a conservar la evidencia del SG-SST
 * durante veinte años desde el cese de la relación laboral y a protegerla contra
 * pérdida. Esta ruta borraba en cascada consentimientos, respuestas, resultados
 * calificados, informes generados y la evaluación entera: un clic destruía la
 * única prueba de que la evaluación se hizo. Ahora el trabajador se archiva
 * (deja de listarse) y su evidencia queda intacta.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const worker = await prisma.worker.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                archivedAt: true,
                organization: { select: { createdByPsychologist: true } },
            },
        });

        if (!worker) {
            return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
        }

        if (worker.organization.createdByPsychologist !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const protectedAssessments = await prisma.assessment.count({
            where: {
                workerId: id,
                OR: [
                    { status: { in: [...SCORED_STATUSES] } },
                    {
                        generatedReports: {
                            some: {
                                OR: [
                                    { isFinalized: true },
                                    { status: { in: ["SIGNED", "DELIVERED"] } },
                                ],
                            },
                        },
                    },
                ],
            },
        });

        // Se archiva en los dos caminos. La diferencia es sólo qué se le
        // responde a quien pidió el borrado: con evidencia calificada hay que
        // decirle por qué no se borró, sin ella basta con confirmar el archivo.
        const archivedAt = worker.archivedAt ?? new Date();
        if (!worker.archivedAt) {
            await prisma.worker.update({ where: { id }, data: { archivedAt } });
        }

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "UPDATE",
            resourceType: "worker",
            resourceId: id,
            metadata: {
                operation: "ARCHIVE",
                fullName: worker.fullName,
                requestedDeletion: true,
                blocked: protectedAssessments > 0,
                blockedReason:
                    protectedAssessments > 0
                        ? "Dec. 1072/2015 art. 2.2.4.6.13: evidencia del SG-SST con retención de 20 años"
                        : null,
                protectedAssessments,
                alreadyArchived: !!worker.archivedAt,
            },
            ipAddress,
            userAgent,
        });

        if (protectedAssessments > 0) {
            return NextResponse.json(
                {
                    error:
                        "No se puede eliminar a este trabajador: tiene evaluaciones calificadas y " +
                        "la ley obliga a conservar esa evidencia durante 20 años (Decreto 1072 de " +
                        "2015, art. 2.2.4.6.13). El trabajador fue archivado en su lugar y ya no " +
                        "aparecerá en los listados.",
                    archived: true,
                    archivedAt,
                    protectedAssessments,
                },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            archived: true,
            archivedAt,
            message:
                "El trabajador fue archivado y ya no aparecerá en los listados. Su historial se " +
                "conserva como evidencia del SG-SST.",
        });
    } catch (error) {
        console.error("[WORKERS] DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
