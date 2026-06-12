import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
        return NextResponse.json({ error: "Se requiere el ID de la organización" }, { status: 400 });
    }

    try {
        const organization = await prisma.organization.findUnique({
            where: { id: orgId }
        });

        if (!organization) {
            return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
        }

        const assessments = await prisma.assessment.findMany({
            where: {
                organizationId: orgId,
                psychologistId: session.user.id,
                scoredResult: { isNot: null }
            },
            include: {
                scoredResult: true
            }
        });

        if (assessments.length === 0) {
            return NextResponse.json({ error: "No hay evaluaciones calificadas para esta organización" }, { status: 404 });
        }

        let sinRiesgo = 0;
        let bajo = 0;
        let medio = 0;
        let alto = 0;
        let muyAlto = 0;

        const dimensionTotals: Record<string, { sum: number; count: number }> = {};

        assessments.forEach(a => {
            const risk = a.scoredResult?.overallRiskCategory;
            if (risk === "SIN_RIESGO") sinRiesgo++;
            if (risk === "BAJO") bajo++;
            if (risk === "MEDIO") medio++;
            if (risk === "ALTO") alto++;
            if (risk === "MUY_ALTO") muyAlto++;

            if (a.scoredResult?.dimensionScores) {
                const dims = a.scoredResult.dimensionScores as Record<string, any>;
                for (const [key, data] of Object.entries(dims)) {
                    const name = data.dimensionName || key;
                    const score = data.transformedScore;
                    if (typeof score === 'number') {
                        if (!dimensionTotals[name]) {
                            dimensionTotals[name] = { sum: 0, count: 0 };
                        }
                        dimensionTotals[name].sum += score;
                        dimensionTotals[name].count++;
                    }
                }
            }
        });

        const csvLines = [];
        csvLines.push("INFORME ORGANIZACIONAL");
        csvLines.push(`Empresa:,${organization.name}`);
        csvLines.push(`NIT:,${organization.nit}`);
        csvLines.push(`Fecha de Generacion:,${new Date().toLocaleDateString('es-CO')}`);
        csvLines.push("");
        csvLines.push("RESUMEN DE EVALUADOS");
        csvLines.push(`Total Evaluados:,${assessments.length}`);
        csvLines.push("");
        csvLines.push("DISTRIBUCION DE RIESGO GLOBAL");
        csvLines.push(`Sin Riesgo:,${sinRiesgo}`);
        csvLines.push(`Riesgo Bajo:,${bajo}`);
        csvLines.push(`Riesgo Medio:,${medio}`);
        csvLines.push(`Riesgo Alto:,${alto}`);
        csvLines.push(`Riesgo Muy Alto:,${muyAlto}`);
        csvLines.push("");
        csvLines.push("PROMEDIOS POR DIMENSION");
        csvLines.push("Dimension,Promedio Puntaje Transformado");

        const sortedDimensions = Object.entries(dimensionTotals).sort((a, b) => a[0].localeCompare(b[0]));
        for (const [name, stats] of sortedDimensions) {
            const avg = (stats.sum / stats.count).toFixed(1);
            csvLines.push(`"${name}",${avg}`);
        }

        const csvContent = "\uFEFF" + csvLines.join("\r\n"); // UTF-8 BOM for Excel compatibility

        const safeOrgName = organization.name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);
        const dateStr = new Date().toISOString().slice(0, 10);

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="Informe_Organizacional_${safeOrgName}_${dateStr}.csv"`,
            },
        });

    } catch (error) {
        console.error("Error generating organizational report:", error);
        return NextResponse.json({ error: "Error interno al generar el informe" }, { status: 500 });
    }
}
