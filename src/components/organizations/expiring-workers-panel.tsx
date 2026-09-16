"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

type WorkerStatus = "EXPIRED" | "EXPIRING_SOON" | "NEVER_ASSESSED";

interface ExpiringWorker {
    id: string;
    fullName: string;
    jobTitle: string | null;
    departmentArea: string | null;
    lastAssessmentDate: string | null;
    expiresAt: string | null;
    daysUntilExpiry: number | null;
    status: WorkerStatus;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
}

function StatusBadge({ worker }: { worker: ExpiringWorker }) {
    if (worker.status === "EXPIRED") {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)" }}
            >
                <AlertTriangle className="h-3 w-3" />
                Vencida
            </span>
        );
    }
    if (worker.status === "EXPIRING_SOON") {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: "var(--color-risk-medium-bg)", color: "var(--color-risk-medium-text)" }}
            >
                <AlertTriangle className="h-3 w-3" />
                Por vencer
            </span>
        );
    }
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: "var(--color-surface-muted)", color: "var(--color-text-secondary)" }}
        >
            Sin evaluaciones
        </span>
    );
}

function SkeletonRows() {
    return (
        <>
            {[0, 1].map(i => (
                <div key={i} className="flex items-center justify-between px-4 py-3 animate-pulse">
                    <div className="flex flex-col gap-1.5">
                        <div className="h-3.5 w-40 rounded bg-muted" />
                        <div className="h-3 w-28 rounded bg-muted/60" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-5 w-20 rounded-full bg-muted" />
                        <div className="h-4 w-4 rounded bg-muted" />
                    </div>
                </div>
            ))}
        </>
    );
}

export function ExpiringWorkersPanel({ orgId }: { orgId: string }) {
    const [workers, setWorkers] = useState<ExpiringWorker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/organizations/${orgId}/expiring-workers`)
            .then(res => {
                if (!res.ok) throw new Error("Error al cargar datos");
                return res.json();
            })
            .then(data => setWorkers(data.workers ?? []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [orgId]);

    const hasExpired = workers.some(w => w.status === "EXPIRED");
    const hasExpiringSoon = workers.some(w => w.status === "EXPIRING_SOON");
    const badgeStyle = hasExpired
        ? { background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)" }
        : hasExpiringSoon
        ? { background: "var(--color-risk-medium-bg)", color: "var(--color-risk-medium-text)" }
        : { background: "var(--color-surface-muted)", color: "var(--color-text-secondary)" };

    if (error) {
        return (
            <div className="rounded-xl border border-border bg-card shadow-sm px-4 py-3 text-sm" style={{ color: "var(--color-risk-veryhigh-text)" }}>
                {error}
            </div>
        );
    }

    if (!loading && workers.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card shadow-sm px-4 py-3 flex items-center gap-2 text-sm" style={{ color: "var(--color-risk-low-text)" }}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Todos los trabajadores tienen sus evaluaciones vigentes ✓</span>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Reevaluaciones Pendientes</span>
                {!loading && (
                    <span className="ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={badgeStyle}>
                        {workers.length}
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="divide-y divide-border">
                {loading ? (
                    <SkeletonRows />
                ) : (
                    workers.map(worker => (
                        <div key={worker.id} className="flex items-center gap-3 px-4 py-3">
                            {/* Worker info */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {worker.fullName}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {[worker.jobTitle, worker.departmentArea].filter(Boolean).join(" · ")}
                                </p>
                            </div>

                            {/* Dates */}
                            <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground shrink-0">
                                <span>Última: {formatDate(worker.lastAssessmentDate)}</span>
                                {worker.expiresAt && (
                                    <span>Vence: {formatDate(worker.expiresAt)}</span>
                                )}
                                {worker.status === "EXPIRING_SOON" && worker.daysUntilExpiry !== null && (
                                    <span className="font-medium" style={{ color: "var(--color-risk-medium-text)" }}>
                                        Vence en {worker.daysUntilExpiry} días
                                    </span>
                                )}
                            </div>

                            {/* Status badge */}
                            <div className="shrink-0">
                                <StatusBadge worker={worker} />
                            </div>

                            {/* Link */}
                            <Link
                                href={`/dashboard/workers/${worker.id}`}
                                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                aria-label={`Ver perfil de ${worker.fullName}`}
                            >
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
