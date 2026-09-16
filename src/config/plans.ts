/**
 * Catálogo comercial: planes de suscripción y SKUs comprables.
 *
 * El cobro dejó de ser «por batería aplicada» (la Res. 2764/2022 art. 4 par.
 * reserva la aplicación virtual a la herramienta estatal y sanciona su
 * comercialización) y pasó a ser una suscripción del psicólogo. La unidad de
 * consumo es el TRABAJADOR GESTIONADO por instrumento y periodo, no el
 * cuestionario.
 *
 * `PlanDefinition` describe el TIER (qué puede hacer la cuenta: cuántas
 * empresas, si firma, si importa, si usa clima) y es independiente de la
 * CADENCIA con la que se paga. `Sku` describe lo que realmente se compra:
 * un tier a un precio y un cupo para un número de días concreto. Un mismo
 * tier tiene un SKU anual y uno mensual; `Subscription.activateInTx` toma el
 * cupo y la duración del SKU comprado, nunca del tier — así el mismo Profesional
 * puede venderse anual o mensual sin que el tier tenga que "saber" de precios.
 *
 * `PaymentService`, `validateApprovedPayment` y `reverseInTx` siguen leyendo
 * `id`, `credits`, `priceCOP`, `name` sin cambios: la pasarela de pago único
 * ya verificada no se toca.
 */

export type PlanId = "RESIDENTE" | "STARTER" | "PROFESIONAL" | "AVANZADO";
export type BillingPeriod = "MONTHLY" | "ANNUAL";
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
    /** Sólo kind = "plan". Determina el pie del SKU y cómo se muestra. */
    billingPeriod?: BillingPeriod;
    /**
     * Duración real del periodo que este SKU compra. En los SKU de plan es
     * la fuente de verdad que lee `SubscriptionService.activateInTx` — NO
     * `PlanDefinition`, que ya no tiene cupo ni duración propios.
     */
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
    /** null = ilimitadas. */
    orgLimit: number | null;
    /** Informes con marca PsicoSST y marca de agua BORRADOR, sin firma. */
    draftReports: boolean;
    /** Importar resultados ya calificados (SIRPSI u otra herramienta). */
    canImport: boolean;
    /** Usar el instrumento de clima organizacional (no normativo). */
    canUseClima: boolean;
    /**
     * Precio y cupo ANUAL de referencia, sólo para mercadeo (landing,
     * /pricing) y como cupo por defecto de una cortesía de administrador sin
     * SKU asociado. La activación real de una suscripción SIEMPRE lee del
     * SKU comprado, nunca de aquí.
     */
    annualPriceCOP: number;
    annualQuota: number;
    features: string[];
}

export const TRIAL_DAYS = 30;
const ANNUAL_DAYS = 365;
const MONTHLY_DAYS = 30;

