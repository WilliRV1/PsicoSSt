"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const SAMPLE_CSV = `documentType,documentId,fullName,jobTitle,jobLevel,educationLevel,departmentArea
CC,1023456789,María García López,Analista de Sistemas,PROFESIONAL,PROFESIONAL,Tecnología
CC,1087654321,Carlos Rodríguez,Coordinador,JEFATURA,ESPECIALIZACION,Gestión`;

interface ImportResult {
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: { row: number; column: string; message: string }[];
}

export default function ImportWorkersPage() {
    const params = useParams();
    const orgId = params.orgId as string;

    const [csvText, setCsvText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCsvText(ev.target?.result as string || "");
        };
        reader.readAsText(f);
    };

    const handleImport = async () => {
        if (!csvText.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/workers/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ organizationId: orgId, csvData: csvText })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error en la importación");
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#0f0f23", color: "#e2e8f0" }}>
            {/* Nav */}
            <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", borderBottom: "1px solid rgba(99,102,241,0.1)", background: "rgba(15,15,35,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
                <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "#f1f5f9" }}>
                    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="10" fill="url(#gi)" />
                        <path d="M12 20C12 15.58 15.58 12 20 12C24.42 12 28 15.58 28 20C28 24.42 24.42 28 20 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M20 16V24M16 20H24" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <defs><linearGradient id="gi" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
                    </svg>
                    <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>PsicoSST</span>
                </Link>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                    <Link href="/dashboard" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#94a3b8", textDecoration: "none" }}>Dashboard</Link>
                    <Link href="/dashboard/organizations" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#f1f5f9", textDecoration: "none" }}>Empresas</Link>
                    <Link href="/dashboard/assessments" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#94a3b8", textDecoration: "none" }}>Evaluaciones</Link>
                </div>
            </nav>

            <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
                {/* Breadcrumbs */}
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <Link href="/dashboard/organizations" style={{ color: "#6366f1", textDecoration: "none" }}>Mis Empresas</Link>
                    <span>›</span>
                    <Link href={`/dashboard/organizations/${orgId}`} style={{ color: "#6366f1", textDecoration: "none" }}>Detalle</Link>
                    <span>›</span>
                    <span style={{ color: "#94a3b8" }}>Importar Trabajadores</span>
                </div>

                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>📥 Carga Masiva de Trabajadores</h1>
                <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "2rem" }}>
                    Importa trabajadores desde un archivo CSV. Los existentes se actualizarán automáticamente.
                </p>

                {!result ? (
                    <>
                        {/* Format guide */}
                        <div style={{ background: "rgba(30,30,60,0.6)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem" }}>
                            <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Formato del CSV</h3>
                            <code style={{ display: "block", background: "rgba(15,15,35,0.8)", borderRadius: "8px", padding: "1rem", fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.8, whiteSpace: "pre-wrap", overflowX: "auto" }}>
                                {`documentType,documentId,fullName,jobTitle,jobLevel,educationLevel,departmentArea\nCC,1023456789,María García,Analista,PROFESIONAL,PROFESIONAL,Tecnología`}
                            </code>
                            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
                                <strong style={{ color: "#94a3b8" }}>jobLevel:</strong> JEFATURA, PROFESIONAL, TECNICO, AUXILIAR, OPERATIVO<br />
                                <strong style={{ color: "#94a3b8" }}>educationLevel:</strong> PRIMARIA, BACHILLERATO, TECNICO, TECNOLOGO, PROFESIONAL, ESPECIALIZACION, MAESTRIA, DOCTORADO<br />
                                <strong style={{ color: "#94a3b8" }}>documentType:</strong> CC, CE, TI, PA, OTHER
                            </div>
                        </div>

                        {/* File upload or paste */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                            <div style={{ background: "rgba(30,30,60,0.4)", border: "2px dashed rgba(99,102,241,0.2)", borderRadius: "14px", padding: "2rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}>
                                <input type="file" accept=".csv,.txt" onChange={handleFileLoad} style={{ display: "none" }} id="csv-upload" />
                                <label htmlFor="csv-upload" style={{ cursor: "pointer" }}>
                                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
                                    <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                                        {file ? file.name : "Subir Archivo CSV"}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Click para seleccionar</div>
                                </label>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <button
                                    onClick={() => setCsvText(SAMPLE_CSV)}
                                    style={{ padding: "0.5rem 1rem", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", color: "#818cf8", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", marginBottom: "0.5rem" }}
                                >
                                    📋 Cargar Ejemplo
                                </button>
                                <span style={{ fontSize: "0.7rem", color: "#64748b", textAlign: "center" }}>Pega un ejemplo para probar</span>
                            </div>
                        </div>

                        {/* Text area */}
                        <textarea
                            value={csvText}
                            onChange={e => setCsvText(e.target.value)}
                            placeholder="Pega aquí el contenido CSV o sube un archivo..."
                            rows={10}
                            style={{
                                width: "100%",
                                padding: "1rem",
                                background: "rgba(15,15,35,0.8)",
                                border: "1px solid rgba(99,102,241,0.3)",
                                borderRadius: "12px",
                                color: "#e2e8f0",
                                fontSize: "0.8rem",
                                fontFamily: "monospace",
                                resize: "vertical",
                                outline: "none",
                                marginBottom: "1.5rem",
                                boxSizing: "border-box"
                            }}
                        />

                        {error && (
                            <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button
                                onClick={handleImport}
                                disabled={!csvText.trim() || loading}
                                style={{ padding: "0.75rem 2rem", background: "#6366f1", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: (!csvText.trim() || loading) ? 0.5 : 1, fontSize: "0.875rem" }}
                            >
                                {loading ? "Importando..." : "Importar Trabajadores"}
                            </button>
                            <Link
                                href={`/dashboard/organizations/${orgId}`}
                                style={{ padding: "0.75rem 1.5rem", background: "transparent", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", color: "#94a3b8", fontWeight: 600, textDecoration: "none", fontSize: "0.875rem" }}
                            >
                                Cancelar
                            </Link>
                        </div>
                    </>
                ) : (
                    /* Results */
                    <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                            <div style={{ background: "rgba(30,30,60,0.6)", borderRadius: "14px", padding: "1.5rem", textAlign: "center", border: "1px solid rgba(99,102,241,0.1)" }}>
                                <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f1f5f9" }}>{result.totalRows}</div>
                                <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Filas</div>
                            </div>
                            <div style={{ background: "rgba(16,185,129,0.1)", borderRadius: "14px", padding: "1.5rem", textAlign: "center", border: "1px solid rgba(16,185,129,0.2)" }}>
                                <div style={{ fontSize: "2rem", fontWeight: 700, color: "#34d399" }}>{result.successRows}</div>
                                <div style={{ fontSize: "0.75rem", color: "#34d399", textTransform: "uppercase", letterSpacing: "0.05em" }}>Exitosos</div>
                            </div>
                            <div style={{ background: result.failedRows > 0 ? "rgba(239,68,68,0.1)" : "rgba(30,30,60,0.4)", borderRadius: "14px", padding: "1.5rem", textAlign: "center", border: `1px solid ${result.failedRows > 0 ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.1)"}` }}>
                                <div style={{ fontSize: "2rem", fontWeight: 700, color: result.failedRows > 0 ? "#f87171" : "#64748b" }}>{result.failedRows}</div>
                                <div style={{ fontSize: "0.75rem", color: result.failedRows > 0 ? "#f87171" : "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Errores</div>
                            </div>
                        </div>

                        {result.errors.length > 0 && (
                            <div style={{ background: "rgba(30,30,60,0.4)", borderRadius: "14px", border: "1px solid rgba(239,68,68,0.15)", padding: "1.5rem", marginBottom: "2rem" }}>
                                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f87171", textTransform: "uppercase", marginBottom: "0.75rem" }}>Detalle de Errores</h3>
                                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                                    {result.errors.map((err, i) => (
                                        <div key={i} style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(99,102,241,0.05)", fontSize: "0.8rem" }}>
                                            <span style={{ color: "#f87171", fontWeight: 600 }}>Fila {err.row}</span>
                                            <span style={{ color: "#64748b" }}> [{err.column}]: </span>
                                            <span style={{ color: "#94a3b8" }}>{err.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <Link
                                href={`/dashboard/organizations/${orgId}`}
                                style={{ padding: "0.75rem 2rem", background: "#6366f1", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, textDecoration: "none", fontSize: "0.875rem" }}
                            >
                                Ver Trabajadores
                            </Link>
                            <button
                                onClick={() => { setResult(null); setCsvText(""); setFile(null); }}
                                style={{ padding: "0.75rem 1.5rem", background: "transparent", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}
                            >
                                Importar Más
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
