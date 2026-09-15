import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssessmentInvitationService } from "@/lib/services/assessment-invitation-service";

const ERROR_STATUS: Record<string, number> = {
    INVITATION_NOT_FOUND: 404,
    INVITATION_CANCELLED: 410,
    INVITATION_EXPIRED: 410,
};

const ERROR_MESSAGE: Record<string, string> = {
    INVITATION_NOT_FOUND: "Este enlace no es válido.",
    INVITATION_CANCELLED: "Este enlace fue cancelado.",
    INVITATION_EXPIRED: "Este enlace venció. Pide a tu psicólogo(a) que te envíe uno nuevo.",
};

/**
 * Ruta pública (sin auth()): el trabajador diligencia sus propios
 * sociodemográficos, una sola vez, justo después de firmar el
 * consentimiento y antes de su primer cuestionario.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const body = await request.json();
        const workerId = await AssessmentInvitationService.resolveWorkerId(token);

        await prisma.worker.update({
            where: { id: workerId },
            data: {
                gender: body.gender || null,
                birthDate: body.birthDate ? new Date(body.birthDate) : null,
                maritalStatus: body.maritalStatus || null,
                educationLevel: body.educationLevel || null,
                profession: body.profession || null,
                residenceCity: body.residenceCity || null,
                residenceDepartment: body.residenceDepartment || null,
                socioeconomicStratum: body.socioeconomicStratum ? String(body.socioeconomicStratum) : null,
                housingType: body.housingType || null,
                dependentsCount:
                    body.dependentsCount !== undefined && body.dependentsCount !== null && body.dependentsCount !== ""
                        ? parseInt(body.dependentsCount)
                        : null,
                freeTimeUsage: Array.isArray(body.freeTimeUsage) ? body.freeTimeUsage : [],
                transportMeans: body.transportMeans || null,
                displacementTime:
                    body.displacementTime !== undefined && body.displacementTime !== null && body.displacementTime !== ""
                        ? parseInt(body.displacementTime)
                        : null,
                departmentArea: body.departmentArea || null,
                lessThanOneYearInCompany: !!body.lessThanOneYearInCompany,
                yearsInCompany:
                    body.yearsInCompany !== undefined && body.yearsInCompany !== null && body.yearsInCompany !== ""
                        ? parseInt(body.yearsInCompany)
                        : null,
                contractType: body.contractType || null,
                workSchedule: body.workSchedule || null,
                hoursPerDay: body.hoursPerDay ? String(body.hoursPerDay) : null,
                hoursPerWeek: body.hoursPerWeek ? String(body.hoursPerWeek) : null,
                paymentModality: body.paymentModality || null,
                workCity: body.workCity || null,
                workDepartment: body.workDepartment || null,
                sociodemographicsCompletedAt: new Date(),
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        const code = error?.message as string;
        const status = ERROR_STATUS[code] ?? 500;
        const message = ERROR_MESSAGE[code] ?? "Error técnico al guardar tus datos.";
        if (status === 500) console.error("[PUBLIC_INVITATIONS] sociodemographics error:", error);
        return NextResponse.json({ error: message, code }, { status });
    }
}
