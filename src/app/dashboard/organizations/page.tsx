"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Organization {
    id: string;
    name: string;
    nit: string;
    economicSector: string | null;
    city: string | null;
    department: string | null;
    employeeCount: number | null;
    createdAt: string;
    _count: { workers: number };
}

export default function OrganizationsPage() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: "",
        nit: "",
        economicSector: "",
        city: "",
        department: "",
        employeeCount: ""
    });

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al crear");

            setShowModal(false);
            setForm({ name: "", nit: "", economicSector: "", city: "", department: "", employeeCount: "" });
            fetchOrgs();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#0f0f23", color: "#e2e8f0" }}>
            {/* Nav */}
            <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", borderBottom: "1px solid rgba(99,102,241,0.1)", background: "rgba(15,15,35,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "#f1f5f9" }}>
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="10" fill="url(#g)" />
                            <path d="M12 20C12 15.58 15.58 12 20 12C24.42 12 28 15.58 28 20C28 24.42 24.42 28 20 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M20 16V24M16 20H24" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            <defs><linearGradient id="g" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>Mis Empresas</h1>
                        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Gestiona las organizaciones que evalúas</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{ padding: "0.75rem 1.5rem", background: "#6366f1", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                    >
                        <span style={{ fontSize: "1.25rem" }}>+</span> Nueva Empresa
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>Cargando...</div>
                ) : orgs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem", background: "rgba(30,30,60,0.4)", borderRadius: "16px", border: "2px dashed rgba(99,102,241,0.2)" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏢</div>
                        <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Sin empresas registradas</h2>
                        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Crea tu primera empresa para comenzar a evaluar trabajadores.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{ padding: "0.75rem 2rem", background: "#6366f1", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}
                        >
                            Crear Primera Empresa
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                        {orgs.map(org => (
                            <Link
                                key={org.id}
                                href={`/dashboard/organizations/${org.id}`}
                                style={{ textDecoration: "none", color: "inherit", display: "block", background: "rgba(30,30,60,0.6)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: "16px", padding: "1.5rem", transition: "all 0.2s" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6366f1"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🏢</div>
                                    <span style={{ fontSize: "0.75rem", color: "#64748b", background: "rgba(15,15,35,0.5)", padding: "0.25rem 0.5rem", borderRadius: "6px" }}>
                                        NIT: {org.nit}
                                    </span>
                                </div>
                                <h3 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#f1f5f9", marginBottom: "0.5rem" }}>{org.name}</h3>
                                <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
                                    <span>👥 {org._count.workers} trabajadores</span>
                                    {org.city && <span>📍 {org.city}</span>}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Modal */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
                    <div style={{ background: "#1e1e3c", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: "500px", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Nueva Empresa</h2>

                        {error && (
                            <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreate}>
                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div>
                                    <label style={labelStyle}>Nombre de la empresa *</label>
                                    <input
                                        required
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Ej: Empresa Demo S.A.S."
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>NIT *</label>
                                    <input
                                        required
                                        value={form.nit}
                                        onChange={e => setForm(f => ({ ...f, nit: e.target.value }))}
                                        placeholder="Ej: 900123456-1"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={labelStyle}>Ciudad</label>
                                        <input
                                            value={form.city}
                                            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                            placeholder="Ej: Bogotá"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Departamento</label>
                                        <input
                                            value={form.department}
                                            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                                            placeholder="Ej: Cundinamarca"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={labelStyle}>Sector Económico</label>
                                        <input
                                            value={form.economicSector}
                                            onChange={e => setForm(f => ({ ...f, economicSector: e.target.value }))}
                                            placeholder="Ej: Tecnología"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>N.º Empleados</label>
                                        <input
                                            type="number"
                                            value={form.employeeCount}
                                            onChange={e => setForm(f => ({ ...f, employeeCount: e.target.value }))}
                                            placeholder="Ej: 50"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setError(null); }}
                                    style={{ padding: "0.75rem 1.5rem", background: "transparent", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "10px", color: "#94a3b8", fontWeight: 600, cursor: "pointer" }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{ padding: "0.75rem 1.5rem", background: "#6366f1", border: "none", borderRadius: "10px", color: "white", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
                                >
                                    {saving ? "Guardando..." : "Crear Empresa"}
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
