import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream, Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import React from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type RiskKey = "SIN_RIESGO" | "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO";
type StatusKey = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

// ── Label / colour maps ───────────────────────────────────────────────────────

const RISK_LABELS: Record<RiskKey, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

const STATUS_LABELS: Record<StatusKey, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En ejecución",
    DONE: "Cumplido",
    CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<StatusKey, string> = {
    PENDING: "#fbbf24",
    IN_PROGRESS: "#3b82f6",
    DONE: "#22c55e",
    CANCELLED: "#94a3b8",
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    page: {
        paddingTop: 0,
        paddingBottom: 60,
        paddingHorizontal: 0,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#1e293b",
    },
    // ── Header ──
    headerBanner: {
        backgroundColor: "#0051BA",
        paddingVertical: 18,
        paddingHorizontal: 40,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        color: "#ffffff",
        textAlign: "center",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 9,
        color: "#bfdbfe",
        textAlign: "center",
    },
    // ── Info row ──
    infoSection: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 14,
        paddingHorizontal: 40,
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
        width: 72,
    },
    infoValue: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        flex: 1,
    },
    // ── Summary stats ──
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
        paddingHorizontal: 40,
    },
    statBox: {
        flex: 1,
        backgroundColor: "#f0f9ff",
        borderRadius: 4,
        padding: 8,
        borderWidth: 1,
        borderColor: "#bae6fd",
        alignItems: "center",
    },
    statNumber: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        color: "#0051BA",
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 8,
        color: "#64748b",
        textAlign: "center",
    },
    // ── Table ──
    tableWrapper: {
        paddingHorizontal: 40,
        marginBottom: 16,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#0051BA",
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
        alignItems: "flex-start",
    },
    tableRowAlt: {
        backgroundColor: "#f8fafc",
    },
    // Column widths
    colNum: { width: "5%", fontSize: 8, textAlign: "center" },
    colMedida: { width: "35%", fontSize: 8 },
    colResponsable: { width: "15%", fontSize: 8 },
    colFecha: { width: "12%", fontSize: 8, textAlign: "center" },
    colArea: { width: "12%", fontSize: 8 },
    colRiesgo: { width: "11%", fontSize: 8, textAlign: "center", fontFamily: "Helvetica-Bold" },
    colEstado: { width: "10%", fontSize: 8, textAlign: "center", fontFamily: "Helvetica-Bold" },
    // ── Empty message ──
    emptyBox: {
        marginHorizontal: 40,
        marginBottom: 16,
        backgroundColor: "#f8fafc",
        borderRadius: 4,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 10,
        color: "#94a3b8",
        textAlign: "center",
    },
    // ── Footer ──
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date | string | null | undefined): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

type ActionItem = {
    id: string;
    measure: string;
    responsible: string | null;
    dueDate: Date | null;
    area: string | null;
    riskCategory: string | null;
    status: string;
};

// ── PDF document builder ──────────────────────────────────────────────────────

