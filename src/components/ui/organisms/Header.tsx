"use client";

import { Search, Sun, Moon, Menu } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface HeaderProps {
  user?: { fullName: string; email: string; creditBalance: number } | null;
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const credits = user?.creditBalance ?? 0;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Guarda de hidratación de next-themes: es el patrón que la propia
  // librería documenta para saber cuándo ya se puede leer `theme` sin
  // desajustar el HTML del servidor. No hay "valor anterior" que comparar
  // durante el render (a diferencia de un cambio de prop): sólo se sabe
  // que ya se montó una vez ejecutado un efecto en el cliente.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const creditColor =
    credits <= 0
      ? "var(--color-danger)"
      : credits <= 5
      ? "var(--color-warning)"
      : "var(--color-text-secondary)";

  return (
    <header
      className="h-[56px] flex items-center justify-between gap-2 px-3 sm:px-6 shrink-0"
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburguesa — sólo en móvil/tablet, abre el drawer de navegación */}
        <button
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="press-feedback flex h-9 w-9 shrink-0 items-center justify-center rounded-lg outline-none lg:hidden"
          style={{ color: "var(--color-text-muted)", background: "var(--color-surface-muted)" }}
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        {/* Search */}
        <button
          onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
          className="press-feedback flex items-center gap-2.5 h-9 pl-3 pr-2.5 rounded-lg text-[13px] outline-none w-9 sm:w-auto sm:min-w-[220px] justify-center sm:justify-start"
          style={{ color: "var(--color-text-muted)", background: "var(--color-surface-muted)" }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:block flex-1 text-left">Buscar</span>
          <span
            className="hidden sm:block text-[11px] px-1.5 py-0.5 rounded"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ⌘K
          </span>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Credits */}
        <Link
          href="/dashboard/plan"
          className="flex items-center gap-1.5 text-[13px] transition-colors duration-100"
          style={{ color: creditColor }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--color-primary)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = creditColor)
          }
        >
          <span className="font-mono font-semibold tabular-nums">{credits}</span>
          <span className="hidden sm:inline text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            trabajadores
          </span>
        </Link>

        {/* Divider */}
        <div className="hidden sm:block w-px h-4" style={{ background: "var(--color-border)" }} />

        {/* Theme */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"}
            className="press-feedback relative h-8 w-8 flex items-center justify-center rounded-lg outline-none transition-colors duration-150 hover:bg-surface-muted"
            style={{ color: "var(--color-text-muted)" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sun className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, rotate: 60, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -60, scale: 0.6 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Moon className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
    </header>
  );
}
