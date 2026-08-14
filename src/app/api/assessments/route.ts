import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AssessmentService } from "@/lib/services/assessment-service";
import { CreditService } from "@/lib/services/credit-service";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await request.json();

        // Validation
        if (!data.workerId || !data.formType || !data.questionnaireType || !data.responses) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if this worker already has an assessment in the last 3 months.
        // If so, the extra batteries in the same cycle don't consume a credit.
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const { prisma } = await import("@/lib/prisma");
        const recentAssessmentsCount = await prisma.assessment.count({
            where: {
                workerId: data.workerId,
                createdAt: { gte: threeMonthsAgo },
            },
        });

        const isFirstAssessment = recentAssessmentsCount === 0;

        // Consume the credit BEFORE creating the assessment so that both
        // operations either succeed or fail together. consumeCredit is atomic
        // (read + decrement in a single DB transaction) which also prevents
        // the race condition where two concurrent requests both pass the
        // balance check and both get a free assessment.
        if (isFirstAssessment) {
            try {
                await CreditService.consumeCredit(session.user.id);
            } catch (creditError: any) {
                if (creditError.message === "INSUFFICIENT_CREDITS") {
                    return NextResponse.json(
                        { error: "No tienes créditos suficientes. Adquiere un paquete de créditos para continuar.", code: "INSUFFICIENT_CREDITS" },
                        { status: 402 }
                    );
                }
                throw creditError;
            }
        }

        let result: Awaited<ReturnType<typeof AssessmentService.createAssessment>>;
        try {
            result = await AssessmentService.createAssessment({
                workerId: data.workerId,
                psychologistId: session.user.id,
                companyId: data.organizationId,
                formType: data.formType,
                questionnaireType: data.questionnaireType,
                assessmentDate: new Date(data.assessmentDate || Date.now()),
                responses: data.responses,
                occupationalGroup: data.occupationalGroup,
                hasCustomerInteraction: data.hasCustomerInteraction,
                informedConsent: data.informedConsent,
            });
        } catch (assessmentError) {
            // Assessment creation failed after the credit was already consumed.
            // Refund it so the psychologist doesn't lose a credit.
            if (isFirstAssessment) {
                await CreditService.refundCredit(
                    session.user.id,
                    "Error al crear la evaluación"
                ).catch((refundErr) =>
                    console.error("[CREDITS] Refund failed after assessment error:", refundErr)
                );
            }
            throw assessmentError;
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("DETALLE ERROR API ASSESSMENTS:", error);
        return NextResponse.json({ 
            error: `Error técnico: ${error.message}`, 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
