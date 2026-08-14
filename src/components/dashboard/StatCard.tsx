interface StatCardProps {
  title: string;
  value: string | number;
  trend: number;
  icon?: string;
  trendLabel?: string;
}

export function StatCard({
  title,
  value,
  trend,
  trendLabel = "vs. mes anterior",
}: StatCardProps) {
  const isPositive = trend >= 0;
  const isAlert =
    String(title).toLowerCase().includes("alert") ||
    String(title).toLowerCase().includes("críti");

  return (
    <div
      className="p-6 rounded-xl flex flex-col gap-4"
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${isAlert && Number(value) > 0 ? "rgba(220,38,38,0.25)" : "var(--color-border)"}`,
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-barlow)" }}
      >
        {title}
      </p>

      <p
        className="text-[40px] leading-none font-semibold"
        style={{
          color:
            isAlert && Number(value) > 0
              ? "var(--color-danger)"
              : "var(--color-foreground)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </p>

      <p
        className="text-[12px]"
        style={{
          color: isPositive ? "var(--color-success)" : "var(--color-danger)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {isPositive ? "↑" : "↓"} {Math.abs(trend)}%{" "}
        <span style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>
          {trendLabel}
        </span>
      </p>
    </div>
  );
}
