import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

const VALID_DOC_TYPES = ["CC", "CE", "TI", "PA", "OTHER"];
const VALID_JOB_LEVELS = ["JEFATURA", "PROFESIONAL", "TECNICO", "AUXILIAR", "OPERATIVO"];
const VALID_EDUCATION_LEVELS = [
    "PRIMARIA", "BACHILLERATO", "TECNICO", "TECNOLOGO",
    "PROFESIONAL", "ESPECIALIZACION", "MAESTRIA", "DOCTORADO"
];

interface ParsedWorker {
    documentType: string;
    documentId: string;
    fullName: string;
    jobTitle: string;
    jobLevel: string;
    educationLevel: string;
    departmentArea: string;
}

interface RowError {
    row: number;
    column: string;
    message: string;
}

/**
 * POST /api/workers/import — Bulk import workers from CSV text
 * Body: { organizationId, csvData }
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { organizationId, csvData } = body;

        if (!organizationId || !csvData) {
            return NextResponse.json(
                { error: "organizationId y csvData son requeridos" },
                { status: 400 }
            );
        }

        // Validate organization ownership
        const org = await prisma.organization.findFirst({
            where: { id: organizationId, createdByPsychologist: session.user.id },
            select: { id: true, name: true }
        });

        if (!org) {
            return NextResponse.json(
                { error: "Organización no encontrada o no autorizada" },
                { status: 404 }
            );
        }

        // Parse CSV
        const lines = (csvData as string).split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        if (lines.length < 2) {
            return NextResponse.json(
                { error: "El CSV debe tener al menos un encabezado y una fila de datos" },
                { status: 400 }
            );
        }

        // Skip header
        const dataLines = lines.slice(1);
        const errors: RowError[] = [];
        const validWorkers: ParsedWorker[] = [];

        for (let i = 0; i < dataLines.length; i++) {
            const rowNum = i + 2; // Account for header + 0-index
            const cols = dataLines[i].split(",").map((c: string) => c.trim());

            if (cols.length < 7) {
                errors.push({ row: rowNum, column: "general", message: `Se esperan 7 columnas, se encontraron ${cols.length}` });
                continue;
            }

            const [documentType, documentId, fullName, jobTitle, jobLevel, educationLevel, departmentArea] = cols;

            // Validate required fields
            if (!documentId) { errors.push({ row: rowNum, column: "documentId", message: "Documento es obligatorio" }); continue; }
            if (!fullName) { errors.push({ row: rowNum, column: "fullName", message: "Nombre es obligatorio" }); continue; }
            if (!jobLevel) { errors.push({ row: rowNum, column: "jobLevel", message: "Nivel de cargo es obligatorio" }); continue; }
            if (!educationLevel) { errors.push({ row: rowNum, column: "educationLevel", message: "Nivel educativo es obligatorio" }); continue; }

            // Validate enums
            const docType = documentType.toUpperCase() || "CC";
            if (!VALID_DOC_TYPES.includes(docType)) {
                errors.push({ row: rowNum, column: "documentType", message: `Tipo de documento inválido: "${documentType}". Use: ${VALID_DOC_TYPES.join(", ")}` });
                continue;
            }

            const jl = jobLevel.toUpperCase();
            if (!VALID_JOB_LEVELS.includes(jl)) {
                errors.push({ row: rowNum, column: "jobLevel", message: `Nivel de cargo inválido: "${jobLevel}". Use: ${VALID_JOB_LEVELS.join(", ")}` });
                continue;
            }

            const el = educationLevel.toUpperCase();
            if (!VALID_EDUCATION_LEVELS.includes(el)) {
                errors.push({ row: rowNum, column: "educationLevel", message: `Nivel educativo inválido: "${educationLevel}". Use: ${VALID_EDUCATION_LEVELS.join(", ")}` });
                continue;
            }

            validWorkers.push({
                documentType: docType,
                documentId,
                fullName,
                jobTitle: jobTitle || "",
                jobLevel: jl,
                educationLevel: el,
                departmentArea: departmentArea || ""
            });
        }

        // Bulk create valid workers (skip duplicates)
        let successCount = 0;
        for (const w of validWorkers) {
            try {
                await prisma.worker.upsert({
                    where: {
                        documentType_documentId_organizationId: {
                            documentType: w.documentType as any,
                            documentId: w.documentId,
                            organizationId: organizationId
                        }
                    },
                    update: {
                        fullName: w.fullName,
                        jobTitle: w.jobTitle || undefined,
                        jobLevel: w.jobLevel as any,
                        educationLevel: w.educationLevel as any,
                        departmentArea: w.departmentArea || undefined
                    },
                    create: {
                        documentType: w.documentType as any,
                        documentId: w.documentId,
                        fullName: w.fullName,
                        jobTitle: w.jobTitle || undefined,
                        jobLevel: w.jobLevel as any,
                        educationLevel: w.educationLevel as any,
                        departmentArea: w.departmentArea || undefined,
                        organizationId
                    }
                });
                successCount++;
            } catch (dbErr: any) {
                errors.push({
                    row: validWorkers.indexOf(w) + 2,
                    column: "database",
                    message: dbErr.message?.slice(0, 100) || "Error de base de datos"
                });
            }
        }

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "IMPORT",
            resourceType: "worker",
            resourceId: organizationId,
            metadata: { totalRows: dataLines.length, successCount, failedCount: errors.length, orgName: org.name },
            ipAddress,
            userAgent
        });

        return NextResponse.json({
            totalRows: dataLines.length,
            successRows: successCount,
            failedRows: errors.length,
            errors: errors.slice(0, 50) // Cap error list
        });
    } catch (error) {
        console.error("[WORKERS/IMPORT] Error:", error);
        return NextResponse.json({ error: "Error al procesar la importación" }, { status: 500 });
    }
}
