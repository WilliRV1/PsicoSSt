"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Worker {
    id: string;
    fullName: string;
    documentType: string;
    documentId: string;
    jobTitle: string | null;
    jobLevel: string;
    educationLevel: string;
    area?: string;
    departmentArea: string | null;
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
}

const JOB_LEVEL_LABELS: Record<string, string> = {
    JEFATURA: "Jefatura",
    PROFESIONAL: "Profesional",
    TECNICO: "Técnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo"
};

const EDUCATION_LABELS: Record<string, string> = {
    PRIMARIA: "Primaria",
    BACHILLERATO: "Bachillerato",
    TECNICO_TECNOLOGO: "Técnico/Tecnólogo",
    PROFESIONAL: "Profesional",
    ESPECIALIZACION: "Especialización",
    MAESTRIA: "Maestría",
    DOCTORADO: "Doctorado"
};

const MARITAL_STATUS_LABELS: Record<string, string> = {
    "SOLTERO": "Soltero/a",
    "CASADO": "Casado/a",
    "UNION_LIBRE": "Unión Libre",
    "DIVORCIADO": "Divorciado/a",
    "VIUDO": "Viudo/a"
};

const HOUSING_LABELS: Record<string, string> = {
    "PROPIA": "Propia",
    "ARRENDADA": "Arrendada",
    "FAMILIAR": "Familiar",
    "OTRA": "Otra"
};

const TRANSPORT_LABELS: Record<string, string> = {
    "CAMINANDO": "Caminando",
    "BICICLETA": "Bicicleta",
    "MOTOCICLETA": "Motocicleta",
    "VEHICULO_PARTICULAR": "Vehículo Particular",
    "TRANSPORTE_MASIVO": "Transporte Masivo",
    "TRANSPORTE_PUBLICO": "Transporte Público",
    "TRANSPORTE_EMPRESA": "Transporte de Empresa",
    "OTRO": "Otro"
};

