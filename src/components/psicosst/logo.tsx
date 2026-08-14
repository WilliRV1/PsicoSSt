"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  light?: boolean
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  if (iconOnly) {
    return (
      <span
        className={cn("font-bold", className)}
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 800,
          fontSize: "1.1rem",
          letterSpacing: "-0.02em",
          color: "var(--color-primary)",
        }}
      >
        P
      </span>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <span
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 700,
          fontSize: "1.15rem",
          letterSpacing: "-0.01em",
          color: "var(--color-foreground)",
          lineHeight: 1,
        }}
      >
        Psico<span style={{ color: "var(--color-primary)" }}>SST</span>
      </span>
      <span
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          marginTop: "2px",
        }}
      >
        Riesgo Psicosocial
      </span>
    </div>
  );
}
