"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, AlertTriangle } from "lucide-react";

function GroupReportContent() {
    const searchParams = useSearchParams();
    const orgId = searchParams.get("org");
    
    const [department, setDepartment] = useState("ALL");
    const [data, setData] = useState<any>(null);
    const [socioData, setSocioData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;
        setLoading(true);
        Promise.all([
            fetch(`/api/reports/group?organizationId=${orgId}&department=${encodeURIComponent(department)}`).then(res => res.json()),
            fetch(`/api/reports/sociodemographic?organizationId=${orgId}`).then(res => res.json())
        ]).then(([groupRes, socioRes]) => {
            setData(groupRes);
            setSocioData(socioRes);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load reports", err);
            setLoading(false);
        });
    }, [orgId, department]);

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
                <div className="flex gap-4 items-center">
                    {data.departments && data.departments.length > 0 && (
                        <select 
                            value={department} 
                            onChange={(e) => setDepartment(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="ALL">Toda la Empresa</option>
                            {data.departments.map((dep: string) => (
                                <option key={dep} value={dep}>{dep}</option>
                            ))}
                        </select>
                    )}
                    <button
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition"
                        onClick={() => window.print()}
                    >
                        <Download className="w-4 h-4" />
                        <span>Imprimir PDF</span>
                    </button>
                </div>
            </div>

            {data.privacyWarning ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                    <div>
                        <h2 className="text-lg font-bold text-red-800">Alerta de Confidencialidad y Anonimato Técnico</h2>
                        <p className="text-red-700 mt-2">
                            {data.message} La muestra poblacional actual es de {data.workerCount} trabajador(es). 
                            Se requiere un mínimo de 5 trabajadores para segmentar resultados y prevenir la identificación de los participantes, protegiendo así el secreto profesional.
                        </p>
                        <button 
                            onClick={() => setDepartment("ALL")}
                            className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded font-semibold hover:bg-red-200 transition"
                        >
                            Volver a vista general
                        </button>
                    </div>
                </div>
            ) : (
                <>
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

                        {/* Priority Matrix */}
                        {data.priorityMatrix && (
                            <div className="bg-white p-6 rounded-lg shadow-sm md:col-span-2">
                                <h2 className="text-lg font-semibold mb-2">Matriz de Priorización de Intervención (SVE)</h2>
                                <p className="text-sm text-gray-500 mb-6">Cruce individual entre Condiciones Intralaborales y Síntomas de Estrés.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                                        <div className="text-3xl font-black text-red-600 mb-1">{data.priorityMatrix.priorityGroup1D}</div>
                                        <div className="font-bold text-red-900 text-sm">Prioridad de Intervención (1D)</div>
                                        <div className="text-xs text-red-700 mt-1">Intralaboral Alto + Estrés Alto</div>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                                        <div className="text-3xl font-black text-orange-600 mb-1">{data.priorityMatrix.groupAdaptados}</div>
                                        <div className="font-bold text-orange-900 text-sm">Grupo Adaptado</div>
                                        <div className="text-xs text-orange-700 mt-1">Intralaboral Alto + Estrés Bajo</div>
                                    </div>
                                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                                        <div className="text-3xl font-black text-yellow-600 mb-1">{data.priorityMatrix.groupVulnerables}</div>
                                        <div className="font-bold text-yellow-900 text-sm">Grupo Vulnerable</div>
                                        <div className="text-xs text-yellow-700 mt-1">Intralaboral Bajo + Estrés Alto</div>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                                        <div className="text-3xl font-black text-green-600 mb-1">{data.priorityMatrix.groupSanos}</div>
                                        <div className="font-bold text-green-900 text-sm">Grupo Sano</div>
                                        <div className="text-xs text-green-700 mt-1">Intralaboral Bajo + Estrés Bajo</div>
                                    </div>
                                </div>
                            </div>
                        )}

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
                </>
            )}
            
            <div className="text-center text-sm text-gray-400 pt-8 pb-4">
                La información contenida en este informe está sometida a reserva legal según la Ley 1090 de 2006 y la Resolución 2346 de 2007. Los resultados estadísticos no comprometen la identidad de los trabajadores.
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
