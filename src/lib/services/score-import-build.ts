import Papa from "papaparse";
import { baremos } from "@/config/battery";
import { getInstrument, type InstrumentDef } from "@/config/instruments";
import { calculateDomainScore, getRiskLevel, lookupRiskCategory } from "@/lib/scoring";
import type {
    BaremoThreshold,
    DimensionScore,
    DomainScore,
    FormType,
    QuestionnaireType,
    RiskCategory,
    ScoredResultData,
    TotalScore,
} from "@/types/battery";

/**
 * Parte pura de la importación de resultados calificados: la plantilla CSV y
 * la reconstrucción del resultado a partir de puntajes transformados. Sin
 * acceso a base de datos, para poder probarla en aislamiento.
 */

export const FIXED_COLUMNS = ["documentId", "instrument", "formType", "assessmentDate"] as const;

/** Dimensiones que una pregunta de control puede dejar sin responder (forma A / atención a clientes). */
const CONTROL_FILTERED = new Set(["relacion_colaboradores", "demandas_emocionales"]);

export function round1(v: number): number {
    return Math.round(v * 10) / 10;
}

/** Puntaje transformado 0-100 desde la celda; vacío = null. Lanza si no es válido. */
export function parseScore(raw: string | undefined): number | null {
    const s = (raw ?? "").trim().replace(",", ".");
    if (s === "") return null;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
        throw new Error(`"${raw}" no es un puntaje transformado válido (0-100)`);
    }
    return round1(n);
}

function occupationalGroup(jobLevel: string | null): string {
    return jobLevel === "AUXILIAR" || jobLevel === "OPERATIVO" ? "auxiliares_operativos" : "jefes_profesionales_tecnicos";
}

interface BaremoBlock {
    dimensions?: Record<string, BaremoThreshold>;
    domains?: Record<string, BaremoThreshold>;
    total?: BaremoThreshold;
}

function resolveBaremos(instrument: InstrumentDef, formType: FormType, jobLevel: string | null): {
    dimensions: Record<string, BaremoThreshold>;
    domains: Record<string, BaremoThreshold>;
    total: BaremoThreshold | null;
} {
    const all = baremos as unknown as Record<string, unknown>;
    const group = occupationalGroup(jobLevel);
    let table = all[instrument.baremoKey(formType)] as Record<string, unknown> | undefined;
    if (instrument.totalStrategy === "weighted") {
        return { dimensions: {}, domains: {}, total: (table as Record<string, BaremoThreshold> | undefined)?.[group] ?? null };
    }
    if (instrument.usesOccupationalGroup) {
        table = (table as Record<string, Record<string, unknown>> | undefined)?.[group];
    }
    const t = (table ?? {}) as BaremoBlock;
    return { dimensions: t.dimensions ?? {}, domains: t.domains ?? {}, total: t.total ?? null };
}

/** Plantilla CSV de un instrumento: encabezado y una fila de ejemplo vacía. */
export function csvTemplate(instrumentId: QuestionnaireType, formType: FormType): string {
    const instrument = getInstrument(instrumentId);
    const config = instrument.config(formType);
    const header = [...FIXED_COLUMNS, ...config.dimensions.map((d) => d.key), "total"];
    const example = ["1234567890", instrumentId, instrument.usesFormType ? formType : "A", "2026-03-15", ...config.dimensions.map(() => ""), ""];
    return Papa.unparse([header, example]);
}

/**
 * Reconstruye el resultado calificado a partir de puntajes transformados.
 *
 * El bruto se recupera invirtiendo la transformación del motor
 * (raw = t/100 · factor + offset), lo que permite reutilizar
 * `calculateDomainScore` para los dominios y derivar el total como lo haría
 * el motor. Las categorías de riesgo se derivan SIEMPRE con los baremos
 * vigentes; nunca se aceptan del archivo. En estrés el total no se puede
 * reconstruir desde los grupos (promedios ponderados): debe venir en `total`.
 */
