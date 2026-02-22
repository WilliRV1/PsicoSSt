"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        licenseNumber: "",
        professionalCard: "",
        sstCredential: "",
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function updateField(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors([]);
        setLoading(true);

        // Client-side validation
        const clientErrors: string[] = [];
        if (form.password !== form.confirmPassword) {
            clientErrors.push("Las contraseñas no coinciden");
        }
        if (clientErrors.length > 0) {
            setErrors(clientErrors);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    fullName: form.fullName,
                    licenseNumber: form.licenseNumber,
                    professionalCard: form.professionalCard,
                    sstCredential: form.sstCredential,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrors(data.details ?? [data.message]);
            } else {
                setSuccess(true);
                setSuccessMessage(data.message);
            }
        } catch {
            setErrors(["Error de conexión. Intenta de nuevo."]);
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <>
                <div className="card">
                    <div className="success-icon">✓</div>
                    <h2 className="card-title">Registro Enviado</h2>
                    <p className="success-text">{successMessage}</p>
                    <Link href="/login" className="btn-secondary">
                        Ir a Iniciar Sesión
                    </Link>
                </div>
                <style>{`
          .card {
            background: rgba(30, 30, 60, 0.6);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(99, 102, 241, 0.15);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            text-align: center;
          }
          .card-title { font-size: 1.25rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.75rem; }
          .success-icon {
            width: 56px; height: 56px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border-radius: 50%;
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 1.5rem; color: white; margin-bottom: 1rem;
          }
          .success-text { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; }
          .btn-secondary {
            display: inline-block; padding: 0.625rem 1.25rem;
            border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 8px;
            color: #818cf8; font-size: 0.875rem; font-weight: 500;
            text-decoration: none; transition: all 0.2s;
          }
          .btn-secondary:hover { background: rgba(99, 102, 241, 0.1); }
        `}</style>
            </>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="card">
                <h2 className="card-title">Solicitar Registro</h2>
                <p className="card-description">
                    Solo psicólogos con posgrado en SST y licencia vigente pueden registrarse.
                </p>

                {errors.length > 0 && (
                    <div className="alert alert-error">
                        {errors.map((err, i) => (
                            <div key={i}>{err}</div>
                        ))}
                    </div>
                )}

                <div className="section-label">Información Personal</div>

                <div className="field">
                    <label htmlFor="fullName">Nombre completo</label>
                    <input id="fullName" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
                </div>

                <div className="field">
                    <label htmlFor="email">Correo electrónico</label>
                    <input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                </div>

                <div className="field-row">
                    <div className="field">
                        <label htmlFor="password">Contraseña</label>
                        <input id="password" type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} required placeholder="Mín. 12 caracteres" />
                    </div>
                    <div className="field">
                        <label htmlFor="confirmPassword">Confirmar</label>
                        <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} required />
                    </div>
                </div>

                <div className="section-label">Credenciales Profesionales</div>

                <div className="field">
                    <label htmlFor="licenseNumber">Número de licencia SST</label>
                    <input id="licenseNumber" value={form.licenseNumber} onChange={(e) => updateField("licenseNumber", e.target.value)} required placeholder="12345-SST" />
                </div>

                <div className="field">
                    <label htmlFor="professionalCard">Tarjeta profesional</label>
                    <input id="professionalCard" value={form.professionalCard} onChange={(e) => updateField("professionalCard", e.target.value)} required placeholder="TP-98765" />
                </div>

                <div className="field">
                    <label htmlFor="sstCredential">Credencial de posgrado en SST</label>
                    <input id="sstCredential" value={form.sstCredential} onChange={(e) => updateField("sstCredential", e.target.value)} required placeholder="Esp. SST — Universidad, Año" />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <span className="spinner" /> : "Enviar Solicitud"}
                </button>

                <p className="card-footer">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="link">Iniciar sesión</Link>
                </p>
            </form>

            <style>{`
        .card {
          background: rgba(30, 30, 60, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .card-title { font-size: 1.25rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem; text-align: center; }
        .card-description { text-align: center; font-size: 0.8125rem; color: #64748b; margin-bottom: 1.5rem; }
        .section-label { font-size: 0.75rem; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.75rem; border-top: 1px solid rgba(99,102,241,0.1); padding-top: 1rem; }
        .section-label:first-of-type { border-top: none; padding-top: 0; margin-top: 0; }
        .alert { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.8125rem; margin-bottom: 1rem; }
        .alert-error { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
        .field { margin-bottom: 1rem; }
        .field label { display: block; font-size: 0.8125rem; font-weight: 500; color: #94a3b8; margin-bottom: 0.375rem; }
        .field input { width: 100%; padding: 0.625rem 0.875rem; background: rgba(15, 15, 35, 0.6); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px; color: #e2e8f0; font-size: 0.875rem; transition: border-color 0.2s, box-shadow 0.2s; outline: none; box-sizing: border-box; }
        .field input::placeholder { color: #475569; }
        .field input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .btn-primary { width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 600; font-size: 0.875rem; border: none; border-radius: 8px; cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; min-height: 44px; margin-top: 0.5rem; }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-footer { text-align: center; font-size: 0.8125rem; color: #64748b; margin-top: 1.25rem; }
        .link { color: #818cf8; text-decoration: none; font-weight: 500; }
        .link:hover { color: #a5b4fc; text-decoration: underline; }
      `}</style>
        </>
    );
}
