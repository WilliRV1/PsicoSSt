"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/psicosst/logo";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Centro de Control", href: "/dashboard", icon: "dashboard" },
  { name: "Empresas", href: "/dashboard/organizations", icon: "company" },
  { name: "Trabajadores", href: "/dashboard/workers", icon: "worker" },
  { name: "Evaluaciones", href: "/dashboard/assessments", icon: "report" },
  { name: "Reportes", href: "/dashboard/reports", icon: "analytics" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-full flex-shrink-0 flex flex-col bg-[#0F172A] border-r border-[#1e293b]">
      <div className="h-16 flex items-center px-6 border-b border-[#1e293b]/50">
        <Logo light />
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="mb-4 px-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Plataforma
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = Icons[item.icon as keyof typeof Icons];
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-4 px-3 py-2 text-[15px] rounded-lg transition-colors duration-150",
                  isActive 
                    ? "text-white font-medium bg-slate-800/50" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-500 rounded-r-full" />
                )}
                
                <Icon className={cn("w-5 h-5", isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-[#1e293b]/50">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-4 px-3 py-2 text-[15px] text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800/30"
        >
          <Icons.settings className="w-5 h-5 text-slate-500" />
          Configuración
        </Link>
      </div>
    </aside>
  );
}
