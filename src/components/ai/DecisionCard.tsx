import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface DecisionCardProps {
  recommendation: string;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  actionLabel: string;
  onAction?: () => void;
}

export function DecisionCard({
  recommendation,
  confidence,
  impact,
  reason,
  actionLabel,
  onAction
}: DecisionCardProps) {
  return (
    <div className="flex flex-col gap-4 p-5 bg-surface border border-border rounded-[16px] shadow-sm relative overflow-hidden">
      {/* Subtle AI gradient indicator at the top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-blue-500 opacity-50" />
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
          <Icons.ai className="w-4 h-4 text-teal-600" />
          <span>IA recomienda</span>
        </div>
      </div>
      
      <h3 className="text-[18px] font-semibold text-text font-heading leading-tight">
        {recommendation}
      </h3>
      
      <div className="flex items-center gap-6 py-2 border-y border-border-muted my-1">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Confianza</span>
          <span className="text-[14px] font-medium font-mono">{confidence}%</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Impacto Esperado</span>
          <span className={`text-[14px] font-medium ${impact === 'HIGH' ? 'text-danger' : impact === 'MEDIUM' ? 'text-warning' : 'text-success'}`}>
            {impact === 'HIGH' ? 'ALTO' : impact === 'MEDIUM' ? 'MEDIO' : 'BAJO'}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Razón</span>
        <p className="text-[14px] text-text-secondary leading-relaxed">
          {reason}
        </p>
      </div>
      
      <div className="mt-2">
        <Button onClick={onAction} className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-none">
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
