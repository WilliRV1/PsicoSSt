import { Icons } from "@/components/icons";

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

function getStatus(val: number) {
  if (val >= 85) return { label: "Excelente", color: "#00C9A7" };
  if (val >= 70) return { label: "Saludable", color: "#2979FF" };
  if (val >= 50) return { label: "Regular",   color: "#F59E0B" };
  return            { label: "Crítico",    color: "#EF4444" };
}

function segmentColor(i: number, score: number): string {
  const threshold = i * 10;
  if (score <= threshold) return "rgba(22, 38, 56, 0.8)";
  // Gradient: green at low index → yellow → red (high index)
  if (i < 5) {
    // 0-4 → teal to blue
    const t = i / 4;
    const r = Math.round(0 + t * 41);
    const g = Math.round(201 - t * 80);
    const b = Math.round(167 + t * 88);
    return `rgb(${r},${g},${b})`;
  } else {
    // 5-9 → blue to red
    const t = (i - 5) / 4;
    const r = Math.round(41 + t * 198);
    const g = Math.round(121 - t * 121);
    const b = Math.round(255 - t * 255);
    return `rgb(${r},${g},${b})`;
  }
}

export function HealthScore({ score, trend, factors }: HealthScoreProps) {
  const status = getStatus(score);
  const trendPositive = trend >= 0;

  return (
    <div
      className="flex flex-col p-6 rounded-2xl h-full"
      style={{ background: "#0B1929", border: "1px solid #162638" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
            style={{ color: "#2E4A62", fontFamily: "var(--font-barlow)" }}
          >
            Índice de Salud
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="text-[52px] font-bold leading-none"
              style={{
                color: status.color,
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              {score}
            </span>
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[15px] font-bold"
                style={{ color: status.color, fontFamily: "var(--font-barlow)" }}
              >
                {status.label}
              </span>
              <span
                className="text-[11px] flex items-center gap-1"
                style={{ color: "#2E4A62" }}
              >
                {trendPositive ? (
                  <Icons.arrowUp className="w-3 h-3" style={{ color: "#10B981" }} />
                ) : (
                  <Icons.arrowDown className="w-3 h-3" style={{ color: "#EF4444" }} />
                )}
                {Math.abs(trend)} este mes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-0.5 mb-6 w-full h-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-500"
            style={{ background: segmentColor(i, score) }}
          />
        ))}
      </div>

      {/* Factors */}
      <div
        className="pt-4 flex-1"
        style={{ borderTop: "1px solid #121F2E" }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-4"
          style={{ color: "#243C55", fontFamily: "var(--font-barlow)" }}
        >
          Factores de impacto
        </p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <FactorItem label="Evaluaciones" value={factors.evaluations} />
          <FactorItem label="Cumplimiento"  value={factors.compliance} />
          <FactorItem label="Intervenciones" value={factors.interventions} />
          <FactorItem label="Seguimiento"   value={factors.tracking} />
          <FactorItem label="Planes"        value={factors.plans} />
          <FactorItem label="Evidencias"    value={factors.evidence} />
        </div>
      </div>
    </div>
  );
}

function FactorItem({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? "#00C9A7" : value >= 55 ? "#2979FF" : value >= 35 ? "#F59E0B" : "#EF4444";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span
          className="text-[11.5px] font-medium truncate pr-1"
          style={{ color: "#3A5872", fontFamily: "var(--font-source-sans)" }}
        >
          {label}
        </span>
        <span
          className="text-[11px] font-bold flex-shrink-0"
          style={{ color, fontFamily: "var(--font-jetbrains-mono)" }}
        >
          {value}%
        </span>
      </div>
      <div
        className="w-full h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(22, 38, 56, 0.8)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}
