import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import FilterBar from "@/components/psicosst/filter-bar";
import { Suspense } from "react";
import type { AuditAction, Prisma } from "@/generated/prisma";

const actionLabels: Record<string, string> = {
    LOGIN: "Inicio de sesión",
    LOGOUT: "Cierre de sesión",
    LOGIN_FAILED: "Login fallido",
    ACCOUNT_LOCKED: "Cuenta bloqueada",
    CREATE: "Creación",
    READ: "Lectura",
    UPDATE: "Actualización",
    DELETE: "Eliminación",
    SCORE: "Calificación",
    SIGN_REPORT: "Firma de reporte",
    EXPORT: "Exportación",
    IMPORT: "Importación",
    CONSENT_RECORDED: "Consentimiento",
    MFA_SETUP: "Config. MFA",
    PASSWORD_CHANGE: "Cambio de contraseña",
};

const NEUTRAL_ACTION_STYLE = { background: "var(--color-surface-muted)", color: "var(--color-text-secondary)" };
const actionColors: Record<string, { background: string; color: string }> = {
    LOGIN: { background: "var(--color-teal-light)", color: "var(--color-teal-dark)" },
    LOGOUT: NEUTRAL_ACTION_STYLE,
    LOGIN_FAILED: { background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)" },
    ACCOUNT_LOCKED: { background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)" },
    CREATE: { background: "color-mix(in srgb, var(--color-info) 14%, transparent)", color: "var(--color-info)" },
    READ: NEUTRAL_ACTION_STYLE,
    UPDATE: { background: "var(--color-risk-medium-bg)", color: "var(--color-risk-medium-text)" },
    DELETE: { background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)" },
    SCORE: { background: "color-mix(in srgb, var(--color-primary) 14%, transparent)", color: "var(--color-primary)" },
    SIGN_REPORT: { background: "var(--color-teal-light)", color: "var(--color-teal-dark)" },
    EXPORT: { background: "color-mix(in srgb, var(--color-info) 14%, transparent)", color: "var(--color-info)" },
    IMPORT: { background: "color-mix(in srgb, var(--color-info) 14%, transparent)", color: "var(--color-info)" },
    CONSENT_RECORDED: { background: "var(--color-teal-light)", color: "var(--color-teal-dark)" },
    MFA_SETUP: { background: "color-mix(in srgb, var(--color-primary) 14%, transparent)", color: "var(--color-primary)" },
    PASSWORD_CHANGE: { background: "var(--color-risk-medium-bg)", color: "var(--color-risk-medium-text)" },
};

interface PageProps {
    searchParams: Promise<{ q?: string; action?: string; page?: string }>;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) redirect("/dashboard");

    const params = await searchParams;
    const q = params.q?.trim() || "";
    const actionFilter = params.action || "";
    const page = Math.max(1, parseInt(params.page || "1"));
    const pageSize = 50;

    const where: Prisma.AuditLogWhereInput = {};
    if (actionFilter) {
        where.action = actionFilter as AuditAction;
    }
    if (q) {
        where.OR = [
            { resourceType: { contains: q, mode: "insensitive" } },
            { resourceId: { contains: q, mode: "insensitive" } },
            { user: { fullName: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
        ];
    }

    const [logs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: { user: { select: { fullName: true, email: true } } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard/admin"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Registro de Auditoría</h2>
                    <p className="text-sm text-muted-foreground">
                        {totalCount} registro{totalCount !== 1 ? "s" : ""} en total
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Suspense>
                <FilterBar
                    searchPlaceholder="Buscar por usuario, recurso..."
                    filters={[
                        {
                            key: "action",
                            placeholder: "Todas las acciones",
                            options: Object.entries(actionLabels).map(([value, label]) => ({
                                value,
                                label,
                            })),
                        },
                    ]}
                />
            </Suspense>

            {logs.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border shadow-sm">
                        <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Sin registros</h3>
                    <p className="text-sm text-muted-foreground">No se encontraron registros de auditoría con los filtros aplicados.</p>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usuario</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acción</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recurso</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.map((log) => {
                                    const metadata = log.metadata as Record<string, unknown> | null;
                                    const actionColor = actionColors[log.action] || NEUTRAL_ACTION_STYLE;

                                    return (
                                        <tr key={String(log.id)} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="text-foreground">
                                                    {new Date(log.createdAt).toLocaleDateString("es-CO", {
                                                        year: "numeric", month: "short", day: "numeric",
                                                    })}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(log.createdAt).toLocaleTimeString("es-CO", {
                                                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                {log.user ? (
                                                    <div>
                                                        <div className="font-medium text-foreground">{log.user.fullName}</div>
                                                        <div className="text-xs text-muted-foreground">{log.user.email}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Sistema</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={actionColor}>
                                                    {actionLabels[log.action] || log.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="text-foreground text-xs">{log.resourceType}</div>
                                                {log.resourceId && (
                                                    <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[150px]" title={log.resourceId}>
                                                        {log.resourceId}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {log.ipAddress || "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {metadata && Object.keys(metadata).length > 0 ? (
                                                    <details className="text-xs">
                                                        <summary className="cursor-pointer text-primary hover:underline">Ver</summary>
                                                        <pre className="mt-1 max-w-xs overflow-auto rounded bg-muted p-2 text-[11px] text-muted-foreground">
                                                            {JSON.stringify(metadata, null, 2)}
                                                        </pre>
                                                    </details>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border px-5 py-3">
                            <p className="text-xs text-muted-foreground">
                                Página {page} de {totalPages} ({totalCount} registros)
                            </p>
                            <div className="flex gap-2">
                                {page > 1 && (
                                    <Link
                                        href={`/dashboard/admin/audit?page=${page - 1}${actionFilter ? `&action=${actionFilter}` : ""}${q ? `&q=${q}` : ""}`}
                                        className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                                    >
                                        Anterior
                                    </Link>
                                )}
                                {page < totalPages && (
                                    <Link
                                        href={`/dashboard/admin/audit?page=${page + 1}${actionFilter ? `&action=${actionFilter}` : ""}${q ? `&q=${q}` : ""}`}
                                        className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                                    >
                                        Siguiente
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
