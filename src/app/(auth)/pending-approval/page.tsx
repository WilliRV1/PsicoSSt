"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { CheckCircle2, Clock } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "#07101C" }}
    >
      <div className="w-full max-w-sm text-center space-y-7">
        {/* Logo */}
        <Image
          src="/logo-dark.png"
          alt="PsicoSST"
          width={148}
          height={42}
          className="h-9 w-auto object-contain mx-auto"
          priority
        />

        {/* Card */}
        <div
          className="rounded-2xl p-8 space-y-6"
          style={{ background: "#0B1929", border: "1px solid #162638" }}
        >
          {/* Icon */}
          <div className="relative mx-auto w-fit">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(41, 121, 255, 0.08)",
                border: "1px solid rgba(41, 121, 255, 0.2)",
              }}
            >
              <Clock className="w-8 h-8" style={{ color: "#2979FF" }} />
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#0B1929", border: "1px solid #162638" }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ background: "#2979FF" }}
              />
            </span>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1
              className="text-[20px] font-bold"
              style={{ color: "#C4DAE8", fontFamily: "var(--font-barlow)" }}
            >
              Cuenta en Revisión
            </h1>
            <p className="text-[13.5px] leading-relaxed" style={{ color: "#3A5872" }}>
              Tu solicitud está siendo verificada por un administrador.
              Recibirás acceso en menos de 24 horas.
            </p>
          </div>

          {/* Checklist */}
          <div
            className="rounded-xl p-4 text-left space-y-2.5"
            style={{ background: "rgba(11, 25, 42, 0.6)", border: "1px solid #121F2E" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-3"
              style={{ color: "#2E4A62", fontFamily: "var(--font-barlow)" }}
            >
              Qué se verifica
            </p>
            {[
              "Licencia SST vigente",
              "Tarjeta profesional de psicólogo",
              "Posgrado en Seguridad y Salud en el Trabajo",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#00C9A7" }} />
                <span className="text-[13px]" style={{ color: "#3A5872" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-150"
            style={{
              background: "rgba(11, 25, 42, 0.7)",
              border: "1px solid #162638",
              color: "#3A5872",
              fontFamily: "var(--font-barlow)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#5A80A0";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#243C55";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#3A5872";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#162638";
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
