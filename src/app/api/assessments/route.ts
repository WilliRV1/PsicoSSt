import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AssessmentService } from "@/lib/services/assessment-service";
import { CreditService } from "@/lib/services/credit-service";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

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

        // consumeCreditForAssessment atomically checks whether this worker
        // already has an assessment in the last 3 months AND deducts 1 credit
        // if it is the first one — all inside a single DB transaction.
        // This prevents the race condition where two concurrent requests for
        // the same worker both see count=0 and both consume a credit.
        let creditConsumed = false;
        try {
            const { consumed } = await CreditService.consumeCreditForAssessment(
                session.user.id,
                data.workerId
            );
            creditConsumed = consumed;
        } catch (creditError: any) {
            if (creditError.message === "INSUFFICIENT_CREDITS") {
                return NextResponse.json(
                    { error: "No tienes créditos suficientes. Adquiere un paquete de créditos para continuar.", code: "INSUFFICIENT_CREDITS" },
                    { status: 402 }
                );
            }
            throw creditError;
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
                hasPeopleInCharge: data.hasPeopleInCharge,
                informedConsent: data.informedConsent,
            });
        } catch (assessmentError) {
            // Assessment creation failed after the credit was already consumed.
            // Refund it so the psychologist doesn't lose a credit.
            if (creditConsumed) {
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
