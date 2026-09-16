import { cn } from "@/lib/utils";

/**
 * Insignia de nivel de riesgo.
 *
 * Antes coloreaba sólo el punto con clases sueltas de Tailwind
 * (`bg-green-500`, `bg-lime-500`…) sobre un fondo neutro fijo: ignoraba por
 * completo los tokens `--color-risk-*` que ya existían en globals.css, así
 * que el modo oscuro y cualquier ajuste de paleta no le llegaban. Ahora el
 * fondo, el texto y el punto salen de esos tokens.
 *
 * Acepta tanto el enum de Prisma (`SIN_RIESGO`…`MUY_ALTO`, como lo devuelve
 * `scoredResult.overallRiskCategory`) como el inglés que ya usaban algunas
 * pantallas (`NONE`…`VERY_HIGH`), para no romper a quien ya la consumía.
 */
export type RiskLevel =
  | "NONE" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
  | "SIN_RIESGO" | "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO"
  | "INVALIDO";

type RiskToken = "none" | "low" | "medium" | "high" | "veryhigh";

/**
 * `token: null` = no es un nivel de la escala. `INVALIDO` existe en el enum
 * `RiskCategory` de Prisma (cuestionario descartado por preguntas de control
 * o por faltantes) y no tiene posición ordinal ni color de riesgo: pintarlo
 * como "sin riesgo" diría lo contrario de lo que pasó.
 */
const RISK_CONFIG: Record<RiskLevel, { label: string; token: RiskToken | null }> = {
  NONE: { label: "Sin riesgo", token: "none" },
  SIN_RIESGO: { label: "Sin riesgo", token: "none" },
  LOW: { label: "Bajo", token: "low" },
  BAJO: { label: "Bajo", token: "low" },
  MEDIUM: { label: "Medio", token: "medium" },
  MEDIO: { label: "Medio", token: "medium" },
  HIGH: { label: "Alto", token: "high" },
  ALTO: { label: "Alto", token: "high" },
  VERY_HIGH: { label: "Muy alto", token: "veryhigh" },
  MUY_ALTO: { label: "Muy alto", token: "veryhigh" },
  INVALIDO: { label: "No válido", token: null },
};

const NEUTRAL_VARS = {
  bg: "var(--color-surface-muted)",
  text: "var(--color-text-muted)",
  border: "var(--color-border)",
  solid: "var(--color-text-muted)",
};

/**
 * Nunca lanza: una insignia recibiendo una categoría que no conoce no puede
 * tumbar la página que la contiene. Antes `RISK_CONFIG[level]` devolvía
 * `undefined` con `INVALIDO` y el `.token` siguiente reventaba el render
 * completo de /dashboard/assessments y /dashboard/reports con un 500.
 */
function resolve(level: RiskLevel | null | undefined) {
  return RISK_CONFIG[level as RiskLevel] ?? { label: String(level ?? "—"), token: null };
}

// Orden ordinal fijo, de menor a mayor. Es lo que hace posible el indicador
// de pasos: la posición dice el nivel antes que el color, así que sobrevive
// a la impresión en gris y al daltonismo.
const STEP_ORDER: RiskToken[] = ["none", "low", "medium", "high", "veryhigh"];
const STEP_LABELS: Record<RiskToken, string> = {
  none: "Sin riesgo",
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  veryhigh: "Muy alto",
};

function tokenVars(token: RiskToken) {
  return {
    bg: `var(--color-risk-${token}-bg)`,
    text: `var(--color-risk-${token}-text)`,
    border: `var(--color-risk-${token}-border)`,
    solid: `var(--color-risk-${token}-solid)`,
  };
}

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  showDot?: boolean;
  /** Añade el indicador ordinal de cinco pasos junto a la insignia. */
  showSteps?: boolean;
  size?: "sm" | "md";
}

export function RiskBadge({ level, className, showDot = true, showSteps = false, size = "md" }: RiskBadgeProps) {
  const config = resolve(level);
  const vars = config.token ? tokenVars(config.token) : NEUTRAL_VARS;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showSteps && <RiskSteps level={level} />}
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        )}
        style={{ background: vars.bg, color: vars.text }}
      >
        {showDot && (
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: vars.solid }}
            aria-hidden="true"
          />
        )}
        {config.label}
      </span>
    </span>
  );
}

/**
 * Indicador ordinal de cinco pasos: el nivel activo macizo, el resto en una
 * pista apagada. Acompaña a la insignia para que el nivel no dependa sólo
 * del color — legible en gris, con daltonismo, o a tamaño de miniatura en
 * una tabla densa.
 */
export function RiskSteps({ level, className }: { level: RiskLevel; className?: string }) {
  // Un nivel sin posición ordinal (INVALIDO) deja la pista entera apagada:
  // `indexOf(null)` es -1, así que ningún paso se enciende.
  const activeToken = resolve(level).token;
  const activeIdx = activeToken ? STEP_ORDER.indexOf(activeToken) : -1;
  return (
    <span className={cn("inline-flex items-center gap-[3px]", className)} aria-hidden="true">
      {STEP_ORDER.map((token, i) => {
        const on = activeToken !== null && i <= activeIdx;
        return (
          <span
            key={token}
            className="h-1.5 w-3.5 rounded-full"
            style={{ background: on ? tokenVars(activeToken!).solid : "var(--color-surface-muted)" }}
          />
        );
      })}
    </span>
  );
}

/**
 * Semáforo de riesgo a escala grande, para una ficha o un encabezado de
 * detalle — no una tabla. El punto activo crece y el resto se apaga.
 */
export function RiskSemaphore({
  level,
  score,
  label,
  className,
}: {
  level: RiskLevel;
  score?: number;
  label?: string;
  className?: string;
}) {
  const config = resolve(level);
  const activeToken = config.token;
  const activeIdx = activeToken ? STEP_ORDER.indexOf(activeToken) : -1;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        {STEP_ORDER.map((token, i) => {
          const isActive = i === activeIdx;
          return (
            <span
              key={token}
              className={cn("rounded-full transition-all", isActive ? "h-6 w-6" : "h-4 w-4 opacity-30")}
              style={{
                background: tokenVars(token).solid,
                boxShadow: isActive ? `0 0 0 2px var(--color-background), 0 0 0 4px ${tokenVars(token).solid}` : undefined,
              }}
              title={STEP_LABELS[token]}
            />
          );
        })}
      </div>
      <div className="text-center">
        <p
          className="text-lg font-semibold"
          style={{ color: activeToken ? tokenVars(activeToken).text : NEUTRAL_VARS.text }}
        >
          {config.label}
        </p>
        {score !== undefined && (
          <p className="text-sm text-text-muted font-mono tabular-nums">{score.toFixed(1)} puntos</p>
        )}
        {label && <p className="mt-0.5 text-xs text-text-muted">{label}</p>}
      </div>
    </div>
  );
}
