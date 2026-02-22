"use client";

import { useState, useEffect } from "react";

interface Psychologist {
    id: string;
    email: string;
    fullName: string;
    licenseNumber: string;
    professionalCard: string;
    sstCredential: string;
    status: "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
    isAdmin: boolean;
    mfaEnabled: boolean;
    createdAt: string;
}

export function PsychologistList() {
    const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchPsychologists = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/psychologists");
            const data = await res.json();
            if (res.ok) {
                setPsychologists(data.data);
            } else {
                setError(data.message || "Error al cargar psicólogos");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPsychologists();
    }, []);

    const handleStatusChange = async (psychologistId: string, newStatus: string) => {
        try {
            setUpdatingId(psychologistId);
            const res = await fetch("/api/admin/psychologists", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ psychologistId, status: newStatus }),
            });
            const data = await res.json();

            if (res.ok) {
                // Update local state
                setPsychologists(prev =>
                    prev.map(p => p.id === psychologistId ? { ...p, status: data.newStatus } : p)
                );
            } else {
                alert(data.message || "Error al actualizar estado");
            }
        } catch (err) {
            alert("Error de conexión");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) return <div className="loading">Cargando profesionales...</div>;
    if (error) return <div className="error-box">{error}</div>;

    return (
        <div className="list-container">
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Profesional</th>
                            <th>Licencia / Tarjeta</th>
                            <th>Estado</th>
                            <th className="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {psychologists.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    <div className="prof-info">
                                        <div className="prof-name">
                                            {p.fullName} {p.isAdmin && <span className="badge-admin">Admin</span>}
                                        </div>
                                        <div className="prof-email">{p.email}</div>
                                    </div>
                                </td>
                                <td>
                                    <div className="docs-info">
                                        <div>{p.licenseNumber}</div>
                                        <div className="card-sub">{p.professionalCard}</div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-pill ${p.status.toLowerCase()}`}>
                                        {p.status === 'PENDING' ? 'Pendiente' :
                                            p.status === 'ACTIVE' ? 'Activo' :
                                                p.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <div className="actions">
                                        {p.status === "PENDING" && (
                                            <button
                                                onClick={() => handleStatusChange(p.id, "ACTIVE")}
                                                disabled={!!updatingId}
                                                className="btn-action approve"
                                            >
                                                Aprobar
                                            </button>
                                        )}
                                        {p.status === "ACTIVE" && !p.isAdmin && (
                                            <button
                                                onClick={() => handleStatusChange(p.id, "SUSPENDED")}
                                                disabled={!!updatingId}
                                                className="btn-action suspend"
                                            >
                                                Suspender
                                            </button>
                                        )}
                                        {p.status === "SUSPENDED" && (
                                            <button
                                                onClick={() => handleStatusChange(p.id, "ACTIVE")}
                                                disabled={!!updatingId}
                                                className="btn-action activate"
                                            >
                                                Activar
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .list-container { margin-top: 1rem; }
                .table-wrapper { 
                    background: rgba(30, 30, 60, 0.4); 
                    border: 1px solid rgba(99, 102, 241, 0.1); 
                    border-radius: 12px; 
                    overflow: hidden; 
                    backdrop-filter: blur(20px);
                }
                .table { width: 100%; border-collapse: collapse; text-align: left; }
                .table th { 
                    padding: 1rem 1.5rem; 
                    font-size: 0.75rem; 
                    font-weight: 600; 
                    color: #64748b; 
                    text-transform: uppercase; 
                    letter-spacing: 0.05em; 
                    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
                }
                .table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(99, 102, 241, 0.05); }
                .table tr:last-child td { border-bottom: none; }
                
                .prof-name { font-size: 0.9375rem; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 0.5rem; }
                .prof-email { font-size: 0.8125rem; color: #64748b; margin-top: 0.125rem; }
                .badge-admin { 
                    font-size: 0.625rem; 
                    background: rgba(99, 102, 241, 0.2); 
                    color: #818cf8; 
                    padding: 0.125rem 0.375rem; 
                    border-radius: 4px; 
                    border: 1px solid rgba(99, 102, 241, 0.3);
                }
                
                .docs-info { font-size: 0.875rem; color: #e2e8f0; }
                .card-sub { font-size: 0.75rem; color: #64748b; margin-top: 0.125rem; }
                
                .status-pill { 
                    font-size: 0.75rem; 
                    font-weight: 600; 
                    padding: 0.25rem 0.625rem; 
                    border-radius: 9999px; 
                    display: inline-block;
                }
                .status-pill.pending { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
                .status-pill.active { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-pill.suspended { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
                
                .text-right { text-align: right; }
                .actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
                
                .btn-action { 
                    font-size: 0.8125rem; 
                    font-weight: 500; 
                    padding: 0.375rem 0.75rem; 
                    border-radius: 6px; 
                    cursor: pointer; 
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .btn-action.approve { background: #6366f1; color: white; }
                .btn-action.approve:hover:not(:disabled) { background: #4f46e5; }
                
                .btn-action.suspend { background: transparent; color: #f87171; border-color: rgba(239, 68, 68, 0.3); }
                .btn-action.suspend:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); }
                
                .btn-action.activate { background: transparent; color: #34d399; border-color: rgba(16, 185, 129, 0.3); }
                .btn-action.activate:hover:not(:disabled) { background: rgba(16, 185, 129, 0.1); }

                .loading { padding: 4rem; text-align: center; color: #64748b; font-size: 0.875rem; }
                .error-box { padding: 1.5rem; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; color: #f87171; text-align: center; }
            `}</style>
        </div>
    );
}
