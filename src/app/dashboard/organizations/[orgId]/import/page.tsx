"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileUp, ClipboardPaste, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE_CSV = `documentType,documentId,fullName,jobTitle,jobLevel,educationLevel,departmentArea
CC,1023456789,Mar\u00eda Garc\u00eda L\u00f3pez,Analista de Sistemas,PROFESIONAL,PROFESIONAL,Tecnolog\u00eda
CC,1087654321,Carlos Rodr\u00edguez,Coordinador,JEFATURA,ESPECIALIZACION,Gesti\u00f3n`;

interface ImportResult {
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: { row: number; column: string; message: string }[];
}

export default function ImportWorkersPage() {
    const params = useParams();
    const orgId = params.orgId as string;

    const [csvText, setCsvText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCsvText(ev.target?.result as string || "");
        };
        reader.readAsText(f);
    };

    const handleImport = async () => {
        if (!csvText.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/workers/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ organizationId: orgId, csvData: csvText })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error en la importaci\u00f3n");
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in max-w-4xl">
            {/* Breadcrumbs */}
            <nav className="flex text-sm font-medium text-muted-foreground gap-2">
                <Link href="/dashboard/organizations" className="hover:text-primary transition-colors">Mis Empresas</Link>
                <span className="text-border">&rsaquo;</span>
                <Link href={`/dashboard/organizations/${orgId}`} className="hover:text-primary transition-colors">Detalle</Link>
                <span className="text-border">&rsaquo;</span>
                <span className="text-foreground font-bold">Importar Trabajadores</span>
            </nav>

            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <FileUp className="w-6 h-6 text-primary" />
                    Carga Masiva de Trabajadores
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Importa trabajadores desde un archivo CSV. Los existentes se actualizar&aacute;n autom&aacute;ticamente.
                </p>
            </div>

            {!result ? (
                <div className="space-y-6">
                    {/* Format guide */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Formato del CSV</h3>
                        <code className="block bg-muted rounded-lg p-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap overflow-x-auto">
                            {`documentType,documentId,fullName,jobTitle,jobLevel,educationLevel,departmentArea\nCC,1023456789,Mar\u00eda Garc\u00eda,Analista,PROFESIONAL,PROFESIONAL,Tecnolog\u00eda`}
                        </code>
                        <div className="mt-3 text-xs text-muted-foreground space-y-1">
                            <div><strong className="text-foreground">jobLevel:</strong> JEFATURA, PROFESIONAL, TECNICO, AUXILIAR, OPERATIVO</div>
                            <div><strong className="text-foreground">educationLevel:</strong> PRIMARIA, BACHILLERATO, TECNICO, TECNOLOGO, PROFESIONAL, ESPECIALIZACION, MAESTRIA, DOCTORADO</div>
                            <div><strong className="text-foreground">documentType:</strong> CC, CE, TI, PA, OTHER</div>
                        </div>
                    </div>

                    {/* File upload or paste */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                            <input type="file" accept=".csv,.txt" onChange={handleFileLoad} className="hidden" id="csv-upload" />
                            <label htmlFor="csv-upload" className="cursor-pointer block">
                                <FileUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <div className="font-bold text-sm text-foreground mb-1">
                                    {file ? file.name : "Subir Archivo CSV"}
                                </div>
                                <div className="text-xs text-muted-foreground">Click para seleccionar</div>
                            </label>
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => setCsvText(SAMPLE_CSV)}
                                className="w-full"
                            >
                                <ClipboardPaste className="w-4 h-4" />
                                Cargar Ejemplo
                            </Button>
                            <span className="text-xs text-muted-foreground text-center">Pega un ejemplo para probar</span>
                        </div>
                    </div>

                    {/* Text area */}
                    <Textarea
                        value={csvText}
                        onChange={e => setCsvText(e.target.value)}
                        placeholder="Pega aqu&iacute; el contenido CSV o sube un archivo..."
                        rows={10}
                        className="font-mono text-xs min-h-[200px]"
                    />

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={handleImport}
                            disabled={!csvText.trim() || loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin w-4 h-4" />
                                    Importando...
                                </>
                            ) : "Importar Trabajadores"}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/dashboard/organizations/${orgId}`}>
                                Cancelar
                            </Link>
                        </Button>
                    </div>
                </div>
            ) : (
                /* Results */
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-foreground">{result.totalRows}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Filas</div>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-6 h-6" />
                                {result.successRows}
                            </div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">Exitosos</div>
                        </div>
                        <div className={`${result.failedRows > 0 ? "bg-destructive/10 border-destructive/20" : "bg-card border-border"} border rounded-xl p-6 text-center`}>
                            <div className={`text-3xl font-bold ${result.failedRows > 0 ? "text-destructive" : "text-muted-foreground"} flex items-center justify-center gap-2`}>
                                {result.failedRows > 0 && <XCircle className="w-6 h-6" />}
                                {result.failedRows}
                            </div>
                            <div className={`text-xs ${result.failedRows > 0 ? "text-destructive" : "text-muted-foreground"} uppercase tracking-wider mt-1`}>Errores</div>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="bg-card border border-destructive/20 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">Detalle de Errores</h3>
                            <div className="max-h-[300px] overflow-y-auto space-y-0 divide-y divide-border">
                                {result.errors.map((err, i) => (
                                    <div key={i} className="py-2 text-sm">
                                        <span className="text-destructive font-semibold">Fila {err.row}</span>
                                        <span className="text-muted-foreground"> [{err.column}]: </span>
                                        <span className="text-foreground/80">{err.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button asChild>
                            <Link href={`/dashboard/organizations/${orgId}`}>
                                Ver Trabajadores
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => { setResult(null); setCsvText(""); setFile(null); }}
                        >
                            Importar M&aacute;s
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
