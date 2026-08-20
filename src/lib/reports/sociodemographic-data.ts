import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { loadImage, type ReportImage } from "./images";

/**
 * Perfil sociodemográfico y ocupacional de la población evaluada.
 *
 * Describe a quiénes se evaluó, que es lo que permite interpretar los
 * resultados de riesgo: una misma condición de trabajo no significa lo mismo en
 * una planta de operarios jóvenes con contrato temporal que en un equipo
 * profesional con diez años de antigüedad.
 *
 * Se cuenta sobre los trabajadores con al menos una evaluación calificada, no
 * sobre toda la planta. Un perfil que incluyera a quien nunca fue evaluado
 * describiría a una población distinta de la que produjo los resultados.
 */

export interface ProfileRow {
    label: string;
    count: number;
    pct: number;
}

export interface ProfileBlock {
    title: string;
    /** Qué se preguntó, cuando el título no basta. */
    note: string | null;
    rows: ProfileRow[];
    /** Trabajadores sin dato registrado en esta variable. */
    missing: number;
}

export interface SociodemographicData {
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
        /** Trabajadores con al menos una evaluación calificada. */
        evaluated: number;
        /** Trabajadores registrados en la organización. */
        registered: number;
        assessments: number;
    };
    /** Variables personales y familiares. */
    personal: ProfileBlock[];
    /** Variables ocupacionales. */
    occupational: ProfileBlock[];
}

export interface SociodemographicAssets {
    logo: ReportImage | null;
    signature: ReportImage | null;
}

const fmtDate = (t: number) =>
    new Date(t).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

/**
 * Agrupa valores en filas con su porcentaje.
 *
 * Los ausentes no entran en el denominador: si a la mitad de la población no se
 * le registró el estrato, repartir porcentajes sobre el total haría parecer que
 * ningún estrato llega al 50% cuando lo que ocurre es que falta el dato. Se
 * reportan aparte.
 */
function tally(
    values: (string | null | undefined)[],
    order?: string[]
): { rows: ProfileRow[]; missing: number } {
    const counts = new Map<string, number>();
    let missing = 0;

    for (const raw of values) {
        const v = raw?.toString().trim();
        if (!v) {
            missing++;
            continue;
        }
        counts.set(v, (counts.get(v) ?? 0) + 1);
    }

    const total = [...counts.values()].reduce((s, v) => s + v, 0);
    let rows = [...counts.entries()].map(([label, count]) => ({
        label,
        count,
        pct: total ? Math.round((count / total) * 1000) / 10 : 0,
    }));

    if (order) {
        // Orden natural declarado (rangos de edad, antigüedad…): alfabético o por
        // frecuencia dejaría "18 a 27" después de "48 a 57".
        const idx = (l: string) => {
            const i = order.indexOf(l);
            return i === -1 ? order.length : i;
        };
        rows.sort((a, b) => idx(a.label) - idx(b.label) || b.count - a.count);
    } else {
        rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));
    }

    return { rows, missing };
}

function block(
    title: string,
    values: (string | null | undefined)[],
    opts: { note?: string; order?: string[] } = {}
): ProfileBlock {
    const { rows, missing } = tally(values, opts.order);
    return { title, note: opts.note ?? null, rows, missing };
}

const AGE_ORDER = [
    "Menos de 25 años",
    "De 25 a 34 años",
    "De 35 a 44 años",
    "De 45 a 54 años",
    "55 años o más",
];

function ageBucket(birthDate: Date | null, birthYear: number | null): string | null {
    const year = birthDate ? birthDate.getFullYear() : birthYear;
    if (!year) return null;
    const age = new Date().getFullYear() - year;
    if (age < 0 || age > 100) return null;
    if (age < 25) return AGE_ORDER[0];
    if (age < 35) return AGE_ORDER[1];
    if (age < 45) return AGE_ORDER[2];
    if (age < 55) return AGE_ORDER[3];
    return AGE_ORDER[4];
}

const TENURE_ORDER = [
    "Menos de 1 año",
    "De 1 a 3 años",
    "De 4 a 7 años",
    "De 8 a 15 años",
    "Más de 15 años",
];

function tenureBucket(lessThanOne: boolean | null, years: number | null): string | null {
    if (lessThanOne) return TENURE_ORDER[0];
    if (years === null || years === undefined) return null;
    if (years < 1) return TENURE_ORDER[0];
    if (years <= 3) return TENURE_ORDER[1];
    if (years <= 7) return TENURE_ORDER[2];
    if (years <= 15) return TENURE_ORDER[3];
    return TENURE_ORDER[4];
}

const DEPENDENTS_ORDER = ["Ninguna", "1 persona", "2 personas", "3 personas", "4 o más personas"];

function dependentsBucket(n: number | null): string | null {
    if (n === null || n === undefined) return null;
    if (n <= 0) return DEPENDENTS_ORDER[0];
    if (n === 1) return DEPENDENTS_ORDER[1];
    if (n === 2) return DEPENDENTS_ORDER[2];
    if (n === 3) return DEPENDENTS_ORDER[3];
    return DEPENDENTS_ORDER[4];
}

const COMMUTE_ORDER = [
    "Hasta 30 minutos",
    "De 31 a 60 minutos",
    "De 61 a 90 minutos",
    "Más de 90 minutos",
];

