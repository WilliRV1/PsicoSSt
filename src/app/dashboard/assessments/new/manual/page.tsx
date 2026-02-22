"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ManualForm from "./manual-form";
import { ScoredResultData } from "@/types/battery";

interface Worker {
    id: string;
    fullName: string;
    documentId: string;
    organizationId: string;
    organization: { name: string };
}

export default function ManualEntryPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [finalResult, setFinalResult] = useState<ScoredResultData | null>(null);

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
            <div className="max-w-4xl mx-auto p-8">
                <div className="rounded-2xl shadow-xl p-10 text-center border border-indigo-500/20" style={{ background: 'rgba(30,30,60,0.6)' }}>
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-slate-100 mb-2">¡Evaluación Guardada!</h1>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Los resultados para <strong className="text-slate-200">{selectedWorker?.fullName}</strong> han sido procesados y almacenados correctamente.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all"
                        >
                            Ir al Dashboard
                        </button>
                        <button
                            onClick={() => {
                                setFinalResult(null);
                                setSelectedWorker(null);
                                setSearchTerm("");
                            }}
                            className="px-8 py-3 border-2 border-indigo-500/30 text-slate-300 font-bold rounded-xl hover:bg-indigo-500/10 transition-all" style={{ background: 'rgba(30,30,60,0.4)' }}
                        >
                            Nueva Digitalización
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <header>
                <h1 className="text-3xl font-black text-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                    Digitalizar Batería (Papel)
                </h1>
                <p className="text-slate-400 mt-1 font-medium italic">Transcripción manual de resultados físicos — Batería 2010</p>
            </header>

            {!selectedWorker ? (
                <div className="rounded-2xl shadow-xl border border-indigo-500/20 p-8" style={{ background: 'rgba(30,30,60,0.6)' }}>
                    <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Paso 1: Seleccionar Trabajador</h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o número de documento..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full p-4 pl-12 border border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-200 placeholder-slate-500" style={{ background: 'rgba(15,15,35,0.8)' }}
                        />
                        <svg className="absolute left-4 top-4 w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {isSearching && (
                            <div className="absolute right-4 top-4">
                                <svg className="animate-spin h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                    </div>

                    {workers.length > 0 && (
                        <div className="mt-4 border border-indigo-500/20 rounded-xl divide-y divide-indigo-500/10 overflow-hidden shadow-sm">
                            {workers.map(w => (
                                <button
                                    key={w.id}
                                    onClick={() => setSelectedWorker(w)}
                                    className="w-full p-4 text-left hover:bg-indigo-500/10 transition-colors flex justify-between items-center group"
                                >
                                    <div>
                                        <p className="font-bold text-slate-200 group-hover:text-indigo-400">{w.fullName}</p>
                                        <p className="text-xs text-slate-500">Documento: {w.documentId} | Empresa: {w.organization.name}</p>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-600 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    )}

                    {searchTerm.length >= 3 && workers.length === 0 && !isSearching && (
                        <div className="mt-6 p-10 text-center rounded-xl border-2 border-dashed border-indigo-500/20" style={{ background: 'rgba(15,15,35,0.5)' }}>
                            <p className="text-slate-500 font-medium">No se encontraron trabajadores que coincidan con tu búsqueda.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-700 rounded-full flex items-center justify-center font-black text-xl">
                                {selectedWorker.fullName.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{selectedWorker.fullName}</h2>
                                <p className="text-indigo-300 text-xs font-medium uppercase tracking-tight">Doc: {selectedWorker.documentId} • {selectedWorker.organization.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedWorker(null)}
                            className="px-4 py-2 bg-indigo-800 hover:bg-indigo-700 rounded-lg text-xs font-bold transition-all"
                        >
                            Cambiar Trabajador
                        </button>
                    </div>

                    <div className="rounded-2xl shadow-xl border border-indigo-500/20 overflow-hidden" style={{ background: 'rgba(30,30,60,0.6)' }}>
                        <div className="p-4 border-b border-indigo-500/10" style={{ background: 'rgba(15,15,35,0.5)' }}>
                            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest pl-2">Paso 2: Transcripción de Ítems</h2>
                        </div>
                        <ManualForm
                            workerId={selectedWorker.id}
                            organizationId={selectedWorker.organizationId}
                            onSuccess={(res) => setFinalResult(res)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
