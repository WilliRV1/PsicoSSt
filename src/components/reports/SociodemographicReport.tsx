"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, AlertTriangle, Download, Loader2 } from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Button } from "@/components/ui/button";

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

interface DataPoint {
  name: string;
  value: number;
}

export interface SociodemographicData {
  totalWorkers: number;
  sociodemographic: {
    gender: DataPoint[];
    age: DataPoint[];
    education: DataPoint[];
    maritalStatus: DataPoint[];
    stratum: DataPoint[];
    housing: DataPoint[];
    dependents: DataPoint[];
  };
  occupational: {
    seniorityCompany: DataPoint[];
    seniorityRole: DataPoint[];
    roleLevel: DataPoint[];
    contractType: DataPoint[];
    hoursPerDay: DataPoint[];
    paymentModality: DataPoint[];
  };
  alerts: {
    fatigueRisk: boolean;
    highTurnoverRisk: boolean;
  };
}

export default function SociodemographicReport({ 
    organizationId, 
    department = "ALL",
    onExportPdf
}: { 
    organizationId: string;
    department?: string;
    onExportPdf?: (data: SociodemographicData) => void;
}) {
    const [data, setData] = useState<SociodemographicData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [privacyWarning, setPrivacyWarning] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setPrivacyWarning(null);

            try {
                const res = await fetch(`/api/reports/sociodemographic?organizationId=${organizationId}&department=${department}`);
                const json = await res.json();

                if (!res.ok) {
                    if (res.status === 403 && json.privacyWarning) {
                        setPrivacyWarning(json.message);
                    } else {
                        setError(json.error || "Failed to load report");
                    }
                    return;
                }

                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (organizationId) {
            fetchData();
        }
    }, [organizationId, department]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (privacyWarning) {
        return (
            <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
                <ShieldAlert className="h-5 w-5" />
                <AlertTitle>Reserva de Información Legal</AlertTitle>
                <AlertDescription>
                    {privacyWarning}
                </AlertDescription>
            </Alert>
        );
    }

    if (error || !data) {
        return (
            <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || "No se pudo generar el reporte"}</AlertDescription>
            </Alert>
        );
    }

    const renderDonut = (dataArray: DataPoint[]) => (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={dataArray}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {dataArray.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );

    const renderBar = (dataArray: DataPoint[]) => (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataArray} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 11}} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6">
                        {dataArray.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Informe Sociodemográfico y Ocupacional</h2>
                    <p className="text-muted-foreground">Población evaluada: {data.totalWorkers} trabajadores</p>
                </div>
                {onExportPdf && (
                    <Button onClick={() => onExportPdf(data)}>
                        <Download className="mr-2 h-4 w-4" /> Exportar PDF
                    </Button>
                )}
            </div>

            {/* Alertas */}
            {(data.alerts.fatigueRisk || data.alerts.highTurnoverRisk) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.alerts.fatigueRisk && (
                        <Alert className="bg-amber-50 border-amber-200">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <AlertTitle className="text-amber-800">Riesgo de Fatiga</AlertTitle>
                            <AlertDescription className="text-amber-700">
                                Más del 30% de la población reporta jornadas superiores a 8 horas diarias. Se recomienda revisar cargas laborales.
                            </AlertDescription>
                        </Alert>
                    )}
                    {data.alerts.highTurnoverRisk && (
                        <Alert className="bg-red-50 border-red-200">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <AlertTitle className="text-red-800">Riesgo de Curva de Aprendizaje</AlertTitle>
                            <AlertDescription className="text-red-700">
                                Más del 40% de la población tiene menos de 6 meses en su cargo actual. Vulnerabilidad en adaptación al puesto.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            {/* SECCION 1: SOCIODEMOGRAFICO */}
            <h3 className="text-xl font-semibold border-b pb-2 mt-8">1. Perfil Sociodemográfico</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Sexo</CardTitle>
                    </CardHeader>
                    <CardContent>{renderDonut(data.sociodemographic.gender)}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Rangos de Edad</CardTitle>
                    </CardHeader>
                    <CardContent>{renderDonut(data.sociodemographic.age)}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Nivel Educativo</CardTitle>
                    </CardHeader>
                    <CardContent>{renderBar(data.sociodemographic.education)}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Estado Civil</CardTitle>
                    </CardHeader>
                    <CardContent>{renderDonut(data.sociodemographic.maritalStatus)}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Personas a Cargo</CardTitle>
                    </CardHeader>
                    <CardContent>{renderDonut(data.sociodemographic.dependents)}</CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Tipo de Vivienda</CardTitle>
                    </CardHeader>
                    <CardContent>{renderDonut(data.sociodemographic.housing)}</CardContent>
                </Card>
            </div>

            {/* SECCION 2: OCUPACIONAL */}
            <h3 className="text-xl font-semibold border-b pb-2 mt-8">2. Perfil Ocupacional</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Antigüedad en la Empresa</CardTitle>
                    </CardHeader>
                    <CardContent>{renderBar(data.occupational.seniorityCompany)}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Antigüedad en el Cargo Actual</CardTitle>
                    </CardHeader>
                    <CardContent>{renderBar(data.occupational.seniorityRole)}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Nivel del Cargo</CardTitle>
                    </CardHeader>
                    <CardContent>{renderDonut(data.occupational.roleLevel)}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Horas Diarias de Trabajo</CardTitle>
                    </CardHeader>
                    <CardContent>{renderDonut(data.occupational.hoursPerDay)}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tipo de Contrato</CardTitle>
                    </CardHeader>
                    <CardContent>{renderDonut(data.occupational.contractType)}</CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Modalidad de Pago</CardTitle>
                    </CardHeader>
                    <CardContent>{renderDonut(data.occupational.paymentModality)}</CardContent>
                </Card>
            </div>
        </div>
    );
}
