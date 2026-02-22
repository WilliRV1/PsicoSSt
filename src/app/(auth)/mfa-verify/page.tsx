"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MfaVerifyPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/mfa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message);
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="card">
                <div className="mfa-icon">🔐</div>
                <h2 className="card-title">Verificación MFA</h2>
                <p className="card-description">
                    Ingresa el código de 6 dígitos de tu aplicación de autenticación.
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="field">
                    <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        required
                        autoFocus
                        autoComplete="one-time-code"
                        className="code-input"
                    />
                </div>

                <button type="submit" className="btn-primary" disabled={loading || code.length !== 6}>
                    {loading ? <span className="spinner" /> : "Verificar"}
                </button>
            </form>

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
        .mfa-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .card-title { font-size: 1.25rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.5rem; }
        .card-description { font-size: 0.8125rem; color: #64748b; margin-bottom: 1.5rem; }
        .alert { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.8125rem; margin-bottom: 1rem; }
        .alert-error { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
        .field { margin-bottom: 1.25rem; }
        .code-input {
          width: 100%;
          padding: 0.875rem;
          background: rgba(15, 15, 35, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 1.5rem;
          text-align: center;
          letter-spacing: 0.5em;
          font-family: monospace;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .code-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
        .code-input::placeholder { color: #334155; letter-spacing: 0.5em; }
        .btn-primary { width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 600; font-size: 0.875rem; border: none; border-radius: 8px; cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; min-height: 44px; }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </>
    );
}
