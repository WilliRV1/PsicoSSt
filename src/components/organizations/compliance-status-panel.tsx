"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceCheck {
    ok: boolean;
    label: string;
    detail: string;
}

interface ComplianceData {
    status: "COMPLIANT" | "AT_RISK" | "NON_COMPLIANT";
    passedCount: number;
    totalChecks: number;
    checks: Record<string, ComplianceCheck>;
    workerCount: number;
    signed: number;
    pending: number;
    consentCount: number;
    hasPlan: boolean;
    planActionsCount: number;
}

export function ComplianceStatusPanel({ orgId }: { orgId: string }) {
    const [data, setData] = useState<ComplianceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/organizations/${orgId}/compliance`)
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [orgId]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-3 p-4">
                <div className="h-16 rounded-lg bg-muted" />
                <div className="h-4 rounded bg-muted w-3/4" />
                <div className="h-4 rounded bg-muted w-1/2" />
            </div>
        );
    }

    if (!data) return null;

    const { status, passedCount, totalChecks, checks } = data;
    const percentage = Math.round((passedCount / totalChecks) * 100);

    const statusConfig = {
        COMPLIANT: {
            bg: "var(--color-risk-low-bg)",
            border: "var(--color-risk-low-border)",
            text: "var(--color-risk-low-text)",
            icon: <CheckCircle2 className="w-8 h-8 shrink-0" style={{ color: "var(--color-risk-low-solid)" }} />,
            title: "En Cumplimiento",
            subtitle: "La empresa cumple con los requisitos de la Res. 2764/2022",
            bar: "var(--color-risk-low-solid)",
        },
        AT_RISK: {
            bg: "var(--color-risk-medium-bg)",
            border: "var(--color-risk-medium-border)",
            text: "var(--color-risk-medium-text)",
            icon: <AlertTriangle className="w-8 h-8 shrink-0" style={{ color: "var(--color-risk-medium-solid)" }} />,
            title: "En Riesgo de Incumplimiento",
            subtitle: "Hay requisitos legales pendientes",
            bar: "var(--color-risk-medium-solid)",
        },
        NON_COMPLIANT: {
            bg: "var(--color-risk-veryhigh-bg)",
            border: "var(--color-risk-veryhigh-border)",
            text: "var(--color-risk-veryhigh-text)",
            icon: <XCircle className="w-8 h-8 shrink-0" style={{ color: "var(--color-risk-veryhigh-solid)" }} />,
            title: "Incumplimiento",
            subtitle: "La empresa no cumple con la normativa SST vigente",
            bar: "var(--color-risk-veryhigh-solid)",
        },
    } as const;

    const cfg = statusConfig[status];

    return (
        <div className="rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}>
            {/* Status header */}
            <div className="flex items-center gap-4 p-4 border-b" style={{ background: cfg.bg, borderColor: cfg.border }}>
                {cfg.icon}
                <div>
                    <p className="font-semibold text-base" style={{ color: cfg.text }}>{cfg.title}</p>
                    <p className="text-sm opacity-80" style={{ color: cfg.text }}>{cfg.subtitle}</p>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Progress bar */}
                <div>
                    <div className="flex justify-between text-sm text-text-secondary mb-1">
                        <span>{passedCount} de {totalChecks} requisitos cumplidos</span>
                        <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface-muted)" }}>
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${percentage}%`, background: cfg.bar }}
                        />
                    </div>
                </div>

                {/* Checklist */}
                <ul className="space-y-2">
                    {Object.values(checks).map((check, i) => (
                        <li key={i} className="flex items-start gap-3">
                            {check.ok
                                ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-risk-low-solid)" }} />
                                : <XCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-risk-veryhigh-solid)" }} />
                            }
                            <div>
                                <p className="text-sm font-semibold text-foreground">{check.label}</p>
                                <p className="text-xs text-text-muted">{check.detail}</p>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* Legal note */}
                <p className="text-xs text-text-muted border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                    Basado en la Resolución 2764 de 2022 y Resolución 2646 de 2008 del Ministerio de Trabajo.
                </p>
            </div>
        </div>
    );
}
