import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationInvitationLinkService } from "@/lib/services/organization-invitation-link-service";
import { FormType, QuestionnaireType } from "@/types/battery";

/**
 * GET — Devuelve el enlace activo (si existe) de una organización.
 */
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = request.nextUrl.searchParams.get("organizationId");
    if (!organizationId) {
        return NextResponse.json({ error: "organizationId es requerido" }, { status: 400 });
    }

    const link = await OrganizationInvitationLinkService.getActiveForOrganization(organizationId, session.user.id);
    return NextResponse.json({ data: link });
}

/**
 * POST — Crea (o rota, revocando el anterior) el enlace de autoservicio de
 * una organización.
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { organizationId, formType, plannedTypes } = body as {
            organizationId: string;
            formType: FormType;
            plannedTypes: QuestionnaireType[];
        };

        if (!organizationId || !formType || !Array.isArray(plannedTypes) || plannedTypes.length === 0) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
        }

        const org = await prisma.organization.findFirst({
            where: { id: organizationId, createdByPsychologist: session.user.id },
            select: { id: true },
        });
        if (!org) {
            return NextResponse.json({ error: "Organización no encontrada o no autorizada" }, { status: 404 });
        }

        const { token } = await OrganizationInvitationLinkService.create({
            psychologistId: session.user.id,
            organizationId,
            formType,
            plannedTypes,
        });

        const url = `${request.nextUrl.origin}/c/${token}`;
        return NextResponse.json({ url });
    } catch (error) {
        console.error("[ORGANIZATION_INVITATION_LINKS] POST error:", error);
        return NextResponse.json({ error: "Error técnico al crear el enlace" }, { status: 500 });
    }
}
