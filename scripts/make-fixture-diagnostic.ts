/**
 * Genera el fixture del informe diagnóstico organizacional con dominios,
 * dimensiones y umbrales reales.
 *
 *   npx tsx scripts/make-fixture-diagnostic.ts [variante]
 *   variante: full (por defecto) | small — small deja todas las áreas por
 *   debajo del umbral de anonimato, para probar esa rama.
 */
import fs from "node:fs";
import path from "node:path";
import formA from "../src/config/battery/form-a-config.json";
import formB from "../src/config/battery/form-b-config.json";
import extraCfg from "../src/config/battery/extralaboral-config.json";
import stressCfg from "../src/config/battery/stress-config.json";
import baremos from "../src/config/battery/baremos.json";
import {
    DIMENSION_ACTION,
    DIMENSION_DEFINITION,
    DOMAIN_ACTION,
    DOMAIN_DEFINITION,
    RISK_LABEL,
    RISK_ORDER,
    type RiskLevel,
} from "../src/lib/reports/battery-content";

const small = (process.argv[2] ?? "full").toLowerCase() === "small";
const MIN_GROUP_SIZE = 10;

type Entry = Record<string, number[]>;
const toBounds = (e: Entry | undefined): number[] =>
    e?.muyAlto ? [e.sinRiesgo[1], e.bajo[1], e.medio[1], e.alto[1], e.muyAlto[1]] : [];

const levelFor = (s: number, b: number[]): RiskLevel => {
    if (b.length === 0) return "SIN_RIESGO";
    for (let i = 0; i < b.length; i++) if (s <= b[i]) return RISK_ORDER[i];
    return "MUY_ALTO";
};

const hash = (k: string) => {
    let h = 0;
    for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 1000;
    return h;
};
const scoreFor = (k: string, top: number) => Number((((hash(k) % 850) / 1000) * top).toFixed(1));
const pctFor = (k: string) => hash(k + "p") % 62;

const dist = (a: number[]) =>
    Object.fromEntries(RISK_ORDER.map((k, i) => [k, a[i]])) as Record<RiskLevel, number>;

const buildDomains = (form: "A" | "B", n: number) => {
    const cfg = form === "A" ? formA : formB;
    const table = (baremos as any)[form === "A" ? "intralaboral_a" : "intralaboral_b"];
    return (cfg.domains as any[]).map(dc => {
        const bounds = toBounds(table.domains[dc.key]);
        const avg = scoreFor(dc.key + form, bounds.length ? bounds[4] : 100);
        const level = levelFor(avg, bounds);
        return {
            key: dc.key,
            name: dc.name,
            definition: DOMAIN_DEFINITION[dc.key] ?? null,
            avg,
            level,
            bounds,
            count: n,
            action: level === "ALTO" || level === "MUY_ALTO" ? (DOMAIN_ACTION[dc.key] ?? null) : null,
        };
    });
};

// Población y cobertura primero: cada dimensión debe llevar el N de su propio
// instrumento, no un número fijo. Con un N único para las tres pruebas, un
// error de denominador en el informe real pasaría inadvertido en la revisión.
const allDimensions = [
    ...(formA.dimensions as any[]).map(d => ({ ...d, q: "Intralaboral", top: 100 })),
    ...(extraCfg.dimensions as any[]).map(d => ({ ...d, q: "Extralaboral", top: 100 })),
    ...(stressCfg.dimensions as any[]).map(d => ({ ...d, q: "Estrés", top: 100 })),
];



// Áreas por número de TRABAJADORES. Las evaluaciones se derivan de ahí: a cada
// persona se le aplican hasta tres cuestionarios, así que un área de 30 personas
// produce del orden de 80 evaluaciones. Mantener esa proporción en el fixture es
// lo que permite ver si el informe confunde las dos bases.
const areasRaw: [string, number][] = small
    ? [["Producción", 7], ["Administración", 4], ["Comercial", 3]]
    : [
          ["Producción", 62],
          ["Logística y almacén", 34],
          ["Administración", 25],
          ["Comercial", 18],
          ["Mantenimiento", 11],
          ["Dirección general", 6],
          ["Calidad", 4],
      ];

/** Evaluaciones de un área: cerca de tres por trabajador, sin ser exacto. */
const assessmentsFor = (workers: number, seed: string) =>
    workers * 2 + Math.round((workers * (60 + (hash(seed) % 40))) / 100);

const reported = areasRaw
    .filter(([, n]) => n >= MIN_GROUP_SIZE)
    .map(([name, workers]) => {
        const h = hash(name);
        const d = dist([
            h % 15,
            10 + (h % 12),
            15 + (h % 14),
            18 + (h % 16),
            8 + (h % 13),
        ]);
        return {
            name,
            workers,
            assessments: assessmentsFor(workers, name),
            dist: d,
            criticalPercent: d.ALTO + d.MUY_ALTO,
        };
    })
    .sort((a, b) => b.criticalPercent - a.criticalPercent);

const withheldList = areasRaw.filter(([, n]) => n < MIN_GROUP_SIZE);
const withheldWorkers = withheldList.reduce((s, [, n]) => s + n, 0);

const correlation = small
    ? RISK_ORDER.map(() => RISK_ORDER.map(() => 0))
    : [
          [6, 4, 3, 1, 0],
          [4, 9, 7, 4, 2],
          [3, 6, 12, 9, 5],
          [2, 5, 9, 15, 11],
          [1, 3, 6, 12, 14],
      ];
