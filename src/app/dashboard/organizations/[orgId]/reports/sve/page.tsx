import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SVEPrintButton } from "./print-button";
import type { SVEReportData, DemographicRow } from "@/components/reports/SVEReportPDF";

interface PageProps {
    params: Promise<{ orgId: string }>;
}

const RISK_LABELS: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo", BAJO: "Bajo", MEDIO: "Medio", ALTO: "Alto", MUY_ALTO: "Muy Alto",
};

const HIGH = new Set(["ALTO", "MUY_ALTO"]);

/** Counts values into labeled rows sorted by frequency, mapping blanks to "No reporta". */
function tally(values: (string | null | undefined)[]): DemographicRow[] {
    const counts: Record<string, number> = {};
    values.forEach(v => {
        const key = (v ?? "").trim() || "No reporta";
        counts[key] = (counts[key] ?? 0) + 1;
    });
    const total = values.length || 1;
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count);
}

function ageBucket(birthDate: Date | null, birthYear: number | null): string {
    const year = birthDate ? birthDate.getFullYear() : birthYear;
    if (!year) return "No reporta";
    const age = new Date().getFullYear() - year;
    if (age < 18 || age > 100) return "No reporta";
    if (age <= 25) return "18 a 25 años";
    if (age <= 35) return "26 a 35 años";
    if (age <= 45) return "36 a 45 años";
    if (age <= 55) return "46 a 55 años";
    return "Más de 55 años";
}

function seniorityBucket(lessThanOneYear: boolean | null, years: number | null): string {
    if (lessThanOneYear) return "Menos de 1 año";
    if (years == null) return "No reporta";
    if (years <= 2) return "1 a 2 años";
    if (years <= 5) return "3 a 5 años";
    if (years <= 10) return "6 a 10 años";
    return "Más de 10 años";
}

