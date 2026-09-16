"use client";

import { DataGrid } from "@/components/ui/organisms/DataGrid";

interface RecentAssessment {
    id: string;
    assessmentDate: string | Date;
    status: string;
    worker: { fullName: string };
    organization: { name: string };
}

interface RecentAssessmentsGridProps {
    data: RecentAssessment[];
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
    SIGNED:   { label: "Firmado",   bg: "var(--color-teal-light)",     text: "var(--color-teal-dark)" },
    REVIEWED: { label: "Revisado",  bg: "color-mix(in srgb, var(--color-info) 14%, transparent)", text: "var(--color-info)" },
    SCORED:   { label: "Calificado", bg: "var(--color-risk-medium-bg)", text: "var(--color-risk-medium-text)" },
    default:  { label: "Pendiente", bg: "var(--color-surface-muted)",  text: "var(--color-text-secondary)" },
};

export function RecentAssessmentsGrid({ data }: RecentAssessmentsGridProps) {
    return (
        <DataGrid 
            data={data}
            searchable={false}
            filterable={false}
            exportable={false}
            columns={[
                {
                    key: 'worker',
                    header: 'Trabajador',
                    render: (row) => (
                        <div className="flex flex-col">
                            <span className="font-medium text-text">{row.worker.fullName}</span>
                            <span className="text-xs text-text-muted">{row.organization.name}</span>
                        </div>
                    )
                },
                {
                    key: 'assessmentDate',
                    header: 'Fecha',
                    render: (row) => (
                        <span className="text-text-secondary">
                            {new Date(row.assessmentDate).toLocaleDateString("es-CO")}
                        </span>
                    )
                },
                {
                    key: 'status',
                    header: 'Estado',
                    render: (row) => {
                        // Es el estado del flujo de la evaluación, no un nivel de riesgo:
                        // antes tomaba prestado RiskBadge con niveles falsos ("Sin riesgo"
                        // para "firmado"), que se leía como si un caso sin riesgo y uno
                        // firmado fueran lo mismo. Colores semánticos, no de riesgo.
                        const st = row.status;
                        const cfg = STATUS_CFG[st] ?? STATUS_CFG.default;
                        return (
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                                style={{ background: cfg.bg, color: cfg.text }}
                            >
                                {cfg.label}
                            </span>
                        );
                    }
                }
            ]}
            onRowClick={(row) => {
                window.location.href = `/dashboard/reports/${row.id}`;
            }}
        />
    );
}
