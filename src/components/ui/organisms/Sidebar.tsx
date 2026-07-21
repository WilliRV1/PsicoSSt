"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/psicosst/logo";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

const NAV_ITEMS = [
  { name: "Centro de Control", href: "/dashboard", icon: "dashboard" },
  { name: "Empresas", href: "/dashboard/organizations", icon: "company" },
  { name: "Trabajadores", href: "/dashboard/workers", icon: "worker" },
  { name: "Evaluaciones", href: "/dashboard/assessments", icon: "report" },
  { name: "Reportes", href: "/dashboard/reports", icon: "analytics" },
  { name: "Tienda", href: "/dashboard/store", icon: "shoppingCart" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-full flex-shrink-0 flex flex-col bg-[#0F172A] border-r border-[#1e293b] transition-all duration-300",
      isCollapsed ? "w-[80px]" : "w-[280px]"
    )}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1e293b]/50">
        {!isCollapsed ? (
          <Logo light />
        ) : (
          <div className="w-full flex justify-center">
            <Icons.dashboard className="w-8 h-8 text-teal-500" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 overflow-x-hidden">
        {!isCollapsed && (
          <div className="mb-4 px-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Plataforma
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = Icons[item.icon as keyof typeof Icons];
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "group relative flex items-center gap-4 py-2 rounded-lg transition-colors duration-150",
                  isCollapsed ? "px-0 justify-center" : "px-3",
                  isActive 
                    ? "text-white font-medium bg-slate-800/50" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-500 rounded-r-full" />
                )}
                
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-400")} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-[#1e293b]/50 space-y-2">
        <Link
          href="/dashboard/settings"
          title={isCollapsed ? "Configuración" : undefined}
          className={cn(
            "flex items-center gap-4 py-2 text-[15px] text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800/30",
            isCollapsed ? "px-0 justify-center" : "px-3"
          )}
        >
          <Icons.settings className="w-5 h-5 text-slate-500 flex-shrink-0" />
          {!isCollapsed && <span>Configuración</span>}
        </Link>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          className={cn(
            "w-full flex items-center gap-4 py-2 text-[15px] text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800/30",
            isCollapsed ? "px-0 justify-center" : "px-3"
          )}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-slate-500 flex-shrink-0" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-slate-500 flex-shrink-0" />
          )}
          {!isCollapsed && <span>Colapsar Menú</span>}
        </button>
      </div>
    </aside>
  );
}
