import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const workers = await prisma.worker.findMany({
        where: { organizationId: orgId },
        select: {
            id: true,
            fullName: true,
            jobTitle: true,
            departmentArea: true,
            assessments: {
                where: {
                    psychologistId: session.user.id,
                    status: "SIGNED",
                },
                select: { assessmentDate: true, questionnaireType: true },
                orderBy: { assessmentDate: "desc" },
                take: 10,
            },
        },
        orderBy: { fullName: "asc" },
    });

    const now = new Date();
    const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;
    const ALERT_THRESHOLD_MS = 1.5 * 365.25 * 24 * 60 * 60 * 1000; // 18 months

    const results = workers
        .map(worker => {
            // Find the most recent signed assessment date (any type)
            const lastAssessment = worker.assessments[0];
            if (!lastAssessment) {
                return {
                    id: worker.id,
                    fullName: worker.fullName,
                    jobTitle: worker.jobTitle,
                    departmentArea: worker.departmentArea,
                    lastAssessmentDate: null,
                    expiresAt: null,
                    daysUntilExpiry: null,
                    status: "NEVER_ASSESSED" as const,
                };
            }

            const lastDate = new Date(lastAssessment.assessmentDate);
            const expiresAt = new Date(lastDate.getTime() + TWO_YEARS_MS);
            const msUntilExpiry = expiresAt.getTime() - now.getTime();
            const daysUntilExpiry = Math.floor(msUntilExpiry / (1000 * 60 * 60 * 24));

            let status: "EXPIRED" | "EXPIRING_SOON" | "OK";
            if (msUntilExpiry <= 0) {
                status = "EXPIRED";
            } else if (now.getTime() - lastDate.getTime() >= ALERT_THRESHOLD_MS) {
                status = "EXPIRING_SOON";
            } else {
                status = "OK";
            }

            return {
                id: worker.id,
                fullName: worker.fullName,
                jobTitle: worker.jobTitle,
                departmentArea: worker.departmentArea,
                lastAssessmentDate: lastDate.toISOString().slice(0, 10),
                expiresAt: expiresAt.toISOString().slice(0, 10),
                daysUntilExpiry,
                status,
            };
        })
        .filter(w => w.status !== "OK"); // Only return workers that need attention

    // Sort: EXPIRED first, then EXPIRING_SOON, then NEVER_ASSESSED
    const order: Record<string, number> = { EXPIRED: 0, EXPIRING_SOON: 1, NEVER_ASSESSED: 2 };
    results.sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));

    return NextResponse.json({ workers: results });
}
