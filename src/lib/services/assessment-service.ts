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

        // 1. Calculate scores using the pure scoring engine
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
        return await prisma.$transaction(async (tx) => {
            // Create the Assessment record
            const assessment = await tx.assessment.create({
                data: {
                    workerId: data.workerId,
                    psychologistId: data.psychologistId,
                    organizationId: data.companyId,
                    formType: data.formType,
                    questionnaireType: data.questionnaireType,
                    assessmentDate: data.assessmentDate,
                    status: "COMPLETED",
                    completedAt: data.assessmentDate,
                    inputMethod: data.inputMethod || "MANUAL",
                    // Create related response set
                    responseSet: {
                        create: {
                            responses: data.responses as any,
                            totalItems: Object.keys(data.responses).length,
                            isComplete: true,
                            submittedAt: data.assessmentDate
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
                        consentedAt: data.assessmentDate
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

            return {
                id: assessment.id,
                result: scoredResult
            };
        });
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
}
