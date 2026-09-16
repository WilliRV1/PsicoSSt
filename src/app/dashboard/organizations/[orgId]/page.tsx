"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Upload, MapPin, Building2, Users, XCircle, X, Pencil, Archive, ShieldCheck, FileBarChart, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/molecules/TableSkeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import OrgMetricsDashboard from "@/components/organizations/org-metrics-dashboard";
import InterventionPlanPanel from "@/components/organizations/intervention-plan-panel";
import CollectiveReportButton from "@/components/organizations/collective-report-button";
import { ComplianceStatusPanel } from "@/components/organizations/compliance-status-panel";
import { ExpiringWorkersPanel } from "@/components/organizations/expiring-workers-panel";
import AIDiagnosticPanel from "@/components/organizations/ai-diagnostic-panel";

interface BatterySlot {
    id: string;
    status: string;
    risk: string | null;
}

interface Worker {
    id: string;
    fullName: string;
    documentType: string;
    documentId: string;
    jobTitle: string | null;
    jobLevel: string;
    educationLevel: string;
    departmentArea: string | null;
    gender: string | null;
    birthDate: string | null;
    maritalStatus: string | null;
    residenceCity: string | null;
    yearsInCompany: number | null;
    yearsInPosition: number | null;
    contractType: string | null;
    workSchedule: string | null;
    hoursPerWeek: number | null;
    createdAt: string;
    battery?: {
        intra:  BatterySlot | null;
        extra:  BatterySlot | null;
        stress: BatterySlot | null;
    };
}

/**
 * Shape of GET /api/workers/:id — el registro completo del trabajador. La
 * lista de /api/workers?organizationId= sólo trae el subconjunto de arriba
 * (Worker), así que abrir "editar" desde esa lista necesita esta llamada
 * adicional; usar los datos truncados de la lista vaciaría en el formulario
 * (y luego, al guardar, borraría en la BD) los ~15 campos que esa lista no
 * incluye.
 */
interface FullWorkerRecord {
    id: string;
    documentType: string;
    documentId: string;
    fullName: string;
    gender: string | null;
    birthYear: number | null;
    birthDate: string | null;
    maritalStatus: string | null;
    educationLevel: string | null;
    profession: string | null;
    jobTitle: string | null;
    jobLevel: string;
    residenceCity: string | null;
    residenceDepartment: string | null;
    socioeconomicStratum: string | null;
    housingType: string | null;
    dependentsCount: number | null;
    freeTimeUsage: string[];
    departmentArea: string | null;
    lessThanOneYearInCompany: boolean;
    yearsInCompany: number | null;
    lessThanOneYearInPosition: boolean;
    yearsInPosition: number | null;
    contractType: string | null;
    workSchedule: string | null;
    hoursPerDay: string | null;
    hoursPerWeek: string | null;
    paymentModality: string | null;
    workCity: string | null;
    workDepartment: string | null;
    transportMeans: string | null;
    displacementTime: number | null;
    hasCustomerInteraction: boolean;
}

interface Organization {
    id: string;
    name: string;
    nit: string;
    economicSector: string | null;
    city: string | null;
    department: string | null;
    employeeCount: number | null;
    contactName: string | null;
    contactEmail: string | null;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
    SIGNED:    { bg: "var(--color-teal-light)",       text: "var(--color-teal-dark)",       border: "var(--color-teal)" },
    REVIEWED:  { bg: "color-mix(in srgb, var(--color-info) 14%, transparent)", text: "var(--color-info)", border: "var(--color-info)" },
    SCORED:    { bg: "var(--color-risk-medium-bg)",   text: "var(--color-risk-medium-text)", border: "var(--color-risk-medium-border)" },
    COMPLETED: { bg: "var(--color-surface-muted)",    text: "var(--color-text-secondary)",  border: "var(--color-border)" },
};

