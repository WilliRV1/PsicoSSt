import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "../diagnostic/print-button";
import "../diagnostic/organizational-report.css";

interface PageProps {
    params: Promise<{ orgId: string }>;
}

export default async function SociodemographicReportPage({ params }: PageProps) {
    const { orgId } = await params;
    const session = await auth();

    if (!session?.user?.id) redirect("/login");

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            psychologist: {
                select: {
                    fullName: true,
                    licenseNumber: true
                }
            }
        }
    });

    if (!org || (org.createdByPsychologist !== session.user.id && !session.user.isAdmin)) {
        return notFound();
    }

    const workers = await prisma.worker.findMany({
        where: { organizationId: orgId }
    });

    if (workers.length === 0) {
        return (
            <div className="org-report-container text-center py-20">
                <h1 className="text-2xl font-bold text-slate-800">Informe Sociodemográfico</h1>
                <p className="text-slate-500 mt-4">No hay trabajadores registrados para esta organización.</p>
                <div className="mt-8">
                    <a href={`/dashboard/organizations/${orgId}`} className="text-blue-600 font-bold hover:underline">← Volver</a>
                </div>
            </div>
        );
    }

    const stats = processSociodemographics(workers);

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="org-report-container">
                <header className="org-report-header">
                    <div>
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1 block">Perfil Epidemiológico</span>
                        <h1>Análisis Sociodemográfico</h1>
                        <p className="text-slate-500 font-medium mt-1">{org.name} <span className="mx-2 text-slate-300">|</span> Población: {workers.length} trabajadores</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-600 font-bold">{org.psychologist.fullName}</p>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-tighter">Fecha: {new Date().toLocaleDateString('es-CO')}</p>
                    </div>
                </header>

                <div className="anonymity-notice">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 112 0v4a1 1 0 11-2 0V6zm1 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <p><strong>Aviso Técnico:</strong> Este análisis consolida las variables socio-demográficas y ocupacionales de la población evaluada, fundamentales para el diseño de programas de vigilancia epidemiológica según la Res. 2646 de 2008.</p>
                </div>

                <section className="report-section">
                    <h2 className="section-title">1. Distribución Demográfica</h2>
                    <div className="segment-grid">
                        <ChartBox title="Rangos de Edad" distribution={stats.age} />
                        <ChartBox title="Distribución por Género" distribution={stats.gender} />
                        <ChartBox title="Estado Civil" distribution={stats.maritalStatus} />
                        <ChartBox title="Personas a Cargo" distribution={stats.dependents} />
                    </div>
                </section>

                <section className="report-section">
                    <h2 className="section-title">2. Perfil Educativo y Ocupacional</h2>
                    <div className="segment-grid">
                        <ChartBox title="Nivel de Escolaridad" distribution={stats.education} />
                        <ChartBox title="Nivel Jerárquico" distribution={stats.jobLevel} />
                        <ChartBox title="Área / Departamento" distribution={stats.departmentArea} />
                        <ChartBox title="Tipo de Contrato" distribution={stats.contractType} />
                        <ChartBox title="Modalidad de Pago" distribution={stats.paymentModality} />
                        <ChartBox title="Atención al Público" distribution={stats.customerInteraction} />
                    </div>
                    <div className="mt-6">
                        <ChartBox title="Antigüedad en la Organización" distribution={stats.tenure} />
                    </div>
                </section>

                <section className="report-section">
                    <h2 className="section-title">3. Condiciones de Vida y Entorno</h2>
                    <div className="segment-grid">
                        <ChartBox title="Tipo de Vivienda" distribution={stats.housing} />
                        <ChartBox title="Estrato Socioeconómico" distribution={stats.stratum} />
                        <ChartBox title="Ciudad de Residencia" distribution={stats.residenceCity} />
                        <ChartBox title="Medio de Transporte Principal" distribution={stats.transportMeans} />
                    </div>
                </section>

                <section className="report-section">
                    <h2 className="section-title">4. Uso del Tiempo Libre</h2>
                    <div className="chart-container">
                        <DistributionBars distribution={stats.freeTime} />
                    </div>
                </section>

                <footer className="no-print mt-12 pt-8 border-t border-slate-200 flex justify-between items-center">
                    <a href={`/dashboard/organizations/${orgId}`} className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">
                        ← Volver
                    </a>
                    <PrintButton />
                </footer>
            </div>
        </div>
    );
}

