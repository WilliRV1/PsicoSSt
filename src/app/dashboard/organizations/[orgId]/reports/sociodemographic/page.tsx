import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
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
            <div className="org-report-container">
                <h1>Informe Sociodemográfico</h1>
                <p>No hay trabajadores registrados para esta organización.</p>
            </div>
        );
    }

    const stats = processSociodemographics(workers);

    return (
        <div className="org-report-container">
            <header className="org-report-header">
                <div>
                    <h1>Informe Sociodemográfico</h1>
                    <p style={{ color: "#718096" }}>{org.name} | Perfil Epidemiológico</p>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
                    <p><strong>Generado por:</strong> {org.psychologist.fullName}</p>
                    <p><strong>Licencia:</strong> {org.psychologist.licenseNumber}</p>
                </div>
            </header>

            <section className="report-section">
                <h2 className="section-title">Distribución por Edad y Género</h2>
                <div className="segment-grid">
                    <ChartBox title="Edad" distribution={stats.age} />
                    <ChartBox title="Género" distribution={stats.gender} />
                </div>
            </section>

            <section className="report-section">
                <h2 className="section-title">Perfil Educativo y Laboral</h2>
                <div className="segment-grid">
                    <ChartBox title="Nivel Educativo" distribution={stats.education} />
                    <ChartBox title="Nivel del Cargo" distribution={stats.jobLevel} />
                    <ChartBox title="Antigüedad en la Empresa" distribution={stats.tenure} />
                </div>
            </section>

            <section className="report-section">
                <h2 className="section-title">Vivienda y Estrato Socioeconómico</h2>
                <div className="segment-grid">
                    <ChartBox title="Tipo de Vivienda" distribution={stats.housing} />
                    <ChartBox title="Estrato Socioeconómico" distribution={stats.stratum} />
                </div>
            </section>

            <section className="report-section">
                <h2 className="section-title">Uso del Tiempo Libre</h2>
                <div className="chart-container" style={{ maxWidth: "600px", margin: "0 auto" }}>
                    <DistributionBars distribution={stats.freeTime} />
                </div>
            </section>

            <footer className="no-print" style={{ marginTop: "4rem", textAlign: "center" }}>
                <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                    🖨️ Imprimir Análisis Epidemiológico
                </button>
            </footer>
        </div>
    );
}

function ChartBox({ title, distribution }: { title: string, distribution: any }) {
    return (
        <div className="chart-container">
            <h3 className="chart-title">{title}</h3>
            <DistributionBars distribution={distribution} />
        </div>
    );
}

function DistributionBars({ distribution }: { distribution: any }) {
    return (
        <div>
            {Object.entries(distribution).map(([label, percentage]: [string, any]) => (
                <div key={label} className="bar-row">
                    <div className="bar-label">
                        <span>{label}</span>
                        <span>{percentage}%</span>
                    </div>
                    <div className="bar-outer">
                        <div className="bar-inner bg-blue-500" style={{ width: `${percentage}%`, backgroundColor: "#3182ce" }}></div>
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
            const val = w[field] || "No especificado";
            counts[val] = (counts[val] || 0) + 1;
        });
        const dist: any = {};
        Object.entries(counts).forEach(([k, v]: [string, any]) => dist[k] = Math.round((v / workers.length) * 100));
        return dist;
    };

    return {
        age: calculateAgeRange(workers),
        gender: calc("gender"),
        education: calc("educationLevel"),
        jobLevel: calc("jobLevel"),
        tenure: calculateTenureRange(workers),
        housing: calc("housingType"),
        stratum: calc("socioeconomicStratum"),
        freeTime: calculateFreeTime(workers)
    };
}

function calculateAgeRange(workers: any[]) {
    const groups: any = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "55+": 0 };
    workers.forEach(w => {
        if (!w.birthDate) return;
        const age = Math.abs(new Date(Date.now() - new Date(w.birthDate).getTime()).getUTCFullYear() - 1970);
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
    Object.entries(groups).forEach(([k, v]: [string, any]) => dist[k] = Math.round((v / workers.length) * 100));
    return dist;
}

function calculateFreeTime(workers: any[]) {
    const counts: any = {};
    workers.forEach(w => {
        (w.freeTimeUsage || []).forEach((u: string) => counts[u] = (counts[u] || 0) + 1);
    });
    const dist: any = {};
    Object.entries(counts).forEach(([k, v]: [string, any]) => dist[k] = Math.round((v / workers.length) * 100));
    return dist;
}