export const PLANS: Record<PlanId, PlanDefinition> = {
    RESIDENTE: {
        id: "RESIDENTE",
        name: "Residente",
        tagline: "Para conocer la plataforma",
        orgLimit: 1,
        draftReports: true,
        canImport: false,
        canUseClima: false,
        annualPriceCOP: 0,
        annualQuota: 5,
        features: [
            "1 empresa activa",
            "5 trabajadores gestionados",
            "Informes en borrador con marca PsicoSST",
            `${TRIAL_DAYS} días`,
        ],
    },
    STARTER: {
        id: "STARTER",
        name: "Starter",
        tagline: "Para empezar a cobrar tu práctica",
        orgLimit: 5,
        draftReports: false,
        canImport: true,
        canUseClima: false,
        annualPriceCOP: 630_000,
        annualQuota: 30,
        features: [
            "Hasta 5 empresas",
            "30 trabajadores gestionados al año",
            "Informes firmables, sin marca PsicoSST",
            "Importación de resultados de SIRPSI",
        ],
    },
    PROFESIONAL: {
        id: "PROFESIONAL",
        name: "Profesional",
        tagline: "Para el psicólogo que atiende varias empresas",
        orgLimit: null,
        draftReports: false,
        canImport: true,
        canUseClima: true,
        annualPriceCOP: 1_050_000,
        annualQuota: 80,
        features: [
            "Empresas ilimitadas",
            "80 trabajadores gestionados al año",
            "Importación de resultados de SIRPSI",
            "Clima organizacional",
            "Plan de intervención, SVE y tablero de cumplimiento",
            "Custodia documental por 20 años",
        ],
    },
    AVANZADO: {
        id: "AVANZADO",
        name: "Avanzado",
        tagline: "Para el volumen de una consultoría",
        orgLimit: null,
        draftReports: false,
        canImport: true,
        canUseClima: true,
        annualPriceCOP: 2_100_000,
        annualQuota: 200,
        features: [
            "Todo lo del plan Profesional",
            "200 trabajadores gestionados al año",
            "Pensado para quien atiende varias empresas grandes a la vez",
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

/**
 * Par de SKUs (anual + mensual) para un tier pagado.
 *
 * El mensual NO es 1/12 del anual: lleva ~30% de recargo y un cupo mensual
 * redondeado hacia abajo, de modo que pagar mes a mes sea siempre más caro en
 * total que comprometerse un año — es lo que hace que el anual sea la opción
 * por defecto y no sólo una alternativa más.
 *
 * Los precios mensuales son literales, no derivados por fórmula: redondear un
 * 30% de un valor en pesos da resultados distintos según el método de
 * redondeo (con `Math.round` el de Avanzado cae en $228.000, con `Math.floor`
 * el de Profesional cae en $113.000). Es mejor fijar el número exacto una vez
 * que dejar que un empate de redondeo lo decida.
 */
function planSkuPair(
    plan: PlanId,
    annual: { priceCOP: number; quota: number },
    monthly: { priceCOP: number; quota: number },
    popular = false
): [Sku, Sku] {
    const def = PLANS[plan];
    const annualSku: Sku = {
        id: `${plan}_YEAR`,
        kind: "plan",
        plan,
        billingPeriod: "ANNUAL",
        periodDays: ANNUAL_DAYS,
        name: `Plan ${def.name} · 1 año`,
        credits: annual.quota,
        priceCOP: annual.priceCOP,
        pricePerCredit: Math.round(annual.priceCOP / annual.quota),
        discount: 0,
        popular,
    };
    const monthlySku: Sku = {
        id: `${plan}_MONTH`,
        kind: "plan",
        plan,
        billingPeriod: "MONTHLY",
        periodDays: MONTHLY_DAYS,
        name: `Plan ${def.name} · mensual`,
        credits: monthly.quota,
        priceCOP: monthly.priceCOP,
        pricePerCredit: Math.round(monthly.priceCOP / monthly.quota),
        discount: 0,
    };
    return [annualSku, monthlySku];
}

const [STARTER_YEAR, STARTER_MONTH] = planSkuPair(
    "STARTER",
    { priceCOP: 630_000, quota: 30 },
    { priceCOP: 68_000, quota: 2 }
);
const [PROFESIONAL_YEAR, PROFESIONAL_MONTH] = planSkuPair(
    "PROFESIONAL",
    { priceCOP: 1_050_000, quota: 80 },
    { priceCOP: 114_000, quota: 6 },
    true
);
const [AVANZADO_YEAR, AVANZADO_MONTH] = planSkuPair(
    "AVANZADO",
    { priceCOP: 2_100_000, quota: 200 },
    { priceCOP: 227_000, quota: 16 }
);

export const SKUS: Sku[] = [
    STARTER_YEAR,
    STARTER_MONTH,
    PROFESIONAL_YEAR,
    PROFESIONAL_MONTH,
    AVANZADO_YEAR,
    AVANZADO_MONTH,

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
    { ...unit("starter", "Starter (paquete antiguo)", 20, 60_000), legacy: true },
    { ...unit("profesional", "Profesional (paquete antiguo)", 50, 125_000), legacy: true },
    { ...unit("business", "Business", 100, 200_000), legacy: true },
    { ...unit("enterprise", "Enterprise", 500, 750_000), legacy: true },
    { ...unit("corporativo", "Corporativo", 1000, 1_200_000), legacy: true },
];

/** SKUs que se muestran para la venta (excluye los heredados). */
export const PURCHASABLE_SKUS: Sku[] = SKUS.filter((s) => !s.legacy);

/** Los 3 tiers pagados, en orden de presentación. */
export const PAID_PLAN_IDS: PlanId[] = ["STARTER", "PROFESIONAL", "AVANZADO"];

/** SKU de plan para un tier y una cadencia. */
export function planSkuFor(plan: PlanId, period: BillingPeriod): Sku | undefined {
    return SKUS.find((s) => s.kind === "plan" && s.plan === plan && s.billingPeriod === period);
}

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
