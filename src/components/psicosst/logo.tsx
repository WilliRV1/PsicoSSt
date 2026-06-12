"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  light?: boolean
}

export function Logo({ className, iconOnly = false, light = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary-foreground" aria-hidden="true">
          <path
            d="M12 2L4 5.5V11c0 4.418 3.358 8.555 8 9.5 4.642-.945 8-5.082 8-9.5V5.5L12 2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity={0.2}
          />
          <path
            d="M8.5 12l2.5 2.5 4.5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {!iconOnly && (
        <span
          className={cn(
            "text-lg font-semibold tracking-tight",
            light ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          Psico<span className="text-primary">SST</span>
        </span>
      )}
    </div>
  )
}
