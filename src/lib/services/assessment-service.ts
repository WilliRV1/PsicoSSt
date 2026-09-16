import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { scoreQuestionnaire } from "@/lib/scoring";
import { getFormConfig } from "@/config/battery";
import { getInstrument } from "@/config/instruments";
import { getErrorMessage } from "@/lib/utils";
import {
    FormType,
    QuestionnaireType,
    ItemResponses,
    ScoredResultData,
    DomainScore,
    TotalScore
} from "@/types/battery";

/** Banda de riesgo de baremos.json: [límite inferior, límite superior] por categoría. */
interface BaremoBand {
    sinRiesgo: [number, number];
    bajo: [number, number];
    medio: [number, number];
    alto: [number, number];
    muyAlto: [number, number];
}

interface BaremoFormBlock {
    total: BaremoBand;
    domains: Record<string, BaremoBand>;
}

/**
 * Valida que cada respuesta pertenezca realmente a la Forma/tipo de
 * cuestionario declarado y que su valor esté en la escala correcta.
 *
 * Sin esto se podían guardar ítems fuera del rango real de la forma (p. ej.
 * 100-123 en Forma B, que no existen ahí) sin ningún error, y Estrés aceptaba
 * 0-4 cuando su escala real es 0-3 — un valor de 4 se puntuaba en silencio
 * como el mejor resultado posible en vez de rechazarse.
 */
function validateResponses(
    responses: ItemResponses,
    formType: FormType,
    questionnaireType: QuestionnaireType
) {
    const config = getFormConfig(formType, questionnaireType);
    if (!config) {
        throw new Error(`Configuración no encontrada para ${questionnaireType} Forma ${formType}.`);
    }

    const validItems = new Set<number>();
    for (const dim of config.dimensions) {
        for (const item of dim.items) validItems.add(item);
    }

    const { min: minValue, max: maxValue } = getInstrument(questionnaireType).scale;

    for (const [itemKey, value] of Object.entries(responses)) {
        const itemNum = Number(itemKey);
        if (!Number.isInteger(itemNum) || !validItems.has(itemNum)) {
            throw new Error(
                `Ítem ${itemKey} no existe en ${questionnaireType} Forma ${formType}.`
            );
        }
        if (typeof value !== "number" || value < minValue || value > maxValue || !Number.isInteger(value)) {
            throw new Error(
                `Ítem ${itemKey}: valor inválido "${value}". Debe ser un entero entre ${minValue} y ${maxValue}.`
            );
        }
    }
}

/**
 * La evaluación sustenta un informe ya firmado o entregado.
 *
 * Lleva su propio código HTTP porque la ruta la traducía toda a 500, y esto no
 * es un fallo del servidor sino una negativa deliberada.
 */
export class AssessmentLockedError extends Error {
    readonly status = 409;

