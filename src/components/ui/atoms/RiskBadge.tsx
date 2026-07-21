import { cn } from "@/lib/utils";

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'SIN_RIESGO' | 'BAJO' | 'MEDIO' | 'ALTO' | 'MUY_ALTO';

const RISK_CONFIG: Record<RiskLevel, { label: string; class: string }> = {
  NONE: { label: 'Sin Riesgo', class: 'bg-risk-none-bg text-risk-none-text border-risk-none-border' },
  LOW: { label: 'Bajo', class: 'bg-risk-low-bg text-risk-low-text border-risk-low-border' },
  MEDIUM: { label: 'Medio', class: 'bg-risk-medium-bg text-risk-medium-text border-risk-medium-border' },
  HIGH: { label: 'Alto', class: 'bg-risk-high-bg text-risk-high-text border-risk-high-border' },
  VERY_HIGH: { label: 'Muy Alto', class: 'bg-risk-veryhigh-bg text-risk-veryhigh-text border-risk-veryhigh-border' },
  // Spanish aliases for Prisma compatibility
  SIN_RIESGO: { label: 'Sin Riesgo', class: 'bg-risk-none-bg text-risk-none-text border-risk-none-border' },
  BAJO: { label: 'Bajo', class: 'bg-risk-low-bg text-risk-low-text border-risk-low-border' },
  MEDIO: { label: 'Medio', class: 'bg-risk-medium-bg text-risk-medium-text border-risk-medium-border' },
  ALTO: { label: 'Alto', class: 'bg-risk-high-bg text-risk-high-text border-risk-high-border' },
  MUY_ALTO: { label: 'Muy Alto', class: 'bg-risk-veryhigh-bg text-risk-veryhigh-text border-risk-veryhigh-border' },
};

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  showDot?: boolean;
}

export function RiskBadge({ level, className, showDot = true }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium border transition-colors",
        config.class,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            // Use the text color for the dot as it represents the solid color of the level
            level === 'NONE' || level === 'SIN_RIESGO' ? "bg-risk-none-text" :
            level === 'LOW' || level === 'BAJO' ? "bg-risk-low-text" :
            level === 'MEDIUM' || level === 'MEDIO' ? "bg-risk-medium-text" :
            level === 'HIGH' || level === 'ALTO' ? "bg-risk-high-text" :
            "bg-risk-veryhigh-text"
          )}
        />
      )}
      {config.label}
    </div>
  );
}
