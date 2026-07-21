"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFormConfig } from "@/config/battery";
import { FormType, QuestionnaireType, ItemResponses } from "@/types/battery";
import { toast } from "sonner";

interface DimensionScore {
    dimensionKey: string;
    dimensionName: string;
    transformedScore: number;
    riskCategory: string;
    itemCount: number;
}

interface SavedScore {
    overallRiskCategory: string;
    transformedScore: number;
    dimensions: Record<string, DimensionScore>;
}

interface EditAssessmentFormProps {
    workerId: string;
    organizationId: string;
    hasCustomerInteraction: boolean;
    initialAssessmentId: string;
    initialFormType: FormType;
    initialQType: QuestionnaireType;
    initialResponses: ItemResponses;
    savedScore: SavedScore;
}


const STRESS_LABELS: Record<number, { label: string; color: string }> = {
    0: { label: "Siempre",        color: "bg-red-100 text-red-700 border border-red-200" },
    1: { label: "Casi siempre",   color: "bg-orange-100 text-orange-700 border border-orange-200" },
    2: { label: "A veces",        color: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
    3: { label: "Nunca",          color: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
};

const INTRA_EXTRA_LABELS: Record<number, { label: string; color: string }> = {
    0: { label: "Siempre",        color: "bg-red-100 text-red-700 border border-red-200" },
    1: { label: "Casi siempre",   color: "bg-orange-100 text-orange-700 border border-orange-200" },
    2: { label: "Algunas veces",  color: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
    3: { label: "Rara vez",       color: "bg-blue-100 text-blue-700 border border-blue-200" },
    4: { label: "Nunca",          color: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
};

const RISK_COLORS: Record<string, string> = {
    SIN_RIESGO: "text-emerald-600 bg-emerald-50",
    BAJO:       "text-lime-600 bg-lime-50",
    MEDIO:      "text-yellow-600 bg-yellow-50",
    ALTO:       "text-orange-600 bg-orange-50",
    MUY_ALTO:   "text-red-600 bg-red-50",
};

const RISK_DOT: Record<string, string> = {
    SIN_RIESGO: "bg-emerald-500",
    BAJO:       "bg-lime-500",
    MEDIO:      "bg-yellow-500",
    ALTO:       "bg-orange-500",
    MUY_ALTO:   "bg-red-500",
};

const RISK_LABELS: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO:       "Bajo",
    MEDIO:      "Medio",
    ALTO:       "Alto",
    MUY_ALTO:   "Muy Alto",
};

export default function EditAssessmentForm({
    workerId,
    organizationId,
    hasCustomerInteraction,
    initialAssessmentId,
    initialFormType,
    initialQType,
    initialResponses,
    savedScore,
}: EditAssessmentFormProps) {
    const router = useRouter();
    const [responses, setResponses] = useState<ItemResponses>({ ...initialResponses });
    const [activeDimensionKey, setActiveDimensionKey] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    // displayScore shows the saved score from DB. After a successful save, we rely on router.push to reload.
    const displayScore = savedScore;

    const config = getFormConfig(initialFormType, initialQType);
    const isStress = initialQType === "STRESS";
    const responseLabels = isStress ? STRESS_LABELS : INTRA_EXTRA_LABELS;
    const maxVal = isStress ? 3 : 4;

    const dimensions = config?.dimensions || [];

    // Active dimension or first one
    const currentDim = activeDimensionKey
        ? dimensions.find(d => d.key === activeDimensionKey) || dimensions[0]
        : dimensions[0];

    const handleChange = (itemNum: number, val: number) => {
        setResponses(prev => ({ ...prev, [String(itemNum)]: val }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/assessments/${initialAssessmentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responses }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al guardar");
            }
            toast.success("Evaluación actualizada correctamente");
            router.push("/dashboard/assessments");
        } catch (err: any) {
            toast.error(err.message || "Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    // Filter items in current dimension by search
    const filteredItems = currentDim?.items.filter(itemNum => {
        if (!search) return true;
        return String(itemNum).includes(search.trim());
    }) || [];

    const changedCount = Object.keys(responses).filter(
        k => responses[k] !== initialResponses[k]
    ).length;

    return (
        <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            {/* ===== LEFT SIDEBAR: Dimension Navigator ===== */}
            <aside className="w-64 flex-shrink-0 border-r border-border bg-muted/40 overflow-y-auto">
                <div className="p-4 border-b border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dimensiones</p>
                </div>
                <nav className="p-2 space-y-1">
                    {dimensions.map((dim) => {
                        const dimScore = displayScore?.dimensions[dim.key];
                        const isActive = (activeDimensionKey || dimensions[0]?.key) === dim.key;
                        const answered = dim.items.filter(i => responses[String(i)] !== undefined).length;
                        return (
                            <button
                                key={dim.key}
                                onClick={() => setActiveDimensionKey(dim.key)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group ${
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "hover:bg-muted text-foreground"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold leading-tight line-clamp-2">{dim.name}</span>
                                    {dimScore && (
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            isActive ? "bg-white/70" : RISK_DOT[dimScore.riskCategory]
                                        }`} />
                                    )}
                                </div>
                                <div className={`text-[10px] mt-1 font-medium ${isActive ? "text-indigo-200" : "text-muted-foreground"}`}>
                                    {answered}/{dim.items.length} ítems
                                    {dimScore && ` · ${RISK_LABELS[dimScore.riskCategory]}`}
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* ===== CENTER: Item Table ===== */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card/80 backdrop-blur">
                    <div className="flex-1">
                        <p className="font-bold text-sm text-foreground">{currentDim?.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {filteredItems.length} ítems · Haz clic en cualquier respuesta para cambiarla
                        </p>
                    </div>
                    <div className="relative">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar ítem #..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-input bg-background w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Item Rows */}
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
                    {filteredItems.map((itemNum) => {
                        const currentVal = responses[String(itemNum)];
                        const originalVal = initialResponses[String(itemNum)];
                        const changed = currentVal !== originalVal;
                        const label = currentVal !== undefined ? responseLabels[currentVal] : null;

                        return (
                            <div
                                key={itemNum}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all ${
                                    changed
                                        ? "border-amber-300 bg-amber-50/60"
                                        : "border-transparent hover:border-border hover:bg-muted/40"
                                }`}
                            >
                                {/* Item number */}
                                <div className="w-10 flex-shrink-0 text-center">
                                    <span className={`text-xs font-bold rounded px-1.5 py-0.5 ${changed ? "bg-amber-200 text-amber-800" : "bg-muted text-muted-foreground"}`}>
                                        #{itemNum}
                                    </span>
                                </div>

                                {/* Item label placeholder */}
                                <div className="flex-1 text-sm text-muted-foreground">
                                    Ítem {itemNum}
                                    {changed && (
                                        <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                            MODIFICADO
                                        </span>
                                    )}
                                </div>

                                {/* Response pills */}
                                <div className="flex gap-1.5 flex-shrink-0">
                                    {Array.from({ length: maxVal + 1 }, (_, v) => {
                                        const info = responseLabels[v];
                                        const isSelected = currentVal === v;
                                        return (
                                            <button
                                                key={v}
                                                onClick={() => handleChange(itemNum, v)}
                                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                                                    isSelected
                                                        ? info.color + " ring-2 ring-offset-1 ring-current shadow-sm scale-105"
                                                        : "bg-muted/60 text-muted-foreground hover:bg-muted border border-transparent"
                                                }`}
                                                title={info.label}
                                            >
                                                {info.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {filteredItems.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            No se encontraron ítems con ese número.
                        </div>
                    )}
                </div>
            </main>

            {/* ===== RIGHT PANEL: Live Score ===== */}
            <aside className="w-56 flex-shrink-0 border-l border-border bg-muted/40 overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Puntaje Guardado</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Se actualiza al guardar</p>
                </div>

                {displayScore && (
                    <div className="p-4 space-y-4 flex-1">
                        {/* Global score */}
                        <div className="rounded-xl bg-card border border-border p-3 text-center shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Riesgo Global</p>
                            <p className={`text-lg font-black px-2 py-1 rounded-lg ${RISK_COLORS[displayScore.overallRiskCategory]}`}>
                                {RISK_LABELS[displayScore.overallRiskCategory]}
                            </p>
                            <p className="text-2xl font-black text-foreground mt-1">
                                {displayScore.transformedScore.toFixed(1)}
                            </p>
                        </div>

                        {/* Dimension scores */}
                        <div className="space-y-2">
                            {Object.values(displayScore.dimensions)
                                .filter(d => d.itemCount > 0)
                                .map(dim => (
                                    <div key={dim.dimensionKey} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-muted-foreground font-medium truncate pr-1">{dim.dimensionName}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${RISK_COLORS[dim.riskCategory]}`}>
                                                {RISK_LABELS[dim.riskCategory]}
                                            </span>
                                        </div>
                                        <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${RISK_DOT[dim.riskCategory]}`}
                                                style={{ width: `${dim.transformedScore}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Save area */}
                <div className="p-4 border-t border-border space-y-2">
                    {changedCount > 0 && (
                        <p className="text-[11px] text-amber-700 font-semibold text-center bg-amber-50 rounded-lg py-1.5 border border-amber-200">
                            {changedCount} ítem{changedCount !== 1 ? "s" : ""} modificado{changedCount !== 1 ? "s" : ""}
                        </p>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-muted disabled:text-muted-foreground text-white font-bold text-sm rounded-lg transition-all shadow-sm disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Guardar Cambios
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => router.push("/dashboard/assessments")}
                        className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                    >
                        Cancelar sin guardar
                    </button>
                </div>
            </aside>
        </div>
    );
}
