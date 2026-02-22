import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

/**
 * Hash a password with bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Verify a password against a bcrypt hash.
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Password strength rules per COMPLIANCE.md:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 12)
        errors.push("La contraseña debe tener al menos 12 caracteres");
    if (!/[A-Z]/.test(password))
        errors.push("Debe contener al menos una letra mayúscula");
    if (!/[a-z]/.test(password))
        errors.push("Debe contener al menos una letra minúscula");
    if (!/[0-9]/.test(password))
        errors.push("Debe contener al menos un número");
    if (!/[^A-Za-z0-9]/.test(password))
        errors.push("Debe contener al menos un carácter especial (!@#$%...)");

    return { valid: errors.length === 0, errors };
}
