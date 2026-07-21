"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, Users, FileText, ClipboardList, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Handle Ctrl+K shortcut and custom event
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    const openPalette = () => setOpen(true);
    
    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", openPalette);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", openPalette);
    };
  }, []);

  const commands = [
    { name: "Buscar empresa", icon: <Search className="w-4 h-4" />, action: () => router.push("/dashboard/organizations") },
    { name: "Buscar trabajador", icon: <Search className="w-4 h-4" />, action: () => router.push("/dashboard/workers") },
    { name: "Nueva evaluación", icon: <ClipboardList className="w-4 h-4" />, action: () => router.push("/dashboard/assessments/new/manual") },
    { name: "Nuevo trabajador", icon: <Users className="w-4 h-4" />, action: () => router.push("/dashboard/workers?new=true") },
    { name: "Nueva empresa", icon: <Building2 className="w-4 h-4" />, action: () => router.push("/dashboard/organizations?new=true") },
    { name: "Nueva intervención", icon: <FileText className="w-4 h-4" />, action: () => router.push("/dashboard/interventions/new") },
    { name: "Ir a configuración", icon: <Settings className="w-4 h-4" />, action: () => router.push("/dashboard/settings") },
    { name: "Cerrar Sesión", icon: <LogOut className="w-4 h-4" />, action: () => router.push("/api/auth/signout") },
  ];

  const filteredCommands = query === "" 
    ? commands 
    : commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (action: () => void) => {
    action();
    setOpen(false);
    setQuery("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-xl bg-card border border-border shadow-elevated rounded-xl z-[101] overflow-hidden"
          >
            <div className="flex items-center border-b border-border px-4 py-3">
              <Search className="w-5 h-5 text-text-muted mr-3" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar empresas, acciones o reportes..."
                className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-text-muted"
              />
              <div className="text-[10px] font-medium text-text-muted border border-border bg-surface-muted px-1.5 py-0.5 rounded ml-2">ESC</div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2 hide-scrollbar">
              {filteredCommands.length === 0 ? (
                <div className="py-14 text-center text-sm text-text-muted">
                  No se encontraron resultados para "{query}".
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Sugerencias
                  </div>
                  {filteredCommands.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(cmd.action)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-surface-muted rounded-lg transition-colors text-left group"
                    >
                      <div className="text-text-muted group-hover:text-primary transition-colors">
                        {cmd.icon}
                      </div>
                      {cmd.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
