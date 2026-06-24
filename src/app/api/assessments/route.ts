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

        // Check credit balance before creating assessment
        const hasCredits = await CreditService.hasCredits(session.user.id);
        if (!hasCredits) {
            return NextResponse.json(
                { error: "No tienes créditos suficientes. Adquiere un paquete de créditos para continuar.", code: "INSUFFICIENT_CREDITS" },
                { status: 402 }
            );
        }

        const result = await AssessmentService.createAssessment({
            workerId: data.workerId,
            psychologistId: session.user.id,
            companyId: data.organizationId,
            formType: data.formType,
            questionnaireType: data.questionnaireType,
            assessmentDate: new Date(data.assessmentDate || Date.now()),
            responses: data.responses,
            occupationalGroup: data.occupationalGroup,
            hasCustomerInteraction: data.hasCustomerInteraction,
            informedConsent: data.informedConsent
        });

        // Consume 1 credit after successful assessment creation
        try {
            await CreditService.consumeCredit(session.user.id, result.id);
        } catch (creditError) {
            console.error("[CREDITS] Failed to consume credit:", creditError);
            // Assessment was created successfully, don't fail the request
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
