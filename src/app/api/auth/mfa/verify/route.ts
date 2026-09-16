import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTOTPCode, verifyEmailCode } from "@/lib/auth/mfa";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";
import {
    isAccountLocked,
    incrementFailedAttempts,
    resetFailedAttempts,
} from "@/lib/auth/lockout";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: "No autenticado" },
                { status: 401 }
            );
        }

        // Reuse the same lockout mechanism as login (5 attempts → 15 min lockout).
        const locked = await isAccountLocked(session.user.id);
        if (locked) {
            return NextResponse.json(
                { error: "ACCOUNT_LOCKED", message: "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { code } = body;

        if (!code || typeof code !== "string" || code.length !== 6) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", message: "Código de 6 dígitos requerido" },
                { status: 400 }
            );
        }

        // Get MFA config
        const psychologist = await prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: {
                mfaSecret: true,
                mfaEnabled: true,
                mfaMethod: true,
                mfaEmailCodeHash: true,
                mfaEmailCodeExpiresAt: true,
            },
        });

        if (!psychologist) {
            return NextResponse.json({ error: "NOT_FOUND", message: "Usuario no encontrado" }, { status: 404 });
        }

        const isValid =
            psychologist.mfaMethod === "EMAIL"
                ? verifyEmailCode(code, psychologist.mfaEmailCodeHash, psychologist.mfaEmailCodeExpiresAt)
                : psychologist.mfaSecret
                ? verifyTOTPCode(psychologist.mfaSecret, code)
                : false;

        if (!psychologist.mfaSecret && psychologist.mfaMethod === "TOTP") {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", message: "Primero debes configurar MFA" },
                { status: 400 }
            );
        }

        if (!isValid) {
            const { locked: nowLocked, attemptsRemaining } =
                await incrementFailedAttempts(session.user.id);

            if (nowLocked) {
                return NextResponse.json(
                    { error: "ACCOUNT_LOCKED", message: "Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos." },
                    { status: 429 }
                );
            }

            return NextResponse.json(
                {
                    error: "VALIDATION_ERROR",
                    message: `Código inválido. Te quedan ${attemptsRemaining} intento${attemptsRemaining !== 1 ? "s" : ""}.`,
                },
                { status: 400 }
            );
        }

        // Valid code — reset failed attempts counter
        await resetFailedAttempts(session.user.id);

        // Un código de correo es de un solo uso: se invalida se haya usado
        // para activar MFA o para un login normal.
        const clearEmailCode =
            psychologist.mfaMethod === "EMAIL" ? { mfaEmailCodeHash: null, mfaEmailCodeExpiresAt: null } : {};

        // mfaVerifiedAt es la única prueba que el callback jwt acepta de que
        // el segundo factor se cumplió — se escribe solo aquí, después de
        // validar un código real contra la base de datos. El cliente nunca
        // puede poner esto directamente vía /api/auth/session.
        const mfaVerifiedAt = new Date();

        // If MFA is not yet enabled, this is the first verification → enable it
        if (!psychologist.mfaEnabled) {
            await prisma.psychologist.update({
                where: { id: session.user.id },
                data: { mfaEnabled: true, mfaVerifiedAt, ...clearEmailCode },
            });

            const { ipAddress, userAgent } = extractRequestMeta(request);
            await logAudit({
                userId: session.user.id,
                action: "MFA_SETUP",
                resourceType: "psychologist",
                resourceId: session.user.id,
                metadata: { reason: `MFA enabled (${psychologist.mfaMethod})` },
                ipAddress,
                userAgent,
            });
        } else {
            await prisma.psychologist.update({
                where: { id: session.user.id },
                data: { mfaVerifiedAt, ...clearEmailCode },
            });
        }

        // Return verified status — client-side will handle session update via next-auth
        return NextResponse.json({
            verified: true,
            mfaEnabled: true,
            message: psychologist.mfaEnabled
                ? "Verificación MFA exitosa"
                : "MFA habilitado y verificado exitosamente",
        });
    } catch (error) {
        console.error("[MFA_VERIFY] Error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
