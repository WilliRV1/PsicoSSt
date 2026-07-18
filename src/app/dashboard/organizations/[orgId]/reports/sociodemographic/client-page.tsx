"use client";

import { useState } from "react";
import SociodemographicReport, { SociodemographicData } from "@/components/reports/SociodemographicReport";
import SociodemographicReportPDF from "@/components/reports/SociodemographicReportPDF";
import { pdf } from "@react-pdf/renderer";
import { Download } from "lucide-react";

export default function ClientSociodemographicPage({ 
    orgId, 
    orgInfo 
}: { 
    orgId: string;
    orgInfo: any;
}) {
    const handleExportPdf = async (data: SociodemographicData) => {
        try {
            const pdfData = {
                ...data,
                orgInfo
            };
            
            const doc = <SociodemographicReportPDF data={pdfData} />;
            const asPdf = pdf();
            asPdf.updateContainer(doc);
            const blob = await asPdf.toBlob();
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Informe_Sociodemografico_${orgInfo.organizationName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <SociodemographicReport 
                    organizationId={orgId} 
                    onExportPdf={handleExportPdf} 
                />
            </div>
        </div>
    );
}