    constructor(message: string) {
        super(message);
        this.name = "AssessmentLockedError";
    }
}

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
        /** Respuesta a "soy jefe de otras personas en mi trabajo" (forma A). */
        hasPeopleInCharge?: boolean;
        inputMethod?: "MANUAL" | "BULK" | "SELF_SERVICE" | "IMPORTED";
        informedConsent?: {
            consentGranted: boolean;
            consentMethod: "VERBAL" | "WRITTEN" | "DIGITAL";
            consentText?: string;
            /** Firma dibujada por el trabajador (PNG base64), flujo de autoservicio. */
            consentSignature?: string;
        };
    }) {
        // 0. Validate that every response belongs to this form/type and is in range
        validateResponses(data.responses, data.formType, data.questionnaireType);

        // 0.5 Fetch worker metadata for scoring logic (Filter Questions & Stress Baremos)
        const worker = await prisma.worker.findUnique({
            where: { id: data.workerId },
            select: {
                id: true,
                gender: true,
                jobLevel: true,
                hasCustomerInteraction: true,
                hasPeopleInCharge: true
            }
        });

        if (!worker) throw new Error("Trabajador no encontrado");

        // Las dos preguntas de control del cuestionario se guardan en el
        // trabajador, porque de ellas depende que una dimensión aplique o no y
        // hay que poder recalificar más adelante con el mismo criterio.
        if (data.hasPeopleInCharge !== undefined && worker.hasPeopleInCharge !== data.hasPeopleInCharge) {
            await prisma.worker.update({
                where: { id: worker.id },
                data: { hasPeopleInCharge: data.hasPeopleInCharge },
            });
            worker.hasPeopleInCharge = data.hasPeopleInCharge;
        }

        if (data.hasCustomerInteraction !== undefined && worker.hasCustomerInteraction !== data.hasCustomerInteraction) {
            await prisma.worker.update({
                where: { id: data.workerId },
                data: { hasCustomerInteraction: data.hasCustomerInteraction }
            });
            worker.hasCustomerInteraction = data.hasCustomerInteraction;
        }

        // 1. Calculate scores using the pure scoring engine
        console.log("Calculando puntajes para:", data.workerId);
        const scoredResult: ScoredResultData = scoreQuestionnaire(
            data.responses,
            data.formType,
            data.questionnaireType,
            {
                occupationalGroup: data.occupationalGroup,
                gender: worker.gender || "F",
                jobLevel: worker.jobLevel,
                hasCustomerInteraction: worker.hasCustomerInteraction,
                hasPeopleInCharge: worker.hasPeopleInCharge ?? undefined
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
                        // Copia fija de las respuestas de control vigentes en
                        // este momento: workers.* es mutable y una evaluación
                        // posterior puede cambiarlo, pero el criterio con el
                        // que SE CALIFICÓ esta evaluación no debe moverse.
                        hasCustomerInteraction: worker.hasCustomerInteraction ?? null,
                        hasPeopleInCharge: worker.hasPeopleInCharge ?? null,
                        // Create related response set
                        responseSet: {
                            create: {
                                responses: data.responses,
                                totalItems: Object.keys(data.responses).length,
                                isComplete: true,
                                submittedAt: new Date()
                            }
                        },
                        // Create related scored result
                        scoredResult: {
                            create: {
                                // Los campos opcionales de estos tipos (p. ej.
                                // baremoPercentile) hacen que TS no los vea
                                // directamente asignables a JSON — se afirma
                                // el tipo que ya escribimos, no cualquier cosa.
                                dimensionScores: scoredResult.dimensions as unknown as Prisma.InputJsonValue,
                                domainScores: scoredResult.domains as unknown as Prisma.InputJsonValue,
                                totalScores: scoredResult.total as unknown as Prisma.InputJsonValue,
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
                            consentMethod: data.informedConsent.consentMethod,
                            consentText: data.informedConsent.consentText || "Confirmación de consentimiento físico firmado.",
                            consentSignature: data.informedConsent.consentSignature,
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
        } catch (error: unknown) {
            console.error("Error DETALLADO en la transacción de Assessment:", error);
            throw new Error(`Error en base de datos: ${getErrorMessage(error)}`);
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
        // 1. Fetch existing assessment to get metadata (including previous scores for audit diff)
        const existing = await prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: {
                worker: true,
                responseSet: true,
                scoredResult: { select: { overallRiskCategory: true } },
                generatedReports: { select: { isFinalized: true, status: true } },
            }
        });

        if (!existing) throw new Error("Evaluación no encontrada");
        // Extra check to ensure the psychologist editing it is the owner
        if (existing.psychologistId !== psychologistId) {
            throw new Error("No tienes permisos para editar esta evaluación");
        }

        // Reescribir respuestas y puntajes bajo un informe ya firmado cambia la
        // base del documento entregado sin dejar rastro en él. Mismo criterio
        // que el DELETE de la evaluación.
        const hasFinalReport = existing.generatedReports.some(
            report =>
                report.isFinalized ||
                report.status === "SIGNED" ||
                report.status === "DELIVERED"
        );
        if (existing.status === "SIGNED" || hasFinalReport) {
            throw new AssessmentLockedError(
                "No se puede editar una evaluación con informe firmado o entregado. " +
                    "Para corregirla hay que revocar primero el informe."
            );
        }

        // Una evaluación importada no tiene respuestas crudas que editar: los
        // puntajes vinieron ya calificados de otra herramienta. Se reimporta.
        if (existing.inputMethod === "IMPORTED" || !existing.responseSet) {
            throw new AssessmentLockedError(
                "Esta evaluación fue importada con puntajes ya calificados y no tiene respuestas editables. " +
                    "Para corregirla, vuelva a importar el archivo."
            );
        }

        // 0. Validate that every response belongs to this form/type and is in range
        validateResponses(newResponses, existing.formType as FormType, existing.questionnaireType as QuestionnaireType);

        // 2. Calculate scores using the pure scoring engine (NO MODIFICATIONS to the engine)
        console.log("Recalculando puntajes tras edición para:", existing.workerId);
        const scoredResult: ScoredResultData = scoreQuestionnaire(
            newResponses,
            existing.formType as FormType,
            existing.questionnaireType as QuestionnaireType,
            {
                occupationalGroup: existing.worker.jobLevel === "AUXILIAR" || existing.worker.jobLevel === "OPERATIVO" ? "auxiliares_operativos" : "jefes_profesionales_tecnicos",
                gender: existing.worker.gender || "F",
                jobLevel: existing.worker.jobLevel,
                // El criterio de control es el vigente CUANDO SE HIZO esta
                // evaluación (columna propia de Assessment), no el actual del
                // trabajador — que pudo cambiar con una evaluación posterior.
                // Las filas anteriores a este campo no tienen snapshot propio
                // y usan el valor del trabajador como mejor aproximación.
                hasCustomerInteraction: existing.hasCustomerInteraction ?? existing.worker.hasCustomerInteraction,
                hasPeopleInCharge: existing.hasPeopleInCharge ?? existing.worker.hasPeopleInCharge ?? undefined
            }
        );

        // 3. Update database in a transaction
        try {
            return await prisma.$transaction(async (tx) => {
                // Update ResponseSet
                await tx.responseSet.update({
                    where: { assessmentId: assessmentId },
                    data: {
                        responses: newResponses,
                        totalItems: Object.keys(newResponses).length,
                        updatedAt: new Date()
                    }
                });

                // Update ScoredResult
                await tx.scoredResult.update({
                    where: { assessmentId: assessmentId },
                    data: {
                        dimensionScores: scoredResult.dimensions as unknown as Prisma.InputJsonValue,
                        domainScores: scoredResult.domains as unknown as Prisma.InputJsonValue,
                        totalScores: scoredResult.total as unknown as Prisma.InputJsonValue,
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

                // Log the edit with before/after diff for traceability
                await tx.auditLog.create({
                    data: {
                        userId: psychologistId,
                        action: "UPDATE",
                        resourceType: "assessment",
                        resourceId: assessmentId,
                        metadata: {
                            note: "Evaluación editada manualmente",
                            previousRiskCategory: existing.scoredResult?.overallRiskCategory ?? null,
                            newRiskCategory: scoredResult.total.riskCategory,
                            previousResponses: existing.responseSet?.responses ?? null,
                            newResponses,
                        }
                    }
                });

                console.log("Evaluación editada y recalculada exitosamente:", assessmentId);
                return {
                    id: updatedAssessment.id,
                    result: scoredResult
                };
            });
        } catch (error: unknown) {
            console.error("Error DETALLADO al editar Assessment:", error);
            throw new Error(`Error en base de datos: ${getErrorMessage(error)}`);
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

        const whereClause: Prisma.AssessmentWhereInput = { organizationId, status: { in: ["COMPLETED", "SCORED", "SIGNED"] } };
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
                const totalScore = (res.totalScores as unknown as TotalScore | null)?.transformedScore || 0;
                if (form === "A") {
                    totalScoreA += totalScore;
                    countA++;
                    if (res.domainScores) {
                        Object.values(res.domainScores as unknown as Record<string, DomainScore>).forEach((dom) => {
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
                        Object.values(res.domainScores as unknown as Record<string, DomainScore>).forEach((dom) => {
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
        const getThresholds = (obj: BaremoBand | undefined) => {
            if (!obj) return [20, 40, 60, 80, 100];
            return [
                obj.sinRiesgo[1],
                obj.bajo[1],
                obj.medio[1],
                obj.alto[1],
                obj.muyAlto[1]
            ];
        };

        const bData = baremos as unknown as {
            intralaboral_a: BaremoFormBlock;
            intralaboral_b: BaremoFormBlock;
        };

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
            recommendations: [] as string | string[] // Will be populated by AI or DB
        };
    }
}