export default function OrganizationDetailPage() {
    const params = useParams();
    const orgId = params.orgId as string;

    const [org, setOrg] = useState<Organization | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
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
    });

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
            setForm({
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
                freeTimeUsage: [],
                yearsInCompany: "",
                yearsInPosition: "",
                contractType: "INDEFINIDO",
                workSchedule: "DIURNA",
                hoursPerWeek: "48",
                transportMeans: "TRANSPORTE_PUBLICO",
                displacementTime: "",
                hasCustomerInteraction: true
            });
            fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "#0f0f23", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Cargando...
            </div>
        );
    }

    if (!org) {
        return (
            <div style={{ minHeight: "100vh", background: "#0f0f23", color: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                <span style={{ fontSize: "3rem" }}>🚫</span>
                <h1>Organización no encontrada</h1>
                <Link href="/dashboard/organizations" style={{ color: "#6366f1" }}>← Volver a Mis Empresas</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#0f0f23", color: "#e2e8f0" }}>
            {/* Nav */}
            <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", borderBottom: "1px solid rgba(99,102,241,0.1)", background: "rgba(15,15,35,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "#f1f5f9" }}>
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="10" fill="url(#g2)" />
                            <path d="M12 20C12 15.58 15.58 12 20 12C24.42 12 28 15.58 28 20C28 24.42 24.42 28 20 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M20 16V24M16 20H24" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            <defs><linearGradient id="g2" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
                        </svg>
                        <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>PsicoSST</span>
                    </Link>
                </div>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                    <Link href="/dashboard" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#94a3b8", textDecoration: "none" }}>Dashboard</Link>
                    <Link href="/dashboard/organizations" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#f1f5f9", textDecoration: "none" }}>Empresas</Link>
                    <Link href="/dashboard/assessments" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#94a3b8", textDecoration: "none" }}>Evaluaciones</Link>
                </div>
            </nav>

            {/* Content */}
            <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }}>
                {/* Breadcrumbs */}
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <Link href="/dashboard/organizations" style={{ color: "#6366f1", textDecoration: "none" }}>Mis Empresas</Link>
                    <span>›</span>
                    <span style={{ color: "#94a3b8" }}>{org.name}</span>
                </div>

                {/* Org Header Card */}
                <div style={{ background: "rgba(30,30,60,0.6)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "16px", padding: "2rem", marginBottom: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem" }}>🏢</div>
                            <div>
                                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>{org.name}</h1>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
                                    <span>📋 NIT: {org.nit}</span>
                                    {org.city && <span>📍 {org.city}{org.department ? `, ${org.department}` : ""}</span>}
                                    {org.economicSector && <span>🏭 {org.economicSector}</span>}
                                    {org.employeeCount && <span>👥 {org.employeeCount} empleados (declarados)</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reports Quick Access */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
                    <Link href={`/dashboard/organizations/${orgId}/reports/diagnostic`} style={{ textDecoration: "none" }}>
                        <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "16px", padding: "1.5rem", transition: "transform 0.2s", cursor: "pointer" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ fontSize: "1.5rem" }}>📊</div>
                                <div>
                                    <h3 style={{ color: "white", fontSize: "1rem", margin: 0 }}>Informe Diagnóstico</h3>
                                    <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>Resumen de riesgos anónimo para la empresa</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                    <Link href={`/dashboard/organizations/${orgId}/reports/sociodemographic`} style={{ textDecoration: "none" }}>
                        <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "16px", padding: "1.5rem", transition: "transform 0.2s", cursor: "pointer" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ fontSize: "1.5rem" }}>🧬</div>
                                <div>
                                    <h3 style={{ color: "white", fontSize: "1rem", margin: 0 }}>Perfil Sociodemográfico</h3>
                                    <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>Análisis epidemiológico de la población</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Workers Section */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Trabajadores ({workers.length})
                    </h2>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link
                            href={`/dashboard/organizations/${orgId}/import`}
                            style={{ padding: "0.5rem 1.25rem", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", borderRadius: "10px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}
                        >
                            📥 Importar CSV
                        </Link>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{ padding: "0.5rem 1.25rem", background: "#6366f1", color: "white", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                        >
                            <span style={{ fontSize: "1.1rem" }}>+</span> Agregar Trabajador
                        </button>
                    </div>
                </div>

                {workers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem", background: "rgba(30,30,60,0.4)", borderRadius: "16px", border: "2px dashed rgba(99,102,241,0.2)" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👤</div>
                        <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Sin trabajadores</h3>
                        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Agrega al menos un trabajador para evaluarlo.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{ padding: "0.75rem 2rem", background: "#6366f1", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}
                        >
                            Agregar Primer Trabajador
                        </button>
                    </div>
                ) : (
                    <div style={{ background: "rgba(30,30,60,0.4)", borderRadius: "16px", border: "1px solid rgba(99,102,241,0.1)", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
                                    <th style={thStyle}>Nombre</th>
                                    <th style={thStyle}>Documento</th>
                                    <th style={thStyle}>Cargo</th>
                                    <th style={thStyle}>Nivel</th>
                                    <th style={thStyle}>Educación</th>
                                    <th style={thStyle}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers.map(w => (
                                    <tr key={w.id} style={{ borderBottom: "1px solid rgba(99,102,241,0.05)" }}>
                                        <td style={tdStyle}>
                                            <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{w.fullName}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{w.documentType}: {w.documentId}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ color: "#94a3b8" }}>{w.jobTitle || "—"}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ padding: "0.2rem 0.6rem", background: "rgba(99,102,241,0.15)", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, color: "#818cf8" }}>
                                                {JOB_LEVEL_LABELS[w.jobLevel] || w.jobLevel}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                                                {EDUCATION_LABELS[w.educationLevel] || w.educationLevel}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <Link
                                                href={`/dashboard/assessments/new/manual`}
                                                style={{ padding: "0.35rem 0.8rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", color: "#34d399", textDecoration: "none", fontSize: "0.75rem", fontWeight: 600 }}
                                            >
                                                Evaluar
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Add Worker Modal */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
                    <div style={{ background: "#1e1e3c", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: "800px", maxHeight: "90vh", border: "1px solid rgba(99,102,241,0.2)", display: "flex", flexDirection: "column" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Agregar Trabajador</h2>

                        {error && (
                            <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreate} style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            <div style={{ overflowY: "auto", paddingRight: "1rem", flex: 1 }}>
                                {/* Section 1: Basic Info */}
                                <div style={{ marginBottom: "2rem" }}>
                                    <h3 style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: "1rem", borderBottom: "1px solid rgba(99,102,241,0.1)", paddingBottom: "0.5rem" }}>Información Básica</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                        <div style={{ gridColumn: "span 2" }}>
                                            <label style={labelStyle}>Nombre completo *</label>
                                            <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Ej: María García López" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Tipo Doc. *</label>
                                            <select value={form.documentType} onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))} style={inputStyle}>
                                                <option value="CC">C.C.</option>
                                                <option value="CE">C.E.</option>
                                                <option value="TI">T.I.</option>
                                                <option value="PA">Pasaporte</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>N.º Documento *</label>
                                            <input required value={form.documentId} onChange={e => setForm(f => ({ ...f, documentId: e.target.value }))} placeholder="Ej: 1023456789" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Sexo *</label>
                                            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={inputStyle}>
                                                <option value="F">Femenino</option>
                                                <option value="M">Masculino</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Fecha de Nacimiento</label>
                                            <input type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} style={inputStyle} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Professional Info */}
                                <div style={{ marginBottom: "2rem" }}>
                                    <h3 style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: "1rem", borderBottom: "1px solid rgba(99,102,241,0.1)", paddingBottom: "0.5rem" }}>Información Profesional</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                        <div>
                                            <label style={labelStyle}>Cargo</label>
                                            <input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Nivel de cargo *</label>
                                            <select value={form.jobLevel} onChange={e => setForm(f => ({ ...f, jobLevel: e.target.value }))} style={inputStyle}>
                                                <option value="JEFATURA">Jefatura / Directivo</option>
                                                <option value="PROFESIONAL">Profesional / Técnico</option>
                                                <option value="AUXILIAR">Auxiliar / Operativo</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Nivel Educativo *</label>
                                            <select value={form.educationLevel} onChange={e => setForm(f => ({ ...f, educationLevel: e.target.value }))} style={inputStyle}>
                                                {Object.entries(EDUCATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Área / Departamento</label>
                                            <input value={form.departmentArea} onChange={e => setForm(f => ({ ...f, departmentArea: e.target.value }))} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Años en la empresa</label>
                                            <input type="number" value={form.yearsInCompany} onChange={e => setForm(f => ({ ...f, yearsInCompany: e.target.value }))} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Años en el cargo actual</label>
                                            <input type="number" value={form.yearsInPosition} onChange={e => setForm(f => ({ ...f, yearsInPosition: e.target.value }))} style={inputStyle} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Sociodemographic */}
                                <div style={{ marginBottom: "2rem" }}>
                                    <h3 style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: "1rem", borderBottom: "1px solid rgba(99,102,241,0.1)", paddingBottom: "0.5rem" }}>Información Sociodemográfica</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                        <div>
                                            <label style={labelStyle}>Estado Civil</label>
                                            <select value={form.maritalStatus} onChange={e => setForm(f => ({ ...f, maritalStatus: e.target.value }))} style={inputStyle}>
                                                {Object.entries(MARITAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Estrato Socioeconómico</label>
                                            <select value={form.socioeconomicStratum} onChange={e => setForm(f => ({ ...f, socioeconomicStratum: e.target.value }))} style={inputStyle}>
                                                {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={String(s)}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Ciudad de Residencia</label>
                                            <input value={form.residenceCity} onChange={e => setForm(f => ({ ...f, residenceCity: e.target.value }))} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Tipo de Vivienda</label>
                                            <select value={form.housingType} onChange={e => setForm(f => ({ ...f, housingType: e.target.value }))} style={inputStyle}>
                                                {Object.entries(HOUSING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Lifestyle & Transport */}
                                <div style={{ marginBottom: "1rem" }}>
                                    <h3 style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: "1rem", borderBottom: "1px solid rgba(99,102,241,0.1)", paddingBottom: "0.5rem" }}>Transporte y Estilo de Vida</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                        <div>
                                            <label style={labelStyle}>Medio de Transporte</label>
                                            <select value={form.transportMeans} onChange={e => setForm(f => ({ ...f, transportMeans: e.target.value }))} style={inputStyle}>
                                                {Object.entries(TRANSPORT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Tiempo desplazamiento (min)</label>
                                            <input type="number" value={form.displacementTime} onChange={e => setForm(f => ({ ...f, displacementTime: e.target.value }))} style={inputStyle} />
                                        </div>
                                        <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <input type="checkbox" checked={form.hasCustomerInteraction} onChange={e => setForm(f => ({ ...f, hasCustomerInteraction: e.target.checked }))} style={{ width: "1rem", height: "1rem", cursor: "pointer" }} />
                                            <label style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>¿Tiene trato directo con público / clientes? *</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end", padding: "1rem 0 0", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
                                <button type="button" onClick={() => { setShowModal(false); setError(null); }} style={{ padding: "0.75rem 1.5rem", background: "transparent", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "10px", color: "#94a3b8", fontWeight: 600, cursor: "pointer" }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} style={{ padding: "0.75rem 1.5rem", background: "#6366f1", border: "none", borderRadius: "10px", color: "white", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                                    {saving ? "Guardando..." : "Agregar Trabajador"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.375rem"
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "rgba(15,15,35,0.8)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: "10px",
    color: "#e2e8f0",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box"
};

const thStyle: React.CSSProperties = {
    padding: "0.875rem 1rem",
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    textAlign: "left",
    background: "rgba(15,15,35,0.4)"
};

const tdStyle: React.CSSProperties = {
    padding: "0.875rem 1rem",
    fontSize: "0.875rem"
};
