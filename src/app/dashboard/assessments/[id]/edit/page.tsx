import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import EditAssessmentForm from "./edit-form";
import type { DimensionScore, ItemResponses, TotalScore } from "@/types/battery";

export const metadata = {
    title: "Editar Evaluación | PsicoSST",
};

export default async function EditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/auth/login");
    }

    const { id } = await params;

    const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
            worker: true,
            responseSet: true,
            organization: true,
            scoredResult: true,
        }
    });

    if (!assessment) {
        notFound();
    }

    // Security check: Only the psychologist who created it can edit it
    if (assessment.psychologistId !== session.user.id) {
        redirect("/dashboard/assessments");
    }

    // Must have a response set to edit
    if (!assessment.responseSet || !assessment.responseSet.responses) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--color-risk-veryhigh-bg)" }}>
                    <svg className="w-8 h-8" style={{ color: "var(--color-risk-veryhigh-solid)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground">Evaluación sin respuestas</h2>
                <p className="text-text-secondary max-w-md">
                    Esta evaluación no tiene un conjunto de respuestas asociadas. No es posible editarla.
                </p>
            </div>
        );
    }

    // Build savedScore from the DB scoredResult
    const scoredResult = assessment.scoredResult;
    const totalScores = scoredResult?.totalScores as unknown as TotalScore | undefined;
    const dimensionScores = (scoredResult?.dimensionScores as unknown as Record<string, DimensionScore>) ?? {};

    const savedScore = {
        overallRiskCategory: scoredResult?.overallRiskCategory ?? "SIN_RIESGO",
        transformedScore: totalScores?.transformedScore ?? 0,
        dimensions: dimensionScores,
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] p-4 gap-4 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between flex-shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                            style={{ background: "var(--color-risk-medium-bg)", color: "var(--color-risk-medium-text)", borderColor: "var(--color-risk-medium-border)" }}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Modo Edición
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold text-foreground">
                        {assessment.worker.fullName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {assessment.organization.name} · {assessment.questionnaireType} · Forma {assessment.formType}
                    </p>
                </div>
                <p
                    className="text-xs text-muted-foreground rounded-lg px-3 py-2 max-w-xs text-right leading-relaxed border"
                    style={{ background: "var(--color-risk-medium-bg)", borderColor: "var(--color-risk-medium-border)" }}
                >
                    Solo se guardan las respuestas. El motor de calificación recalculará los riesgos automáticamente en el servidor.
                </p>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0">
                <EditAssessmentForm
                    workerId={assessment.workerId}
                    organizationId={assessment.organizationId}
                    hasCustomerInteraction={assessment.worker.hasCustomerInteraction}
                    initialAssessmentId={assessment.id}
                    initialFormType={assessment.formType}
                    initialQType={assessment.questionnaireType}
                    initialResponses={assessment.responseSet.responses as unknown as ItemResponses}
                    savedScore={savedScore}
                />
            </div>
        </div>
    );
}
