"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Upload, MapPin, Building2, Users, Loader2, XCircle, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OrgMetricsDashboard from "@/components/organizations/org-metrics-dashboard";
import InterventionPlanPanel from "@/components/organizations/intervention-plan-panel";
import CollectiveReportButton from "@/components/organizations/collective-report-button";
import { ComplianceStatusPanel } from "@/components/organizations/compliance-status-panel";
import { ExpiringWorkersPanel } from "@/components/organizations/expiring-workers-panel";

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

const JOB_LEVEL_LABELS: Record<string, string> = {
    JEFATURA: "Jefatura",
    PROFESIONAL: "Profesional",
    TECNICO: "T\u00e9cnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo"
};

const EDUCATION_LABELS: Record<string, string> = {
    PRIMARIA: "Primaria",
    BACHILLERATO: "Bachillerato",
    TECNICO: "T\u00e9cnico",
    TECNOLOGO: "Tecn\u00f3logo",
    TECNICO_TECNOLOGO: "T\u00e9cnico/Tecn\u00f3logo",
    PROFESIONAL: "Profesional",
    ESPECIALIZACION: "Especializaci\u00f3n",
    MAESTRIA: "Maestr\u00eda",
    DOCTORADO: "Doctorado"
};

const SELECT_CLASS = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:border-ring";

const EMPTY_WORKER_FORM = {
    documentType: "CC",
    documentId: "",
    fullName: "",
    gender: "F",
    birthDate: "",
    maritalStatus: "SOLTERO",
    jobTitle: "",
    jobLevel: "PROFESIONAL",
    educationLevel: "PROFESIONAL",
    departmentArea: "",
    residenceCity: "",
    socioeconomicStratum: "1",
    housingType: "PROPIA",
    dependentsCount: "0",
    freeTimeUsage: [] as string[],
    yearsInCompany: "",
    yearsInPosition: "",
    contractType: "INDEFINIDO",
    workSchedule: "DIURNA",
    hoursPerWeek: "48",
    transportMeans: "TRANSPORTE_PUBLICO",
    displacementTime: "",
    hasCustomerInteraction: true
};

