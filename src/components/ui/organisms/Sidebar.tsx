"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Building2,
  ClipboardList,
  FileText,
  LineChart,
  TrendingUp,
  Target,
  Sparkles,
  Store,
  UserCog,
  ShieldCheck,
  ShieldAlert,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  user?: { fullName: string; email: string; creditBalance: number; isAdmin?: boolean } | null;
  mobileOpen?: boolean;
  onClose?: () => void;
}

/**
 * Antes la barra listaba 5 destinos (Centro de Control, Empresas,
 * Evaluaciones, Reportes, Configuración) para un panel que ya tenía cerca de
 * veinte rutas reales: trabajadores, créditos, planes, analítica,
 * tendencias, intervenciones, el asistente y todo el módulo de
 * administración sólo eran alcanzables escribiendo la URL a mano. Aquí se
 * agrupa el panel entero.
 */
const NAV = [
  {
    section: "Operación",
    items: [
      { label: "Centro de control", href: "/dashboard", icon: LayoutGrid },
      // Sin entrada propia para trabajadores: desde el pivote se gestionan
      // dentro de su empresa y /dashboard/workers sólo redirige aquí, así que
      // como opción de menú llevaba al usuario a una pantalla que no pidió.
      { label: "Empresas", href: "/dashboard/organizations", icon: Building2 },
      { label: "Evaluaciones", href: "/dashboard/assessments", icon: ClipboardList },
      { label: "Informes", href: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    section: "Análisis",
    items: [
      { label: "Analítica", href: "/dashboard/analytics", icon: LineChart },
      { label: "Tendencias", href: "/dashboard/trends", icon: TrendingUp },
      { label: "Intervenciones", href: "/dashboard/interventions", icon: Target },
      { label: "Asistente IA", href: "/dashboard/ai", icon: Sparkles },
    ],
  },
  {
    section: "Cuenta",
    items: [
      // «Créditos» desapareció con el pivote a suscripción: la ruta sólo
      // sobrevive porque el checkout cuelga de ella, y redirige a Planes.
      { label: "Mi plan", href: "/dashboard/plan", icon: Store },
      { label: "Equipo", href: "/dashboard/users", icon: UserCog },
      { label: "Roles y permisos", href: "/dashboard/roles", icon: ShieldCheck },
      { label: "Configuración", href: "/dashboard/settings", icon: Settings },
    ],
  },
] as const;

const ADMIN_ITEM = { label: "Panel admin", href: "/dashboard/admin", icon: ShieldAlert };

export function Sidebar({ user, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // Cierra el drawer móvil al cambiar de ruta — el mismo patrón de ajustar
  // estado durante el render que documenta React, para no arrastrar el
  // menú abierto a la siguiente pantalla.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (mobileOpen) onClose?.();
  }

  // Bloquea el scroll del body mientras el drawer está abierto en móvil.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const initials = (user?.fullName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActiveHref = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(href);

  const renderItem = (item: { label: string; href: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }) => {
    const isActive = isActiveHref(item.href);
    const Icon = item.icon;
    return (
      <li key={item.href} className="relative">
        {isActive && (
          <motion.span
            layoutId="sidebar-active-pill"
            className="absolute inset-0 rounded-lg"
            style={{ background: "var(--color-surface-muted)" }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          />
        )}
        <Link
          href={item.href}
          prefetch={false}
          className="relative z-10 flex items-center gap-2.5 h-8 px-3 text-[13px] rounded-lg outline-none transition-colors duration-150"
          style={{
            color: isActive ? "var(--color-foreground)" : "var(--color-text-secondary)",
            fontWeight: isActive ? 600 : 400,
          }}
        >
          <Icon className="h-[15px] w-[15px] shrink-0" style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }} />
          <span className="truncate">{item.label}</span>
        </Link>
      </li>
    );
  };

  const logoBlock = (
    <div className="px-6 pt-7 pb-6 shrink-0">
      <Link href="/dashboard" className="block">
        <span
          className="font-brand"
          style={{
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
          className="font-brand"
          style={{
            display: "block",
            fontSize: "0.62rem",
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            marginTop: "3px",
          }}
        >
          Riesgo Psicosocial
        </span>
      </Link>
    </div>
  );

  const navBlock = (
    <nav className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 space-y-5">
      {NAV.map((group) => (
        <div key={group.section}>
          <p
            className="px-3 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.11em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            {group.section}
          </p>
          <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
        </div>
      ))}

      {user?.isAdmin && (
        <div>
          <p
            className="px-3 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.11em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Administración
          </p>
          <ul className="space-y-0.5">{renderItem(ADMIN_ITEM)}</ul>
        </div>
      )}
    </nav>
  );

  const userBlock = (
    <div
      className="shrink-0 px-4 py-4"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{
            background: "var(--color-teal-light)",
            color: "var(--color-teal-dark)",
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href="/dashboard/profile"
            className="text-[12.5px] font-semibold truncate block transition-colors hover:text-foreground"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {user?.fullName || "Usuario"}
          </Link>
        </div>
        <button
          type="button"
          title="Cerrar sesión"
          className="press-feedback p-1 rounded transition-colors duration-150 outline-none"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--color-danger)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")
          }
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — columna estática siempre visible */}
      <aside
        className="sidebar no-scrollbar hidden lg:flex w-[224px] h-screen flex-shrink-0 flex-col"
        style={{
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        {logoBlock}
        {navBlock}
        {userBlock}
      </aside>

      {/* Móvil — drawer superpuesto, fuera del flujo hasta que se abre */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            />
            <motion.aside
              className="sidebar no-scrollbar fixed inset-y-0 left-0 z-50 w-[260px] max-w-[80vw] flex flex-col lg:hidden"
              style={{
                background: "var(--color-surface)",
                borderRight: "1px solid var(--color-border)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.23, 1, 0.32, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="flex-1">{logoBlock}</div>
                <button
                  onClick={onClose}
                  aria-label="Cerrar menú"
                  className="press-feedback mr-4 flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {navBlock}
              {userBlock}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
