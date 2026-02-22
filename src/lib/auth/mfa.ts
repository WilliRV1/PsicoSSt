import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";

const ISSUER = "PsicoSST";
const PERIOD = 30;
const DIGITS = 6;
const ALGORITHM = "SHA1";

/**
 * Generate a new TOTP secret for MFA setup.
 * Returns the base32-encoded secret and the otpauth:// URI.
 */
export function generateTOTPSecret(accountEmail: string): {
    secret: string;
    uri: string;
} {
    const secret = new Secret({ size: 20 });

    const totp = new TOTP({
        issuer: ISSUER,
        label: accountEmail,
        algorithm: ALGORITHM,
        digits: DIGITS,
        period: PERIOD,
        secret,
    });

    return {
        secret: secret.base32,
        uri: totp.toString(),
    };
}

/**
 * Verify a TOTP code against a secret.
 * Allows a ±1 window (30s before/after) to account for clock drift.
 */
export function verifyTOTPCode(secret: string, code: string): boolean {
    const totp = new TOTP({
        issuer: ISSUER,
        algorithm: ALGORITHM,
        digits: DIGITS,
        period: PERIOD,
        secret: Secret.fromBase32(secret),
    });

    // delta is null if invalid, or the time step difference if valid
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
}

/**
 * Generate a QR code data URL for the given otpauth URI.
 * Returns a base64-encoded PNG image that can be displayed in an <img> tag.
 */
export async function generateQRCodeDataURL(uri: string): Promise<string> {
    return QRCode.toDataURL(uri, {
        width: 256,
        margin: 2,
        color: {
            dark: "#1a1a2e",
            light: "#ffffff",
        },
    });
}
