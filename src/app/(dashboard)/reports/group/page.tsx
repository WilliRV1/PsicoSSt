"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, Download } from "lucide-react";

function GroupReportContent() {
    const searchParams = useSearchParams();
    const orgId = searchParams.get("org");
    const [data, setData] = useState<any>(null);
    const [socioData, setSocioData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;
        Promise.all([
            fetch(`/api/reports/group?organizationId=${orgId}`).then(res => res.json()),
            fetch(`/api/reports/sociodemographic?organizationId=${orgId}`).then(res => res.json())
        ]).then(([groupRes, socioRes]) => {
            setData(groupRes);
            setSocioData(socioRes);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load reports", err);
            setLoading(false);
        });
    }, [orgId]);

    if (loading) {
        return <div className="p-8 text-center">Cargando informes consolidados...</div>;
    }

    if (!data || !socioData) {
        return <div className="p-8 text-center">Error al cargar datos.</div>;
    }

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#7F1D1D'];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Informe General y Sociodemográfico</h1>
                    <p className="text-gray-500">Muestra consolidada de resultados a nivel de organización</p>
                </div>
                <button
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition"
                    onClick={() => window.print()}
                >
                    <Download className="w-4 h-4" />
                    <span>Imprimir PDF</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sociodemographic */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Distribución por Género</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={socioData.gender} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#3B82F6" label>
                                    {socioData.gender.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Distribución por Edades</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={socioData.age}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Risk Results */}
                <div className="bg-white p-6 rounded-lg shadow-sm md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Riesgo Intralaboral General</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.intralaboral}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#EF4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Riesgo Extralaboral</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.extralaboral} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#F59E0B" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Niveles de Estrés</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.stress} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#7F1D1D" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            <div className="text-center text-sm text-gray-400 pt-8 pb-4">
                La información contenida en este informe está sometida a reserva legal según la Ley 1090 de 2006 y la Resolución 2346 de 2007.
            </div>
        </div>
    );
}

export default function GroupReportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando la aplicación...</div>}>
            <GroupReportContent />
        </Suspense>
    );
}
