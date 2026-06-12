import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const riskLabels: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo", BAJO: "Bajo", MEDIO: "Medio", ALTO: "Alto", MUY_ALTO: "Muy Alto",
};
const questionnaireLabels: Record<string, string> = {
    INTRALABORAL: "Intralaboral", EXTRALABORAL: "Extralaboral", STRESS: "Estrés",
};
const statusLabels: Record<string, string> = {
    SCORED: "Calificado", REVIEWED: "Revisado", SIGNED: "Firmado", COMPLETED: "Completado",
};

function escapeCSV(val: any): string {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = req.nextUrl.searchParams.get("orgId") || undefined;

    const assessments = await prisma.assessment.findMany({
        where: {
            psychologistId: session.user.id,
            status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
            ...(orgId && { organizationId: orgId }),
        },
        include: {
            worker: { select: { fullName: true, documentType: true, documentId: true, jobTitle: true, jobLevel: true } },
            organization: { select: { name: true, nit: true } },
            scoredResult: { select: { overallRiskCategory: true, totalScores: true } },
        },
        orderBy: { assessmentDate: "desc" },
        take: 1000,
    });

    const headers = [
        "Trabajador", "Documento", "Cargo", "Organización", "NIT",
        "Cuestionario", "Forma", "Fecha Evaluación",
        "Riesgo", "Puntaje Transformado", "Estado",
    ];

    const rows = assessments.map(a => {
        const score = (a.scoredResult?.totalScores as any)?.transformedScore;
        return [
            a.worker.fullName,
            `${a.worker.documentType} ${a.worker.documentId}`,
            a.worker.jobTitle || "",
            a.organization.name,
            a.organization.nit,
            questionnaireLabels[a.questionnaireType] || a.questionnaireType,
            a.formType,
            new Date(a.assessmentDate).toLocaleDateString("es-CO"),
            riskLabels[a.scoredResult?.overallRiskCategory || "SIN_RIESGO"],
            score !== undefined ? score.toFixed(2) : "",
            statusLabels[a.status] || a.status,
        ].map(escapeCSV).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = orgId ? `evaluaciones_empresa.csv` : `evaluaciones_todas.csv`;

    return new NextResponse("\uFEFF" + csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
