"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ManualForm from "./manual-form";
import { ScoredResultData } from "@/types/battery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Worker {
    id: string;
    fullName: string;
    documentId: string;
    organizationId: string;
    organization: { name: string };
}

export default function ManualEntryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const workerIdFromUrl = searchParams.get("workerId");

    const [searchTerm, setSearchTerm] = useState("");
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [finalResult, setFinalResult] = useState<{ id: string; result: ScoredResultData } | null>(null);

    // Load worker if ID is in URL
    useEffect(() => {
        if (workerIdFromUrl && !selectedWorker) {
            const fetchWorker = async () => {
                try {
                    const res = await fetch(`/api/workers/${workerIdFromUrl}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSelectedWorker(data);
                    }
                } catch (err) {
                    console.error("Error fetching worker from URL:", err);
                }
            };
            fetchWorker();
        }
    }, [workerIdFromUrl, selectedWorker]);

    const handleSearch = async (val: string) => {
        setSearchTerm(val);
        if (val.length < 3) {
            setWorkers([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/workers/search?q=${encodeURIComponent(val)}`);
            const data = await res.json();
            setWorkers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    if (finalResult) {
        return (
            <div className="max-w-4xl mx-auto p-8 animate-in">
                <Card className="text-center py-12">
                    <CardContent>
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-black text-foreground mb-2">¡Evaluación Guardada!</h1>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                            Los resultados para <strong className="text-foreground">{selectedWorker?.fullName}</strong> han sido procesados y almacenados correctamente.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild className="px-8 py-3 text-base bg-emerald-600 hover:bg-emerald-700 text-white">
                                <a href={`/api/assessments/${finalResult.id}/report/pdf`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Descargar Informe PDF
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard")}
                                className="px-8 py-3 text-base"
                            >
                                Ir al Dashboard
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setFinalResult(null);
                                    setSelectedWorker(null);
                                    setSearchTerm("");
                                }}
                                className="px-8 py-3 text-base"
                            >
                                Nueva Digitalización
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                    Digitalizar Batería (Papel)
                </h1>
                <p className="text-muted-foreground mt-2 font-medium text-sm">Transcripción manual de resultados físicos — Batería 2010</p>
            </header>

            {!selectedWorker ? (
                <Card className="border-t-4 border-t-indigo-600 shadow-md">
                    <CardContent>
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">1</span>
                            Seleccionar Trabajador
                        </h2>
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Buscar por nombre o número de documento..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-11 py-3 text-lg bg-muted border-input"
                            />
                            <svg className="absolute left-4 top-3.5 w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {isSearching && (
                                <div className="absolute right-4 top-3.5">
                                    <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}
                        </div>

                        {workers.length > 0 && (
                            <div className="mt-4 border border-border rounded-xl divide-y divide-border overflow-hidden shadow-sm bg-card">
                                {workers.map(w => (
                                    <button
                                        key={w.id}
                                        onClick={() => setSelectedWorker(w)}
                                        className="w-full p-4 text-left hover:bg-muted transition-colors flex justify-between items-center group"
                                    >
                                        <div>
                                            <p className="font-bold text-foreground group-hover:text-indigo-600 transition-colors">{w.fullName}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Doc: <span className="font-medium">{w.documentId}</span> | Empresa: <span className="font-medium">{w.organization.name}</span></p>
                                        </div>
                                        <svg className="w-5 h-5 text-muted-foreground group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchTerm.length >= 3 && workers.length === 0 && !isSearching && (
                            <div className="mt-6 p-10 text-center rounded-xl bg-muted border-2 border-dashed border-border">
                                <p className="text-muted-foreground font-medium">No se encontraron trabajadores que coincidan con tu búsqueda.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6 animate-in">
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-xl border-2 border-indigo-50">
                                {selectedWorker.fullName.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">{selectedWorker.fullName}</h2>
                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-tight mt-0.5">Doc: {selectedWorker.documentId} • {selectedWorker.organization.name}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedWorker(null)}
                            className="py-1.5 text-xs"
                        >
                            Cambiar Trabajador
                        </Button>
                    </div>

                    <Card className="p-0 border-t-4 border-t-indigo-600 shadow-md overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/50">
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">2</span>
                                Transcripción de Ítems
                            </h2>
                        </div>
                        <ManualForm
                            workerId={selectedWorker.id}
                            organizationId={selectedWorker.organizationId}
                            hasCustomerInteraction={selectedWorker.hasCustomerInteraction}
                            onSuccess={(res) => setFinalResult({ id: res.id, result: res.result })}
                        />
                    </Card>
                </div>
            )}
        </div>
    );
}
