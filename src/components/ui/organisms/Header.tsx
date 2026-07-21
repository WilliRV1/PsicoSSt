import { useState } from "react";
import { Icons } from "@/components/icons";
import { Moon, Sun, Building2, Check, ChevronsUpDown } from "lucide-react";

export function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [activeOrg, setActiveOrg] = useState("Clínica ABC");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-border bg-surface">
      <div className="flex items-center gap-6">
        {/* Active Organization Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground bg-surface hover:bg-surface-muted rounded-md border border-transparent hover:border-border transition-colors group"
          >
            <Building2 className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            <span className="max-w-[150px] truncate">{activeOrg}</span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-text-muted" />
          </button>
          
          {showOrgDropdown && (
            <div className="absolute top-full left-0 mt-1 w-[240px] bg-card border border-border shadow-elevated rounded-xl py-1 z-50">
              <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Tus Empresas
              </div>
              <button 
                onClick={() => { setActiveOrg("Clínica ABC"); setShowOrgDropdown(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-surface-muted transition-colors"
              >
                <span>Clínica ABC</span>
                {activeOrg === "Clínica ABC" && <Check className="w-4 h-4 text-primary" />}
              </button>
              <button 
                onClick={() => { setActiveOrg("Industrias XYZ"); setShowOrgDropdown(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-surface-muted transition-colors"
              >
                <span>Industrias XYZ</span>
                {activeOrg === "Industrias XYZ" && <Check className="w-4 h-4 text-primary" />}
              </button>
            </div>
          )}
        </div>

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
        {/* Notifications */}
        <button className="relative p-2 text-text-secondary hover:text-text transition-colors rounded-full hover:bg-surface-muted">
          <Icons.alert className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
        </button>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-text-secondary hover:text-text transition-colors rounded-full hover:bg-surface-muted"
          title="Cambiar tema"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        
        {/* User Profile */}
        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            DG
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium leading-none text-foreground">Dra. Gómez</p>
            <p className="text-xs text-text-secondary mt-1">Psicóloga SST</p>
          </div>
          <Icons.chevronDown className="w-4 h-4 text-text-muted ml-2" />
        </div>
      </div>
    </header>
  );
}
