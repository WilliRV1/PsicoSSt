/**
 * Identidad del Responsable del Tratamiento.
 *
 * La Ley 1581/2012 exige que la política y el aviso de privacidad identifiquen
 * al responsable (razón social, NIT, dirección, canal de atención). Mientras
 * esos datos no existan, la política publicada es un borrador y el registro de
 * nuevas cuentas se bloquea en producción: recoger datos sensibles de salud sin
 * responsable identificado invalida la autorización del titular.
 */

export interface LegalIdentity {
    legalName: string;
    nit: string;
    address: string;
    city: string;
    email: string;
}

const PLACEHOLDER = "";

export const LEGAL_IDENTITY: LegalIdentity = {
    legalName: process.env.RESPONSABLE_NOMBRE?.trim() || PLACEHOLDER,
    nit: process.env.RESPONSABLE_NIT?.trim() || PLACEHOLDER,
    address: process.env.RESPONSABLE_DIRECCION?.trim() || PLACEHOLDER,
    city: process.env.RESPONSABLE_CIUDAD?.trim() || PLACEHOLDER,
    email: process.env.RESPONSABLE_EMAIL?.trim() || PLACEHOLDER,
};

export function missingLegalFields(): (keyof LegalIdentity)[] {
    return (Object.keys(LEGAL_IDENTITY) as (keyof LegalIdentity)[]).filter(
        (k) => !LEGAL_IDENTITY[k]
    );
}

export function isLegalIdentityComplete(): boolean {
    return missingLegalFields().length === 0;
}

/** Valor para mostrar; en desarrollo se ve el marcador, no una cadena vacía. */
export function legalField(key: keyof LegalIdentity): string {
    return LEGAL_IDENTITY[key] || `[${key.toUpperCase()} SIN CONFIGURAR]`;
}

/**
 * En producción no puede abrirse una cuenta —ni, por tanto, recogerse datos de
 * trabajadores— sin responsable identificado. En desarrollo sólo se advierte.
 */
export function assertLegalIdentityForSignup(): { ok: true } | { ok: false; missing: string[] } {
    if (process.env.NODE_ENV !== "production" || isLegalIdentityComplete()) return { ok: true };
    return { ok: false, missing: missingLegalFields() };
}
