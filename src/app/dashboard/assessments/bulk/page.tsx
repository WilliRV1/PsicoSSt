"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BulkUploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/v1/import", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al subir el archivo");
            }

            const data = await res.json();
            setResults(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                        <Upload className="w-5 h-5" />
                    </div>
                    Carga Masiva de Resultados
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Sube archivos CSV con resultados de multiples trabajadores.</p>
            </div>

            {!results ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
                    <div className="border-2 border-dashed border-border rounded-xl p-12 transition-all hover:border-primary/50 hover:bg-muted/30 group">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <span className="text-lg font-semibold text-foreground">
                                {file ? file.name : "Seleccionar Archivo CSV"}
                            </span>
                            <span className="text-sm text-muted-foreground mt-2">Tamano maximo: 5MB</span>
                        </label>
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                        <Button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            size="lg"
                        >
                            {isUploading ? "Procesando..." : "Empezar Importacion"}
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 font-medium">
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-foreground">Resultado de la Importacion</h3>
                        <button
                            onClick={() => setResults(null)}
                            className="text-primary font-semibold text-sm hover:underline"
                        >
                            Subir otro archivo
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-muted/50 p-6 rounded-xl border border-border">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Total Filas</span>
                            <span className="text-3xl font-bold text-foreground">{results.totalRows}</span>
                        </div>
                        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider block mb-1">Exito</span>
                            <span className="text-3xl font-bold text-green-700">{results.successRows}</span>
                        </div>
                        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider block mb-1">Errores</span>
                            <span className="text-3xl font-bold text-red-700">{results.failedRows}</span>
                        </div>
                    </div>

                    {results.errors?.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                Detalle de Errores
                            </h4>
                            <div className="rounded-xl overflow-hidden border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Fila</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Columna</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {results.errors.map((err: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-medium text-foreground">{err.row}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{err.column || "General"}</td>
                                                <td className="px-4 py-3 text-destructive font-medium">{err.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
