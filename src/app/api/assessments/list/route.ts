import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/assessments/list
 * Lists assessments for the authenticated psychologist with optional filters.
 */
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const organizationId = searchParams.get("organizationId");
        const questionnaireType = searchParams.get("questionnaireType");
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
        const offset = (page - 1) * limit;

        // Build where clause
        const where: any = {
            psychologistId: session.user.id,
            status: "COMPLETED"
        };

        if (organizationId) where.organizationId = organizationId;
        if (questionnaireType) where.questionnaireType = questionnaireType;
        if (status) where.status = status;

        const [assessments, total] = await Promise.all([
            prisma.assessment.findMany({
                where,
                include: {
                    worker: {
                        select: {
                            id: true,
                            fullName: true,
                            documentId: true,
                            documentType: true,
                            jobTitle: true,
                            jobLevel: true
                        }
                    },
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            nit: true
                        }
                    },
                    scoredResult: {
                        select: {
                            overallRiskCategory: true,
                            totalScores: true,
                            dimensionScores: true,
                            domainScores: true
                        }
                    }
                },
                orderBy: { assessmentDate: "desc" },
                skip: offset,
                take: limit
            }),
            prisma.assessment.count({ where })
        ]);

        return NextResponse.json({
            data: assessments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("[ASSESSMENTS LIST] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