export function buildScoredDataFromTransformed(params: {
    instrument: InstrumentDef;
    formType: FormType;
    dimensionScores: Record<string, number | null>;
    total: number | null;
    jobLevel: string | null;
}): ScoredResultData {
    const { instrument, formType, jobLevel } = params;
    const config = instrument.config(formType);
    const table = resolveBaremos(instrument, formType, jobLevel);
    const scale = instrument.scale;
    const weighted = instrument.totalStrategy === "weighted";

    const dimensions: Record<string, DimensionScore> = {};
    let allValid = true;

    for (const dim of config.dimensions) {
        const t = params.dimensionScores[dim.key] ?? null;
        const itemCount = dim.items.length;
        const factor = itemCount * (scale.max - scale.min);
        const offset = itemCount * scale.min;

        if (t === null) {
            const filtered = instrument.hasControlQuestions && CONTROL_FILTERED.has(dim.key);
            if (!filtered && !weighted) allValid = false;
            dimensions[dim.key] = {
                dimensionKey: dim.key,
                dimensionName: dim.name,
                rawScore: 0,
                maxPossible: factor,
                transformedScore: 0,
                transformationFactor: factor,
                riskCategory: filtered ? "SIN_RIESGO" : weighted ? null : "INVALIDO",
                riskLevel: filtered ? 1 : 0,
                itemCount,
                invertedItems: dim.invertedItems,
                isValid: filtered || weighted,
                isFiltered: filtered || undefined,
                isUnscored: weighted || undefined,
            };
            continue;
        }

        const raw = round1((t / 100) * factor + offset);
        const thresholds = table.dimensions[dim.key];
        const category: RiskCategory | null = weighted ? null : thresholds ? lookupRiskCategory(t, thresholds) : "SIN_RIESGO";
        dimensions[dim.key] = {
            dimensionKey: dim.key,
            dimensionName: dim.name,
            rawScore: raw,
            maxPossible: factor,
            transformedScore: t,
            transformationFactor: factor,
            riskCategory: category,
            riskLevel: category ? getRiskLevel(category) : 0,
            itemCount,
            invertedItems: dim.invertedItems,
            isValid: true,
            isUnscored: weighted || undefined,
        };
    }

    const domains: Record<string, DomainScore> = {};
    let totalRaw = 0;
    let totalTransformed: number | null = null;

    if (instrument.totalStrategy === "domains") {
        for (const dom of config.domains) {
            const d = calculateDomainScore(dom, dimensions, table.domains);
            domains[dom.key] = d;
            if (d.rawScore > 0) totalRaw += d.rawScore;
        }
        if (allValid) totalTransformed = round1((totalRaw / config.totalTransformationFactor) * 100);
    } else if (instrument.totalStrategy === "flat") {
        const allItems = config.dimensions.flatMap((d) => d.items);
        for (const key in dimensions) totalRaw += dimensions[key].rawScore;
        if (allValid) {
            totalTransformed = round1(((totalRaw - allItems.length * scale.min) / config.totalTransformationFactor) * 100);
        }
    }

    // El total del archivo manda si viene: es lo que la herramienta de origen
    // reportó. En estrés es la única vía.
    if (params.total !== null) {
        totalTransformed = params.total;
        if (weighted) totalRaw = round1((params.total / 100) * config.totalTransformationFactor);
    } else if (weighted) {
        allValid = false;
    }

    const totalValid = allValid && totalTransformed !== null && table.total !== null;
    const totalCategory: RiskCategory = totalValid ? lookupRiskCategory(totalTransformed as number, table.total as BaremoThreshold) : "INVALIDO";
    const total: TotalScore = {
        rawScore: totalValid ? round1(totalRaw) : 0,
        maxPossible: config.totalTransformationFactor,
        transformedScore: totalValid ? (totalTransformed as number) : 0,
        riskCategory: totalCategory,
        riskLevel: totalValid ? getRiskLevel(totalCategory) : 0,
        isValid: totalValid,
    };

    return { formType, questionnaireType: instrument.id, dimensions, domains, total };
}
