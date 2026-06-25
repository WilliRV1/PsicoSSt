import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify organization access
        const org = await prisma.organization.findUnique({
            where: { id },
            select: { createdByPsychologist: true }
        });

        if (!org || org.createdByPsychologist !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch distinct departments
        const workers = await prisma.worker.findMany({
            where: { 
                organizationId: id,
                departmentArea: { not: null, not: "" }
            },
            select: { departmentArea: true },
            distinct: ["departmentArea"],
            orderBy: { departmentArea: "asc" }
        });

        const departments = workers
            .map(w => w.departmentArea)
            .filter(Boolean) as string[];

        return NextResponse.json({ departments });
    } catch (error) {
        console.error("Error fetching departments:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
