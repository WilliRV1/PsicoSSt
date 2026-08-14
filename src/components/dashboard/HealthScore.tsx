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
  if (v >= 85) return { text: "Excelente", color: "#00C9A7" };
  if (v >= 70) return { text: "Saludable", color: "#22C55E" };
  if (v >= 50) return { text: "Regular",   color: "#F59E0B" };
  return            { text: "Crítico",    color: "#EF4444" };
}

const FACTORS: { key: keyof HealthScoreProps["factors"]; name: string }[] = [
  { key: "evaluations",  name: "Evaluaciones" },
  { key: "compliance",   name: "Cumplimiento" },
  { key: "interventions",name: "Intervenciones" },
  { key: "tracking",     name: "Seguimiento" },
  { key: "plans",        name: "Planes" },
  { key: "evidence",     name: "Evidencias" },
];

export function HealthScore({ score, trend, factors }: HealthScoreProps) {
  const { text, color } = label(score);
  const trendUp = trend >= 0;

  return (
    <div
      className="p-6 rounded-xl flex flex-col gap-5 h-full"
      style={{ background: "#0F1C2A", border: "1px solid #1A2B3C" }}
    >
      {/* Header */}
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "#293D50", fontFamily: "var(--font-barlow)" }}
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
          <p className="text-[11px] mt-0.5" style={{ color: "#293D50" }}>
            {trendUp ? "↑" : "↓"} {Math.abs(trend)} este mes
          </p>
        </div>
      </div>

      {/* Segments */}
      <div className="flex gap-0.5 h-1.5">
        {Array.from({ length: 10 }).map((_, i) => {
          const filled = score > i * 10;
          const segColor = i < 4 ? "#00C9A7" : i < 7 ? "#F59E0B" : "#EF4444";
          return (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{ background: filled ? segColor : "#1A2B3C" }}
            />
          );
        })}
      </div>

      {/* Factors */}
      <div
        className="pt-4 space-y-3"
        style={{ borderTop: "1px solid #1A2B3C" }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#1E3245", fontFamily: "var(--font-barlow)" }}
        >
          Factores
        </p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          {FACTORS.map(({ key, name }) => {
            const v = factors[key];
            const fc = v >= 70 ? "#00C9A7" : v >= 40 ? "#F59E0B" : "#EF4444";
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px]" style={{ color: "#3D5568" }}>
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
                  style={{ background: "#1A2B3C" }}
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
