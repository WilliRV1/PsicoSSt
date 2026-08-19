import { prisma } from "@/lib/prisma";
import { getBaremos } from "@/config/battery";

export const RISK_ORDER = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"] as const;
export type RiskLevel = (typeof RISK_ORDER)[number];

const HIGH_RISK = new Set<string>(["ALTO", "MUY_ALTO"]);

export interface DemographicRow {
    label: string;
    count: number;
    pct: number;
}

export interface DomainBand {
    name: string;
    avg: number;
    /** Upper bound of each of the five baremo bands, ascending. */
    bounds: number[];
}

export interface SVEData {
    org: {
        name: string;
        nit: string;
        psychologistName: string;
        psychologistLicense: string;
        tradeName: string | null;
        contactLine: string | null;
        dateStart: string;
        dateEnd: string;
        today: string;
        /** Workspace path of the logo asset, or null when there is none. */
        logoPath: string | null;
        /** Workspace path of the signature asset, or null when there is none. */
        signaturePath: string | null;
    };
    summary: {
        uniqueWorkers: number;
        totalAssessments: number;
        intraA: number;
        intraB: number;
        extra: number;
        stress: number;
        criticalPercent: number;
        needsSVE: boolean;
    };
    demographics: {
        gender: DemographicRow[];
        ageRanges: DemographicRow[];
        education: DemographicRow[];
        maritalStatus: DemographicRow[];
        contractType: DemographicRow[];
        workSchedule: DemographicRow[];
        seniority: DemographicRow[];
    };
    /** Percentages per risk level, keyed by level. */
    distributions: {
        intra: Record<string, number>;
        extra: Record<string, number>;
        stress: Record<string, number>;
    };
    counts: {
        intra: Record<string, number>;
        extra: Record<string, number>;
        stress: Record<string, number>;
    };
    groups: { a: number; b: number; c: number; d: number };
    /** 5x5 matrix: rows = intralaboral risk, cols = stress risk. */
    correlation: number[][];
    domains: { formA: DomainBand[]; formB: DomainBand[] };
    criticalDimensions: {
        name: string;
        questionnaire: string;
        avgScore: number;
        criticalPercent: number;
        count: number;
    }[];
    areas: { name: string; count: number; dist: Record<string, number> }[];
}

/** Internal: images are returned separately so the JSON payload stays small. */
export interface SVEAssets {
    logo: ReportImage | null;
    signature: ReportImage | null;
}

// ─── helpers ──────────────────────────────────────────────

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

const fmtDate = (t: number) =>
    new Date(t).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

const MAX_IMAGE_BYTES = 3_000_000;

/**
 * Accepted image types, mapped to the file extension the asset is exposed under.
 * Typst picks the decoder from the extension, not from the bytes, so a JPEG
 * written as "logo.png" fails the whole render — the extension has to match.
 */
const IMAGE_MIME_EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
};

/**
 * Remote hosts this server may fetch report imagery from.
 *
 * Empty by default, and that is deliberate. `logoUrl` is a free-text field the
 * psychologist edits in the branding form and it is stored unvalidated, so
 * fetching it server-side lets any registered user aim this server at internal
 * addresses. That is a server-side request forgery: the caller learns whether
 * the target responded (the PDF either embeds the bytes, or the render fails)
 * and so gets a reachability oracle for the private network. Everywhere else in
 * the app these URLs are handed to react-pdf's <Image src>, which resolves them
 * in the browser, so the server has no standing need to reach arbitrary hosts.
 *
 * Set REPORT_IMAGE_ALLOWED_HOSTS (comma-separated hostnames) only for hosts you
 * control, such as your own blob CDN.
 */
const ALLOWED_IMAGE_HOSTS = new Set(
    (process.env.REPORT_IMAGE_ALLOWED_HOSTS ?? "")
        .split(",")
        .map(h => h.trim().toLowerCase())
        .filter(Boolean)
);

/** An image accepted for embedding, with the extension Typst must see. */
export interface ReportImage {
    data: Buffer;
    ext: string;
}

function checkedImage(buf: Buffer, mime: string): ReportImage | null {
    const ext = IMAGE_MIME_EXT[mime.trim().toLowerCase()];
    if (!ext) return null;
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) return null;
    return { data: buf, ext };
}

/**
 * Resolves an image reference, or null if it is missing, malformed, oversized,
 * not an accepted image type, or points somewhere we refuse to fetch from.
 * Never throws: report generation must not fail over branding imagery.
 */
