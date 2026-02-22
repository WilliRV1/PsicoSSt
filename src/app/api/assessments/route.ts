import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AssessmentService } from "@/lib/services/assessment-service";

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

        const result = await AssessmentService.createAssessment({
            workerId: data.workerId,
            psychologistId: session.user.id,
            companyId: data.organizationId,
            formType: data.formType,
            questionnaireType: data.questionnaireType,
            assessmentDate: new Date(data.assessmentDate || Date.now()),
            responses: data.responses,
            occupationalGroup: data.occupationalGroup,
            informedConsent: data.informedConsent
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Create assessment error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
