import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AssessmentService } from "@/lib/services/assessment-service";
import { EntitlementError, assertCan, consumeUnit, refundUnit } from "@/lib/entitlements";
import { getErrorMessage } from "@/lib/utils";

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

        // Una unidad por trabajador, familia de instrumento y periodo de
        // suscripción, descontada atómicamente antes de crear la evaluación.
        let unitConsumed = false;
        try {
            await assertCan(session.user.id, "CREATE_ASSESSMENT");
            if (data.questionnaireType === "CLIMA") {
                await assertCan(session.user.id, "USE_CLIMA");
            }
            const { consumed } = await consumeUnit(session.user.id, {
                workerId: data.workerId,
                questionnaireType: data.questionnaireType,
            });
            unitConsumed = consumed;
        } catch (entitlementError: unknown) {
            if (entitlementError instanceof EntitlementError) {
                return NextResponse.json(
                    { error: entitlementError.message, code: entitlementError.code },
                    { status: entitlementError.status }
                );
            }
            throw entitlementError;
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
            // La evaluación falló después de descontar la unidad: se anula el
            // consumo para que el psicólogo no la pierda.
            if (unitConsumed) {
                await refundUnit(session.user.id, {
                    workerId: data.workerId,
                    questionnaireType: data.questionnaireType,
                    reason: "Error al crear la evaluación",
                }).catch((refundErr) =>
                    console.error("[UNITS] Refund failed after assessment error:", refundErr)
                );
            }
            throw assessmentError;
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("DETALLE ERROR API ASSESSMENTS:", error);
        return NextResponse.json({ 
            error: `Error técnico: ${getErrorMessage(error)}`, 
            details: getErrorMessage(error),
            stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
