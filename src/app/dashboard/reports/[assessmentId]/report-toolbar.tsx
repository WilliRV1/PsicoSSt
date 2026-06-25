"use client";

import { FileDown, CheckCircle2 } from "lucide-react";

interface ReportToolbarProps {
    assessmentId: string;
    isSigned: boolean;
    pdfUrl: string;
}

export default function ReportToolbar({
    assessmentId,
    isSigned,
    pdfUrl,
}: ReportToolbarProps) {
    return (
        <div className="report-toolbar">
            <a href="/dashboard/assessments" className="text-sm font-semibold text-primary hover:underline">
                ← Volver a Evaluaciones
            </a>

            <div className="flex items-center gap-3">
                {isSigned && (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Reporte Firmado
                    </span>
                )}

                <a
                    href={`${pdfUrl}?anon=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-300"
                    title="Descargar versión anónima para presentar a gerencia"
                >
                    <FileDown className="w-4 h-4" />
                    PDF Gerencia (Anónimo)
                </a>

                <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
                    title="Descargar versión clínica con datos personales"
                >
                    <FileDown className="w-4 h-4" />
                    PDF Clínico
                </a>
            </div>
        </div>
    );
}