function commuteBucket(minutes: number | null): string | null {
    if (minutes === null || minutes === undefined || minutes < 0) return null;
    if (minutes <= 30) return COMMUTE_ORDER[0];
    if (minutes <= 60) return COMMUTE_ORDER[1];
    if (minutes <= 90) return COMMUTE_ORDER[2];
    return COMMUTE_ORDER[3];
}

const JOB_LEVEL_LABEL: Record<string, string> = {
    JEFATURA: "Jefatura",
    PROFESIONAL: "Profesional",
    TECNICO: "Técnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo",
};

const JOB_LEVEL_ORDER = Object.values(JOB_LEVEL_LABEL);

export async function buildSociodemographicData(
    orgId: string,
    psychologistId: string,
    isAdmin: boolean
): Promise<{ data: SociodemographicData; assets: SociodemographicAssets } | null> {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            psychologist: {
                include: { settings: true, signatures: { orderBy: { uploadedAt: "desc" } } },
            },
        },
    });

    if (!org) return null;
    if (org.createdByPsychologist !== psychologistId && !isAdmin) return null;

    const scored: Prisma.AssessmentWhereInput = {
        status: { in: ["COMPLETED", "SCORED", "SIGNED", "REVIEWED"] },
        scoredResult: { isNot: null },
    };

    const [workers, registered] = await Promise.all([
        prisma.worker.findMany({
            where: { organizationId: orgId, assessments: { some: scored } },
            include: { assessments: { where: scored, select: { assessmentDate: true } } },
        }),
        prisma.worker.count({ where: { organizationId: orgId } }),
    ]);

    if (workers.length === 0) return null;

    const dates = workers.flatMap(w => w.assessments.map(a => new Date(a.assessmentDate).getTime()));
    const assessments = workers.reduce((s, w) => s + w.assessments.length, 0);

    const personal: ProfileBlock[] = [
        block("Sexo", workers.map(w => w.gender)),
        block("Rango de edad", workers.map(w => ageBucket(w.birthDate, w.birthYear)), {
            order: AGE_ORDER,
        }),
        block("Estado civil", workers.map(w => w.maritalStatus)),
        block("Nivel educativo", workers.map(w => w.educationLevel)),
        block("Personas a cargo", workers.map(w => dependentsBucket(w.dependentsCount)), {
            order: DEPENDENTS_ORDER,
        }),
        block("Estrato socioeconómico", workers.map(w => w.socioeconomicStratum)),
        block("Tipo de vivienda", workers.map(w => w.housingType)),
        block("Ciudad de residencia", workers.map(w => w.residenceCity)),
        block(
            "Tiempo de desplazamiento",
            workers.map(w => commuteBucket(w.displacementTime)),
            {
                note: "Trayecto habitual entre la vivienda y el lugar de trabajo, en un sentido.",
                order: COMMUTE_ORDER,
            }
        ),
        block("Medio de transporte", workers.map(w => w.transportMeans)),
        // El uso del tiempo libre es de selección múltiple, así que los
        // porcentajes suman más de 100: cada fila es sobre el total de
        // trabajadores, no una partición de ellos.
        block(
            "Uso del tiempo libre",
            workers.flatMap(w => (w.freeTimeUsage?.length ? w.freeTimeUsage : [null])),
            { note: "Pregunta de selección múltiple: un trabajador puede aparecer en varias filas." }
        ),
    ];

    const occupational: ProfileBlock[] = [
        block(
            "Nivel del cargo",
            workers.map(w => JOB_LEVEL_LABEL[w.jobLevel] ?? null),
            {
                note: "Determina la forma del cuestionario intralaboral: forma A para jefaturas, profesionales y técnicos; forma B para auxiliares y operarios.",
                order: JOB_LEVEL_ORDER,
            }
        ),
        block("Área o dependencia", workers.map(w => w.departmentArea)),
        block("Tipo de contrato", workers.map(w => w.contractType)),
        block("Tipo de jornada", workers.map(w => w.workSchedule)),
        block("Horas diarias de trabajo", workers.map(w => w.hoursPerDay)),
        block("Modalidad de pago", workers.map(w => w.paymentModality)),
        block(
            "Antigüedad en la empresa",
            workers.map(w => tenureBucket(w.lessThanOneYearInCompany, w.yearsInCompany)),
            { order: TENURE_ORDER }
        ),
        block(
            "Antigüedad en el cargo actual",
            workers.map(w => tenureBucket(w.lessThanOneYearInPosition, w.yearsInPosition)),
            { order: TENURE_ORDER }
        ),
    ].filter(b => b.rows.length > 0);

    const settings = org.psychologist.settings;
    const sig =
        org.psychologist.signatures.find(s => s.signatureType === "drawn") ??
        org.psychologist.signatures.find(s => s.signatureType === "uploaded");

    const [logo, signature] = await Promise.all([
        loadImage(settings?.logoUrl),
        loadImage(sig?.dataUrl ?? sig?.imageUrl ?? org.psychologist.signature),
    ]);

    const contactBits = [settings?.email, settings?.phone, settings?.city].filter(Boolean);

    return {
        data: {
            org: {
                name: org.name,
                nit: org.nit,
                city: org.city,
                economicSector: org.economicSector,
                dateStart: dates.length ? fmtDate(Math.min(...dates)) : "—",
                dateEnd: dates.length ? fmtDate(Math.max(...dates)) : "—",
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
            coverage: { evaluated: workers.length, registered, assessments },
            personal: personal.filter(b => b.rows.length > 0),
            occupational,
        },
        assets: { logo, signature },
    };
}
