"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Descarga un informe generado en el servidor.
 *
 * Todos los informes se componen ahora con Typst en el servidor, de modo que el
 * navegador sólo pide el archivo. Cada página tenía su propio botón con la
 * misma lógica de blob y enlace temporal, así que vive aquí una sola vez.
 */
export function DownloadReportButton({
    href,
    fallbackName,
    label = "Descargar informe PDF",
}: {
    href: string;
    fallbackName: string;
    label?: string;
}) {
    const [busy, setBusy] = useState(false);

    const download = async () => {
        setBusy(true);
        try {
            const res = await fetch(href);
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.error ?? `Error ${res.status}`);
            }

            const blob = await res.blob();
            const disposition = res.headers.get("Content-Disposition") ?? "";
            const name = disposition.match(/filename="([^"]+)"/)?.[1] ?? fallbackName;

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Informe generado");
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "No se pudo generar el informe");
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            onClick={download}
            disabled={busy}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {busy ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando…
                </>
            ) : (
                <>
                    <Download className="w-5 h-5" />
                    {label}
                </>
            )}
        </button>
    );
}
