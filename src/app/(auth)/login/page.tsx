"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, BarChart3, FileText } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
        setLoading(false);
      } else {
        // Keep loading=true — spinner persists while navigation completes
        router.push("/dashboard");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#07101C" }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-[44%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#060D18", borderRight: "1px solid #121F2E" }}
      >
        {/* Background glow orbs */}
        <div
          className="absolute top-[-80px] left-[-60px] w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,201,167,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-60px] right-[-80px] w-[340px] h-[340px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(41,121,255,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#00C9A7" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/logo-dark.png"
            alt="PsicoSST"
            width={160}
            height={46}
            className="object-contain h-10 w-auto"
            priority
          />
          <div
            className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
            style={{
              background: "rgba(0, 201, 167, 0.08)",
              border: "1px solid rgba(0, 201, 167, 0.2)",
              color: "#00C9A7",
              fontFamily: "var(--font-barlow)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#00C9A7" }}
            />
            Res. 2646/2008 · 2764/2022
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2
              className="text-[32px] font-bold leading-tight text-balance"
              style={{
                color: "#C4DAE8",
                fontFamily: "var(--font-barlow)",
                letterSpacing: "-0.01em",
              }}
            >
              Inteligencia clínica para la gestión del riesgo psicosocial
            </h2>
            <p className="text-[14px] leading-relaxed" style={{ color: "#3A5872" }}>
              Plataforma de cumplimiento normativo para psicólogos en Colombia.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { icon: ShieldCheck, label: "Calificación automática conforme a baremos oficiales" },
              { icon: FileText, label: "Custodia legal con hash SHA-256 y firma digital" },
              { icon: BarChart3, label: "Analítica organizacional e IA diagnóstica" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <div
                  className="mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0, 201, 167, 0.1)" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: "#00C9A7" }} />
                </div>
                <span className="text-[13.5px] leading-snug" style={{ color: "#4A6890" }}>
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p
          className="relative z-10 text-[11px]"
          style={{ color: "#1C3148", fontFamily: "var(--font-barlow)" }}
        >
          PsicoSST © {new Date().getFullYear()} · Todos los derechos reservados
        </p>
      </div>

      {/* ── Right panel (form) ──────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Image src="/logo-dark.png" alt="PsicoSST" width={148} height={42} className="h-9 w-auto object-contain" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-[26px] font-bold"
              style={{ color: "#C4DAE8", fontFamily: "var(--font-barlow)", letterSpacing: "-0.01em" }}
            >
              Iniciar sesión
            </h1>
            <p className="mt-1 text-[13.5px]" style={{ color: "#3A5872" }}>
              Ingresa tus credenciales clínicas
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-[13px]"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#F87171",
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[12px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "#2E4A62", fontFamily: "var(--font-barlow)" }}
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="psicologa@empresa.com"
                autoComplete="email"
                autoFocus
                required
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl text-[14px] outline-none transition-all duration-150 disabled:opacity-50"
                style={{
                  background: "rgba(11, 25, 42, 0.7)",
                  border: "1px solid #162638",
                  color: "#C4DAE8",
                  fontFamily: "var(--font-source-sans)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(0, 201, 167, 0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "#162638")}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[12px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: "#2E4A62", fontFamily: "var(--font-barlow)" }}
                >
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium transition-colors"
                  style={{ color: "#2E4A62" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#00C9A7")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#2E4A62")}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl text-[14px] outline-none transition-all duration-150 disabled:opacity-50"
                  style={{
                    background: "rgba(11, 25, 42, 0.7)",
                    border: "1px solid #162638",
                    color: "#C4DAE8",
                    fontFamily: "var(--font-source-sans)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(0, 201, 167, 0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "#162638")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50"
                  style={{ color: "#2E4A62" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#5A80A0")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#2E4A62")}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-[14px] font-bold text-white transition-all duration-150 disabled:opacity-80 flex items-center justify-center gap-2 mt-2"
              style={{
                background: loading
                  ? "linear-gradient(135deg, #009A80, #1A5CDB)"
                  : "linear-gradient(135deg, #00C9A7 0%, #2979FF 100%)",
                boxShadow: loading ? "none" : "0 0 24px rgba(0, 201, 167, 0.2)",
                fontFamily: "var(--font-barlow)",
                letterSpacing: "0.03em",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-[13px]" style={{ color: "#2E4A62" }}>
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-semibold transition-colors"
              style={{ color: "#00C9A7" }}
            >
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>

      {/* ── Full-screen loading overlay (while navigating to dashboard) ── */}
      {loading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
          style={{ background: "rgba(7, 16, 28, 0.92)", backdropFilter: "blur(8px)" }}
        >
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full animate-spin"
              style={{
                background: "conic-gradient(from 0deg, transparent 0%, #00C9A7 50%, #2979FF 100%)",
                WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
                mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <Image src="/isotipo.png" alt="" width={28} height={28} className="object-contain opacity-80" />
            </div>
          </div>
          <p
            className="text-[13px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "#3A5872", fontFamily: "var(--font-barlow)" }}
          >
            Cargando plataforma...
          </p>
        </div>
      )}
    </div>
  );
}
