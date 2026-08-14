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
  { key: "none",     label: "Sin riesgo", color: "#4E6478" },
  { key: "low",      label: "Bajo",       color: "#22C55E" },
  { key: "medium",   label: "Medio",      color: "#F59E0B" },
  { key: "high",     label: "Alto",       color: "#F97316" },
  { key: "veryHigh", label: "Muy alto",   color: "#EF4444" },
] as const;

export function RiskDistribution({ distribution, total }: RiskDistributionProps) {
  const pct = (val: number) =>
    total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <div
      className="p-6 rounded-xl flex flex-col gap-5 h-full"
      style={{ background: "#0F1C2A", border: "1px solid #1A2B3C" }}
    >
      <div className="flex items-baseline justify-between">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#293D50", fontFamily: "var(--font-barlow)" }}
        >
          Distribución del riesgo
        </p>
        <span
          className="text-[12px]"
          style={{ color: "#293D50", fontFamily: "var(--font-mono)" }}
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
                style={{ color: "#3D5568", fontFamily: "var(--font-sans)" }}
              >
                {label}
              </p>
              <div
                className="flex-1 h-[3px] rounded-full overflow-hidden"
                style={{ background: "#1A2B3C" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(p, p > 0 ? 1 : 0)}%`, background: color }}
                />
              </div>
              <p
                className="text-[12px] w-8 text-right shrink-0"
                style={{ color: p > 0 ? color : "#293D50", fontFamily: "var(--font-mono)" }}
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
