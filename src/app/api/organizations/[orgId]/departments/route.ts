import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await params;

        // Verify organization access
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { createdByPsychologist: true }
        });

        if (!org || org.createdByPsychologist !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch distinct departments
        const depts = await prisma.worker.findMany({
            where: { organizationId: orgId },
            select: { departmentArea: true },
            distinct: ["departmentArea"],
            orderBy: { departmentArea: "asc" }
        });

        // Fetch distinct job titles
        const jobs = await prisma.worker.findMany({
            where: { organizationId: orgId },
            select: { jobTitle: true },
            distinct: ["jobTitle"],
            orderBy: { jobTitle: "asc" }
        });

        const departments = depts
            .map(w => w.departmentArea)
            .filter(Boolean) as string[];

        const jobTitles = jobs
            .map(w => w.jobTitle)
            .filter(Boolean) as string[];

        return NextResponse.json({ departments, jobTitles });
    } catch (error) {
        console.error("Error fetching departments:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
