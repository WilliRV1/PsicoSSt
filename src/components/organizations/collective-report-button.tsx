"use client";
import { useState } from "react";
import { FileBarChart, FileText, ChevronDown, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function CollectiveReportButton({ orgId, orgName }: { orgId: string; orgName: string }) {
    const [loading, setLoading] = useState<"executive" | "technical" | null>(null);

    const handleDownload = async (type: "executive" | "technical") => {
        setLoading(type);
        try {
            const res = await fetch(`/api/organizations/${orgId}/collective-report/pdf?type=${type}`);
            if (!res.ok) throw new Error("Error generando informe");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `informe-${type}-${orgName.replace(/\s+/g, "-")}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("Error al generar el informe");
        } finally {
            setLoading(null);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={loading !== null}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBarChart className="h-4 w-4" />}
                    {loading ? "Generando..." : "Descargar Informes"}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload("executive")} disabled={loading !== null}>
                    <FileBarChart className="mr-2 h-4 w-4 text-orange-500" />
                    Informe Ejecutivo (Gerencia)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("technical")} disabled={loading !== null}>
                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
                    Informe Técnico (Psicólogo)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
