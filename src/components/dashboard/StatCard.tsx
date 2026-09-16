"use client";

import { motion, useReducedMotion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: string;
  trendLabel?: string;
  /** Orden dentro de una fila, para el escalonado de entrada. */
  index?: number;
}

/**
 * Tarjeta de cifra suelta. No existía ningún consumidor real de este
 * componente — el panel principal se construía cada estadística a mano con
 * clases de Tailwind repetidas —, así que se corrige aquí y se conecta.
 *
 * Antes usaba Barlow para la etiqueta: Barlow queda ahora sólo para el
 * logotipo, así que la etiqueta pasa a la rúbrica en Geist que ya usa el
 * resto del sistema (versalitas, tracking amplio, tono apagado).
 */
export function StatCard({
  title,
  value,
  trend,
  trendLabel = "vs. mes anterior",
  index = 0,
}: StatCardProps) {
  const reduceMotion = useReducedMotion();
  const isPositive = (trend ?? 0) >= 0;
  const isAlert =
    String(title).toLowerCase().includes("alert") ||
    String(title).toLowerCase().includes("críti") ||
    String(title).toLowerCase().includes("venc");
  const alertActive = isAlert && Number(value) > 0;

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1], delay: reduceMotion ? 0 : index * 0.04 }}
      className="p-5 rounded-xl flex flex-col gap-3"
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${alertActive ? "var(--color-risk-veryhigh-border)" : "var(--color-border)"}`,
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">
        {title}
      </p>

      <p
        className="text-[32px] leading-none font-semibold font-mono tabular-nums"
        style={{ color: alertActive ? "var(--color-danger)" : "var(--color-foreground)" }}
      >
        {value}
      </p>

      {trend !== undefined && (
        <p className="text-[12px] font-mono tabular-nums" style={{ color: isPositive ? "var(--color-success)" : "var(--color-danger)" }}>
          {isPositive ? "↑" : "↓"} {Math.abs(trend)}%{" "}
          <span className="font-sans text-text-muted">{trendLabel}</span>
        </p>
      )}
    </motion.div>
  );
}
