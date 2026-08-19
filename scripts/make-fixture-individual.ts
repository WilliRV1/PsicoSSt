/**
 * Genera el fixture del informe individual a partir de la configuración y los
 * baremos reales, para que la prueba de diseño use las mismas dimensiones,
 * umbrales y definiciones que verá un informe de producción.
 *
 *   npx tsx scripts/make-fixture-individual.ts [forma]
 *   forma: A (por defecto) | B | EXTRA | STRESS
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
    RISK_INTERPRETATION,
    RISK_LABEL,
    STRESS_LABEL,
    type RiskLevel,
} from "../src/lib/reports/battery-content";

type Entry = Record<string, number[]>;
const LEVELS: RiskLevel[] = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"];

const toBounds = (e: Entry | undefined): number[] =>
    e?.muyAlto ? [e.sinRiesgo[1], e.bajo[1], e.medio[1], e.alto[1], e.muyAlto[1]] : [];

const levelOf = (score: number, bounds: number[]): RiskLevel => {
    if (bounds.length === 0) return "SIN_RIESGO";
    for (let i = 0; i < bounds.length; i++) if (score <= bounds[i]) return LEVELS[i];
    return "MUY_ALTO";
};

/**
 * Puntaje determinista por clave: el fixture debe ser reproducible, pero tiene
 * que repartir dimensiones por las cinco bandas para que la revisión visual vea
 * todos los colores y todas las ramas de la plantilla.
 */
const scoreFor = (key: string, bounds: number[]): number => {
    let h = 0;
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 1000;
    const top = bounds.length ? bounds[bounds.length - 1] : 100;
    return Number((((h % 850) / 1000) * top).toFixed(1));
};

const variant = (process.argv[2] ?? "A").toUpperCase();
const isStress = variant === "STRESS";
const isExtra = variant === "EXTRA";
const label = (l: RiskLevel) => (isStress ? STRESS_LABEL[l] : RISK_LABEL[l]);

const config = isStress ? stressCfg : isExtra ? extraCfg : variant === "B" ? formB : formA;
const tables = isStress
    ? { dimensions: {} as Record<string, Entry>, domains: {} as Record<string, Entry>, total: (baremos as any).stress.F.jefes_profesionales_tecnicos }
    : isExtra
      ? {
            dimensions: (baremos as any).extralaboral.jefes_profesionales_tecnicos.dimensions,
            domains: {} as Record<string, Entry>,
            total: (baremos as any).extralaboral.jefes_profesionales_tecnicos.total,
        }
      : {
            dimensions: (baremos as any)[variant === "B" ? "intralaboral_b" : "intralaboral_a"].dimensions,
            domains: (baremos as any)[variant === "B" ? "intralaboral_b" : "intralaboral_a"].domains,
            total: (baremos as any)[variant === "B" ? "intralaboral_b" : "intralaboral_a"].total,
        };

const buildDim = (d: { key: string; name: string }) => {
    const bounds = toBounds(tables.dimensions[d.key]);
    const score = scoreFor(d.key, bounds.length ? bounds : [100]);
    const level = levelOf(score, bounds);
    const needs = level === "ALTO" || level === "MUY_ALTO";
    return {
        key: d.key,
        name: d.name,
        definition: DIMENSION_DEFINITION[d.key] ?? null,
        score,
        level,
        levelLabel: label(level),
        bounds,
        action: needs ? (DIMENSION_ACTION[d.key] ?? null) : null,
    };
};

const allDims = (config as any).dimensions.map(buildDim);
const byKey = new Map(allDims.map((d: any) => [d.key, d]));

const domains = ((config as any).domains ?? []).map((dc: any) => {
    const dims = dc.dimensionKeys.map((k: string) => byKey.get(k)).filter(Boolean);
    const bounds = toBounds(tables.domains[dc.key]);
    const score = scoreFor(dc.key, bounds.length ? bounds : [100]);
    const level = levelOf(score, bounds);
    const needs = level === "ALTO" || level === "MUY_ALTO";
    return {
        key: dc.key,
        name: dc.name,
        definition: DOMAIN_DEFINITION[dc.key] ?? null,
        score,
        level,
        levelLabel: label(level),
        bounds,
        action: needs ? (DOMAIN_ACTION[dc.key] ?? null) : null,
        dimensions: dims,
    };
});

const claimed = new Set(domains.flatMap((d: any) => d.dimensions.map((x: any) => x.key)));
const flat = allDims.filter((d: any) => !claimed.has(d.key)).sort((a: any, b: any) => b.score - a.score);

