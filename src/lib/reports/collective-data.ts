import { prisma } from "@/lib/prisma";
import { buildDiagnosticData, type DiagnosticData, type DiagnosticAssets } from "./diagnostic-data";
import { RISK_ORDER, type RiskLevel } from "./battery-content";
import { MODEL_DRAFTING, OPENROUTER_HEADERS, OPENROUTER_URL } from "@/lib/ai/models";

/**
 * Datos del informe colectivo, en sus dos variantes.
 *
 * El informe colectivo parte del mismo diagnóstico que el informe
 * organizacional y le añade tres capas que aquel no tiene: un índice de salud
 * psicosocial, el cruce de riesgo contra variables demográficas —para detectar
 * grupos que se desvían del promedio— y la vigencia del diagnóstico.
 *
 * La variante ejecutiva se dirige a la gerencia y prioriza decisiones; la
 * técnica se dirige al área de SST y prioriza el detalle por dominio.
 */

export type CollectiveVariant = "executive" | "technical";

export interface EpidemiologicalAlert {
    variable: string;
    group: string;
    workers: number;
    riskPercent: number;
    /** Puntos porcentuales por encima del promedio de la organización. */
    difference: number;
}

export interface CollectiveData extends DiagnosticData {
    variant: CollectiveVariant;
    variantLabel: string;
    /** Trabajadores sin ninguna evaluación en riesgo alto o muy alto, en porcentaje. */
    healthScore: number;
    alerts: EpidemiologicalAlert[];
    /** Grupos que no se analizaron por quedar bajo el umbral de anonimato. */
    alertsWithheld: number;
    validity: { years: number; expiresOn: string; reasons: string[] };
    narrative: string | null;
    actionPlan: {
        priority: string;
        action: string;
        responsible: string;
        time: string;
        impact: string;
    }[];
}

/**
 * Tamaño mínimo de un grupo demográfico para cruzarlo contra el riesgo.
 *
 * Es el mismo criterio de anonimato que rige las áreas, y además un mínimo
 * estadístico: con tres o cuatro personas un solo caso mueve el porcentaje
 * treinta puntos y la "alerta" no significa nada.
 */
const MIN_CROSSTAB_GROUP = 10;

/** Diferencia mínima, en puntos porcentuales, para levantar una alerta. */
const ALERT_THRESHOLD = 15;

const isCritical = (r: string | null | undefined) => r === "ALTO" || r === "MUY_ALTO";

function ageBucket(birthYear: number | null): string | null {
    if (!birthYear) return null;
    const age = new Date().getFullYear() - birthYear;
    if (age < 30) return "Menores de 30 años";
    if (age <= 45) return "De 30 a 45 años";
    return "Mayores de 45 años";
}

const JOB_LEVEL_LABEL: Record<string, string> = {
    JEFATURA: "Jefatura",
    PROFESIONAL: "Profesional",
    TECNICO: "Técnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo",
};

