"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, AlertTriangle, FileText, BrainCircuit, Save, Printer } from "lucide-react";
import dynamic from "next/dynamic";

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

const PDFViewer = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
    { ssr: false }
);

const OrganizationalReportPDF = dynamic(
    () => import("@/components/reports/OrganizationalReportPDF"),
    { ssr: false }
);

function OrganizationalReportContent() {
    const searchParams = useSearchParams();
    const orgId = searchParams.get("org");
    
    const [department, setDepartment] = useState("ALL");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [aiText, setAiText] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!orgId) return;
        setLoading(true);
        fetch(`/api/reports/organizational?orgId=${orgId}&department=${encodeURIComponent(department)}`)
            .then(res => res.json())
            .then(res => {
                setData(res);
                if (res.recommendations) {
                    setAiText(res.recommendations);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load reports", err);
                setLoading(false);
            });
    }, [orgId, department]);

    const handleGenerateAI = async () => {
        if (!orgId) return;
        setGeneratingAI(true);
        try {
            const res = await fetch('/api/ai/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId })
            });
            const result = await res.json();
            if (result.success && result.recommendations) {
                setAiText(result.recommendations);
                setData((prev: any) => ({ ...prev, recommendations: result.recommendations }));
            } else {
                alert(result.error || "Error generando IA");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
        setGeneratingAI(false);
    };

    const handleSaveText = async () => {
        if (!orgId) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/ai/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId, overrideText: aiText })
            });
            const result = await res.json();
            if (result.success) {
                setData((prev: any) => ({ ...prev, recommendations: aiText }));
                alert("Plan guardado exitosamente");
            }
        } catch (e) {
            console.error(e);
            alert("Error al guardar");
        }
        setIsSaving(false);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-600">Cargando Centro de Inteligencia Epidemiológica...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center">Error al cargar datos. Asegúrate de pasar el orgId en la URL.</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-blue-600" />
                        Centro de Inteligencia Epidemiológica
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Validación de IA y Generación de Reporte Pericial
                    </p>
                </div>
            </div>

            {data.isRestricted ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                    <div>
                        <h2 className="text-lg font-bold text-red-800">Reserva Legal de Información</h2>
                        <p className="text-red-700 mt-2">
                            {data.message} La muestra actual es de {data.workerCount} trabajador(es). 
                            Se requiere un mínimo de 5 trabajadores para el análisis segmentado (Ley 1090 de 2006).
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* PANEL IZQUIERDO: COPILOTO IA */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                            Copiloto Estratégico (IA)
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Genera y valida el plan de intervención basado en la Guía Técnica (Resolución 2764).
                        </p>
                        
                        <div className="flex-1 flex flex-col gap-4">
                            <textarea 
                                value={aiText}
                                onChange={(e) => setAiText(e.target.value)}
                                className="w-full flex-1 min-h-[300px] p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700 leading-relaxed"
                                placeholder="Las recomendaciones aparecerán aquí o puedes redactarlas manualmente..."
                            />
                            
                            <div className="flex gap-4">
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={generatingAI}
                                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 border border-indigo-200 rounded shadow-sm transition disabled:opacity-50"
                                >
                                    {generatingAI ? "Generando..." : "Generar con IA"}
                                </button>
                                <button
                                    onClick={handleSaveText}
                                    disabled={isSaving || !aiText}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? "Guardando..." : "Validar y Guardar"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* PANEL DERECHO: VISOR PDF */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-red-600" />
                                Vista Previa del Informe
                            </h2>
                            <PDFDownloadLink
                                document={<OrganizationalReportPDF data={data} />}
                                fileName={`Informe_Organizacional_${data.orgInfo.organizationName.replace(/\s+/g, '_')}.pdf`}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition"
                            >
                                {/* @ts-ignore */}
                                {({ loading: pdfLoading }) => (
                                    <>
                                        <Download className="w-4 h-4" />
                                        {pdfLoading ? "Preparando..." : "Descargar PDF"}
                                    </>
                                )}
                            </PDFDownloadLink>
                        </div>
                        
                        <div className="flex-1 bg-gray-100 rounded-md overflow-hidden min-h-[500px] border border-gray-200">
                            <PDFViewer width="100%" height="100%" className="border-none">
                                <OrganizationalReportPDF data={data} />
                            </PDFViewer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function OrganizationalReportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-600">Cargando aplicación...</div>}>
            <OrganizationalReportContent />
        </Suspense>
    );
}
