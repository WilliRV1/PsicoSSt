import { EmptyState } from "../molecules/EmptyState";

interface NoWorkersProps {
  onAddWorker?: () => void;
}

export function NoWorkers({ onAddWorker }: NoWorkersProps) {
  return (
    <EmptyState
      title="No hay trabajadores registrados"
      description="Agrega trabajadores para comenzar a evaluar el riesgo psicosocial y generar informes individuales."
      actionLabel="Agregar trabajador"
      onAction={onAddWorker}
      icon="worker"
    />
  );
}
