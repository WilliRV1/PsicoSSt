"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CreateOrganizationModal from "@/components/dashboard/create-organization-modal";
import { TableSkeleton } from "@/components/ui/molecules/TableSkeleton";
import { ComplianceBadge, type ComplianceStatus } from "@/components/psicosst/compliance-badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Organization {
    id: string;
    name: string;
    nit: string;
    city: string | null;
    department: string | null;
    workersCount: number;
    evaluatedWorkers: number;
    criticalWorkers: number;
    pendingSignatures: number;
    complianceStatus: ComplianceStatus;
    expiryDate: string | null;
    daysLeft: number | null;
    lastActivity: string;
    pendingInterventions: number;
}

export default function OrganizationsPage() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const reduceMotion = useReducedMotion();

    const fetchOrgs = useCallback(async () => {
        try {
            const res = await fetch("/api/organizations");
            const data = await res.json();
            setOrgs(data.data || []);
        } catch {
            console.error("Error fetching organizations");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    const formatLastActivity = (dateString: string) => {
        if (!dateString) return "—";
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-semibold text-foreground tracking-[-0.02em]">Empresas</h1>
                    <p className="mt-1 text-[14px] text-text-secondary">
                        {loading ? "Cargando…" : `${orgs.length} empresa${orgs.length === 1 ? '' : 's'} registrada${orgs.length === 1 ? '' : 's'}`}
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)} className="press-feedback">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva empresa
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <TableSkeleton columns={6} rows={6} />
            ) : orgs.length === 0 ? (
                <div
                    className="rounded-xl border border-dashed text-center py-20 px-6 flex flex-col items-center"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface-muted)" }}
                >
                    <h2 className="text-lg font-semibold text-foreground mb-2">No tiene empresas registradas</h2>
                    <p className="text-[14px] text-text-secondary mb-6 max-w-sm">
                        Cree la primera empresa para empezar a analizar el riesgo psicosocial de sus trabajadores.
                    </p>
                    <Button onClick={() => setShowModal(true)} className="press-feedback">
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir primera empresa
                    </Button>
                </div>
            ) : (
                <motion.div
                    initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full rounded-xl overflow-hidden"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                    <table className="w-full text-[13px] text-left">
                        <thead style={{ background: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                            <tr>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Cumplimiento</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Evaluados</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Riesgo alto o muy alto</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Sin firmar</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Última actividad</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgs.map((org, i) => (
                                <tr
                                    key={org.id}
                                    className="group transition-colors"
                                    style={{
                                        borderTop: i > 0 ? "1px solid var(--color-border-muted)" : undefined,
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-muted)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <Link href={`/dashboard/organizations/${org.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                                                {org.name}
                                            </Link>
                                            <span className="text-[11px] text-text-secondary font-mono mt-0.5">
                                                NIT: {org.nit}{org.city ? ` · ${org.city}` : ""}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ComplianceBadge status={org.complianceStatus} />
                                        {org.daysLeft !== null && org.daysLeft >= 0 && org.daysLeft <= 90 && (
                                            <p className="text-[11px] font-medium mt-1 font-mono tabular-nums" style={{ color: "var(--color-risk-medium-text)" }}>{org.daysLeft} días</p>
                                        )}
                                        {org.daysLeft !== null && org.daysLeft < 0 && (
                                            <p className="text-[11px] font-medium mt-1 font-mono tabular-nums" style={{ color: "var(--color-risk-veryhigh-text)" }}>Vencida hace {Math.abs(org.daysLeft)} días</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono tabular-nums">
                                        <span className="font-medium text-foreground">{org.evaluatedWorkers}</span>
                                        <span className="text-text-muted"> / {org.workersCount}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {org.criticalWorkers > 0 ? (
                                            <span
                                                className="inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums"
                                                style={{ background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)" }}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-risk-veryhigh-solid)" }} />
                                                {org.criticalWorkers}
                                            </span>
                                        ) : (
                                            <span className="text-text-muted text-[12px]">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono tabular-nums">
                                        {org.pendingSignatures > 0 ? (
                                            <span className="font-semibold" style={{ color: "var(--color-risk-medium-text)" }}>{org.pendingSignatures}</span>
                                        ) : (
                                            <span className="text-text-muted">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                        {formatLastActivity(org.lastActivity)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <Link
                                            href={`/dashboard/organizations/${org.id}`}
                                            className="press-feedback inline-flex items-center gap-1.5 p-1.5 rounded text-text-secondary hover:text-foreground transition-colors opacity-60 hover:opacity-100"
                                            style={{ background: "transparent" }}
                                            title="Ver empresa"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}

            <CreateOrganizationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    setShowModal(false);
                    fetchOrgs();
                }}
            />
        </div>
    );
}
