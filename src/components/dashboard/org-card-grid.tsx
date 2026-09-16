"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ComplianceBadge, type ComplianceStatus } from "@/components/psicosst/compliance-badge";

export interface OrgCard {
    id: string;
    name: string;
    city: string | null;
    totalWorkers: number;
    evaluatedWorkers: number;
    criticalWorkers: number;
    pendingSignatures: number;
    complianceStatus: ComplianceStatus;
    expiryDate: string | null;
    daysLeft: number | null;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function OrgCardGrid({ orgs }: { orgs: OrgCard[] }) {
    const reduceMotion = useReducedMotion();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orgs.map((org, i) => (
                <motion.div
                    key={org.id}
                    initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    // Escalonado corto y con techo: la fila once no espera diez pasos
                    // de 40ms para empezar a moverse.
                    transition={{ duration: 0.26, ease: EASE_OUT, delay: reduceMotion ? 0 : Math.min(i, 8) * 0.035 }}
                    className="relative rounded-xl border overflow-hidden flex flex-col"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                >
                    <div className="p-5 flex flex-col flex-1 gap-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-semibold text-[14px] text-foreground truncate">{org.name}</p>
                                {org.city && (
                                    <p className="text-[12px] text-text-muted truncate mt-0.5">{org.city}</p>
                                )}
                            </div>
                            <ComplianceBadge status={org.complianceStatus} className="flex-shrink-0" />
                        </div>

                        {/* Metrics */}
                        <div className="space-y-1.5 text-[13px]">
                            <div className="flex items-center justify-between">
                                <span className="text-text-secondary">Evaluados</span>
                                <span className="font-medium text-foreground font-mono tabular-nums">
                                    {org.evaluatedWorkers} / {org.totalWorkers}
                                </span>
                            </div>
                            {org.totalWorkers > 0 && (
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-muted)" }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: "var(--color-primary)", transformOrigin: "left" }}
                                        initial={reduceMotion ? undefined : { scaleX: 0 }}
                                        animate={{ scaleX: Math.round((org.evaluatedWorkers / org.totalWorkers) * 100) / 100 }}
                                        transition={{ duration: 0.5, ease: EASE_OUT, delay: reduceMotion ? 0 : Math.min(i, 8) * 0.035 + 0.1 }}
                                    />
                                </div>
                            )}
                            {org.criticalWorkers > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-text-secondary">Riesgo alto o muy alto</span>
                                    <span className="font-semibold font-mono tabular-nums" style={{ color: "var(--color-risk-veryhigh-text)" }}>
                                        {org.criticalWorkers} trabajador{org.criticalWorkers !== 1 ? "es" : ""}
                                    </span>
                                </div>
                            )}
                            {org.pendingSignatures > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-text-secondary">Sin firmar</span>
                                    <span className="font-semibold font-mono tabular-nums" style={{ color: "var(--color-risk-medium-text)" }}>
                                        {org.pendingSignatures}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between pt-0.5">
                                <span className="text-text-secondary">
                                    {org.complianceStatus === "sin_evaluar" ? "Última evaluación" : "Vigencia hasta"}
                                </span>
                                <span
                                    className="font-medium"
                                    style={{
                                        color:
                                            org.complianceStatus === "vencida" ? "var(--color-risk-veryhigh-text)"
                                            : org.complianceStatus === "por_vencer" ? "var(--color-risk-medium-text)"
                                            : "var(--color-text-secondary)",
                                    }}
                                >
                                    {org.complianceStatus === "sin_evaluar"
                                        ? "—"
                                        : org.expiryDate
                                            ? new Date(org.expiryDate).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
                                            : "—"}
                                </span>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="pt-1 mt-auto">
                            <Link
                                href={`/dashboard/organizations/${org.id}`}
                                className="press-feedback group flex items-center justify-between w-full px-3 py-2 rounded-lg text-[13px] font-medium text-foreground transition-colors"
                                style={{ background: "var(--color-surface-muted)" }}
                            >
                                <span>Ver empresa</span>
                                <ArrowRight className="w-4 h-4 text-text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
