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

        const worker = await prisma.worker.findUnique({
            where: { id: id },
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

        const worker = await (prisma.worker as any).findUnique({
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

        const updated = await (prisma.worker as any).update({
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
 * DELETE — Delete a worker (only if no assessments)
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

        const worker = await (prisma.worker as any).findUnique({
            where: { id },
            include: {
                organization: {
                    select: { createdByPsychologist: true }
                },
                _count: { select: { assessments: true } }
            }
        });

        if (!worker) {
            return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
        }

        if (worker.organization.createdByPsychologist !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        if (worker._count.assessments > 0) {
            // Eliminar todas las evaluaciones y datos relacionados en cascada
            const assessments = await (prisma.assessment as any).findMany({
                where: { workerId: id },
                select: { id: true }
            });
            const assessmentIds = assessments.map((a:any) => a.id);

            if (assessmentIds.length > 0) {
                await (prisma.informedConsent as any).deleteMany({ where: { assessmentId: { in: assessmentIds } } });
                await (prisma.report as any).deleteMany({ where: { assessmentId: { in: assessmentIds } } });
                await (prisma.responseSet as any).deleteMany({ where: { assessmentId: { in: assessmentIds } } });
                await (prisma.scoredResult as any).deleteMany({ where: { assessmentId: { in: assessmentIds } } });
                await (prisma.assessment as any).deleteMany({ where: { workerId: id } });
            }
        }

        await (prisma.worker as any).delete({ where: { id } });

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "DELETE",
            resourceType: "worker",
            resourceId: id,
            metadata: { fullName: worker.fullName },
            ipAddress,
            userAgent
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[WORKERS] DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