export default async function SVEReportPage({ params }: PageProps) {
    const { orgId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { psychologist: { select: { fullName: true, licenseNumber: true } } }
    });

    if (!org || (org.createdByPsychologist !== session.user.id && !session.user.isAdmin)) {
        return notFound();
    }

    const assessments = await prisma.assessment.findMany({
        where: { organizationId: orgId, status: { in: ["COMPLETED", "SCORED", "SIGNED", "REVIEWED"] } },
        include: {
            worker: {
                select: {
                    id: true, gender: true, birthDate: true, birthYear: true,
                    maritalStatus: true, educationLevel: true, departmentArea: true,
                    contractType: true, workSchedule: true,
                    lessThanOneYearInCompany: true, yearsInCompany: true,
                }
            },
            scoredResult: true
        }
    });

    if (assessments.length === 0) {
        return (
            <div className="max-w-2xl mx-auto text-center py-24">
                <h1 className="text-2xl font-bold text-foreground mb-2">Programa SVE — Riesgo Psicosocial</h1>
                <p className="text-muted-foreground">
                    No hay evaluaciones completadas para generar el SVE. Complete al menos una batería de riesgo psicosocial primero.
                </p>
                <Link href={`/dashboard/organizations/${orgId}`} className="inline-block mt-8 text-blue-600 font-semibold hover:underline">
                    ← Volver a la organización
                </Link>
            </div>
        );
    }

    // ── Assessment splits ──────────────────────────────────
    const intraA = assessments.filter(a => a.questionnaireType === "INTRALABORAL" && a.formType === "A");
    const intraB = assessments.filter(a => a.questionnaireType === "INTRALABORAL" && a.formType === "B");
    const intra = assessments.filter(a => a.questionnaireType === "INTRALABORAL");
    const extra = assessments.filter(a => a.questionnaireType === "EXTRALABORAL");
    const stress = assessments.filter(a => a.questionnaireType === "STRESS");

    const calcDist = (list: typeof assessments): Record<string, number> => {
        const counts: Record<string, number> = { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 };
        list.forEach(a => {
            const r = a.scoredResult?.overallRiskCategory;
            if (r && r in counts) counts[r]++;
        });
        const total = list.length || 1;
        const pct: Record<string, number> = {};
        Object.keys(counts).forEach(k => pct[k] = Math.round((counts[k] / total) * 100));
        return pct;
    };

    // ── Priority groups (one entry per worker) ─────────────
    const workerRisk: Record<string, { intra?: string; stress?: string }> = {};
    assessments.forEach(a => {
        if (!workerRisk[a.workerId]) workerRisk[a.workerId] = {};
        const r = a.scoredResult?.overallRiskCategory ?? undefined;
        if (a.questionnaireType === "INTRALABORAL") workerRisk[a.workerId].intra = r;
        if (a.questionnaireType === "STRESS") workerRisk[a.workerId].stress = r;
    });

    const groups = { a: 0, b: 0, c: 0, d: 0 };
    Object.values(workerRisk).forEach(w => {
        const iHigh = !!w.intra && HIGH.has(w.intra);
        const sHigh = !!w.stress && HIGH.has(w.stress);
        if (!iHigh && !sHigh) groups.a++;
        else if (!iHigh && sHigh) groups.b++;
        else if (iHigh && !sHigh) groups.c++;
        else groups.d++;
    });

    // ── Demographics (unique workers only) ─────────────────
    const uniqueWorkers = [...new Map(assessments.map(a => [a.workerId, a.worker])).values()];

    const demographics = {
        gender: tally(uniqueWorkers.map(w => w.gender)),
        ageRanges: tally(uniqueWorkers.map(w => ageBucket(w.birthDate, w.birthYear))),
        education: tally(uniqueWorkers.map(w => w.educationLevel)),
        maritalStatus: tally(uniqueWorkers.map(w => w.maritalStatus)),
        contractType: tally(uniqueWorkers.map(w => w.contractType)),
        workSchedule: tally(uniqueWorkers.map(w => w.workSchedule)),
        seniority: tally(uniqueWorkers.map(w => seniorityBucket(w.lessThanOneYearInCompany, w.yearsInCompany))),
    };

    // ── Critical dimensions ────────────────────────────────
    const dimMap: Record<string, { scores: number[]; risks: string[]; questionnaire: string }> = {};
    assessments.forEach(a => {
        const sr = a.scoredResult as { dimensionScores?: Record<string, unknown> } | null;
        if (!sr?.dimensionScores) return;
        const qt = a.questionnaireType === "INTRALABORAL" ? "Intralaboral"
            : a.questionnaireType === "EXTRALABORAL" ? "Extralaboral" : "Estrés";
        Object.values(sr.dimensionScores).forEach(raw => {
            const dim = raw as { dimensionName?: string; dimensionKey?: string; transformedScore?: number; riskCategory?: string };
            const name = dim.dimensionName || dim.dimensionKey;
            if (!name) return;
            const key = `${name}__${qt}`;
            if (!dimMap[key]) dimMap[key] = { scores: [], risks: [], questionnaire: qt };
            if (typeof dim.transformedScore === "number") dimMap[key].scores.push(dim.transformedScore);
            if (dim.riskCategory) dimMap[key].risks.push(dim.riskCategory);
        });
    });

    const criticalDimensions = Object.entries(dimMap)
        .map(([key, d]) => {
            const avgScore = d.scores.length ? d.scores.reduce((s, v) => s + v, 0) / d.scores.length : 0;
            const critical = d.risks.filter(r => HIGH.has(r)).length;
            return {
                name: key.split("__")[0],
                questionnaire: d.questionnaire,
                avgScore,
                criticalPercent: d.risks.length ? Math.round((critical / d.risks.length) * 100) : 0,
            };
        })
        .filter(d => d.criticalPercent > 0)
        .sort((a, b) => b.criticalPercent - a.criticalPercent || b.avgScore - a.avgScore);

    // ── Areas ──────────────────────────────────────────────
    const areaGroups: Record<string, typeof assessments> = {};
    assessments.forEach(a => {
        const area = a.worker.departmentArea || "General";
        (areaGroups[area] ??= []).push(a);
    });
    const areas = Object.entries(areaGroups)
        .map(([name, list]) => ({ name, count: list.length, dist: calcDist(list) }))
        .sort((a, b) => b.count - a.count);

    // ── Summary ────────────────────────────────────────────
    const allRisks = assessments.map(a => a.scoredResult?.overallRiskCategory).filter(Boolean) as string[];
    const criticalPercent = allRisks.length ? Math.round((allRisks.filter(r => HIGH.has(r)).length / allRisks.length) * 100) : 0;

    const dates = assessments.map(a => new Date(a.assessmentDate).getTime());
    const fmt = (t: number) => new Date(t).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

    const data: SVEReportData = {
        org: {
            name: org.name,
            nit: org.nit,
            psychologistName: org.psychologist.fullName,
            psychologistLicense: org.psychologist.licenseNumber,
            dateStart: fmt(Math.min(...dates)),
            dateEnd: fmt(Math.max(...dates)),
            today: fmt(Date.now()),
        },
        summary: {
            uniqueWorkers: uniqueWorkers.length,
            totalAssessments: assessments.length,
            intraA: intraA.length,
            intraB: intraB.length,
            extra: extra.length,
            stress: stress.length,
            criticalPercent,
            needsSVE: criticalPercent > 20,
        },
        demographics,
        distributions: {
            intra: calcDist(intra),
            extra: calcDist(extra),
            stress: calcDist(stress),
        },
        groups,
        criticalDimensions,
        areas,
    };

    // ── Preview UI ─────────────────────────────────────────
    const groupCards = [
        { label: "Grupo A", name: "Sanos", n: groups.a, cls: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900" },
        { label: "Grupo B", name: "Vulnerables", n: groups.b, cls: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-900" },
        { label: "Grupo C", name: "Adaptados", n: groups.c, cls: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900" },
        { label: "Grupo D", name: "Prioridad de intervención", n: groups.d, cls: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16">
            <div>
                <Link href={`/dashboard/organizations/${orgId}`} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                    ← Volver a la organización
                </Link>
                <h1 className="text-2xl font-bold text-foreground mt-3">Programa de Vigilancia Epidemiológica</h1>
                <p className="text-muted-foreground">
                    {org.name} · NIT {org.nit} · Resolución 2764 de 2022
                </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between gap-6 flex-wrap">
                <div>
                    <h2 className="font-bold text-foreground">Documento listo para generar</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        15 capítulos · {uniqueWorkers.length} trabajadores · {assessments.length} evaluaciones · datos demográficos y resultados incluidos.
                    </p>
                </div>
                <SVEPrintButton data={data} />
            </div>

            {data.summary.needsSVE && (
                <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                    <p className="text-sm">
                        <strong>SVE obligatorio:</strong> el {criticalPercent}% de las evaluaciones está en riesgo Alto o Muy Alto,
                        superando el umbral del 20% establecido en la Resolución 2764 de 2022.
                    </p>
                </div>
            )}

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Grupos de intervención</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {groupCards.map(g => (
                        <div key={g.label} className={`p-4 rounded-xl border ${g.cls}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest">{g.label}</p>
                            <p className="text-sm font-bold text-foreground">{g.name}</p>
                            <p className="text-3xl font-black mt-1">{g.n}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Perfil general de riesgo</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { title: "Intralaboral", dist: data.distributions.intra, n: intra.length },
                        { title: "Extralaboral", dist: data.distributions.extra, n: extra.length },
                        { title: "Estrés", dist: data.distributions.stress, n: stress.length },
                    ].map(({ title, dist, n }) => (
                        <div key={title} className="p-4 bg-card border border-border rounded-xl">
                            <p className="text-xs font-bold text-foreground mb-3">{title} <span className="text-muted-foreground font-normal">N={n}</span></p>
                            {["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"].map(k => (
                                <div key={k} className="mb-2">
                                    <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
                                        <span>{RISK_LABELS[k]}</span>
                                        <span className="font-mono">{dist[k]}%</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${
                                                k === "SIN_RIESGO" ? "bg-emerald-500" : k === "BAJO" ? "bg-blue-500"
                                                : k === "MEDIO" ? "bg-amber-500" : k === "ALTO" ? "bg-orange-500" : "bg-red-600"
                                            }`}
                                            style={{ width: `${dist[k]}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            {criticalDimensions.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Dimensiones en riesgo crítico</h2>
                    <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-bold">Dimensión</th>
                                    <th className="text-left px-4 py-2.5 font-bold">Cuestionario</th>
                                    <th className="text-center px-4 py-2.5 font-bold">% Crítico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {criticalDimensions.slice(0, 8).map(d => (
                                    <tr key={`${d.name}-${d.questionnaire}`}>
                                        <td className="px-4 py-2.5 font-medium text-foreground">{d.name}</td>
                                        <td className="px-4 py-2.5 text-muted-foreground">{d.questionnaire}</td>
                                        <td className={`px-4 py-2.5 text-center font-bold ${d.criticalPercent > 30 ? "text-red-600" : d.criticalPercent > 15 ? "text-orange-600" : "text-muted-foreground"}`}>
                                            {d.criticalPercent}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
                <SVEPrintButton data={data} />
            </div>
        </div>
    );
}
