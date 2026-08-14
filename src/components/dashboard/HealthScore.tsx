interface HealthScoreProps {
  score: number;
  trend: number;
  factors: {
    evaluations: number;
    compliance: number;
    interventions: number;
    tracking: number;
    plans: number;
    evidence: number;
  };
}

function label(v: number) {
  if (v >= 85) return { text: "Excelente", color: "#009A80" };
  if (v >= 70) return { text: "Saludable",  color: "#16A34A" };
  if (v >= 50) return { text: "Regular",    color: "#D97706" };
  return           { text: "Crítico",     color: "#DC2626" };
}

const FACTORS: { key: keyof HealthScoreProps["factors"]; name: string }[] = [
  { key: "evaluations",   name: "Evaluaciones" },
  { key: "compliance",    name: "Cumplimiento" },
  { key: "interventions", name: "Intervenciones" },
  { key: "tracking",      name: "Seguimiento" },
  { key: "plans",         name: "Planes" },
  { key: "evidence",      name: "Evidencias" },
];

export function HealthScore({ score, trend, factors }: HealthScoreProps) {
  const { text, color } = label(score);
  const trendUp = trend >= 0;

  return (
    <div
      className="p-6 rounded-xl flex flex-col gap-5 h-full"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Header */}
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-barlow)" }}
      >
        Índice de salud
      </p>

      {/* Score */}
      <div className="flex items-baseline gap-3">
        <span
          className="text-[56px] leading-none font-semibold"
          style={{ color, fontFamily: "var(--font-mono)" }}
        >
          {score}
        </span>
        <div>
          <p className="text-[14px] font-semibold" style={{ color, fontFamily: "var(--font-barlow)" }}>
            {text}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {trendUp ? "↑" : "↓"} {Math.abs(trend)} este mes
          </p>
        </div>
      </div>

      {/* Segments */}
      <div className="flex gap-0.5 h-1.5">
        {Array.from({ length: 10 }).map((_, i) => {
          const filled = score > i * 10;
          const segColor = i < 4 ? "#009A80" : i < 7 ? "#D97706" : "#DC2626";
          return (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{ background: filled ? segColor : "var(--color-border)" }}
            />
          );
        })}
      </div>

      {/* Factors */}
      <div
        className="pt-4 space-y-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-barlow)" }}
        >
          Factores
        </p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          {FACTORS.map(({ key, name }) => {
            const v = factors[key];
            const fc = v >= 70 ? "#009A80" : v >= 40 ? "#D97706" : "#DC2626";
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                    {name}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: fc, fontFamily: "var(--font-mono)" }}
                  >
                    {v}%
                  </span>
                </div>
                <div
                  className="h-[2px] rounded-full overflow-hidden"
                  style={{ background: "var(--color-border)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${v}%`, background: fc }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
