import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractRequestMeta } from "@/lib/auth/audit";
import { EntitlementError } from "@/lib/entitlements";
import { importScores, type ImportSource } from "@/lib/services/score-import-service";
import { getErrorMessage } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST multipart/form-data: file (CSV), organizationId, source (SIRPSI | OTRO).
 * Importa puntajes ya calificados; las categorías se derivan con los baremos.
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const organizationId = String(formData.get("organizationId") ?? "");
        const sourceRaw = String(formData.get("source") ?? "SIRPSI").toUpperCase();
        const source: ImportSource = sourceRaw === "OTRO" ? "OTRO" : "SIRPSI";

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
        }
        if (!organizationId) {
            return NextResponse.json({ error: "Falta organizationId" }, { status: 400 });
        }
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "El archivo excede 5 MB" }, { status: 400 });
        }

        const { ipAddress, userAgent } = extractRequestMeta(request);
        const result = await importScores({
            psychologistId: session.user.id,
            organizationId,
            source,
            fileName: file.name,
            csvText: await file.text(),
            ipAddress,
            userAgent,
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof EntitlementError) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
        }
        const message = getErrorMessage(error);
        if (message.startsWith("Falta la columna") || message.startsWith("El archivo no se pudo leer")) {
            return NextResponse.json({ error: message }, { status: 400 });
        }
        console.error("[IMPORTS] scores error:", error);
        return NextResponse.json({ error: "Error técnico al importar" }, { status: 500 });
    }
}
