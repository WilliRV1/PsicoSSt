import { prisma } from "@/lib/prisma";
import { loadImage, type ReportImage } from "./images";
import { RISK_LABEL, RISK_ORDER, type RiskLevel } from "./battery-content";

/**
 * Plan de intervención de factores de riesgo psicosocial.
 *
 * Es el documento de seguimiento: qué se acordó hacer, quién responde, para
 * cuándo y en qué estado va. La Resolución 2764 de 2022 exige que las acciones
 * derivadas del diagnóstico queden documentadas con responsable y fecha, de
 * modo que el valor del informe está en el estado de avance, no en el listado.
 */

export type ActionStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export const STATUS_LABEL: Record<ActionStatus, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En ejecución",
    DONE: "Cumplida",
    CANCELLED: "Cancelada",
};

export interface PlanAction {
    measure: string;
    responsible: string;
    dueDate: string | null;
    /** Días de retraso; cero o menos significa que aún está en plazo. */
    overdueDays: number;
    status: ActionStatus;
    statusLabel: string;
    riskCategory: RiskLevel | null;
    riskLabel: string | null;
    area: string | null;
    notes: string | null;
}

export interface InterventionData {
    org: { name: string; nit: string; city: string | null; today: string };
    brand: { tradeName: string | null; contactLine: string | null; logoPath: string | null };
    professional: { name: string; license: string; signaturePath: string | null };
    plan: { title: string; period: string; status: string; createdAt: string };
    summary: {
        total: number;
        byStatus: { status: ActionStatus; label: string; count: number }[];
        /** Acciones cumplidas sobre las que no fueron canceladas. */
        completionPercent: number;
        overdue: number;
        unscheduled: number;
    };
    /** Acciones agrupadas por nivel de riesgo que las originó. */
    groups: { key: string; label: string; actions: PlanAction[] }[];
    areas: { name: string; total: number; done: number }[];
}

export interface InterventionAssets {
    logo: ReportImage | null;
    signature: ReportImage | null;
}

const fmtDate = (d: Date) =>
    d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

const PLAN_STATUS_LABEL: Record<string, string> = {
    ACTIVE: "Activo",
    COMPLETED: "Cerrado",
    ARCHIVED: "Archivado",
};

function asRisk(v: string | null): RiskLevel | null {
    return RISK_ORDER.includes(v as RiskLevel) ? (v as RiskLevel) : null;
}

export async function buildInterventionData(
    orgId: string,
    psychologistId: string,
    isAdmin: boolean
): Promise<{ data: InterventionData; assets: InterventionAssets } | null> {
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

    const plan = await prisma.interventionPlan.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        include: { actions: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] } },
    });

    if (!plan) return null;

    // Medianoche local: una acción que vence hoy no está vencida.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const actions: PlanAction[] = plan.actions.map(a => {
        const due = a.dueDate ? new Date(a.dueDate) : null;
        const risk = asRisk(a.riskCategory);
        const open = a.status === "PENDING" || a.status === "IN_PROGRESS";
        return {
            measure: a.measure.trim(),
            responsible: a.responsible.trim() || "Sin asignar",
            dueDate: due ? fmtDate(due) : null,
            // Sólo tiene sentido para lo que sigue abierto: una acción cumplida
            // fuera de plazo ya no es una alerta de gestión.
            overdueDays:
                due && open ? Math.floor((today.getTime() - due.getTime()) / 86_400_000) : 0,
            status: a.status as ActionStatus,
            statusLabel: STATUS_LABEL[a.status as ActionStatus] ?? a.status,
            riskCategory: risk,
            riskLabel: risk ? RISK_LABEL[risk] : null,
            area: a.area?.trim() || null,
            notes: a.notes?.trim() || null,
        };
    });

    // ── resumen ───────────────────────────────────────────
    const order: ActionStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"];
    const byStatus = order
        .map(status => ({
            status,
            label: STATUS_LABEL[status],
            count: actions.filter(a => a.status === status).length,
        }))
        .filter(s => s.count > 0);

    // Las canceladas salen del denominador: una acción que se decidió no hacer
    // no es un incumplimiento, y dejarla dentro haría que cancelar acciones
    // empeorara el porcentaje de avance.
    const applicable = actions.filter(a => a.status !== "CANCELLED");
    const done = applicable.filter(a => a.status === "DONE").length;

    // ── agrupación por riesgo de origen ───────────────────
    const groups: InterventionData["groups"] = [];
    for (const level of [...RISK_ORDER].reverse()) {
        const list = actions.filter(a => a.riskCategory === level);
        if (list.length > 0) {
            groups.push({ key: level, label: `Riesgo ${RISK_LABEL[level].toLowerCase()}`, actions: list });
        }
    }
    const unclassified = actions.filter(a => a.riskCategory === null);
    if (unclassified.length > 0) {
        groups.push({ key: "SIN_CLASIFICAR", label: "Sin nivel de riesgo asociado", actions: unclassified });
    }

    // ── avance por área ───────────────────────────────────
    const areaMap = new Map<string, { total: number; done: number }>();
    for (const a of actions) {
        if (a.status === "CANCELLED") continue;
        const name = a.area ?? "Sin área asignada";
        const e = areaMap.get(name) ?? { total: 0, done: 0 };
        e.total++;
        if (a.status === "DONE") e.done++;
        areaMap.set(name, e);
    }
    const areas = [...areaMap.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "es"));

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
            org: { name: org.name, nit: org.nit, city: org.city, today: fmtDate(new Date()) },
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
            plan: {
                title: plan.title,
                period: plan.period,
                status: PLAN_STATUS_LABEL[plan.status] ?? plan.status,
                createdAt: fmtDate(new Date(plan.createdAt)),
            },
            summary: {
                total: actions.length,
                byStatus,
                completionPercent: applicable.length
                    ? Math.round((done / applicable.length) * 100)
                    : 0,
                overdue: actions.filter(a => a.overdueDays > 0).length,
                unscheduled: actions.filter(a => a.dueDate === null && a.status !== "CANCELLED")
                    .length,
            },
            groups,
            areas,
        },
        assets: { logo, signature },
    };
}
