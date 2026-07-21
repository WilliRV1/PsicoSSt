import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AssessmentService } from "@/lib/services/assessment-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const department = searchParams.get("department");

    if (!orgId) {
        return NextResponse.json({ error: "Se requiere el ID de la organización" }, { status: 400 });
    }

    try {
        const organization = await prisma.organization.findUnique({
            where: { id: orgId }
        });

        if (!organization) {
            return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
        }
        
        if (organization.psychologistId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const data = await AssessmentService.getOrganizationalReportData(orgId, department || undefined);

        if (data.isRestricted) {
            return NextResponse.json(data, { status: 403 });
        }

        // Fetch AI recommendations if any exist as draft
        const plan = await prisma.interventionPlan.findFirst({ where: { organizationId: orgId }, include: { actions: true } });
        const action = plan?.actions.find(a => a.measure.startsWith('Recomendaciones AI:'));
        if (action && action.notes) {
            (data as any).recommendations = action.notes;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error generating organizational report data:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
