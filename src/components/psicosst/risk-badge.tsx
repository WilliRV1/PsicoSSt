"use client"

import { cn } from "@/lib/utils"

export type RiskLevel = "sin-riesgo" | "bajo" | "medio" | "alto" | "muy-alto"

const riskConfig: Record<RiskLevel, { label: string; bg: string; text: string; dot: string }> = {
  "sin-riesgo": {
    label: "Sin riesgo",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
  bajo: {
    label: "Bajo",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  medio: {
    label: "Medio",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  alto: {
    label: "Alto",
    bg: "bg-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  "muy-alto": {
    label: "Muy alto",
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-600",
  },
}

interface RiskBadgeProps {
  level: RiskLevel
  showDot?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function RiskBadge({ level, showDot = true, className, size = "md" }: RiskBadgeProps) {
  const config = riskConfig[level]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.text,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm",
        className,
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden="true" />}
      {config.label}
    </span>
  )
}

interface RiskSemaphoreProps {
  level: RiskLevel
  score?: number
  label?: string
  className?: string
}

const semaphoreOrder: RiskLevel[] = ["sin-riesgo", "bajo", "medio", "alto", "muy-alto"]
const levelIndex = (l: RiskLevel) => semaphoreOrder.indexOf(l)

const semaphoreColors = ["bg-slate-300", "bg-green-500", "bg-yellow-400", "bg-orange-500", "bg-red-600"]
const semaphoreBorderActive = [
  "ring-slate-400",
  "ring-green-500",
  "ring-yellow-400",
  "ring-orange-500",
  "ring-red-600",
]

export function RiskSemaphore({ level, score, label, className }: RiskSemaphoreProps) {
  const activeIdx = levelIndex(level)
  const config = riskConfig[level]

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        {semaphoreOrder.map((l, i) => (
          <div
            key={l}
            className={cn(
              "h-4 w-4 rounded-full transition-all",
              semaphoreColors[i],
              i === activeIdx
                ? cn("h-6 w-6 ring-2 ring-offset-2", semaphoreBorderActive[i])
                : "opacity-30",
            )}
            title={riskConfig[l].label}
          />
        ))}
      </div>
      <div className="text-center">
        <p className={cn("text-lg font-bold", config.text)}>{config.label}</p>
        {score !== undefined && (
          <p className="text-sm text-muted-foreground">{score.toFixed(1)} puntos</p>
        )}
        {label && <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>}
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  status: "pendiente" | "activo" | "suspendido" | "aprobado" | "rechazado" | "completado"
  className?: string
}

const statusConfig: Record<StatusBadgeProps["status"], { label: string; bg: string; text: string; dot: string }> = {
  pendiente: { label: "Pendiente", bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  activo: { label: "Activo", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  suspendido: { label: "Suspendido", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  aprobado: { label: "Aprobado", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  rechazado: { label: "Rechazado", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  completado: { label: "Completado", bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden="true" />
      {config.label}
    </span>
  )
}
