interface RiskDistributionProps {
  distribution: {
    none: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
  total: number;
}

export function RiskDistribution({ distribution, total }: RiskDistributionProps) {
  
  const getPercentage = (val: number) => total > 0 ? Math.round((val / total) * 100) : 0;
  
  const items = [
    { label: 'Sin Riesgo', value: distribution.none, pct: getPercentage(distribution.none), colorClass: 'bg-risk-none-text' },
    { label: 'Bajo', value: distribution.low, pct: getPercentage(distribution.low), colorClass: 'bg-risk-low-text' },
    { label: 'Medio', value: distribution.medium, pct: getPercentage(distribution.medium), colorClass: 'bg-risk-medium-text' },
    { label: 'Alto', value: distribution.high, pct: getPercentage(distribution.high), colorClass: 'bg-risk-high-text' },
    { label: 'Muy Alto', value: distribution.veryHigh, pct: getPercentage(distribution.veryHigh), colorClass: 'bg-risk-veryhigh-text' },
  ];

  return (
    <div className="flex flex-col gap-5 p-6 bg-surface border border-border rounded-[16px] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[16px] font-semibold text-text">Distribución del Riesgo</h3>
        <span className="text-[12px] font-medium text-text-secondary bg-surface-muted px-2 py-1 rounded-md">
          {total} evaluados
        </span>
      </div>
      
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-4">
            <div className="w-[80px] text-[13px] font-medium text-text-secondary">
              {item.label}
            </div>
            
            <div className="flex-1 flex items-center h-5">
              <div 
                className={`h-full rounded-sm transition-all duration-500 ${item.colorClass}`}
                style={{ width: `${Math.max(item.pct, 2)}%` }} // Minimum 2% for visual presence if > 0
              />
            </div>
            
            <div className="w-[40px] text-right text-[13px] font-mono font-medium text-text">
              {item.pct}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
