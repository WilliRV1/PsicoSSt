import { prisma } from "@/lib/prisma";
import { scoreQuestionnaire } from "@/lib/scoring";
import {
    FormType,
    QuestionnaireType,
    ItemResponses,
    ScoredResultData
} from "@/types/battery";

export class AssessmentService {
    /**
     * Creates a new assessment, scores it, and saves it to the database.
     */
    static async createAssessment(data: {
        workerId: string;
        psychologistId: string;
        companyId: string;
        formType: FormType;
        questionnaireType: QuestionnaireType;
        assessmentDate: Date;
        responses: ItemResponses;
        occupationalGroup?: string;
        hasCustomerInteraction?: boolean;
        inputMethod?: "MANUAL" | "BULK";
        informedConsent?: {
            consentGranted: boolean;
            consentMethod: "VERBAL" | "WRITTEN" | "DIGITAL";
            consentText?: string;
        };
    }) {
        // 0. Validate response values are in range 0-4
        for (const [itemKey, value] of Object.entries(data.responses)) {
            if (typeof value !== "number" || value < 0 || value > 4 || !Number.isInteger(value)) {
                throw new Error(`Ítem ${itemKey}: valor inválido "${value}". Debe ser un entero entre 0 y 4.`);
            }
        }

        // 0.5 Fetch worker metadata for scoring logic (Filter Questions & Stress Baremos)
        const worker = await prisma.worker.findUnique({
            where: { id: data.workerId },
            select: {
                gender: true,
                jobLevel: true,
                hasCustomerInteraction: true
            }
        });

        if (!worker) throw new Error("Trabajador no encontrado");

        // Override worker profile if UI provided a different hasCustomerInteraction
        if (data.hasCustomerInteraction !== undefined && (worker as any).hasCustomerInteraction !== data.hasCustomerInteraction) {
            console.log("Updating worker hasCustomerInteraction to", data.hasCustomerInteraction);
            await prisma.worker.update({
                where: { id: data.workerId },
                data: { hasCustomerInteraction: data.hasCustomerInteraction }
            });
            (worker as any).hasCustomerInteraction = data.hasCustomerInteraction;
        }

        // 1. Calculate scores using the pure scoring engine
        console.log("Calculando puntajes para:", data.workerId);
        const scoredResult: ScoredResultData = scoreQuestionnaire(
            data.responses,
            data.formType,
            data.questionnaireType,
            {
                occupationalGroup: data.occupationalGroup,
                gender: (worker as any).gender || "F",
                jobLevel: (worker as any).jobLevel,
                hasCustomerInteraction: (worker as any).hasCustomerInteraction
            }
        );

        // 2. Save to database in a transaction
        try {
            return await prisma.$transaction(async (tx) => {
                console.log("Iniciando transacción de guardado...");
                // Create the Assessment record
                const assessment = await tx.assessment.create({
                    data: {
                        workerId: data.workerId,
                        psychologistId: data.psychologistId,
                        organizationId: data.companyId,
                        formType: data.formType,
                        questionnaireType: data.questionnaireType,
                        assessmentDate: data.assessmentDate,
                        status: "SIGNED", // Changed to SIGNED to enable immediate reporting
                        completedAt: new Date(),
                        inputMethod: data.inputMethod || "MANUAL",
                        // Create related response set
                        responseSet: {
                            create: {
                                responses: data.responses as any,
                                totalItems: Object.keys(data.responses).length,
                                isComplete: true,
                                submittedAt: new Date()
                            }
                        },
                        // Create related scored result
                        scoredResult: {
                            create: {
                                dimensionScores: scoredResult.dimensions as any,
                                domainScores: scoredResult.domains as any,
                                totalScores: scoredResult.total as any,
                                overallRiskCategory: scoredResult.total.riskCategory,
                                scoredAt: new Date()
                            }
                        }
                    }
                });

                // Create informed consent if provided
                if (data.informedConsent) {
                    await tx.informedConsent.create({
                        data: {
                            assessmentId: assessment.id,
                            workerId: data.workerId,
                            consentGranted: data.informedConsent.consentGranted,
                            consentMethod: data.informedConsent.consentMethod as any,
                            consentText: data.informedConsent.consentText || "Confirmación de consentimiento físico firmado.",
                            consentedAt: new Date()
                        }
                    });
                }

                // Log the creation
                await tx.auditLog.create({
                    data: {
                        userId: data.psychologistId,
                        action: "CREATE",
                        resourceType: "ASSESSMENT",
                        resourceId: assessment.id,
                        metadata: {
                            workerId: data.workerId,
                            formType: data.formType,
                            questionnaireType: data.questionnaireType,
                            consentGranted: data.informedConsent?.consentGranted || false
                        }
                    }
                });

                console.log("Evaluación guardada exitosamente:", assessment.id);
                return {
                    id: assessment.id,
                    result: scoredResult
                };
            });
        } catch (error: any) {
            console.error("Error DETALLADO en la transacción de Assessment:", error);
            throw new Error(`Error en base de datos: ${error.message}`);
        }
    }

