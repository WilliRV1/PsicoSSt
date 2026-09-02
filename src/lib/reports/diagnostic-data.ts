import { prisma } from "@/lib/prisma";
import { getBaremos } from "@/config/battery";
import { loadImage, type ReportImage } from "./images";
import {
    DIMENSION_ACTION,
    DIMENSION_DEFINITION,
    DOMAIN_ACTION,
    DOMAIN_DEFINITION,
    RISK_LABEL,
    RISK_ORDER,
    type RiskLevel,
} from "./battery-content";

/**
 * Datos del informe diagnóstico organizacional.
 *
 * Antes se calculaban dentro del componente de página y se serializaban enteros
 * al navegador para que react-pdf armara allí el documento. Aquí se calculan en
 * el servidor y sólo viaja el PDF.
 */

/**
 * Número mínimo de TRABAJADORES para reportar un grupo por separado.
 *
 * El informe siempre declaró que garantizaba el anonimato en grupos menores a
 * diez personas, pero el cálculo incluía toda área con al menos una evaluación:
 * un área de un solo trabajador aparecía con su nombre y su distribución de
 * riesgo, que es exactamente el resultado individual de esa persona.
 *
 * El umbral se cuenta sobre trabajadores distintos, no sobre evaluaciones. A
 * cada persona se le aplican hasta tres cuestionarios, de modo que contar
 * evaluaciones dejaría pasar un área de cuatro personas —doce evaluaciones— y
 * el piso quedaría desfasado por un factor de tres.
 */
export const MIN_GROUP_SIZE = 10;

export type Distribution = Record<RiskLevel, number>;

export interface AreaRow {
    name: string;
    /** Trabajadores distintos del área. Es la cifra que rige el anonimato. */
    workers: number;
    /** Evaluaciones aplicadas en el área, sobre las que se calcula la distribución. */
    assessments: number;
    dist: Distribution;
    criticalPercent: number;
}

export interface DomainRow {
    key: string;
    name: string;
    definition: string | null;
    avg: number;
    level: RiskLevel;
    bounds: number[];
    count: number;
    action: string | null;
}

export interface DimensionRow {
    key: string;
    name: string;
    questionnaire: string;
    avg: number;
    criticalPercent: number;
    count: number;
    /** Prioridad = 0.6 × puntaje medio + 0.4 × porcentaje en riesgo crítico. */
    priority: number;
    action: string | null;
}

/**
 * Nivel de riesgo psicosocial intralaboral de la empresa, por forma.
 *
 * Es el cálculo que exige el parágrafo del artículo 3 de la Resolución 2764 de
 * 2022: promediar el puntaje BRUTO total de los trabajadores, transformar ese
 * promedio y buscarlo en los baremos, por separado para la forma A y la forma
 * B. De él depende la periodicidad de la evaluación —anual si alguna de las dos
 * da alto o muy alto, bienal en los demás casos—, y no de ninguna proporción de
 * trabajadores en riesgo.
 */
export interface CompanyRiskLevel {
    form: "A" | "B";
    workers: number;
    /** Promedio del puntaje bruto total. */
    rawAverage: number;
    transformed: number;
    level: RiskLevel;
    levelLabel: string;
}

