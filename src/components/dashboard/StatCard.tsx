import { Icons } from "@/components/icons";

interface StatCardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: keyof typeof Icons;
  trendLabel?: string;
}

const ICON_GRADIENTS: Record<string, string> = {
  report:       "linear-gradient(135deg, #00C9A7, #2979FF)",
  company:      "linear-gradient(135deg, #2979FF, #7C3AED)",
  worker:       "linear-gradient(135deg, #00C9A7, #059669)",
  intervention: "linear-gradient(135deg, #F59E0B, #EF4444)",
  analytics:    "linear-gradient(135deg, #2979FF, #00C9A7)",
  ai:           "linear-gradient(135deg, #7C3AED, #2979FF)",
  certificate:  "linear-gradient(135deg, #10B981, #2979FF)",
};

export function StatCard({
  title,
  value,
  trend,
  icon,
  trendLabel = "vs. mes anterior",
}: StatCardProps) {
  const Icon = Icons[icon];
  const isPositive = trend >= 0;
  const isAlert = icon === "intervention" && Number(value) > 0;
  const gradient = ICON_GRADIENTS[icon] ?? "linear-gradient(135deg, #00C9A7, #2979FF)";

  return (
    <div
      className="flex flex-col p-5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: "#0B1929",
        border: isAlert ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid #162638",
        boxShadow: isAlert
          ? "0 0 20px rgba(239, 68, 68, 0.06)"
          : "0 0 0 transparent",
      }}
    >
      {/* Subtle gradient wash at top */}
      <div
        className="absolute top-0 right-0 w-28 h-28 pointer-events-none rounded-full"
        style={{
          background: isAlert
            ? "radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(0,201,167,0.05) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 shrink-0"
        style={{ background: gradient }}
      >
        <Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
      </div>

      {/* Value */}
      <div className="space-y-0.5">
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "#2E4A62", fontFamily: "var(--font-barlow)" }}
        >
          {title}
        </span>
        <div
          className="text-[36px] font-bold leading-none"
          style={{
            color: isAlert ? "#F87171" : "#C4DAE8",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          {value}
        </div>
      </div>

      {/* Trend */}
      <div className="mt-4 flex items-center gap-2">
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={{
            background: isPositive
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(239, 68, 68, 0.1)",
            color: isPositive ? "#10B981" : "#EF4444",
          }}
        >
          {isPositive ? (
            <Icons.arrowUp className="w-2.5 h-2.5" />
          ) : (
            <Icons.arrowDown className="w-2.5 h-2.5" />
          )}
          {Math.abs(trend)}%
        </div>
        <span
          className="text-[11px] font-medium truncate"
          style={{ color: "#243C55", fontFamily: "var(--font-source-sans)" }}
        >
          {trendLabel}
        </span>
      </div>
    </div>
  );
}
