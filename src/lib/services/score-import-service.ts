import { createHash } from "node:crypto";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { getInstrument, isInstrumentId } from "@/config/instruments";
import { assertCan, consumeUnit, refundUnit, EntitlementError } from "@/lib/entitlements";
import { logAudit } from "@/lib/auth/audit";
import type { FormType, QuestionnaireType } from "@/types/battery";
import { FIXED_COLUMNS, buildScoredDataFromTransformed, parseScore } from "./score-import-build";

export { csvTemplate, buildScoredDataFromTransformed } from "./score-import-build";

/**
 * Importación de resultados YA CALIFICADOS (SIRPSI u otra herramienta).
 *
 * Se aceptan puntajes transformados (0-100) por dimensión y, opcionalmente, el
 * total; las categorías de riesgo NUNCA se aceptan del archivo: se derivan
 * con los baremos vigentes (ver score-import-build.ts). La evaluación nace
 * sin respuestas crudas (`inputMethod: IMPORTED`), ligada a un `ImportJob`
 * que es su prueba de origen.
 */

export type ImportSource = "SIRPSI" | "OTRO";

export interface ScoreImportError {
    row: number;
    column?: string;
    message: string;
}

export interface ScoreImportResult {
    jobId: string;
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: ScoreImportError[];
}

export async function importScores(params: {
    psychologistId: string;
    organizationId: string;
    source: ImportSource;
    fileName: string;
    csvText: string;
    ipAddress?: string;
    userAgent?: string;
}): Promise<ScoreImportResult> {
    await assertCan(params.psychologistId, "IMPORT");

    const org = await prisma.organization.findFirst({
        where: { id: params.organizationId, createdByPsychologist: params.psychologistId },
        select: { id: true },
    });
    if (!org) throw new EntitlementError("NO_SUBSCRIPTION", "Organización no encontrada o no autorizada.", 403);

    const parsed = Papa.parse<Record<string, string>>(params.csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
    });
    if (parsed.errors.length > 0 && parsed.data.length === 0) {
        throw new Error(`El archivo no se pudo leer como CSV: ${parsed.errors[0].message}`);
    }
    const rows = parsed.data;
    const headers = parsed.meta.fields ?? [];
    for (const c of FIXED_COLUMNS) {
        if (!headers.includes(c)) throw new Error(`Falta la columna obligatoria "${c}". Descarga la plantilla del instrumento.`);
    }

    const job = await prisma.importJob.create({
        data: {
            psychologistId: params.psychologistId,
            organizationId: params.organizationId,
            kind: "SCORES",
            source: params.source,
            fileName: params.fileName,
            fileHash: createHash("sha256").update(params.csvText).digest("hex"),
            totalRows: rows.length,
            status: "RUNNING",
            startedAt: new Date(),
        },
        select: { id: true },
    });

    const errors: ScoreImportError[] = [];
    let successRows = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;
        let unitConsumed = false;
        let workerId: string | null = null;
        let instrumentId: QuestionnaireType | null = null;

        try {
            const documentId = (row.documentId ?? "").trim();
            if (!documentId) throw new Error("Falta documentId");

            const rawInstrument = (row.instrument ?? "").trim().toUpperCase();
            if (!isInstrumentId(rawInstrument)) throw new Error(`Instrumento inválido "${row.instrument}"`);
            instrumentId = rawInstrument;
            const instrument = getInstrument(instrumentId);
            if (instrumentId === "CLIMA") await assertCan(params.psychologistId, "USE_CLIMA");

            const formRaw = (row.formType ?? "A").trim().toUpperCase();
            if (formRaw !== "A" && formRaw !== "B") throw new Error(`formType inválido "${row.formType}" (A o B)`);
            const formType = (instrument.usesFormType ? formRaw : "A") as FormType;

            const date = new Date((row.assessmentDate ?? "").trim());
            if (Number.isNaN(date.getTime())) throw new Error(`assessmentDate inválida "${row.assessmentDate}" (use AAAA-MM-DD)`);

            const worker = await prisma.worker.findFirst({
                where: { organizationId: params.organizationId, documentId, archivedAt: null },
                select: { id: true, jobLevel: true },
            });
            if (!worker) throw new Error(`Trabajador con documento ${documentId} no está registrado en la empresa`);
            workerId = worker.id;

            const config = instrument.config(formType);
            const dimensionScores: Record<string, number | null> = {};
            for (const dim of config.dimensions) {
                try {
                    dimensionScores[dim.key] = parseScore(row[dim.key]);
                } catch (e) {
                    throw Object.assign(new Error(`${dim.key}: ${(e as Error).message}`), { column: dim.key });
                }
            }
            let total: number | null;
            try {
                total = parseScore(row.total);
            } catch (e) {
                throw Object.assign(new Error(`total: ${(e as Error).message}`), { column: "total" });
            }
            if (instrument.totalStrategy === "weighted" && total === null) {
                throw Object.assign(new Error("En estrés la columna total es obligatoria"), { column: "total" });
            }

            const scored = buildScoredDataFromTransformed({
                instrument,
                formType,
                dimensionScores,
                total,
                jobLevel: worker.jobLevel,
            });

            const { consumed } = await consumeUnit(params.psychologistId, { workerId: worker.id, questionnaireType: instrumentId });
            unitConsumed = consumed;

            await prisma.$transaction(async (tx) => {
                const assessment = await tx.assessment.create({
                    data: {
                        workerId: worker.id,
                        psychologistId: params.psychologistId,
                        organizationId: params.organizationId,
                        formType,
                        questionnaireType: instrumentId as QuestionnaireType,
                        assessmentDate: date,
                        status: "SCORED",
                        inputMethod: "IMPORTED",
                        importJobId: job.id,
                        completedAt: new Date(),
                    },
                    select: { id: true },
                });
                await tx.scoredResult.create({
                    data: {
                        assessmentId: assessment.id,
                        dimensionScores: scored.dimensions as never,
                        domainScores: scored.domains as never,
                        totalScores: scored.total as never,
                        overallRiskCategory: scored.total.riskCategory,
                    },
                });
            });

            successRows++;
        } catch (err) {
            if (unitConsumed && workerId && instrumentId) {
                await refundUnit(params.psychologistId, {
                    workerId,
                    questionnaireType: instrumentId,
                    reason: `Fila ${rowNumber} de importación fallida`,
                }).catch((e) => console.error("[IMPORT] refund failed:", e));
            }
            const e = err as Error & { column?: string };
            errors.push({ row: rowNumber, column: e.column, message: e.message });
        }
    }

    await prisma.importJob.update({
        where: { id: job.id },
        data: {
            successRows,
            failedRows: errors.length,
            errors: errors as never,
            status: errors.length === rows.length && rows.length > 0 ? "FAILED" : "COMPLETED",
            completedAt: new Date(),
        },
    });

    await logAudit({
        userId: params.psychologistId,
        action: "CREATE",
        resourceType: "ImportJob",
        resourceId: job.id,
        metadata: {
            event: "SCORES_IMPORTED",
            source: params.source,
            organizationId: params.organizationId,
            totalRows: rows.length,
            successRows,
            failedRows: errors.length,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
    });

    return { jobId: job.id, totalRows: rows.length, successRows, failedRows: errors.length, errors };
}
