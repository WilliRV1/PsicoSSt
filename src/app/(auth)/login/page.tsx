"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                if (result.error.includes("ACCOUNT_LOCKED")) {
                    setError("Cuenta bloqueada por múltiples intentos fallidos. Intenta en 15 minutos.");
                } else if (result.error.includes("ACCOUNT_SUSPENDED")) {
                    setError("Tu cuenta ha sido suspendida. Contacta al administrador.");
                } else if (result.error.includes("ACCOUNT_INACTIVE")) {
                    setError("Tu cuenta está inactiva.");
                } else {
                    setError("Credenciales inválidas. Verifica tu email y contraseña.");
                }
            } else {
                // Check session for MFA/status routing
                const res = await fetch("/api/auth/session");
                const session = await res.json();

                if (session?.user?.status === "PENDING") {
                    router.push("/pending-approval");
                } else if (session?.user?.mfaEnabled && !session?.user?.mfaVerified) {
                    router.push("/mfa-verify");
                } else if (!session?.user?.mfaEnabled) {
                    router.push("/mfa-setup");
                } else {
                    router.push("/dashboard");
                }
            }
        } catch {
            setError("Error de conexión. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="card">
                <h2 className="card-title">Iniciar Sesión</h2>

                {error && (
                    <div className="alert alert-error">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.25 5a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 10a1 1 0 100 2 1 1 0 000-2z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="field">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="psicologo@ejemplo.com"
                        required
                        autoComplete="email"
                        autoFocus
                    />
                </div>

                <div className="field">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        autoComplete="current-password"
                    />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (
                        <span className="spinner" />
                    ) : (
                        "Ingresar"
                    )}
                </button>

                <p className="card-footer">
                    ¿No tienes cuenta?{" "}
                    <Link href="/register" className="link">
                        Solicitar registro
                    </Link>
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
        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        .alert-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        .field {
          margin-bottom: 1.25rem;
        }
        .field label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 0.375rem;
        }
        .field input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: rgba(15, 15, 35, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .field input::placeholder {
          color: #475569;
        }
        .field input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .btn-primary {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .card-footer {
          text-align: center;
          font-size: 0.8125rem;
          color: #64748b;
          margin-top: 1.25rem;
        }
        .link {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }
        .link:hover {
          color: #a5b4fc;
          text-decoration: underline;
        }
      `}</style>
        </>
    );
}