export async function buildCollectiveData(
    orgId: string,
    psychologistId: string,
    isAdmin: boolean,
    variant: CollectiveVariant
): Promise<{ data: CollectiveData; assets: DiagnosticAssets } | null> {
    const base = await buildDiagnosticData(orgId, psychologistId, isAdmin);
    if (!base) return null;

    // Sólo los trabajadores con al menos una evaluación calificada. Contar toda
    // la planta diluiría el índice de salud con gente que nunca fue evaluada.
    const workers = await prisma.worker.findMany({
        where: {
            organizationId: orgId,
            assessments: {
                some: {
                    status: { in: ["COMPLETED", "SCORED", "SIGNED", "REVIEWED"] },
                    scoredResult: { isNot: null },
                },
            },
        },
        select: {
            gender: true,
            jobLevel: true,
            birthYear: true,
            assessments: {
                where: {
                    status: { in: ["COMPLETED", "SCORED", "SIGNED", "REVIEWED"] },
                    scoredResult: { isNot: null },
                },
                select: { scoredResult: { select: { overallRiskCategory: true } } },
            },
        },
    });

    const total = workers.length;
    let criticalWorkers = 0;

    type Bucket = { total: number; critical: number };
    const crosstabs: Record<string, Record<string, Bucket>> = {
        Sexo: {},
        "Nivel del cargo": {},
        Edad: {},
    };

    const add = (variable: string, group: string | null, critical: boolean) => {
        if (!group) return;
        const b = (crosstabs[variable][group] ??= { total: 0, critical: 0 });
        b.total++;
        if (critical) b.critical++;
    };

    for (const w of workers) {
        const critical = w.assessments.some(a => isCritical(a.scoredResult?.overallRiskCategory));
        if (critical) criticalWorkers++;
        add("Sexo", w.gender?.trim() || null, critical);
        add("Nivel del cargo", JOB_LEVEL_LABEL[w.jobLevel] ?? null, critical);
        add("Edad", ageBucket(w.birthYear), critical);
    }

    const healthScore = total > 0 ? Math.round(((total - criticalWorkers) / total) * 100) : 100;
    const globalCriticalPct = total > 0 ? (criticalWorkers / total) * 100 : 0;

    const alerts: EpidemiologicalAlert[] = [];
    let alertsWithheld = 0;

    for (const [variable, groups] of Object.entries(crosstabs)) {
        const eligible = Object.entries(groups).filter(([, b]) => b.total >= MIN_CROSSTAB_GROUP);
        alertsWithheld += Object.keys(groups).length - eligible.length;
        // Con un solo grupo elegible no hay comparación posible: ese grupo es
        // prácticamente toda la organización y su desviación no dice nada.
        if (eligible.length < 2) continue;

        for (const [group, b] of eligible) {
            const pct = (b.critical / b.total) * 100;
            const diff = pct - globalCriticalPct;
            if (diff >= ALERT_THRESHOLD) {
                alerts.push({
                    variable,
                    group,
                    workers: b.total,
                    riskPercent: Math.round(pct),
                    difference: Math.round(diff),
                });
            }
        }
    }
    alerts.sort((a, b) => b.difference - a.difference);

    // ── vigencia ──────────────────────────────────────────
    // La Resolución 2764 de 2022 fija dos años como periodicidad ordinaria de
    // la evaluación y la reduce a uno cuando el diagnóstico muestra condiciones
    // críticas. Se registra el motivo para que el lector sepa por qué.
    const reasons: string[] = [];
    if (base.data.coverage.criticalWorkerPercent >= 20) {
        reasons.push(
            `el ${base.data.coverage.criticalWorkerPercent}% de los trabajadores presenta riesgo alto o muy alto`
        );
    }
    const saturatedArea = base.data.areas.reported.find(a => a.criticalPercent >= 100);
    if (saturatedArea) {
        reasons.push(`el área de ${saturatedArea.name} está íntegramente en riesgo crítico`);
    }
    const saturatedDomain = [...base.data.domains.formA, ...base.data.domains.formB].find(
        d => d.level === "MUY_ALTO"
    );
    if (saturatedDomain) {
        reasons.push(`el dominio ${saturatedDomain.name} promedia un nivel muy alto`);
    }

    const years = reasons.length > 0 ? 1 : 2;
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + years);

    // ── capa de IA ────────────────────────────────────────
    const ai = await generateNarrative(base.data, healthScore, alerts);

    return {
        data: {
            ...base.data,
            variant,
            variantLabel: variant === "technical" ? "Informe técnico" : "Informe ejecutivo",
            healthScore,
            alerts,
            alertsWithheld,
            validity: {
                years,
                expiresOn: expires.toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
                reasons,
            },
            narrative: ai.narrative,
            actionPlan: ai.actionPlan,
        },
        assets: base.assets,
    };
}

interface AiResult {
    narrative: string | null;
    actionPlan: CollectiveData["actionPlan"];
}

/**
 * Redacta la lectura consultiva y el plan de acción.
 *
 * Si no hay clave configurada, o el modelo falla, el informe se genera sin esta
 * capa en vez de inventarse un texto: antes se devolvía un párrafo fijo que
 * hablaba de "demandas psicológicas" y de una organización con condiciones
 * favorables, sin haber mirado los datos, y se imprimía como si fuera análisis.
 */
