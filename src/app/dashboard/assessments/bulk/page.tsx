"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <header>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    Carga Masiva de Resultados
                </h1>
                <p className="text-slate-500 mt-1 font-medium">Sube archivos CSV con resultados de múltiples trabajadores.</p>
            </header>

            {!results ? (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center">
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 transition-all hover:border-indigo-300 hover:bg-slate-50 group">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold text-slate-700">
                                {file ? file.name : "Seleccionar Archivo CSV"}
                            </span>
                            <span className="text-sm text-slate-400 mt-2">Tamaño máximo: 5MB</span>
                        </label>
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                        >
                            {isUploading ? "Procesando..." : "Empezar Importación"}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 font-medium">
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Resultado de la Importación</h2>
                        <button
                            onClick={() => setResults(null)}
                            className="text-indigo-600 font-bold text-sm hover:underline"
                        >
                            Subir otro archivo
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 transition-all hover:shadow-md">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Filas</span>
                            <span className="text-3xl font-black text-slate-800">{results.totalRows}</span>
                        </div>
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 transition-all hover:shadow-md">
                            <span className="text-sm font-bold text-green-600 uppercase tracking-widest block mb-1">Éxito</span>
                            <span className="text-3xl font-black text-green-700">{results.successRows}</span>
                        </div>
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 transition-all hover:shadow-md">
                            <span className="text-sm font-bold text-red-600 uppercase tracking-widest block mb-1">Errores</span>
                            <span className="text-3xl font-black text-red-700">{results.failedRows}</span>
                        </div>
                    </div>

                    {results.errors?.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Detalle de Errores
                            </h3>
                            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Fila</th>
                                            <th className="p-4">Columna</th>
                                            <th className="p-4">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {results.errors.map((err: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white transition-colors">
                                                <td className="p-4 font-bold text-slate-700">{err.row}</td>
                                                <td className="p-4">{err.column || "Geral"}</td>
                                                <td className="p-4 text-red-600 font-medium">{err.message}</td>
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
