"use client";

import { DataGrid } from "@/components/ui/organisms/DataGrid";
import { RiskBadge } from "@/components/ui/atoms/RiskBadge";

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
                        const st = row.status;
                        if (st === 'SIGNED') return <RiskBadge level="NONE" showDot={false} />;
                        if (st === 'SCORED') return <RiskBadge level="MEDIUM" showDot={false} />;
                        return <RiskBadge level="LOW" showDot={false} />;
                    }
                }
            ]}
            onRowClick={(row) => {
                window.location.href = `/dashboard/reports/${row.id}`;
            }}
        />
    );
}
