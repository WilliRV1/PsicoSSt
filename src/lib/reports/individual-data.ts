import { prisma } from "@/lib/prisma";
import { getBaremos, getFormConfig } from "@/config/battery";
import { loadImage, type ReportImage } from "./images";
import {
    DIMENSION_ACTION,
    DIMENSION_DEFINITION,
    DOMAIN_ACTION,
    DOMAIN_DEFINITION,
    RISK_INTERPRETATION,
    RISK_LABEL,
    STRESS_LABEL,
    type RiskLevel,
} from "./battery-content";

/**
 * Datos del informe individual de evaluación de riesgo psicosocial.
 *
 * El informe anterior recibía la ficha del trabajador y nunca la imprimía, y
 * mostraba las dimensiones como una lista plana ordenada por riesgo, sin los
 * dominios ni los baremos. Aquí se arma la jerarquía dominio → dimensión que
 * usa la Batería, con la banda de baremo de cada puntaje, para que el lector
 * pueda situar el resultado en la escala y no sólo leer un número.
 */

export interface FichaRow {
    label: string;
    value: string;
}

export interface DimensionResult {
    key: string;
    name: string;
    definition: string | null;
    score: number;
    level: RiskLevel;
    levelLabel: string;
    /** Cotas superiores de las cinco bandas del baremo, ascendentes. */
    bounds: number[];
    /** Acción recomendada; sólo se incluye cuando el nivel la amerita. */
    action: string | null;
}

export interface DomainResult {
    key: string;
    name: string;
    definition: string | null;
    score: number;
    level: RiskLevel;
    levelLabel: string;
    bounds: number[];
    action: string | null;
    dimensions: DimensionResult[];
}

export interface IndividualData {
    meta: {
        questionnaireLabel: string;
        formLabel: string | null;
        isStress: boolean;
        isAnonymous: boolean;
        /** Sin fecha de expedición de licencia el informe no es válido. */
        licenseMissing: boolean;
    };
    brand: {
        tradeName: string | null;
        contactLine: string | null;
        logoPath: string | null;
    };
    org: { name: string; nit: string; city: string | null; economicSector: string | null };
    worker: { name: string; document: string; ficha: FichaRow[] };
    assessment: { date: string; reportDate: string; submittedTime: string };
    overall: {
        /** Falso cuando faltan ítems y el puntaje no puede calcularse. */
        isValid: boolean;
        score: number;
        level: RiskLevel;
        levelLabel: string;
        bounds: number[];
        meaning: string;
        action: string;
    };
    /** Vacío en extralaboral y estrés, que no se agrupan en dominios. */
    domains: DomainResult[];
    /** Dimensiones sueltas, usadas cuando no hay dominios. */
    dimensions: DimensionResult[];
    /** Dimensiones en riesgo alto o muy alto, para el plan de intervención. */
    critical: { name: string; levelLabel: string; action: string }[];
    narrative: { analysis: string | null; recommendations: string | null };
    professional: {
        name: string;
        license: string;
        professionalCard: string | null;
        sstCredential: string | null;
        sstLicenseDate: string | null;
        signaturePath: string | null;
    };
    glossary: { name: string; definition: string }[];
}

export interface IndividualAssets {
    logo: ReportImage | null;
    signature: ReportImage | null;
}

const fmtDate = (d: Date) =>
    d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

/** Un puntaje individual tal como lo deja el motor de calificación. */
interface StoredScore {
    dimensionName?: string;
    domainName?: string;
    transformedScore?: number;
    riskCategory?: string;
}

/**
 * Devuelve el nivel, o null si el resultado no es calculable.
 *
 * Antes caía a "SIN_RIESGO" ante cualquier valor desconocido, de modo que una
 * evaluación a la que le faltan ítems se imprimía como un trabajador sin
 * riesgo. Es justo lo que el manual prohíbe afirmar.
 */
function asLevel(v: string | undefined): RiskLevel | null {
    return (["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"] as const).includes(v as RiskLevel)
        ? (v as RiskLevel)
        : null;
}

/**
 * Convierte una entrada de baremo ({sinRiesgo:[0,3.8], bajo:[3.9,15.4], …}) en
 * las cinco cotas superiores que dibuja la escala. Devuelve una lista vacía
 * cuando no hay baremo, para que el informe omita la escala en vez de dibujar
 * una inventada.
 */
function toBounds(entry: Record<string, number[]> | undefined | null): number[] {
    if (!entry?.muyAlto) return [];
    return [
        entry.sinRiesgo?.[1] ?? 20,
        entry.bajo?.[1] ?? 40,
        entry.medio?.[1] ?? 60,
        entry.alto?.[1] ?? 80,
        entry.muyAlto?.[1] ?? 100,
    ];
}

