"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, FileUp, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTRUMENTS, INSTRUMENT_IDS, sortByOrder } from "@/config/instruments";
import type { QuestionnaireType } from "@/types/battery";
import { getErrorMessage } from "@/lib/utils";

interface ImportResult {
    jobId: string;
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: { row: number; column?: string; message: string }[];
}

export default function ImportScoresPage() {
    const params = useParams();
    const orgId = params.orgId as string;

    const [instrument, setInstrument] = useState<QuestionnaireType>("INTRALABORAL");
    const [formType, setFormType] = useState<"A" | "B">("A");
    const [source, setSource] = useState<"SIRPSI" | "OTRO">("SIRPSI");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const def = INSTRUMENTS[instrument];
    const templateUrl = `/api/imports/scores/template?instrument=${instrument}&formType=${formType}`;

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const body = new FormData();
            body.append("file", file);
            body.append("organizationId", orgId);
            body.append("source", source);
            const res = await fetch("/api/imports/scores", { method: "POST", body });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error en la importación");
            setResult(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in max-w-4xl">
            <nav className="flex text-sm font-medium text-muted-foreground gap-2">
                <Link href="/dashboard/organizations" className="hover:text-primary transition-colors">Mis Empresas</Link>
                <span className="text-border">&rsaquo;</span>
                <Link href={`/dashboard/organizations/${orgId}`} className="hover:text-primary transition-colors">Detalle</Link>
                <span className="text-border">&rsaquo;</span>
                <span className="text-foreground font-bold">Importar resultados</span>
            </nav>

            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <FileUp className="w-6 h-6 text-primary" />
                    Importar resultados calificados
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Trae los puntajes ya calificados en SIRPSI u otra herramienta. Se importan los puntajes
                    transformados (0-100) por dimensión; el nivel de riesgo se calcula aquí con los baremos vigentes.
                    Las evaluaciones importadas quedan marcadas con su origen en el informe.
                </p>
            </div>

            {!result ? (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 grid gap-4 sm:grid-cols-3">
                        <label className="text-sm">
                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Instrumento</span>
                            <select
                                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                                value={instrument}
                                onChange={(e) => setInstrument(e.target.value as QuestionnaireType)}
                            >
                                {sortByOrder(INSTRUMENT_IDS).map((id) => (
                                    <option key={id} value={id}>{INSTRUMENTS[id].shortLabel}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm">
                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Forma</span>
                            <select
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 disabled:opacity-50"
                                value={formType}
                                disabled={!def.usesFormType}
                                onChange={(e) => setFormType(e.target.value as "A" | "B")}
                            >
                                <option value="A">A · jefes, profesionales y técnicos</option>
                                <option value="B">B · auxiliares y operarios</option>
                            </select>
                        </label>
                        <label className="text-sm">
                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Origen</span>
                            <select
                                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                                value={source}
                                onChange={(e) => setSource(e.target.value as "SIRPSI" | "OTRO")}
                            >
                                <option value="SIRPSI">SIRPSI (Ministerio del Trabajo)</option>
                                <option value="OTRO">Otra herramienta</option>
                            </select>
                        </label>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <p className="font-semibold text-foreground">1. Descarga la plantilla del instrumento</p>
                                <p className="text-xs text-muted-foreground">
                                    Una fila por trabajador. Columnas: documento, instrumento, forma, fecha, una columna por
                                    dimensión (0-100) y <code>total</code>{def.totalStrategy === "weighted" ? " (obligatoria en estrés)" : " (opcional)"}.
                                </p>
                            </div>
                            <a href={templateUrl} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
                                <Download className="w-4 h-4" /> Plantilla CSV
                            </a>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">2. Sube el archivo diligenciado</p>
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                className="mt-2 block text-sm"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                        )}
                        <Button onClick={handleImport} disabled={!file || loading}>
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importando…</> : "Importar resultados"}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground">Filas</p>
                            <p className="text-2xl font-bold">{result.totalRows}</p>
                        </div>
                        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                            <p className="text-xs text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Importadas</p>
                            <p className="text-2xl font-bold text-green-800">{result.successRows}</p>
                        </div>
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                            <p className="text-xs text-red-700 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Con error</p>
                            <p className="text-2xl font-bold text-red-800">{result.failedRows}</p>
                        </div>
                    </div>
                    {result.errors.length > 0 && (
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                                    <tr><th className="px-4 py-2 text-left">Fila</th><th className="px-4 py-2 text-left">Columna</th><th className="px-4 py-2 text-left">Error</th></tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {result.errors.map((e, i) => (
                                        <tr key={i}><td className="px-4 py-2">{e.row}</td><td className="px-4 py-2 text-muted-foreground">{e.column ?? "—"}</td><td className="px-4 py-2">{e.message}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">Registro de carga: {result.jobId}</p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => { setResult(null); setFile(null); }}>Importar otro archivo</Button>
                        <Link href={`/dashboard/organizations/${orgId}`} className="inline-flex items-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">Ver empresa</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
