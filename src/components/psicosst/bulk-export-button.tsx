"use client";

import { useState } from "react";
import { Download, Loader2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Org {
    id: string;
    name: string;
}

interface BulkExportButtonProps {
    organizations: Org[];
}

export default function BulkExportButton({ organizations }: BulkExportButtonProps) {
    const [open, setOpen] = useState(false);
    const [orgId, setOrgId] = useState("all");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleExport = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/reports/bulk-export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId: orgId === "all" ? undefined : orgId,
                    status: status === "all" ? undefined : status,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "No se pudo generar la exportación.");
                return;
            }

            const count = res.headers.get("X-Reports-Count");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const cd = res.headers.get("Content-Disposition") || "";
            const match = cd.match(/filename="([^"]+)"/);
            a.download = match?.[1] ?? "informes_psicosst.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setOpen(false);
            if (count) alert(`✓ ${count} informe(s) exportado(s) correctamente.`);
        } catch {
            setError("Error de conexión. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button variant="outline" className="gap-2" onClick={() => { setOpen(true); setError(""); }}>
                <PackageOpen className="h-4 w-4" />
                Exportar PDFs
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Exportar Informes en ZIP</DialogTitle>
                        <DialogDescription>
                            Selecciona los filtros y descarga todos los PDF en un archivo comprimido.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Empresa</label>
                            <Select value={orgId} onValueChange={setOrgId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las empresas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las empresas</SelectItem>
                                    {organizations.map(o => (
                                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Estado</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="SCORED">Calificado</SelectItem>
                                    <SelectItem value="REVIEWED">Revisado</SelectItem>
                                    <SelectItem value="SIGNED">Firmado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <p className="text-xs text-destructive">{error}</p>
                        )}

                        <p className="text-xs text-muted-foreground">
                            Máximo 100 informes por exportación. Los PDFs se generan en el momento de la descarga.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleExport} disabled={loading} className="gap-2">
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
                            ) : (
                                <><Download className="h-4 w-4" /> Descargar ZIP</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
