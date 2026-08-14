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
  const isAlert = String(title).toLowerCase().includes("alert") || String(title).toLowerCase().includes("críti");

  return (
    <div
      className="p-6 rounded-xl flex flex-col gap-4"
      style={{
        background: "#0F1C2A",
        border: `1px solid ${isAlert && Number(value) > 0 ? "rgba(239,68,68,0.2)" : "#1A2B3C"}`,
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "#293D50", fontFamily: "var(--font-barlow)" }}
      >
        {title}
      </p>

      <p
        className="text-[40px] leading-none font-semibold"
        style={{
          color: isAlert && Number(value) > 0 ? "#EF4444" : "#C8D5DE",
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </p>

      <p
        className="text-[12px]"
        style={{
          color: isPositive ? "#00C9A7" : "#EF4444",
          fontFamily: "var(--font-mono)",
        }}
      >
        {isPositive ? "↑" : "↓"} {Math.abs(trend)}%{" "}
        <span style={{ color: "#293D50", fontFamily: "var(--font-sans)" }}>
          {trendLabel}
        </span>
      </p>
    </div>
  );
}
