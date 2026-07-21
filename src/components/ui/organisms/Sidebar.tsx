"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarProps {
  user?: {
    fullName: string;
    email: string;
    creditBalance: number;
  } | null;
}

const MENU_GROUPS = [
  {
    title: "CENTRO DE CONTROL",
    items: [
      { name: "Centro de Control", href: "/dashboard", icon: "dashboard" },
      { name: "Empresas", href: "/dashboard/organizations", icon: "company" },
      { name: "Trabajadores", href: "/dashboard/workers", icon: "worker" },
      { name: "Evaluaciones", href: "/dashboard/assessments", icon: "certificate" },
      { name: "Intervenciones", href: "/dashboard/interventions", icon: "intervention" },
      { name: "Seguimiento", href: "/dashboard/store", icon: "shoppingCart" },
    ],
  },
  {
    title: "INTELIGENCIA",
    items: [
      { name: "Analítica", href: "/dashboard/analytics", icon: "analytics" },
      { name: "Decisiones IA", href: "/dashboard/ai", icon: "ai" },
      { name: "Reportes", href: "/dashboard/reports", icon: "report" },
      { name: "Tendencias", href: "/dashboard/trends", icon: "analytics" },
    ],
  },
  {
    title: "ADMINISTRACIÓN",
    items: [
      { name: "Usuarios", href: "/dashboard/users", icon: "user" },
      { name: "Roles", href: "/dashboard/roles", icon: "shield" },
      { name: "Configuración", href: "/dashboard/settings", icon: "settings" },
    ],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="w-[280px] h-screen bg-[#0F172A] flex-shrink-0 flex flex-col border-r border-slate-800 text-slate-300 relative">
      {/* Logo Area */}
      <div className="pt-8 pb-6 px-6 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Icons.shield className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[17px] text-white tracking-tight leading-none">PsicoSST</span>
          <span className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Inteligencia Gerencial</span>
        </div>
      </div>

      {/* Navigation Area */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 no-scrollbar">
        {MENU_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx}>
            <div className="px-3 mb-3 flex items-center gap-4">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                {group.title}
              </h3>
              <div className="h-px bg-white/5 flex-1" />
            </div>
            
            <ul className="space-y-[6px]">
              {group.items.map((item) => {
                const Icon = Icons[item.icon as keyof typeof Icons] || Icons.dashboard;
                // Active state logic
                const isActive = item.href === "/dashboard" 
                  ? pathname === "/dashboard" 
                  : pathname?.startsWith(item.href);

                return (
                  <li key={item.name} className="relative">
                    {/* Active Indicator (subtle capsule on the left) */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-teal-500 transition-transform duration-200 ${isActive ? "scale-y-100" : "scale-y-0"}`} />
                    
                    <Link
                      href={item.href}
                      className={`
                        group flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50
                        ${isActive 
                          ? "bg-white/5 text-white font-semibold" 
                          : "font-medium hover:bg-white/5 hover:text-white"
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-teal-400" : "text-slate-400 group-hover:text-slate-300"}`} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="shrink-0 p-4 border-t border-white/5 space-y-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
        >
          <div className="flex items-center gap-3">
            {mounted && theme === "dark" ? (
              <Sun className="w-5 h-5 shrink-0 text-slate-400" />
            ) : (
              <Moon className="w-5 h-5 shrink-0 text-slate-400" />
            )}
            <span>Modo oscuro</span>
          </div>
          {/* Custom Toggle Switch purely visual for aesthetics */}
          <div className="w-8 h-4 bg-slate-800 rounded-full relative border border-white/10">
             <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${mounted && theme === "dark" ? "left-4 bg-teal-400" : "left-0.5 bg-slate-500"}`} />
          </div>
        </button>

        <div className="h-px bg-white/5 w-full my-2" />

        {/* User Profile */}
        <div className="flex flex-col gap-3 px-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-white/10 text-white font-bold text-sm">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[14px] font-semibold text-white truncate">
                {user?.fullName || "Usuario"}
              </span>
              <span className="text-[12px] text-slate-400 truncate">Administrador</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-slate-500 font-medium">v2.0.0</span>
            <form action="/api/auth/signout" method="POST">
              <button 
                type="submit"
                className="flex items-center gap-2 text-[13px] font-medium text-slate-400 hover:text-red-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