export interface DiagnosticData {
    /** Umbral de anonimato, para que el documento cite el mismo número que aplica. */
    minGroupSize: number;
    glossary: { name: string; definition: string }[];
    org: {
        name: string;
        nit: string;
        city: string | null;
        economicSector: string | null;
        dateStart: string;
        dateEnd: string;
        today: string;
    };
    brand: { tradeName: string | null; contactLine: string | null; logoPath: string | null };
    professional: { name: string; license: string; signaturePath: string | null };
    coverage: {
        uniqueWorkers: number;
        totalAssessments: number;
        intra: number;
        extra: number;
        stress: number;
        /** Evaluaciones incluidas que aún no están firmadas. */
        unsigned: number;
        /** Evaluaciones sin el mínimo de ítems: no tienen nivel de riesgo. */
        invalid: number;
        /** Porcentaje de EVALUACIONES en riesgo alto o muy alto. */
        criticalPercent: number;
        /**
         * Porcentaje de TRABAJADORES con al menos un instrumento en riesgo alto
         * o muy alto. Es la cifra que se contrasta contra el umbral del 20%.
         */
        criticalWorkerPercent: number;
        criticalWorkers: number;
        /** Nivel más frecuente. */
        predominant: { level: RiskLevel; label: string; percent: number } | null;
        /** Nivel más severo con al menos un caso. */
        highest: { level: RiskLevel; label: string; count: number } | null;
    };
    distributions: { intra: Distribution; extra: Distribution; stress: Distribution };
    /** Matriz 5×5: filas = riesgo intralaboral, columnas = nivel de estrés. */
    correlation: number[][];
    /** Trabajadores con intralaboral y estrés calificados, base de la matriz. */
    correlationBase: number;
    /** Artículo 3 de la Resolución 2764: nivel de riesgo de la empresa. */
    companyRisk: {
        byForm: CompanyRiskLevel[];
        /** La evaluación es anual si alguna forma da alto o muy alto. */
        annualRequired: boolean;
    };
    groups: { sanos: number; vulnerables: number; adaptados: number; prioritarios: number };
    domains: { formA: DomainRow[]; formB: DomainRow[] };
    dimensions: DimensionRow[];
    areas: {
        reported: AreaRow[];
        /** Áreas agregadas por quedar bajo el umbral de anonimato. */
        withheld: { areas: number; workers: number; assessments: number };
    };
    /**
     * Cruce de las áreas reportadas (ya filtradas por anonimato) contra las
     * dimensiones de mayor prioridad de la organización. Señala si una
     * dimensión crítica en general se concentra en un área puntual o se
     * repite en todas — el dato que de verdad orienta dónde intervenir
     * primero, más allá del ranking de "Resultados por área" o de
     * "Priorización de dimensiones" por separado.
     */
    areaDimensionMatrix: {
        areas: string[];
        dimensions: { key: string; name: string }[];
        /** [índice de área][índice de dimensión]. */
        cells: { criticalPercent: number; avg: number; count: number }[][];
    };
}

export interface DiagnosticAssets {
    logo: ReportImage | null;
    signature: ReportImage | null;
}

const emptyDist = (): Distribution => ({
    SIN_RIESGO: 0,
    BAJO: 0,
    MEDIO: 0,
    ALTO: 0,
    MUY_ALTO: 0,
});

const isCritical = (r: string | null | undefined) => r === "ALTO" || r === "MUY_ALTO";

const fmtDate = (t: number) =>
    new Date(t).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

function asLevel(v: unknown): RiskLevel | null {
    return RISK_ORDER.includes(v as RiskLevel) ? (v as RiskLevel) : null;
}

/** Distribución porcentual de los resultados globales de un conjunto. */
function distributionOf(risks: (string | null | undefined)[]): Distribution {
    const counts = emptyDist();
    let total = 0;
    for (const r of risks) {
        const l = asLevel(r);
        if (l) {
            counts[l]++;
            total++;
        }
    }
    if (total === 0) return counts;
    const dist = emptyDist();
    for (const k of RISK_ORDER) dist[k] = Math.round((counts[k] / total) * 100);
    return dist;
}

function toBounds(entry: Record<string, number[]> | undefined): number[] {
    if (!entry?.muyAlto) return [];
    return [
        entry.sinRiesgo?.[1] ?? 20,
        entry.bajo?.[1] ?? 40,
        entry.medio?.[1] ?? 60,
        entry.alto?.[1] ?? 80,
        entry.muyAlto?.[1] ?? 100,
    ];
}

function levelFor(score: number, bounds: number[]): RiskLevel {
    if (bounds.length === 0) return "SIN_RIESGO";
    for (let i = 0; i < bounds.length; i++) if (score <= bounds[i]) return RISK_ORDER[i];
    return "MUY_ALTO";
}

interface StoredScore {
    dimensionKey?: string;
    dimensionName?: string;
    domainKey?: string;
    domainName?: string;
    transformedScore?: number;
    riskCategory?: string;
}

