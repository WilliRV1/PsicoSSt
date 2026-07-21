import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ManualForm from "../../new/manual/manual-form";

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
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Evaluación sin respuestas</h2>
                <p className="text-slate-500 max-w-md">
                    Esta evaluación no tiene un conjunto de respuestas asociadas o está corrupta. No es posible editarla.
                </p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modificar Evaluación Existente
                </h1>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                    Trabajador: <span className="font-semibold text-slate-700">{assessment.worker.fullName}</span> | 
                    Empresa: <span className="font-semibold text-slate-700">{assessment.organization.name}</span>
                </p>
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-bold mb-1">Modo Edición</p>
                        <p>Estás alterando las respuestas de una evaluación previamente guardada. El sistema recalculará los puntajes de riesgo automáticamente utilizando el motor pericial de PsicoSST al guardar los cambios.</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl shadow-lg border border-border bg-card">
                <ManualForm
                    workerId={assessment.workerId}
                    organizationId={assessment.organizationId}
                    hasCustomerInteraction={assessment.worker.hasCustomerInteraction}
                    initialAssessmentId={assessment.id}
                    initialFormType={assessment.formType as any}
                    initialQType={assessment.questionnaireType as any}
                    initialResponses={assessment.responseSet.responses as any}
                    onSuccess={() => {
                        // In Next.js client component we would typically router.push,
                        // but since onSuccess just receives the data, the client component
                        // will need to handle redirect, or we can just window.location
                        if (typeof window !== "undefined") {
                            window.location.href = "/dashboard/assessments";
                        }
                    }}
                />
            </div>
        </div>
    );
}
