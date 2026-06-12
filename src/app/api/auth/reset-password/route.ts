import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";

export async function POST(request: Request) {
    try {
        const { email, code, newPassword } = await request.json();

        if (!email || !code || !newPassword) {
            return NextResponse.json(
                { error: "Todos los campos son obligatorios" },
                { status: 400 }
            );
        }

        // Validate new password strength
        const passwordCheck = validatePasswordStrength(newPassword);
        if (!passwordCheck.valid) {
            return NextResponse.json(
                { error: "Contraseña débil", details: passwordCheck.errors },
                { status: 400 }
            );
        }

        const psychologist = await prisma.psychologist.findUnique({
            where: { email },
            select: { id: true },
        });

        if (!psychologist) {
            return NextResponse.json(
                { error: "Código inválido o expirado" },
                { status: 400 }
            );
        }

        // Find latest valid (non-used, non-expired) token
        const token = await prisma.passwordResetToken.findFirst({
            where: {
                psychologistId: psychologist.id,
                used: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!token) {
            return NextResponse.json(
                { error: "Código inválido o expirado" },
                { status: 400 }
            );
        }

        // Check max attempts
        if (token.attempts >= 3) {
            await prisma.passwordResetToken.update({
                where: { id: token.id },
                data: { used: true },
            });
            return NextResponse.json(
                { error: "Demasiados intentos. Solicita un nuevo código." },
                { status: 400 }
            );
        }

        // Verify code
        const isValid = await verifyPassword(code, token.codeHash);

        if (!isValid) {
            await prisma.passwordResetToken.update({
                where: { id: token.id },
                data: { attempts: { increment: 1 } },
            });

            const remaining = 2 - token.attempts;
            return NextResponse.json(
                {
                    error: `Código incorrecto. ${remaining > 0 ? `Te quedan ${remaining} intento${remaining > 1 ? "s" : ""}.` : "Solicita un nuevo código."}`,
                },
                { status: 400 }
            );
        }

        // Code is valid — update password and mark token as used
        const newHash = await hashPassword(newPassword);

        await prisma.$transaction([
            prisma.psychologist.update({
                where: { id: psychologist.id },
                data: { passwordHash: newHash },
            }),
            prisma.passwordResetToken.update({
                where: { id: token.id },
                data: { used: true },
            }),
        ]);

        return NextResponse.json({
            message: "Contraseña actualizada exitosamente. Ya puedes iniciar sesión.",
        });
    } catch (error) {
        console.error("[RESET-PASSWORD] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