async function loadImage(ref: string | null | undefined): Promise<ReportImage | null> {
    if (!ref) return null;

    try {
        if (ref.startsWith("data:")) {
            const match = /^data:([^;,]+)(;[^,]*)?,([\s\S]*)$/.exec(ref);
            if (!match) return null;
            const [, mime, , payload] = match;
            return checkedImage(Buffer.from(payload, "base64"), mime);
        }

        // Anything that is not a data URI must clear the host allowlist.
        const url = new URL(ref);
        if (url.protocol !== "https:") return null;
        if (!ALLOWED_IMAGE_HOSTS.has(url.hostname.toLowerCase())) return null;

        // redirect:"error" stops an allowlisted host from bouncing us onto an
        // internal address.
        const res = await fetch(url, {
            redirect: "error",
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;

        const mime = (res.headers.get("content-type") ?? "").split(";")[0];
        return checkedImage(Buffer.from(await res.arrayBuffer()), mime);
    } catch {
        return null;
    }
}

// ─── main ─────────────────────────────────────────────────

export async function buildSVEData(
    orgId: string,
    userId: string,
    isAdmin: boolean
): Promise<{ data: SVEData; assets: SVEAssets } | null> {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { psychologist: { select: { id: true, fullName: true, licenseNumber: true } } }
    });

    if (!org || (org.createdByPsychologist !== userId && !isAdmin)) return null;

    const [assessments, settings, signature] = await Promise.all([
        prisma.assessment.findMany({
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
        }),
        prisma.psychologistSettings.findUnique({ where: { psychologistId: org.psychologist.id } }),
        prisma.psychologistSignature.findFirst({
            where: { psychologistId: org.psychologist.id },
            orderBy: { updatedAt: "desc" },
        }),
    ]);

    if (assessments.length === 0) return null;

    // ── splits ────────────────────────────────────────────
    const intraA = assessments.filter(a => a.questionnaireType === "INTRALABORAL" && a.formType === "A");
    const intraB = assessments.filter(a => a.questionnaireType === "INTRALABORAL" && a.formType === "B");
    const intra = assessments.filter(a => a.questionnaireType === "INTRALABORAL");
    const extra = assessments.filter(a => a.questionnaireType === "EXTRALABORAL");
    const stress = assessments.filter(a => a.questionnaireType === "STRESS");

    const countBy = (list: typeof assessments): Record<string, number> => {
        const c: Record<string, number> = {};
        RISK_ORDER.forEach(r => (c[r] = 0));
        list.forEach(a => {
            const r = a.scoredResult?.overallRiskCategory;
            if (r && r in c) c[r]++;
        });
        return c;
    };

    const toPct = (counts: Record<string, number>, total: number): Record<string, number> => {
        const p: Record<string, number> = {};
        const t = total || 1;
        RISK_ORDER.forEach(r => (p[r] = Math.round((counts[r] / t) * 100)));
        return p;
    };

    const cIntra = countBy(intra), cExtra = countBy(extra), cStress = countBy(stress);

    // ── per-worker risk, groups and correlation ───────────
    const workerRisk: Record<string, { intra?: string; stress?: string }> = {};
    assessments.forEach(a => {
        const w = (workerRisk[a.workerId] ??= {});
        const r = a.scoredResult?.overallRiskCategory ?? undefined;
        if (a.questionnaireType === "INTRALABORAL") w.intra = r;
        if (a.questionnaireType === "STRESS") w.stress = r;
    });

    const groups = { a: 0, b: 0, c: 0, d: 0 };
    const correlation: number[][] = RISK_ORDER.map(() => RISK_ORDER.map(() => 0));

    Object.values(workerRisk).forEach(w => {
        const iHigh = !!w.intra && HIGH_RISK.has(w.intra);
        const sHigh = !!w.stress && HIGH_RISK.has(w.stress);
        if (!iHigh && !sHigh) groups.a++;
        else if (!iHigh && sHigh) groups.b++;
        else if (iHigh && !sHigh) groups.c++;
        else groups.d++;

        if (w.intra && w.stress) {
            const ri = RISK_ORDER.indexOf(w.intra as RiskLevel);
            const rs = RISK_ORDER.indexOf(w.stress as RiskLevel);
            if (ri >= 0 && rs >= 0) correlation[ri][rs]++;
        }
    });

    // ── demographics (unique workers) ─────────────────────
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

    // ── dimensions and domains ────────────────────────────
    const dimMap: Record<string, { scores: number[]; risks: string[]; questionnaire: string }> = {};
    const domainMapA: Record<string, { sum: number; n: number }> = {};
    const domainMapB: Record<string, { sum: number; n: number }> = {};

    assessments.forEach(a => {
        const sr = a.scoredResult as {
            dimensionScores?: Record<string, unknown>;
            domainScores?: Record<string, unknown>;
        } | null;
        if (!sr) return;

        const qt = a.questionnaireType === "INTRALABORAL" ? "Intralaboral"
            : a.questionnaireType === "EXTRALABORAL" ? "Extralaboral" : "Estrés";

        if (sr.dimensionScores) {
            Object.values(sr.dimensionScores).forEach(raw => {
                const d = raw as { dimensionName?: string; dimensionKey?: string; transformedScore?: number; riskCategory?: string };
                const name = d.dimensionName || d.dimensionKey;
                if (!name) return;
                const key = `${name}__${qt}`;
                const entry = (dimMap[key] ??= { scores: [], risks: [], questionnaire: qt });
                if (typeof d.transformedScore === "number") entry.scores.push(d.transformedScore);
                if (d.riskCategory) entry.risks.push(d.riskCategory);
            });
        }

        if (sr.domainScores && a.questionnaireType === "INTRALABORAL") {
            const target = a.formType === "A" ? domainMapA : domainMapB;
            Object.values(sr.domainScores).forEach(raw => {
                const d = raw as { domainName?: string; domainKey?: string; transformedScore?: number };
                const name = d.domainName || d.domainKey;
                if (!name || typeof d.transformedScore !== "number") return;
                const e = (target[name] ??= { sum: 0, n: 0 });
                e.sum += d.transformedScore;
                e.n++;
            });
        }
    });

    const criticalDimensions = Object.entries(dimMap)
        .map(([key, d]) => {
            const avgScore = d.scores.length ? d.scores.reduce((s, v) => s + v, 0) / d.scores.length : 0;
            const critical = d.risks.filter(r => HIGH_RISK.has(r)).length;
            return {
                name: key.split("__")[0],
                questionnaire: d.questionnaire,
                avgScore: Number(avgScore.toFixed(1)),
                criticalPercent: d.risks.length ? Math.round((critical / d.risks.length) * 100) : 0,
                count: d.scores.length,
            };
        })
        .filter(d => d.criticalPercent > 0)
        .sort((a, b) => b.criticalPercent - a.criticalPercent || b.avgScore - a.avgScore);

    // Baremo band upper bounds per domain, used to draw the threshold scales.
    const baremos = getBaremos() as unknown as Record<string, { domains?: Record<string, Record<string, number[]>> }>;

    const boundsFor = (domainName: string, isFormA: boolean): number[] => {
        const formKey = isFormA ? "intralaboral_a" : "intralaboral_b";
        const domains = baremos[formKey]?.domains ?? {};
        const needle = domainName.toLowerCase();
        const key = Object.keys(domains).find(k => {
            const kNorm = k.replace(/_/g, " ");
            return needle.includes(kNorm) || kNorm.includes(needle.split(" ")[0]);
        });
        const d = key ? domains[key] : undefined;
        if (!d) return [20, 40, 60, 80, 100];
        return [d.sinRiesgo?.[1] ?? 20, d.bajo?.[1] ?? 40, d.medio?.[1] ?? 60, d.alto?.[1] ?? 80, d.muyAlto?.[1] ?? 100];
    };

    const formatDomains = (map: Record<string, { sum: number; n: number }>, isFormA: boolean): DomainBand[] =>
        Object.entries(map).map(([name, v]) => ({
            name,
            avg: Number((v.sum / v.n).toFixed(1)),
            bounds: boundsFor(name, isFormA),
        }));

    // ── areas ─────────────────────────────────────────────
    const areaGroups: Record<string, typeof assessments> = {};
    assessments.forEach(a => {
        const area = a.worker.departmentArea?.trim() || "General";
        (areaGroups[area] ??= []).push(a);
    });
    const areas = Object.entries(areaGroups)
        .map(([name, list]) => ({ name, count: list.length, dist: toPct(countBy(list), list.length) }))
        .sort((a, b) => b.count - a.count);

    // ── summary ───────────────────────────────────────────
    const allRisks = assessments.map(a => a.scoredResult?.overallRiskCategory).filter(Boolean) as string[];
    const criticalPercent = allRisks.length
        ? Math.round((allRisks.filter(r => HIGH_RISK.has(r)).length / allRisks.length) * 100)
        : 0;

    const dates = assessments.map(a => new Date(a.assessmentDate).getTime());

    const contactBits = [settings?.address, settings?.city, settings?.phone, settings?.email, settings?.website]
        .map(v => v?.trim())
        .filter(Boolean);

    // Signatures are usually stored inline as a data URI; imageUrl is the
    // fallback for uploaded files. Matches how the other report routes read it.
    const [logo, signatureImg] = await Promise.all([
        loadImage(settings?.logoUrl),
        loadImage(signature?.dataUrl ?? signature?.imageUrl),
    ]);

    const data: SVEData = {
        org: {
            name: org.name,
            nit: org.nit,
            psychologistName: org.psychologist.fullName,
            psychologistLicense: org.psychologist.licenseNumber,
            tradeName: settings?.tradeName?.trim() || settings?.consultingRoomName?.trim() || null,
            contactLine: contactBits.length ? contactBits.join(" · ") : null,
            dateStart: fmtDate(Math.min(...dates)),
            dateEnd: fmtDate(Math.max(...dates)),
            today: fmtDate(Date.now()),
            logoPath: logo ? `/assets/logo.${logo.ext}` : null,
            signaturePath: signatureImg ? `/assets/signature.${signatureImg.ext}` : null,
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
            intra: toPct(cIntra, intra.length),
            extra: toPct(cExtra, extra.length),
            stress: toPct(cStress, stress.length),
        },
        counts: { intra: cIntra, extra: cExtra, stress: cStress },
        groups,
        correlation,
        domains: {
            formA: formatDomains(domainMapA, true),
            formB: formatDomains(domainMapB, false),
        },
        criticalDimensions,
        areas,
    };

    return { data, assets: { logo, signature: signatureImg } };
}
