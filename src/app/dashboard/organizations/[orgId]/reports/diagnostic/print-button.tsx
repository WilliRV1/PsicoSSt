"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import { toPng } from 'html-to-image';
import CollectiveReportPDF from "@/components/reports/CollectiveReportPDF";
import { toast } from "sonner";

interface PrintButtonProps {
    orgName: string;
    orgNit: string;
    orgCity?: string;
    psychologistName: string;
    psychologistLicense: string;
    totalWorkers: number;
    reportDate: string;
}

export function PrintButton({ 
    orgName, orgNit, orgCity, psychologistName, psychologistLicense, totalWorkers, reportDate 
}: PrintButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            // Capture the charts using html-to-image.
            // We expect these elements to exist on the page with these IDs.
            const generalRiskEl = document.querySelector('.risk-summary-grid') as HTMLElement;
            const segmentedEl = document.querySelector('.segment-grid') as HTMLElement;

            let generalRiskImg;
            let riskByAreaImg;

            if (generalRiskEl) {
                generalRiskImg = await toPng(generalRiskEl, { cacheBust: true, backgroundColor: '#ffffff', style: { transform: 'scale(1)' } });
            }
            if (segmentedEl) {
                riskByAreaImg = await toPng(segmentedEl, { cacheBust: true, backgroundColor: '#ffffff' });
            }

            // Create PDF Document
            const doc = (
                <CollectiveReportPDF 
                    organizationName={orgName}
                    organizationNit={orgNit}
                    organizationCity={orgCity || ""}
                    psychologistName={psychologistName}
                    psychologistLicense={psychologistLicense}
                    totalWorkers={totalWorkers}
                    reportDate={reportDate}
                    chartImages={{
                        generalRisk: generalRiskImg,
                        riskByArea: riskByAreaImg
                    }}
                />
            );

            // Generate Blob and download
            const asPdf = pdf();
            asPdf.updateContainer(doc);
            const blob = await asPdf.toBlob();
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Diagnostico_Grupal_${orgNit}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success("PDF generado exitosamente");
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
                    Generando PDF...
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
