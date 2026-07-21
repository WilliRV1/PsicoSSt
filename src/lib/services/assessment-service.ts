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

    /**
     * Consolidates organizational report data, ensuring exact thresholds and privacy constraints (N<5).
     */
    static async getOrganizationalReportData(organizationId: string, departmentArea?: string) {
        const { baremos } = await import("@/config/battery");
        const orgInfo = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: { psychologist: true }
        });
        
        if (!orgInfo) throw new Error("Organización no encontrada");

        const whereClause: any = { organizationId, status: { in: ["COMPLETED", "SCORED", "SIGNED"] } };
        if (departmentArea && departmentArea !== "ALL") {
            whereClause.worker = { departmentArea };
        }

        const results = await prisma.scoredResult.findMany({
            where: { assessment: whereClause },
            include: {
                assessment: {
                    include: { worker: true }
                }
            }
        });

        // 1. Algoritmo de Anonimato Inquebrantable
        const uniqueWorkers = new Set(results.map(r => r.assessment.workerId));
        const workerCount = uniqueWorkers.size;
        
        if (workerCount < 5 && workerCount > 0) {
            return {
                isRestricted: true,
                workerCount,
                message: "Reserva de Información por Muestra Insuficiente (N<5)."
            };
        }

        if (workerCount === 0) {
            throw new Error("No hay evaluaciones completadas para consolidar.");
        }

        // Estructuras de promedios
        let totalScoreA = 0;
        let countA = 0;
        let totalScoreB = 0;
        let countB = 0;

        const domainSumsA: Record<string, { sum: number, count: number }> = {};
        const domainSumsB: Record<string, { sum: number, count: number }> = {};
        
        // Estructura para Pirámide de Riesgo por Áreas
        const areaRisks: Record<string, { total: number, muyAlto: number }> = {};
        
        // Matriz de Priorización
        const workerMatrix = new Map<string, { intra: string | null, stress: string | null }>();

        results.forEach(res => {
            const risk = res.overallRiskCategory || "SIN_RIESGO";
            const type = res.assessment.questionnaireType;
            const form = res.assessment.formType;
            const worker = res.assessment.worker;
            const workerId = worker.id;

            if (!workerMatrix.has(workerId)) {
                workerMatrix.set(workerId, { intra: null, stress: null });
            }
            const w = workerMatrix.get(workerId)!;

            if (type === "INTRALABORAL") {
                w.intra = risk;
                
                // Pirámide de áreas
                const area = worker.departmentArea || "Sin Área";
                if (!areaRisks[area]) areaRisks[area] = { total: 0, muyAlto: 0 };
                areaRisks[area].total++;
                if (risk === "MUY_ALTO") areaRisks[area].muyAlto++;

                // Promedios por Forma (Usando Puntaje Transformado Directo)
                const totalScore = (res.totalScores as any)?.transformedScore || 0;
                if (form === "A") {
                    totalScoreA += totalScore;
                    countA++;
                    if (res.domainScores) {
                        Object.values(res.domainScores as Record<string, any>).forEach((dom: any) => {
                            if (!dom.domainKey) return;
                            if (!domainSumsA[dom.domainKey]) domainSumsA[dom.domainKey] = { sum: 0, count: 0 };
                            domainSumsA[dom.domainKey].sum += dom.transformedScore || 0;
                            domainSumsA[dom.domainKey].count++;
                        });
                    }
                } else {
                    totalScoreB += totalScore;
                    countB++;
                    if (res.domainScores) {
                        Object.values(res.domainScores as Record<string, any>).forEach((dom: any) => {
                            if (!dom.domainKey) return;
                            if (!domainSumsB[dom.domainKey]) domainSumsB[dom.domainKey] = { sum: 0, count: 0 };
                            domainSumsB[dom.domainKey].sum += dom.transformedScore || 0;
                            domainSumsB[dom.domainKey].count++;
                        });
                    }
                }
            } else if (type === "STRESS") {
                w.stress = risk;
            }
        });

        // 2. Matriz de Priorización (Cálculo)
        let group1D = 0;
        let vulnerables = 0;
        let adaptados = 0;
        let sanos = 0;

        workerMatrix.forEach((val) => {
            if (val.intra && val.stress) {
                const isIntraHigh = val.intra === "ALTO" || val.intra === "MUY_ALTO";
                const isStressHigh = val.stress === "ALTO" || val.stress === "MUY_ALTO";
                
                if (isIntraHigh && isStressHigh) group1D++;
                else if (!isIntraHigh && isStressHigh) vulnerables++;
                else if (isIntraHigh && !isStressHigh) adaptados++;
                else sanos++;
            }
        });
        const validMatrixTotal = group1D + vulnerables + adaptados + sanos;
        const criticalPercent = validMatrixTotal > 0 ? (group1D / validMatrixTotal) * 100 : 0;

        // Formateador de promedios a 1 decimal estricto
        const round1 = (val: number) => Math.round(val * 10) / 10;
        
        // Helper para extraer umbrales (Gauges) de baremos.json
        const getThresholds = (obj: any) => {
            if (!obj) return [20, 40, 60, 80, 100];
            return [
                obj.sinRiesgo[1],
                obj.bajo[1],
                obj.medio[1],
                obj.alto[1],
                obj.muyAlto[1]
            ];
        };

        const bData: any = baremos;

        // Construir dominios Forma A con umbrales
        const domainsFormaA = [];
        if (countA > 0) {
            domainsFormaA.push({
                key: 'total_a',
                name: 'Puntaje Total Intralaboral (Forma A)',
                average: round1(totalScoreA / countA),
                thresholds: getThresholds(bData.intralaboral_a.total)
            });
            for (const [key, stats] of Object.entries(domainSumsA)) {
                const bThresholds = bData.intralaboral_a.domains[key];
                domainsFormaA.push({
                    key,
                    name: key.replace(/_/g, ' ').toUpperCase(),
                    average: round1(stats.sum / stats.count),
                    thresholds: getThresholds(bThresholds)
                });
            }
        }

        // Construir dominios Forma B con umbrales
        const domainsFormaB = [];
        if (countB > 0) {
            domainsFormaB.push({
                key: 'total_b',
                name: 'Puntaje Total Intralaboral (Forma B)',
                average: round1(totalScoreB / countB),
                thresholds: getThresholds(bData.intralaboral_b.total)
            });
            for (const [key, stats] of Object.entries(domainSumsB)) {
                const bThresholds = bData.intralaboral_b.domains[key];
                domainsFormaB.push({
                    key,
                    name: key.replace(/_/g, ' ').toUpperCase(),
                    average: round1(stats.sum / stats.count),
                    thresholds: getThresholds(bThresholds)
                });
            }
        }

        // Pirámide de Riesgo por Áreas (Top 5 más críticos)
        const areaPyramid = Object.entries(areaRisks).map(([area, stats]) => ({
            area,
            totalEvaluated: stats.total,
            criticalPercent: round1((stats.muyAlto / stats.total) * 100)
        })).sort((a, b) => b.criticalPercent - a.criticalPercent);

        return {
            isRestricted: false,
            workerCount,
            orgInfo: {
                organizationName: orgInfo.name,
                organizationNit: orgInfo.nit,
                reportDate: new Date().toLocaleDateString('es-CO'),
                psychologistName: orgInfo.psychologist.fullName,
                psychologistLicense: orgInfo.psychologist.sstCredential || orgInfo.psychologist.licenseNumber,
                psychologistLicenseDate: orgInfo.psychologist.sstLicenseDate ? new Date(orgInfo.psychologist.sstLicenseDate).toISOString() : null,
                psychologistId: orgInfo.psychologist.id
            },
            executiveSummary: {
                totalWorkers: workerCount,
                criticalPercent: round1(criticalPercent),
                predominantRisk: criticalPercent > 30 ? "Riesgo Alto/Muy Alto predominante" : "Estabilidad General",
                priorityMatrix: {
                    group1D,
                    vulnerables,
                    adaptados,
                    sanos
                }
            },
            domainsFormaA,
            domainsFormaB,
            areaPyramid,
            recommendations: [] // Will be populated by AI or DB
        };
    }
}

