/**
 * Catálogo comercial: planes de suscripción y SKUs comprables.
 *
 * El cobro dejó de ser «por batería aplicada» (la Res. 2764/2022 art. 4 par.
 * reserva la aplicación virtual a la herramienta estatal y sanciona su
 * comercialización) y pasó a ser una suscripción anual del psicólogo. La
 * unidad de consumo es el TRABAJADOR GESTIONADO por instrumento y periodo, no
 * el cuestionario.
 *
 * Todo SKU es estructuralmente compatible con el antiguo `CreditPackage`:
 * `PaymentService`, `validateApprovedPayment` y `reverseInTx` siguen leyendo
 * `id`, `credits`, `priceCOP`, `name` sin cambios. El cupo del plan se otorga
 * como créditos con vencimiento, así que la pasarela ya verificada no cambia.
 */

export type PlanId = "RESIDENTE" | "PROFESIONAL";
export type SkuKind = "plan" | "credits" | "feature";

export interface Sku {
    id: string;
    kind: SkuKind;
    name: string;
    /** Unidades (trabajadores gestionados) que otorga. 0 en features. */
    credits: number;
    priceCOP: number;
    pricePerCredit: number;
    discount: number;
    popular?: boolean;
    /** Sólo kind = "plan". */
    plan?: PlanId;
    periodDays?: number;
    /** Sólo kind = "feature". */
    feature?: string;
    featureDays?: number;
    /** Paquetes del modelo anterior: ya no se venden, pero una orden en vuelo
     *  debe poder acreditarse. */
    legacy?: boolean;
}

/** Alias de compatibilidad para quien aún importa el tipo viejo. */
export type CreditPackage = Sku;

export interface PlanDefinition {
    id: PlanId;
    name: string;
    tagline: string;
    priceCOP: number;
    periodDays: number;
    /** Unidades incluidas por periodo. */
    quota: number;
    /** null = ilimitadas. */
    orgLimit: number | null;
    /** Informes con marca PsicoSST y marca de agua BORRADOR, sin firma. */
    draftReports: boolean;
    /** SKU que compra o renueva el plan. Residente no se compra. */
    sku: string | null;
    features: string[];
}

export const TRIAL_DAYS = 30;

export const PLANS: Record<PlanId, PlanDefinition> = {
    RESIDENTE: {
        id: "RESIDENTE",
        name: "Residente",
        tagline: "Para conocer la plataforma",
        priceCOP: 0,
        periodDays: TRIAL_DAYS,
        quota: 5,
        orgLimit: 1,
        draftReports: true,
        sku: null,
        features: [
            "1 empresa activa",
            "5 trabajadores gestionados",
            "Informes en borrador con marca PsicoSST",
            `${TRIAL_DAYS} días`,
        ],
    },
    PROFESIONAL: {
        id: "PROFESIONAL",
        name: "Profesional",
        tagline: "Para el psicólogo SST que atiende varias empresas",
        priceCOP: 890_000,
        periodDays: 365,
        quota: 60,
        orgLimit: null,
        draftReports: false,
        sku: "PROFESIONAL_YEAR",
        features: [
            "Empresas ilimitadas",
            "60 trabajadores gestionados al año",
            "Informes firmables, sin marca PsicoSST",
            "Plan de intervención, SVE y tablero de cumplimiento",
            "Custodia documental por 20 años",
        ],
    },
};

const BASE_UNIT_PRICE = 2_500;

function unit(id: string, name: string, credits: number, priceCOP: number, popular = false): Sku {
    const pricePerCredit = Math.round(priceCOP / credits);
    return {
        id,
        kind: "credits",
        name,
        credits,
        priceCOP,
        pricePerCredit,
        discount: Math.max(0, Math.round((1 - pricePerCredit / BASE_UNIT_PRICE) * 100)),
        popular,
    };
}

export const SKUS: Sku[] = [
    {
        id: "PROFESIONAL_YEAR",
        kind: "plan",
        plan: "PROFESIONAL",
        periodDays: PLANS.PROFESIONAL.periodDays,
        name: "Plan Profesional · 1 año",
        credits: PLANS.PROFESIONAL.quota,
        priceCOP: PLANS.PROFESIONAL.priceCOP,
        pricePerCredit: 0,
        discount: 0,
        popular: true,
    },
    unit("OVERAGE_10", "10 trabajadores adicionales", 10, 25_000),
    unit("OVERAGE_50", "50 trabajadores adicionales", 50, 75_000),
    unit("CLIMA_10", "Clima organizacional · 10 trabajadores", 10, 30_000),
    {
        id: "ISO45003_YEAR",
        kind: "feature",
        feature: "ISO45003",
        featureDays: 365,
        name: "Módulo ISO 45003 / salud mental · 1 año",
        credits: 0,
        priceCOP: 490_000,
        pricePerCredit: 0,
        discount: 0,
    },
    {
        id: "INFORME_EJECUTIVO",
        kind: "feature",
        feature: "INFORME_EJECUTIVO",
        name: "Informe ejecutivo con benchmark sectorial",
        credits: 0,
        priceCOP: 290_000,
        pricePerCredit: 0,
        discount: 0,
    },

    // ── Paquetes del modelo anterior: sólo para acreditar órdenes en vuelo ──
    { ...unit("starter", "Starter", 20, 60_000), legacy: true },
    { ...unit("profesional", "Profesional (paquete)", 50, 125_000), legacy: true },
    { ...unit("business", "Business", 100, 200_000), legacy: true },
    { ...unit("enterprise", "Enterprise", 500, 750_000), legacy: true },
    { ...unit("corporativo", "Corporativo", 1000, 1_200_000), legacy: true },
];

/** SKUs que se muestran para la venta (excluye los heredados). */
export const PURCHASABLE_SKUS: Sku[] = SKUS.filter((s) => !s.legacy);

export function getSkuById(id: string): Sku | undefined {
    return SKUS.find((s) => s.id === id);
}

/** Alias de compatibilidad: `PaymentService` y la acreditación usan este nombre. */
export const getPackageById = getSkuById;

export function getPlan(id: PlanId): PlanDefinition {
    return PLANS[id];
}

export function formatCOP(amount: number): string {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
