"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, CheckCheck, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIDiagnosticPanelProps {
    orgId: string;
    orgName: string;
}

// Minimal markdown renderer — handles ## headings, **bold**, bullet lists, tables
function MarkdownSection({ text }: { text: string }) {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    const parseLine = (line: string, key: number): React.ReactNode => {
        // Replace **bold**
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
            <span key={key}>
                {parts.map((p, pi) => (pi % 2 === 1 ? <strong key={pi}>{p}</strong> : p))}
            </span>
        );
    };

    while (i < lines.length) {
        const line = lines[i];

        // H2
        if (line.startsWith("## ")) {
            const txt = line.slice(3);
            elements.push(
                <h2 key={i} className="text-[16px] font-bold text-foreground mt-6 mb-2 pb-1.5 border-b border-border flex items-center gap-2">
                    {txt}
                </h2>
            );
            i++;
            continue;
        }

        // H3
        if (line.startsWith("### ")) {
            elements.push(
                <h3 key={i} className="text-[13px] font-semibold text-foreground mt-4 mb-1.5 uppercase tracking-wider">
                    {line.slice(4)}
                </h3>
            );
            i++;
            continue;
        }

        // Horizontal rule
        if (line.trim() === "---") {
            elements.push(<hr key={i} className="my-4 border-border" />);
            i++;
            continue;
        }

        // Table row (starts with |)
        if (line.trim().startsWith("|")) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith("|")) {
                tableLines.push(lines[i]);
                i++;
            }
            const rows = tableLines.filter(l => !l.match(/^\|[-| ]+\|$/));
            elements.push(
                <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-lg border border-border">
                    <table className="w-full text-[12px] text-left">
                        {rows.map((row, ri) => {
                            const cells = row.split("|").slice(1, -1).map(c => c.trim());
                            const Tag = ri === 0 ? "th" : "td";
                            return (
                                <tr key={ri} className={ri === 0 ? "bg-muted text-text-muted font-semibold uppercase tracking-wider" : "border-t border-border hover:bg-muted/30"}>
                                    {cells.map((cell, ci) => (
                                        <Tag key={ci} className="px-3 py-2">{parseLine(cell, ci)}</Tag>
                                    ))}
                                </tr>
                            );
                        })}
                    </table>
                </div>
            );
            continue;
        }

        // Bullet (• or -)
        if (line.match(/^[\s]*[•\-]\s/)) {
            const bulletLines: string[] = [];
            while (i < lines.length && lines[i].match(/^[\s]*[•\-]\s/)) {
                bulletLines.push(lines[i].replace(/^[\s]*[•\-]\s/, ""));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} className="space-y-1 my-2 ml-1">
                    {bulletLines.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-[13px] text-foreground">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            {parseLine(b, bi)}
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Italic/emphasis line used for footer
        if (line.startsWith("*") && line.endsWith("*")) {
            elements.push(
                <p key={i} className="text-[11px] text-text-muted italic mt-4">{line.slice(1, -1)}</p>
            );
            i++;
            continue;
        }

        // Empty line
        if (line.trim() === "") {
            elements.push(<div key={i} className="h-1" />);
            i++;
            continue;
        }

        // Normal paragraph
        elements.push(
            <p key={i} className="text-[13px] text-foreground leading-relaxed">
                {parseLine(line, i)}
            </p>
        );
        i++;
    }

    return <div className="space-y-0.5">{elements}</div>;
}

export default function AIDiagnosticPanel({ orgId, orgName }: AIDiagnosticPanelProps) {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [generatedAt, setGeneratedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const generate = async () => {
        setLoading(true);
        setError(null);
        setCollapsed(false);

        try {
            const res = await fetch(`/api/organizations/${orgId}/ai-diagnostic`, {
                method: "POST",
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error al generar el diagnóstico");

            setReport(data.report);
            setGeneratedAt(data.generatedAt);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copy = async () => {
        if (!report) return;
        await navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-semibold text-foreground">Diagnóstico Organizacional IA</h3>
                        <p className="text-[11px] text-text-muted">
                            {generatedAt
                                ? `Generado el ${new Date(generatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                                : "Análisis profundo para toma de decisiones · Res. 2764/2022"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {report && (
                        <>
                            <Button variant="outline" size="sm" onClick={copy} className="h-8 text-[12px] gap-1.5">
                                {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copiado" : "Copiar"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="h-8 text-[12px] gap-1.5">
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                                Regenerar
                            </Button>
                            <button onClick={() => setCollapsed(c => !c)} className="p-1.5 rounded hover:bg-muted transition-colors text-text-muted">
                                {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                        </>
                    )}

                    {!report && (
                        <Button
                            size="sm"
                            onClick={generate}
                            disabled={loading}
                            className="h-8 text-[12px] gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {loading ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analizando...</>
                            ) : (
                                <><Sparkles className="w-3.5 h-3.5" />Generar Diagnóstico IA</>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {error && (
                <div className="px-5 py-4 flex items-start gap-3 bg-destructive/5 border-b border-destructive/20">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-[13px] text-destructive">{error}</p>
                </div>
            )}

            {loading && !report && (
                <div className="px-5 py-16 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                        </div>
                        <Loader2 className="w-16 h-16 text-indigo-300 animate-spin absolute -inset-2" />
                    </div>
                    <div>
                        <p className="text-[14px] font-semibold text-foreground">Analizando datos de {orgName}</p>
                        <p className="text-[12px] text-text-muted mt-1">El modelo está procesando todos los resultados.<br />Esto puede tomar 20-40 segundos.</p>
                    </div>
                </div>
            )}

            {!report && !loading && !error && (
                <div className="px-5 py-8 text-center">
                    <p className="text-[13px] text-text-muted max-w-sm mx-auto leading-relaxed">
                        Genera un informe diagnóstico completo con análisis por componente, grupos prioritarios, plan de intervención PHVA e indicadores de seguimiento — usando Claude Sonnet.
                    </p>
                </div>
            )}

            {report && !collapsed && (
                <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                    <MarkdownSection text={report} />
                </div>
            )}

            {report && collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="w-full py-3 text-[12px] text-text-muted hover:text-foreground hover:bg-muted transition-colors text-center"
                >
                    Mostrar diagnóstico completo
                </button>
            )}
        </div>
    );
}
