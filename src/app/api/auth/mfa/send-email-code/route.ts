import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmailCode } from "@/lib/auth/mfa";
import { sendEmail } from "@/lib/email/resend";
import { mfaEmailCodeEmail } from "@/lib/email/templates";

const RESEND_COOLDOWN_MS = 30 * 1000;

/**
 * Reenvía el código de verificación por correo — usado en el login (si el
 * primer envío se perdió) y en la configuración inicial de MFA por correo.
 */
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autenticado" }, { status: 401 });
        }

        const psychologist = await prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: { email: true, fullName: true, mfaEmailCodeExpiresAt: true },
        });
        if (!psychologist) {
            return NextResponse.json({ error: "NOT_FOUND", message: "Usuario no encontrado" }, { status: 404 });
        }

        // El código dura 10 minutos; solo bloqueamos el reenvío inmediato
        // (menos de 30s desde que se generó) para evitar abuso del correo.
        if (psychologist.mfaEmailCodeExpiresAt) {
            const generatedAt = psychologist.mfaEmailCodeExpiresAt.getTime() - 10 * 60 * 1000;
            if (Date.now() - generatedAt < RESEND_COOLDOWN_MS) {
                return NextResponse.json(
                    { error: "RATE_LIMITED", message: "Espera unos segundos antes de pedir otro código." },
                    { status: 429 }
                );
            }
        }

        const { code, codeHash, expiresAt } = generateEmailCode();
        await prisma.psychologist.update({
            where: { id: session.user.id },
            data: { mfaEmailCodeHash: codeHash, mfaEmailCodeExpiresAt: expiresAt },
        });

        const template = mfaEmailCodeEmail(psychologist.fullName, code);
        await sendEmail({ to: psychologist.email, ...template });

        return NextResponse.json({ sent: true });
    } catch (error) {
        console.error("[MFA_SEND_EMAIL_CODE] Error:", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error interno del servidor" }, { status: 500 });
    }
}
