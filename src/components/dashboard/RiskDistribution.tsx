interface RiskDistributionProps {
  distribution: {
    none: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
  total: number;
}

const LEVELS = [
  { key: "none",     label: "Sin riesgo", color: "#4A5F70" },
  { key: "low",      label: "Bajo",       color: "#16A34A" },
  { key: "medium",   label: "Medio",      color: "#D97706" },
  { key: "high",     label: "Alto",       color: "#EA580C" },
  { key: "veryHigh", label: "Muy alto",   color: "#DC2626" },
] as const;

export function RiskDistribution({ distribution, total }: RiskDistributionProps) {
  const pct = (val: number) =>
    total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <div
      className="p-6 rounded-xl flex flex-col gap-5 h-full"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-barlow)" }}
        >
          Distribución del riesgo
        </p>
        <span
          className="text-[12px]"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {total}
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {LEVELS.map(({ key, label, color }) => {
          const val = distribution[key];
          const p = pct(val);
          return (
            <div key={key} className="flex items-center gap-3">
              <p
                className="text-[12px] w-[72px] shrink-0"
                style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}
              >
                {label}
              </p>
              <div
                className="flex-1 h-[3px] rounded-full overflow-hidden"
                style={{ background: "var(--color-border)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${p > 0 ? Math.max(p, 1) : 0}%`, background: color }}
                />
              </div>
              <p
                className="text-[12px] w-8 text-right shrink-0"
                style={{
                  color: p > 0 ? color : "var(--color-text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {p}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
