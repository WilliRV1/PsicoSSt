import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

/**
 * GET — List organizations for the current psychologist
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const organizations = await prisma.organization.findMany({
            where: { createdByPsychologist: session.user.id },
            include: {
                _count: { select: { workers: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ data: organizations });
    } catch (error) {
        console.error("[ORGANIZATIONS] GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST — Create a new organization
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, nit, economicSector, city, department, employeeCount } = body;

        if (!name || !nit) {
            return NextResponse.json(
                { error: "El nombre y NIT son obligatorios" },
                { status: 400 }
            );
        }

        // Check if NIT already exists
        const existing = await prisma.organization.findUnique({
            where: { nit },
            select: { id: true }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Ya existe una organización con este NIT" },
                { status: 409 }
            );
        }

        const organization = await prisma.organization.create({
            data: {
                name,
                nit,
                economicSector: economicSector || null,
                city: city || null,
                department: department || null,
                employeeCount: employeeCount ? parseInt(employeeCount) : null,
                createdByPsychologist: session.user.id
            }
        });

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "CREATE",
            resourceType: "organization",
            resourceId: organization.id,
            metadata: { name, nit },
            ipAddress,
            userAgent
        });

        return NextResponse.json({ data: organization }, { status: 201 });
    } catch (error) {
        console.error("[ORGANIZATIONS] POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