export async function buildDiagnosticData(
    orgId: string,
    psychologistId: string,
    isAdmin: boolean
): Promise<{ data: DiagnosticData; assets: DiagnosticAssets } | null> {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            psychologist: {
                include: {
                    settings: true,
                    signatures: { orderBy: { uploadedAt: "desc" } },
                },
            },
        },
    });

    if (!org) return null;
    if (org.createdByPsychologist !== psychologistId && !isAdmin) return null;

    const assessments = await prisma.assessment.findMany({
        where: {
            organizationId: orgId,
            status: { in: ["COMPLETED", "SCORED", "SIGNED", "REVIEWED"] },
            scoredResult: { isNot: null },
        },
        include: {
            worker: { select: { departmentArea: true } },
            scoredResult: true,
        },
    });

    if (assessments.length === 0) return null;

    const byType = (t: string) => assessments.filter(a => a.questionnaireType === t);
    const intra = byType("INTRALABORAL");
    const extra = byType("EXTRALABORAL");
    const stress = byType("STRESS");

    const risksOf = (list: typeof assessments) =>
        list.map(a => a.scoredResult?.overallRiskCategory as string | undefined);

    // ── cobertura ─────────────────────────────────────────
    // Las evaluaciones inválidas no tienen nivel de riesgo, así que quedan
    // fuera del numerador y del denominador de todo porcentaje. Se cuentan
    // aparte para que el informe pueda declararlas.
    const invalidCount = assessments.filter(
        a => a.scoredResult?.overallRiskCategory === "INVALIDO"
    ).length;
    const allRisks = (risksOf(assessments).filter(Boolean) as string[]).filter(
        r => r !== "INVALIDO"
    );
    const criticalPercent = allRisks.length
        ? Math.round((allRisks.filter(isCritical).length / allRisks.length) * 100)
        : 0;

    // El porcentaje sobre evaluaciones no sirve para decidir la obligación de
    // montar un sistema de vigilancia: a cada trabajador se le aplican hasta
    // tres cuestionarios, así que quien tiene los tres pesa el triple que quien
    // sólo tiene el intralaboral, y el umbral del 20% de la Resolución 2764 se
    // refiere a personas expuestas. Un trabajador cuenta como crítico si
    // cualquiera de sus instrumentos quedó en riesgo alto o muy alto.
    const workerIds = new Set(assessments.map(a => a.workerId));
    const criticalWorkerIds = new Set(
        assessments.filter(a => isCritical(a.scoredResult?.overallRiskCategory)).map(a => a.workerId)
    );
    // Trabajadores con al menos un resultado válido: son la base contra la que
    // tiene sentido medir la proporción en riesgo.
    const scoredWorkerIds = new Set(
        assessments
            .filter(a => asLevel(a.scoredResult?.overallRiskCategory) !== null)
            .map(a => a.workerId)
    );
    const criticalWorkerPercent = scoredWorkerIds.size
        ? Math.round((criticalWorkerIds.size / scoredWorkerIds.size) * 100)
        : 0;

    const counts = emptyDist();
    for (const r of allRisks) {
        const l = asLevel(r);
        if (l) counts[l]++;
    }

    // El campo anterior se llamaba "riesgo predominante" pero devolvía el nivel
    // más severo con al menos un caso, de modo que un único MUY_ALTO entre
    // quinientos sin riesgo se reportaba como predominante. Son dos lecturas
    // distintas y ambas útiles, así que ahora se calculan por separado.
    let predominant: DiagnosticData["coverage"]["predominant"] = null;
    let best = 0;
    for (const k of RISK_ORDER) {
        if (counts[k] > best) {
            best = counts[k];
            predominant = {
                level: k,
                label: RISK_LABEL[k],
                percent: Math.round((counts[k] / allRisks.length) * 100),
            };
        }
    }
    const highestLevel = [...RISK_ORDER].reverse().find(k => counts[k] > 0) ?? null;
    const highest = highestLevel
        ? { level: highestLevel, label: RISK_LABEL[highestLevel], count: counts[highestLevel] }
        : null;

    // ── matriz intralaboral × estrés ──────────────────────
    const perWorker: Record<string, { intra?: RiskLevel; stress?: RiskLevel }> = {};
    for (const a of assessments) {
        const l = asLevel(a.scoredResult?.overallRiskCategory);
        if (!l) continue;
        const w = (perWorker[a.workerId] ??= {});
        if (a.questionnaireType === "INTRALABORAL") w.intra = l;
        if (a.questionnaireType === "STRESS") w.stress = l;
    }

    const correlation = RISK_ORDER.map(() => RISK_ORDER.map(() => 0));
    let correlationBase = 0;
    const groups = { sanos: 0, vulnerables: 0, adaptados: 0, prioritarios: 0 };

    for (const w of Object.values(perWorker)) {
        if (!w.intra || !w.stress) continue;
        correlation[RISK_ORDER.indexOf(w.intra)][RISK_ORDER.indexOf(w.stress)]++;
        correlationBase++;
        const hiIntra = isCritical(w.intra);
        const hiStress = isCritical(w.stress);
        if (hiIntra && hiStress) groups.prioritarios++;
        else if (!hiIntra && hiStress) groups.vulnerables++;
        else if (hiIntra && !hiStress) groups.adaptados++;
        else groups.sanos++;
    }

    // ── nivel de riesgo de la empresa (Res. 2764, art. 3) ──
    const companyByForm: CompanyRiskLevel[] = [];
    for (const form of ["A", "B"] as const) {
        const propias = intra.filter(a => a.formType === form);
        // Sólo cuentan los cuestionarios que sí pudieron calificarse.
        const brutos = propias
            .filter(a => asLevel(a.scoredResult?.overallRiskCategory) !== null)
            .map(a => (a.scoredResult?.totalScores as { rawScore?: number } | null)?.rawScore ?? 0);
        if (brutos.length === 0) continue;

        const rawAverage = brutos.reduce((x, y) => x + y, 0) / brutos.length;
        const factor = form === "A" ? 492 : 388;
        const transformed = Math.round((rawAverage / factor) * 100 * 10) / 10;
        const bounds = toBounds(
            (getBaremos() as unknown as Record<string, { total?: Record<string, number[]> }>)[
                form === "A" ? "intralaboral_a" : "intralaboral_b"
            ]?.total
        );
        const level = levelFor(transformed, bounds);
        companyByForm.push({
            form,
            workers: brutos.length,
            rawAverage: Math.round(rawAverage * 10) / 10,
            transformed,
            level,
            levelLabel: RISK_LABEL[level],
        });
    }

    // ── dominios ──────────────────────────────────────────
    const baremos = getBaremos() as unknown as Record<
        string,
        { domains?: Record<string, Record<string, number[]>> }
    >;

    const domAcc: Record<"A" | "B", Record<string, { sum: number; n: number; name: string }>> = {
        A: {},
        B: {},
    };

    // ── dimensiones ───────────────────────────────────────
    const dimAcc: Record<
        string,
        { key: string; name: string; questionnaire: string; scores: number[]; risks: string[] }
    > = {};

    const qLabel = (t: string) =>
        t === "INTRALABORAL" ? "Intralaboral" : t === "EXTRALABORAL" ? "Extralaboral" : "Estrés";

    for (const a of assessments) {
        const sr = a.scoredResult;
        if (!sr) continue;

        const dims = (sr.dimensionScores ?? {}) as Record<string, StoredScore>;
        for (const [k, d] of Object.entries(dims)) {
            const key = d.dimensionKey ?? k;
            const acc = (dimAcc[`${key}__${a.questionnaireType}`] ??= {
                key,
                name: d.dimensionName ?? key,
                questionnaire: qLabel(a.questionnaireType),
                scores: [],
                risks: [],
            });
            if (typeof d.transformedScore === "number") acc.scores.push(d.transformedScore);
            if (d.riskCategory) acc.risks.push(d.riskCategory);
        }

        if (a.questionnaireType !== "INTRALABORAL") continue;
        const doms = (sr.domainScores ?? {}) as Record<string, StoredScore>;
        for (const [k, d] of Object.entries(doms)) {
            const key = d.domainKey ?? k;
            const form = a.formType === "A" ? "A" : "B";
            const acc = (domAcc[form][key] ??= { sum: 0, n: 0, name: d.domainName ?? key });
            acc.sum += d.transformedScore ?? 0;
            acc.n++;
        }
    }

    // El emparejamiento anterior buscaba la clave del baremo comparando la
    // primera palabra del nombre visible del dominio. Aquí se usa la clave que
    // el motor de calificación ya guardó, que es la misma del baremo.
    const buildDomains = (form: "A" | "B"): DomainRow[] =>
        Object.entries(domAcc[form]).map(([key, v]) => {
            const bounds = toBounds(
                baremos[form === "A" ? "intralaboral_a" : "intralaboral_b"]?.domains?.[key]
            );
            const avg = Number((v.sum / v.n).toFixed(1));
            const level = levelFor(avg, bounds);
            return {
                key,
                name: v.name,
                definition: DOMAIN_DEFINITION[key] ?? null,
                avg,
                level,
                bounds,
                count: v.n,
                action: isCritical(level) ? (DOMAIN_ACTION[key] ?? null) : null,
            };
        });

    const dimensions: DimensionRow[] = Object.values(dimAcc)
        .map(d => {
            const avg = d.scores.length ? d.scores.reduce((s, v) => s + v, 0) / d.scores.length : 0;
            const criticalPct = d.risks.length
                ? Math.round((d.risks.filter(isCritical).length / d.risks.length) * 100)
                : 0;
            return {
                key: d.key,
                name: d.name,
                questionnaire: d.questionnaire,
                avg: Number(avg.toFixed(1)),
                criticalPercent: criticalPct,
                count: d.scores.length,
                priority: Math.round(avg * 0.6 + criticalPct * 0.4),
                // Indexado por clave: el mapa de acciones está escrito con
                // nombres visibles que no coinciden con los de los archivos de
                // configuración, y emparejar por nombre falla en silencio.
                action: criticalPct > 0 ? (DIMENSION_ACTION[d.key] ?? null) : null,
            };
        })
        .sort((a, b) => b.priority - a.priority || b.avg - a.avg);

    // ── áreas, con piso de anonimato ──────────────────────
    const areaGroups: Record<string, typeof assessments> = {};
    for (const a of assessments) {
        const name = a.worker.departmentArea?.trim() || "Sin área asignada";
        (areaGroups[name] ??= []).push(a);
    }

    const reported: AreaRow[] = [];
    let withheldAreas = 0;
    let withheldAssessments = 0;

    let withheldWorkers = 0;

    for (const [name, list] of Object.entries(areaGroups)) {
        const workers = new Set(list.map(a => a.workerId)).size;
        if (workers < MIN_GROUP_SIZE) {
            withheldAreas++;
            withheldWorkers += workers;
            withheldAssessments += list.length;
            continue;
        }
        const dist = distributionOf(risksOf(list));
        reported.push({
            name,
            workers,
            assessments: list.length,
            dist,
            criticalPercent: dist.ALTO + dist.MUY_ALTO,
        });
    }
    reported.sort((a, b) => b.criticalPercent - a.criticalPercent || b.workers - a.workers);

    // ── cruce área × dimensión ─────────────────────────────
    // Sólo sobre las áreas que ya pasaron el piso de anonimato (`reported`) y
    // las dimensiones de mayor prioridad de la organización: cruzar TODAS las
    // dimensiones contra TODAS las áreas produciría una tabla ilegible, y el
    // interés real está en dónde se concentra lo que ya se identificó como
    // crítico, no en el detalle completo.
    const TOP_DIMENSIONS_FOR_CROSSTAB = 6;
    const topDimensionKeys = dimensions
        .slice(0, TOP_DIMENSIONS_FOR_CROSSTAB)
        .map(d => d.key);

    const areaDimAcc: Record<string, Record<string, { critical: number; sum: number; n: number }>> = {};
    for (const [areaName, list] of Object.entries(areaGroups)) {
        for (const a of list) {
            const sr = a.scoredResult;
            if (!sr) continue;
            const dims = (sr.dimensionScores ?? {}) as Record<string, StoredScore>;
            for (const [k, d] of Object.entries(dims)) {
                const key = d.dimensionKey ?? k;
                if (!topDimensionKeys.includes(key)) continue;
                if (!d.riskCategory) continue;
                const areaBucket = (areaDimAcc[areaName] ??= {});
                const cell = (areaBucket[key] ??= { critical: 0, sum: 0, n: 0 });
                cell.n++;
                if (isCritical(d.riskCategory)) cell.critical++;
                if (typeof d.transformedScore === "number") cell.sum += d.transformedScore;
            }
        }
    }

    const areaDimensionMatrix = {
        areas: reported.map(a => a.name),
        dimensions: topDimensionKeys.map(key => ({
            key,
            name: dimensions.find(d => d.key === key)?.name ?? key,
        })),
        cells: reported.map(a =>
            topDimensionKeys.map(key => {
                const cell = areaDimAcc[a.name]?.[key];
                return {
                    criticalPercent: cell && cell.n > 0 ? Math.round((cell.critical / cell.n) * 100) : 0,
                    avg: cell && cell.n > 0 ? Number((cell.sum / cell.n).toFixed(1)) : 0,
                    count: cell?.n ?? 0,
                };
            })
        ),
    };

    // ── marca y firma ─────────────────────────────────────
    const settings = org.psychologist.settings;
    const sig =
        org.psychologist.signatures.find(s => s.signatureType === "drawn") ??
        org.psychologist.signatures.find(s => s.signatureType === "uploaded");

    const [logo, signature] = await Promise.all([
        loadImage(settings?.logoUrl),
        loadImage(sig?.dataUrl ?? sig?.imageUrl ?? org.psychologist.signature),
    ]);

    const dates = assessments.map(a => new Date(a.assessmentDate).getTime());
    const contactBits = [settings?.email, settings?.phone, settings?.city].filter(Boolean);

    const glossary = glossaryFor(dimensions);

    return {
        data: {
            minGroupSize: MIN_GROUP_SIZE,
            glossary,
            org: {
                name: org.name,
                nit: org.nit,
                city: org.city,
                economicSector: org.economicSector,
                dateStart: fmtDate(Math.min(...dates)),
                dateEnd: fmtDate(Math.max(...dates)),
                today: fmtDate(Date.now()),
            },
            brand: {
                tradeName: settings?.tradeName ?? settings?.consultingRoomName ?? null,
                contactLine: contactBits.length ? contactBits.join(" · ") : null,
                logoPath: logo ? `/assets/logo.${logo.ext}` : null,
            },
            professional: {
                name: org.psychologist.fullName,
                license: org.psychologist.licenseNumber,
                signaturePath: signature ? `/assets/signature.${signature.ext}` : null,
            },
            coverage: {
                uniqueWorkers: workerIds.size,
                totalAssessments: assessments.length,
                intra: intra.length,
                extra: extra.length,
                stress: stress.length,
                unsigned: assessments.filter(a => a.status !== "SIGNED").length,
                invalid: invalidCount,
                criticalPercent,
                criticalWorkerPercent,
                criticalWorkers: criticalWorkerIds.size,
                predominant,
                highest,
            },
            distributions: {
                intra: distributionOf(risksOf(intra)),
                extra: distributionOf(risksOf(extra)),
                stress: distributionOf(risksOf(stress)),
            },
            correlation,
            correlationBase,
            companyRisk: {
                byForm: companyByForm,
                annualRequired: companyByForm.some(f => isCritical(f.level)),
            },
            groups,
            domains: { formA: buildDomains("A"), formB: buildDomains("B") },
            dimensions,
            areas: {
                reported,
                withheld: {
                    areas: withheldAreas,
                    workers: withheldWorkers,
                    assessments: withheldAssessments,
                },
            },
            areaDimensionMatrix,
        },
        assets: { logo, signature },
    };
}

/** Definiciones de las dimensiones que aparecen en el informe, para el anexo. */
export function glossaryFor(dimensions: DimensionRow[]): { name: string; definition: string }[] {
    const seen = new Set<string>();
    const out: { name: string; definition: string }[] = [];
    for (const d of dimensions) {
        const def = DIMENSION_DEFINITION[d.key];
        if (!def || seen.has(d.key)) continue;
        seen.add(d.key);
        out.push({ name: d.name, definition: def });
    }
    return out;
}