const everyDim = [...domains.flatMap((d: any) => d.dimensions), ...flat];
const totalBounds = toBounds(tables.total);
const totalScore = scoreFor("total" + variant, totalBounds.length ? totalBounds : [100]);
const totalLevel = levelOf(totalScore, totalBounds);

const data = {
    meta: {
        questionnaireLabel: isStress
            ? "Cuestionario de evaluación del estrés"
            : isExtra
              ? "Cuestionario de factores de riesgo psicosocial extralaboral"
              : "Cuestionario de factores de riesgo psicosocial intralaboral",
        formLabel: isStress || isExtra ? null : `Forma ${variant}`,
        isStress,
        isAnonymous: false,
        licenseMissing: false,
    },
    brand: {
        tradeName: "PsicoSST Consultoría",
        contactLine: "contacto@psicosst.co · +57 300 000 0000 · Cali",
        logoPath: null,
    },
    org: {
        name: "MANUFACTURAS DEL PACÍFICO S.A.S.",
        nit: "901.234.567-8",
        city: "Cali",
        economicSector: "Industria manufacturera",
    },
    worker: {
        name: "María Fernanda Quintero Ospina",
        document: "CC 1.144.201.887",
        ficha: [
            ["Documento", "CC 1.144.201.887"],
            ["Sexo", "Femenino"],
            ["Edad", "34 años"],
            ["Estado civil", "Unión libre"],
            ["Nivel educativo", "Profesional"],
            ["Profesión u oficio", "Ingeniera industrial"],
            ["Cargo", "Coordinadora de planta"],
            ["Área o dependencia", "Producción"],
            ["Antigüedad en la empresa", "6 años"],
            ["Antigüedad en el cargo", "2 años"],
            ["Tipo de contrato", "Término indefinido"],
            ["Tipo de jornada", "Rotativo"],
            ["Horas diarias", "8 a 10"],
            ["Ciudad de residencia", "Cali"],
            ["Estrato socioeconómico", "3"],
            ["Personas a cargo", "2"],
            ["Medio de transporte", "Transporte público"],
            ["Tiempo de desplazamiento", "55 minutos"],
        ].map(([label, value]) => ({ label, value })),
    },
    assessment: {
        date: "14 de mayo de 2026",
        reportDate: "19 de agosto de 2026",
        submittedTime: "09:42",
    },
    overall: {
        score: totalScore,
        level: totalLevel,
        levelLabel: label(totalLevel),
        bounds: totalBounds,
        meaning: RISK_INTERPRETATION[totalLevel].meaning,
        action: RISK_INTERPRETATION[totalLevel].action,
    },
    domains,
    dimensions: flat,
    critical: everyDim
        .filter((d: any) => d.action)
        .sort((a: any, b: any) => b.score - a.score)
        .map((d: any) => ({ name: d.name, levelLabel: d.levelLabel, action: d.action })),
    narrative: {
        analysis:
            "La trabajadora presenta una configuración de riesgo concentrada en el dominio de demandas del trabajo, coherente con el esquema de turnos rotativos de la planta y con la ampliación de funciones ocurrida tras la reestructuración del área de producción. Las condiciones de liderazgo y de relaciones sociales actúan como factor protector y explican que el puntaje global no alcance un nivel superior. Se observa además una influencia apreciable del trabajo sobre el entorno extralaboral, asociada al tiempo de desplazamiento y a la carga de cuidado en el hogar.",
        recommendations:
            "Se recomienda priorizar la revisión de la carga de trabajo del cargo antes de cualquier otra acción, dado que es la condición con mayor puntaje y la que sostiene el resto del perfil. La intervención sobre las demandas de la jornada debe coordinarse con el área de producción para no trasladar la carga a otros puestos del mismo turno.",
    },
    professional: {
        name: "William Reyes Valencia",
        license: "12345 de 2019",
        professionalCard: "PS-98765",
        sstCredential: "Especialista en Seguridad y Salud en el Trabajo",
        sstLicenseDate: "3 de febrero de 2019",
        signaturePath: null,
    },
    glossary: everyDim
        .filter((d: any) => d.definition)
        .map((d: any) => ({ name: d.name, definition: d.definition })),
};

const out = path.join("typst", "fixtures", `individual-${variant.toLowerCase()}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data, null, 2));
console.log(`${out} — ${domains.length} dominios, ${everyDim.length} dimensiones, ${data.critical.length} críticas`);
