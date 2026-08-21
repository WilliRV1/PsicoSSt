import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrganizationalDiagnosis } from "@/lib/ai/openrouter-client";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findFirst({
        where: { id: orgId, createdByPsychologist: session.user.id },
        select: { id: true, name: true, economicSector: true, city: true },
    });

    if (!org) {
        return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
    }

    // ── Diagnostic data (same logic as /reports/diagnostic) ──────────────────
    const assessments = await prisma.assessment.findMany({
        where: { organizationId: orgId, status: "SIGNED" },
        select: {
            workerId: true,
            questionnaireType: true,
            worker: { select: { departmentArea: true, jobTitle: true } },
            scoredResult: { select: { overallRiskCategory: true } },
        },
    });

    const workers = await (prisma.worker as any).findMany({
        where: { organizationId: orgId },
        select: {
            gender: true,
            birthDate: true,
            educationLevel: true,
            jobLevel: true,
            yearsInCompany: true,
            lessThanOneYearInCompany: true,
        },
    });

    const totalWorkers = workers.length;

    // Risk distribution helpers
    const emptyDist = () => ({ SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 });
    const toPercent = (dist: Record<string, number>, total: number) => {
        if (total === 0) return dist;
        const out: Record<string, number> = {};
        for (const k in dist) out[k] = Math.round((dist[k] / total) * 100);
        return out;
    };

    const intra = emptyDist();
    const extra = emptyDist();
    const stress = emptyDist();

    assessments.forEach(a => {
        const cat = a.scoredResult?.overallRiskCategory;
        // Una evaluación sin el mínimo de ítems no tiene nivel de riesgo, así
        // que no puede sumar a ninguna banda de la distribución.
        if (!cat || cat === "INVALIDO") return;
        if (a.questionnaireType === "INTRALABORAL" && cat in intra) intra[cat]++;
        if (a.questionnaireType === "EXTRALABORAL" && cat in extra) extra[cat]++;
        if (a.questionnaireType === "STRESS" && cat in stress) stress[cat]++;
    });

    const intraTotal = Object.values(intra).reduce((a, b) => a + b, 0);
    const extraTotal = Object.values(extra).reduce((a, b) => a + b, 0);
    const stressTotal = Object.values(stress).reduce((a, b) => a + b, 0);

    // Segmentation by area and job title (only groups with >= 5 for privacy)
    const segByArea: Record<string, { count: number; riskDistribution: Record<string, number> }> = {};
    const segByCargo: Record<string, { count: number; riskDistribution: Record<string, number> }> = {};
    const areaGroups: Record<string, any[]> = {};
    const cargoGroups: Record<string, any[]> = {};

    assessments.filter(a => a.questionnaireType === "INTRALABORAL").forEach(a => {
        const area = a.worker.departmentArea || "Sin área";
        const cargo = a.worker.jobTitle || "Sin cargo";
        if (!areaGroups[area]) areaGroups[area] = [];
        if (!cargoGroups[cargo]) cargoGroups[cargo] = [];
        areaGroups[area].push(a);
        cargoGroups[cargo].push(a);
    });

    const buildSeg = (groups: Record<string, any[]>) => {
        const result: Record<string, { count: number; riskDistribution: Record<string, number> }> = {};
        const others: any[] = [];
        for (const [key, items] of Object.entries(groups)) {
            if (items.length >= 5) {
                const d = emptyDist();
                items.forEach(a => { const c = a.scoredResult?.overallRiskCategory as keyof typeof d | undefined; if (c && c in d) d[c]++; });
                result[key] = { count: items.length, riskDistribution: toPercent(d, items.length) };
            } else {
                others.push(...items);
            }
        }
        if (others.length >= 5) {
            const d = emptyDist();
            others.forEach(a => { const c = a.scoredResult?.overallRiskCategory as keyof typeof d | undefined; if (c && c in d) d[c]++; });
            result["Otros grupos"] = { count: others.length, riskDistribution: toPercent(d, others.length) };
        }
        return result;
    };

    // Stress-Intra correlation matrix
    const workerMap: Record<string, { intra?: string; stress?: string }> = {};
    assessments.forEach(a => {
        if (!workerMap[a.workerId]) workerMap[a.workerId] = {};
        if (a.questionnaireType === "INTRALABORAL") workerMap[a.workerId].intra = a.scoredResult?.overallRiskCategory ?? undefined;
        if (a.questionnaireType === "STRESS") workerMap[a.workerId].stress = a.scoredResult?.overallRiskCategory ?? undefined;
    });
    const cats = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"];
    const correlation: Record<string, Record<string, number>> = {};
    cats.forEach(c => { correlation[c] = {}; cats.forEach(s => { correlation[c][s] = 0; }); });
    Object.values(workerMap).forEach(({ intra: i, stress: s }) => {
        if (i && s) correlation[i][s]++;
    });

    // Sociodemographic distributions
    const genderDist: Record<string, number> = {};
    const ageDist: Record<string, number> = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "55+": 0, "Sin datos": 0 };
    const jobLevelDist: Record<string, number> = {};
    const tenureDist: Record<string, number> = { "< 1 año": 0, "1-3 años": 0, "4-7 años": 0, "8-12 años": 0, "> 12 años": 0, "Sin datos": 0 };

    workers.forEach((w: any) => {
        // Gender
        const g = w.gender === "M" ? "Masculino" : w.gender === "F" ? "Femenino" : "Otro/Sin datos";
        genderDist[g] = (genderDist[g] || 0) + 1;

        // Age
        if (w.birthDate) {
            const age = Math.floor((Date.now() - new Date(w.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
            if (age <= 25) ageDist["18-25"]++;
            else if (age <= 35) ageDist["26-35"]++;
            else if (age <= 45) ageDist["36-45"]++;
            else if (age <= 55) ageDist["46-55"]++;
            else ageDist["55+"]++;
        } else {
            ageDist["Sin datos"]++;
        }

        // Job level
        const jl = w.jobLevel || "Sin datos";
        jobLevelDist[jl] = (jobLevelDist[jl] || 0) + 1;

        // Tenure
        if (w.lessThanOneYearInCompany) {
            tenureDist["< 1 año"]++;
        } else if (w.yearsInCompany != null) {
            if (w.yearsInCompany <= 3) tenureDist["1-3 años"]++;
            else if (w.yearsInCompany <= 7) tenureDist["4-7 años"]++;
            else if (w.yearsInCompany <= 12) tenureDist["8-12 años"]++;
            else tenureDist["> 12 años"]++;
        } else {
            tenureDist["Sin datos"]++;
        }
    });

    const toPercentWorkers = (dist: Record<string, number>) => toPercent(dist, totalWorkers);

    try {
        const report = await generateOrganizationalDiagnosis({
            orgName: org.name,
            economicSector: org.economicSector,
            city: org.city,
            totalWorkers,
            diagnostic: {
                totalAssessments: assessments.length,
                intralaboralDistribution: toPercent(intra, intraTotal),
                extralaboralDistribution: toPercent(extra, extraTotal),
                stressDistribution: toPercent(stress, stressTotal),
                segmentation: {
                    byArea: buildSeg(areaGroups),
                    byJobTitle: buildSeg(cargoGroups),
                },
                correlation,
            },
            sociodemographic: {
                genderDistribution: toPercentWorkers(genderDist),
                ageDistribution: toPercentWorkers(ageDist),
                jobLevelDistribution: toPercentWorkers(jobLevelDist),
                tenureDistribution: toPercentWorkers(tenureDist),
            },
        });

        return NextResponse.json({ report, generatedAt: new Date().toISOString() });
    } catch (err: any) {
        console.error("[AI DIAGNOSTIC] Error:", err);
        if (err.message?.includes("OPENROUTER_API_KEY")) {
            return NextResponse.json({ error: "IA no configurada" }, { status: 503 });
        }
        return NextResponse.json({ error: "Error al generar el diagnóstico" }, { status: 500 });
    }
}
