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
    gender: "",
    birthYear: "",
    birthDate: "",
    maritalStatus: "",
    educationLevel: "",
    profession: "",
    jobTitle: "",
    jobLevel: "",
    residenceCity: "",
    residenceDepartment: "",
    socioeconomicStratum: "",
    housingType: "",
    dependentsCount: "",
    freeTimeUsage: [] as string[],
    departmentArea: "",
    lessThanOneYearInCompany: false,
    yearsInCompany: "",
    lessThanOneYearInPosition: false,
    yearsInPosition: "",
    contractType: "",
    workSchedule: "",
    hoursPerDay: "",
    hoursPerWeek: "",
    paymentModality: "",
    workCity: "",
    workDepartment: "",
    transportMeans: "",
    displacementTime: "",
    hasCustomerInteraction: true
};

const WorkerFormFields = ({ form, setForm }: { form: any, setForm: any }) => {
    return (
        <div className="space-y-8">
            {/* Section 1: Identification */}
            <div>
                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    1. Identificación y Personales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                        <Label>Nombre completo *</Label>
                        <Input required value={form.fullName} onChange={e => setForm((f:any) => ({ ...f, fullName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de Documento</Label>
                        <select value={form.documentType} onChange={e => setForm((f:any) => ({ ...f, documentType: e.target.value }))} className={SELECT_CLASS}>
                            <option value="CC">Cédula de Ciudadanía</option>
                            <option value="CE">Cédula de Extranjería</option>
                            <option value="TI">Tarjeta de Identidad</option>
                            <option value="PA">Pasaporte</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Número de Documento *</Label>
                        <Input required value={form.documentId} onChange={e => setForm((f:any) => ({ ...f, documentId: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Sexo</Label>
                        <select value={form.gender} onChange={e => setForm((f:any) => ({ ...f, gender: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="NO_BINARIO">No binario</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Año de nacimiento</Label>
                        <Input type="number" value={form.birthYear} onChange={e => setForm((f:any) => ({ ...f, birthYear: e.target.value }))} placeholder="Ej: 1990" />
                    </div>
                    <div className="space-y-2">
                        <Label>Estado Civil</Label>
                        <select value={form.maritalStatus} onChange={e => setForm((f:any) => ({ ...f, maritalStatus: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="Soltero">Soltero(a)</option>
                            <option value="Casado">Casado(a)</option>
                            <option value="Union_libre">Unión libre</option>
                            <option value="Separado">Separado(a)</option>
                            <option value="Divorciado">Divorciado(a)</option>
                            <option value="Viudo">Viudo(a)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Número de personas a cargo</Label>
                        <Input type="number" value={form.dependentsCount} onChange={e => setForm((f:any) => ({ ...f, dependentsCount: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <Label>Lugar de residencia (Ciudad)</Label>
                        <Input value={form.residenceCity} onChange={e => setForm((f:any) => ({ ...f, residenceCity: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Departamento de residencia</Label>
                        <Input value={form.residenceDepartment} onChange={e => setForm((f:any) => ({ ...f, residenceDepartment: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Estrato de servicios públicos</Label>
                        <select value={form.socioeconomicStratum} onChange={e => setForm((f:any) => ({ ...f, socioeconomicStratum: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="Finca">Finca</option>
                            <option value="No_se">No sé</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de vivienda</Label>
                        <select value={form.housingType} onChange={e => setForm((f:any) => ({ ...f, housingType: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="Propia">Propia</option>
                            <option value="Arriendo">En arriendo</option>
                            <option value="Familiar">Familiar</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Section 2: Professional Profile */}
            <div>
                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    2. Perfil Laboral
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Último nivel de estudios que alcanzó *</Label>
                        <select required value={form.educationLevel} onChange={e => setForm((f:any) => ({ ...f, educationLevel: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="Ninguno">Ninguno</option>
                            <option value="Primaria_incompleta">Primaria incompleta</option>
                            <option value="Primaria_completa">Primaria completa</option>
                            <option value="Bachillerato_incompleto">Bachillerato incompleto</option>
                            <option value="Bachillerato_completo">Bachillerato completo</option>
                            <option value="Tecnico_tecnologo_incompleto">Técnico/Tecnólogo incompleto</option>
                            <option value="Tecnico_tecnologo_completo">Técnico/Tecnólogo completo</option>
                            <option value="Profesional_incompleto">Profesional incompleto</option>
                            <option value="Profesional_completo">Profesional completo</option>
                            <option value="Posgrado_incompleto">Posgrado incompleto</option>
                            <option value="Posgrado_completo">Posgrado completo</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>¿Cuál es su ocupación o profesión?</Label>
                        <Input value={form.profession} onChange={e => setForm((f:any) => ({ ...f, profession: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Nombre del cargo que ocupa</Label>
                        <Input value={form.jobTitle} onChange={e => setForm((f:any) => ({ ...f, jobTitle: e.target.value }))} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Tipo de cargo que más se parece al suyo *</Label>
                        <select required value={form.jobLevel} onChange={e => setForm((f:any) => ({ ...f, jobLevel: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="JEFATURA">Jefatura - Dirección - Gerencia</option>
                            <option value="PROFESIONAL">Profesional - Analista - Técnico - Tecnólogo</option>
                            <option value="AUXILIAR">Auxiliar - Asistente Administrativo - Asistente Técnico</option>
                            <option value="OPERATIVO">Operario - Operador - Ayudante - Servicios Generales</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Departamento de la empresa (Área)</Label>
                        <Input value={form.departmentArea} onChange={e => setForm((f:any) => ({ ...f, departmentArea: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Ciudad donde trabaja actualmente</Label>
                        <Input value={form.workCity} onChange={e => setForm((f:any) => ({ ...f, workCity: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Departamento donde trabaja</Label>
                        <Input value={form.workDepartment} onChange={e => setForm((f:any) => ({ ...f, workDepartment: e.target.value }))} />
                    </div>
                </div>
            </div>

            {/* Section 3: Job Conditions */}
            <div>
                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    3. Condiciones de Trabajo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 border p-3 rounded-lg border-border">
                        <Label>Tiempo en la empresa</Label>
                        <div className="flex items-center gap-2 mt-2 mb-2">
                            <input type="checkbox" id="lessThanCompany" checked={form.lessThanOneYearInCompany} onChange={e => setForm((f:any) => ({ ...f, lessThanOneYearInCompany: e.target.checked, yearsInCompany: e.target.checked ? "0" : "" }))} />
                            <label htmlFor="lessThanCompany" className="text-sm">Menos de un año</label>
                        </div>
                        {!form.lessThanOneYearInCompany && (
                            <Input type="number" placeholder="Años en la empresa" value={form.yearsInCompany} onChange={e => setForm((f:any) => ({ ...f, yearsInCompany: e.target.value }))} />
                        )}
                    </div>
                    
                    <div className="space-y-2 border p-3 rounded-lg border-border">
                        <Label>Tiempo en el cargo</Label>
                        <div className="flex items-center gap-2 mt-2 mb-2">
                            <input type="checkbox" id="lessThanPosition" checked={form.lessThanOneYearInPosition} onChange={e => setForm((f:any) => ({ ...f, lessThanOneYearInPosition: e.target.checked, yearsInPosition: e.target.checked ? "0" : "" }))} />
                            <label htmlFor="lessThanPosition" className="text-sm">Menos de un año</label>
                        </div>
                        {!form.lessThanOneYearInPosition && (
                            <Input type="number" placeholder="Años en el cargo" value={form.yearsInPosition} onChange={e => setForm((f:any) => ({ ...f, yearsInPosition: e.target.value }))} />
                        )}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label>Tipo de contrato</Label>
                        <select value={form.contractType} onChange={e => setForm((f:any) => ({ ...f, contractType: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="Temporal_menos_1_ano">Temporal de menos de 1 año</option>
                            <option value="Temporal_1_ano_o_mas">Temporal de 1 año o más</option>
                            <option value="Termino_indefinido">Término indefinido</option>
                            <option value="Cooperado">Cooperado (Cooperativa)</option>
                            <option value="Prestacion_servicios">Prestación de servicios</option>
                            <option value="No_se">No sé</option>
                        </select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Horas diarias establecidas</Label>
                        <Input type="number" step="0.1" placeholder="Ej: 8.5" value={form.hoursPerDay} onChange={e => setForm((f:any) => ({ ...f, hoursPerDay: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de salario</Label>
                        <select value={form.paymentModality} onChange={e => setForm((f:any) => ({ ...f, paymentModality: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="Fijo">Fijo (Integral o mensual)</option>
                            <option value="Fijo_y_variable">Una parte fija y otra variable</option>
                            <option value="Todo_variable">Todo variable (A destajo, comisiones)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
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
    const openEditWorker = useCallback((w: any) => { setEditingWorker(w); setEditWorkerForm({ documentType: w.documentType || "CC", documentId: w.documentId || "", fullName: w.fullName || "", gender: w.gender || "", birthYear: w.birthYear != null ? String(w.birthYear) : "", birthDate: w.birthDate ? w.birthDate.substring(0, 10) : "", maritalStatus: w.maritalStatus || "", educationLevel: w.educationLevel || "", profession: w.profession || "", jobTitle: w.jobTitle || "", jobLevel: w.jobLevel || "", residenceCity: w.residenceCity || "", residenceDepartment: w.residenceDepartment || "", socioeconomicStratum: w.socioeconomicStratum || "", housingType: w.housingType || "", dependentsCount: w.dependentsCount != null ? String(w.dependentsCount) : "", freeTimeUsage: w.freeTimeUsage || [], departmentArea: w.departmentArea || "", lessThanOneYearInCompany: w.lessThanOneYearInCompany || false, yearsInCompany: w.yearsInCompany != null ? String(w.yearsInCompany) : "", lessThanOneYearInPosition: w.lessThanOneYearInPosition || false, yearsInPosition: w.yearsInPosition != null ? String(w.yearsInPosition) : "", contractType: w.contractType || "", workSchedule: w.workSchedule || "", hoursPerDay: w.hoursPerDay != null ? String(w.hoursPerDay) : "", hoursPerWeek: w.hoursPerWeek != null ? String(w.hoursPerWeek) : "", paymentModality: w.paymentModality || "", workCity: w.workCity || "", workDepartment: w.workDepartment || "", transportMeans: w.transportMeans || "", displacementTime: w.displacementTime != null ? String(w.displacementTime) : "", hasCustomerInteraction: w.hasCustomerInteraction ?? true }); setWorkerError(null); setShowEditWorkerModal(true); }, []);

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

                                <WorkerFormFields form={form} setForm={setForm} />
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

                                <WorkerFormFields form={editWorkerForm} setForm={setEditWorkerForm} />
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