const correlationBase = correlation.flat().reduce((s, v) => s + v, 0);
const groups = { sanos: 0, vulnerables: 0, adaptados: 0, prioritarios: 0 };
correlation.forEach((row, i) =>
    row.forEach((v, j) => {
        const hi = i >= 3;
        const hs = j >= 3;
        if (hi && hs) groups.prioritarios += v;
        else if (!hi && hs) groups.vulnerables += v;
        else if (hi && !hs) groups.adaptados += v;
        else groups.sanos += v;
    })
);

// Una sola fuente de verdad para la población: la suma de las áreas. Si las
// cifras de cobertura se escriben aparte, el informe puede quedar diciendo que
// se evaluaron más trabajadores de los que suman sus propias áreas.
const totalWorkers = small ? 14 : areasRaw.reduce((s, [, n]) => s + n, 0);
// No todo el mundo responde los tres cuestionarios: el intralaboral se aplica a
// toda la población y los otros dos a una parte.
const intraCount = totalWorkers;
const extraCount = Math.round(totalWorkers * 0.8);
const stressCount = Math.round(totalWorkers * 0.78);
const totalAssessments = intraCount + extraCount + stressCount;

const counts = { SIN_RIESGO: 74, BAJO: 91, MEDIO: 103, ALTO: 87, MUY_ALTO: 58 };
const rawTotal = Object.values(counts).reduce((s, v) => s + v, 0);
// Se reescala la distribución al total real de evaluaciones.
for (const k of RISK_ORDER) counts[k] = Math.round((counts[k] / rawTotal) * totalAssessments);
const total = Object.values(counts).reduce((s, v) => s + v, 0);

// Un trabajador cuenta como crítico si cualquiera de sus instrumentos lo es, de
// modo que el porcentaje por persona es siempre mayor que el de evaluaciones.
const criticalAssessments = counts.ALTO + counts.MUY_ALTO;
const criticalWorkers = Math.min(totalWorkers, Math.round(criticalAssessments * 0.62));

// Reparto de la población intralaboral entre las dos formas del cuestionario.
const formACount = Math.round(intraCount * 0.45);
const formBCount = intraCount - formACount;

/** Trabajadores evaluados con cada instrumento. */
const nFor = (q: string) =>
    q === "Intralaboral" ? intraCount : q === "Extralaboral" ? extraCount : stressCount;

const dimensions = allDimensions
    .map(d => {
        const avg = scoreFor(d.key + d.q, d.top);
        const criticalPercent = pctFor(d.key + d.q);
        return {
            key: d.key,
            name: d.name,
            questionnaire: d.q,
            avg,
            criticalPercent,
            count: nFor(d.q),
            priority: Math.round(avg * 0.6 + criticalPercent * 0.4),
            action: criticalPercent > 0 ? (DIMENSION_ACTION[d.key] ?? null) : null,
        };
    })
    .sort((a, b) => b.priority - a.priority || b.avg - a.avg);
let predLevel: RiskLevel = "SIN_RIESGO";
for (const k of RISK_ORDER) if (counts[k] > counts[predLevel]) predLevel = k;
const highestLevel = [...RISK_ORDER].reverse().find(k => counts[k] > 0)!;

const seen = new Set<string>();
const glossary: { name: string; definition: string }[] = [];
for (const d of dimensions) {
    const def = DIMENSION_DEFINITION[d.key];
    if (def && !seen.has(d.key)) {
        seen.add(d.key);
        glossary.push({ name: d.name, definition: def });
    }
}

const data = {
    minGroupSize: MIN_GROUP_SIZE,
    glossary,
    org: {
        name: "MANUFACTURAS DEL PACÍFICO S.A.S.",
        nit: "901.234.567-8",
        city: "Cali",
        economicSector: "Industria manufacturera",
        dateStart: "12 de marzo de 2026",
        dateEnd: "28 de julio de 2026",
        today: "19 de agosto de 2026",
    },
    brand: {
        tradeName: "PsicoSST Consultoría",
        contactLine: "contacto@psicosst.co · +57 300 000 0000 · Cali",
        logoPath: null,
    },
    professional: {
        name: "William Reyes Valencia",
        license: "12345 de 2019",
        signaturePath: null,
    },
    coverage: {
        uniqueWorkers: totalWorkers,
        totalAssessments,
        intra: intraCount,
        extra: extraCount,
        stress: stressCount,
        unsigned: small ? 0 : 23,
        criticalPercent: Math.round((criticalAssessments / total) * 100),
        criticalWorkerPercent: Math.round((criticalWorkers / totalWorkers) * 100),
        criticalWorkers,
        predominant: {
            level: predLevel,
            label: RISK_LABEL[predLevel],
            percent: Math.round((counts[predLevel] / total) * 100),
        },
        highest: { level: highestLevel, label: RISK_LABEL[highestLevel], count: counts[highestLevel] },
    },
    distributions: {
        intra: dist([11, 17, 22, 29, 21]),
        extra: dist([19, 24, 26, 19, 12]),
        stress: dist([14, 21, 23, 27, 15]),
    },
    correlation,
    correlationBase,
    groups,
    domains: { formA: buildDomains("A", formACount), formB: buildDomains("B", formBCount) },
    dimensions,
    areas: {
        reported,
        withheld: {
            areas: withheldList.length,
            workers: withheldWorkers,
            assessments: withheldList.reduce((s, [, n]) => s + assessmentsFor(n, "w"), 0),
        },
    },
};

const out = path.join("typst", "fixtures", `diagnostic-${small ? "small" : "full"}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data, null, 2));
console.log(
    `${out} — ${dimensions.length} dimensiones, ${reported.length} áreas reportadas, ${withheldList.length} omitidas`
);
