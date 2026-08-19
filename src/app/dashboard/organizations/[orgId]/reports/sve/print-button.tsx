"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export function SVEPrintButton({ orgId }: { orgId: string }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const download = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch(`/api/organizations/${orgId}/sve/pdf`);

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.error ?? `Error ${res.status}`);
            }

            const blob = await res.blob();
            const disposition = res.headers.get("Content-Disposition") ?? "";
            const match = disposition.match(/filename="([^"]+)"/);
            const filename = match?.[1] ?? "Programa_SVE.pdf";

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Programa SVE generado");
        } catch (error) {
            console.error("Error generating SVE PDF:", error);
            toast.error(error instanceof Error ? error.message : "No se pudo generar el documento.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={download}
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
