import { Icons } from "@/components/icons";

interface HealthScoreProps {
  score: number;
  trend: number; // e.g., +4 or -2
  factors: {
    evaluations: number; // 0-100
    compliance: number;
    interventions: number;
    tracking: number;
    plans: number;
    evidence: number;
  }
}

export function HealthScore({ score, trend, factors }: HealthScoreProps) {
  const getStatus = (val: number) => {
    if (val >= 85) return { label: 'Excelente', color: 'text-success' };
    if (val >= 70) return { label: 'Saludable', color: 'text-info' };
    if (val >= 50) return { label: 'Regular', color: 'text-warning' };
    return { label: 'Crítico', color: 'text-danger' };
  };

  const status = getStatus(score);
  const trendPositive = trend >= 0;

  // Custom visual progress bar built with pure blocks (mock text-based visual or div-based)
  // We'll use a clean div-based progress bar for high-end feel.
  
  return (
    <div className="flex flex-col p-6 bg-surface border border-border rounded-[16px] shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[14px] font-medium text-text-secondary mb-1">Organización Saludable</h2>
          <div className="flex items-baseline gap-3">
            <span className="text-[48px] font-bold font-mono text-text leading-none">{score}</span>
            <div className="flex flex-col">
              <span className={`text-[16px] font-semibold ${status.color}`}>{status.label}</span>
              <span className="text-[12px] text-text-muted flex items-center gap-1 font-medium">
                {trendPositive ? <Icons.arrowUp className="w-3 h-3 text-success" /> : <Icons.arrowDown className="w-3 h-3 text-danger" />}
                {Math.abs(trend)} respecto al mes pasado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Progress Bar representing 10 segments */}
      <div className="flex gap-1 mb-8 w-full h-3">
        {Array.from({ length: 10 }).map((_, i) => {
          const threshold = i * 10;
          const isFilled = score > threshold;
          const isPartial = score > threshold && score < threshold + 10;
          return (
            <div 
              key={i} 
              className={`flex-1 rounded-sm ${
                isFilled && !isPartial ? 'bg-primary' : 
                isPartial ? 'bg-primary/50' : 'bg-surface-muted'
              }`} 
            />
          );
        })}
      </div>

      <div className="pt-4 border-t border-border-muted">
        <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">Factores de impacto</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
          <FactorItem label="Evaluaciones" value={factors.evaluations} />
          <FactorItem label="Cumplimiento" value={factors.compliance} />
          <FactorItem label="Intervenciones" value={factors.interventions} />
          <FactorItem label="Seguimiento" value={factors.tracking} />
          <FactorItem label="Planes" value={factors.plans} />
          <FactorItem label="Evidencias" value={factors.evidence} />
        </div>
      </div>
    </div>
  );
}

function FactorItem({ label, value }: { label: string; value: number }) {
  // value is 0-100, we represent it as a tiny bar
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-[12px] w-full">
        <span className="text-text-secondary font-medium truncate pr-2" title={label}>{label}</span>
        <span className="font-mono text-text-muted flex-shrink-0 font-semibold">{value}%</span>
      </div>
      <div className="w-full bg-surface-muted h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-primary/40 h-full rounded-full transition-all duration-500" 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}
