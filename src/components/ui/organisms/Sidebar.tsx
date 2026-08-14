"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

interface SidebarProps {
  user?: { fullName: string; email: string; creditBalance: number } | null;
}

const NAV = [
  {
    section: "Operaciones",
    items: [
      { label: "Centro de Control", href: "/dashboard" },
      { label: "Empresas",          href: "/dashboard/organizations" },
      { label: "Trabajadores",      href: "/dashboard/workers" },
      { label: "Evaluaciones",      href: "/dashboard/assessments" },
      { label: "Intervenciones",    href: "/dashboard/interventions" },
    ],
  },
  {
    section: "Inteligencia",
    items: [
      { label: "Analítica",      href: "/dashboard/analytics" },
      { label: "Decisiones IA",  href: "/dashboard/ai" },
      { label: "Reportes",       href: "/dashboard/reports" },
      { label: "Tendencias",     href: "/dashboard/trends" },
    ],
  },
  {
    section: "Sistema",
    items: [
      { label: "Configuración", href: "/dashboard/settings" },
    ],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const initials = (user?.fullName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className="sidebar no-scrollbar w-[220px] h-screen flex-shrink-0 flex flex-col"
      style={{ background: "#0C1520", borderRight: "1px solid #1A2B3C" }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 shrink-0">
        <Link href="/dashboard">
          <Image
            src="/logo-dark.png"
            alt="PsicoSST"
            width={136}
            height={38}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 space-y-6">
        {NAV.map((group) => (
          <div key={group.section}>
            <p
              className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: "#1E3245", fontFamily: "var(--font-barlow)" }}
            >
              {group.section}
            </p>

            <ul>
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname?.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="flex items-center h-8 px-3 text-[13px] transition-colors duration-100 outline-none rounded-md"
                      style={{
                        color: isActive ? "#00C9A7" : "#3D5568",
                        fontWeight: isActive ? 600 : 400,
                        borderLeft: isActive
                          ? "2px solid #00C9A7"
                          : "2px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.color = "#7A9DB8";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.color = "#3D5568";
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        className="shrink-0 px-4 py-4"
        style={{ borderTop: "1px solid #1A2B3C" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: "#1A2B3C", color: "#00C9A7" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[12.5px] font-semibold truncate"
              style={{ color: "#7A9DB8" }}
            >
              {user?.fullName || "Usuario"}
            </p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-1 rounded transition-colors duration-100"
              style={{ color: "#1E3245" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#EF4444")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#1E3245")
              }
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
