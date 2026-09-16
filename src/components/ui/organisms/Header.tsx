"use client";

import { Search, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface HeaderProps {
  user?: { fullName: string; email: string; creditBalance: number } | null;
}

export function Header({ user }: HeaderProps) {
  const credits = user?.creditBalance ?? 0;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const creditColor =
    credits <= 0
      ? "var(--color-danger)"
      : credits <= 5
      ? "var(--color-warning)"
      : "var(--color-text-secondary)";

  return (
    <header
      className="h-[56px] flex items-center justify-between px-6 shrink-0"
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Search */}
      <button
        onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
        className="press-feedback flex items-center gap-2.5 h-9 pl-3 pr-2.5 rounded-lg text-[13px] outline-none min-w-[220px]"
        style={{ color: "var(--color-text-muted)", background: "var(--color-surface-muted)" }}
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left">Buscar</span>
        <span
          className="text-[11px] px-1.5 py-0.5 rounded"
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

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Credits */}
        <Link
          href="/dashboard/store"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] transition-colors duration-150"
          style={{ color: creditColor, background: "var(--color-surface-muted)" }}
        >
          <span className="font-mono font-semibold tabular-nums">{credits}</span>
          <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            créditos
          </span>
        </Link>

        {/* Divider */}
        <div className="w-px h-4" style={{ background: "var(--color-border)" }} />

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
