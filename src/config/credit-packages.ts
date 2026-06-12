export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    priceCOP: number;
    pricePerCredit: number;
    discount: number; // percentage vs base price
    popular?: boolean;
}

const BASE_PRICE = 3000; // base price per credit in COP (starter tier)

export const CREDIT_PACKAGES: CreditPackage[] = [
    {
        id: "starter",
        name: "Starter",
        credits: 20,
        priceCOP: 60000,
        pricePerCredit: 3000,
        discount: 0,
    },
    {
        id: "profesional",
        name: "Profesional",
        credits: 50,
        priceCOP: 125000,
        pricePerCredit: 2500,
        discount: 17,
    },
    {
        id: "business",
        name: "Business",
        credits: 100,
        priceCOP: 200000,
        pricePerCredit: 2000,
        discount: 33,
        popular: true,
    },
    {
        id: "enterprise",
        name: "Enterprise",
        credits: 500,
        priceCOP: 750000,
        pricePerCredit: 1500,
        discount: 50,
    },
    {
        id: "corporativo",
        name: "Corporativo",
        credits: 1000,
        priceCOP: 1200000,
        pricePerCredit: 1200,
        discount: 60,
    },
];

export const TRIAL_CREDITS = 5;

export function getPackageById(id: string): CreditPackage | undefined {
    return CREDIT_PACKAGES.find((p) => p.id === id);
}

export function formatCOP(amount: number): string {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
