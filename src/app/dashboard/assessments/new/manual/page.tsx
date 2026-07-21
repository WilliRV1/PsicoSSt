"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ManualForm from "./manual-form";
import { ScoredResultData } from "@/types/battery";
import { Button } from "@/components/ui/button";

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
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input on load
    useEffect(() => {
        if (!selectedWorker) {
            inputRef.current?.focus();
        }
    }, [selectedWorker]);

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

    // Debounced search
    useEffect(() => {
        if (searchTerm.length < 2) {
            setWorkers([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/workers/search?q=${encodeURIComponent(searchTerm)}`);
                const data = await res.json();
                setWorkers(data);
                setSelectedIndex(0); // Reset selection
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev < workers.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" && workers.length > 0) {
            e.preventDefault();
            setSelectedWorker(workers[selectedIndex]);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-300">
            {!selectedWorker ? (
                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4">
                    <div className="w-full space-y-4">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Selecciona un Trabajador</h1>
                            <p className="text-muted-foreground mt-2">Busca por nombre o número de documento para comenzar a digitar la batería.</p>
                        </div>
                        
                        <div className="relative shadow-xl rounded-2xl bg-card border border-border overflow-hidden">
                            <div className="flex items-center px-4 py-4 border-b border-border bg-muted/30">
                                <svg className="w-6 h-6 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Buscar trabajador..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 bg-transparent border-none outline-none px-4 text-lg text-foreground placeholder:text-muted-foreground"
                                />
                                {isSearching && (
                                    <svg className="animate-spin h-5 w-5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                            </div>
                            
                            {workers.length > 0 && (
                                <div className="max-h-[300px] overflow-y-auto">
                                    {workers.map((w, idx) => (
                                        <div
                                            key={w.id}
                                            onClick={() => setSelectedWorker(w)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`px-6 py-4 cursor-pointer flex justify-between items-center transition-colors ${selectedIndex === idx ? 'bg-indigo-50 dark:bg-indigo-950/30 border-l-4 border-indigo-600' : 'border-l-4 border-transparent hover:bg-muted'}`}
                                        >
                                            <div>
                                                <p className={`font-medium ${selectedIndex === idx ? 'text-indigo-900 dark:text-indigo-100' : 'text-foreground'}`}>{w.fullName}</p>
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    CC: {w.documentId} <span className="mx-2">•</span> {w.organization.name}
                                                </p>
                                            </div>
                                            {selectedIndex === idx && (
                                                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-indigo-600 bg-indigo-100 rounded">
                                                    Enter ↵
                                                </kbd>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchTerm.length >= 2 && workers.length === 0 && !isSearching && (
                                <div className="px-6 py-8 text-center text-muted-foreground">
                                    No se encontraron trabajadores.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col h-full">
                    <ManualForm
                        workerId={selectedWorker.id}
                        organizationId={selectedWorker.organizationId}
                        workerName={selectedWorker.fullName}
                        organizationName={selectedWorker.organization.name}
                        onReset={() => {
                            setSelectedWorker(null);
                            setSearchTerm("");
                            setTimeout(() => inputRef.current?.focus(), 100);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
