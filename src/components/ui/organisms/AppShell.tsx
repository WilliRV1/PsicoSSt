"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandPalette } from "./CommandPalette";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    fullName: string;
    email: string;
    creditBalance: number;
  } | null;
}

function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);
  
  // Custom label map for translation
  const labels: Record<string, string> = {
    dashboard: "Inicio",
    companies: "Empresas",
    organizations: "Empresas",
    workers: "Trabajadores",
    assessments: "Evaluaciones",
    reports: "Reportes"
  };

  return (
    <nav className="flex items-center text-[13px] font-medium text-text-muted mb-6">
      <Link href="/dashboard" className="hover:text-primary transition-colors">
        Inicio
      </Link>
      {segments.map((segment, index) => {
        // Skip dashboard as we hardcoded it
        if (segment === "dashboard") return null;
        
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = labels[segment] || segment;

        return (
          <div key={href} className="flex items-center">
            <ChevronRight className="w-3.5 h-3.5 mx-2 flex-shrink-0" />
            {isLast ? (
              <span className="text-foreground capitalize">{label}</span>
            ) : (
              <Link href={href} className="hover:text-primary transition-colors capitalize">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, user }: AppShellProps) {
  const shouldReduceMotion = useReducedMotion();
  const pathname = usePathname();
  
  // Focus Mode for manual data entry
  const isFocusMode = pathname?.includes('/assessments/new/manual');
  
  if (isFocusMode) {
    return (
      <div className="flex min-h-screen w-full bg-background overflow-hidden items-center justify-center">
        <main className="w-full max-w-5xl overflow-auto p-4 sm:p-6 lg:p-8 focus-visible:outline-none" tabIndex={-1}>
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeOut" }}
            className="w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 focus-visible:outline-none" tabIndex={-1}>
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeOut" }}
            className="mx-auto max-w-7xl h-full"
          >
            <Breadcrumbs />
            {children}
          </motion.div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
