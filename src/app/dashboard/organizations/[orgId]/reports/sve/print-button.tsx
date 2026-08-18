"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import SVEReportPDF, { SVEReportData } from "@/components/reports/SVEReportPDF";
import { toast } from "sonner";

export function SVEPrintButton({ data }: { data: SVEReportData }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const asPdf = pdf();
            asPdf.updateContainer(<SVEReportPDF data={data} />);
            const blob = await asPdf.toBlob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Programa_SVE_Riesgo_Psicosocial_${data.org.nit}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Programa SVE generado exitosamente");
        } catch (error) {
            console.error("Error generating SVE PDF:", error);
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
                    Generando SVE...
                </>
            ) : (
                <>
                    <Download className="w-5 h-5" />
                    Descargar Programa SVE (PDF)
                </>
            )}
        </button>
    );
}
