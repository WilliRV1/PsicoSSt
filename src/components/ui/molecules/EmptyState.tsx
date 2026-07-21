import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Icons;
}

export function EmptyState({ title, description, actionLabel, onAction, icon = "info" }: EmptyStateProps) {
  const Icon = Icons[icon];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-border border-dashed rounded-[16px] w-full min-h-[300px]">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-muted mb-4">
        <Icon className="w-6 h-6 text-text-muted" />
      </div>
      <h3 className="text-[16px] font-semibold text-text mb-1">{title}</h3>
      <p className="text-[14px] text-text-secondary max-w-sm mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