type BaremoEntry = Record<string, number[]>;
interface BaremoTables {
    dimensions: Record<string, BaremoEntry>;
    domains: Record<string, BaremoEntry>;
    total: BaremoEntry | null;
}

/**
 * Selecciona las tablas de baremo que corresponden a esta evaluación.
 *
 * Replica la selección del motor de calificación: el intralaboral se separa por
 * forma A y B, mientras que el extralaboral y el estrés están estratificados
 * por grupo ocupacional, y el estrés además por sexo. Tomar la tabla sin
 * estratificar dibujaría el puntaje contra unos umbrales que no son los que se
 * usaron para clasificarlo. El estrés, además, sólo tiene baremo del total: sus
 * cuatro grupos de síntomas no se baremizan por separado en el manual.
 */
function resolveBaremos(
    questionnaireType: string,
    formType: string,
    jobLevel: string | null,
    gender: string | null
): BaremoTables {
    const all = getBaremos() as unknown as Record<string, Record<string, unknown>>;
    const group =
        jobLevel === "AUXILIAR" || jobLevel === "OPERATIVO"
            ? "auxiliares_operativos"
            : "jefes_profesionales_tecnicos";

    if (questionnaireType === "EXTRALABORAL") {
        const t = (all.extralaboral?.[group] ?? {}) as {
            dimensions?: Record<string, BaremoEntry>;
            total?: BaremoEntry;
        };
        return { dimensions: t.dimensions ?? {}, domains: {}, total: t.total ?? null };
    }

    if (questionnaireType === "STRESS") {
        const stress = all.stress as Record<string, Record<string, BaremoEntry>> | undefined;
        const g = gender === "M" ? "M" : "F";
        const total = stress?.[g]?.[group] ?? stress?.["F"]?.["jefes_profesionales_tecnicos"] ?? null;
        return { dimensions: {}, domains: {}, total };
    }

    const t = (all[formType === "A" ? "intralaboral_a" : "intralaboral_b"] ?? {}) as {
        dimensions?: Record<string, BaremoEntry>;
        domains?: Record<string, BaremoEntry>;
        total?: BaremoEntry;
    };
    return { dimensions: t.dimensions ?? {}, domains: t.domains ?? {}, total: t.total ?? null };
}

/** Sólo se sugiere acción cuando el nivel obliga a intervenir. */
const needsAction = (level: RiskLevel) => level === "ALTO" || level === "MUY_ALTO";

function buildFicha(w: {
    documentType: string;
    documentId: string;
    gender: string | null;
    birthYear: number | null;
    maritalStatus: string | null;
    educationLevel: string | null;
    profession: string | null;
    jobTitle: string | null;
    departmentArea: string | null;
    yearsInCompany: number | null;
    yearsInPosition: number | null;
    contractType: string | null;
    workSchedule: string | null;
    hoursPerDay: string | null;
    residenceCity: string | null;
    socioeconomicStratum: string | null;
    dependentsCount: number | null;
    transportMeans: string | null;
    displacementTime: number | null;
}, anonymous: boolean): FichaRow[] {
    const years = (n: number | null) =>
        n === null || n === undefined ? null : n === 1 ? "1 año" : `${n} años`;

    const rows: (readonly [string, string | null])[] = [
        // El documento identifica; en modo anónimo no puede aparecer.
        ["Documento", anonymous ? null : `${w.documentType} ${w.documentId}`],
        ["Sexo", w.gender],
        ["Edad", w.birthYear ? `${new Date().getFullYear() - w.birthYear} años` : null],
        ["Estado civil", w.maritalStatus],
        ["Nivel educativo", w.educationLevel],
        ["Profesión u oficio", w.profession],
        ["Cargo", w.jobTitle],
        ["Área o dependencia", w.departmentArea],
        ["Antigüedad en la empresa", years(w.yearsInCompany)],
        ["Antigüedad en el cargo", years(w.yearsInPosition)],
        ["Tipo de contrato", w.contractType],
        ["Tipo de jornada", w.workSchedule],
        ["Horas diarias", w.hoursPerDay],
        ["Ciudad de residencia", anonymous ? null : w.residenceCity],
        ["Estrato socioeconómico", w.socioeconomicStratum],
        [
            "Personas a cargo",
            w.dependentsCount === null || w.dependentsCount === undefined
                ? null
                : String(w.dependentsCount),
        ],
        ["Medio de transporte", w.transportMeans],
        [
            "Tiempo de desplazamiento",
            w.displacementTime ? `${w.displacementTime} minutos` : null,
        ],
    ];

    return rows
        .filter((r): r is readonly [string, string] => !!r[1] && r[1].trim() !== "")
        .map(([label, value]) => ({ label, value }));
}