export default function OrganizationDetailPage() {
    const params = useParams();
    const orgId = params.orgId as string;

    const [org, setOrg] = useState<Organization | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);

    // Create worker modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_WORKER_FORM });

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
            const res = await fetch("/api/workers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, organizationId: orgId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al crear");

            setShowModal(false);
            setForm({ ...EMPTY_WORKER_FORM });
            fetchData();
        } catch (err: any) {
            setError(err.message);
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
        } catch (err: any) {
            setOrgError(err.message);
        } finally {
            setSavingOrg(false);
        }
    };

    // --- Edit worker ---
    const openEditWorker = (w: Worker) => {
        setEditingWorker(w);
        setEditWorkerForm({
            documentType: w.documentType || "CC",
            documentId: w.documentId || "",
            fullName: w.fullName || "",
            gender: w.gender || "F",
            birthDate: w.birthDate ? w.birthDate.substring(0, 10) : "",
            maritalStatus: w.maritalStatus || "SOLTERO",
            jobTitle: w.jobTitle || "",
            jobLevel: w.jobLevel || "PROFESIONAL",
            educationLevel: w.educationLevel || "PROFESIONAL",
            departmentArea: w.departmentArea || "",
            residenceCity: w.residenceCity || "",
            socioeconomicStratum: "1",
            housingType: "PROPIA",
            dependentsCount: "0",
            freeTimeUsage: [],
            yearsInCompany: w.yearsInCompany != null ? String(w.yearsInCompany) : "",
            yearsInPosition: w.yearsInPosition != null ? String(w.yearsInPosition) : "",
            contractType: w.contractType || "INDEFINIDO",
            workSchedule: w.workSchedule || "DIURNA",
            hoursPerWeek: w.hoursPerWeek != null ? String(w.hoursPerWeek) : "48",
            transportMeans: "TRANSPORTE_PUBLICO",
            displacementTime: "",
            hasCustomerInteraction: true
        });
        setWorkerError(null);
        setShowEditWorkerModal(true);
    };

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
        } catch (err: any) {
            setWorkerError(err.message);
        } finally {
            setSavingWorker(false);
        }
    };

    // --- Delete worker ---
    const handleDeleteWorker = async (w: Worker) => {
        if (!confirm(`¿Eliminar al trabajador "${w.fullName}"? Esta acción no se puede deshacer.`)) return;

        try {
            const res = await fetch(`/api/workers/${w.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Error al eliminar");
                return;
            }
            fetchData();
        } catch {
            alert("Error al eliminar el trabajador");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        );
    }

    if (!org) {
        return (
            <div className="text-center py-20 animate-in">
                <h2 className="text-2xl font-bold text-foreground">Organizaci&oacute;n no encontrada</h2>
                <Link href="/dashboard/organizations" className="text-primary font-bold hover:underline mt-4 inline-block">
                    &larr; Volver a Mis Empresas
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in">
            {/* Breadcrumbs */}
            <nav className="flex text-sm font-medium text-muted-foreground gap-2">
                <Link href="/dashboard/organizations" className="hover:text-primary transition-colors">Mis Empresas</Link>
                <span className="text-border">/</span>
                <span className="text-foreground font-bold">{org.name}</span>
            </nav>

            {/* Org Header Card */}
            <div className="bg-card border border-border rounded-xl p-6 border-t-4 border-t-primary">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-primary/20">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-black text-foreground tracking-tight">{org.name}</h1>
                            <span className="px-2.5 py-1 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-md border border-border">
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
                                {org.employeeCount || 0} empleados declarados
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href={`/dashboard/organizations/${orgId}/reports/diagnostic`} className="group p-6 bg-card border border-border rounded-2xl hover:border-primary hover:ring-1 hover:ring-primary transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-blue-950 dark:text-blue-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Informe Diagn&oacute;stico</h3>
                            <p className="text-sm text-muted-foreground font-medium">Resultados consolidados de riesgo organizacional.</p>
                        </div>
                    </div>
                </Link>
                <Link href={`/dashboard/organizations/${orgId}/reports/sociodemographic`} className="group p-6 bg-card border border-border rounded-2xl hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors dark:bg-emerald-950 dark:text-emerald-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-600 transition-colors">Perfil Sociodemogr&aacute;fico</h3>
                            <p className="text-sm text-muted-foreground font-medium">An&aacute;lisis de la poblaci&oacute;n evaluada.</p>
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
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        Trabajadores Registrados
                        <span className="bg-primary/10 text-primary text-xs font-black px-2 py-0.5 rounded-full">{workers.length}</span>
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
                                        <th className="px-6 py-4">Nombre</th>
                                        <th className="px-6 py-4">Documento</th>
                                        <th className="px-6 py-4">Cargo</th>
                                        <th className="px-6 py-4">Nivel / Educaci&oacute;n</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {workers.map(w => (
                                        <tr key={w.id} className="hover:bg-muted/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link href={`/dashboard/workers/${w.id}`} className="font-bold text-foreground hover:text-primary transition-colors hover:underline">
                                                    {w.fullName}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-medium">
                                                {w.documentType} {w.documentId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-foreground/80">
                                                {w.jobTitle || <span className="text-muted-foreground/50 italic">No asignado</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-primary font-bold text-[10px] uppercase tracking-tighter">{JOB_LEVEL_LABELS[w.jobLevel] || w.jobLevel}</span>
                                                    <span className="text-muted-foreground text-[11px] font-medium">{EDUCATION_LABELS[w.educationLevel] || w.educationLevel}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/dashboard/assessments/new/manual?workerId=${w.id}`}>
                                                            Evaluar
                                                        </Link>
                                                    </Button>
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
                                                        onClick={() => handleDeleteWorker(w)}
                                                        title="Eliminar trabajador"
                                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
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
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
                    <div className="bg-card rounded-2xl w-full max-w-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                            <div>
                                <h2 className="text-xl font-black text-foreground tracking-tight">Agregar Nuevo Trabajador</h2>
                                <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">Formulario de registro socio-demogr&aacute;fico</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreate} className="overflow-hidden flex flex-col">
                            <div className="p-8 overflow-y-auto space-y-8 scroll-smooth">
                                {error && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-bold flex items-center gap-2 animate-in">
                                        <XCircle className="w-5 h-5" />
                                        {error}
                                    </div>
                                )}

                                {/* Section 1: Basic Info */}
                                <div>
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        1. Identificaci&oacute;n y Personales
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2 space-y-2">
                                            <Label>Nombre completo *</Label>
                                            <Input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Ej: Juan P&eacute;rez" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tipo de Documento</Label>
                                            <select value={form.documentType} onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))} className={SELECT_CLASS}>
                                                <option value="CC">C&eacute;dula de Ciudadan&iacute;a</option>
                                                <option value="CE">C&eacute;dula de Extranjer&iacute;a</option>
                                                <option value="TI">Tarjeta de Identidad</option>
                                                <option value="PA">Pasaporte</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>N&uacute;mero de Documento *</Label>
                                            <Input required value={form.documentId} onChange={e => setForm(f => ({ ...f, documentId: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Sexo</Label>
                                            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className={SELECT_CLASS}>
                                                <option value="F">Femenino</option>
                                                <option value="M">Masculino</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fecha de Nacimiento</Label>
                                            <Input type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Professional Info */}
                                <div>
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        2. Perfil Laboral
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Cargo / Puesto</Label>
                                            <Input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nivel jer&aacute;rquico *</Label>
                                            <select value={form.jobLevel} onChange={e => setForm(f => ({ ...f, jobLevel: e.target.value }))} className={SELECT_CLASS}>
                                                {Object.entries(JOB_LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nivel de estudios *</Label>
                                            <select value={form.educationLevel} onChange={e => setForm(f => ({ ...f, educationLevel: e.target.value }))} className={SELECT_CLASS}>
                                                {Object.entries(EDUCATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>&Aacute;rea / Departamento</Label>
                                            <Input value={form.departmentArea} onChange={e => setForm(f => ({ ...f, departmentArea: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={saving} className="px-10">
                                    {saving ? "Guardando..." : "Registrar Trabajador"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal - Edit Organization */}
            {showEditOrgModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
                    <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                            <h2 className="text-xl font-black text-foreground tracking-tight">Editar Empresa</h2>
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
                    </div>
                </div>
            )}

            {/* Modal - Edit Worker */}
            {showEditWorkerModal && editingWorker && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
                    <div className="bg-card rounded-2xl w-full max-w-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50">
                            <div>
                                <h2 className="text-xl font-black text-foreground tracking-tight">Editar Trabajador</h2>
                                <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">{editingWorker.fullName}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowEditWorkerModal(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleEditWorker} className="overflow-hidden flex flex-col">
                            <div className="p-8 overflow-y-auto space-y-8 scroll-smooth">
                                {workerError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-bold flex items-center gap-2 animate-in">
                                        <XCircle className="w-5 h-5" />
                                        {workerError}
                                    </div>
                                )}

                                {/* Section 1: Identification */}
                                <div>
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        1. Identificaci&oacute;n y Personales
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2 space-y-2">
                                            <Label>Nombre completo *</Label>
                                            <Input required value={editWorkerForm.fullName} onChange={e => setEditWorkerForm(f => ({ ...f, fullName: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tipo de Documento</Label>
                                            <select value={editWorkerForm.documentType} onChange={e => setEditWorkerForm(f => ({ ...f, documentType: e.target.value }))} className={SELECT_CLASS}>
                                                <option value="CC">C&eacute;dula de Ciudadan&iacute;a</option>
                                                <option value="CE">C&eacute;dula de Extranjer&iacute;a</option>
                                                <option value="TI">Tarjeta de Identidad</option>
                                                <option value="PA">Pasaporte</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>N&uacute;mero de Documento</Label>
                                            <Input value={editWorkerForm.documentId} onChange={e => setEditWorkerForm(f => ({ ...f, documentId: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Sexo</Label>
                                            <select value={editWorkerForm.gender} onChange={e => setEditWorkerForm(f => ({ ...f, gender: e.target.value }))} className={SELECT_CLASS}>
                                                <option value="F">Femenino</option>
                                                <option value="M">Masculino</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fecha de Nacimiento</Label>
                                            <Input type="date" value={editWorkerForm.birthDate} onChange={e => setEditWorkerForm(f => ({ ...f, birthDate: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Professional Info */}
                                <div>
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        2. Perfil Laboral
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Cargo / Puesto</Label>
                                            <Input value={editWorkerForm.jobTitle} onChange={e => setEditWorkerForm(f => ({ ...f, jobTitle: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nivel jer&aacute;rquico *</Label>
                                            <select value={editWorkerForm.jobLevel} onChange={e => setEditWorkerForm(f => ({ ...f, jobLevel: e.target.value }))} className={SELECT_CLASS}>
                                                {Object.entries(JOB_LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nivel de estudios *</Label>
                                            <select value={editWorkerForm.educationLevel} onChange={e => setEditWorkerForm(f => ({ ...f, educationLevel: e.target.value }))} className={SELECT_CLASS}>
                                                {Object.entries(EDUCATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>&Aacute;rea / Departamento</Label>
                                            <Input value={editWorkerForm.departmentArea} onChange={e => setEditWorkerForm(f => ({ ...f, departmentArea: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ciudad de residencia</Label>
                                            <Input value={editWorkerForm.residenceCity} onChange={e => setEditWorkerForm(f => ({ ...f, residenceCity: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>A&ntilde;os en la empresa</Label>
                                            <Input type="number" min="0" value={editWorkerForm.yearsInCompany} onChange={e => setEditWorkerForm(f => ({ ...f, yearsInCompany: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>A&ntilde;os en el cargo</Label>
                                            <Input type="number" min="0" value={editWorkerForm.yearsInPosition} onChange={e => setEditWorkerForm(f => ({ ...f, yearsInPosition: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tipo de contrato</Label>
                                            <select value={editWorkerForm.contractType} onChange={e => setEditWorkerForm(f => ({ ...f, contractType: e.target.value }))} className={SELECT_CLASS}>
                                                <option value="INDEFINIDO">Indefinido</option>
                                                <option value="FIJO">Fijo</option>
                                                <option value="OBRA_LABOR">Obra y labor</option>
                                                <option value="PRESTACION_SERVICIOS">Prestaci&oacute;n de servicios</option>
                                                <option value="TEMPORAL">Temporal</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Jornada laboral</Label>
                                            <select value={editWorkerForm.workSchedule} onChange={e => setEditWorkerForm(f => ({ ...f, workSchedule: e.target.value }))} className={SELECT_CLASS}>
                                                <option value="DIURNA">Diurna</option>
                                                <option value="NOCTURNA">Nocturna</option>
                                                <option value="MIXTA">Mixta</option>
                                                <option value="ROTATIVA">Rotativa</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Horas por semana</Label>
                                            <Input type="number" min="1" max="168" value={editWorkerForm.hoursPerWeek} onChange={e => setEditWorkerForm(f => ({ ...f, hoursPerWeek: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowEditWorkerModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={savingWorker} className="px-10">
                                    {savingWorker ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