function buildDocument(data: {
    org: { name: string; nit: string | null };
    plan: { period: string | null; status: string; actions: ActionItem[] };
    psychologist: { fullName: string; licenseNumber: string | null } | null;
    generatedAt: string;
}) {
    const { org, plan, psychologist, generatedAt } = data;
    const actions = plan.actions;

    const formattedGenDate = new Date(generatedAt).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Summary counts
    const total = actions.length;
    const pending = actions.filter(a => a.status === "PENDING").length;
    const inProgress = actions.filter(a => a.status === "IN_PROGRESS").length;
    const done = actions.filter(a => a.status === "DONE").length;

    // ── Table rows ──
    const tableRows = actions.map((action, i) => {
        const statusKey = action.status as StatusKey;
        const riskKey = action.riskCategory as RiskKey | null;
        const statusColor = STATUS_COLORS[statusKey] ?? "#94a3b8";
        const riskLabel = riskKey ? (RISK_LABELS[riskKey] ?? action.riskCategory ?? "—") : "—";
        const statusLabel = STATUS_LABELS[statusKey] ?? action.status;

        return React.createElement(
            View,
            {
                key: action.id,
                style: [styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}] as any,
            },
            React.createElement(Text, { style: styles.colNum }, String(i + 1)),
            React.createElement(Text, { style: styles.colMedida }, action.measure ?? "—"),
            React.createElement(Text, { style: styles.colResponsable }, action.responsible ?? "—"),
            React.createElement(Text, { style: styles.colFecha }, formatDate(action.dueDate)),
            React.createElement(Text, { style: styles.colArea }, action.area ?? "—"),
            React.createElement(Text, { style: styles.colRiesgo }, riskLabel),
            React.createElement(
                Text,
                { style: [styles.colEstado, { color: statusColor }] as any },
                statusLabel
            )
        );
    });

    // ── Empty message ──
    const emptyMessage = React.createElement(
        View,
        { style: styles.emptyBox },
        React.createElement(Text, { style: styles.emptyText }, "Sin medidas registradas en este plan.")
    );

    return React.createElement(
        Document,
        { title: "Plan de Intervención de Riesgo Psicosocial" },
        React.createElement(
            Page,
            { size: "A4", style: styles.page },

            // ── Header banner ──
            React.createElement(
                View,
                { style: styles.headerBanner },
                React.createElement(
                    Text,
                    { style: styles.headerTitle },
                    "PLAN DE INTERVENCIÓN DE RIESGO PSICOSOCIAL"
                ),
                React.createElement(
                    Text,
                    { style: styles.headerSubtitle },
                    "Resolución 2764 de 2022 — Ministerio de Trabajo"
                )
            ),

            // ── Info row ──
            React.createElement(
                View,
                { style: styles.infoSection },
                // Left block: org
                React.createElement(
                    View,
                    { style: styles.infoBlock },
                    React.createElement(Text, { style: styles.infoBlockTitle }, "Organización"),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Empresa:"),
                        React.createElement(Text, { style: styles.infoValue }, org.name)
                    ),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "NIT:"),
                        React.createElement(Text, { style: styles.infoValue }, org.nit ?? "—")
                    )
                ),
                // Right block: plan + psychologist
                React.createElement(
                    View,
                    { style: styles.infoBlock },
                    React.createElement(Text, { style: styles.infoBlockTitle }, "Plan / Evaluador"),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Período:"),
                        React.createElement(Text, { style: styles.infoValue }, plan.period ?? "—")
                    ),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Estado:"),
                        React.createElement(Text, { style: styles.infoValue }, plan.status)
                    ),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Psicólogo:"),
                        React.createElement(
                            Text,
                            { style: styles.infoValue },
                            psychologist?.fullName ?? "—"
                        )
                    ),
                    React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(Text, { style: styles.infoLabel }, "Generado:"),
                        React.createElement(Text, { style: styles.infoValue }, formattedGenDate)
                    )
                )
            ),

            // ── Summary stats ──
            React.createElement(
                View,
                { style: styles.statsRow },
                React.createElement(
                    View,
                    { style: styles.statBox },
                    React.createElement(Text, { style: styles.statNumber }, String(total)),
                    React.createElement(Text, { style: styles.statLabel }, "Total acciones")
                ),
                React.createElement(
                    View,
                    { style: [styles.statBox, { borderColor: "#fde68a", backgroundColor: "#fffbeb" }] as any },
                    React.createElement(
                        Text,
                        { style: [styles.statNumber, { color: "#d97706" }] as any },
                        String(pending)
                    ),
                    React.createElement(Text, { style: styles.statLabel }, "Pendientes")
                ),
                React.createElement(
                    View,
                    { style: [styles.statBox, { borderColor: "#bfdbfe", backgroundColor: "#eff6ff" }] as any },
                    React.createElement(
                        Text,
                        { style: [styles.statNumber, { color: "#2563eb" }] as any },
                        String(inProgress)
                    ),
                    React.createElement(Text, { style: styles.statLabel }, "En ejecución")
                ),
                React.createElement(
                    View,
                    { style: [styles.statBox, { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }] as any },
                    React.createElement(
                        Text,
                        { style: [styles.statNumber, { color: "#16a34a" }] as any },
                        String(done)
                    ),
                    React.createElement(Text, { style: styles.statLabel }, "Cumplidas")
                )
            ),

            // ── Actions table or empty message ──
            ...(actions.length === 0
                ? [emptyMessage]
                : [
                      React.createElement(
                          View,
                          { style: styles.tableWrapper },
                          // Table header
                          React.createElement(
                              View,
                              { style: styles.tableHeader },
                              React.createElement(
                                  Text,
                                  { style: [styles.tableHeaderCell, styles.colNum] as any },
                                  "#"
                              ),
                              React.createElement(
                                  Text,
                                  { style: [styles.tableHeaderCell, styles.colMedida] as any },
                                  "Medida"
                              ),
                              React.createElement(
                                  Text,
                                  { style: [styles.tableHeaderCell, styles.colResponsable] as any },
                                  "Responsable"
                              ),
                              React.createElement(
                                  Text,
                                  { style: [styles.tableHeaderCell, styles.colFecha] as any },
                                  "Fecha límite"
                              ),
                              React.createElement(
                                  Text,
                                  { style: [styles.tableHeaderCell, styles.colArea] as any },
                                  "Área"
                              ),
                              React.createElement(
                                  Text,
                                  { style: [styles.tableHeaderCell, styles.colRiesgo] as any },
                                  "Riesgo"
                              ),
                              React.createElement(
                                  Text,
                                  { style: [styles.tableHeaderCell, styles.colEstado] as any },
                                  "Estado"
                              )
                          ),
                          // Data rows
                          ...tableRows
                      ),
                  ]),

            // ── Footer ──
            React.createElement(
                View,
                { style: styles.footer, fixed: true } as any,
                React.createElement(
                    Text,
                    { style: styles.footerText },
                    `Psicólogo: ${psychologist?.fullName ?? "—"} — Tarjeta Profesional: ${psychologist?.licenseNumber ?? "—"}`
                ),
                React.createElement(Text, { style: styles.footerText }, "Generado por PsicoSST")
            )
        )
    );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orgId } = await params;

    // Verify org ownership
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, nit: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch most recent active intervention plan with its actions
    const plan = await prisma.interventionPlan.findFirst({
        where: { organizationId: orgId, psychologistId: session.user.id },
        include: { actions: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
    });
    if (!plan)
        return NextResponse.json({ error: "No plan found" }, { status: 404 });

    // Psychologist info
    const psychologist = await prisma.psychologist.findUnique({
        where: { id: session.user.id },
        select: { fullName: true, licenseNumber: true },
    });

    // Build and stream PDF
    const docElement = buildDocument({
        org: { name: org.name, nit: org.nit },
        plan: {
            period: (plan as any).period ?? null,
            status: plan.status,
            actions: plan.actions as unknown as ActionItem[],
        },
        psychologist,
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
    const safeName = org.name.replace(/[^a-zA-Z0-9\-_]/g, "-");

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="plan-intervencion-${safeName}.pdf"`,
            "Content-Length": String(pdfBuffer.byteLength),
        },
    });
}
