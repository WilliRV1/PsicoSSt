"use client";

import { Search, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

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
      : "var(--color-text-muted)";

  return (
    <header
      className="h-[52px] flex items-center justify-between px-6 shrink-0"
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Search */}
      <button
        onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
        className="flex items-center gap-2 text-[13px] transition-colors duration-100 outline-none"
        style={{ color: "var(--color-text-muted)" }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")
        }
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span>Buscar</span>
        <span
          className="ml-1 text-[11px] px-1.5 py-0.5 rounded"
          style={{
            background: "var(--color-surface-muted)",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ⌃K
        </span>
      </button>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Credits */}
        <Link
          href="/dashboard/store"
          className="flex items-center gap-1.5 text-[13px] transition-colors duration-100"
          style={{ color: creditColor }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--color-primary)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = creditColor)
          }
        >
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {credits}
          </span>
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
            className="transition-colors duration-100 outline-none"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")
            }
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
