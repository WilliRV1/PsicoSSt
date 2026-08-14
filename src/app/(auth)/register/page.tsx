"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CheckCircle2, Loader2, UserCheck } from "lucide-react";

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

    if (form.password !== form.confirmPassword) {
      setErrors(["Las contraseñas no coinciden."]);
      return;
    }

    setLoading(true);
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

  // ── Success state ─────────────────────────────────────────────
  if (success) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: "#07101C" }}
      >
        <div className="w-full max-w-sm text-center space-y-6">
          <Image
            src="/logo-dark.png"
            alt="PsicoSST"
            width={148}
            height={42}
            className="h-9 w-auto object-contain mx-auto"
          />
          <div
            className="p-8 rounded-2xl space-y-5"
            style={{ background: "#0B1929", border: "1px solid #162638" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "rgba(0, 201, 167, 0.1)", border: "1px solid rgba(0, 201, 167, 0.25)" }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: "#00C9A7" }} />
            </div>
            <div>
              <h2
                className="text-[20px] font-bold"
                style={{ color: "#C4DAE8", fontFamily: "var(--font-barlow)" }}
              >
                Solicitud Enviada
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "#3A5872" }}>
                {successMessage || "Tu solicitud está siendo revisada. Recibirás acceso una vez verificadas tus credenciales."}
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-xl text-[14px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #00C9A7 0%, #2979FF 100%)",
                fontFamily: "var(--font-barlow)",
              }}
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  const inputStyle = {
    background: "rgba(11, 25, 42, 0.7)",
    border: "1px solid #162638",
    color: "#C4DAE8",
    fontFamily: "var(--font-source-sans)",
  };
  const labelStyle = {
    color: "#2E4A62",
    fontFamily: "var(--font-barlow)",
  };

  function Field({
    id, label, type = "text", placeholder, value, required = true,
  }: {
    id: keyof typeof form; label: string; type?: string;
    placeholder?: string; value: string; required?: boolean;
  }) {
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={labelStyle}
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => updateField(id, e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-xl text-[13.5px] outline-none transition-all duration-150 disabled:opacity-50"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "rgba(0, 201, 167, 0.4)")}
          onBlur={(e) => (e.target.style.borderColor = "#162638")}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#07101C" }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-[38%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#060D18", borderRight: "1px solid #121F2E" }}
      >
        <div
          className="absolute top-[-60px] left-[-40px] w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,201,167,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-40px] right-[-60px] w-[280px] h-[280px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(41,121,255,0.06) 0%, transparent 70%)" }}
        />
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.035 }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid2" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#00C9A7" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
        </div>

        <div className="relative z-10">
          <Image src="/logo-dark.png" alt="PsicoSST" width={148} height={42} className="h-9 w-auto object-contain" priority />
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2
              className="text-[28px] font-bold leading-tight text-balance"
              style={{ color: "#C4DAE8", fontFamily: "var(--font-barlow)", letterSpacing: "-0.01em" }}
            >
              Solo para psicólogos certificados en SST
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "#3A5872" }}>
              Verificamos tus credenciales antes de darte acceso. El proceso toma menos de 24 horas.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              "Licencia SST vigente emitida por el MPS",
              "Tarjeta profesional de psicólogo — Tribunal Ético",
              "Posgrado en Seguridad y Salud en el Trabajo",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div
                  className="mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0, 201, 167, 0.1)" }}
                >
                  <UserCheck className="w-3 h-3" style={{ color: "#00C9A7" }} />
                </div>
                <span className="text-[12.5px] leading-snug" style={{ color: "#4A6890" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[11px]" style={{ color: "#1C3148", fontFamily: "var(--font-barlow)" }}>
          PsicoSST © {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-[380px] py-8">

          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/logo-dark.png" alt="PsicoSST" width={148} height={42} className="h-9 w-auto object-contain" />
          </div>

          <div className="mb-7">
            <h1
              className="text-[24px] font-bold"
              style={{ color: "#C4DAE8", fontFamily: "var(--font-barlow)", letterSpacing: "-0.01em" }}
            >
              Solicitar Registro
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: "#3A5872" }}>
              Tu solicitud será revisada en menos de 24 h.
            </p>
          </div>

          {errors.length > 0 && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-[13px]"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#F87171",
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errors.map((err, i) => <div key={i}>{err}</div>)}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Section: Personal */}
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em] pt-1"
              style={{ color: "#00C9A7", fontFamily: "var(--font-barlow)" }}
            >
              Información Personal
            </p>

            <Field id="fullName" label="Nombre completo" value={form.fullName} placeholder="Dra. María Torres" />
            <Field id="email" label="Correo electrónico" type="email" value={form.email} placeholder="psicologa@empresa.com" />

            <div className="grid grid-cols-2 gap-3">
              <Field id="password" label="Contraseña" type="password" value={form.password} placeholder="Mín. 12 caracteres" />
              <Field id="confirmPassword" label="Confirmar" type="password" value={form.confirmPassword} placeholder="••••••••••••" />
            </div>

            {/* Section: Professional */}
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em] pt-3"
              style={{ color: "#00C9A7", fontFamily: "var(--font-barlow)" }}
            >
              Credenciales Profesionales
            </p>

            <Field id="licenseNumber" label="Número de licencia SST" value={form.licenseNumber} placeholder="12345-SST" />
            <Field id="professionalCard" label="Tarjeta profesional" value={form.professionalCard} placeholder="TP-98765" />
            <Field id="sstCredential" label="Posgrado en SST" value={form.sstCredential} placeholder="Esp. SST — Universidad, Año" />

            {/* Terms */}
            <p className="text-[11.5px] leading-relaxed" style={{ color: "#2E4A62" }}>
              Al registrarte aceptas los{" "}
              <Link href="/terms" target="_blank" className="font-semibold" style={{ color: "#00C9A7" }}>
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacy" target="_blank" className="font-semibold" style={{ color: "#00C9A7" }}>
                Política de Privacidad
              </Link>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-[14px] font-bold text-white transition-all duration-150 flex items-center justify-center gap-2 mt-1"
              style={{
                background: "linear-gradient(135deg, #00C9A7 0%, #2979FF 100%)",
                boxShadow: loading ? "none" : "0 0 24px rgba(0, 201, 167, 0.18)",
                opacity: loading ? 0.8 : 1,
                fontFamily: "var(--font-barlow)",
                letterSpacing: "0.03em",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando solicitud...
                </>
              ) : (
                "Enviar Solicitud"
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-[13px]" style={{ color: "#2E4A62" }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "#00C9A7" }}>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
