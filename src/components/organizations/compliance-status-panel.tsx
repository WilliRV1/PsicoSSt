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
                <div className="h-16 rounded-lg bg-gray-200" />
                <div className="h-4 rounded bg-gray-200 w-3/4" />
                <div className="h-4 rounded bg-gray-200 w-1/2" />
            </div>
        );
    }

    if (!data) return null;

    const { status, passedCount, totalChecks, checks } = data;
    const percentage = Math.round((passedCount / totalChecks) * 100);

    const statusConfig = {
        COMPLIANT: {
            bg: "bg-green-50 border-green-200",
            text: "text-green-700",
            icon: <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />,
            title: "En Cumplimiento",
            subtitle: "La empresa cumple con los requisitos de la Res. 2764/2022",
            barColor: "bg-green-500",
        },
        AT_RISK: {
            bg: "bg-amber-50 border-amber-200",
            text: "text-amber-700",
            icon: <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />,
            title: "En Riesgo de Incumplimiento",
            subtitle: "Hay requisitos legales pendientes",
            barColor: "bg-amber-500",
        },
        NON_COMPLIANT: {
            bg: "bg-red-50 border-red-200",
            text: "text-red-700",
            icon: <XCircle className="w-8 h-8 text-red-500 shrink-0" />,
            title: "Incumplimiento",
            subtitle: "La empresa no cumple con la normativa SST vigente",
            barColor: "bg-red-500",
        },
    } as const;

    const cfg = statusConfig[status];

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            {/* Status header */}
            <div className={`flex items-center gap-4 p-4 border-b ${cfg.bg} border`}>
                {cfg.icon}
                <div>
                    <p className={`font-semibold text-base ${cfg.text}`}>{cfg.title}</p>
                    <p className={`text-sm ${cfg.text} opacity-80`}>{cfg.subtitle}</p>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Progress bar */}
                <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{passedCount} de {totalChecks} requisitos cumplidos</span>
                        <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${cfg.barColor}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>

                {/* Checklist */}
                <ul className="space-y-2">
                    {Object.values(checks).map((check, i) => (
                        <li key={i} className="flex items-start gap-3">
                            {check.ok
                                ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            }
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{check.label}</p>
                                <p className="text-xs text-gray-500">{check.detail}</p>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* Legal note */}
                <p className="text-xs text-gray-400 border-t pt-3">
                    Basado en la Resolución 2764 de 2022 y Resolución 2646 de 2008 del Ministerio de Trabajo.
                </p>
            </div>
        </div>
    );
}
