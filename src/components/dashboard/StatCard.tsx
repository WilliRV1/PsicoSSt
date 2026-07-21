import { Icons } from "@/components/icons";

interface StatCardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: keyof typeof Icons;
  trendLabel?: string;
}

export function StatCard({ title, value, trend, icon, trendLabel = "vs. mes anterior" }: StatCardProps) {
  const Icon = Icons[icon];
  const isPositive = trend >= 0;

  return (
    <div className="flex flex-col p-5 bg-surface border border-border rounded-[16px] shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-primary/5 text-primary">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[14px] font-medium text-text-secondary">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold font-mono text-text leading-none">{value}</span>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[12px] font-medium ${isPositive ? 'bg-success/10 text-success-dark' : 'bg-danger/10 text-danger'}`}>
          {isPositive ? <Icons.arrowUp className="w-3 h-3" /> : <Icons.arrowDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
        <span className="text-[12px] text-text-muted font-medium">{trendLabel}</span>
      </div>
    </div>
  );
}