    /**
     * Retrieves a list of assessments with basic info.
     */
    static async listAssessments(psychologistId: string) {
        return await prisma.assessment.findMany({
            where: { psychologistId },
            include: {
                worker: {
                    select: {
                        fullName: true,
                        documentId: true
                    }
                },
                organization: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    /**
     * Updates an existing assessment, recalculating scores using the strict scoring engine.
     */
    static async updateAssessment(assessmentId: string, psychologistId: string, newResponses: ItemResponses) {
        // 0. Validate response values are in range 0-4
        for (const [itemKey, value] of Object.entries(newResponses)) {
            if (typeof value !== "number" || value < 0 || value > 4 || !Number.isInteger(value)) {
                throw new Error(`Ítem ${itemKey}: valor inválido "${value}". Debe ser un entero entre 0 y 4.`);
            }
        }

        // 1. Fetch existing assessment to get metadata
        const existing = await prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: {
                worker: true,
                responseSet: true
            }
        });

        if (!existing) throw new Error("Evaluación no encontrada");
        // Extra check to ensure the psychologist editing it is the owner
        if (existing.psychologistId !== psychologistId) {
            throw new Error("No tienes permisos para editar esta evaluación");
        }

        // 2. Calculate scores using the pure scoring engine (NO MODIFICATIONS to the engine)
        console.log("Recalculando puntajes tras edición para:", existing.workerId);
        const scoredResult: ScoredResultData = scoreQuestionnaire(
            newResponses,
            existing.formType as FormType,
            existing.questionnaireType as QuestionnaireType,
            {
                occupationalGroup: existing.worker.jobLevel === "AUXILIAR" || existing.worker.jobLevel === "OPERATIVO" ? "auxiliares_operativos" : "jefes_profesionales_tecnicos",
                gender: (existing.worker as any).gender || "F",
                jobLevel: (existing.worker as any).jobLevel,
                hasCustomerInteraction: (existing.worker as any).hasCustomerInteraction
            }
        );

        // 3. Update database in a transaction
        try {
            return await prisma.$transaction(async (tx) => {
                // Update ResponseSet
                await tx.responseSet.update({
                    where: { assessmentId: assessmentId },
                    data: {
                        responses: newResponses as any,
                        totalItems: Object.keys(newResponses).length,
                        updatedAt: new Date()
                    }
                });

                // Update ScoredResult
                await tx.scoredResult.update({
                    where: { assessmentId: assessmentId },
                    data: {
                        dimensionScores: scoredResult.dimensions as any,
                        domainScores: scoredResult.domains as any,
                        totalScores: scoredResult.total as any,
                        overallRiskCategory: scoredResult.total.riskCategory,
                        scoredAt: new Date()
                    }
                });

                // Update Assessment timestamp
                const updatedAssessment = await tx.assessment.update({
                    where: { id: assessmentId },
                    data: {
                        updatedAt: new Date()
                    }
                });

                // Log the edit
                await tx.auditLog.create({
                    data: {
                        userId: psychologistId,
                        action: "UPDATE",
                        resourceType: "ASSESSMENT",
                        resourceId: assessmentId,
                        metadata: {
                            note: "Evaluación editada manualmente"
                        }
                    }
                });

                console.log("Evaluación editada y recalculada exitosamente:", assessmentId);
                return {
                    id: updatedAssessment.id,
                    result: scoredResult
                };
            });
        } catch (error: any) {
            console.error("Error DETALLADO al editar Assessment:", error);
            throw new Error(`Error en base de datos: ${error.message}`);
        }
    }
}

