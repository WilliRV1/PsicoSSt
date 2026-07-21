import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { Moon, Sun, Building2, Check, ChevronsUpDown, Coins, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface HeaderProps {
  user?: {
    fullName: string;
    email: string;
    creditBalance: number;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };
  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-border bg-white dark:bg-slate-900">
      <div className="flex items-center gap-6">

        {/* Command Palette Trigger */}
        <button 
          onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary bg-surface-muted rounded-md border border-border-muted hover:border-border transition-colors group"
        >
          <Icons.search className="w-4 h-4 text-text-muted group-hover:text-text-secondary" />
          <span className="hidden sm:inline">Buscar...</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] font-medium text-text-muted ml-4">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Credits Badge */}
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-900">
            <Coins className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{user.creditBalance}</span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-500">créditos</span>
          </div>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 text-text-secondary hover:text-text transition-colors rounded-full hover:bg-surface-muted">
              <Icons.alert className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-text-muted">
              No hay notificaciones nuevas
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-text-secondary hover:text-text transition-colors rounded-full hover:bg-surface-muted"
          title="Cambiar tema"
        >
          {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-4 border-l border-border outline-none group">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary group-hover:bg-primary/20 transition-colors">
                {getInitials(user?.fullName)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold leading-none text-foreground">{user?.fullName || "Cargando..."}</p>
                <p className="text-xs text-text-secondary mt-1 truncate max-w-[120px]">{user?.email || ""}</p>
              </div>
              <Icons.chevronDown className="w-4 h-4 text-text-muted ml-1 group-hover:text-text transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              // Sign out logic
              window.location.href = "/api/auth/signout";
            }} className="cursor-pointer text-danger focus:text-danger focus:bg-danger/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
