import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

/**
 * GET — List workers, optionally filtered by organization
 */
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const orgId = searchParams.get("organizationId");

        const where: any = {};
        if (orgId) {
            where.organizationId = orgId;
        }

        // Only show workers from organizations owned by this psychologist
        where.organization = { createdByPsychologist: session.user.id };

        const workers = await prisma.worker.findMany({
            where,
            include: {
                organization: {
                    select: { name: true, nit: true }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 100
        });

        return NextResponse.json({ data: workers });
    } catch (error) {
        console.error("[WORKERS] GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST — Create a new worker
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            documentType, documentId, fullName, educationLevel, profession, jobLevel, organizationId,
            gender, birthDate, birthYear, maritalStatus, jobTitle, 
            residenceCity, residenceDepartment, socioeconomicStratum,
            housingType, dependentsCount, freeTimeUsage, departmentArea, 
            lessThanOneYearInCompany, yearsInCompany,
            lessThanOneYearInPosition, yearsInPosition, 
            contractType, workSchedule, hoursPerDay, hoursPerWeek, paymentModality,
            workCity, workDepartment, transportMeans, displacementTime,
            hasCustomerInteraction
        } = body;

        if (!documentId || !fullName || !organizationId || !jobLevel || !educationLevel) {
            return NextResponse.json(
                { error: "Documento, nombre, nivel educativo, organización y nivel de cargo son obligatorios" },
                { status: 400 }
            );
        }

        // Validate organization belongs to this psychologist
        const org = await prisma.organization.findFirst({
            where: { id: organizationId, createdByPsychologist: session.user.id },
            select: { id: true }
        });

        if (!org) {
            return NextResponse.json(
                { error: "Organización no encontrada o no autorizada" },
                { status: 404 }
            );
        }

        // Validate enums
        const validDocTypes = ["CC", "CE", "TI", "PA", "OTHER"];
        if (documentType && !validDocTypes.includes(documentType)) {
            return NextResponse.json(
                { error: `Tipo de documento inválido. Use: ${validDocTypes.join(", ")}` },
                { status: 400 }
            );
        }

        const validJobLevels = ["JEFATURA", "PROFESIONAL", "TECNICO", "AUXILIAR", "OPERATIVO"];
        if (!validJobLevels.includes(jobLevel)) {
            return NextResponse.json(
                { error: `Nivel de cargo inválido. Use: ${validJobLevels.join(", ")}` },
                { status: 400 }
            );
        }

        // We removed enum validation for educationLevel and others since they are now generic Strings
        // to support the specific exact text options requested by the user.

        // Check for duplicate document in the same organization
        const existingWorker = await prisma.worker.findFirst({
            where: { documentId, organizationId },
            select: { id: true }
        });

        if (existingWorker) {
            return NextResponse.json(
                { error: "Ya existe un trabajador con este documento en esta organización" },
                { status: 409 }
            );
        }

        const worker = await (prisma.worker as any).create({
            data: {
                documentType: documentType || "CC",
                documentId,
                fullName,
                gender,
                birthDate: birthDate ? new Date(birthDate) : null,
                birthYear: birthYear ? parseInt(birthYear) : null,
                maritalStatus,
                educationLevel,
                profession,
                jobTitle,
                jobLevel,
                residenceCity,
                residenceDepartment,
                socioeconomicStratum: socioeconomicStratum ? String(socioeconomicStratum) : null,
                housingType,
                dependentsCount: dependentsCount !== undefined && dependentsCount !== null ? parseInt(dependentsCount) : null,
                freeTimeUsage: Array.isArray(freeTimeUsage) ? freeTimeUsage : [],
                departmentArea,
                lessThanOneYearInCompany: !!lessThanOneYearInCompany,
                yearsInCompany: yearsInCompany ? parseInt(yearsInCompany) : null,
                lessThanOneYearInPosition: !!lessThanOneYearInPosition,
                yearsInPosition: yearsInPosition ? parseInt(yearsInPosition) : null,
                contractType,
                workSchedule,
                hoursPerDay: hoursPerDay ? String(hoursPerDay) : null,
                hoursPerWeek: hoursPerWeek ? String(hoursPerWeek) : null,
                paymentModality,
                workCity,
                workDepartment,
                transportMeans,
                displacementTime: displacementTime ? parseInt(displacementTime) : null,
                hasCustomerInteraction: !!hasCustomerInteraction,
                organizationId
            }
        });

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "CREATE",
            resourceType: "worker",
            resourceId: worker.id,
            metadata: { documentId, fullName, organizationId },
            ipAddress,
            userAgent
        });

        return NextResponse.json({ data: worker }, { status: 201 });
    } catch (error) {
        console.error("[WORKERS] POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
