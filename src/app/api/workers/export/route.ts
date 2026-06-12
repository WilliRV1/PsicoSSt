import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const jobLevelLabels: Record<string, string> = {
    JEFATURA: "Jefatura", PROFESIONAL: "Profesional", TECNICO: "Técnico",
    AUXILIAR: "Auxiliar", OPERATIVO: "Operativo",
};
const educationLabels: Record<string, string> = {
    PRIMARIA: "Primaria", BACHILLERATO: "Bachillerato", TECNICO: "Técnico",
    TECNOLOGO: "Tecnólogo", TECNICO_TECNOLOGO: "Técnico/Tecnólogo",
    PROFESIONAL: "Profesional", ESPECIALIZACION: "Especialización",
    MAESTRIA: "Maestría", DOCTORADO: "Doctorado",
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

    const workers = await (prisma.worker as any).findMany({
        where: {
            organization: {
                createdByPsychologist: session.user.id,
                ...(orgId && { id: orgId }),
            },
        },
        include: {
            organization: { select: { name: true, nit: true } },
            _count: { select: { assessments: true } },
        },
        orderBy: { fullName: "asc" },
        take: 2000,
    });

    const headers = [
        "Nombre", "Tipo Doc.", "Documento", "Género", "Fecha Nacimiento",
        "Estado Civil", "Cargo", "Nivel Jerárquico", "Escolaridad",
        "Área / Departamento", "Ciudad Residencia",
        "Años en Empresa", "Años en Cargo", "Tipo Contrato", "Jornada",
        "Organización", "NIT", "Nº Evaluaciones",
    ];

    const rows = workers.map((w: any) => [
        w.fullName,
        w.documentType,
        w.documentId,
        w.gender === "M" ? "Masculino" : w.gender === "F" ? "Femenino" : "",
        w.birthDate ? new Date(w.birthDate).toLocaleDateString("es-CO") : "",
        w.maritalStatus || "",
        w.jobTitle || "",
        jobLevelLabels[w.jobLevel] || w.jobLevel,
        educationLabels[w.educationLevel] || w.educationLevel,
        w.departmentArea || "",
        w.residenceCity || "",
        w.yearsInCompany !== null ? w.yearsInCompany : "",
        w.yearsInPosition !== null ? w.yearsInPosition : "",
        w.contractType || "",
        w.workSchedule || "",
        w.organization.name,
        w.organization.nit,
        w._count.assessments,
    ].map(escapeCSV).join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = orgId ? `trabajadores_empresa.csv` : `trabajadores_todos.csv`;

    return new NextResponse("\uFEFF" + csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
