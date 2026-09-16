import { AlertTriangle, Clock, Users, CheckCircle2, type LucideIcon } from "lucide-react";

export type ComplianceStatus = "vencida" | "por_vencer" | "sin_evaluar" | "vigente";

/**
 * Estado de vigencia de una empresa — NO es un nivel de riesgo (ver
 * RiskBadge para eso): una empresa "vigente" puede tener trabajadores en
 * riesgo alto, y una "vencida" puede no tenerlo. Son dos preguntas
 * distintas y por eso es un componente distinto, con sus propios tokens
 * semánticos en vez de tomar prestados los de riesgo.
 *
 * Antes esta configuración —etiqueta, icono, clases de color— estaba
 * copiada de forma idéntica en la página de inicio y en la lista de
 * empresas, cada una con sus propias clases sueltas de Tailwind
 * (`bg-red-100 text-red-700 border-red-200`…). Un solo componente, con los
 * tokens del sistema.
 */
const CONFIG: Record<ComplianceStatus, { label: string; icon: LucideIcon; bg: string; text: string }> = {
  vencida: { label: "Vencida", icon: AlertTriangle, bg: "var(--color-risk-veryhigh-bg)", text: "var(--color-risk-veryhigh-text)" },
  por_vencer: { label: "Por vencer", icon: Clock, bg: "var(--color-risk-medium-bg)", text: "var(--color-risk-medium-text)" },
  sin_evaluar: { label: "Sin evaluar", icon: Users, bg: "var(--color-surface-muted)", text: "var(--color-text-secondary)" },
  vigente: { label: "Vigente", icon: CheckCircle2, bg: "var(--color-teal-light)", text: "var(--color-teal-dark)" },
};

export function complianceConfig(status: ComplianceStatus) {
  return CONFIG[status];
}

export function ComplianceBadge({ status, className }: { status: ComplianceStatus; className?: string }) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${className ?? ""}`}
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}