function ChartBox({ title, distribution }: { title: string, distribution: any }) {
    return (
        <div className="chart-container shadow-sm border-slate-200/60 bg-white">
            <h3 className="chart-title border-b border-slate-100 pb-2 mb-4">{title}</h3>
            <DistributionBars distribution={distribution} />
        </div>
    );
}

function DistributionBars({ distribution }: { distribution: any }) {
    return (
        <div className="space-y-3">
            {Object.entries(distribution).map(([label, percentage]: [string, any]) => (
                <div key={label} className="bar-row">
                    <div className="bar-label">
                        <span className="text-xs font-bold text-slate-600">{label}</span>
                        <span className="text-xs font-black text-blue-600">{percentage}%</span>
                    </div>
                    <div className="bar-outer bg-slate-100 h-2.5">
                        <div className="bar-inner bg-blue-500 shadow-sm" style={{ width: `${percentage}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function processSociodemographics(workers: any[]) {
    const calc = (field: string) => {
        const counts: any = {};
        workers.forEach(w => {
            let val = w[field];
            if (val === true) val = "Sí";
            else if (val === false) val = "No";
            else if (!val) val = "No especificado";
            counts[val] = (counts[val] || 0) + 1;
        });
        const dist: any = {};
        Object.entries(counts).forEach(([k, v]: [string, any]) => dist[k] = Math.round((v / workers.length) * 100));
        return dist;
    };

    return {
        age: calculateAgeRange(workers),
        gender: calc("gender"),
        maritalStatus: calc("maritalStatus"),
        dependents: calculateDependents(workers),
        education: calc("educationLevel"),
        jobLevel: calc("jobLevel"),
        departmentArea: calc("departmentArea"),
        contractType: calc("contractType"),
        paymentModality: calc("paymentModality"),
        tenure: calculateTenureRange(workers),
        housing: calc("housingType"),
        stratum: calc("socioeconomicStratum"),
        residenceCity: calc("residenceCity"),
        transportMeans: calc("transportMeans"),
        customerInteraction: calc("hasCustomerInteraction"),
        freeTime: calculateFreeTime(workers)
    };
}

function calculateAgeRange(workers: any[]) {
    const groups: any = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "55+": 0 };
    workers.forEach(w => {
        if (!w.birthYear) return;
        const age = new Date().getFullYear() - w.birthYear;
        if (age <= 25) groups["18-25"]++;
        else if (age <= 35) groups["26-35"]++;
        else if (age <= 45) groups["36-45"]++;
        else if (age <= 55) groups["46-55"]++;
        else groups["55+"]++;
    });
    const dist: any = {};
    Object.entries(groups).forEach(([k, v]: [string, any]) => dist[k] = Math.round((v / workers.length) * 100));
    return dist;
}

function calculateTenureRange(workers: any[]) {
    const groups: any = { "< 1 año": 0, "1-3 años": 0, "4-7 años": 0, "8-12 años": 0, "> 12 años": 0 };
    workers.forEach(w => {
        const y = w.yearsInCompany || 0;
        if (y < 1) groups["< 1 año"]++;
        else if (y <= 3) groups["1-3 años"]++;
        else if (y <= 7) groups["4-7 años"]++;
        else if (y <= 12) groups["8-12 años"]++;
        else groups["> 12 años"]++;
    });
    const dist: any = {};
    Object.entries(groups).forEach(([k, v]: [string, any]) => dist[k] = Math.round((v / (workers.length || 1)) * 100));
    return dist;
}

function calculateDependents(workers: any[]) {
    const groups: any = { "Ninguna": 0, "1 a 2": 0, "3 o más": 0, "No especificado": 0 };
    workers.forEach(w => {
        const d = w.dependentsCount;
        if (d === null || d === undefined) groups["No especificado"]++;
        else if (d === 0) groups["Ninguna"]++;
        else if (d <= 2) groups["1 a 2"]++;
        else groups["3 o más"]++;
    });
    const dist: any = {};
    Object.entries(groups).forEach(([k, v]: [string, any]) => {
        if (v > 0) dist[k] = Math.round((v / (workers.length || 1)) * 100);
    });
    return dist;
}

function calculateFreeTime(workers: any[]) {
    const counts: any = {};
    workers.forEach(w => {
        (w.freeTimeUsage || []).forEach((u: string) => counts[u] = (counts[u] || 0) + 1);
    });
    const dist: any = {};
    const total = workers.length || 1;
    Object.entries(counts).forEach(([k, v]: [string, any]) => dist[k] = Math.round((v / total) * 100));
    return dist;
}
