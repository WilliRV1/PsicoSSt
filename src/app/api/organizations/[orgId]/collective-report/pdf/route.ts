import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream, Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const RISK_ORDER = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"] as const;
type RiskKey = typeof RISK_ORDER[number];

const RISK_LABELS: Record<RiskKey, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

const RISK_COLORS: Record<RiskKey, string> = {
    SIN_RIESGO: "#22c55e",
    BAJO: "#84cc16",
    MEDIO: "#eab308",
    ALTO: "#f97316",
    MUY_ALTO: "#ef4444",
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#1e293b",
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: "#1e40af",
        paddingBottom: 12,
    },
    title: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: "#1e40af",
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 9,
        textAlign: "center",
        color: "#64748b",
    },
    infoSection: {
        marginBottom: 14,
        flexDirection: "row",
        gap: 20,
    },
    infoBlock: {
        flex: 1,
        backgroundColor: "#f8fafc",
        borderRadius: 4,
        padding: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    infoBlockTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#64748b",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    infoLabel: {
        fontSize: 9,
        color: "#64748b",
        width: 70,
    },
    infoValue: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        flex: 1,
    },
    noteBox: {
        backgroundColor: "#eff6ff",
        borderLeftWidth: 3,
        borderLeftColor: "#3b82f6",
        padding: 8,
        marginBottom: 14,
        borderRadius: 2,
    },
    noteText: {
        fontSize: 8,
        color: "#1e40af",
        lineHeight: 1.5,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: "#1e293b",
        marginBottom: 8,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1e40af",
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderRadius: 2,
        marginBottom: 2,
    },
    tableHeaderCell: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#ffffff",
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 5,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        alignItems: "center",
    },
    tableRowAlt: {
        backgroundColor: "#f8fafc",
    },
    cellArea: {
        width: "30%",
        fontSize: 9,
    },
    cellAreaHeader: {
        width: "30%",
    },
    cellCount: {
        width: "10%",
        textAlign: "center",
        fontSize: 9,
    },
    cellCountHeader: {
        width: "10%",
    },
    cellRisk: {
        width: "12%",
        textAlign: "center",
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
    },
    cellRiskHeader: {
        width: "12%",
    },
    totalsRow: {
        flexDirection: "row",
        paddingVertical: 6,
        paddingHorizontal: 4,
        backgroundColor: "#1e293b",
        borderRadius: 2,
        marginTop: 4,
        alignItems: "center",
    },
    totalsLabel: {
        width: "30%",
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#ffffff",
    },
    totalsCount: {
        width: "10%",
        textAlign: "center",
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#ffffff",
    },
    totalsRisk: {
        width: "12%",
        textAlign: "center",
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#ffffff",
    },
    footer: {
        position: "absolute",
        bottom: 24,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        paddingTop: 8,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    footerText: {
        fontSize: 8,
        color: "#94a3b8",
    },
});

type AreaEntry = {
    area: string;
    workerCount: number;
    riskCounts: Record<string, number>;
};

