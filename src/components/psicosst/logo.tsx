"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  light?: boolean
}

export function Logo({ className, iconOnly = false, light = false }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {iconOnly ? (
        <Image 
            src="/isotipo.png" 
            alt="PsicoSST Isotipo" 
            width={32} 
            height={32} 
            className="object-contain" 
            priority
        />
      ) : (
        <Image 
            src={light ? "/logo-dark.png" : "/logo-light.png"} 
            alt="PsicoSST Logo" 
            width={140} 
            height={40} 
            className="object-contain" 
            priority
        />
      )}
    </div>
  )
}