async function generateNarrative(
    d: DiagnosticData,
    healthScore: number,
    alerts: EpidemiologicalAlert[]
): Promise<AiResult> {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
        console.warn("[IA] OPENROUTER_API_KEY no está configurada; se omite la lectura consultiva.");
        return { narrative: null, actionPlan: [] };
    }

    const topDimensions = d.dimensions
        .filter(x => x.criticalPercent >= 20)
        .slice(0, 8)
        .map(x => `${x.name} (${x.questionnaire}): ${x.criticalPercent}% en riesgo crítico`);

    // Para cada dimensión crítica, si su cruce por área muestra una brecha
    // grande entre la peor y la mejor área, es un dato más persuasivo que el
    // promedio general: dice si conviene una intervención localizada o una de
    // toda la organización. Sólo se reporta cuando la brecha es amplia (≥25
    // puntos), para no saturar el prompt con ruido cuando el riesgo está
    // parejo en todas las áreas.
    const areaConcentration = d.areaDimensionMatrix.dimensions
        .map((dim, j) => {
            const values = d.areaDimensionMatrix.cells
                .map((row, i) => ({ area: d.areaDimensionMatrix.areas[i], pct: row[j].criticalPercent }))
                .filter(v => v.pct > 0 || d.areaDimensionMatrix.cells.length > 0);
            if (values.length < 2) return null;
            const max = values.reduce((a, b) => (b.pct > a.pct ? b : a));
            const min = values.reduce((a, b) => (b.pct < a.pct ? b : a));
            if (max.pct - min.pct < 25) return null;
            return `${dim.name} se concentra en ${max.area} (${max.pct}%) frente al resto (mínimo ${min.pct}% en ${min.area})`;
        })
        .filter((x): x is string => x !== null)
        .slice(0, 3);

    const prompt = `Eres un consultor senior en riesgo psicosocial y salud ocupacional en Colombia.

Datos de la organización ${d.org.name}:
- Trabajadores evaluados: ${d.coverage.uniqueWorkers}
- Trabajadores en riesgo alto o muy alto: ${d.coverage.criticalWorkers} (${d.coverage.criticalWorkerPercent}%)
- Índice de salud psicosocial: ${healthScore}/100
- Dimensiones críticas: ${topDimensions.length ? topDimensions.join("; ") : "ninguna supera el 20%"}
- Concentración por área de las dimensiones críticas: ${areaConcentration.length ? areaConcentration.join("; ") : "sin concentraciones marcadas por área"}
- Grupo de prioridad de intervención (riesgo y sintomatología simultáneos): ${d.groups.prioritarios} trabajadores
- Alertas por subgrupo: ${alerts.length ? alerts.map(a => `${a.group} (${a.variable}): ${a.riskPercent}%`).join("; ") : "ninguna"}

No menciones cifras de cuántas evaluaciones o pruebas se aplicaron, ni fechas
o periodos de aplicación: este informe no expone esos datos.

Responde únicamente con un objeto JSON:
{
  "narrative": "Un párrafo de máximo 130 palabras interpretando la situación y sus implicaciones para la gestión. Céntrate en qué decidir, no en repetir porcentajes. No inventes datos que no estén arriba.",
  "actionPlan": [
    { "priority": "Alta|Media|Baja", "action": "acción concreta", "responsible": "área responsable", "time": "plazo", "impact": "Alto|Medio|Bajo" }
  ]
}
Incluye entre 3 y 5 acciones, derivadas de los hallazgos anteriores.`;

    try {
        const res = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
                ...OPENROUTER_HEADERS,
            },
            body: JSON.stringify({
                model: MODEL_DRAFTING,
                messages: [{ role: "user", content: prompt }],
            }),
            signal: AbortSignal.timeout(25_000),
        });
        if (!res.ok) {
            // Sin este registro el informe salía sin la sección y sin decir por
            // qué, de modo que una clave revocada o un modelo retirado eran
            // indistinguibles de "la IA está desactivada".
            console.error(
                `[IA] OpenRouter respondió ${res.status} para el modelo ${MODEL_DRAFTING}:`,
                (await res.text()).slice(0, 300)
            );
            return { narrative: null, actionPlan: [] };
        }

        const body = await res.json();
        const content: string = body?.choices?.[0]?.message?.content ?? "";
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) return { narrative: null, actionPlan: [] };

        const parsed = JSON.parse(match[0]) as {
            narrative?: unknown;
            actionPlan?: unknown;
        };

        const narrative = typeof parsed.narrative === "string" ? parsed.narrative.trim() : null;
        const actionPlan = Array.isArray(parsed.actionPlan)
            ? parsed.actionPlan
                  .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
                  .map(r => ({
                      priority: String(r.priority ?? "Media"),
                      action: String(r.action ?? "").trim(),
                      responsible: String(r.responsible ?? "Por definir"),
                      time: String(r.time ?? "Por definir"),
                      impact: String(r.impact ?? "Medio"),
                  }))
                  .filter(r => r.action !== "")
                  .slice(0, 6)
            : [];

        return { narrative: narrative || null, actionPlan };
    } catch (error) {
        console.error("[IA] Falló la lectura consultiva:", error);
        return { narrative: null, actionPlan: [] };
    }
}

/** Nivel de riesgo con más trabajadores, para el titular del informe. */
export function dominantLevel(dist: Record<string, number>): RiskLevel {
    let best: RiskLevel = "SIN_RIESGO";
    for (const k of RISK_ORDER) if ((dist[k] ?? 0) > (dist[best] ?? 0)) best = k;
    return best;
}