function buildDocument(data: {
    organization: { name: string; nit: string | null; city: string | null };
    psychologist: { fullName: string; licenseNumber: string | null; professionalCard: string | null } | null;
    areas: AreaEntry[];
    totalByRisk: Record<string, number>;
    generatedAt: string;
}) {
    const { organization, psychologist, areas, totalByRisk, generatedAt } = data;

    const formattedDate = new Date(generatedAt).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const totalWorkers = areas.reduce((s, a) => s + a.workerCount, 0);

    // Table rows for areas
    const tableRows = areas.map((entry, i) =>
        React.createElement(
            View,
            {
                key: entry.area,
                style: [styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}] as any,
            },
            React.createElement(Text, { style: styles.cellArea }, entry.area),
            React.createElement(Text, { style: styles.cellCount }, String(entry.workerCount)),
            ...RISK_ORDER.map(rk =>
                React.createElement(
                    Text,
                    {
                        key: rk,
                        style: [styles.cellRisk, { color: RISK_COLORS[rk] }] as any,
                    },
                    String(entry.riskCounts[rk] ?? 0)
                )
            )
        )
    );

    return React.createElement(
        Document,
        { title: "Informe Colectivo de Riesgo Psicosocial" },
        React.createElement(
            Page,
            { size: "A4", style: styles.page },

            // Header
            React.createElement(
                View,
                { style: styles.header },
                React.createElement(Text, { style: styles.title }, "INFORME COLECTIVO DE FACTORES DE RIESGO PSICOSOCIAL"),
                React.createElement(Text, { style: styles.subtitle }, "Resolución 2646 de 2008 — Ministerio de la Protección Social")
            ),

            // Info section: org + psychologist
            React.createElement(
                View,
                { style: styles.infoSection },
                // Org block
                React.createElement(
                    View,
                    { style: styles.infoBlock },
                    React.createElement(Text, { style: styles.infoBlockTitle }, "Organización"),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Empresa:"),
                        React.createElement(Text, { style: styles.infoValue }, organization.name)
                    ),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "NIT:"),
                        React.createElement(Text, { style: styles.infoValue }, organization.nit ?? "—")
                    ),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Ciudad:"),
                        React.createElement(Text, { style: styles.infoValue }, organization.city ?? "—")
                    )
                ),
                // Psychologist block
                React.createElement(
                    View,
                    { style: styles.infoBlock },
                    React.createElement(Text, { style: styles.infoBlockTitle }, "Psicólogo Evaluador"),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Nombre:"),
                        React.createElement(Text, { style: styles.infoValue }, psychologist?.fullName ?? "—")
                    ),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Licencia:"),
                        React.createElement(Text, { style: styles.infoValue }, psychologist?.licenseNumber ?? "—")
                    ),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "T. Profesional:"),
                        React.createElement(Text, { style: styles.infoValue }, psychologist?.professionalCard ?? "—")
                    ),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Fecha:"),
                        React.createElement(Text, { style: styles.infoValue }, formattedDate)
                    )
                )
            ),

            // Legal note
            React.createElement(
                View,
                { style: styles.noteBox },
                React.createElement(
                    Text,
                    { style: styles.noteText },
                    "Este informe presenta resultados agregados. No contiene información individual de trabajadores, en cumplimiento del artículo 18 de la Resolución 2646 de 2008."
                )
            ),

            // Table title
            React.createElement(Text, { style: styles.sectionTitle }, "Distribución de Riesgo por Área / Departamento"),

            // Table header
            React.createElement(
                View,
                { style: styles.tableHeader },
                React.createElement(Text, { style: [styles.tableHeaderCell, styles.cellAreaHeader] as any }, "Área / Departamento"),
                React.createElement(Text, { style: [styles.tableHeaderCell, styles.cellCountHeader] as any }, "Workers"),
                ...RISK_ORDER.map(rk =>
                    React.createElement(
                        Text,
                        { key: rk, style: [styles.tableHeaderCell, styles.cellRiskHeader] as any },
                        RISK_LABELS[rk]
                    )
                )
            ),

            // Table rows
            ...tableRows,

            // Totals row
            React.createElement(
                View,
                { style: styles.totalsRow },
                React.createElement(Text, { style: styles.totalsLabel }, "TOTAL GENERAL"),
                React.createElement(Text, { style: styles.totalsCount }, String(totalWorkers)),
                ...RISK_ORDER.map(rk =>
                    React.createElement(
                        Text,
                        { key: rk, style: styles.totalsRisk },
                        String(totalByRisk[rk] ?? 0)
                    )
                )
            ),

            // Footer
            React.createElement(
                View,
                { style: styles.footer, fixed: true } as any,
                React.createElement(
                    Text,
                    { style: styles.footerText },
                    `${psychologist?.fullName ?? ""} — Licencia: ${psychologist?.licenseNumber ?? ""}`.trim()
                ),
                React.createElement(
                    Text,
                    { style: styles.footerText },
                    `Generado el ${formattedDate}`
                )
            )
        )
    );
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, nit: true, city: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Aggregation (same logic as collective-report/route.ts, inlined)
    const workers = await prisma.worker.findMany({
        where: { organizationId: orgId },
        select: {
            jobTitle: true,
            jobLevel: true,
            departmentArea: true,
            assessments: {
                where: {
                    psychologistId: session.user.id,
                    status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                },
                select: {
                    questionnaireType: true,
                    scoredResult: { select: { overallRiskCategory: true } },
                },
            },
        },
    });

    const areaMap: Record<string, AreaEntry> = {};

    for (const worker of workers) {
        const area = worker.departmentArea || "Sin área";
        if (!areaMap[area]) {
            areaMap[area] = {
                area,
                workerCount: 0,
                riskCounts: Object.fromEntries(RISK_ORDER.map(k => [k, 0])),
            };
        }
        const risks = worker.assessments
            .filter(a => a.scoredResult)
            .map(a => a.scoredResult!.overallRiskCategory as string);
        if (risks.length > 0) {
            areaMap[area].workerCount++;
            const highest =
                RISK_ORDER.slice().reverse().find(r => risks.includes(r)) ?? (risks[0] as RiskKey);
            areaMap[area].riskCounts[highest] = (areaMap[area].riskCounts[highest] ?? 0) + 1;
        }
    }

    const totalByRisk: Record<string, number> = Object.fromEntries(RISK_ORDER.map(k => [k, 0]));
    for (const entry of Object.values(areaMap)) {
        for (const [k, v] of Object.entries(entry.riskCounts)) {
            totalByRisk[k] = (totalByRisk[k] ?? 0) + v;
        }
    }

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: session.user.id },
        select: { fullName: true, licenseNumber: true, professionalCard: true },
    });

    const docElement = buildDocument({
        organization: { name: org.name, nit: org.nit, city: org.city },
        psychologist,
        areas: Object.values(areaMap),
        totalByRisk,
        generatedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(docElement as any);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
        stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        stream.on("end", resolve);
        stream.on("error", reject);
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="informe-colectivo-${orgId}.pdf"`,
            "Content-Length": String(pdfBuffer.byteLength),
        },
    });
}
