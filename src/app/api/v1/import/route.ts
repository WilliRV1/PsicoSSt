import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssessmentService } from "@/lib/services/assessment-service";
import { FormType, QuestionnaireType, ItemResponses } from "@/types/battery";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "El archivo excede el tamaño máximo de 5MB" },
                { status: 400 }
            );
        }

        const text = await file.text();
        const lines = text.split(/\r?\n/);

        if (lines.length < 2) {
            return NextResponse.json(
                { error: "El archivo debe tener al menos un encabezado y una fila de datos" },
                { status: 400 }
            );
        }

        const dataLines = lines.slice(1).filter(line => line.trim() !== "");

        const results = {
            totalRows: dataLines.length,
            successRows: 0,
            failedRows: 0,
            errors: [] as { row: number; column?: string; message: string }[]
        };

        for (let i = 0; i < dataLines.length; i++) {
            const values = dataLines[i].split(",");
            const rowIndex = i + 2; // +2 for 1-indexed + header row

            try {
                // Column mapping: documentId, qType, formType, date, r1, r2, ...
                const documentId = values[0]?.trim();
                const qType = values[1]?.trim() as QuestionnaireType;
                const formType = values[2]?.trim() as FormType;
                const dateRaw = values[3]?.trim();

                if (!documentId) {
                    throw new Error("Falta el número de documento del trabajador");
                }

                const validQTypes: QuestionnaireType[] = ["INTRALABORAL", "EXTRALABORAL", "STRESS"];
                if (!qType || !validQTypes.includes(qType)) {
                    throw new Error(`Tipo de cuestionario inválido: "${qType}". Use: ${validQTypes.join(", ")}`);
                }

                const validFormTypes: FormType[] = ["A", "B"];
                if (formType && !validFormTypes.includes(formType)) {
                    throw new Error(`Tipo de forma inválido: "${formType}". Use: A o B`);
                }

                // Find worker
                const worker = await prisma.worker.findFirst({
                    where: { documentId: documentId },
                    include: { organization: true }
                });

                if (!worker) {
                    throw new Error(`Trabajador con documento ${documentId} no encontrado`);
                }

                // Map and validate responses
                const responses: ItemResponses = {};
                for (let j = 4; j < values.length; j++) {
                    const itemNum = j - 3;
                    const rawVal = values[j]?.trim();
                    if (rawVal === "" || rawVal === undefined) continue;

                    const val = parseInt(rawVal);
                    if (isNaN(val) || val < 0 || val > 4) {
                        throw new Error(`Ítem ${itemNum}: valor "${rawVal}" inválido. Debe ser 0-4`);
                    }
                    responses[String(itemNum)] = val;
                }

                if (Object.keys(responses).length === 0) {
                    throw new Error("No se encontraron respuestas válidas en esta fila");
                }

                // Create assessment with BULK input method
                await AssessmentService.createAssessment({
                    workerId: worker.id,
                    psychologistId: session.user.id,
                    companyId: worker.organizationId,
                    formType: formType || "A",
                    questionnaireType: qType,
                    assessmentDate: dateRaw ? new Date(dateRaw) : new Date(),
                    responses,
                    inputMethod: "BULK"
                });

                results.successRows++;
            } catch (err: any) {
                results.failedRows++;
                results.errors.push({
                    row: rowIndex,
                    message: err.message
                });
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
