import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrganizationalDiagnosis } from "@/lib/ai/openrouter-client";
import {
    MIN_GROUP_SIZE,
    belowThresholdPayload,
    meetsMinGroupSize,
    suppressSmallCounts,
    toSuppressedPercentages,
} from "@/lib/reports/anonymity";
import { getErrorMessage } from "@/lib/utils";

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

    // No se filtran los archivados: el diagnóstico cruza estos
    // sociodemográficos con las evaluaciones firmadas de arriba, y excluir a
    // quien fue evaluado y luego se archivó describiría una población distinta
    // de la que produjo los resultados de riesgo.
    const workers = await prisma.worker.findMany({
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

    // Una organización entera por debajo del umbral no puede agregarse: el
    // prompt saldría con porcentajes que son resultados individuales, y además
    // viajarían a un tercero (Res. 2646/2008 art. 11, Ley 1581/2012).
    if (!meetsMinGroupSize(totalWorkers)) {
        return NextResponse.json(belowThresholdPayload(totalWorkers), { status: 409 });
    }

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

    // Segmentation by area and job title (sólo grupos que alcanzan MIN_GROUP_SIZE)
    type ScoredAssessment = (typeof assessments)[number];
    const areaGroups: Record<string, ScoredAssessment[]> = {};
    const cargoGroups: Record<string, ScoredAssessment[]> = {};

    assessments.filter(a => a.questionnaireType === "INTRALABORAL").forEach(a => {
        const area = a.worker.departmentArea || "Sin área";
        const cargo = a.worker.jobTitle || "Sin cargo";
        if (!areaGroups[area]) areaGroups[area] = [];
        if (!cargoGroups[cargo]) cargoGroups[cargo] = [];
        areaGroups[area].push(a);
        cargoGroups[cargo].push(a);
    });

    /**
     * El umbral se mide sobre trabajadores distintos, no sobre evaluaciones: un
     * área de cuatro personas con tres cuestionarios cada una suma doce ítems y
     * pasaría cualquier piso contado sobre evaluaciones.
     *
     * Los grupos por debajo del umbral se suprimen y NO se reagrupan en "otros
     * grupos" como antes: si el residual también quedaba bajo umbral, restarlo
     * del total de la organización devolvía exactamente el grupo que se quiso
     * ocultar. Se informa cuántos grupos y cuántos trabajadores se omitieron.
     */
    const buildSeg = (groups: Record<string, ScoredAssessment[]>) => {
        const workerCounts: Record<string, number> = {};
        for (const [key, items] of Object.entries(groups)) {
            workerCounts[key] = new Set(items.map(a => a.workerId)).size;
        }
        const { counts: kept, suppressedGroups, suppressedCount } = suppressSmallCounts(workerCounts);

        const result: Record<string, { count: number; riskDistribution: Record<string, number> }> = {};
        for (const key of Object.keys(kept)) {
            const items = groups[key];
            const d = emptyDist();
            items.forEach(a => { const c = a.scoredResult?.overallRiskCategory as keyof typeof d | undefined; if (c && c in d) d[c]++; });
            result[key] = { count: kept[key], riskDistribution: toPercent(d, items.length) };
        }
        return { segments: result, suppressedGroups, suppressedWorkers: suppressedCount };
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

    workers.forEach((w) => {
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

    // Las distribuciones sociodemográficas también se suprimen antes de salir
    // hacia el modelo: "una persona de estrato 1" identifica igual venga de
    // donde venga.
    const suppressedDists = {
        gender: toSuppressedPercentages(genderDist, totalWorkers),
        age: toSuppressedPercentages(ageDist, totalWorkers),
        jobLevel: toSuppressedPercentages(jobLevelDist, totalWorkers),
        tenure: toSuppressedPercentages(tenureDist, totalWorkers),
    };

    const byArea = buildSeg(areaGroups);
    const byJobTitle = buildSeg(cargoGroups);

    const suppression = {
        minGroupSize: MIN_GROUP_SIZE,
        byArea: { groups: byArea.suppressedGroups, workers: byArea.suppressedWorkers },
        byJobTitle: { groups: byJobTitle.suppressedGroups, workers: byJobTitle.suppressedWorkers },
        sociodemographic: Object.fromEntries(
            Object.entries(suppressedDists).map(([k, v]) => [
                k,
                { suppressed: v.suppressed, groups: v.suppressedGroups, workers: v.suppressedCount },
            ])
        ),
    };

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
                    byArea: byArea.segments,
                    byJobTitle: byJobTitle.segments,
                },
                correlation,
            },
            sociodemographic: {
                genderDistribution: suppressedDists.gender.distribution,
                ageDistribution: suppressedDists.age.distribution,
                jobLevelDistribution: suppressedDists.jobLevel.distribution,
                tenureDistribution: suppressedDists.tenure.distribution,
            },
        });

        return NextResponse.json({ report, suppression, generatedAt: new Date().toISOString() });
    } catch (err: unknown) {
        console.error("[AI DIAGNOSTIC] Error:", err);
        if (getErrorMessage(err)?.includes("OPENROUTER_API_KEY")) {
            return NextResponse.json({ error: "IA no configurada" }, { status: 503 });
        }
        return NextResponse.json({ error: "Error al generar el diagnóstico" }, { status: 500 });
    }
}