export async function buildIndividualData(
    assessmentId: string,
    psychologistId: string,
    isAdmin: boolean,
    isAnonymous: boolean
): Promise<{ data: IndividualData; assets: IndividualAssets } | null> {
    const assessment = await prisma.assessment.findFirst({
        where: {
            id: assessmentId,
            ...(isAdmin ? {} : { psychologistId }),
        },
        include: {
            worker: true,
            organization: true,
            psychologist: {
                include: {
                    settings: true,
                    signatures: { orderBy: { uploadedAt: "desc" } },
                },
            },
            scoredResult: true,
            generatedReports: { take: 1, orderBy: { generatedAt: "desc" } },
        },
    });

    if (!assessment?.scoredResult) return null;

    const { worker, organization, psychologist, scoredResult } = assessment;
    const settings = psychologist.settings;
    const report = assessment.generatedReports[0];

    const isStress = assessment.questionnaireType === "STRESS";
    const levelLabel = (l: RiskLevel) => (isStress ? STRESS_LABEL[l] : RISK_LABEL[l]);

    // ── baremos ───────────────────────────────────────────
    const table = resolveBaremos(
        assessment.questionnaireType,
        assessment.formType,
        worker.jobLevel,
        worker.gender
    );

    // ── puntajes almacenados ──────────────────────────────
    const dimStore = (scoredResult.dimensionScores ?? {}) as Record<string, StoredScore>;
    const domStore = (scoredResult.domainScores ?? {}) as Record<string, StoredScore>;
    const totals = (scoredResult.totalScores ?? {}) as StoredScore;

    const buildDimension = (key: string): DimensionResult | null => {
        const s = dimStore[key];
        if (!s) return null;
        const nivel = asLevel(s.riskCategory);
        const level: RiskLevel = nivel ?? "SIN_RIESGO";
        const valida = nivel !== null;
        return {
            key,
            name: s.dimensionName ?? key,
            definition: DIMENSION_DEFINITION[key] ?? null,
            score: Number((s.transformedScore ?? 0).toFixed(1)),
            level,
            levelLabel: valida ? levelLabel(level) : "No calculable",
            bounds: valida ? toBounds(table.dimensions[key]) : [],
            action: valida && needsAction(level) ? DIMENSION_ACTION[key] ?? null : null,
        };
    };

    // ── jerarquía ─────────────────────────────────────────
    // Sólo el intralaboral se organiza en dominios; extralaboral y estrés se
    // presentan como una lista de dimensiones.
    const config = getFormConfig(
        assessment.formType as "A" | "B",
        assessment.questionnaireType as "INTRALABORAL" | "EXTRALABORAL" | "STRESS"
    );

    const domains: DomainResult[] = [];
    const flat: DimensionResult[] = [];
    const seen = new Set<string>();

    for (const dc of config?.domains ?? []) {
        const dims = (dc.dimensionKeys as string[])
            .map(buildDimension)
            .filter((d): d is DimensionResult => d !== null);
        dims.forEach(d => seen.add(d.key));
        // Un dominio sin dimensiones calificadas no aporta nada: en la forma B,
        // por ejemplo, no existe "relación con los colaboradores".
        if (dims.length === 0) continue;

        const s = domStore[dc.key];
        const nivelDom = asLevel(s?.riskCategory);
        const level: RiskLevel = nivelDom ?? "SIN_RIESGO";
        domains.push({
            key: dc.key,
            name: s?.domainName ?? dc.name,
            definition: DOMAIN_DEFINITION[dc.key] ?? null,
            score: Number((s?.transformedScore ?? 0).toFixed(1)),
            level,
            levelLabel: nivelDom !== null ? levelLabel(level) : "No calculable",
            bounds: nivelDom !== null ? toBounds(table.domains[dc.key]) : [],
            action: nivelDom !== null && needsAction(level) ? DOMAIN_ACTION[dc.key] ?? null : null,
            dimensions: dims,
        });
    }

    // Cualquier dimensión calificada que ningún dominio reclamó.
    for (const key of Object.keys(dimStore)) {
        if (seen.has(key)) continue;
        const d = buildDimension(key);
        if (d) flat.push(d);
    }
    flat.sort((a, b) => b.score - a.score);

    // ── plan de intervención ──────────────────────────────
    const allDims = [...domains.flatMap(d => d.dimensions), ...flat];
    const critical = allDims
        .filter(d => needsAction(d.level) && d.action)
        .sort((a, b) => b.score - a.score)
        .map(d => ({ name: d.name, levelLabel: d.levelLabel, action: d.action! }));

    // ── glosario ──────────────────────────────────────────
    // Sólo de las dimensiones que este informe realmente evaluó: el anexo fijo
    // de cuatro dominios que había antes era irrelevante en estrés y
    // extralaboral, donde esos dominios ni siquiera existen.
    const glossary = allDims
        .filter(d => d.definition)
        .map(d => ({ name: d.name, definition: d.definition! }));

    // ── firma ─────────────────────────────────────────────
    const signedImage =
        report?.status === "SIGNED" && report.signatureImage ? report.signatureImage : null;
    const drawn = psychologist.signatures.find(s => s.signatureType === "drawn");
    const uploaded = psychologist.signatures.find(s => s.signatureType === "uploaded");
    const best = drawn ?? uploaded;
    const signatureRef =
        signedImage ?? best?.dataUrl ?? best?.imageUrl ?? psychologist.signature ?? null;

    const [logo, signature] = await Promise.all([
        loadImage(settings?.logoUrl),
        // Sin fecha de expedición de licencia el informe no puede firmarse.
        psychologist.sstLicenseDate ? loadImage(signatureRef) : Promise.resolve(null),
    ]);

    const contactBits = [settings?.email, settings?.phone, settings?.city].filter(Boolean);

    const rawOverall = asLevel(scoredResult.overallRiskCategory);
    const overallValid = rawOverall !== null;
    const overallLevel: RiskLevel = rawOverall ?? "SIN_RIESGO";
    const questionnaireLabel = isStress
        ? "Cuestionario de evaluación del estrés"
        : assessment.questionnaireType === "EXTRALABORAL"
          ? "Cuestionario de factores de riesgo psicosocial extralaboral"
          : "Cuestionario de factores de riesgo psicosocial intralaboral";

    return {
        data: {
            meta: {
                questionnaireLabel,
                formLabel:
                    assessment.questionnaireType === "INTRALABORAL"
                        ? `Forma ${assessment.formType}`
                        : null,
                isStress,
                isAnonymous,
                licenseMissing: !psychologist.sstLicenseDate,
            },
            brand: {
                tradeName: settings?.tradeName ?? settings?.consultingRoomName ?? null,
                contactLine: contactBits.length ? contactBits.join(" · ") : null,
                logoPath: logo ? `/assets/logo.${logo.ext}` : null,
            },
            org: {
                name: organization.name,
                nit: organization.nit,
                city: organization.city,
                economicSector: organization.economicSector,
            },
            worker: {
                name: isAnonymous ? "Trabajador anónimo" : worker.fullName,
                document: isAnonymous ? "Reservado" : `${worker.documentType} ${worker.documentId}`,
                ficha: buildFicha(worker as never, isAnonymous),
            },
            assessment: {
                date: fmtDate(new Date(assessment.assessmentDate)),
                reportDate: fmtDate(new Date()),
                submittedTime: new Date(assessment.createdAt).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
            overall: {
                isValid: overallValid,
                score: Number((totals.transformedScore ?? 0).toFixed(1)),
                level: overallLevel,
                levelLabel: overallValid ? levelLabel(overallLevel) : "No calculable",
                bounds: overallValid ? toBounds(table.total) : [],
                meaning: overallValid
                    ? RISK_INTERPRETATION[overallLevel].meaning
                    : "El cuestionario no cuenta con el mínimo de ítems respondidos que exige el manual de la Batería, de modo que no es posible calcular un puntaje ni asignar un nivel de riesgo. Los resultados por dimensión y por dominio quedan igualmente sin validez.",
                action: overallValid
                    ? RISK_INTERPRETATION[overallLevel].action
                    : "Completar los ítems faltantes o repetir la aplicación del cuestionario. Este informe no puede sustentar decisiones ni presentarse ante la autoridad mientras el resultado no sea calculable.",
            },
            domains,
            dimensions: flat,
            critical,
            narrative: {
                analysis:
                    (report?.reportData as { analysis?: string } | null)?.analysis?.trim() || null,
                recommendations:
                    (report?.reportData as { recommendations?: string } | null)?.recommendations?.trim() ||
                    null,
            },
            professional: {
                name: psychologist.fullName,
                license: psychologist.licenseNumber,
                professionalCard: psychologist.professionalCard,
                sstCredential: psychologist.sstCredential,
                sstLicenseDate: psychologist.sstLicenseDate
                    ? fmtDate(new Date(psychologist.sstLicenseDate))
                    : null,
                signaturePath: signature ? `/assets/signature.${signature.ext}` : null,
            },
            glossary,
        },
        assets: { logo, signature },
    };
}
