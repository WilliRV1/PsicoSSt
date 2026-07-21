import { cn } from "@/lib/utils";

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'SIN_RIESGO' | 'BAJO' | 'MEDIO' | 'ALTO' | 'MUY_ALTO';

const RISK_CONFIG: Record<RiskLevel, { label: string; dotClass: string }> = {
  NONE: { label: 'Sin Riesgo', dotClass: 'bg-green-500' },
  LOW: { label: 'Bajo', dotClass: 'bg-lime-500' },
  MEDIUM: { label: 'Medio', dotClass: 'bg-yellow-500' },
  HIGH: { label: 'Alto', dotClass: 'bg-orange-500' },
  VERY_HIGH: { label: 'Muy Alto', dotClass: 'bg-red-500' },
  SIN_RIESGO: { label: 'Sin Riesgo', dotClass: 'bg-green-500' },
  BAJO: { label: 'Bajo', dotClass: 'bg-lime-500' },
  MEDIO: { label: 'Medio', dotClass: 'bg-yellow-500' },
  ALTO: { label: 'Alto', dotClass: 'bg-orange-500' },
  MUY_ALTO: { label: 'Muy Alto', dotClass: 'bg-red-500' },
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
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border border-border bg-surface/30 text-text-secondary shadow-sm transition-colors",
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            config.dotClass
          )}
        />
      )}
      {config.label}
    </div>
  );
}
