"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QuestionnaireType } from "@/types/battery";

interface Organization {
    id: string;
    name: string;
    nit: string;
}

const ALL_TYPES: { value: QuestionnaireType; label: string }[] = [
    { value: "INTRALABORAL", label: "Intralaboral" },
    { value: "EXTRALABORAL", label: "Extralaboral" },
    { value: "STRESS", label: "Estrés" },
];

/**
 * Enlace único por empresa: el trabajador se identifica con su cédula al
 * entrar (ver OrganizationInvitationLinkService) — ya no se busca ni se
 * invita a un trabajador puntual desde aquí.
 */
export default function CompanyInvitationLinkPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

    const [plannedTypes, setPlannedTypes] = useState<QuestionnaireType[]>(["INTRALABORAL", "EXTRALABORAL", "STRESS"]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ url: string } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch("/api/organizations")
            .then((res) => res.json())
            .then((data) => setOrganizations(data.data || []))
            .catch((err) => console.error(err));
    }, []);

    const filteredOrgs = organizations.filter((o) =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.nit.includes(searchTerm)
    );

    const toggleType = (t: QuestionnaireType) => {
        setPlannedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    };

    const handleSubmit = async () => {
        if (!selectedOrg || plannedTypes.length === 0) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/organization-invitation-links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId: selectedOrg.id,
                    // Irrelevante para calificar — cada trabajador usa su propia
                    // forma A/B según el jobLevel con el que fue registrado.
                    formType: "A",
                    plannedTypes,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al crear el enlace");
            setResult({ url: data.url });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyLink = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (result) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4">
                <div className="w-full bg-card border border-border shadow-xl rounded-3xl p-8 text-center space-y-5">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                        <Check className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Enlace de la empresa listo</h2>
                    <p className="text-sm text-muted-foreground">
                        Comparte este enlace con todos los trabajadores de <strong>{selectedOrg?.name}</strong> — cada uno se
                        identifica con su cédula al entrar. Crear un enlace nuevo para esta empresa invalida este.
                    </p>
                    <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-3">
                        <input readOnly value={result.url} className="flex-1 bg-transparent text-xs text-foreground outline-none truncate" />
                        <button onClick={copyLink} className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors" title="Copiar enlace">
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                        </button>
                    </div>
                    <Link href="/dashboard/assessments">
                        <Button className="w-full h-12 rounded-xl">Volver a Evaluaciones</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-300">
            {!selectedOrg ? (
                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4">
                    <div className="w-full space-y-4">
                        <Link href="/dashboard/assessments" className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Volver a Evaluaciones
                        </Link>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Enlace de autoservicio por empresa</h1>
                            <p className="text-muted-foreground mt-2">
                                Elige la empresa — cada trabajador entra al mismo enlace y se identifica con su cédula.
                            </p>
                        </div>
                        <div className="relative shadow-xl rounded-2xl bg-card border border-border overflow-hidden">
                            <div className="flex items-center px-4 py-4 border-b border-border bg-muted/30">
                                <input
                                    type="text"
                                    placeholder="Buscar empresa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none px-2 text-lg text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {filteredOrgs.map((o) => (
                                    <div
                                        key={o.id}
                                        onClick={() => setSelectedOrg(o)}
                                        className="px-6 py-4 cursor-pointer flex justify-between items-center hover:bg-muted transition-colors border-l-4 border-transparent"
                                    >
                                        <div>
                                            <p className="font-medium text-foreground">{o.name}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">NIT: {o.nit}</p>
                                        </div>
                                    </div>
                                ))}
                                {filteredOrgs.length === 0 && (
                                    <div className="px-6 py-8 text-center text-muted-foreground">No se encontraron empresas.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full px-4">
                    <div className="w-full bg-card border border-border shadow-xl rounded-3xl p-8 space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-foreground">{selectedOrg.name}</h2>
                            <p className="text-muted-foreground text-sm mt-1">NIT: {selectedOrg.nit}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Cuestionarios a incluir</label>
                            <div className="space-y-2">
                                {ALL_TYPES.map((t) => (
                                    <label key={t.value} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50">
                                        <input
                                            type="checkbox"
                                            checked={plannedTypes.includes(t.value)}
                                            onChange={() => toggleType(t.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium text-foreground">{t.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setSelectedOrg(null)} className="flex-1 h-12 rounded-xl">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || plannedTypes.length === 0}
                                className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            >
                                {isSubmitting ? "Generando..." : "Generar enlace"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
