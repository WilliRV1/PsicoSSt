"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { LogOut } from "lucide-react";

interface SidebarProps {
  user?: {
    fullName: string;
    email: string;
    creditBalance: number;
  } | null;
}

const MENU_GROUPS = [
  {
    title: "Operaciones",
    items: [
      { name: "Centro de Control", href: "/dashboard", icon: "dashboard" },
      { name: "Empresas", href: "/dashboard/organizations", icon: "company" },
      { name: "Trabajadores", href: "/dashboard/workers", icon: "worker" },
      { name: "Evaluaciones", href: "/dashboard/assessments", icon: "certificate" },
      { name: "Intervenciones", href: "/dashboard/interventions", icon: "intervention" },
    ],
  },
  {
    title: "Inteligencia",
    items: [
      { name: "Analítica", href: "/dashboard/analytics", icon: "analytics" },
      { name: "Decisiones IA", href: "/dashboard/ai", icon: "ai" },
      { name: "Reportes", href: "/dashboard/reports", icon: "report" },
      { name: "Tendencias", href: "/dashboard/trends", icon: "analytics" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { name: "Configuración", href: "/dashboard/settings", icon: "settings" },
    ],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <aside
      className="sidebar w-[248px] h-screen flex-shrink-0 flex flex-col"
      style={{
        background: "#07101C",
        borderRight: "1px solid #121F2E",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 shrink-0">
        <Link href="/dashboard" className="block w-fit">
          <Image
            src="/logo-dark.png"
            alt="PsicoSST"
            width={144}
            height={40}
            className="object-contain h-9 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Brand accent divider */}
      <div
        className="mx-5 h-px shrink-0 mb-5"
        style={{
          background:
            "linear-gradient(90deg, #00C9A7 0%, #2979FF 60%, transparent 100%)",
          opacity: 0.6,
        }}
      />

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-5">
        {MENU_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx}>
            <p
              className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{
                color: "#243C55",
                fontFamily: "var(--font-barlow)",
              }}
            >
              {group.title}
            </p>

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon =
                  Icons[item.icon as keyof typeof Icons] || Icons.dashboard;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname?.startsWith(item.href);

                return (
                  <li key={item.name} className="relative">
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{
                          background:
                            "linear-gradient(180deg, #00C9A7 0%, #2979FF 100%)",
                        }}
                      />
                    )}

                    <Link
                      href={item.href}
                      prefetch={false}
                      className={[
                        "group flex items-center gap-2.5 pl-4 pr-3 py-[7px] rounded-lg text-[13px] font-medium",
                        "transition-all duration-150 outline-none",
                        isActive
                          ? "text-white"
                          : "text-[#3A5872] hover:text-[#9ABDD4] hover:bg-white/[0.035]",
                      ].join(" ")}
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(90deg, rgba(0,201,167,0.1) 0%, rgba(41,121,255,0.04) 100%)",
                            }
                          : {}
                      }
                    >
                      <Icon
                        className="w-4 h-4 shrink-0 transition-colors"
                        style={{ color: isActive ? "#00C9A7" : undefined }}
                      />
                      <span style={{ fontFamily: "var(--font-source-sans)" }}>
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User footer ──────────────────────────────────── */}
      <div
        className="shrink-0 p-3 mt-2"
        style={{ borderTop: "1px solid #121F2E" }}
      >
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 select-none"
            style={{
              background: "linear-gradient(135deg, #00C9A7, #2979FF)",
            }}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[13px] font-semibold truncate leading-tight"
              style={{ color: "#C4DAE8" }}
            >
              {user?.fullName || "Usuario"}
            </p>
            <p
              className="text-[10.5px] truncate leading-tight mt-0.5 uppercase tracking-wide"
              style={{
                color: "#243C55",
                fontFamily: "var(--font-barlow)",
              }}
            >
              Psicólogo · v2.0
            </p>
          </div>

          {/* Sign out */}
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="p-1.5 rounded-lg transition-all duration-150 text-[#243C55] hover:text-red-400 hover:bg-red-500/10"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
