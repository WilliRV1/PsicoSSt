import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Users, Building2, ClipboardList, FileText, UserCheck, UserX,
    Clock, Shield, ArrowRight, Activity,
} from "lucide-react";

export default async function AdminDashboardPage() {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) redirect("/dashboard");

    const [
        totalPsychologists,
        pendingPsychologists,
        activePsychologists,
        suspendedPsychologists,
        totalOrganizations,
        totalWorkers,
        totalAssessments,
        signedAssessments,
        recentAuditLogs,
        recentRegistrations,
    ] = await Promise.all([
        prisma.psychologist.count(),
        prisma.psychologist.count({ where: { status: "PENDING" } }),
        prisma.psychologist.count({ where: { status: "ACTIVE" } }),
        prisma.psychologist.count({ where: { status: "SUSPENDED" } }),
        prisma.organization.count(),
        prisma.worker.count(),
        prisma.assessment.count({ where: { status: { in: ["SCORED", "REVIEWED", "SIGNED"] } } }),
        prisma.assessment.count({ where: { status: "SIGNED" } }),
        prisma.auditLog.findMany({
            include: { user: { select: { fullName: true, email: true } } },
            orderBy: { createdAt: "desc" },
            take: 8,
        }),
        prisma.psychologist.findMany({
            where: { status: "PENDING" },
            select: { id: true, fullName: true, email: true, licenseNumber: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
    ]);

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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground">Panel de Administración</h2>
                <p className="text-sm text-muted-foreground">Vista general del sistema PsicoSST.</p>
            </div>

            {/* Pending alert */}
            {pendingPsychologists > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex-1">
                        <p className="font-semibold text-sm text-amber-800">
                            {pendingPsychologists} solicitud{pendingPsychologists > 1 ? "es" : ""} pendiente{pendingPsychologists > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-amber-700">Psicólogos esperando aprobación de cuenta.</p>
                    </div>
                    <Link href="/dashboard/admin/psychologists/pending" className="text-xs font-semibold text-amber-700 underline shrink-0">
                        Revisar →
                    </Link>
                </div>
            )}

            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Psicólogos activos", value: activePsychologists, icon: UserCheck, color: "text-green-600", bg: "bg-green-50", ring: "ring-green-200" },
                    { label: "Organizaciones", value: totalOrganizations, icon: Building2, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" },
                    { label: "Trabajadores", value: totalWorkers, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-200" },
                    { label: "Evaluaciones", value: totalAssessments, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-200" },
                ].map(({ label, value, icon: Icon, color, bg, ring }) => (
                    <div key={label} className={`rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ${ring}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{label}</p>
                                <p className="mt-1.5 text-3xl font-bold text-foreground">{value}</p>
                            </div>
                            <div className={`rounded-lg p-2.5 ${bg}`}>
                                <Icon className={`h-5 w-5 ${color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Psychologist stats + quick links */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground text-sm">Estado de Psicólogos</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total registrados</span>
                            <span className="font-semibold">{totalPsychologists}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-green-700">Activos</span>
                            <span className="font-semibold text-green-700">{activePsychologists}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-amber-700">Pendientes</span>
                            <span className="font-semibold text-amber-700">{pendingPsychologists}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-700">Suspendidos</span>
                            <span className="font-semibold text-red-700">{suspendedPsychologists}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground text-sm">Reportes</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total evaluaciones</span>
                            <span className="font-semibold">{totalAssessments}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-green-700">Firmados</span>
                            <span className="font-semibold text-green-700">{signedAssessments}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-amber-700">Pendientes</span>
                            <span className="font-semibold text-amber-700">{totalAssessments - signedAssessments}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground text-sm">Acciones rápidas</h3>
                    </div>
                    <div className="space-y-2">
                        <Link
                            href="/dashboard/admin/psychologists"
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                            <span className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-muted-foreground" /> Psicólogos</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                        <Link
                            href="/dashboard/admin/psychologists/pending"
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Solicitudes pendientes</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                        <Link
                            href="/dashboard/admin/audit"
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                            <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /> Registro de auditoría</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Pending registrations + Recent activity */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Pending registrations */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Solicitudes Recientes</h3>
                        <Link href="/dashboard/admin/psychologists/pending" className="flex items-center gap-1 text-xs text-primary hover:underline">
                            Ver todas <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {recentRegistrations.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No hay solicitudes pendientes.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {recentRegistrations.map((p) => (
                                <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                                    <div>
                                        <p className="font-medium text-foreground">{p.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{p.email} · Lic. {p.licenseNumber}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(p.createdAt).toLocaleDateString("es-CO", { month: "short", day: "numeric" })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent audit logs */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Actividad Reciente</h3>
                        <Link href="/dashboard/admin/audit" className="flex items-center gap-1 text-xs text-primary hover:underline">
                            Ver todo <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {recentAuditLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No hay actividad registrada.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {recentAuditLogs.map((log) => (
                                <div key={String(log.id)} className="flex items-center justify-between py-2.5 text-sm">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-foreground truncate">
                                            {actionLabels[log.action] || log.action}
                                            <span className="text-muted-foreground font-normal"> — {log.resourceType}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {log.user?.fullName || log.user?.email || "Sistema"}
                                        </p>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                                        {new Date(log.createdAt).toLocaleDateString("es-CO", {
                                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
