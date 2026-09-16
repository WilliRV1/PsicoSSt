"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
    isAdmin?: boolean;
  } | null;
}

// Curva de salida fuerte del manual de Emil Kowalski: es la que se usa para
// todo lo que entra en pantalla en este sistema.
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Inicio",
  organizations: "Empresas",
  workers: "Trabajadores",
  assessments: "Evaluaciones",
  reports: "Informes",
  analytics: "Analítica",
  trends: "Tendencias",
  interventions: "Intervenciones",
  ai: "Asistente IA",
  credits: "Créditos",
  store: "Planes",
  users: "Equipo",
  roles: "Roles y permisos",
  settings: "Configuración",
  profile: "Perfil",
  admin: "Administración",
  new: "Nueva",
  edit: "Editar",
  invite: "Invitar",
  manual: "Digitación manual",
  bulk: "Carga masiva",
  import: "Importar",
  diagnostic: "Diagnóstico",
  sociodemographic: "Sociodemográfico",
  sve: "Vigilancia epidemiológica",
  pending: "Pendientes",
  feedback: "Comentarios",
  audit: "Auditoría",
  psychologists: "Psicólogos",
  tutorial: "Guía rápida",
};

// Un segmento que parece un identificador (cuid/uuid) no tiene una etiqueta
// legible: mostrarlo capitalizado tal cual se lee como un error, no como una
// migaja de pan.
const looksLikeId = (s: string) => /^[a-z0-9]{20,}$/i.test(s) || /^[0-9a-f-]{8,}$/i.test(s);

function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center flex-wrap text-[13px] font-medium text-text-muted mb-6">
      <Link href="/dashboard" className="hover:text-primary transition-colors">
        Inicio
      </Link>
      {segments.map((segment, index) => {
        if (segment === "dashboard") return null;

        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = looksLikeId(segment) ? "Detalle" : SEGMENT_LABELS[segment] || segment;

        return (
          <div key={href} className="flex items-center">
            <ChevronRight className="w-3.5 h-3.5 mx-2 flex-shrink-0" />
            {isLast ? (
              <span className="text-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-primary transition-colors">
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Focus Mode for manual data entry
  const isFocusMode = pathname?.includes('/assessments/new/manual');

  if (isFocusMode) {
    return (
      <div className="flex min-h-screen w-full bg-background overflow-hidden items-center justify-center">
        <main className="w-full max-w-5xl overflow-auto p-4 sm:p-6 lg:p-8 focus-visible:outline-none" tabIndex={-1}>
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: EASE_OUT }}
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
      <Sidebar user={user} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 focus-visible:outline-none" tabIndex={-1}>
          {/*
            Deliberadamente SIN key={pathname} ni AnimatePresence aquí: un
            psicólogo navega entre estas páginas decenas de veces al día, y
            volver a reproducir una entrada de página completa en cada clic
            —con la pausa de salida que exige esperar a que el contenido
            anterior termine de desvanecerse— es justo el exceso de
            movimiento que este sistema evita en el resto del panel. El
            envoltorio sólo anima una vez, en la carga inicial; el
            movimiento de cada página vive dentro de su propio contenido
            (listas que entran escalonadas, la primera vez que se montan),
            no en un efecto de "pasar de pantalla" genérico.
          */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: EASE_OUT }}
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
