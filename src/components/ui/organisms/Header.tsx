"use client";

import { Bell, Search, Coins } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  user?: {
    fullName: string;
    email: string;
    creditBalance: number;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const credits = user?.creditBalance ?? 0;

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
      {/* Left Area: Global Search */}
      <div className="flex-1 max-w-md">
        <button className="flex items-center gap-3 w-full max-w-sm px-3 py-2 rounded-lg border border-border bg-surface-muted hover:bg-surface text-text-muted hover:text-text transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          <Search className="w-4 h-4 shrink-0" />
          <span className="text-[14px] font-medium flex-1 text-left">Buscar...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-surface border border-border text-text-muted">
            <span className="text-[10px]">Ctrl</span> K
          </kbd>
        </button>
      </div>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative text-text-muted hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full p-1">
          <Bell className="w-5 h-5" />
          {/* Unread indicator */}
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-background"></span>
        </button>

        {/* Credits */}
        <div className="flex items-center gap-3 bg-surface-muted border border-border px-3 py-1.5 rounded-full shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-semibold text-[14px]">
            <Coins className="w-4 h-4" />
            <span>{credits} créditos</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <Link 
            href="/dashboard/store"
            className="text-[13px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            + Comprar
          </Link>
        </div>
      </div>
    </header>
  );
}
