import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PasswordForm from "./password-form";
import { Shield, User, KeyRound, Activity, Clock, FileText, Building2, Palette } from "lucide-react";
import Link from "next/link";
import BrandingForm from "./branding-form";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [psychologist, recentActivity, stats] = await Promise.all([
        prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: {
                fullName: true,
                email: true,
                licenseNumber: true,
                status: true,
                mfaEnabled: true,
                createdAt: true,
                lastLoginAt: true,
            },
        }),
        prisma.auditLog.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { action: true, resourceType: true, createdAt: true, ipAddress: true },
        }),
        Promise.all([
            prisma.organization.count({ where: { createdByPsychologist: session.user.id } }),
            prisma.assessment.count({ where: { psychologistId: session.user.id, status: "SIGNED" } }),
            prisma.assessment.count({ where: { psychologistId: session.user.id, status: { in: ["SCORED", "REVIEWED"] } } }),
        ]),
    ]);

    if (!psychologist) redirect("/login");

    const [orgCount, signedCount, pendingCount] = stats;

    const actionLabels: Record<string, string> = {
        LOGIN: "Inicio de sesión",
        LOGOUT: "Cierre de sesión",
        LOGIN_FAILED: "Login fallido",
        CREATE: "Creación",
        UPDATE: "Actualización",
        DELETE: "Eliminación",
        SCORE: "Calificación",
        SIGN_REPORT: "Firma de reporte",
        EXPORT: "Exportación",
        IMPORT: "Importación",
        PASSWORD_CHANGE: "Cambio de contraseña",
    };

    const statusLabels: Record<string, { label: string; class: string }> = {
        ACTIVE: { label: "Activo", class: "bg-green-100 text-green-700" },
        PENDING: { label: "Pendiente", class: "bg-amber-100 text-amber-700" },
        SUSPENDED: { label: "Suspendido", class: "bg-red-100 text-red-700" },
        INACTIVE: { label: "Inactivo", class: "bg-gray-100 text-gray-600" },
    };

    const statusInfo = statusLabels[psychologist.status] || statusLabels.ACTIVE;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground">Configuración</h2>
                <p className="text-sm text-muted-foreground">Seguridad, actividad y preferencias de tu cuenta.</p>
            </div>

            {/* Account info */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg bg-indigo-50 p-2">
                        <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-foreground">Información de la cuenta</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nombre</p>
                        <p className="font-medium text-foreground">{psychologist.fullName}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                        <p className="font-medium text-foreground">{psychologist.email}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Licencia SST</p>
                        <p className="font-medium text-foreground">{psychologist.licenseNumber}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Estado</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.class}`}>
                            <Shield className="h-3 w-3" />
                            {statusInfo.label}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Miembro desde</p>
                        <p className="font-medium text-foreground">
                            {new Date(psychologist.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    </div>
                    {psychologist.lastLoginAt && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Último acceso</p>
                            <p className="font-medium text-foreground">
                                {new Date(psychologist.lastLoginAt).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-border">
                    <Link href="/dashboard/profile" className="text-sm text-primary font-medium hover:underline">
                        Editar credenciales profesionales y firma →
                    </Link>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
                    <Building2 className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{orgCount}</p>
                    <p className="text-xs text-muted-foreground">Empresas</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
                    <FileText className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{signedCount}</p>
                    <p className="text-xs text-muted-foreground">Firmados</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
                    <Clock className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
            </div>

            {/* Security */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg bg-emerald-50 p-2">
                        <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Seguridad</h3>
                        <p className="text-xs text-muted-foreground">Estado de seguridad de tu cuenta.</p>
                    </div>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                        <div>
                            <p className="font-medium text-foreground">Autenticación de dos factores (MFA)</p>
                            <p className="text-xs text-muted-foreground">Protección adicional para tu cuenta.</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            psychologist.mfaEnabled
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                        }`}>
                            {psychologist.mfaEnabled ? "Activado" : "Desactivado"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                        <div>
                            <p className="font-medium text-foreground">Sesiones</p>
                            <p className="text-xs text-muted-foreground">Las sesiones expiran después de 8 horas.</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            JWT activo
                        </span>
                    </div>
                </div>
            </div>

            {/* Branding / White Label */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg bg-blue-50 p-2">
                        <Palette className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Marca y Branding (White Label)</h3>
                        <p className="text-xs text-muted-foreground">Personaliza la apariencia de los informes PDF que entregas a tus clientes.</p>
                    </div>
                </div>
                <BrandingForm />
            </div>

            {/* Password change */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg bg-amber-50 p-2">
                        <KeyRound className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Cambiar contraseña</h3>
                        <p className="text-xs text-muted-foreground">Usa una contraseña de al menos 8 caracteres.</p>
                    </div>
                </div>
                <PasswordForm />
            </div>

            {/* Recent activity */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg bg-purple-50 p-2">
                        <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Actividad reciente</h3>
                        <p className="text-xs text-muted-foreground">Últimas acciones registradas en tu cuenta.</p>
                    </div>
                </div>
                {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay actividad registrada.</p>
                ) : (
                    <div className="divide-y divide-border">
                        {recentActivity.map((log, i) => (
                            <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                                <div>
                                    <p className="font-medium text-foreground">
                                        {actionLabels[log.action] || log.action}
                                        <span className="text-muted-foreground font-normal"> — {log.resourceType}</span>
                                    </p>
                                    {log.ipAddress && (
                                        <p className="text-xs text-muted-foreground">IP: {log.ipAddress}</p>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
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
    );
}