const RISK_DOT_VAR: Record<string, string> = {
    SIN_RIESGO: "var(--color-risk-none-solid)",
    BAJO:       "var(--color-risk-low-solid)",
    MEDIO:      "var(--color-risk-medium-solid)",
    ALTO:       "var(--color-risk-high-solid)",
    MUY_ALTO:   "var(--color-risk-veryhigh-solid)",
};

function BatteryBadge({ label, slot, workerId, orgId, type }: {
    label: string;
    slot: BatterySlot | null;
    workerId: string;
    orgId: string;
    type: string;
}) {
    if (!slot) {
        return (
            <a
                href={`/dashboard/assessments/new/manual?workerId=${workerId}&orgId=${orgId}&type=${type}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-dashed border-border text-text-muted hover:border-primary hover:text-primary transition-colors"
                title={`Registrar ${label}`}
            >
                <Plus className="w-2.5 h-2.5" />{label}
            </a>
        );
    }
    const style = STATUS_STYLE[slot.status] ?? STATUS_STYLE.COMPLETED;
    const dotColor = slot.risk ? RISK_DOT_VAR[slot.risk] : "var(--color-text-muted)";
    return (
        <Link
            href={`/dashboard/reports/${slot.id}`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-opacity hover:opacity-80"
            style={{ background: style.bg, color: style.text, boxShadow: `inset 0 0 0 1px ${style.border}` }}
            title={`${label}: ${slot.status}`}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
            {label}
        </Link>
    );
}

const JOB_LEVEL_LABELS: Record<string, string> = {
    JEFATURA: "Jefatura",
    PROFESIONAL: "Profesional",
    TECNICO: "T\u00e9cnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo"
};

import { EMPTY_WORKER_FORM, WorkerFormFields } from "@/components/workers/WorkerFormFields";


import { getErrorMessage } from "@/lib/utils";

export default function OrganizationDetailPage() {
    const params = useParams();
    const orgId = params.orgId as string;
    const reduceMotion = useReducedMotion();

    const [org, setOrg] = useState<Organization | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Create worker modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_WORKER_FORM });
    // Forma A/B elegida por el psicólogo al crear: determina jobLevel (única
    // señal que usa el motor de puntuación para elegir baremo/forma — ver
    // occupationalGroup() en lib/scoring/index.ts). El resto de
    // sociodemográficos los llena el propio trabajador en su autoservicio.
    const [intraFormType, setIntraFormType] = useState<"A" | "B">("A");

    // Edit org modal
    const [showEditOrgModal, setShowEditOrgModal] = useState(false);
    const [savingOrg, setSavingOrg] = useState(false);
    const [orgError, setOrgError] = useState<string | null>(null);
    const [orgForm, setOrgForm] = useState({
        name: "",
        nit: "",
        economicSector: "",
        city: "",
        department: "",
        employeeCount: "",
        contactName: "",
        contactEmail: ""
    });

    // Edit worker modal
    const [showEditWorkerModal, setShowEditWorkerModal] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const [savingWorker, setSavingWorker] = useState(false);
    const [workerError, setWorkerError] = useState<string | null>(null);
    const [editWorkerForm, setEditWorkerForm] = useState({ ...EMPTY_WORKER_FORM });

    const fetchData = useCallback(async () => {
        try {
            const [orgRes, workersRes] = await Promise.all([
                fetch("/api/organizations"),
                fetch(`/api/workers?organizationId=${orgId}`)
            ]);
            const orgData = await orgRes.json();
            const workersData = await workersRes.json();

            const thisOrg = (orgData.data || []).find((o: Organization) => o.id === orgId);
            setOrg(thisOrg || null);
            setWorkers(workersData.data || []);
        } catch {
            console.error("Error fetching data");
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Create worker ---
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const jobLevel = intraFormType === "B" ? "AUXILIAR" : "PROFESIONAL";
            const res = await fetch("/api/workers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, jobLevel, organizationId: orgId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al crear");

            setShowModal(false);
            setForm({ ...EMPTY_WORKER_FORM });
            setIntraFormType("A");
            fetchData();
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    // --- Edit org ---
    const openEditOrg = () => {
        if (!org) return;
        setOrgForm({
            name: org.name,
            nit: org.nit,
            economicSector: org.economicSector || "",
            city: org.city || "",
            department: org.department || "",
            employeeCount: org.employeeCount != null ? String(org.employeeCount) : "",
            contactName: org.contactName || "",
            contactEmail: org.contactEmail || ""
        });
        setOrgError(null);
        setShowEditOrgModal(true);
    };

    const handleEditOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingOrg(true);
        setOrgError(null);

        try {
            const res = await fetch(`/api/organizations/${orgId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orgForm)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al actualizar");

            setShowEditOrgModal(false);
            fetchData();
        } catch (err: unknown) {
            setOrgError(getErrorMessage(err));
        } finally {
            setSavingOrg(false);
        }
    };

    // --- Edit worker ---
    const openEditWorker = useCallback(async (w: Worker) => {
        setWorkerError(null);
        try {
            const res = await fetch(`/api/workers/${w.id}`);
            const full: FullWorkerRecord = await res.json();
            if (!res.ok) throw new Error("Error al cargar el trabajador");

            setEditingWorker(w);
            setEditWorkerForm({
                documentType: full.documentType || "CC",
                documentId: full.documentId || "",
                fullName: full.fullName || "",
                gender: full.gender || "",
                birthYear: full.birthYear != null ? String(full.birthYear) : "",
                birthDate: full.birthDate ? full.birthDate.substring(0, 10) : "",
                maritalStatus: full.maritalStatus || "",
                educationLevel: full.educationLevel || "",
                profession: full.profession || "",
                jobTitle: full.jobTitle || "",
                jobLevel: full.jobLevel || "",
                residenceCity: full.residenceCity || "",
                residenceDepartment: full.residenceDepartment || "",
                socioeconomicStratum: full.socioeconomicStratum || "",
                housingType: full.housingType || "",
                dependentsCount: full.dependentsCount != null ? String(full.dependentsCount) : "",
                freeTimeUsage: full.freeTimeUsage || [],
                departmentArea: full.departmentArea || "",
                lessThanOneYearInCompany: full.lessThanOneYearInCompany || false,
                yearsInCompany: full.yearsInCompany != null ? String(full.yearsInCompany) : "",
                lessThanOneYearInPosition: full.lessThanOneYearInPosition || false,
                yearsInPosition: full.yearsInPosition != null ? String(full.yearsInPosition) : "",
                contractType: full.contractType || "",
                workSchedule: full.workSchedule || "",
                hoursPerDay: full.hoursPerDay != null ? String(full.hoursPerDay) : "",
                hoursPerWeek: full.hoursPerWeek != null ? String(full.hoursPerWeek) : "",
                paymentModality: full.paymentModality || "",
                workCity: full.workCity || "",
                workDepartment: full.workDepartment || "",
                transportMeans: full.transportMeans || "",
                displacementTime: full.displacementTime != null ? String(full.displacementTime) : "",
                hasCustomerInteraction: full.hasCustomerInteraction ?? true,
            });
            setShowEditWorkerModal(true);
        } catch (err: unknown) {
            setWorkerError(getErrorMessage(err));
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && workers.length > 0 && !showEditWorkerModal) {
            const params = new URLSearchParams(window.location.search);
            const editWorkerId = params.get("editWorker");
            if (editWorkerId) {
                const w = workers.find(worker => worker.id === editWorkerId);
                if (w) {
                    openEditWorker(w);
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, '', newUrl);
                }
            }
        }
    }, [workers, openEditWorker, showEditWorkerModal]);

    const handleEditWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWorker) return;
        setSavingWorker(true);
        setWorkerError(null);

        try {
            const res = await fetch(`/api/workers/${editingWorker.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editWorkerForm)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al actualizar");

            setShowEditWorkerModal(false);
            setEditingWorker(null);
            fetchData();
        } catch (err: unknown) {
            setWorkerError(getErrorMessage(err));
        } finally {
            setSavingWorker(false);
        }
    };

    // --- Archive worker ---
    // Ya no se borra: la evidencia del SG-SST debe conservarse 20 años
    // (Dec. 1072/2015 art. 2.2.4.6.13). El backend archiva y, si había
    // evaluaciones calificadas, responde 409 explicando por qué.
    const confirmArchiveWorker = async () => {
        if (!deletingWorker) return;
        setDeleteError(null);
        try {
            const res = await fetch(`/api/workers/${deletingWorker.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                setDeleteError(data.error || "Error al archivar");
                if (!data.archived) return;
            }
            setDeletingWorker(null);
            fetchData();
        } catch {
            setDeleteError("Error al archivar el trabajador");
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-4 w-48" />
                <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-6">
                    <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2.5">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
                <TableSkeleton columns={4} rows={5} />
            </div>
        );
    }

    if (!org) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold text-foreground">Organización no encontrada</h2>
                <Link href="/dashboard/organizations" className="text-primary font-semibold hover:underline mt-4 inline-block">
                    ← Volver a Mis Empresas
                </Link>
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-8"
            initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        >
            {/* Breadcrumbs */}
            <nav className="flex text-sm font-medium text-muted-foreground gap-2">
                <Link href="/dashboard/organizations" className="hover:text-primary transition-colors">Mis Empresas</Link>
                <span className="text-border">/</span>
                <span className="text-foreground font-semibold">{org.name}</span>
            </nav>

            {/* Org Header Card */}
            <div className="bg-card border border-border rounded-xl p-6 border-t-4 border-t-primary">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-primary/20">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-[26px] font-semibold text-foreground tracking-[-0.02em]">{org.name}</h1>
                            <span className="px-2.5 py-1 bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-widest rounded-md border border-border">
                                NIT: {org.nit}
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-y-2 gap-x-6 text-sm text-muted-foreground font-medium">
                            {org.city && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {org.city}{org.department ? `, ${org.department}` : ""}
                                </div>
                            )}
                            {org.economicSector && (
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    {org.economicSector}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {workers.length} trabajador{workers.length === 1 ? "" : "es"} registrado{workers.length === 1 ? "" : "s"}
                                {org.employeeCount ? ` (de ${org.employeeCount} declarados)` : ""}
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={openEditOrg}>
                            <Pencil className="w-4 h-4" />
                            Editar empresa
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reports Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href={`/dashboard/organizations/${orgId}/reports/sve`}
                    className="group p-5 bg-card border border-border rounded-xl transition-colors shadow-sm"
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-info)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "color-mix(in srgb, var(--color-info) 14%, transparent)", color: "var(--color-info)" }}
                        >
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-semibold text-foreground">Programa SVE</h3>
                            <p className="text-[12.5px] text-text-secondary">Vigilancia Epidemiológica · Res. 2764/2022</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href={`/dashboard/organizations/${orgId}/reports/diagnostic`}
                    className="group p-5 bg-card border border-border rounded-xl transition-colors shadow-sm"
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--color-teal-light)", color: "var(--color-teal-dark)" }}>
                            <FileBarChart className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-semibold text-foreground">Informe Diagnóstico</h3>
                            <p className="text-[12.5px] text-text-secondary">Resultados consolidados de riesgo organizacional.</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href={`/dashboard/organizations/${orgId}/reports/sociodemographic`}
                    className="group p-5 bg-card border border-border rounded-xl transition-colors shadow-sm"
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-success)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "color-mix(in srgb, var(--color-success) 14%, transparent)", color: "var(--color-success)" }}
                        >
                            <UserRound className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-semibold text-foreground">Perfil Sociodemográfico</h3>
                            <p className="text-[12.5px] text-text-secondary">Análisis de la población evaluada.</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Compliance Status */}
            <div className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">Estado de Cumplimiento SGSST</h2>
                <ComplianceStatusPanel orgId={orgId} />
            </div>

            {/* Expiring evaluations */}
            <ExpiringWorkersPanel orgId={orgId} />

            {/* AI Organizational Diagnostic */}
            <div className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">Diagnóstico IA</h2>
                <AIDiagnosticPanel orgId={orgId} orgName={org.name} />
            </div>

            {/* Metrics Dashboard */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground">Métricas de Evaluación</h2>
                    <CollectiveReportButton orgId={orgId} orgName={org.name} />
                </div>
                <OrgMetricsDashboard orgId={orgId} />
            </div>

            {/* Intervention Plan */}
            <div className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">Plan de Intervención</h2>
                <InterventionPlanPanel orgId={orgId} />
            </div>

            {/* Workers Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        Trabajadores Registrados
                        <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">{workers.length}</span>
                    </h2>
                    <div className="flex gap-2">
                        <a
                            href={`/api/workers/export?orgId=${orgId}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                            title="Exportar lista de trabajadores a CSV"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                            CSV
                        </a>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/organizations/${orgId}/import`}>
                                <Upload className="w-4 h-4" />
                                Carga Masiva
                            </Link>
                        </Button>
                        <Button size="sm" onClick={() => { setError(null); setShowModal(true); }}>
                            <Plus className="w-4 h-4" />
                            Agregar Trabajador
                        </Button>
                    </div>
                </div>

                {workers.length === 0 ? (
                    <div className="bg-card border-2 border-dashed border-border rounded-xl text-center py-16 px-6">
                        <div className="text-4xl mb-4">
                            <Users className="w-10 h-10 text-muted-foreground mx-auto" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Sin trabajadores registrados</h3>
                        <p className="text-sm text-muted-foreground mb-6">Debes registrar a los empleados para poder iniciar sus evaluaciones.</p>
                        <Button onClick={() => setShowModal(true)} className="mx-auto">Agregar Primer Trabajador</Button>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted border-b border-border text-muted-foreground uppercase font-bold tracking-wider text-[11px]">
                                    <tr>
                                        <th className="px-4 py-3">Nombre</th>
                                        <th className="px-4 py-3">Cargo / Nivel</th>
                                        <th className="px-4 py-3">Batería Reglamentaria</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {workers.map(w => (
                                        <tr key={w.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <Link href={`/dashboard/workers/${w.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                                                    {w.fullName}
                                                </Link>
                                                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{w.documentType} {w.documentId}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[12px] text-foreground">{w.jobTitle || <span className="text-muted-foreground italic">Sin cargo</span>}</span>
                                                <p className="text-[11px] text-primary font-semibold mt-0.5">{JOB_LEVEL_LABELS[w.jobLevel] || w.jobLevel}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <BatteryBadge label="Intra" slot={w.battery?.intra ?? null} workerId={w.id} orgId={orgId} type="INTRALABORAL" />
                                                    <BatteryBadge label="Extra" slot={w.battery?.extra ?? null} workerId={w.id} orgId={orgId} type="EXTRALABORAL" />
                                                    <BatteryBadge label="Estrés" slot={w.battery?.stress ?? null} workerId={w.id} orgId={orgId} type="STRESS" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditWorker(w)}
                                                        title="Editar trabajador"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setDeleteError(null); setDeletingWorker(w); }}
                                                        title="Archivar trabajador"
                                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                                                    >
                                                        <Archive className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal - Worker Creation */}
            {showModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={reduceMotion ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-card rounded-xl w-full max-w-3xl shadow-elevated border border-border overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground tracking-tight">Agregar Nuevo Trabajador</h2>
                                <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">Formulario de registro socio-demogr&aacute;fico</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreate} className="overflow-hidden flex flex-col">
                            <div className="p-8 overflow-y-auto space-y-8 scroll-smooth">
                                {error && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-bold flex items-center gap-2">
                                        <XCircle className="w-5 h-5" />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Nombre completo *</Label>
                                    <Input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label>Tipo doc.</Label>
                                        <select
                                            value={form.documentType}
                                            onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="CC">CC</option>
                                            <option value="CE">CE</option>
                                            <option value="TI">TI</option>
                                            <option value="PA">PA</option>
                                            <option value="OTHER">Otro</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Número de cédula *</Label>
                                        <Input required value={form.documentId} onChange={e => setForm(f => ({ ...f, documentId: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Forma del cuestionario intralaboral *</Label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="radio" name="intraFormType" checked={intraFormType === "A"} onChange={() => setIntraFormType("A")} />
                                            Forma A — Jefatura / Profesional / Técnico
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="radio" name="intraFormType" checked={intraFormType === "B"} onChange={() => setIntraFormType("B")} />
                                            Forma B — Auxiliar / Operativo
                                        </label>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    El resto de los datos sociodemográficos los diligencia el propio trabajador al entrar a su
                                    evaluación (enlace de la empresa).
                                </p>
                            </div>

                            <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={saving} className="px-10">
                                    {saving ? "Guardando..." : "Registrar Trabajador"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Modal - Edit Organization */}
            {showEditOrgModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={reduceMotion ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-card rounded-xl w-full max-w-lg shadow-elevated border border-border overflow-hidden"
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                            <h2 className="text-xl font-semibold text-foreground tracking-tight">Editar Empresa</h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowEditOrgModal(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleEditOrg}>
                            <div className="p-6 space-y-4">
                                {orgError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-bold flex items-center gap-2">
                                        <XCircle className="w-5 h-5" />
                                        {orgError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Nombre de la empresa *</Label>
                                    <Input required value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>NIT *</Label>
                                    <Input required value={orgForm.nit} onChange={e => setOrgForm(f => ({ ...f, nit: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Ciudad</Label>
                                        <Input value={orgForm.city} onChange={e => setOrgForm(f => ({ ...f, city: e.target.value }))} placeholder="Ej: Bogot&aacute;" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Departamento</Label>
                                        <Input value={orgForm.department} onChange={e => setOrgForm(f => ({ ...f, department: e.target.value }))} placeholder="Ej: Cundinamarca" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Sector Econ&oacute;mico</Label>
                                        <Input value={orgForm.economicSector} onChange={e => setOrgForm(f => ({ ...f, economicSector: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>N.&ordm; Empleados</Label>
                                        <Input type="number" value={orgForm.employeeCount} onChange={e => setOrgForm(f => ({ ...f, employeeCount: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Nombre de Contacto</Label>
                                    <Input value={orgForm.contactName} onChange={e => setOrgForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Ej: Mar&iacute;a L&oacute;pez" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email de Contacto</Label>
                                    <Input type="email" value={orgForm.contactEmail} onChange={e => setOrgForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="Ej: contacto@empresa.com" />
                                </div>
                            </div>

                            <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowEditOrgModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={savingOrg} className="px-10">
                                    {savingOrg ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Modal - Edit Worker */}
            {showEditWorkerModal && editingWorker && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={reduceMotion ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-card rounded-xl w-full max-w-3xl shadow-elevated border border-border overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground tracking-tight">Editar Trabajador</h2>
                                <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">{editingWorker.fullName}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowEditWorkerModal(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleEditWorker} className="overflow-hidden flex flex-col">
                            <div className="p-8 overflow-y-auto space-y-8 scroll-smooth">
                                {workerError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-bold flex items-center gap-2">
                                        <XCircle className="w-5 h-5" />
                                        {workerError}
                                    </div>
                                )}

                                <WorkerFormFields form={editWorkerForm} setForm={setEditWorkerForm} organizationId={orgId} />
                            </div>

                            <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowEditWorkerModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={savingWorker} className="px-10">
                                    {savingWorker ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Confirm archive worker */}
            <AlertDialog open={!!deletingWorker} onOpenChange={(open) => { if (!open) { setDeletingWorker(null); setDeleteError(null); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archivar trabajador</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Archivar a <strong>{deletingWorker?.fullName}</strong>? Dejará de aparecer en los listados,
                            pero su historial de evaluaciones se conserva como evidencia del SG-SST (Dec. 1072/2015, art. 2.2.4.6.13).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <p className="text-sm text-destructive">{deleteError}</p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmArchiveWorker(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Archivar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}

