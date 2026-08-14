"use client";

import { Bell, Search, Zap, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface HeaderProps {
  user?: {
    fullName: string;
    email: string;
    creditBalance: number;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const credits = user?.creditBalance ?? 0;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const creditColor =
    credits <= 0 ? "#EF4444" : credits <= 5 ? "#F59E0B" : "#00C9A7";

  return (
    <header
      className="h-14 flex items-center justify-between px-5 sticky top-0 z-40 shrink-0 backdrop-blur-xl"
      style={{
        background: "rgba(7, 16, 28, 0.82)",
        borderBottom: "1px solid rgba(18, 31, 46, 0.9)",
      }}
    >
      {/* ── Search ──────────────────────────────────────────── */}
      <div className="flex-1 max-w-xs">
        <button
          onClick={() =>
            window.dispatchEvent(new Event("open-command-palette"))
          }
          className="group flex items-center gap-2.5 w-full px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 outline-none text-[#3A5872] hover:text-[#7AAABB] hover:border-[#00C9A7]/25"
          style={{
            background: "rgba(11, 25, 42, 0.7)",
            border: "1px solid rgba(18, 38, 56, 0.9)",
          }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left" style={{ fontFamily: "var(--font-source-sans)" }}>
            Buscar...
          </span>
          <kbd
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{
              background: "rgba(18, 38, 56, 0.8)",
              color: "#2E4A62",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            ⌃K
          </kbd>
        </button>
      </div>

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 ml-4">

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#2E4A62] hover:text-[#5A80A0] hover:bg-white/[0.05] transition-all duration-150"
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Notifications */}
        <button
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#2E4A62] hover:text-[#5A80A0] hover:bg-white/[0.05] transition-all duration-150"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "#EF4444" }}
          />
        </button>

        {/* Separator */}
        <div
          className="w-px h-4 mx-1"
          style={{ background: "rgba(18, 38, 56, 0.9)" }}
        />

        {/* Credits */}
        <Link
          href="/dashboard/store"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 hover:bg-white/[0.05]"
          style={{
            background: "rgba(11, 25, 42, 0.7)",
            border: "1px solid rgba(18, 38, 56, 0.9)",
            color: creditColor,
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          <Zap
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: creditColor }}
          />
          <span>{credits}</span>
          <span
            className="text-[11px] font-medium"
            style={{
              color: "rgba(90, 128, 160, 0.7)",
              fontFamily: "var(--font-source-sans)",
            }}
          >
            cr.
          </span>
          <span
            className="text-[12px] font-semibold ml-1"
            style={{ color: "#00C9A7", fontFamily: "var(--font-source-sans)" }}
          >
            + Comprar
          </span>
        </Link>
      </div>
    </header>
  );
}
