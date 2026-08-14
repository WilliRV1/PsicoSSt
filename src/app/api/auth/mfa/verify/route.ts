import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTOTPCode } from "@/lib/auth/mfa";
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

        // Get MFA secret
        const psychologist = await prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: { mfaSecret: true, mfaEnabled: true },
        });

        if (!psychologist?.mfaSecret) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", message: "Primero debes configurar MFA" },
                { status: 400 }
            );
        }

        // Verify code
        const isValid = verifyTOTPCode(psychologist.mfaSecret, code);
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

        // If MFA is not yet enabled, this is the first verification → enable it
        if (!psychologist.mfaEnabled) {
            await prisma.psychologist.update({
                where: { id: session.user.id },
                data: { mfaEnabled: true },
            });

            const { ipAddress, userAgent } = extractRequestMeta(request);
            await logAudit({
                userId: session.user.id,
                action: "MFA_SETUP",
                resourceType: "psychologist",
                resourceId: session.user.id,
                metadata: { reason: "MFA enabled" },
                ipAddress,
                userAgent,
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
