"use client";
import { useState } from "react";
import { FileBarChart } from "lucide-react";

export default function CollectiveReportButton({ orgId, orgName }: { orgId: string; orgName: string }) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/organizations/${orgId}/collective-report/pdf`);
            if (!res.ok) throw new Error("Error generando informe");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `informe-colectivo-${orgName.replace(/\s+/g, "-")}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("Error al generar el informe colectivo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
            <FileBarChart className="h-3.5 w-3.5" />
            {loading ? "Generando..." : "Informe Colectivo"}
        </button>
    );
}
