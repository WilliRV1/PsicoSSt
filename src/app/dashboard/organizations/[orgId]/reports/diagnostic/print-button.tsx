"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import OrganizationalReportPDF, { OrganizationalReportData } from "@/components/reports/OrganizationalReportPDF";
import { toast } from "sonner";

interface PrintButtonProps {
    data: OrganizationalReportData;
}

export function PrintButton({ data }: PrintButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            // Create PDF Document using the native SVG vector charts
            const doc = <OrganizationalReportPDF data={data} />;

            // Generate Blob and download
            const asPdf = pdf();
            asPdf.updateContainer(doc);
            const blob = await asPdf.toBlob();
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Diagnostico_Organizacional_BRP_${data.orgInfo.organizationNit}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success("PDF de Diagnóstico BRP generado exitosamente");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Hubo un error al generar el PDF. Intente nuevamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button 
            onClick={generatePDF} 
            disabled={isGenerating}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando BRP...
                </>
            ) : (
                <>
                    <Download className="w-5 h-5" />
                    Descargar Informe PDF
                </>
            )}
        </button>
    );
}
