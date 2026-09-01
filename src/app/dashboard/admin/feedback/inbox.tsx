"use client";

import { useState } from "react";
import { AlertTriangle, Bug, Check, ChevronDown, Lightbulb, Monitor } from "lucide-react";

/**
 * Bandeja de reportes del piloto.
 *
 * Los errores capturados y los comentarios escritos se leen juntos y en orden
 * cronológico, porque casi siempre se explican entre sí: un "no me dejó
 * guardar" cobra sentido junto al fallo que ocurrió un minuto antes en la
 * misma ruta.
 */

type Estado = "NEW" | "READ" | "RESOLVED";
type Tipo = "COMMENT" | "BUG" | "CRASH";

interface Reporte {
    id: string;
    kind: Tipo;
    message: string;
    path: string | null;
    stack: string | null;
    status: Estado;
    adminNote: string | null;
    createdAt: string;
    autor: { nombre: string; email: string } | null;
    contexto: Record<string, string | null>;
}

const TIPO = {
    CRASH: { etiqueta: "Error", icono: AlertTriangle, color: "text-danger", fondo: "bg-danger/10" },
    BUG: { etiqueta: "Falla reportada", icono: Bug, color: "text-warning", fondo: "bg-warning/10" },
    COMMENT: { etiqueta: "Sugerencia", icono: Lightbulb, color: "text-primary", fondo: "bg-teal-light" },
} as const;

const FILTROS: { valor: Estado | "ALL"; etiqueta: string }[] = [
    { valor: "NEW", etiqueta: "Sin leer" },
    { valor: "READ", etiqueta: "Leídos" },
    { valor: "RESOLVED", etiqueta: "Resueltos" },
    { valor: "ALL", etiqueta: "Todos" },
];

function cuando(iso: string): string {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return "hace un momento";
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`;
    return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long" });
}

export function FeedbackInbox({
    reportes: iniciales,
    conteos,
}: {
    reportes: Reporte[];
    conteos: Record<Estado, number>;
}) {
    const [reportes, setReportes] = useState(iniciales);
    const [filtro, setFiltro] = useState<Estado | "ALL">("NEW");
    const [abierto, setAbierto] = useState<string | null>(null);

    const visibles = filtro === "ALL" ? reportes : reportes.filter(r => r.status === filtro);

    async function cambiarEstado(id: string, status: Estado) {
        setReportes(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
        await fetch("/api/feedback", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        }).catch(() => {});
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-16">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Reportes del piloto</h1>
                <p className="text-sm text-muted-foreground">
                    Comentarios de los profesionales y errores que la aplicación capturó sola.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {FILTROS.map(f => {
                    const n = f.valor === "ALL" ? reportes.length : conteos[f.valor];
                    return (
                        <button
                            key={f.valor}
                            onClick={() => setFiltro(f.valor)}
                            className={`rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                                filtro === f.valor
                                    ? "border-primary bg-teal-light text-foreground"
                                    : "border-border bg-card text-muted-foreground hover:border-border-focus"
                            }`}
                        >
                            {f.etiqueta}
                            {n > 0 && <span className="ml-2 tabular-nums opacity-60">{n}</span>}
                        </button>
                    );
                })}
            </div>

            {visibles.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center">
                    <p className="text-sm text-muted-foreground">
                        {filtro === "NEW"
                            ? "Nada sin leer. Los reportes nuevos aparecen aquí en cuanto alguien envía uno."
                            : "No hay reportes en este estado."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visibles.map(r => {
                        const t = TIPO[r.kind];
                        const Icono = t.icono;
                        const desplegado = abierto === r.id;

                        return (
                            <div
                                key={r.id}
                                className={`rounded-xl border bg-card transition-colors ${
                                    r.status === "NEW" ? "border-border-focus" : "border-border"
                                }`}
                            >
                                <div className="flex items-start gap-3.5 p-4">
                                    <span
                                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.fondo}`}
                                    >
                                        <Icono className={`h-4 w-4 ${t.color}`} />
                                    </span>

                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                                            <span className="text-[13px] font-semibold text-foreground">
                                                {t.etiqueta}
                                            </span>
                                            <span className="text-[12.5px] text-muted-foreground">
                                                {r.autor?.nombre ?? "Cuenta eliminada"}
                                            </span>
                                            <span className="text-[12px] text-muted-foreground">
                                                · {cuando(r.createdAt)}
                                            </span>
                                            {r.path && (
                                                <code className="rounded bg-muted px-1.5 py-0.5 text-[11.5px] text-muted-foreground">
                                                    {r.path}
                                                </code>
                                            )}
                                        </div>

                                        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
                                            {r.message}
                                        </p>

                                        {(r.stack || r.contexto.userAgent) && (
                                            <button
                                                onClick={() => setAbierto(desplegado ? null : r.id)}
                                                className="flex w-fit items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                                            >
                                                <ChevronDown
                                                    className={`h-3.5 w-3.5 transition-transform ${desplegado ? "rotate-180" : ""}`}
                                                />
                                                Detalle técnico
                                            </button>
                                        )}

                                        {desplegado && (
                                            <div className="mt-1 space-y-2 rounded-lg bg-muted/60 p-3">
                                                {r.contexto.userAgent && (
                                                    <p className="flex items-start gap-2 text-[11.5px] leading-snug text-muted-foreground">
                                                        <Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                        {r.contexto.userAgent}
                                                        {r.contexto.viewport && ` · ${r.contexto.viewport}`}
                                                    </p>
                                                )}
                                                {r.stack && (
                                                    <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                                                        {r.stack}
                                                    </pre>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex shrink-0 gap-1.5">
                                        {r.status !== "RESOLVED" && (
                                            <button
                                                onClick={() => cambiarEstado(r.id, "RESOLVED")}
                                                title="Marcar como resuelto"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        )}
                                        {r.status === "NEW" && (
                                            <button
                                                onClick={() => cambiarEstado(r.id, "READ")}
                                                className="h-8 rounded-lg border border-border px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-border-focus hover:text-foreground"
                                            >
                                                Leído
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
